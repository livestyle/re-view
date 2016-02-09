/**
 * Check when given iframe `contentWindow` becomes available.
 * For a newly creates iframe there are at least 3 stages of `contentWindow`
 * state:
 * — null: iframe is not in document tree
 * — WindowProxy of 'about:blank' page: iframe was just added to document tree
 * — WindowProxy for target page: this is what we are looking for
 */
'use strict';

export default function(iframe) {
    var stopped = false;
    return Promise.race([
        new Promise(resolve => {
            var run = () => {
                if (check(iframe)) {
                    return resolve(iframe.contentWindow);
                }

                if (!stopped) {
                    setTimeout(run, 30);
                }
            };
            run();
        }),
        rejectByTimeout()
    ])
    .catch(err => {
        stopped = true;
        return Promise.reject(err);
    });
};

function check(iframe) {
    var wnd = iframe.contentWindow;
    if (!wnd) {
        return false;
    }

    try {
        let doc = iframe.contentDocument;
        return doc && doc.URL !== 'about:blank';
    } catch(e) {
        // thrown exceptions most likely means cross-origin issue:
        // there’s non-empty, non-default document, which means `contentWindow`
        // points to valid WindowProxy
        return true;
    }
}

function rejectByTimeout() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            let err = new Error('Window available timeout');
            err.code = 'EWINDOWTIMEOUT';
            reject(err);
        }, 1000);
    });
}
