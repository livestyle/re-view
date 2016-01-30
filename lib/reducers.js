'use strict';

import {combineReducers} from 'redux';
import {DEVICE_WALL, USER, UI} from './action-names';
import {getItems} from './helpers';

const keyReducers = combineReducers({
    devices: noop,
    presets: noop,
    breakpoints: noop,
    pageUrl: noop,
    purchased: noop,
    options: noop,
    deviceWallPicker,
    ui,
    user
});

export default function(state, action) {
    return validateDeviceWallSelectedItem(keyReducers(state, action));
};

function noop(state={}) {
    return state;
}

function deviceWallPicker(state={}, action) {
    switch (action.type) {
        case DEVICE_WALL.SET_SELECTED:
            if (!state.display || state.display.id !== action.item.id) {
                state = {...state, display: action.item};
            }
            return state;

        case DEVICE_WALL.SET_STATE:
            return {
                ...state,
                state: action.state,
                stateData: action.data
            };

        case DEVICE_WALL.TOGGLE_VISIBILITY:
            return {
                ...state,
                visible: !state.visible
            };

        case UI.SET_MODE:
        case UI.RESET_POPUP:
            if (state.visible) {
                return {
                    ...state,
                    visible: !state.visible
                };
            }
            break;
    }

    return state;
}

function user(state={}, action) {
    switch (action.type) {
        case USER.SAVE_DEVICE:
            let devices = removeItem(state.devices || [], action.device.id);
            devices.push(action.device);
            return {...state, devices};

        case USER.REMOVE_DEVICE:
            return {
                ...state,
                devices: removeItem(state.devices || [], action.id)
            };

        case USER.SAVE_PRESET:
            let presets = removeItem(state.presets || [], action.preset.id);
            presets.push(action.preset);
            return {...state, presets};

        case USER.REMOVE_PRESET:
            return {
                ...state,
                presets: removeItem(state.presets || [], action.id)
            };
    }

    return state;
}

function ui(state={}, action) {
    switch (action.type) {
        case UI.SET_MODE:
            if (action.mode && action.mode !== state.mode) {
                state = {...state, mode: action.mode};
            }
            return state;
    }

    return state;
}

function removeItem(items, id) {
    return items.filter(item => item.id !== id);
}

/**
 * Ensures `deviceWallPicker.display` item always exists and points to valid
 * device or preset. If not, find most suitable
 * @param  {Object} state
 * @return {Object}
 */
function validateDeviceWallSelectedItem(state={}) {
    var curItem = state.deviceWallPicker && state.deviceWallPicker.display;
    var lookupKey = 'presets';

    if (curItem) {
        // make sure it points to existing item
        lookupKey = curItem.type === 'device' ? 'devices' : 'presets';
        let items = getItems(state, lookupKey);
        if (!items.some(item => item.id === curItem.id)) {
            curItem = null;
        }
    }

    // no valid item found, update state
    if (!curItem) {
        // pick first preset by default
        state = {
            ...state,
            deviceWallPicker: {
                ...state.deviceWallPicker,
                display: {
                    type: lookupKey === 'presets' ? 'preset' : 'device',
                    id: getItems(state, lookupKey)[0].id
                }
            }
        };
    }

    return state;
}
