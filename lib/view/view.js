/**
 * A generic view that displays given URL in iframe
 */
'use strict';

import EventEmitter from 'eventemitter3';
import {createElement, removeElement, measureScrollWidth} from '../utils';
import documentReady from './assets/document-ready';
import becomeAvailable from './assets/become-available';
import Dimention from './assets/dimention';
import setupResize from './assets/resize';
import deferred from '../deferred';

const defaultOptions = {
	minWidth: 200,
	maxWidth: 4096,
	defaultViewportWidth: 980,
	usePageViewport: false
};

var idCounter = 0;

export default class View extends EventEmitter {
	constructor(url, options={}) {
		super();
		this.id = 'v' + (++idCounter);
		this.url = url;
		this.options = {...defaultOptions, ...options};
		if (typeof this.options.scrollWidth === 'undefined') {
			this.options.scrollWidth = measureScrollWidth();
		}

		this._iframe = null;
		this._iframeAvailable = deferred();
		this._iframeReady = deferred();
		this._downscale = 1;
		this.element = createElement('div', 'emmet-re-view__item');

		this._labelElem = createElement('div', 'emmet-re-view__item-label');
		this._labelElem.setAttribute('data-label', this.options.label || this.options.title || '');
		this.element.appendChild(this._labelElem);

		this.width = options.width;
		this.height = options.height;
		this.viewport = {};

		if (options.resize) {
			this._resizeHandle = setupResize(this);
			this.element.appendChild(this._resizeHandle);
		}

		// watch document lifecycle: detect when document was loaded and if its
		// location was changed
		this.on('mount', () => watchDocument(this));

		// every time document becomes available, refresh view
		this.on('document-ready', viewport => {
			this.element.classList.add('emmet-re-view__item_ready');
			this.viewport = viewport;
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

	get iframe() {
		return this._iframe;
	}

	updateOptions(options) {
		this.options = {...this.options, ...options};
		this.refresh();
	}

	refresh() {
		this._updateElementSize();
	}

	_updateElementSize() {
		if (this.element && this._width && this._height) {
			let [width, height] = [this._width, this._height];
			let maxVp = this.options.maxViewportWidth;
			let scrollWidth = this.options.scrollWidth;
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
			this._updateLabel();
		}
	}

	_updateIframeSize() {
		if (this._iframe && this._width && this._height) {
			let width = this.realWidth;
			if (/px$/.test(width)) {
				width = (parseFloat(width) + this.options.scrollWidth) + 'px';
			}

			resize(this._iframe, {
				width,
				height: this.realHeight,
				scale: this._downscale / this.widthRatio
			});
		}
	}

	_updateLabel() {
		var size = [this._width, this._height]
		.map(dim => dim.unit === 'px' ? dim.value : dim.valueOf())
		.join('×');
		this._labelElem.setAttribute('data-size', size);
	}

	available() {
		return this._iframeAvailable.promise;
	}

	ready() {
		return this._iframeReady.promise;
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

			console.log('mount view', this.id);
			becomeAvailable(this._iframe)
			.then(wnd => {
				console.log('view %s become available', this.id);
				this._iframeAvailable.resolve(wnd);
				documentReady(this._iframe)
				.then(meta => {
					console.log('view %s was loaded', this.id);
					this._iframeReady.resolve(meta);
				});
			})
			.catch(this._iframeAvailable.reject)
			this.emit('mount', this._iframe);
		}
		return this.ready();
	}

	unmount() {
		if (this._iframe) {
			removeElement(this._iframe);
			this.emit('unmount', this._iframe);
		}
		return this._iframe;
	}

	get isMounted() {
		return !!this.iframe;
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

function resize(elem, size) {
	var scale = 'scale' in size ? size.scale : 1;
	elem.style.cssText += `;width:${size.width};height:${size.height};transform:scale(${scale})`;
	return elem;
}

function watchDocument(view) {
	if (!view.isMounted) {
		// view was destroyed or it’s not mounted yet: do nothing
		return;
	}

	view.ready().then(meta => {
		let wnd = view.iframe.contentWindow;
		let onunload = evt => {
			wnd.removeEventListener('unload', onunload);
			setTimeout(() => {
				view.emit('unload');
				watchDocument(view);
			}, 1);
		};
		wnd.addEventListener('unload', onunload);
		view.emit('document-ready', meta);
	});
}
