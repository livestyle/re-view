/**
 * Scroller component: overrides element content scroll so that both vertical
 * and horizontal `mousewheel` events produce nearly native horizontal content
 * scroll
 */
import {createElement, removeElement} from './utils';

const kPixelsPerLineStep = 40;  // from Blink source code

export default function setup(container, content, filter) {
	var scroller = createElement('div', 'emmet-re-view__scroll-handler');
	var sizer = createElement('div', 'emmet-re-view__scroll-sizer');

	scroller.appendChild(sizer);
	container.appendChild(scroller);

	var scrollOverrideTimer, prevState = {};

	var scheduleScrollReset = () => {
		clearTimeout(scrollOverrideTimer);
		scrollOverrideTimer = setTimeout(restoreScroll, 500);
	};

	var overrideScroll = data => {
		if (filter && !filter(data)) {
			return;
		}
		scroller.style.zIndex = 100;
		scheduleScrollReset();

		// emulate first scroll tick
		var scrollAmount = calculateScrollAmount(content, data);
		scroller.scrollLeft += scrollAmount.x;
		scroller.scrollTop += scrollAmount.y;
	};

	var restoreScroll = () => {
		scrollOverrideTimer = null;
		if (scroller) {
			scroller.style.zIndex = '';
		}
	};

	var syncScrollPosition = () => {
		var state = getScrollState(scroller);
		if (state.left === prevState.left && state.top === prevState.top) {
			// console.warn('abort scroll handler');
			return;
		}

		var scrollPercent;
		if (Math.abs(state.left - prevState.left) > Math.abs(state.top - prevState.top)) {
			// did a horizontal scroll, sync vertical
			scrollPercent = state.leftPercent;
			scroller.scrollTop = state.topMax * scrollPercent;
		} else {
			// did a vertical scroll, sync horizontal
			scrollPercent = state.topPercent;
			scroller.scrollLeft = state.leftMax * scrollPercent;
		}

		content.scrollLeft = (content.scrollWidth - content.offsetWidth) * scrollPercent;

		// beacuse of fractional element dimentions, actual scroll position
		// may differ from ones we’ve set. So we have to retreive actual
		// scroll position from element
		prevState = getScrollState(scroller);
	};

	var updateScroller = () => {
		// classList.toggle is buggy in Opera 12, use .add()/.remove()
		var curScroll = content.scrollLeft;
		if (content.scrollWidth > content.offsetWidth) {
			container.classList.remove('scroller_no-scroll');
		} else {
			container.classList.add('scroller_no-scroll');
		}
		updateScrollerSize(content, sizer);
		scroller.scrollLeft = curScroll;
		prevState.left = prevState.top = -1;
		syncScrollPosition();
	};

	var onWheel = evt => {
		evt.stopPropagation();
		evt.preventDefault();
		overrideScroll(evt);
	};

	var onMouseWheel = evt => {
		evt.stopPropagation();
		evt.preventDefault();
		overrideScroll({
			deltaX: Math.min(Math.abs(evt.wheelDeltaX), 20) / evt.detail,
			deltaY: Math.min(Math.abs(evt.wheelDeltaY), 20) / evt.detail
		});
	};

	var onScroll = evt => {
		scheduleScrollReset();
		syncScrollPosition();
	};

	content.addEventListener('wheel', onWheel);
	content.addEventListener('mousewheel', onMouseWheel);
	scroller.addEventListener('scroll', onScroll);
	content.ownerDocument.defaultView.addEventListener('resize', updateScroller);

	updateScroller();

	return {
		update: updateScroller,
		destroy() {
			container.classList.remove('scroller_no-scroll');
			content.removeEventListener('wheel', onWheel);
			content.removeEventListener('mousewheel', onMouseWheel);
			scroller.removeEventListener('scroll', onScroll);
			content.ownerDocument.defaultView.removeEventListener('resize', updateScroller);

			removeElement(scroller);
			scroller = sizer = container = content = null;
		}
	};
}

function getScrollState(elem) {
	var left = elem.scrollLeft, top = elem.scrollTop;
	var leftViewport = elem.offsetWidth, topViewport = elem.offsetHeight;
	var leftMax = elem.scrollWidth - leftViewport;
	var topMax = elem.scrollHeight - topViewport;

	return {
		left,
		leftMax,
		leftViewport,
		leftPercent: Math.min(left / leftMax, 1),
		top,
		topMax,
		topViewport,
		topPercent: Math.min(top / topMax, 1)
	};
}

function updateScrollerSize(content, sizer) {
	var scrollAmount = content.scrollWidth - content.offsetWidth;
	sizer.style.paddingRight = sizer.style.paddingBottom = `${scrollAmount}px`;
}

function calculateScrollAmount(elem, data) {
	var x = data.deltaX, y = data.deltaY;
	switch (data.deltaMode) {
		case 1: // DOM_DELTA_LINE
			// in Blink, line height does not depends on font-size
			x *= kPixelsPerLineStep;
			y *= kPixelsPerLineStep;
			break;
		case 2: // DOM_DELTA_PAGE
			x *= calculatePageScrollAmount(elem.offsetWidth);
			y *= calculatePageScrollAmount(elem.offsetHeight);
			break;
	}

	return {x, y};
}

function calculatePageScrollAmount(pageSize) {
    var minPageStep = length * 0.875;
    var pageStep = Math.max(minPageStep, pageSize - 40);
    return Math.max(pageStep, 1);
}
