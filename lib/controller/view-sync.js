/**
 * PageSync controller for given list of views:
 * view under cursor is a host, all others are guests
 */
'use strict';

import pageSync from 'page-sync';
const defaultOptions = {sameParent: true};

export default function(views, options={}) {
	options = {...defaultOptions, ...options};

	var promoteToHost = function() {
		var hostView = viewForElement(views, this);
		views.forEach(view => view.sync(view === hostView ? 'host' : 'guest'));
	};

	var onMessage = evt => {
		if (evt.data.ns === 'page-sync' && evt.data.name === 'event') {
			views.forEach(view => view.sync('event', evt.data.data));
		}
	};

	views.forEach(view => {
		view.element.addEventListener('mouseenter', promoteToHost);
		view.element.addEventListener('mousewheel', promoteToHost);
	});
	window.addEventListener('message', onMessage);

	return {
		destroy() {
			views.forEach(view => {
				view.element.removeEventListener('mouseenter', promoteToHost);
				view.element.removeEventListener('mousewheel', promoteToHost);
			});
			window.removeEventListener('message', onMessage);
			views = options = onMessage = null;
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
