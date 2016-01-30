/**
 * Re:view Preferences UI
 */
'use strict';
import tr from 'tiny-react';
import {dispatch} from '../app';
import {UI} from '../action-names';
import {cl} from './utils';

export default tr.component({
    render(props) {
        return <div className={cl('preferences', props.ui.popup === UI.POPUP_PREFERENCES && 'preferences_active')}>
            <i className={cl('preferences-icon')} onclick={togglePopup}></i>
            <div className={cl('preferences-content')}>
                <div className={cl('preferences-row')}>
                    <label htmlFor="preferences.maxViewportWidth">Max viewport width:</label>
                    <input type="number" id="preferences.maxViewportWidth" name="maxViewportWidth" value={props.options.maxViewportWidth}/>
                    <span className={cl('preferences-comment')}>Max width of viewport in Breakpoints View. Contents of viewports largar than this value will be downscaled.</span>
                </div>
                <div className={cl('preferences-row')}>
                    <input type="checkbox" id="preferences.autoHide" name="autoHide" value="1" disabled checked={props.options.autoHide || undefined}/>
                    <label htmlFor="preferences.autoHide" data-disabled="disabled">Hide Re:view panel</label>
                    <span className={cl('preferences-comment')}>Automatically hide and show Re:view top panel. This option is available for patrons.</span>
                </div>
            </div>
        </div>;
    }
});

function togglePopup() {
    dispatch({
        type: UI.TOGGLE_POPUP,
        popup: UI.POPUP_PREFERENCES
    });
}
