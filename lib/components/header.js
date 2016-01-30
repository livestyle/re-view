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

const firstRenderThreshold = 2000;

export default tr.component({
    firstRender: null,
    render(props) {
        if (this.firstRender === null) {
            this.firstRender = Date.now();
        }
        // Notify about enabled auto-hide option only if component was rendered
        // during start-up. In all other cases (for example, when user toggles
        // this option in preferences) auto-hide notification look awkward
        var notifyAutoHide = Date.now() - this.firstRender < firstRenderThreshold;
        var autoHide = props.patron && props.options.autoHide;
        var forceOverlay = containsPopup(props);
        var mainClassNames = [
            'header',
            autoHide && 'header_auto-hide',
            autoHide && notifyAutoHide && 'header_notify-auto-hide',
            forceOverlay && 'header_force-overlay'
        ];
        return <div className={cl(mainClassNames)} onclick={resetPopup}>
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
