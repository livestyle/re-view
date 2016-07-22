/**
 * Main Re:View UI component
 */
'use strict';

import tr from 'tiny-react';
import BreakpointsControl from './breakpoints-control';
import DeviceWallControl from './device-wall-control';
import BreakpointsPopup from './breakpoints-picker';
import DeviceWallPopup from './device-wall-picker';
import ModeToggler from './mode-toggler';
import ToolbarItem from './toolbar-item';
import Preferences from './preferences';
import Help from './help';
import CarbonAds from './carbon-ads';
import Donate from './donate';
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
        var autoHide = props.donation.made && props.options.autoHide;
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
                    <div className={cl('picker-control-placeholder')}>
                        <BreakpointsControl {...props} />
                        <DeviceWallControl {...props} />
                    </div>
                    {props.ui.popup === UI.POPUP_DEVICE_WALL ? <DeviceWallPopup {...props} /> : undefined}
                    {props.ui.popup === UI.POPUP_BREAKPOINTS ? <BreakpointsPopup {...props} /> : undefined}
                    {props.ui.popup === UI.POPUP_DONATE ? <Donate {...props} /> : undefined}
                </div>
                {!props.donation.made ? <CarbonAds {...props}/> : undefined}
                <div className={cl('header-icons')}>
                    <ToolbarItem name={UI.POPUP_PREFERENCES} selected={props.ui.popup === UI.POPUP_PREFERENCES}>
                        <Preferences {...props} />
                    </ToolbarItem>
                    <ToolbarItem name={UI.POPUP_HELP} selected={props.ui.popup === UI.POPUP_HELP}>
                        <Help {...props} />
                    </ToolbarItem>
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
