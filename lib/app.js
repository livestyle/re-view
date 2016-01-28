'use strict';

import {createStore, applyMiddleware} from 'redux';
import createLogger from 'redux-logger';
import reducers from './reducers';
import devices from './devices';
import presets from './presets';
import deviceWallFsmFactory from './device-wall-fsm';

const logger = createLogger();
const createStoreWithMiddleware = applyMiddleware(logger)(createStore);

export const store = createStoreWithMiddleware(reducers, {
    devices,
    presets,
    pageUrl: 'inner.html',
    ui: {
        mode: 'breakpoints'
    },
    breakpoints: [
        {width: 213},
        {width: 320},
        {width: 360},
        {width: 375},
        {width: 400},
        {width: 720}
    ],
    deviceWallPicker: {
        state: 'initial',
        stateData: {},
        visible: false,
        display: {
            type: 'preset',
            id: 'apple-phones'
        }
    },
    options: {
        maxViewportWidth: 600,
        itemMargin: 20,
        activateKey: 16 // Shift key
    },
    user: {
        devices: [{
            "id": "942ea870-c47d-11e5-b11f-03099e8ba412",
            "title": "AAA my dev",
            "width": "200",
            "height": "300",
            "user-agent": "Mozilla/5.0 (Linux; Android 4.0; LG-E975 Build/IMM76L) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.166 Mobile Safari/535.19"
        }],
        presets: [{
            "id": "d2ee7d00-c479-11e5-abe8-abdaf6488318",
            "title": "Sample",
            "devices": [
                "apple-ipad",
                "amazon-kindle-fire-hdx-8-9"
            ]
        }]
    }
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

export function getStateValue(key, state=store.getState()) {
    return key.split('.').reduce((out, part) => out != null ? out[part] : out, state);
}

export const deviceWallFSM = deviceWallFsmFactory(dispatch, getStateValue);
subscribe(() => deviceWallFSM.transition(getStateValue('deviceWallPicker.state')));
