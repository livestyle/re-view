/**
 * View Reel: all views are on a single scrollable line
 */
'use strict';

import extend from 'xtend';
import View from './view';
import tween from './tween';
import viewSync from './view-sync';
import mountAll from './mount';
import {createElement, removeElement, testProp} from './utils';

export default function(url, specs, options={}) {
	var elem = createElement('div', 'emmet-re-view__reel');
	var views = specs.map(spec => new View(url, extend(spec, options)));
	var sync = null;

	return {
		get element() {
			return elem;
		},
		show() {
			views.forEach(view => elem.appendChild(view.element));
			return animate(views).then(views => {
				mountAll(views);
				sync = viewSync(views);
			});
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
			let opt = extend(animOptions, {
				delay: 70 * i,
				elem: view.element
			});
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