/**
 * PageSync controller for given list of views:
 * view under cursor is a host, all others are guests
 */
'use strict';

import * as pageSync from 'page-sync';
import extend from 'xtend';

const defaultOptions = {sameParent: true};

export default function(views, options) {
	var state = {};
	var controlGuests = event => state.guests && state.guests.forEach(guest => guest(event));
	options = extend(defaultOptions, options || {});

	let resetState = () => {
		if (state.host) {
			state.host.off('data', controlGuests);
			state.host.dispose();
		}

		if (state.guests) {
			state.guests.forEach(guest => guest.dispose());
		}

		state.host = state.hostView = state.guests = null;
	};

	Promise.all(views.map(view => view.getDocument()))
	.then(docs => {
		let promoteToHost = function() {
			let view = viewForElement(views, this);
			if (view && state.hostView !== view) {
				// changed host view
				resetState();

				let viewIx = views.indexOf(view);
				console.log('promote view %d to host', viewIx);
				state.hostView = view;
				state.host = pageSync.host(docs[viewIx], options).on('data', controlGuests);
				state.guests = docs
				.filter((doc, i) => i !== viewIx)
				.map(doc => pageSync.guest(doc, options));
			}
		};

		views.forEach(view => view.element.addEventListener('mouseenter', promoteToHost));

		return {
			destroy() {
				resetState();
				views.forEach(view => view.element.removeEventListener('mouseenter', promoteToHost));
			}
		};
	});
};

function viewForElement(views, elem) {
	return views.reduce((prev, view) => view.element === elem ? view : prev, null);
}