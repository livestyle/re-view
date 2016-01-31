/**
 * Toolbar icon + content
 */
'use strict';
import tr from 'tiny-react';
import {dispatch} from '../app';
import {UI} from '../action-names';
import {cl} from './utils';

export default tr.component({
    render(props, children) {
        return <div className={cl('toolbar-item', props.selected && 'toolbar-item_active')} data-name={props.name}>
            <i className={cl('toolbar-item-icon')} data-name={props.name} onclick={toggleDisplay}></i>
            <div className={cl('toolbar-item-content')}>
                {children}
            </div>
        </div>;
    }
});

function toggleDisplay(evt) {
    dispatch({
        type: UI.TOGGLE_POPUP,
        popup: this.getAttribute('data-name')
    });
}
