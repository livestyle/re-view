/**
 * A generic view that displays given URL in iframe
 */
'use strict';

import EventEmitter from 'eventemitter3';
import {createElement, removeElement, measureScrollWidth} from '../utils';
import {default as pollDocument, hasValidDocument} from './assets/poll-document'

const defaultOptions = {
	minWidth: 200,
	maxWidth: 2550,
	defaultViewportWidth: 980,
	usePageViewport: false
};

const defaultViewport = {};
var idCounter = 0;

export default class View extends EventEmitter {
	constructor(url, options={}) {
		super();
		this.id = 'v' + (++idCounter);
		this.url = url;
		this.options = {...defaultOptions, ...options};

		this._iframe = null;
		this._downscale = 1;
		this.element = createElement('div', 'emmet-re-view__item');
		this.element.setAttribute('data-label', this.options.label || '');
		this.width = options.width;
		this.height = options.height;
		this.viewport = {};

		if (options.resize) {
			this._resizeHandle = createElement('div', 'emmet-re-view__item-resize-handle');
			setupResizeHandle(this._resizeHandle, this);
			this.element.appendChild(this._resizeHandle);
		}

		this.element.appendChild(createElement('div', 'emmet-re-view__item-shadow'));

		// watch document lifecycle: detect when document was loaded and if its
		// location was changed
		this.on('mount', () => watchDocument(this));

		// every time document becomes available, refresh view
		this.on('document-ready', doc => {
			this.element.classList.add('emmet-re-view__item_ready');
			this.viewport = getPageViewport(doc);
			this.refresh();
		});

		if (options.autoMount) {
			this.mount();
		}
	}

	get width() {
		return this._width.valueOf();
	}

	set width(value) {
		var d = new Dimention(value);
		if (d.unit === 'px') {
			// apply constrains
			d.value = Math.min(Math.max(d.value, this.options.minWidth), this.options.maxWidth);
		}

		if (!this._width || !this._width.equals(d)) {
			this._width = d;
			this._updateElementSize();
		}
	}

	get height() {
		return this._height.valueOf();
	}

	set height(value) {
		var d = new Dimention(value);
		d.value = Math.max(0, d.value);
		if (!this._height || !this._height.equals(d)) {
			this._height = d;
			this._updateElementSize();
		}
	}

	get widthRatio() {
		if (!this.options.usePageViewport) {
			return 1;
		}

		var originalWidth = this._width.value;
		var width = this.viewport.width || this.options.defaultViewportWidth;
		if (width === 'device-width') {
			width = originalWidth;
		}

		// make sure width is not lower that actual device width
		return Math.max(width, originalWidth) / originalWidth;
	}

	get realWidth() {
		return this._width.valueOf(this.widthRatio);
	}

	get realHeight() {
		var scale = this.options.usePageViewport ? this.widthRatio : 1;
		return this._height.valueOf(scale / this._downscale);
	}

	get label() {
		return ('label' in this.options) ? this.options.label : `${this.realWidth}×${this.realHeight}`;
	}

	refresh() {
		this._updateElementSize();
	}

	_updateElementSize() {
		if (this.element && this._width && this._height) {
			let [width, height] = [this._width, this._height];
			let maxVp = this.options.maxViewportWidth;
			let scrollWidth = measureScrollWidth();
			if (scrollWidth && width.unit === 'px') {
				width = width.copy(width.value + scrollWidth);
			}

			if (maxVp && width.unit === 'px') {
				// restrict width to maxViewportWidth and downscale iframe
				// to given ratio
				this._downscale = Math.min(1, maxVp / width.value);
				width = width.copy(Math.min(width.value, maxVp));
			}

			resize(this.element, {width, height});
			this._updateIframeSize();
		}
	}

	_updateIframeSize() {
		if (this._iframe && this._width && this._height) {
			let width = this.realWidth;
			if (/px$/.test(width)) {
				width = (parseFloat(width) + measureScrollWidth()) + 'px';
			}

			resize(this._iframe, {
				width,
				height: this.realHeight,
				scale: this._downscale / this.widthRatio
			});
		}
	}

	getDocument() {
		if (!this.isMounted) {
			return Promise.reject(new ViewError('ENOTMOUNTED', 'Document frame is not mounted'));
		}

		var iframe = this._iframe;
		if (hasValidDocument(iframe)) {
			return Promise.resolve(iframe.contentDocument);
		}

		// looks like frame document is not loaded yet
		return Promise.race([pollDocument(iframe), waitForLoad(iframe)]);
	}

