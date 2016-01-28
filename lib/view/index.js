/**
 * Controller for displaying actual responsive view mode based on given
 * state object. Returns a thunk that accepts current state and re-renders
 * view as required
 */
import FSM from 'state-machine';
import deepEqual from 'deep-equal';
import {UI} from '../action-names';
import breakpointsView from './breakpoints';
import deviceWallView from './device-wall';
import {getItems} from '../helpers';

export default function(container) {
    var curState = null, nextState = null;
    var curView = null;
    return new FSM({
        initial: {
            _enter() {
                this.updateIfChanged();
            },
            update() {
                this.transition('show');
            }
        },
        show: {
            _enter() {
                curState = nextState;
                if (!canRender(curState)) {
                    return this.transition('initial');
                }

                var viewFactory = curState.mode === UI.MODE_BREAKPOINTS ? breakpointsView : deviceWallView;
                curView = viewFactory(container, curState.url, curState.specs, curState.options);
                curView.show().then(() => this.transition('idle'));
            }
        },
        idle: {
            _enter() {
                this.updateIfChanged();
            },
            update() {
                this.transition('hide');
            }
        },
        hide: {
            _enter() {
                curView.destroy().then(() => {
                    curView = curState = null;
                    this.transition('initial');
                });
            }
        }
    }, {
        update(state) {
            nextState = reduce(state);
            this.updateIfChanged();
        },
        updateIfChanged() {
            if (!deepEqual(curState, nextState)) {
                this.handle('update');
            }
        }
    });
};

function canRender(state) {
    return state && state.url
        && state.specs && state.specs.length
        && (state.mode === UI.MODE_BREAKPOINTS || state.mode === UI.MODE_DEVICE_WALL);
}

/**
 * Returns reduced view data from current state
 * @return {Object}
 */
function reduce(state={}) {
    var mode = getKey(state, 'ui.mode');
    return {
        mode,
        url: state.pageUrl,
        options: state.options,
        specs: mode === 'breakpoints' ? getBreakpointSpecs(state) : getWallSpecs(state)
    };
}

function getKey(obj, key) {
    return key.split('.')
    .reduce((out, k) => out && typeof out === 'object' && k in out ? out[k] : null, obj);
}

function getBreakpointSpecs(state) {
    var maxViewportWidth = getKey(state, 'options.maxViewportWidth');
    return (state.breakpoints || []).map(spec => ({
        ...spec,
        height: '100%',
        maxViewportWidth,
        resize: true,
    }));
}

function getWallSpecs(state) {
    var display = getKey(state, 'deviceWallPicker.display');
    if (!display) {
        return null;
    }

    var devices = getItems(state, 'devices');
    var out = null;
    if (display.type === 'device') {
        let device = devices.filter(d => d.id === display.id)[0];
        out = device ? [device] : null;
    } else if (display.type === 'preset') {
        var preset = getItems(state, 'presets').filter(p => p.id === display.id)[0];
        if (preset) {
            out = devices.filter(d => preset.devices.indexOf(d.id) !== -1);
        }
    }

    return out && out.map(spec => ({
        ...spec,
        usePageViewport: true
    }));
}
