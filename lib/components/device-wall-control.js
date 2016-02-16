/**
 * Toggles Device Wall popup display
 */
'use strict';

import tr from 'tiny-react';
import {cl} from './utils';
import {dispatch, getStateValue} from '../app';
import {getItems} from '../helpers';
import {UI} from '../action-names';

export default tr.component({
    render(props) {
        return <div className={cl('picker-control', props.ui.mode !== UI.MODE_DEVICE_WALL && 'picker-control_hidden')} onclick={togglePopup}>
            <span className={cl('picker-control-label')}>{getLabel(props) || '...'}</span>
        </div>;
    }
});

function togglePopup() {
    dispatch({
        type: UI.TOGGLE_POPUP,
        popup: UI.POPUP_DEVICE_WALL
    });
}

function getLabel(props) {
    var selected = getStateValue('deviceWallPicker.display', props);
    if (!selected) {
        return null;
    }

    var item = getItems(props, selected.type === 'preset' ? 'presets' : 'devices')
    .filter(item => item.id === selected.id)[0];
    return item && item.title;
}
