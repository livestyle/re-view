'use strict';

import tr from 'tiny-react';
import headerUI from './lib/components/header';
import viewUI from './lib/view';
import findBreakpoints from './lib/find-breakpoints';
import {store, subscribe, dispatch, getStateValue} from './lib/app';
import {createElement, removeElement} from './lib/utils';
import {APP, UI, DONATION} from './lib/action-names';

/**
 * Creates complete Re:view UI and returns its parent element
 * @return {Element}
 */
export default function(container, options={}) {
    if (options.initialState) {
        dispatch({
            type: APP.MERGE_STATE,
            state: options.initialState
        });
    }

    var root = createElement('div', 'emmet-re-view');
    var header = tr.render(headerUI, store.getState());
    var content = createElement('div', 'emmet-re-view__content');
    var view = viewUI(content, options);
    root.appendChild(header.target);
    root.appendChild(content);

    var update = function(state=store.getState()) {
        header.update(state);
        view.update(state);
    };

    if (container) {
        container.appendChild(root);
        update();
    }

    var unsubscribe = subscribe(update);
    return {
        element: root,
        update,
        destroy() {
            view.destroy();
            removeElement(root);
            unsubscribe();
        }
    };
}

export {subscribe, dispatch, getStateValue, findBreakpoints, UI, APP, DONATION};
