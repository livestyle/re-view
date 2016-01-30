/**
 * Utility functions
 */
'use strict';

/**
 * Generates prefixed class names
 * @param  {Array|String} ...names
 * @return {String}
 */
export function cl(...names) {
    if (names.length === 1 && Array.isArray(names[0])) {
        names = names[0];
    }
    return names.filter(Boolean).map(n => `emmet-re-view__${n}`).join(' ');
}
