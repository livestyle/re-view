/**
 * View Reel: all views are on a single scrollable line
 */
'use strict';

import extend from 'xtend';
import View from './view';
import tween from './tween';
import pageSync from './page-sync';
import {createElement, removeElement, setStyle} from './utils';

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
			return animateShow(views);
		},
		mount() {
			views.forEach(view => view.mount());
			sync = pageSync(views)
		},
		unmount() {
			views.forEach(view => view.unmount());
		},
		destroy() {
			views.forEach(view => {
				view.destroy();
				removeElement(view.element);
			});
			sync && sync.then(obj => obj.destroy());
		}
	};
};

/**
 * Animate views appearance
 * @param  {Array} views Array of views to animate
 * @return {Promise} A Promise that resolved when animation is complete
 */
function animateShow(views) {
	return new Promise((resolve, reject) => {
		// animate only visible views, all the rest show immediately
		var vpWidth = window.innerWidth;
		let visibleViews = views.filter(view => view.element.getBoundingClientRect().left < vpWidth);
		if (!visibleViews.length) {
			return resolve(views);
		}

		// use pooled objects to reduce allocations per animation
		let style = {opacity: 0};
		let transform = {translateX: 0};

		let animOptions = {
			duration: 900,
			easing: 'inOutCubic',
			delay: 0,
			autostart: true,
			step(pos) {
				style.opacity = pos;
				transform.translateX = 500 * (1 - pos);
				setStyle(this.elem, style, transform);
			}
		};

		console.log('items to animate', visibleViews.length);

		visibleViews.forEach((view, i, arr) => {
			let opt = extend(animOptions, {
				delay: 70 * i,
				elem: view.element
			});
			if (i === arr.length - 1) {
				opt.complete = () => resolve(views);
			}
			view.element.style.opacity = 0;
			tween(opt);
		});
	});
}