/**
 * Donation popup
 */
'use strict';
import tr from 'tiny-react';
import {cl} from './utils';

export default tr.component({
    render(props) {
        return <div className={cl('donate')}>
            <p>Hi, my name is <a href="http://twitter.com/chikuyonok" target="_blank">Sergey Chikuyonok</a>. I love to create tools that helps thousands of web-developers worldwide build web-sites a bit easier. But creating great open-source tools requires a lot of effort. I’ve placed ads to make further project support and improvement more sustainable.</p>
            <p>Ads takes space and may distract some user. For a small one-time donation you can disable ads and unlock option to auto-hide top panel to get even more vertical space and cleaner UI. By making a donation, you help further project maintenance <em>a lot</em>.</p>
            <p className={cl('donate-controls')}>
                <button className={cl('button', 'button_donate')} onclick={props.donation.handler}>Donate {props.donation.amount}</button>
            </p>
            <p className={cl('donate-comment')}>Donations are securely processed via <a href="https://wallet.google.com" target="_blank">Google Wallet</a> service.</p>
        </div>;
    }
});
