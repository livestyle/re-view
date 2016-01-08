/**
 * PageSync controller for given list of views:
 * view under cursor is a host, all others are guests
 */
'use strict';

import * as pageSync from 'page-sync';
import extend from 'xtend';

const defaultOptions = {sameParent: true};

export default function(views, options) {
	options = extend(defaultOptions, options || {});
	var state = {
		host: null,
		guests: []
	};
	var controlGuests = event => state.guests.forEach(guest => guest(event));
	var resetHost = host => host.off('data', controlGuests).dispose();

	var contextView = (arg, ctx) => {
		if (arg && arg.getDocument) {
			return arg;
		} else if (ctx && ctx.getDocument) {
			return ctx;
		} else if ('nodeType' in ctx) {
			return viewForElement(views, ctx);
		}
	};

	var addGuest = function(obj) {
		var view = contextView(obj, this);
		return createGuest(view, options).then(guest => {
			// remove old guests for same view
			removeGuest(view);
			state.guests.push(guest);
		});
	};

	var removeGuest = function(view) {
		state.guests = state.guests.filter(g => {
			if (g.view === view) {
				g.dispose();
				return false;
			}
			return true;
		});
	};

	var promoteToHost = function(obj) {
		var view = contextView(obj, this);
		if (state.host && state.host.view === view) {
			// given view is already a host
			return;
		}

		createHost(view, options).then(host => {
			removeGuest(view);
			host.on('data', controlGuests);
			if (state.host) {
				resetHost(state.host);
				addGuest(state.host.view);
			}

			state.host = host;
		});
	};

	// Update view’s PageSync instance after document was updated
	var updateSync = function(arg) {
		var view = contextView(arg, this);
		if (state.host && state.host.view === view) {
			resetHost(state.host);
			state.host = null;
			promoteToHost(view);
		} else {
			// make sure outdated guest does not receives any events before
			// new document is loaded
			removeGuest(view);
			addGuest(view);
		}
	};

	views.forEach(view => {
		// make all views as guests by default
		addGuest(view);

		view.element.addEventListener('mouseenter', promoteToHost);
		view.on('unload', updateSync);
	});

	return {
		destroy() {
			if (state.host) {
				resetHost(state.host);
				state.host = null;
			}
			state.guests.forEach(g => g.dispose());
			state.guests.length = 0;

			views.forEach(view => {
				view.element.removeEventListener('mouseenter', promoteToHost);
				view.off('unload', updateSync);
			});
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

function createHost(view, options) {
	return view.getDocument().then(doc => {
		let host = pageSync.host(doc, options);
		host.view = view;
		return host;
	});
}

function createGuest(view, options) {
	return view.getDocument().then(doc => {
		let guest = pageSync.guest(doc, options);
		guest.view = view;
		return guest;
	});
}