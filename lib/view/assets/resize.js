/**
 * Setup resizing on given view
 */
'use strict';

export default function(view) {
    var handle = view.element.ownerDocument.createElement('div');
    handle.className = 'emmet-re-view__item-resize-handle';
    setupResizeHandle(handle, view);
    return handle;
};

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
