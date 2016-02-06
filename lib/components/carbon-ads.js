/**
 * CarbonAds container
 */
'use strict';
import tr from 'tiny-react';
import {dispatch} from '../app';
import {cl} from './utils';

export default tr.component({
    render(props) {
        return <div className={cl('carbon')}>
            <script async="async" src="//cdn.carbonads.com/carbon.js?zoneid=1673&serve=C6AILKT&placement=emmetio" id="_carbonads_js"></script>
        </div>;
    }
});
