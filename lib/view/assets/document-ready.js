/**
 * Check if document in given view becomes available for interaction.
 * This module is waiting for `document-ready` event coming from PageSync
 * controller
 */
'use strict';

export default function(view) {
    return new Promise((resolve, reject) => {
        var onMessage = evt => {
            var data = evt.data || {};
            if (data.ns === 'page-sync' && data.name === 'document-ready' && data.documentId === view.id) {
                window.removeEventListener('message', onMessage);
                resolve(data.data);
    		}
        };

        setTimeout(() => {
            window.removeEventListener('message', onMessage);
            let err = new Error('Document load timeout');
            err.code = 'ETIMEOUT';
            reject(err);
        }, 30000);

        window.addEventListener('message', onMessage);
        view._pageSync.checkReady();
    });
};
