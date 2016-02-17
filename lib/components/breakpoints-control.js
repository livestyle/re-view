/**
 * Toggles Breakpoints picker popup
 */
'use strict';

import tr from 'tiny-react';
import {cl} from './utils';
import {dispatch, getStateValue} from '../app';
import {UI} from '../action-names';

export default tr.component({
    render(props) {
        var all = getStateValue('breakpoints.items', props) || {};
        if (Object.keys(all).length <= 1) {
            return undefined;
        }

        return <div className={cl('picker-control', props.ui.mode !== UI.MODE_BREAKPOINTS && 'picker-control_hidden')} onclick={togglePopup}>
            <span className={cl('picker-control-label')}>{labels[getLabelId(props)]}</span>
        </div>;
    }
});

export const labels = {
    all: 'All breakpoints',
    optimized: 'Optimized list',
    custom: 'Custom list'
};

export function getLabelId(props) {
    var selected = getStateValue('breakpoints.selected', props) || [];
    var all = getStateValue('breakpoints.items', props) || {};
    var optimized = getStateValue('breakpoints.optimized', props) || [];

    if (selected.length === Object.keys(all).length) {
        return 'all';
    }

    if (optimized.length && selected.length === optimized.length && selected.reduce((out, id) => out && optimized.indexOf(id) !== -1, true)) {
        return 'optimized';
    }

    return 'custom';
}

function togglePopup() {
    dispatch({
        type: UI.TOGGLE_POPUP,
        popup: UI.POPUP_BREAKPOINTS
    });
}
