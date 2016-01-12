'use strict';

import {testProp, createElement, setStyle, setTransform, clamp} from './utils';

export default function(container, layer) {
	var mover = createElement('div', 'mover');
	var state = {x: 0, y: 0, scale: 1};
	var containerData, layerData;

	var clampScale = scale => clamp(scale, layerData.minScale, layerData.maxScale);

	var update = (x, y, scale=state.scale) => {
		scale = clampScale(scale);

		var dw = containerData.width - layerData.width * scale;
		var dh = containerData.height - layerData.height * scale;

		var minX = Math.min(dw, dw / 2);
		var maxX = Math.max(0, minX);
		var minY = Math.min(dh, dh / 2);
		var maxY = Math.max(0, minY);

		// console.log(x, minX, maxX);
		state.x = clamp(x, minX, maxX)|0;
		state.y = clamp(y, minY, maxY)|0;
		state.scale = scale;

		setTransform(layer, `scale(${state.scale})`);
		setTransform(mover, `translate(${state.x}px, ${state.y}px)`);
	};

	mover.appendChild(layer);
	container.appendChild(mover);

	containerData = readLayer(container);
	layerData = readLayer(layer);
	update(
		(containerData.width - layerData.width * layerData.minScale) / 2, 
		(containerData.height - layerData.height * layerData.minScale) / 2, 
		layerData.minScale
	);

	mover.addEventListener('mousedown', evt => {
		stopEvent(evt);

		let startX = state.x - evt.pageX;
		let startY = state.y - evt.pageY;

		let onMouseMove = evt => {
			stopEvent(evt);
			update(evt.pageX + startX, evt.pageY + startY);
		};
		let onMouseUp = evt => {
			document.removeEventListener('mousemove', onMouseMove);
			document.removeEventListener('mouseup', onMouseUp);
		};

		document.addEventListener('mousemove', onMouseMove);
		document.addEventListener('mouseup', onMouseUp);
	});

	container.addEventListener('mousewheel', evt => {
		stopEvent(evt);
		let scale = clampScale(state.scale - evt.wheelDeltaY * 0.001);

		// mouse pos relative to layer
		let mx = evt.layerX - state.x;
		let my = evt.layerY - state.y;

		// current scale
		let cw = layerData.width * state.scale;   
		let ch = layerData.height * state.scale;

		// target scale
		let tw = layerData.width * scale;
		let th = layerData.height * scale;

		let dx = (cw - tw) * (mx / cw);
		let dy = (ch - th) * (my / ch);

		update(state.x + dx, state.y + dy, scale);
	});
};

function readLayer(elem) {
	return {
		width: elem.offsetWidth,
		height: elem.offsetHeight,
		minScale: parseFloat(elem.getAttribute('data-min-scale') || 0.01),
		maxScale: parseFloat(elem.getAttribute('data-max-scale') || 1),
	};
}

function stopEvent(evt) {
	evt.preventDefault();
	evt.stopPropagation();
	return evt;
}