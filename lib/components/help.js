/**
 * Re:view help popup
 */
'use strict';
import tr from 'tiny-react';
import {dispatch} from '../app';
import {cl} from './utils';

export default tr.component({
    render(props) {
        return <div className={cl('help')}>
            <section className={cl('help-section')}>
                <p>Emmet Re:view is a tool for testing responsive design. It displays your current web-page in a series of views so you can see how your design behaves on different screen resolutions.</p>
                <p>All views are <em>syncronized</em>: you can scroll, click, fill-in forms in one view and get instant feedback in all others.</p>
            </section>
            <section className={cl('help-column-list')}>
                <section className={cl('help-column')}>
                    <h3 className={cl('help-title')}>Breakpoints View</h3>
                    <p>The Breakpoints View extracts all CSS media queries (breakpoints) from current page and displays view for each breakpoint.</p>
                    <p>In this mode, you can resize views horizontally with the right-edge handle. Double-click on this handle to restore original size.</p>
                </section>
                <section className={cl('help-column')}>
                    <h3 className={cl('help-title')}>Device Wall</h3>
                    <p>The Device Wall provides a birds-eye overview of how your web-page may look on different devices. Each view is sized and overrides user-agent according to real device specs.</p>
                    <p>In this view, hold down <strong>Shift key</strong> to enter <em>control mode</em> (screen edge will glow green). In control mode:</p>
                    <ul className={cl('help-list')}>
                        <li className={cl('help-list-item')}>use mouse wheel to zoom in and out;</li>
                        <li className={cl('help-list-item')}>drag view to pan around.</li>
                    </ul>
                    <p>If you don’t see glowing screen edge while holding Shift key, click outside device view and try again.</p>
                </section>
            </section>
            <footer className={cl('help-footer')}>
                <a href="https://twitter.com/emmetio" target="_blank">Twitter</a>
                <a href="https://github.com/emmetio/re-view" target="_blank">GitHub</a>
                <a href="https://github.com/emmetio/re-view/issues" target="_blank">Submit an issue</a>
                <a href="mailto:info@emmet.io">Mail support</a>
            </footer>
        </div>;
    }
});
