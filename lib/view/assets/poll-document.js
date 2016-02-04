/**
 * Polls document in given iframe to detect if it’s ready (DOMContentLoaded may
 * not be availble for <iframe> documents since it will change document after
 * it will start loading new URL)
 */
'use strict';

var queue = [];
var pollTimer = null;

/**
 * Poll for document update in given iframe. We don’t need to wait until page
 * is fully loaded (`load` event), we just need a Document of the frame, which
 * should appear faster. Unfortunately, `DOMContentLoaded` is not available.
 * @param  {Element} iframe
 * @return {Promise}
 */
export default function(iframe, waitTimeout=30000) {
	return new Promise((resolve, reject) => {
		queue.push({
			iframe,
			waitTimeout,
			resolve,
			reject,
			start: Date.now()
		});
		poll();
	});
}

export function cancelPoll(iframe) {
	queue = queue.filter(item => {
		if (item.iframe === iframe) {
			let err = new Error('Poll cancelled');
			err.code = 'EPOLLCANCEL';
			item.reject(err);
			return false;
		}
		return true;
	});
}

export function hasValidDocument(iframe) {
	var doc = iframe.contentDocument;
	var defaultSrc = iframe.getAttribute('data-default-src');
	return doc && doc.defaultView && isDocumentAvailable(doc) && doc.URL !== defaultSrc;
}

function isDocumentAvailable(doc) {
	return doc.readyState === 'interactive' || doc.readyState === 'complete';
}

function poll() {
	if (!pollTimer) {
		pollTimer = setTimeout(pollLoop, 200);
	}
}

function pollLoop() {
	resetTimer();

	var now = Date.now();
	queue = queue.filter((q, i) => {
		if (hasValidDocument(q.iframe)) {
			q.resolve(q.iframe.contentDocument);
			return false;
		}

		if (q.start + q.waitTimeout < now) {
			let err = new Error('Document poll timeout');
			err.code = 'ETIMEOUT';
			q.reject(err);
			return false;
		}

		return true;
	});

	if (queue.length) {
		poll();
	}
}

function resetTimer() {
	if (pollTimer) {
		clearTimeout(pollTimer);
		pollTimer = null;
	}
}
