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
	var docs = new Array(views.length);
	var state = {
		hostView: null,
		host: null,
		guests: []
	};

	var controlGuests = event => state.guests.forEach(guest => guest(event));
	var resetHost = () => {
		if (state.host) {
			state.host.off('data', controlGuests).dispose();
			state.host = null;
		}
	};
	var loadDocument = view => {
		view.getDocument().then(doc => {
			if (!state) {
				return;
			}

			let ix = views.indexOf(view);
			if (ix !== -1) {
				docs[ix] = doc;
				assignDoc(doc);
			}
		});
	};

	var removeGuest = doc => {
		state.guests = state.guests.filter(g => {
			if (g.document === doc) {
				g.dispose();
				return false;
			}
			return true;
		});
	};

	var assignDoc = doc => {
		var ix = doc ? docs.indexOf(doc) : -1;
		if (!state || ix === -1) {
			return;
		}

		removeGuest(doc);
		if (views[ix] === state.hostView) {
			resetHost();
			state.host = pageSync.host(doc, options).on('data', controlGuests);
		} else {
			state.guests.push(pageSync.guest(doc, options));
		}
	};

	var promoteToHost = function() {
		var view = viewForElement(views, this);
		if (!view || !state || state.hostView === view) {
			return;
		}

		var curIx = views.indexOf(view);
		var oldIx = state.hostView ? views.indexOf(state.hostView) : -1;

		state.hostView = view;
		resetHost();
		assignDoc(docs[curIx]);
		assignDoc(docs[oldIx]);
	};

	var onUnload = function() {
		var ix = views.indexOf(this);
		if (ix !== -1) {
			if (state.hostView === this) {
				resetHost();
			} else {
				removeGuest(docs[ix]);
			}
			docs[ix] = null;
			loadDocument(this);
		}
	};

	views.forEach(view => {
		view.element.addEventListener('mouseenter', promoteToHost);
		view.on('unload', onUnload);
		view.isMounted ? loadDocument(view) : view.once('mount', () => loadDocument(view));
	});

	return {
		destroy() {
			views.forEach(view => {
				view.element.removeEventListener('mouseenter', promoteToHost);
				view.off('unload', onUnload);
			});

			resetHost();
			state.guests.forEach(g => g && g.dispose());
			state.hostView = state.host = state.guests = null;
			state = docs = views = options = null;
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