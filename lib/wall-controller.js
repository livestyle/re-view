'use strict';

import extend from 'xtend';
import assign from 'xtend/mutable';
import tween from './tween';
import {testProp, createElement, removeElement, setTransform, clamp} from './utils';

const defaultOptions = {
	activateKey: 16 // Shift key
};

export default function(layer, options) {
	options = extend(defaultOptions, options || {});
	var state = readState(layer);
	state.scale = state.minScale;
	state.x = (state.viewportWidth - state.width * state.scale) / 2;
	state.y = (state.viewportHeight - state.height * state.scale) / 2;

	var control, mouseX = 0, mouseY = 0;

	var captureMousePos = evt => {
		mouseX = evt.layerX;
		mouseY = evt.layerY;
	};

	var enterControlState = evt => {
		if (evt.keyCode === options.activateKey) {
			control && control.dispose();
			control = createControlLayer(state, mouseX, mouseY);
			layer.parentNode.appendChild(control.element);
			control.show();
		}
	};
	var exitControlState = evt => {
		if (evt.keyCode === options.activateKey) {
			control && control.dispose();
			control = null;
		}
	};
	var focusOnDoc = evt => doc.defaultView.focus();

	var doc = layer.ownerDocument;
	var drag = dragHandler(state);
	doc.addEventListener('keydown', enterControlState);
	doc.addEventListener('keyup', exitControlState);
	doc.addEventListener('mouseover', focusOnDoc);
	doc.addEventListener('click', focusOnDoc);
	layer.addEventListener('mousemove', captureMousePos);
	// setup wall dragging when clicked outside of views
	layer.addEventListener('mousedown', drag);

	renderState(state);

	return {
		update() {
			state = assign(state, readState(layer));
			state.scale = clampScale(state, state.scale);
			renderState(state);
		},
		destroy() {
			doc.removeEventListener('keydown', enterControlState);
			doc.removeEventListener('keyup', exitControlState);
			doc.removeEventListener('mouseover', focusOnDoc);
			doc.removeEventListener('click', focusOnDoc);
			layer.removeEventListener('mousemove', captureMousePos);
			layer.removeEventListener('mousedown', drag);
			doc = layer = drag = null;
		}
	};
};

function readState(layer) {
	var viewport = layer.parentNode;
	return {
		viewportWidth: viewport.offsetWidth,
		viewportHeight: viewport.offsetHeight,
		width: layer.offsetWidth,
		height: layer.offsetHeight,
		minScale: parseFloat(layer.getAttribute('data-min-scale') || 0.01),
		maxScale: parseFloat(layer.getAttribute('data-max-scale') || 1),
		layer
	};
}

function stopEvent(evt) {
	evt.preventDefault();
	evt.stopPropagation();
	return evt;
}

function clampScale(state, scale) {
	return clamp(scale, state.minScale, state.maxScale);
}

function renderState(state, x=state.x, y=state.y, scale=state.scale) {
	var dw = state.viewportWidth - state.width * scale;
	var dh = state.viewportHeight - state.height * scale;

	var minX = Math.min(dw, dw / 2);
	var maxX = Math.max(0, minX);
	var minY = Math.min(dh, dh / 2);
	var maxY = Math.max(0, minY);

	state.x = clamp(x, minX, maxX)|0;
	state.y = clamp(y, minY, maxY)|0;
	state.scale = scale;

	setTransform(state.layer, `translate(${state.x}px, ${state.y}px) scale(${state.scale})`);
	return state;
}

function dragHandler(state) {
	return evt => {
		stopEvent(evt);

		let doc = state.layer.ownerDocument;
		let startX = state.x - evt.pageX;
		let startY = state.y - evt.pageY;

		let onMouseMove = evt => {
			stopEvent(evt);
			renderState(state, evt.pageX + startX, evt.pageY + startY);
		};
		let onMouseUp = evt => {
			doc.removeEventListener('mousemove', onMouseMove);
			doc.removeEventListener('mouseup', onMouseUp);
		};

		doc.addEventListener('mousemove', onMouseMove);
		doc.addEventListener('mouseup', onMouseUp);
	};
}

function zoom(state, scale, mouseX, mouseY) {
	var scale = clampScale(state, scale);

	// mouse pos relative to layer
	var mx = mouseX - state.x;
	var my = mouseY - state.y;

	// current scale
	var cw = state.width * state.scale;   
	var ch = state.height * state.scale;

	// target scale
	var tw = state.width * scale;
	var th = state.height * scale;

	var dx = (cw - tw) * (mx / cw);
	var dy = (ch - th) * (my / ch);

	renderState(state, state.x + dx, state.y + dy, scale);
}

function createControlLayer(state, mouseX=0, mouseY=0) {
	var elem = createElement('div', 'emmet-re-view__wall-control');

	// Setup wall dragging
	var drag = dragHandler(state);
	elem.addEventListener('mousedown', drag);

	// Setup wall zoom
	// as a universal solution for different platforms and input devices 
	// (like Apple Magic Mouse or Trackpad) use element scrolling instead of 
	// `mousewheel` event to properly handle input data
	var scroller = createElement('div', 'emmet-re-view__wall-control-scroller');
	var inner = createElement('div');

	var captureMousePos = evt => {
		mouseX = evt.layerX;
		mouseY = evt.layerY;
	};

	var zoomHandler = evt => {
		stopEvent(evt);
		var scrollDelta = scroller.scrollHeight - scroller.offsetHeight;
		var scale = state.minScale + (state.maxScale - state.minScale) * (scroller.scrollTop / scrollDelta);
		zoom(state, scale, mouseX, mouseY);
	};

	inner.style.height = `${(1 + state.maxScale - state.minScale) * 100}%`;
	scroller.appendChild(inner);
	scroller.addEventListener('scroll', zoomHandler);
	scroller.addEventListener('mousemove', captureMousePos);

	elem.appendChild(scroller);

	var anim = null;
	return {
		element: elem,
		show() {
			elem.style.opacity = 0;
			this.sync();
			anim = animateOpacity(elem, false);
		},
		sync() {
			var scrollDelta = scroller.scrollHeight - scroller.offsetHeight;
			var scale = (state.scale - state.minScale) / (state.maxScale - state.minScale)
			var scrollPos = Math.round(scrollDelta * scale);
			if (Math.abs(scroller.scrollTop - scrollPos) > 2) {
				scroller.scrollTop = scrollPos;
			}
		},
		dispose() {
			scroller.removeEventListener('scroll', zoomHandler);
			scroller.removeEventListener('mousemove', captureMousePos);
			elem.removeEventListener('mousedown', drag);
			
			anim && anim.stop();
			animateOpacity(elem, true, () => {
				removeElement(elem);
				elem = anim = null;
			});
		}
	};
}

function animateOpacity(elem, reverse, complete) {
	return tween({
		duration: 300,
		easing: 'outCubic',
		reverse,
		step(pos) {
			elem.style.opacity = pos;
		},
		complete
	});
}