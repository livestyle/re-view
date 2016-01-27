/**
 * Async view mounter.
 * If all views (iframes) will be mounted simultaneously, the main tread will
 * be locked for a long time until all views/iframes are parsed and ready.
 * This module will mount given view list one-by-one 
 */
'use strict';

export default function(views) {
	return views.reduce((r, v) => r.then(() => v.mount()), Promise.resolve());
};