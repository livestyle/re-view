/**
 * Breakpoimts list component
 */
import tr from 'tiny-react';
import List from './list';
import {dispatch, getStateValue} from '../app';
import {BREAKPOINTS} from '../action-names';

export default tr.component({
    render(props) {
        var selected = getStateValue('breakpoints.selected');
        var all = getStateValue('breakpoints.items');
        var items = Object.keys(all).map(id => ({
            id,
            title: all[id].query,
            info: all[id].width + 'px',
            selected: selected.indexOf(id) !== -1
        }));

        return <List items={items} mode="pick-many" onItemClick={onClick} />;
    }
});

function onClick(evt) {
    evt.preventDefault();
    var selected = getStateValue('breakpoints.selected');
    dispatch({
        type: selected.indexOf(this.id) === -1 ? BREAKPOINTS.ADD_SELECTED : BREAKPOINTS.REMOVE_SELECTED,
        item: this.id
    });
}
