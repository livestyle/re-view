/**
 * Device Wall: a set of device-sized views on a zoomable view
 */
'use strict';

import extend from 'xtend';
import EventEmitter from 'eventemitter3';
import View from './view';
import tween from './tween';
import viewSync from './view-sync';
import mountAll from './mount';
import {createElement, removeElement, setStyle, testProp} from './utils';

const area = spec => spec.width * spec.height;

export default function(url, specs, options={}) {
	var elem = createElement('div', 'emmet-re-view__wall');
	// sort given devices by view area for optimal layout
	specs = specs.sort((a, b) => area(a) - area(b));

	var views = specs.map(spec => new View(url, extend(spec, options)));
	var sync = null;
	
	var out = new EventEmitter();
	Object.defineProperty(out, 'element', {
		get: () => elem,
		enumerable: true
	});

	return extend(out, {
		show(rect) {
			var itemMargin = options.itemMargin || 0;
			this.update(rect);
			views.forEach(view => {
				view.element.style.margin = itemMargin + 'px';
				elem.appendChild(view.element);
			});

			return animate(views).then(views => {
				mountAll(views);
				sync = viewSync(views);
			});
		},

		update(rect=getViewportRect()) {
			var itemMargin = options.itemMargin || 0;
			var itemSizes = specs.map(spec => ({
				width:  spec.width + itemMargin * 2,
				height: spec.height + itemMargin * 2
			}))

			// make sure wall has optimal layout and completely visible 
			var size = calculateOptimalWallSize(itemSizes, rect);
			var scale = Math.min(1, rect.width / size.width, rect.height / size.height);
			setStyle(elem, {width: size.width}, {scale});
			elem.setAttribute('data-min-scale', scale);
			return elem;
		},

		destroy() {
			sync && sync.destroy();
			return animate(views, true).then(views => {
				views.forEach(view => {
					view.destroy();
					removeElement(view.element);
				});
			});
		}
	});
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
		items: row.length
	}));

	return {
		width:  max(rowSizes, 'width'),
		height: sum(rowSizes, 'height'),
		maxItemsInRow: max(rowSizes, 'items')
	};
}

function getViewportRect() {
	return {
		width: window.innerWidth,
		height: window.innerHeight
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