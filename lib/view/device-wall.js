/**
 * Device Wall: a set of device-sized views on a zoomable view
 */
'use strict';

import View from './view';
import tween from '../tween';
import mountAll from './assets/mount';
import viewSync from '../controller/view-sync';
import wallController from '../controller/wall';
import {createElement, removeElement, setStyle, testProp, debounce, measureScrollWidth} from '../utils';

const area = spec => spec.width * spec.height;

export default function(container, url, specs, options={}) {
	var sync, controller;
	var elem = createElement('div', 'emmet-re-view__wall');

	// sort given devices by view area for optimal layout
	specs = specs.slice(0).sort((a, b) => area(a) - area(b));

	var scrollWidth = options.scrollWidth;
	if (typeof scrollWidth === 'undefined') {
		scrollWidth = measureScrollWidth();
	}

	var views = specs.map(spec => {
		var viewUrl = url;
		if (typeof options.urlForView === 'function') {
			viewUrl = options.urlForView(url, 'device-wall', spec);
		}
		spec = {...spec, scrollWidth};
		return new View(viewUrl, spec);
	});

	var update = () => {
		var itemMargin = options.itemMargin || 0;
		var itemSizes = specs.map(spec => ({
			width:  (+spec.width) + itemMargin * 2 + scrollWidth,
			height: (+spec.height) + itemMargin * 2
		}));
		var rect = getRect(container);

		// make sure wall has optimal layout and completely visible
		var size = calculateOptimalWallSize(itemSizes, rect);
		var scale = Math.min(1, rect.width / size.width, rect.height / size.height);
		setStyle(elem, {width: size.width, height: size.height});
		elem.setAttribute('data-min-scale', scale);
		elem.setAttribute('data-max-scale', 1);
		controller && controller.update();
	};

	var onResize = debounce(update, 500);
	var transition = (views, ...args) => {
		return options.disableAnimations ? Promise.resolve(views) : animate(views, ...args);
	};

	return {
		get element() {
			return elem;
		},
		show() {
			var itemMargin = options.itemMargin || 0;
			update(container);
			views.forEach(view => {
				view.element.style.margin = itemMargin + 'px';
				elem.appendChild(view.element);
			});

			container.appendChild(elem);
			controller = wallController(elem, options);
			elem.ownerDocument.defaultView.addEventListener('resize', onResize);
			return transition(views).then(views => {
				mountAll(views);
				sync = viewSync(views);
			});
		},
		updateOptions(opt={}) {
			options = {...options, ...opt};
		},
		destroy(instant) {
			sync && sync.destroy();
			controller && controller.destroy();
			elem.ownerDocument.defaultView.removeEventListener('resize', onResize);

			var doDestroy = views => {
				views.forEach(view => {
					view.destroy();
					removeElement(view.element);
				});
				removeElement(elem);
				container = elem = views = null;
			};

			return instant
				? Promise.resolve(doDestroy(views))
				: transition(views, true).then(doDestroy);
		}
	};
};

function calculateOptimalWallSize(specs) {
	var overallWidth = sum(specs, 'width');
	var maxViewWidth = max(specs, 'width');
	var delta = overallWidth - maxViewWidth;

	// since we won’t have too much devices/specs, we can use brute force
	// to calculate optimal layout
	var sizes = [];
	for (let i = 0, attempts = specs.length; i <= attempts; i++) {
		sizes.push(calculateWallSize(specs, maxViewWidth + delta * (i / attempts)));
	}

	// find best layout closest to current window ratio
	let maxScale = rect => Math.min(window.innerWidth / rect.width, window.innerHeight / rect.height);
	return sizes.sort((a, b) => maxScale(b) - maxScale(a))[0];
}

function calculateWallSize(specs, maxWidth) {
	var row = [], rows = [row], rowWidth = 0;
	specs.forEach(spec => {
		if (rowWidth + spec.width > maxWidth) {
			rows.push(row = []);
			rowWidth = 0;
		}

		rowWidth += spec.width;
		row.push(spec);
	});

	var rowSizes = rows
	.filter(row => row.length)
	.map(row => ({
		width:  sum(row, 'width'),
		height: max(row, 'height'),
		items:  row.length
	}));

	return {
		width:  max(rowSizes, 'width'),
		height: sum(rowSizes, 'height'),
		maxItemsInRow: max(rowSizes, 'items')
	};
}

function getRect(elem) {
	return {
		width: elem.offsetWidth,
		height: elem.offsetHeight
	};
}

function animate(views, reverse=false) {
	var prop = testProp('transform');
	return Promise.all(views.map(view => new Promise(complete => {
		view.element.style.opacity = reverse ? 1 : 0;
		tween({
			duration: rnd(800, 1200)|0,
			delay: rnd(0, 200)|0,
			easing: 'inOutExpo',
			ry: rnd(-120, 120),
			z:  rnd(1000, 1800),
			elem: view.element,
			step: animStep,
			autostart: true,
			reverse,
			prop,
			complete
		});
	})))
	.then(() => {
		views.forEach(v => v.element.style[prop] = '');
		return views;
	});
}

function animStep(pos) {
	var rpos = 1 - pos;
	this.elem.style.opacity = pos;
	this.elem.style[this.prop] = `translateZ(${this.z * rpos}px) rotateY(${this.ry * rpos}deg)`;
}

function max(arr, key) {
	return arr.reduce((result, obj) => Math.max(result, obj[key]), -Infinity);
}

function sum(arr, key) {
	return arr.reduce((result, obj) => obj[key] + result, 0);
}

function rnd(min, max) {
	return min + (max - min) * Math.random();
}
