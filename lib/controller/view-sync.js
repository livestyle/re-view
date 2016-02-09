/**
 * PageSync controller for given list of views:
 * view under cursor is a host, all others are guests
 */
'use strict';

import pageSync from 'page-sync';
const defaultOptions = {sameParent: true};

export default function(views, options={}) {
	options = {...defaultOptions, ...options};

	var pageSyncItems = new Array(views.length);
	var promoteToHost = function() {
		var view = viewForElement(views, this);
		var viewIx = views.indexOf(view);
		pageSyncItems.forEach((item, ix) => item && item(ix === viewIx ? 'host' : 'guest'));
	};

	var onMessage = evt => {
		if (evt.data.ns === 'page-sync' && evt.data.name === 'event') {
			pageSyncItems.forEach(item => item('event', evt.data.data));
		}
	};

	views.forEach((view, ix) => {
		view.element.addEventListener('mouseenter', promoteToHost);
		view.element.addEventListener('mousewheel', promoteToHost);
		view.available().then(() => {
			if (pageSyncItems) {
				var wnd = view.iframe.contentWindow;
				wnd.addEventListener('message', onMessage);
				pageSyncItems[ix] = pageSync(wnd);
			}
		});
	});

	return {
		destroy() {
			views.forEach(view => {
				view.element.removeEventListener('mouseenter', promoteToHost);
				view.element.removeEventListener('mousewheel', promoteToHost);
				view.iframe && view.iframe.contentWindow.removeEventListener('message', onMessage);
			});

			pageSyncItems.forEach(item => item && item.dispose());
			views = pageSyncItems = options = null;
		}
	};
};

function viewForElement(views, elem) {
	for (var i = 0, il = views.length; i < il; i++) {
		if (views[i].element === elem) {
			return views[i];
		}
	}
}
