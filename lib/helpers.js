'use strict';

/**
 * Returns concatenated list of unique user and default items for given `key`
 * in `state` object.
 * @param  {String} key
 * @param  {Object} state
 * @return {Array}
 */
export function getItems(state, key) {
    var lookup = {};
    var userData = state.user || {};
    var userItems = (userData[key] || []).map(item => ({
        ...item,
        userDefined: true
    }));

    return [].concat(userItems, state[key] || [])
    // keep unique items only
    .filter(item => item.id in lookup ? false : lookup[item.id] = true)
    .sort(sortByTitle);
}

/**
 * A default function for sorting array of items by `title` property
 * @param  {Object} a
 * @param  {Object} b
 * @return {Number}
 */
export function sortByTitle(a, b) {
    return a.title === b.title ? 0 : (a.title > b.title ? 1 : -1);
}
