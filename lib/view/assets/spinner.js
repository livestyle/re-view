/**
 * Creates loading spinner
 */
'use strict';

export default function() {
    var root = document.createElement('div');
    root.className = 'emmet-re-view__spinner';
    var i = 8;
    while (i--) {
        root.appendChild(document.createElement('div'));
    }
    return root;
}
