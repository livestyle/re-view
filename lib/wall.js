/**
 * Device Wall: a set of device-sized views on a zoomable view
 */
'use strict';

import extend from 'xtend';
import View from './view';
import tween from './tween';
import viewSync from './view-sync';
import {createElement, removeElement, setStyle} from './utils';

const minWallWidth = 3000;

export default function(url, specs, options={}) {
	// find best wall width
	var wallWidth = specs.reduce((w, spec) => Math.max(spec.width, w), minWallWidth);
	var elem = createElement('div', 'emmet-re-view__wall');
	setStyle(elem, {width: wallWidth}, {scale: 0.5});

	var views = specs.map(spec => new View(url, extend(spec, options)));
	var sync = null;

	return {
		get element() {
			return elem;
		},
		show() {
			views.forEach(view => {
				elem.appendChild(view.element);
				// add space between view for justification
				elem.appendChild(document.createTextNode(' '));
				view.mount();
			});
			sync = viewSync(views);
		},
		destroy() {
			sync && sync.destroy();
			views.forEach(view => {
				view.destroy();
				removeElement(view.element);
			});
		}
	};
};