/**
 * Toggles Device Wall popup display
 */
'use strict';

import tr from 'tiny-react';
import {cl} from './utils';
import {dispatch, getItems, getStateValue} from '../app';
import {DEVICE_WALL} from '../action-names';

export default tr.component({
    render(props) {
        return <div className={cl('picker')} onclick={togglePopup}>
            <span className={cl('picker-label')}>{getLabel(props) || '...'}</span>
        </div>;
    }
});

function togglePopup() {
    dispatch({type: DEVICE_WALL.TOGGLE_VISIBILITY});
}

function getLabel(props) {
    var selected = getStateValue('deviceWallPicker.display', props);
    if (!selected) {
        return null;
    }

    var item = getItems(selected.type === 'preset' ? 'presets' : 'devices', props)
    .filter(item => item.id === selected.id)[0];
    return item && item.title;
}
