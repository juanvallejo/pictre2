/**
 * Application events controller
 */

var Events = {};
var registeredGlobalEvents = {};
var registeredNodeEvents = {};

var nodeStateCache = {};

/**
 * Listens for a dom event
 */
Events.onCachedNodeEvent = function(node, eventName, callback) {
	if (!registeredNodeEvents[node.nodeName]) {
		registeredNodeEvents[node.nodeName] = {};
	}

	if (!registeredNodeEvents[node.nodeName][eventName]) {
		registeredNodeEvents[node.nodeName][eventName] = [];

		function nodeEvent(e) {
			for (var i = 0; i < registeredNodeEvents[node.nodeName][eventName].length; i++) {
				if (typeof registeredNodeEvents[node.nodeName][eventName][i] == 'function') {
					registeredNodeEvents[node.nodeName][eventName][i].call(node, e);
				}
			}
		}

		try {
			node.addEventListener(eventName, nodeEvent);
		} catch (e) {
			node.attachEvent('on' + eventName, nodeEvent);
		}
	}

	registeredNodeEvents[node.nodeName][eventName].push(callback);
};

Events.onNodeEvent = function(node, eventName, callback) {
	try {
		node.addEventListener(eventName, callback);
	} catch (e) {
		node.attachEvent('on' + eventName, callback);
	}
};

/**
 * Calls callback function scoped to node passed
 * with the 'resize' event as the first parameter
 * the horizontal difference as the second parameter
 * and the vertical difference as the third parameter
 */
Events.onNodeResizeEvent = function(node, callback) {
	// nodeStateCache can be used by any method on this module
	// therefore, delay any instantiation until after we know
	// an entry for this node exists
	if (!nodeStateCache[node.nodeName]) {
		nodeStateCache[node.nodeName] = {};
	}
	if (!nodeStateCache[node.nodeName].onNodeResizeEvent) {
		nodeStateCache[node.nodeName].onNodeResizeEvent = true;
		nodeStateCache[node.nodeName].registeredResizeCallbacks = [];
		nodeStateCache[node.nodeName].lastWidth = node.innerWidth || node.clientWidth;
		nodeStateCache[node.nodeName].lastHeight = node.innerHeight || node.clientHeight;
	} else {
		nodeStateCache[node.nodeName].registeredResizeCallbacks.push(callback);
		return;
	}

	nodeStateCache[node.nodeName].registeredResizeCallbacks.push(callback);

	try {
		node.addEventListener('resize', eventHandler);
	} catch (e) {
		node.attachEvent('onresize', eventHandler);
	}

	function eventHandler(e) {
		return (function(node) {
			var width = node.innerWidth;
			var height = node.innerHeight;

			if (!width) {
				width = node.clientWidth;
			}
			if (!height) {
				height = node.clientHeight;
			}

			var horDiff = null;
			var vertDiff = null;
			if (width != nodeStateCache[node.nodeName].lastWidth) {
				horDiff = (width - nodeStateCache[node.nodeName].lastWidth || 0);
			}
			if (height != nodeStateCache[node.nodeName].lastHeight) {
				vertDiff = (height - nodeStateCache[node.nodeName].lastHeight || 0);
			}

			// iterate through all registered resize events for this node
			for (var i = 0; i < nodeStateCache[node.nodeName].registeredResizeCallbacks.length; i++) {
				if (typeof nodeStateCache[node.nodeName].registeredResizeCallbacks[i] == 'function') {
					nodeStateCache[node.nodeName].registeredResizeCallbacks[i].call(node, e, horDiff, vertDiff);
				}
			}

			nodeStateCache[node.nodeName].lastWidth = width;
			nodeStateCache[node.nodeName].lastHeight = height;
		})(node);
	}
}

Events.onNodeHorizontalResizeEvent = function(node, callback) {
	Events.onNodeResizeEvent(node, function(e, horizontalDiff, verticalDiff) {
		if (horizontalDiff) {
			callback.call(node, horizontalDiff);
		}
	});
};

Events.onNodeVerticalResizeEvent = function(node, callback) {
	Events.onNodeResizeEvent(node, function(e, horizontalDiff, verticalDiff) {
		if (verticalDiff) {
			callback.call(node, verticalDiff);
		}
	});
};

Events.onNodeScrollEvent = function(node, callback) {
	if (!nodeStateCache[node.nodeName]) {
		nodeStateCache[node.nodeName] = {};
	}
	if (!nodeStateCache[node.nodeName].onNodeScrollEvent) {
		nodeStateCache[node.nodeName].onNodeScrollEvent = true;
		nodeStateCache[node.nodeName].registeredScrollCallbacks = [];
	} else {
		nodeStateCache[node.nodeName].registeredScrollCallbacks.push(callback);
		return;
	}

	nodeStateCache[node.nodeName].registeredScrollCallbacks.push(callback);

	try {
		node.addEventListener('scroll', eventHandler);
	} catch (e) {
		node.attachEvent('onscroll', eventHandler);
	}

	function eventHandler(e) {
		return (function(node) {
			// iterate through all registered resize events for this node
			for (var i = 0; i < nodeStateCache[node.nodeName].registeredScrollCallbacks.length; i++) {
				if (typeof nodeStateCache[node.nodeName].registeredScrollCallbacks[i] == 'function') {
					nodeStateCache[node.nodeName].registeredScrollCallbacks[i].call(node, e);
				}
			}
		})(node);
	}
};

// emits an event whenever the bottom scroll offset of a given node
// is a certain offsetValue from the absolute bottom of the viewport.
Events.onNodeScrollBottomOffsetEvent = function(node, offsetValue, callback) {
	Events.onNodeScrollEvent(node, callback);
};

// executes event "callbacks" on a node event and stores them
// for future cases of such event happening.
// Warning: event object will not be instantly available for
// callback to receive due to callback being called
// before being queued up for its corresponding event.
Events.nowAndOnNodeEvent = function(node, eventName, callback) {
	callback.call(node, null);
	Events.onNodeEvent(node, eventName, callback);
};

/**
 * Triggers dom event
 */
Events.emitNodeEvent = function() {

};

/**
 * Registers new app event and fires
 * passed callback when emitted 
 */
Events.registerGlobalEvent = function(eventName, callback) {
	if (!this.registeredGlobalEvents[eventName]) {
		this.registeredGlobalEvents[eventName] = [];
	}

	this.registeredGlobalEvents[eventName].push(callback);
}

/**
 * Triggers registered app events
 * by calling callbacks assigned to
 * that eventName
 */
Events.emitRegisteredGlobalEvent = function(eventName, args) {
	if (!registeredGlobalEvents[eventName]) {
		return;
	}

	for (var i = 0; i < this.registeredGlobalEvents[eventName].length; i++) {
		this.registeredGlobalEvents[eventName][i].apply(this, args);
	}
};

module.exports = Events;