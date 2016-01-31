/**
 * Re:view Preferences UI
 */
'use strict';
import tr from 'tiny-react';
import {dispatch} from '../app';
import {OPTIONS} from '../action-names';
import {cl} from './utils';

export default tr.component({
    render(props) {
        var disablePatronOption = !props.patron || undefined;
        return <div className={cl('preferences')} oninput={onInput}>
            <div className={cl('preferences-row')}>
                <label htmlFor="preferences.maxViewportWidth">Max viewport width:</label>
                <input type="number" id="preferences.maxViewportWidth" name="maxViewportWidth" value={props.options.maxViewportWidth} min="200" max="2500"/>
                <span className={cl('preferences-comment')}>Max width of viewport in Breakpoints View. Content of views wider than this value will be downscaled.</span>
            </div>
            <div className={cl('preferences-row')}>
                <input type="checkbox" id="preferences.autoHide" name="autoHide" value="1" disabled={disablePatronOption} checked={props.options.autoHide || undefined} onclick={onInput}/>
                <label htmlFor="preferences.autoHide" data-disabled={disablePatronOption}>Hide Re:view panel</label>
                <span className={cl('preferences-comment')}>Automatically hide and show Re:view top panel. This option is available for patrons.</span>
            </div>
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
