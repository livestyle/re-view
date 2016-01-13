'use strict';

import extend from 'xtend';
import {testProp, createElement, setStyle, setTransform, clamp} from './utils';

export default function(container, layer) {
	container.appendChild(layer);
	
	var state = readState(container, layer);
	state.x = state.y = 0;
	state.scale = state.minScale;

	var drag = dragHandler(state);
	var zoom = zoomHandler(state);

	layer.addEventListener('mousedown', drag);
	layer.addEventListener('mousewheel', zoom);

	renderState(state,
		(state.viewportWidth - state.width * state.scale) / 2, 
		(state.viewportHeight - state.height * state.scale) / 2
	);
};

function readState(viewport, layer) {
	return {
		viewportWidth: viewport.offsetWidth,
		viewportHeight: viewport.offsetHeight,
		width: layer.offsetWidth,
		height: layer.offsetHeight,
		minScale: parseFloat(layer.getAttribute('data-min-scale') || 0.01),
		maxScale: parseFloat(layer.getAttribute('data-max-scale') || 1),
		layer,
		viewport
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

function renderState(state, x, y, scale=state.scale) {
	scale = clampScale(state, scale);

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

		let startX = state.x - evt.pageX;
		let startY = state.y - evt.pageY;

		let onMouseMove = evt => {
			stopEvent(evt);
			renderState(state, evt.pageX + startX, evt.pageY + startY);
		};
		let onMouseUp = evt => {
			document.removeEventListener('mousemove', onMouseMove);
			document.removeEventListener('mouseup', onMouseUp);
		};

		document.addEventListener('mousemove', onMouseMove);
		document.addEventListener('mouseup', onMouseUp);
	};
}

function zoomHandler(state) {
	return evt => {
		stopEvent(evt);
		let scale = clampScale(state, state.scale - evt.wheelDeltaY * 0.001);

		// mouse pos relative to layer
		let mx = evt.layerX - state.x;
		let my = evt.layerY - state.y;

		// current scale
		let cw = state.width * state.scale;   
		let ch = state.height * state.scale;

		// target scale
		let tw = state.width * scale;
		let th = state.height * scale;

		let dx = (cw - tw) * (mx / cw);
		let dy = (ch - th) * (my / ch);

		renderState(state, state.x + dx, state.y + dy, scale);
	}
}