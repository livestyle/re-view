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
                    return resolve();
                }

                if (!stopped) {
                    setTimeout(run, 30);
                }
            };
            run();
        }),
        waitForLoad(iframe),
        rejectByTimeout()
    ])
    .then(() => stopped = true)
    .catch(err => {
        stopped = true;
        return Promise.reject(err);
    });
};

function check(iframe) {
    try {
        let doc = iframe.contentDocument;
        return doc && doc.URL !== 'about:blank';
    } catch(e) {}
}

function waitForLoad(iframe) {
    return new Promise(resolve => {
        var onload = () => {
            iframe.removeEventListener('load', onload);
            resolve();
        };
        iframe.addEventListener('load', onload);
    });
}

function rejectByTimeout() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            let err = new Error('Window available timeout');
            err.code = 'EWINDOWTIMEOUT';
            reject(err);
        }, 30000);
    });
}
