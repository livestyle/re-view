/**
 * Breakpoints picker popup
 */
'use strict';
import tr from 'tiny-react';
import BreakpointsList from './breakpoints-list';
import {labels, getLabelId} from './breakpoints-control';
import {cl} from './utils';
import {getStateValue, dispatch} from '../app';
import {BREAKPOINTS} from '../action-names';

export default tr.component({
    render(props={}) {
        return <div className={cl('breakpoints-picker')}>
            <h2 className={cl('picker-section-title')}>Pick breakpoints to display</h2>
            {renderToggler(props)}
            <BreakpointsList {...props} />
        </div>
    }
});

function renderToggler(props) {
    var modes = ['all'];
    var optimized = getStateValue('breakpoints.optimized', props) || [];
    var curLabel = getLabelId(props);
    if (optimized.length) {
        modes.unshift('optimized');
    }

    return <ul className={cl('switcher')}>
        {modes.map(mode => <li className={cl('switcher-item', (curLabel === mode) && 'switcher-item_selected')} data-mode={mode} onclick={onClick}>
            <span className={cl('switcher-label')}>{labels[mode]}</span>
        </li>)}
    </ul>;
}

function onClick(evt) {
    if (this.className.indexOf('_selected') !== -1) {
        return;
    }

    var items;
    var mode = this.getAttribute('data-mode');
    if (mode === 'all') {
        items = Object.keys(getStateValue('breakpoints.items'));
    } else if (mode === 'optimized') {
        items = getStateValue('breakpoints.optimized');
    }

    if (items) {
        dispatch({type: BREAKPOINTS.SET_SELECTED, items});
    }
}