	mount() {
		if (!this._iframe) {
			this._iframe = createElement('iframe', 'emmet-re-view__item-iframe');
			this._updateIframeSize();
			this._iframe.src = this.url;
		}

		if (!this._iframe.parentNode) {
			let target = this.element.querySelector('.emmet-re-view__item-iframe-holder');
			if (!target) {
				target = createElement('div', 'emmet-re-view__item-iframe-holder');
				this.element.appendChild(target);
			}
			target.appendChild(this._iframe);
			let defaultDoc = this._iframe.contentDocument;
			this._iframe.setAttribute('data-default-src', defaultDoc && defaultDoc.URL);
			this.emit('mount', this._iframe);
		}

		return this.getDocument();
	}

	unmount() {
		if (this._iframe) {
			removeElement(this._iframe);
			this.emit('unmount', this._iframe);
		}
		return this._iframe;
	}

	get isMounted() {
		return !!this._iframe;
	}

	destroy() {
		if (this._iframe) {
			this.unmount();
			removeElement(this._resizeHandle);
			this.element = this._resizeHandle = this._iframe = null;
			this.emit('destroy');
		}
	}
};

export class ViewError extends Error {
	constructor(code, message) {
		super(message || code);
		this.code = code;
	}
};

class Dimention {
	constructor(value, unit='px') {
		if (typeof value === 'string') {
			let m = value.match(/^(\d+(?:\.\d*)?)(.*)$/);
			if (!m) {
				throw new Error('Invalid number format: ' + value);
			}
			value = parseFloat(m[1]);
			unit = m[2] || unit;
		} else if (value instanceof Dimention) {
			[value, unit] = [value.value, value.unit];
		}

		this.value = value;
		this.unit = unit;
	}

	copy(value=this.value, unit=this.unit) {
		return new Dimention(value, unit);
	}

	equals(d) {
		return this.value === d.value && this.unit === d.unit;
	}

	valueOf(scale=1) {
		return Math.round(this.value * scale) + this.unit;
	}
}

function resize(elem, size) {
	var scale = 'scale' in size ? size.scale : 1;
	elem.style.cssText += `;width:${size.width};height:${size.height};transform:scale(${scale})`;
	return elem;
}

function setupResizeHandle(elem, view) {
	elem.addEventListener('dblclick', evt => view.width = view.options.width);
	elem.addEventListener('mousedown', evt => {
		evt.stopPropagation();
		evt.preventDefault();
		let prevState = view.element.getAttribute('data-state' || '');
		view.element.setAttribute('data-state', 'resizing');

		let doc = elem.ownerDocument;
		let pointerStart = evt.pageX;
		let viewWidth = parseInt(view.width, 10);
		let onMove = evt => {
			evt.stopPropagation();
			evt.preventDefault();
			view.width = viewWidth + evt.pageX - pointerStart;
		};
		let onEnd = evt => {
			view.element.setAttribute('data-state', prevState);
			doc.removeEventListener('mousemove', onMove);
			doc.removeEventListener('mouseup', onEnd);
			view.emit('resize:end');
		};
		doc.addEventListener('mousemove', onMove);
		doc.addEventListener('mouseup', onEnd);
		view.emit('resize:start');
	});
}

function watchDocument(view) {
	if (!view.isMounted) {
		// view was destroyed or it’s not mounted yet: do nothing
		return;
	}

	view.getDocument().then(doc => {
		let wnd = doc.defaultView;
		let onunload = evt => {
			wnd.removeEventListener('unload', onunload);
			setTimeout(() => {
				view.emit('unload');
				watchDocument(view);
			}, 1);
		};
		wnd.addEventListener('unload', onunload);
		view.emit('document-ready', doc);
	});
}

function waitForLoad(iframe) {
	return new Promise(resolve => {
		let onload = () => {
			iframe.removeEventListener('load', onload);
			resolve(iframe.contentDocument);
		};
		iframe.addEventListener('load', onload);
	});
}

function getPageViewport(doc) {
	var meta = doc.querySelector('meta[name="viewport"]');
	return meta ? parseViewport(meta.getAttribute('content')) : defaultViewport;
}

function parseViewport(str='') {
	return str.split(/[,;]/g).reduce((obj, prop) => {
		let parts = prop.trim().split('=');
		let name = parts.shift().trim().toLowerCase();
		let value = parts.join('=').trim().toLowerCase();

		// validate and transform properties we will actually use
		if (name === 'width' || name === 'height') {
			if (value !== 'device-width' && value !== 'device-height') {
				value = parseInt(value, 10);
				if (isNaN(value)) {
					value = `device-${name}`;
				} else {
					value = Math.min(Math.max(1, value), 10000);
				}
			}
		}
		obj[name] = value;
		return obj;
	}, {});
}
