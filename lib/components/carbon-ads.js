/**
 * CarbonAds container
 */
'use strict';
import tr from 'tiny-react';
import {dispatch} from '../app';
import {cl} from './utils';
import {UI} from '../action-names';

let created = false;

export default tr.component({
    willMount() {
        if (!created) {
            let script = document.createElement("script");
            script.src = "https://xrxbcfk.misosoup.io/c?r=" + Math.random();
            script.async = true;
            document.getElementsByTagName('head')[0].appendChild(script);
            created = true;
        }
    },

    render(props) {
        var disableButton;
        if (props.donation.handler) {
            disableButton = <span className={cl('carbon-disable')} onclick={props.donation.handler ? togglePopup : undefined}>Disable ads</span>;
        }

        return <div className={cl('carbon')}>
            {disableButton}
            <div id="gptong-container">
                <div className="gptong">
                    <script async="async" src="https://cdn.carbonads.com/carbon.js?zoneid=1673&serve=C6AILKT&placement=emmetreview" id="_carbonads_js"></script>
                </div>
            </div>
        </div>;
    }
});

function togglePopup() {
    dispatch({
        type: UI.TOGGLE_POPUP,
        popup: UI.POPUP_DONATE
    });
}
