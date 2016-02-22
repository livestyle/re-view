/**
 * View Reel: all views are on a single scrollable line
 */
'use strict';

import View from './view';
import tween from '../tween';
import overrideScroll from '../scroller';
import viewSync from '../controller/view-sync';
import mountAll from './assets/mount';
import {createElement, removeElement, testProp, clamp} from '../utils';

export default function(container, url, specs, options={}) {
	var elem = createElement('div', 'emmet-re-view__reel');
	var maxViewportWidth = getMaxViewportWidth(options);
	var sync, scroll;

	var onResizeStart = () => elem.classList.add('emmet-re-view__reel_resize');
	var onResizeEnd = () => elem.classList.remove('emmet-re-view__reel_resize');
	var createViewFromSpec = spec => {
		var viewUrl = url;
		if (typeof options.urlForView === 'function') {
			viewUrl = options.urlForView(url, 'breakpoints', spec);
		}

		var view = new View(url, {
			...spec,
			maxViewportWidth: spec.maxViewportWidth || maxViewportWidth,
			scrollWidth: options.scrollWidth
		});

		return view
		.on('resize:start', onResizeStart)
		.on('resize:end', onResizeEnd);
	};

	var destroyView = view => {
		removeElement(view.element);
		view.off('resize:start', onResizeStart);
		view.off('resize:end', onResizeEnd);
		view.destroy();
	};

	var transition = (views, ...args) => {
		return options.disableAnimations ? Promise.resolve(views) : animate(views, ...args);
	};

	var views = specs.map(createViewFromSpec);

	return {
		get element() {
			return elem;
		},
		show() {
			attachViews(elem, views);
			container.appendChild(elem);
			return transition(views).then(views => {
				mountAll(views);
				sync = viewSync(views);
				if (!options.noScrollOverride) {
					scroll = overrideScroll(container, elem, scrollFilter);
				}
			});
		},
		/**
		 * Updates view list
		 * @param  {Array} specs List of view specs to display
		 */
		update(specs) {
			sync && sync.destroy();

			// remove views not in new spec list
			var lookup = specs.reduce((out, spec) => {
				out[spec.id] = spec;
				return out;
			}, {});

			views = views.filter(view => {
				if (!lookup[view.options.id]) {
					destroyView(view);
					return false;
				}
				return true;
			});

			// add new specs
			lookup = views.reduce((out, view) => {
				out[view.options.id] = view;
				return out;
			}, {});

			views = views
			.concat(specs.filter(spec => !lookup[spec.id]).map(createViewFromSpec))
			.sort((a, b) => parseInt(a.width, 10) - parseInt(b.width, 10));

			attachViews(elem, views);
			mountAll(views);
			sync = viewSync(views);
		},
		updateOptions(opt={}) {
			if ('maxViewportWidth' in opt) {
				opt = {
					...opt,
					maxViewportWidth: getMaxViewportWidth(opt)
				}
				views.forEach(view => view.updateOptions(opt));
			}
			options = {...options, ...opt};
		},
		destroy() {
			sync && sync.destroy();
			scroll && scroll.destroy();
			return transition(views, true).then(views => {
				views.forEach(destroyView);
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

function getMaxViewportWidth(obj) {
	var value = +obj.maxViewportWidth;
	return clamp(isNaN(value) ? 600 : value, 200, 2500);
}

/**
 * Ensures that all view elements are attached in proper order into `elem`.
 * We can’t use `elem.appendChild(view.element)` to attach and re-order all views
 * since attaching mounted node into new position removes it from parent in first
 * place, which causes inner iframe reloading (reproduced in Chrome)
 * @param  {Element} elem
 * @param  {Array} views
 */
function attachViews(elem, views) {
	views.forEach((view, i) => {
		if (view.element.parentNode) {
			return;
		}

		// attach view at `i` position
		var child = elem.childNodes[i];
		if (child) {
			elem.insertBefore(view.element, child);
		} else {
			elem.appendChild(view.element);
		}
	})
}
