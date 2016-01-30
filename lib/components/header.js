/**
 * Main Re:View UI component
 */
'use strict';

import tr from 'tiny-react';
import DeviceWallControl from './device-wall-control';
import DeviceWallPopup from './device-wall-picker';
import ModeToggler from './mode-toggler';
import Preferences from './preferences';
import {UI} from '../action-names';
import {dispatch, getState} from '../app';
import {cl} from './utils';

export default tr.component({
    render(props) {
        var autoHide = props.purchased && props.options.autoHide;
        var forceOverlay = containsPopup(props);
        return <div className={cl('header', autoHide && 'header_auto-hide', forceOverlay && 'header_force-overlay')} onclick={resetPopup}>
            <div className={cl('header-wrap')}>
                <h1 className={cl('logo')}>Re:view <span className={cl('logo-version')}>2</span></h1>

                <div className={cl('header-content')}>
                    <ModeToggler mode={props.ui.mode} />
                    <DeviceWallControl {...props} />
                    {props.ui.popup === UI.POPUP_DEVICE_WALL ? <DeviceWallPopup {...props} /> : undefined}
                </div>

                <div className={cl('header-icons')}>
                    <Preferences {...props} />
                    <i className={cl('icon', 'icon_help')}></i>
                </div>
            </div>
        </div>;
    }
});

function resetPopup(evt) {
    if (containsPopup() && evt.target === this) {
        dispatch({type: UI.RESET_POPUP});
    }
}

function containsPopup(props=getState()) {
    return !!props.ui.popup;
}
