/**
 * Check if document in given iframe becomes available.
 * This module is waiting for `document-ready` event coming from PageSync
 * controller
 */
'use strict';

export default function(iframe) {
    return Promise.race([waitForMessage(iframe), rejectByTimeout()]);
};

function waitForMessage(iframe) {
	return new Promise(resolve => {
        let wnd = iframe.contentWindow;
		let onMessage = evt => {
            if (evt.data && evt.data.ns === 'page-sync' && evt.data.name === 'document-ready') {
                wnd.removeEventListener('message', onMessage);
                resolve(evt.data.data);
    		}
		};
		wnd.addEventListener('message', onMessage);
	});
}

function rejectByTimeout() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            let err = new Error('Document load timeout');
            err.code = 'ETIMEOUT';
            reject(err);
        }, 30000);
    });
}
