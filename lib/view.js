/**
 * A generic view that displays given URL in iframe
 */
'use strict';

import EventEmitter from 'eventemitter3';
import extend from 'xtend';
import {createElement, removeElement} from './utils';

const defaultOptions = {
	minWidth: 200,
	maxWidth: 2550
};

export default class View extends EventEmitter {
	constructor(url, options={}) {
		super();
		this.url = url;
		this.options = extend(defaultOptions, options);

		this._iframe = null;
		this._downscale = 1;
		this.element = createElement('div', 'emmet-re-view__item');
		this.dpi = options.dpi;
		this.width = options.width;
		this.height = options.height;

		if (options.resize) {
			this._resizeHandle = createElement('div', 'emmet-re-view__item-resize-handle');
			setupResizeHandle(this._resizeHandle, this);
			this.element.appendChild(this._resizeHandle);
		}

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

	get dpi() {
		return (this._dpi || 1);
	}

	set dpi(value) {
		value = parseFloat(value);
		if (this._dpi !== value) {
			this._dpi = value;
			this._updateIframeSize();
		}
	}

	get realWidth() {
		return this._width.valueOf(this.dpi);
	}

	get realHeight() {
		return this._height.valueOf(this.dpi / this._downscale);
	}

	get label() {
		return ('label' in this.options) ? this.options.label : `${this.realWidth}×${this.realHeight}`;
	}

	getDocument() {
		if (!this._iframe) {
			return Promise.reject(new ViewError('ENOTMOUNTED', 'Document frame is not mounted'));
		}

		if (hasValidDocument(this._iframe)) {
			return Promise.resolve(this._iframe.contentDocument);
		}

		// looks like frame document is not loaded yet
		return Promise.race([
			new Promise((resolve, reject) => {
				let onload = () => {
					this._iframe.removeEventListener('load', onload);
					resolve(this._iframe.contentDocument);
				};
				this._iframe.addEventListener('load', onload);
			}),
			pollDocument(this._iframe)
		]);
	}

	refresh() {
		this._updateElementSize();
	}

	_updateElementSize() {
		if (this.element && this._width && this._height) {
			let [width, height] = [this._width, this._height];
			let maxVp = this.options.maxViewportWidth;
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
			resize(this._iframe, {
				width: this.realWidth,
				height: this.realHeight,
				scale: this._downscale / this.dpi
			});
		}
	}

	mount() {
		if (!this._iframe) {
			this._iframe = createElement('iframe', 'emmet-re-view__item-iframe');
			this._updateIframeSize();
			this._iframe.src = this.url;
		}

		if (!this._iframe.parentNode) {
			this.element.appendChild(this._iframe);
			this.emit('mount', this._iframe);
		}

		this.getDocument().then(doc => {
			// set class with tieout because Chrome wouldn’t apply animations 
			// on just loaded iframes
			setTimeout(() => this.element.classList.add('emmet-re-view__item_ready'), 50);
			this.emit('ready', doc);
		});

		return this._iframe;
	}

	unmount() {
		if (this._iframe) {
			removeElement(this._iframe);
			this.emit('unmount', this._iframe);
		}
		return this._iframe;
	}

	destroy() {
		if (this._iframe) {
			this.unmount();
			removeElement(this._resizeHandle);
			this._iframe = null;
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
		return ((this.value * scale)|0) + this.unit;
	}
}

function resize(elem, size) {
	var scale = 'scale' in size ? size.scale : 1;
	elem.style.cssText += `width:${size.width};height:${size.height};transform:scale(${scale})`;
	return elem;
}

/**
 * Poll for document update in given iframe. We don’t need to wait until page
 * is fully loaded (`load` event), we just need a Document of the frame, which 
 * should appear faster. Unfortunately, `DOMContentLoaded` is not available.
 * @param  {Element} iframe
 * @return {Promise}
 */
function pollDocument(iframe, waitTimeout=10000) {
	let start = Date.now();
	return new Promise((resolve, reject) => {
		let timerId = setInterval(() => {
			if (hasValidDocument(iframe)) {
				clearInterval(timerId);
				return resolve(iframe.contentDocument);
			}

			if (start + waitTimeout < Date.now()) {
				clearInterval(timerId);
				return reject(new ViewError('ETIMEOUT', 'Load timeout'));
			}
		}, 500);
	});
}

function hasValidDocument(iframe) {
	var doc = iframe.contentDocument;
	return doc && doc.defaultView && doc.readyState === 'complete' && iframe.src === doc.URL;
}

function setupResizeHandle(elem, view) {
	elem.addEventListener('dblclick', evt => view.width = view.options.width);
	elem.addEventListener('mousedown', evt => {
		evt.stopPropagation();
		evt.preventDefault();
		let prevState = view.element.dataset.state || '';
		view.element.dataset.state = 'resizing';

		let doc = elem.ownerDocument;
		let pointerStart = evt.pageX;
		let viewWidth = parseInt(view.width, 10);
		let onMove = evt => {
			evt.stopPropagation();
			evt.preventDefault();
			view.width = viewWidth + evt.pageX - pointerStart;
		};
		let onEnd = evt => {
			view.element.dataset.state = prevState;
			doc.removeEventListener('mousemove', onMove);
			doc.removeEventListener('mouseup', onEnd);
			view.emit('resize:end');
		};
		doc.addEventListener('mousemove', onMove);
		doc.addEventListener('mouseup', onEnd);
		view.emit('resize:start');
	});
}