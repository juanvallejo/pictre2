/**
 * Image object module. Adds image properties and event listeners.
 *
 * @author juanvallejo
 * @date 8/21/16
 */

function Img(Events, mainWindow, source) {
	var self = this;

	this.node = new Image();
	this.node.src = source;

	this.hasLoaded = false;
	this.source = source;

	this.events = {};

	this.setSource = function(source) {
		this.source = source;
		this.node.src = source;
	};

	// retrieve this node's computed style for specific property
	this.getCSSComputedStyle = function(property) {
		return mainWindow.getComputedStyle(this.node).getPropertyValue(property);
	};

	this.getCSSComputedStyleAsInt = function(property) {
		return parseInt(this.getCSSComputedStyle(property).split("px")[0]);
	};

	this.getNode = function() {
		return this.node;
	};

	this.loadEventHandler = function(e) {
		if (self.events['load']) {
			for (var i = 0; i < self.events['load'].length; i++) {
				self.events['load'][i].call(self, null, e);
			}
		}
	};

	this.loadErrorEventHandler = function(err) {
		if (self.events['load']) {
			for (var i = 0; i < self.events['load'].length; i++) {
				self.events['load'][i].call(self, err);
			}
		}
	};

	// register an event callback for this instance
	this.on = function(eventName, callback) {
		if (!this.events[eventName]) {
			this.events[eventName] = [];
		}

		this.events[eventName].push(callback);
	};

	// attach events
	attachEventLoad(Events, this.node, this.loadEventHandler);
	attachEventLoadError(Events, this.node, this.loadErrorEventHandler);
};

// internal object functions
function attachEventLoad(Events, node, handler) {
	Events.onNodeEvent(node, 'load', handler);
}

function attachEventLoadError(Events, node, handler) {
	Events.onNodeEvent(node, 'error', handler);
}

module.exports = Img;