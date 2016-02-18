/**
 * Re:view Preferences UI
 */
'use strict';
import tr from 'tiny-react';
import {dispatch} from '../app';
import {OPTIONS, UI} from '../action-names';
import {cl} from './utils';

export default tr.component({
    render(props) {
        var disableDonatedOption = !props.donation.made || undefined;
        var autoHideOption;

        if (props.donation.handler) {
            let extCommment = disableDonatedOption
                ? <span>This option is available for <span className={cl('preferences-donate')} onclick={toggleDonationPopup}>donated users</span>.</span>
                : undefined;
            autoHideOption = <div className={cl('preferences-row', 'preferences-row_auto-hide')}>
                <input type="checkbox" id="preferences.autoHide" name="autoHide" value="1" disabled={disableDonatedOption} checked={props.options.autoHide || undefined} onclick={onInput}/>
                <label htmlFor="preferences.autoHide" data-disabled={disableDonatedOption}>Hide Re:view panel</label>
                <span className={cl('preferences-comment')}>Automatically hide and show Re:view top panel. {extCommment}</span>
            </div>
        }

        return <div className={cl('preferences')} oninput={onInput}>
            <div className={cl('preferences-row')}>
                <label htmlFor="preferences.maxViewportWidth">Max viewport width:</label>
                <input type="number" id="preferences.maxViewportWidth" name="maxViewportWidth" value={props.options.maxViewportWidth} min="200" max="2500"/>
                <span className={cl('preferences-comment')}>Max width of viewport in Breakpoints View. Content of views wider than this value will be downscaled.</span>
            </div>
            <div className={cl('preferences-row')}>
                <input type="checkbox" id="preferences.disableAnimations" name="disableAnimations" value="1" checked={props.options.disableAnimations || undefined} onclick={onInput}/>
                <label htmlFor="preferences.disableAnimations">Disable views animation</label>
                <span className={cl('preferences-comment')}>Views appear and disappear instantly when switching between display modes.</span>
            </div>
            {autoHideOption}
        </div>;
    }
});

function onInput(evt) {
    var elem = evt.target;
    dispatch({
        type: OPTIONS.UPDATE,
        key: elem.name,
        value: elem.type === 'checkbox' ?  elem.checked : elem.value
    });
}

function toggleDonationPopup() {
    dispatch({
        type: UI.TOGGLE_POPUP,
        popup: UI.POPUP_DONATE
    });
}
