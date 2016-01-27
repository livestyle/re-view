/**
 * View Reel: all views are on a single scrollable line
 */
'use strict';

import View from './view';
import tween from '../tween';
import overrideScroll from '../scroller';
import viewSync from '../controller/view-sync';
import mountAll from './assets/mount';
import {createElement, removeElement, testProp} from '../utils';

export default function(container, url, specs, options={}) {
	var elem = createElement('div', 'emmet-re-view__reel');
	var views = specs.map(spec => new View(url, spec));
	var sync, scroll;

	var onResizeStart = () => elem.classList.add('emmet-re-view__reel_resize');
	var onResizeEnd = () => elem.classList.remove('emmet-re-view__reel_resize');

	return {
		get element() {
			return elem;
		},
		show() {
			views.forEach(view => {
				view.on('resize:start', onResizeStart);
				view.on('resize:end', onResizeEnd);
				elem.appendChild(view.element);
			});
			container.appendChild(elem);
			return animate(views).then(views => {
				mountAll(views);
				sync = viewSync(views);
				scroll = overrideScroll(container, elem, scrollFilter);
			});
		},
		destroy() {
			sync && sync.destroy();
			scroll && scroll.destroy();
			return animate(views, true).then(views => {
				views.forEach(view => {
					view.destroy();
					view.off('resize:start', onResizeStart);
					view.off('resize:end', onResizeEnd);
					removeElement(view.element);
				});
				removeElement(elem);
			});
		}
	};
};

/**
 * Animate views show/hide
 * @param  {Array} views Array of views to animate
 * @return {Promise} A Promise that resolved when animation is complete
 */
function animate(views, reverse=false) {
	return new Promise((resolve, reject) => {
		// animate only visible views
		var vpWidth = window.innerWidth;
		let visibleViews = views.filter(view => {
			let rect = view.element.getBoundingClientRect();
			return Math.min(rect.right, vpWidth) > Math.max(rect.left, 0);
		});

		if (!visibleViews.length) {
			return resolve(views);
		}

		let animOptions = {
			duration: 900,
			easing: 'inOutCubic',
			reverse,
			autostart: true,
			prop: testProp('transform'),
			step: animStep
		};

		if (reverse) {
			visibleViews.reverse();
		}

		visibleViews.forEach((view, i, arr) => {
			let opt = {
				...animOptions,
				delay: 70 * i,
				elem: view.element
			};
			if (i === arr.length - 1) {
				opt.complete = () => resolve(views);
			}
			view.element.style.opacity = reverse ? 1 : 0;
			tween(opt);
		});
	});
}

function animStep(pos) {
	this.elem.style.opacity = pos;
	this.elem.style[this.prop] = `translateX(${500 * (1 - pos)}px)`;
}

function scrollFilter(evt) {
	// do not override vertical scroll if mouse is over the View
	var ctx = evt.target;
	while (ctx && ctx.nodeType !== 9) {
		if (ctx.classList.contains('emmet-re-view__item-iframe')) {
			return false;
		}
		ctx = ctx.parentNode;
	}

	return true;
}
