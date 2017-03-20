/**
 * CarbonAds container
 */
'use strict';
import tr from 'tiny-react';
import {dispatch} from '../app';
import {cl} from './utils';
import {UI, DONATION} from '../action-names';

const fallbackDomain = 'sup.emmet.io';
const carbonUrl = 'https://cdn.carbonads.com/carbon.js?zoneid=1673&serve=C6AILKT&placement=emmetreview';
const fallbackUrl = carbonUrl.replace(/^(\w+:\/\/)([^\/]+)/, '$1' + fallbackDomain) + '&cd=' + fallbackDomain;

export default tr.component({
    render(props) {
        const useFallback = !!props.donation.fallback;
        let disableButton;

        if (props.donation.handler) {
            disableButton = <span className={cl('carbon-disable')} onclick={props.donation.handler ? togglePopup : undefined}>Disable ads</span>;
        }

        return <div className={cl('carbon')}>
            {disableButton}
            <div id="gptong-container">
                <div className="gptong">
                    <script key={String(useFallback)} async="async" src={!useFallback ? carbonUrl : fallbackUrl} id="_carbonads_js" onerror={!useFallback ? enableFallback : null}></script>
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

function enableFallback() {
    dispatch({ type: DONATION.ENABLE_ADS_FALLBACK });
}
