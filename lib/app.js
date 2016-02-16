'use strict';

import {createStore, applyMiddleware} from 'redux';
import createLogger from 'redux-logger';
import reducers from './reducers';
import devices from './devices';
import presets from './presets';
import deviceWallFsmFactory from './device-wall-fsm';
import {UI} from './action-names';

var storeFactory = createStore;
if (process.env.NODE_ENV !== 'production') {
    storeFactory = applyMiddleware(createLogger())(storeFactory);
}

export const store = storeFactory(reducers, {
    devices,
    presets,
    pageUrl: null,
    ui: {
        mode: UI.MODE_BREAKPOINTS,
        popup: null
    },
    breakpoints: [],
    deviceWallPicker: {
        state: 'initial',
        stateData: {},
        display: {
            type: 'preset',
            id: 'apple-phones'
        }
    },
    donation: {
        made: false
    },
    options: {
        autoHide: false,
        maxViewportWidth: 600,
        itemMargin: 20,
        activateKey: 16 // Shift key
    },
    user: {}
});

export function dispatch(data) {
    return store.dispatch(data);
}

export function subscribe(onChange, select) {
    let currentState;
    let handler = () => {
        let nextState = store.getState();
        if (typeof select === 'function') {
            nextState = select(nextState);
        }
        if (nextState !== currentState) {
            currentState = nextState;
            onChange(currentState);
        }
    };

    return store.subscribe(handler);
}

export function getState() {
    return store.getState();
}

export function getStateValue(key, state=getState()) {
    return key.split('.').reduce((out, part) => out != null ? out[part] : out, state);
}

export const deviceWallFSM = deviceWallFsmFactory(dispatch, getStateValue);
subscribe(() => deviceWallFSM.transition(getStateValue('deviceWallPicker.state')));
