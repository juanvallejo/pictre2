(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"./src/main.js":[function(require,module,exports){
/**
 * Pictre client core. Uses browserify to maintain
 * Node-like modular structure. Do 'npm install' in order
 * to obtain all required dev packages. Build system is 'gulp'.
 * Builds to '/dist/Pictre.js'.
 *
 * @author juanvallejo
 * @date 5/31/15
 */

var Client = require('./client.js');
var Environment = require('./environment.js');
var Interfaces = require('./interface.js');
var Events = require('./events.js');
var Server = require('./server.js');

var Pictre = {};

/**
 * Initializes application variables and default settings.
 *
 * @param applicationWrapper 	[String] dom element id of application container
 * @param resourceLocation 		[String] url of cloud directory containing all images
 * @param appDataLocation 		[String] url of cloud directory containing application files
 */
Pictre.init = function(mainWindow, applicationWrapper, resourceLocation, appDataLocation, developerMode) {
	var spacer = document.createElement("div");
	spacer.className = "Pictre-spacer";

	if (resourceLocation) {
		Environment.cloud.datadir = resourceLocation;
	}
	if (appDataLocation) {
		Environment.cloud.address = appDataLocation;
	}
	if (!developerMode) {
		Environment.inProduction = true;
	}

	// create and place menu before application wrapper
	Interfaces.menu.put(mainWindow.document.body, applicationWrapper);

	// detect client settings
	Client.init();

	if (Interfaces.board.isSet()) {
		var boardName = Interfaces.board.getName();
		if (Interfaces.board.isNameRestricted(boardName) || Interfaces.board.isNameInvalid(boardName)) {
			Interfaces.splash.show(Interfaces, Events, Client, mainWindow, mainWindow.document.body);
			if (Interfaces.board.isNameRestricted(boardName)) {
				Interfaces.splash.showAlert(Interfaces, 'That album is restricted, please try another.');
			} else {
				Interfaces.splash.showAlert(Interfaces, 'Your album contains invalid characters.');
			}
			return;
		}

		Interfaces.board.show(Interfaces, Events, Server, mainWindow, applicationWrapper);
		Interfaces.board.showAlert('Loading, please wait...');
	} else {
		// show main view
		Interfaces.splash.show(Interfaces, Events, Client, mainWindow, mainWindow.document.body);
		if (Environment.isUpdating) {
			Interfaces.splash.showAlert(Interfaces, 'Updates are currently in progress...');
		}
	}
}

window.Pictre = Pictre;
},{"./client.js":"/Volumes/TINY/Documents/Pictre-pro/src/client.js","./environment.js":"/Volumes/TINY/Documents/Pictre-pro/src/environment.js","./events.js":"/Volumes/TINY/Documents/Pictre-pro/src/events.js","./interface.js":"/Volumes/TINY/Documents/Pictre-pro/src/interface.js","./server.js":"/Volumes/TINY/Documents/Pictre-pro/src/server.js"}],"/Volumes/TINY/Documents/Pictre-pro/src/client.js":[function(require,module,exports){
/**
 * Client manager for application runtime. Provides utilities and
 * awareness of browser information / compatibility.
 *
 * @author juanvallejo
 * @date 6/1/15
 */

var Interface = require('./interface.js');

var Client = {};

// holds browser names
Client.browser = {

	UNKNOWN: 0,
	CHROME: 1,
	SAFARI: 2,
	MOBILE_SAFARI: 3,
	FIREFOX: 4,
	OPERA: 5,
	IE_MODERN: 6,
	IE_UNSUPPORTED: 7,
	IE_OTHER: 8

};

/**
 * flag indicating if using compatible browser
 */
Client.compatible = true;
Client.id = Client.browser.UNKNOWN
Client.name = 'Unknown';
Client.version = 0;

Client.os = navigator.platform;
Client.online = navigator.onLine;

Client.getId = function() {
	return Client.id;
};

Client.isIE = function() {
	return Client.id == Client.browser.IE_MODERN || Client.id == Client.browser.IE_UNSUPPORTED || Client.id == Client.browser.IE_OTHER;
};

Client.isMobileSafari = function() {
	return Client.id == Client.browser.MOBILE_SAFARI;
};

Client.isSafari = function(version) {
	if (version) {
		return Client.id == Client.browser.SAFARI && Client.version.split('').indexOf(version) != -1;
	}
	return Client.id == Client.browser.SAFARI;
};

/**
 * Collects information about browser version,
 * compatibility, name, and display information
 * based on user agent string.
 */
Client.init = function() {

	if (navigator.userAgent.indexOf("AppleWebKit") != -1) {

		if (navigator.userAgent.indexOf("Chrome") != -1) {
			Client.name = "Chrome";
			Client.id = Client.browser.CHROME;
		} else {

			if (navigator.userAgent.indexOf("Mobile") != -1) {
				Client.name = "Mobile Safari";
				Client.id = Client.browser.MOBILE_SAFARI;
			} else {
				Client.name = "Safari";
				Client.id = Client.browser.SAFARI;

				var version = navigator.userAgent.split("Version/");
				Client.version = version[1].split(" ")[0];
			}

		}

	} else {

		if (navigator.userAgent.indexOf("Firefox") != -1) {
			Client.name = "Firefox";
			Client.id = Client.browser.FIREFOX;
		} else if (navigator.userAgent.indexOf("Opera") != -1) {
			Client.name = "Opera";
			Client.id = Client.browser.OPERA;
		} else if (navigator.userAgent.indexOf("MSIE ") != -1) {

			if (navigator.userAgent.indexOf("Trident") != -1) {

				var version = navigator.userAgent.split(";")[1];
				version = parseInt(version.split(" ")[2]);

				Client.name = "Internet Explorer";
				Client.version = version;

				if (version > 8) {
					Client.id = Client.browser.IE_MODERN;
				} else {
					Client.id = Client.browser.IE_UNSUPPORTED;
				}

			} else {
				Client.name = "Internet Explorer";
				Client.id = Client.browser.IE_OTHER;
			}
		} else {
			Client.name = 'Other';
			Client.id = Client.browser.UNKNOWN;
		}

	}

	// Detect if using hopeless browser
	if (Client.id == Client.browser.IE_UNSUPPORTED || Client.id == Client.browser.IE_OTHER) {

		var warning;
		var lock = false;
		var header = 'Sorry about that!';

		if (Client.id == Client.browser.IE_OTHER) {

			warning = "Unfortunately Pictre is not supported in your browser, please consider upgrading to Google Chrome, by clicking here, for an optimal browsing experience.";
			lock = true;

			Interface.warning.onclick = function() {
				window.open("http://chrome.google.com", "_blank");
			};

		} else {

			header = 'Notice!';
			warning = "Some of Pictre's features may not be fully supported in your browser.";

			Interface.warning.onclick = function() {
				this.remove();
			};

		}

		Client.compatible = false;

		Interface.warning.put({

			header: header,
			body: warning,
			locked: lock

		});
	}
}

module.exports = Client;
},{"./interface.js":"/Volumes/TINY/Documents/Pictre-pro/src/interface.js"}],"/Volumes/TINY/Documents/Pictre-pro/src/environment.js":[function(require,module,exports){
/**
 * Application environment during runtime. Stores dynamic
 * global values for application module support.
 *
 * @author juanvallejo
 * @date 5/31/15
 */

var Environment = {};

Environment.cloud = {
	datadir: '',
	address: ''
}

Environment.app = {
	title: 'Pictre'
}

Environment.events = {};

Environment.inProduction = false;
Environment.isUpdating = false;

Environment.animationSpeed = 1000;
Environment.maxImageWidth = 800;
Environment.maxImageHeight = 137;
Environment.alertDuration = 10000;

Environment.baseAPIUrl = 'http://static-pictre.rhcloud.com/';

// load x items on page load
Environment.itemAmountPageLoad = 50;
// load x items per subsequent request
Environment.itemAmountRequest = 25;

module.exports = Environment;
},{}],"/Volumes/TINY/Documents/Pictre-pro/src/events.js":[function(require,module,exports){
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
},{}],"/Volumes/TINY/Documents/Pictre-pro/src/image.js":[function(require,module,exports){
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
},{}],"/Volumes/TINY/Documents/Pictre-pro/src/interface.js":[function(require,module,exports){
/**
 * Application interface manager. Exposes all interface modules to global scope.
 *
 * @author juanvallejo
 * @date 5/31/15
 */

var Interface = require('./interfaces');

module.exports = Interface;
},{"./interfaces":"/Volumes/TINY/Documents/Pictre-pro/src/interfaces/index.js"}],"/Volumes/TINY/Documents/Pictre-pro/src/interfaces/board.js":[function(require,module,exports){
/**
 * Board interface module - consists of a "wrapper" root node and a "notice" alert node
 */

var Environment = require('../environment.js');
var Picture = require('../picture.js');
var Img = require('../image.js');

// private fields and functions
var isSet = false;
var nodes = {
	// used to display alerts and board info
	alertNode: null,
	alertNodeComponents: {
		body: null,
		extra: null
	},

	loaderNode: null,

	// holds main board component (exclusive of the alertNode)
	rootNode: null
};

var events = {};
var cache = {};

var loadedImageCount = 0;
var isLoading = false;
var isLoadedImages = false;
var isCreated = false;
var parentNodeCache = {};
var restrictedNames = [
	'data',
	'restricted',
	'404',
	'undefined'
];

var Board = {};

Board.alertNodeComponents = {
	body: 'Untitled',
	extra: null
};

Board.albumRequestComponents = {
	anchor: 0,
	limit: Environment.itemAmountPageLoad
};

Board.pictures = [];

Board.isNameRestricted = function(name) {
	return restrictedNames.indexOf(name.toLowerCase()) != -1;
};

Board.isNameInvalid = function(name) {
	return name.toLowerCase().match(/[^a-z0-9\-\.\+\_\ ]/gi);
};

Board.isNameWithSpaces = function(name) {
	return name.match(/[\ ]/g);
};

Board.isSet = function() {
	Board.detect();
	return isSet;
};

Board.detect = function() {

	if (!window.location.pathname.split('/')[1]) {
		window.document.title = Environment.app.title;
		isSet = false;
		return Board;
	}

	isSet = true;
	window.document.title = 'Pictre - ' + Board.getName();

	return Board;
}

Board.getName = function() {
	var board;

	// capitalize name of board
	if (isSet) {
		var name = window.location.pathname.split("/")[1].toLowerCase();
		var nameArray = name.split('');
		nameArray.splice(0, 1);

		var nameFirstChar = name.charAt(0).toUpperCase();
		board = nameFirstChar + nameArray.join('');
	}

	return board;

}

Board.setLoaderWithError = function(ratio) {
	if (!nodes.loaderNode) {
		return;
	}

	Board.setLoader(ratio, function(progressBar) {
		progressBar.style.background = 'rgba(205,55,0, 0.6)';
	});
}

Board.setLoader = function(ratio, callback) {
	if (!nodes.loaderNode || !nodes.loaderNode.children) {
		return;
	}

	nodes.loaderNode.style.display = 'block';
	nodes.loaderNode.children[0].style.width = Math.max(ratio * 100, 0) + '%';

	if (typeof callback == 'function') {
		callback.call(Board, nodes.loaderNode.children[0]);
	}
};

Board.unsetLoader = function() {
	if (!nodes.loaderNode) {
		return;
	}
	nodes.loaderNode.style.display = 'none';
};

// loads a single api image into the board
Board.loadImage = function(Interfaces, Events, mainWindow, object, imageLoadHandler) {
	var picture = new Picture(Interfaces, Events, mainWindow);
	picture.setNodeID('pic' + object.id);
	picture.setData(object);
	picture.setParentNode(nodes.rootNode);

	Board.pictures.push(picture);

	// re-position loading image
	if (Board.getRequestAnchor()) {
		Board.chisel(mainWindow, nodes.rootNode, Board.pictures, Board.getRequestAnchor());
	}

	var image = new Img(Events, mainWindow, Environment.baseAPIUrl + '/' + object.thumb);

	if (!Board.getRequestAnchor() && !isLoadedImages && nodes.rootNode.style.display != 'none') {
		nodes.rootNode.style.display = 'none';
	}

	image.on('load', function(err, e) {
		if (!err) {
			return (function(picture, image) {
				imageLoadHandler(picture, image);
			})(picture, image);
		}

		// assume error loading image
		var height = Environment.maxImageHeight;
		var paddingTop = picture.getCSSComputedStyleAsInt(mainWindow, 'padding-top') + 1;
		var paddingBottom = picture.getCSSComputedStyleAsInt(mainWindow, 'padding-bottom') + 1;

		var errImg = new Img(Events, mainWindow, '/static/i/Pictre-404.png');

		this.setDataValue('src', '/static/i/Pictre-404.full.png');
		this.setCSSPropertyValue('height', (height - paddingTop + paddingBottom * 2) + 'px');

		imageLoadHandler(this, errImg);
	}.bind(picture));
};

// loads a json array of images into the board
Board.load = function(Interfaces, Events, mainWindow, objects) {
	function handler(picture, image) {
		picture.setInnerText('');
		picture.addImage(image);
		Board.imageLoadHandler(mainWindow, objects.length);
	}

	for (var i in objects) {
		Board.loadImage(Interfaces, Events, mainWindow, objects[i], handler);
	}
};

// called when a single image is loaded
Board.imageLoadHandler = function(mainWindow, setCount) {
	loadedImageCount++;

	// no anchor means blank room for loader
	if (!Board.getRequestAnchor()) {
		Board.setLoader(loadedImageCount / setCount);
	} else {
		Board.chisel(mainWindow, nodes.rootNode, Board.pictures, Board.getRequestAnchor());
	}

	if (loadedImageCount == setCount) {
		loadedImageCount = 0;
		isLoading = false;

		// if anchor is 0, that means loading images for
		// the first time. Set loader bar to full
		if (!Board.albumRequestComponents.anchor) {
			Board.unsetLoader();
			nodes.rootNode.style.display = 'block';
		}

		// emit 'load' event
		Board.emit('load', [setCount]);
	}
};

// performs a remote call to the server api, fetching every image,
// as well as total image count, available for the current album
Board.update = function(Interfaces, Events, Server, mainWindow) {
	if (!isCreated || isLoading) {
		return;
	}

	isLoading = true;

	// request current set of images
	Server.setRequestAnchor(Board.getRequestAnchor());
	Server.setRequestLimit(Board.getRequestLimit());
	Server.getAlbum(Board.getName().toLowerCase(), function(err, data) {
		if (err) {
			Board.showAlert('Unable to load images at this time');
			Board.setLoaderWithError(1);
			return console.log('ERR SERVER ALBUM REQUEST', err);
		}

		if (!data.length) {
			Board.emit('load');
			return;
		}

		Board.setAlertExtra(data[0].total);
		Board.load(Interfaces, Events, mainWindow, data);
	});

	// update alertNodeComponents
	Board.updateAlertComponents();
};

Board.updateAlertComponents = function() {
	if (Board.alertNodeComponents.extra) {
		nodes.alertNodeComponents.extra.innerHTML = Board.alertNodeComponents.extra;
		nodes.alertNodeComponents.extra.title = 'This board contains ' + Board.alertNodeComponents.extra + ' images';
	} else {
		nodes.alertNodeComponents.extra.innerHTML = '';
		nodes.alertNodeComponents.extra.title = '';
	}
	nodes.alertNodeComponents.body.innerHTML = Board.alertNodeComponents.body;
};

// create all board components
Board.create = function(Interfaces, Events, mainWindow, parentNode) {
	if (!isCreated) {
		isCreated = true;
	}

	// used for displaying alerts and board information
	// sibling of application wrapper
	nodes.alertNode = Interfaces.controller.createDivNode(mainWindow);
	nodes.alertNode.className = 'Pictre-notice';

	nodes.alertNodeComponents.extra = Interfaces.controller.createDivNode(mainWindow);
	nodes.alertNodeComponents.extra.className = 'Pictre-notice-extra';

	nodes.alertNodeComponents.body = Interfaces.controller.createDivNode(mainWindow);

	// create root "wrapper" node (goes inside of application wrapper)
	nodes.rootNode = Interfaces.controller.createDivNode(mainWindow);
	nodes.rootNode.id = 'Pictre-wrapper';
	nodes.rootNode.style.marginTop = '52px';
	nodes.rootNode.style.display = 'block';

	// create loader node
	var loaderChildNode = Interfaces.controller.createDivNode(mainWindow);
	loaderChildNode.className = 'Pictre-loader-progress';

	nodes.loaderNode = Interfaces.controller.createDivNode(mainWindow);
	nodes.loaderNode.className = 'Pictre-loader-wrapper';
	nodes.loaderNode.style.marginTop = '-6%';

	// create node tree
	nodes.alertNode.appendChild(nodes.alertNodeComponents.body);
	nodes.alertNode.appendChild(nodes.alertNodeComponents.extra);
	parentNode.appendChild(nodes.alertNode);
	parentNode.appendChild(nodes.rootNode);
	nodes.loaderNode.appendChild(loaderChildNode);
	parentNode.appendChild(nodes.loaderNode);

	// center nodes
	Events.nowAndOnNodeEvent(mainWindow, 'resize', function() {
		Interfaces.controller.centerNodeRelativeTo(nodes.loaderNode, mainWindow);
		Interfaces.controller.horizontalCenterNodeRelativeTo(nodes.rootNode, mainWindow);
	});
};

/**
 * Creates view elements if non-existent and displays board components.
 */
Board.show = function(Interfaces, Events, Server, mainWindow, parentNode) {
	if (!isCreated) {
		Board.create(Interfaces, Events, mainWindow, parentNode);

		// ensure these events are only registered once
		// by placing them inside this logic block
		Board.on('load', function(setCount) {
			var offset = Board.getRequestAnchor();
			var count = Board.getAlertExtra();
			if (!count) {
				count = setCount;
			}

			if (!Board.getRequestAnchor()) {
				Board.showAlert(Board.getName() + ' Picture Board', count);
				Board.chisel(mainWindow, nodes.rootNode, Board.pictures, offset);
			}

			// update request settings for next update
			Board.setRequestAnchor(Board.getRequestAnchor() + Board.getRequestLimit());
			Board.setRequestLimit(Environment.itemAmountRequest);
		});

		Board.on('chisel', function(node, itemMargin) {
			parentNode.style.height = (node.scrollHeight + itemMargin * 2) + "px";
			Interfaces.controller.horizontalCenterNodeRelativeTo(node, mainWindow);
		});

		Events.onNodeHorizontalResizeEvent(mainWindow, function(e, diff) {
			Board.chisel(this, nodes.rootNode, Board.pictures);
		});

		Events.onNodeScrollEvent(mainWindow, function(e) {
			var totalViewHeight = nodes.rootNode.scrollHeight + nodes.rootNode.offsetTop;
			var scrollOffset = (this.pageYOffset || this.document.body.scrollTop) + this.innerHeight;
			var bottomOffset = Math.floor(this.innerHeight * 0.25);

			// scroll at 25% offset from bottom
			if (totalViewHeight - scrollOffset - bottomOffset < 0) {
				Board.update(Interfaces, Events, Server, mainWindow);
			}
		});
	}

	Board.update(Interfaces, Events, Server, mainWindow);
};

Board.showAlert = function(bodyText, extraText) {
	if (!nodes.alertNode) {
		return console.log('BOARD ALERT', 'An attempt was made to place an alert without creating the board components first.');
	}

	Board.setAlertBody(bodyText || '');
	Board.setAlertExtra(extraText);
	Board.updateAlertComponents();
};

Board.setAlertBody = function(text) {
	Board.alertNodeComponents.body = text;
};

Board.setAlertExtra = function(text) {
	Board.alertNodeComponents.extra = text;
};

Board.setRequestAnchor = function(anchor) {
	Board.albumRequestComponents.anchor = anchor;
};

Board.setRequestLimit = function(lmit) {
	Board.albumRequestComponents.limit = lmit;
};

Board.getAlertExtra = function() {
	return Board.alertNodeComponents.extra;
};

Board.getRequestAnchor = function() {
	return Board.albumRequestComponents.anchor;
};

Board.getRequestLimit = function() {
	return Board.albumRequestComponents.limit;
};

// local events
Board.on = function(eventName, callback, once) {
	if (!events[eventName]) {
		events[eventName] = [];
	}
	callback.once = once;
	events[eventName].push(callback);
};

Board.emit = function(eventName, args) {
	if (!events[eventName]) {
		return;
	}
	if (!(args instanceof Array)) {
		args = [args]
	}
	for (var i = 0; i < events[eventName].length; i++) {
		events[eventName][i].apply(Board, args);
		if (events[eventName][i].once) {
			events[eventName].splice(i, 1);
		}
	}
};

// Expects an offset (or zero) and places each item in
// a collection in a gallery layout.
// This method expetcs each collection item to be already
// appended to a rootNode
Board.chisel = function(mainWindow, rootNode, collection, offset) {
	if (!rootNode || !mainWindow || !collection.length || offset < 0) {
		return;
	}
	if (!offset) {
		offset = 0;
	}

	var windowWidth = mainWindow.innerWidth;
	var itemWidth = collection[0].getNodePropertyValue('offsetWidth');
	var itemMargin = 0;
	var columnCount = 0;

	if (windowWidth && itemWidth) {
		itemMargin = collection[0].getCSSComputedStyleAsInt('margin-left') * 2;
		columnCount = Math.max(1, Math.floor(windowWidth / (itemWidth + itemMargin)));
		if (columnCount > collection.length) {
			columnCount = collection.length;
		}

		// prevent any further action if column count has not changed
		// and the entire collection is being processed with no offset
		if (columnCount == cache.lastColumnCount && offset == 0) {
			return;
		}


		rootNode.style.width = (columnCount * (itemWidth + (itemMargin))) + "px";
		cache.lastColumnCount = columnCount;

		for (var i = offset; i < collection.length; i++) {
			collection[i].removeFlag('first');
			collection[i].setFlag('left', 0);
			collection[i].setCSSPropertyValue('top', '0px');
			collection[i].setCSSPropertyValue('left', '0px');
		}

		if (offset == 0) {
			for (var i = offset; i < collection.length; i += columnCount) {
				collection[i].setFlag('first');
			}
		} else {
			for (var i = offset; i < collection.length; i++) {
				if (collection[i - columnCount] && collection[i - columnCount].hasFlag('first')) {
					collection[i].setFlag('first');
				}
			}
		}

		for (var i = offset; i < collection.length; i++) {
			if (!collection[i].hasFlag('first')) {
				collection[i].setFlag('left', collection[i - 1].getFlag('left') + collection[i - 1].getNodePropertyValue('offsetWidth') + itemMargin);
				collection[i].setCSSPropertyValue('left', collection[i].getFlag('left') + "px");

			}
			if (collection[i - columnCount]) {
				collection[i].setCSSPropertyValue('top',
					(collection[i - columnCount].getNodePropertyValue('offsetTop') + collection[i - columnCount].getNodePropertyValue('offsetHeight') + itemMargin - (collection[i].getNodePropertyValue('offsetTop'))) + "px");
			}
		}
	}

	Board.emit('chisel', [rootNode, itemMargin]);
};

Board.getImageByIndex = function(index) {
	var picture = Board.getPictureByIndex(index)
	if (picture) {
		return picture.getImageNode();
	}
	return null;
};

Board.getImageById = function(id) {
	for (var i = 0; i < Board.pictures.length; i++) {
		if (Board.pictures[i].getNodeID() == id) {
			return Board.pictures[i];
		}
	}
};

Board.getPictureByIndex = function(index) {
	return Board.pictures[index];
};

// return loaded picture count
Board.getSize = function() {
	return Board.pictures.length;
};

module.exports = Board;
},{"../environment.js":"/Volumes/TINY/Documents/Pictre-pro/src/environment.js","../image.js":"/Volumes/TINY/Documents/Pictre-pro/src/image.js","../picture.js":"/Volumes/TINY/Documents/Pictre-pro/src/picture.js"}],"/Volumes/TINY/Documents/Pictre-pro/src/interfaces/controller.js":[function(require,module,exports){
var IntController = {}

function interfaceNode() {
	this.callbacks = {};

	// Warning: does not register "DOMTree" node events
	// that should be watched with "addEventListener".
	// only registers "local" instance events. Use
	// "Events.onNodeEvent" to listen for actual dom evts.
	this.on = function(eventName, callback) {
		if (!this.callbacks[eventName]) {
			this.callbacks[eventName] = [];
		}

		this.callbacks[eventName].push(callback);
	};

	this.emit = function(eventName, args) {
		if (!this.callbacks[eventName]) {
			return;
		}

		for (var i = 0; i < this.callbacks[eventName].length; i++) {
			this.callbacks[eventName][i].apply(this, args);
		}
	};
}

function interfaceInputNode(Events, mainWindow) {
	var scope = this;

	this.node = mainWindow.document.createElement("input");
	this.type = "text";
	this.password = false;
	this.className = "Pictre-passcode-input";
	this.placeholder = "Create a passcode";
	this.value = this.placeholder;

	this.node.maxLength = 10;
	this.node.className = this.className;
	this.node.type = this.type;
	this.node.placeholder = this.placeholder || "";

	this.getNode = function() {
		return scope.node;
	};
	this.setStyle = function(attr, value) {
		scope.node.style[attr] = value;
	};
	this.setAttribute = function(attr, value) {
		scope.node.setAttribute(attr, value);
	};

	this.setValue = function(text) {
		this.node.value = text;
		this.value = text;
	};

	this.setPlaceholder = function(text) {
		this.value = text;
		this.placeholder = text;
		this.node.placeholder = text;
	};

	this.getValue = function() {
		return scope.node.value;
	};
	this.getEscapedValue = function() {
		return scope.node.value.toLowerCase()
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#039;");
	};

	this.isValueEmpty = function() {
		return scope.value == scope.node.value || scope.node.value == '';
	};

	Events.onNodeEvent(this.node, 'focus', function(e) {
		scope.emit('focus', [e]);
		if (scope.password) {
			scope.node.type = "password";
		}
		if (scope.node.value == scope.value) {
			scope.node.value = "";
		}
	});

	Events.onNodeEvent(this.node, 'blur', function(e) {
		scope.emit('blur', [e]);
	});

	return this;
};

interfaceInputNode.prototype = new interfaceNode();

function interfaceDivNode() {

}

IntController.horizontalCenterNodeRelativeTo = function(node, relativeToNode) {
	node.style.left = ($(relativeToNode).width() / 2) - ($(node).width() / 2) + 'px';
};

IntController.verticalCenterNodeRelativeTo = function(node, relativeToNode) {
	node.style.top = ($(relativeToNode).height() / 2) - ($(node).height() / 2) + 'px';
};

IntController.centerNodeRelativeTo = function(node, relativeToNode) {
	IntController.horizontalCenterNodeRelativeTo(node, relativeToNode);
	IntController.verticalCenterNodeRelativeTo(node, relativeToNode);
};

IntController.newInputNode = function(Events, mainWindow) {
	return new interfaceInputNode(Events, mainWindow);
};

IntController.newDivNode = function() {
	return new interfaceDivNode();
};

IntController.createDivNode = function(mainWindow) {
	return mainWindow.document.createElement('div');
};

IntController.createNode = function(mainWindow, nodeName) {
	return mainWindow.document.createElement(nodeName);
};

IntController.setNodeOverflowHidden = function(node) {
	node.style.overflow = 'hidden';
};

module.exports = IntController;
},{}],"/Volumes/TINY/Documents/Pictre-pro/src/interfaces/gallery.js":[function(require,module,exports){
/**
 * Gallery wrapper for overlay interface
 */

var GalleryInterface = {};

GalleryInterface.isFeaturing = false;

GalleryInterface.events = {};
GalleryInterface.images = [];

GalleryInterface.image = null;

var isActive = false;

GalleryInterface.events.onready = function() {};
GalleryInterface.events.onclose = function() {};

GalleryInterface.onExit = function(exitCallback) {
	Overlay.events.onexit.push(exitCallback);
};

GalleryInterface.hide = function() {

	// if (!Overlay.isLocked) {

	// 	window.document.body.style.overflow = 'auto';
	// 	window.document.body.style.height = 'auto';
	// 	GalleryInterface.isFeaturing = false;

	// 	Overlay.remove();
	// 	GalleryInterface.onclose();

	// 	for (var i = 0; i < Overlay.events.onexit.length; i++) {
	// 		if (Overlay.events.onexit[i]) Overlay.events.onexit[i].call(GalleryInterface);
	// 	}

	// }

}

/**
 * Feature a given image object
 */
GalleryInterface.show = function(image) {

	GalleryInterface.isActive = true;

	var scope = Pictre;

	// var thumb = document.createElement("div");
	// thumb.className = "Pictre-overlay-pic";
	// thumb.data = image.data;
	// thumb.style.minWidth = Environment.maxImageWidth + 'px';
	// thumb.style.maxWidth = Environment.maxImageWidth + 'px';
	// thumb.style.width = Environment.maxImageWidth + 'px';
	// thumb.innerHTML = "<div class='Pictre-loader'><span class='fa fa-circle-o-notch fa-spin fa-3x'></span></div>";

	// Overlay.feature(thumb);
	// Overlay.iterator = image.data.id;

	// window.document.body.style.height = $(window).height() + 'px';
	// window.document.body.style.overflow = 'hidden';

	// image.style.opacity = '0.1';

	// Gallery.showImage(thumb);
	// Pictre.gallery.overlay.onclose = function() {
	// 	if (a) a.style.opacity = Pictre._settings.data.visited;
	// }

};

GalleryInterface.isActive = function() {
	return isActive;
};

GalleryInterface.getOverlay = function() {
	return Overlay;
}

GalleryInterface.putOverlay = function() {}

module.exports = GalleryInterface;
},{}],"/Volumes/TINY/Documents/Pictre-pro/src/interfaces/index.js":[function(require,module,exports){
/**
 * Exports all interface modules in current directory
 */

//import all modules
var modules = {
	'board': require('./board.js'),
	'controller': require('./controller.js'),
	'gallery': require('./gallery.js'),
	'menu': require('./menu.js'),
	'modal': require('./modal.js'),
	'overlay': require('./overlay.js'),
	'splash': require('./splash.js'),
	'warning': require('./warning.js')
};

module.exports = modules;
},{"./board.js":"/Volumes/TINY/Documents/Pictre-pro/src/interfaces/board.js","./controller.js":"/Volumes/TINY/Documents/Pictre-pro/src/interfaces/controller.js","./gallery.js":"/Volumes/TINY/Documents/Pictre-pro/src/interfaces/gallery.js","./menu.js":"/Volumes/TINY/Documents/Pictre-pro/src/interfaces/menu.js","./modal.js":"/Volumes/TINY/Documents/Pictre-pro/src/interfaces/modal.js","./overlay.js":"/Volumes/TINY/Documents/Pictre-pro/src/interfaces/overlay.js","./splash.js":"/Volumes/TINY/Documents/Pictre-pro/src/interfaces/splash.js","./warning.js":"/Volumes/TINY/Documents/Pictre-pro/src/interfaces/warning.js"}],"/Volumes/TINY/Documents/Pictre-pro/src/interfaces/menu.js":[function(require,module,exports){
/**
 * Navigation and menu interface
 */

var Environment = require('../environment.js');
var Utilities = require('../utilities.js');

var MenuInterface = {

	domElement: null,
	buttons: {},

	/**
	 * Adds ui icon to the top navigation of the application
	 *
	 * @param button [object] defining ui and action properties for button
	 * @return pointer to added button object
	 */
	addButton: function(button) {

		var buttonIconClassName = 'fa-cloud';

		this.buttons[button.name] = document.createElement("div");
		this.buttons[button.name].id = button.id;
		this.buttons[button.name].className = "top-button"; //"top-button";
		this.buttons[button.name].title = button.title;

		// handle button icon type
		if (button.id == 'upload') {
			// assign upload icon
			buttonIconClassName = 'fa-cloud-upload';
		} else if (button.id == 'lock') {
			// assign 'lock' icon to indicate signing in
			buttonIconClassName = 'fa-lock';
		} else if (button.id == 'unlock') {
			// assign 'unlock' icon to indicate signing out
			buttonIconClassName = 'fa-unlock';
		} else if (button.id == 'back') {
			// assign 'back' arrow icon to indicate returning to album
			buttonIconClassName = 'fa-arrow-left';
		}

		this.buttons[button.name].innerHTML = '<span class="fa ' + buttonIconClassName + ' fa-2x"></span>';

		this.domElement.appendChild(this.buttons[button.name]);

		this.buttons[button.name].style.top = (this.buttons[button.name].parentNode.clientHeight / 2 - this.buttons[button.name].clientHeight / 2) + 'px';

		// declare 'on' function to allow addition of event listener to element
		this.buttons[button.name].on = function(action, callback) {

			Pictre.extend(this).on(action, function(evt) {
				callback.call(this, evt);
			});

			return this;

		};

		return this.buttons[button.name];
	},

	/**
	 * Returns pointer to button with specified id
	 */
	getButton: function(buttonId) {
		return this.buttons[buttonId];
	},

	/**
	 * Returns true if button with specified if exists
	 * false otherwise.
	 */
	hasButton: function(buttonId) {

		var buttonExists = false;

		if (this.buttons.hasOwnProperty(buttonId)) {
			buttonExists = true;
		}

		return buttonExists;

	},

	/**
	 * Sets dom style display property to none of button with
	 * specified id. If button does not exist, request is ignored.
	 */
	hideButton: function(buttonId) {
		if (this.hasButton(buttonId)) {
			this.buttons[buttonId].style.display = 'none';
		}
	},

	/**
	 * Main display function for menu interface. When called, creates
	 * menu dom element, appends application brand, and inserts menu
	 * element before the main application wrapper. If a
	 * siblingNode is not supplied, the menu element is appended
	 * to the parent node supplied. (Usually body).
	 *
	 * Note: the application wrapper is usually created and appended
	 * in the index.html pre-initialization script.
	 *
	 * @param parentNode 			[DOMElement] parent node of app wrapper and menu (usually document.body)
	 * @param siblingNode 	[DOMElement] main content wrapper for application
	 */
	put: function(parentNode, siblingNode) {

		this.domElement = document.createElement("div");
		this.domElement.id = 'top';

		// place logo on menu
		var brand = document.createElement("div");
		brand.id = 'brand';
		brand.innerHTML = Environment.app.title;

		Utilities.extend(brand).on('click', function() {
			window.location.assign('/');
		});

		this.domElement.appendChild(brand);

		if (siblingNode) {
			parentNode.insertBefore(this.domElement, siblingNode);
		} else {
			parentNode.appendChild(this.domElement);
		}

		brand.style.top = (this.domElement.clientHeight / 2 - brand.clientHeight / 2) + 'px';
		return this.domElement;
	},

	/**
	 * Removes button from the document and deletes dom element.
	 * If button with specified id does not exist, action is ignored.
	 *
	 * @param buttonId [String] id of button to remove
	 */
	removeButton: function(buttonId) {
		if (this.hasButton(buttonId)) {
			this.domElement.removeChild(this.buttons[buttonId]);
			delete this.buttons[buttonId];
		}
	},

	/**
	 * Sets button css style display property to block.
	 * Used after hiding a button. If a button with
	 * specified id does not exist, this action is ignored.
	 */
	showButton: function(buttonId) {
		if (this.hasButton(buttonId)) {
			this.buttons[buttonId].style.display = 'block';
		}
	}
}

module.exports = MenuInterface;
},{"../environment.js":"/Volumes/TINY/Documents/Pictre-pro/src/environment.js","../utilities.js":"/Volumes/TINY/Documents/Pictre-pro/src/utilities.js"}],"/Volumes/TINY/Documents/Pictre-pro/src/interfaces/modal.js":[function(require,module,exports){
/**
 * Modal controller - displays information with optional user inputs
 * Requires an overlay
 */

var Environment = require('../environment.js');

var Modal = {};
var nodes = {
	// node attached to a parentNode or mainWindow
	rootNode: null,

	// node that holds all modal nodes and components
	// attached to rootNode
	containerNode: null,
	outputNode: null,
	components: {
		title: null,
		body: null,
		inputs: []
	}
};

var alertTimeout = null;
var isCreated = false;
var mainDiv = null;

var parentNodeCache = {};

Modal.settings = {
	alertDuration: Environment.alertDuration
};

Modal.components = {
	title: null,
	body: 'Empty modal.',
	inputs: []
};

// update components
Modal.update = function() {
	if (Modal.title) {
		if (nodes.components.title) {
			nodes.components.title.style.display = 'block';
			nodes.components.title.innerHTML = Modal.components.title;
		}
	} else {
		nodes.components.title.style.display = 'none';
	}
	if (nodes.components.body) {
		nodes.components.body.innerHTML = Modal.components.body;
	}
	if (Modal.inputs.length) {
		// TODO
	}
};

Modal.create = function(Interfaces, Events, mainWindow, parentNode) {
	// goes on top of background, simulates overlay node
	// in order for its child nodes to have correct relative
	// position to a full browser page
	nodes.rootNode = Interfaces.controller.createDivNode(mainWindow);
	nodes.rootNode.style.width = '100%';
	nodes.rootNode.style.height = '100%';
	nodes.rootNode.style.position = 'fixed';
	nodes.rootNode.style.left = 0;
	nodes.rootNode.style.top = 0;
	nodes.rootNode.style.zIndex = 1000;

	// main sub-container for inputs / text
	nodes.containerNode = Interfaces.controller.createDivNode(mainWindow);
	nodes.containerNode.className = 'Pictre-passcode-wrapper';

	// wrapped by containerNode. Wraps content-
	// containing elements such as divs, paragraphs, etc.
	var containerNodeContentWrapper = Interfaces.controller.createDivNode(mainWindow);
	containerNodeContentWrapper.className = 'Pictre-passcode-input-wrapper';

	// wrapped by containerNodeContentWrapper.
	// main text view for splash "modal"
	var containerNodeContentWrapperTextContent = Interfaces.controller.createDivNode(mainWindow);
	containerNodeContentWrapperTextContent.className = 'Pictre-passcode-p';
	containerNodeContentWrapperTextContent.style.fontSize = "0.85em";
	containerNodeContentWrapperTextContent.innerHTML = '';

	// reset inputs
	nodes.components.inputs = [];

	nodes.components.title = Interfaces.controller.createNode(mainWindow, 'b');
	nodes.components.title.className = 'brand';
	nodes.components.title.style.width = '100%';
	nodes.components.title.style.textAlign = 'center';
	nodes.components.title.style.fontSize = '2.2em';
	nodes.components.title.style.display = 'block';
	nodes.components.title.style.marginBottom = '10px';

	// only display title if set
	if (Modal.components.title) {
		nodes.components.title.innerHTML = Modal.components.title;
	}

	nodes.components.body = Interfaces.controller.createDivNode(mainWindow);
	nodes.components.body.innerHTML = Modal.components.body;

	// wrapped by containerNodeContentWrapper
	// display alerts or output text
	nodes.outputNode = Interfaces.controller.createDivNode(mainWindow);
	nodes.outputNode.className = 'Pictre-passcode-p Pictre-passcode-formal-font';
	nodes.outputNode.style.fontSize = '0.85em';
	nodes.outputNode.style.display = 'none';

	// create node tree
	containerNodeContentWrapperTextContent.appendChild(nodes.components.title);
	containerNodeContentWrapperTextContent.appendChild(nodes.components.body);
	containerNodeContentWrapper.appendChild(containerNodeContentWrapperTextContent);
	containerNodeContentWrapper.appendChild(nodes.outputNode);
	if (Modal.components.inputs.length) {
		for (var i = 0; i < Modal.components.inputs.length; i++) {
			nodes.components.inputs.push(Modal.components.inputs[i]);
			containerNodeContentWrapper.appendChild(nodes.components.inputs[i]);
		}
	}
	nodes.containerNode.appendChild(containerNodeContentWrapper);
	nodes.rootNode.appendChild(nodes.containerNode);
	parentNode.appendChild(nodes.rootNode);

	// init splash node events and adjust positions
	Events.nowAndOnNodeEvent(mainWindow, 'resize', function(e) {
		Interfaces.controller.centerNodeRelativeTo(nodes.containerNode, mainWindow);
	});
};

/**
 * Displays or creates the modal, then displays.
 * receives an optional array of inputs to display
 */
Modal.show = function(Interfaces, Events, mainWindow, parentNode, inputsArray) {
	if (!isCreated) {
		isCreated = true;
		Modal.create(Interfaces, Events, mainWindow, parentNode);
	} else {
		Modal.update();
		Interfaces.controller.centerNodeRelativeTo(nodes.containerNode, mainWindow);
	}

	// assumes rootNode exists
	if (!parentNodeCache[parentNode.nodeName]) {
		parentNodeCache[parentNode.nodeName] = parentNode;
		return;
	}
	nodes.rootNode.style.display = 'block';
};

Modal.hide = function(parentNode) {
	if (!isCreated) {
		return;
	}
	if (!parentNodeCache[parentNode.nodeName]) {
		return;
	}
	nodes.rootNode.style.display = 'none';
};

Modal.setTitle = function(title) {
	Modal.components.title = title;
};

Modal.setBody = function(body) {
	Modal.components.body = body;
};

Modal.setInputs = function(inputsArray) {
	if (inputsArray instanceof Array) {
		Modal.components.inputs = inputsArray;
	}
};

Modal.addInput = function(input) {
	Modal.components.inputs.push(input);
};

Modal.showAlert = function(text, timeout) {
	if (!nodes.outputNode) {
		return console.log('MODAL ALERT', 'Error displaying alert, no outputNode has been created; "show" the node first.');
	}

	nodes.outputNode.innerHTML = text;
	nodes.outputNode.style.display = 'block';

	if (!timeout) {
		return;
	}

	clearTimeout(alertTimeout);
	alertTimeout = setTimeout(function() {
		nodes.outputNode.style.display = 'none';
	}, timeout);
};

module.exports = Modal;
},{"../environment.js":"/Volumes/TINY/Documents/Pictre-pro/src/environment.js"}],"/Volumes/TINY/Documents/Pictre-pro/src/interfaces/overlay.js":[function(require,module,exports){
/**
 * Overlay interface
 */

var Overlay = {};

var isLocked = false;
var iterator = 0;
var comments = null;
var domElement = null;
var featuredImage = null;

var callbacks = {};
var nodes = {
	overlay: null
};

var isCreated = false;

Overlay.isLocked = function() {
	return isLocked;
}

Overlay.create = function(mainWindow) {
	isCreated = true;

	nodes.overlay = mainWindow.document.createElement('div');
	nodes.overlay.className = 'Pictre-overlay';
	nodes.overlay.style.display = 'none';
	nodes.overlay.style.zIndex = 999;
	mainWindow.document.body.appendChild(nodes.overlay);
};

Overlay.show = function(mainWindow) {
	if (!isCreated) {
		Overlay.create(mainWindow);
	}

	$(nodes.overlay).fadeIn(600);
}

Overlay.lock = function() {
	isLocked = true;
};

Overlay.unlock = function() {
	isLocked = false;
};

Overlay.hide = function(mainWindow) {
	if (!nodes.overlay) {
		return;
	}

	$(nodes.overlay).fadeOut(600);
}

Overlay.getFeaturedImage = function() {
	return featuredImage;
};

module.exports = Overlay;
},{}],"/Volumes/TINY/Documents/Pictre-pro/src/interfaces/splash.js":[function(require,module,exports){
/**
 * Splash interface controller for displaying
 * the main (front) view of the app.
 */

var SplashInterface = {};

nodes = {
	// holds "splash" view's background
	rootNode: null,
	inputNode: null
};

SplashInterface.settings = {
	alertTimeout: 10000
};

var isCreated = false;
var parentNodeCache = {};

SplashInterface.showAlert = function(Interfaces, text) {
	Interfaces.modal.showAlert(text);
};

SplashInterface.showAlertWithTimeout = function(Interfaces, text, timeout) {
	Interfaces.modal.showAlert(text, timeout || SplashInterface.settings.alertTimeout);
};

SplashInterface.attachInputs = function(Interfaces, Events, Client, mainWindow) {
	if (nodes.inputNode) {
		Interfaces.modal.setInputs([
			nodes.inputNode.getNode()
		]);
		return null;
	}

	nodes.inputNode = Interfaces.controller.newInputNode(Events, mainWindow);
	nodes.inputNode.setStyle('color', 'white');
	nodes.inputNode.setAttribute('maxlength', 100);
	nodes.inputNode.setPlaceholder('Enter an album name');

	if (Client.isIE() || Client.isMobileSafari() || Client.isSafari('5.1')) {
		nodes.inputNode.setAttribute('nofocus', true);
		nodes.inputNode.setAttribute('value', value);

		nodes.inputNode.on('blur', function(e) {
			if (this.node.value == "" && this.value != '') {
				this.node.value = this.value;
			}
		});
	}

	Events.onNodeEvent(nodes.inputNode.getNode(), 'keydown', function(e) {
		if (!e || e.keyCode != 13) {
			return;
		}

		if (!this.isValueEmpty()) {
			var value = this.getEscapedValue();
			if (!Interfaces.board.isNameRestricted(value)) {
				if (Interfaces.board.isNameInvalid(value)) {
					if (Interfaces.board.isNameWithSpaces(value)) {
						SplashInterface.showAlertWithTimeout(Interfaces, "Your album name cannot contain spaces.");
						return;
					}
					SplashInterface.showAlertWithTimeout(Interfaces, "Your album name contains invalid characters.");
					return;
				}
				mainWindow.location.assign(value);
			} else {
				this.setValue('');
				SplashInterface.showAlertWithTimeout(Interfaces, "That album is restricted, please try another.");
			}
		}
	}.bind(nodes.inputNode));

	Interfaces.modal.setInputs([
		nodes.inputNode.getNode()
	]);

	return null;
};

SplashInterface.show = function(Interfaces, Events, Client, mainWindow, parentNode) {
	if (!isCreated) {
		isCreated = true;
		nodes.rootNode = Interfaces.controller.createDivNode(mainWindow);
		nodes.rootNode.className = 'Pictre-splash-wrapper';
		nodes.rootNode.style.zIndex = 998;
	}
	if (!parentNodeCache[parentNode.nodeName]) {
		parentNodeCache[parentNode.nodeName] = parentNode;
		parentNode.appendChild(nodes.rootNode);
	}

	// set these properties every time, in case modal gets used by
	// another application component with different values
	Interfaces.modal.setTitle('Pictre');
	Interfaces.modal.setBody("<b class='brand'>Pictre</b> <span>is a collection of cloud photo albums. You can view or create picture albums based on interests, people, or families. </span>" +
		"<span>To get started, simply type an album name below.</span>");

	var albumInput = Interfaces.controller.createNode(mainWindow, 'input');
	albumInput.maxlength = 100;
	albumInput.className = 'Pictre-passcode-input';
	albumInput.type = 'text;'
	albumInput.placeholder = 'Enter an album name';
	albumInput.style.color = 'white';

	SplashInterface.attachInputs(Interfaces, Events, Client, mainWindow);

	Interfaces.overlay.show(mainWindow);
	Interfaces.modal.show(Interfaces, Events, mainWindow, parentNode);

	Interfaces.controller.setNodeOverflowHidden(mainWindow.document.body);
	Interfaces.overlay.lock();

	nodes.inputNode.getNode().focus();
}

module.exports = SplashInterface;
},{}],"/Volumes/TINY/Documents/Pictre-pro/src/interfaces/warning.js":[function(require,module,exports){
/**
 * Warning interface. Displays errors, warnings, dialogues.
 */

var WarningInterface = {

	domElement: null,
	response: null,

	/**
	 * Creates and displays warning interface.
	 * @param properties [object] containing interface settings to override
	 *
	 */
	put: function(properties) {

		var self = this;

		var settings = {

			body: 'An error has occurred, don\'t worry though, it\'s not your fault!',
			dropzone: false,
			header: 'Hey!',
			icon: null,
			locked: false,
			style: true,
			modal: true

		};

		if (properties) {

			for (var i in properties) {
				settings[i] = properties[i];
			}

		}

		if (!settings.modal) {
			return;
		}

		////---
		if (Pictre.gallery.is.featuring && settings.locked) {
			Pictre._storage.overlay.locked = false;
			Pictre.gallery.overlay.exit();
		}

		this.domElement = document.createElement("div");
		this.domElement.className = "Pictre-upload Pictre-warning";

		Pictre.gallery.is.warning = true;

		Pictre.extend(Pictre.gallery.overlay.put().appendChild(this.domElement)).on('click', function(e) {
			e.stopPropagation();
		});

		this.position();

		Pictre.events.on('resize', function() {
			self.position();
		});

		var header = document.createElement("div");
		header.className = "Pictre-upload-header";
		header.innerHTML = settings.header;
		header.style.zIndex = "999";

		var p = document.createElement("p");
		p.className = "Pictre-warning-p";
		p.innerHTML = settings.body || "Untitled text";

		this.domElement.appendChild(header);

		if (settings.dropzone) {
			var shader = document.createElement("div");
			shader.className = "Pictre-upload-area-shader";
			shader.appendChild(p);
			var area = document.createElement("div");
			area.className = "Pictre-upload-area";
			area.appendChild(shader);
			this.domElement.appendChild(area);
			area.style.marginLeft = (-area.clientWidth / 2) + "px";
			area.style.marginTop = (-area.clientHeight / 2 + 20) + "px";
		} else {
			// not upload interface, warning ui instead
			this.domElement.appendChild(p);
			p.style.marginTop = ((this.domElement.clientHeight - header.clientHeight) / 2 - (p.clientHeight / 2)) + "px";

			header.style.top = (-p.clientHeight) + 'px';
		}

		if (settings.icon) {

			var icon = document.createElement("img");
			icon.src = settings.icon;
			icon.style.display = "block";
			icon.style.margin = "20px auto 0 auto";

			p.appendChild(icon);

		}

		if (settings.locked) {
			Pictre._storage.overlay.locked = true;
		}

		if (typeof this.onclick == 'function') {

			if (settings.dropzone) {

				Pictre.extend(area).on('click', function() {
					self.onclick();
				});

			} else {

				Pictre.extend(this.domElement).on('click', function() {
					self.onclick();
				});

			}

		}
	},

	onclick: null,

	position: function() {
		if (this.domElement) {
			this.domElement.style.left = Math.max($(window).width() / 2 - (this.domElement.clientWidth / 2), 0) + "px";
			this.domElement.style.top = Math.max(($(window).height() / 2 - (this.domElement.clientHeight / 2)), 0) + "px";
		}
	},

	remove: function() {
		Pictre.gallery.is.warning = false;
		Pictre.gallery.overlay.exit();
		this.domElement.parentNode.removeChild(this.domElement);
		this.domElement = null;
	}

}

module.exports = WarningInterface;
},{}],"/Volumes/TINY/Documents/Pictre-pro/src/picture.js":[function(require,module,exports){
/**
 * Picture object module. Adds Picture properties and event listeners.
 * @instanced module
 *
 * @author juanvallejo
 * @date 8/21/16
 */

var Img = require('./image.js');
var picture_inner_text = 'Loading...';

function Picture(Interfaces, Events, mainWindow) {
	var self = this;

	this.node = Interfaces.controller.createDivNode(mainWindow);
	this.node.innerHTML = picture_inner_text;
	this.node.className = 'Pictre-pic';

	this.imageObject = null;

	this.parentNode = null;
	this.imageNode = null;

	this.childNodes = [];
	this.data = {};
	this.flags = {};

	// set node id
	this.setNodeID = function(id) {
		this.node.id = id;
	};

	this.getNodeID = function() {
		return this.node.id;
	};

	// set object data model (JSON object with server object properties)
	this.setData = function(data) {
		this.data = data;
	};

	// assumes setData has already been called.
	// sets a specific property value for the data struct
	this.setDataValue = function(property, value) {
		this.data[property] = value;
	};

	// retrieve this node's computed style for specific property
	this.getCSSComputedStyle = function(property) {
		return mainWindow.getComputedStyle(this.node).getPropertyValue(property);
	};

	this.getCSSComputedStyleAsInt = function(property) {
		return parseInt(this.getCSSComputedStyle(property).split("px")[0]);
	};

	this.getNodePropertyValue = function(property) {
		return this.node[property]
	};

	this.setNodePropertyValue = function(property, value) {
		this.node[property] = value;
	};

	// sets style property for node
	this.setCSSPropertyValue = function(property, value) {
		this.node.style[property] = value;
	};

	this.getCSSPropertyValue = function(property) {
		return this.node.style[property];
	};

	// sets this.node's parent
	this.setParentNode = function(parentNode) {
		parentNode.appendChild(this.node);
		this.parentNode = parentNode;
	};

	// add distinctive flag to differentiate this specific instance.
	// flag is a property added to the class, not the node
	this.setFlag = function(flag, value) {
		this.flags[flag] = value || true;
	};

	this.removeFlag = function(flag) {
		if (this.flags[flag]) {
			this.flags[flag] = false;
		}
	};

	this.getFlag = function(flag) {
		return this.flags[flag];
	};

	this.hasFlag = function(flag) {
		return this.flags[flag];
	};

	this.getNode = function() {
		return this.node;
	};

	// appends a node element
	this.addChildNode = function(node) {
		this.childNodes.push(node);
		this.node.appendChild(node);
	};

	// add image node from an Img object
	this.addImage = function(object) {
		if (!(object instanceof Img)) {
			return console.log('ERR PICTURE_JS addImage', 'attempted to add an incorrect object type as image object.');
		}
		this.imageObject = object;
		this.addImageNode(object.getNode());
	};

	// add image child node
	this.addImageNode = function(node) {
		this.addChildNode(node);
		this.imageNode = node;
	};

	this.getImageNode = function() {
		return this.imageNode;
	};

	this.getChildNode = function(nodeIndex) {
		return this.childNodes[nodeIndex];
	};

	this.getChildNodes = function(nodeIndex) {
		return this.childNodes;
	};

	// alters only this instance, sets node innerHTML
	this.setInnerText = function(text) {
		this.node.innerHTML = text;
	};

	// define event handlers for this instance
	this.clickEventHandler = function(e) {
		console.log(Interfaces.overlay);
	};

	// attach node events
	attachEventClick(Events, this.node, this.clickEventHandler);
}

// alters all new instances
Picture.setInnerText = function(text) {
	picture_inner_text = text;
};

// internal object functions
function attachEventClick(Events, node, handler) {
	Events.onNodeEvent(node, 'click', handler);
}

module.exports = Picture;
},{"./image.js":"/Volumes/TINY/Documents/Pictre-pro/src/image.js"}],"/Volumes/TINY/Documents/Pictre-pro/src/server.js":[function(require,module,exports){
/**
 * Module for handling server requets
 */

var Environment = require('./environment.js');
var Server = {};

Server.components = {
	anchor: 0,
	limit: Environment.itemAmountPageLoad
}

// /api/album/<albumname>/offset<0>/limit<100>
Server.get = function(endpoint, callback) {
	var request = new XMLHttpRequest();
	request.open('GET', endpoint, true);

	if (window.XDomainRequest) {
		var xdr = new XDomainRequest();
		xdr.open("get", endpoint);
		xdr.send(null);
		xdr.onload = function() {
			callback.call(xdr, null, xdr.responseText);
		};
		xdr.onerror = function(error) {
			callback.call(xdr, error, null);
		};
	} else {
		$.support.cors = true;
		$.ajax({
			type: 'GET',
			url: endpoint,
			async: true,
			crossDomain: true,
			success: function(data) {
				callback.call(this, null, data);
			},
			error: function(error) {
				callback.call(this, error, null);
			}
		});
	}
};

Server.getAlbumSize = function(albumName, callback) {
	Server.get('/api/albumsize/' + albumName, function(err, response) {
		if (err) {
			return callback.call(Server, err, null);
		}

		try {
			callback.call(Server, null, response)
		} catch (e) {
			callback.call(Server, e, null);
		}
	});
};

// retrieves album data starting at a specific anchor
Server.getAlbumAtAnchor = function(albumName, offset, limit, callback) {
	Server.get('/api/album/' + albumName + '/' + offset + '/' + limit, function(err, response) {
		if (err) {
			return callback.call(Server, err, null);
		}

		try {
			callback.call(Server, null, response);
		} catch (e) {
			callback.call(Server, e, null);
		}
	});
};

Server.getAlbum = function(albumName, callback) {
	Server.getAlbumAtAnchor(albumName, Server.components.anchor, Server.components.limit, callback);
};

Server.setRequestAnchor = function(data) {
	Server.components.anchor = data;
};

Server.setRequestLimit = function(data) {
	Server.components.limit = data;
}

module.exports = Server;
},{"./environment.js":"/Volumes/TINY/Documents/Pictre-pro/src/environment.js"}],"/Volumes/TINY/Documents/Pictre-pro/src/utilities.js":[function(require,module,exports){
/**
 * Helper functions
 */

var Utilities = {};

Utilities.extend = function(domObject) {

	return {
		on: function(type, callback) {
			try {
				domObject.addEventListener(type, function(e) {
					if (typeof callback == 'function') callback.call(domObject, e);
				});
			} catch (e) {
				domObject.attachEvent('on' + type, function(e) {
					if (typeof callback == 'function') callback.call(domObject, e);
				});
			}
		}
	};

}

module.exports = Utilities;
},{}]},{},["./src/main.js"])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvbWFpbi5qcyIsInNyYy9jbGllbnQuanMiLCJzcmMvZW52aXJvbm1lbnQuanMiLCJzcmMvZXZlbnRzLmpzIiwic3JjL2ltYWdlLmpzIiwic3JjL2ludGVyZmFjZS5qcyIsInNyYy9pbnRlcmZhY2VzL2JvYXJkLmpzIiwic3JjL2ludGVyZmFjZXMvY29udHJvbGxlci5qcyIsInNyYy9pbnRlcmZhY2VzL2dhbGxlcnkuanMiLCJzcmMvaW50ZXJmYWNlcy9pbmRleC5qcyIsInNyYy9pbnRlcmZhY2VzL21lbnUuanMiLCJzcmMvaW50ZXJmYWNlcy9tb2RhbC5qcyIsInNyYy9pbnRlcmZhY2VzL292ZXJsYXkuanMiLCJzcmMvaW50ZXJmYWNlcy9zcGxhc2guanMiLCJzcmMvaW50ZXJmYWNlcy93YXJuaW5nLmpzIiwic3JjL3BpY3R1cmUuanMiLCJzcmMvc2VydmVyLmpzIiwic3JjL3V0aWxpdGllcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbE5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMWZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdk1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogUGljdHJlIGNsaWVudCBjb3JlLiBVc2VzIGJyb3dzZXJpZnkgdG8gbWFpbnRhaW5cbiAqIE5vZGUtbGlrZSBtb2R1bGFyIHN0cnVjdHVyZS4gRG8gJ25wbSBpbnN0YWxsJyBpbiBvcmRlclxuICogdG8gb2J0YWluIGFsbCByZXF1aXJlZCBkZXYgcGFja2FnZXMuIEJ1aWxkIHN5c3RlbSBpcyAnZ3VscCcuXG4gKiBCdWlsZHMgdG8gJy9kaXN0L1BpY3RyZS5qcycuXG4gKlxuICogQGF1dGhvciBqdWFudmFsbGVqb1xuICogQGRhdGUgNS8zMS8xNVxuICovXG5cbnZhciBDbGllbnQgPSByZXF1aXJlKCcuL2NsaWVudC5qcycpO1xudmFyIEVudmlyb25tZW50ID0gcmVxdWlyZSgnLi9lbnZpcm9ubWVudC5qcycpO1xudmFyIEludGVyZmFjZXMgPSByZXF1aXJlKCcuL2ludGVyZmFjZS5qcycpO1xudmFyIEV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzLmpzJyk7XG52YXIgU2VydmVyID0gcmVxdWlyZSgnLi9zZXJ2ZXIuanMnKTtcblxudmFyIFBpY3RyZSA9IHt9O1xuXG4vKipcbiAqIEluaXRpYWxpemVzIGFwcGxpY2F0aW9uIHZhcmlhYmxlcyBhbmQgZGVmYXVsdCBzZXR0aW5ncy5cbiAqXG4gKiBAcGFyYW0gYXBwbGljYXRpb25XcmFwcGVyIFx0W1N0cmluZ10gZG9tIGVsZW1lbnQgaWQgb2YgYXBwbGljYXRpb24gY29udGFpbmVyXG4gKiBAcGFyYW0gcmVzb3VyY2VMb2NhdGlvbiBcdFx0W1N0cmluZ10gdXJsIG9mIGNsb3VkIGRpcmVjdG9yeSBjb250YWluaW5nIGFsbCBpbWFnZXNcbiAqIEBwYXJhbSBhcHBEYXRhTG9jYXRpb24gXHRcdFtTdHJpbmddIHVybCBvZiBjbG91ZCBkaXJlY3RvcnkgY29udGFpbmluZyBhcHBsaWNhdGlvbiBmaWxlc1xuICovXG5QaWN0cmUuaW5pdCA9IGZ1bmN0aW9uKG1haW5XaW5kb3csIGFwcGxpY2F0aW9uV3JhcHBlciwgcmVzb3VyY2VMb2NhdGlvbiwgYXBwRGF0YUxvY2F0aW9uLCBkZXZlbG9wZXJNb2RlKSB7XG5cdHZhciBzcGFjZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuXHRzcGFjZXIuY2xhc3NOYW1lID0gXCJQaWN0cmUtc3BhY2VyXCI7XG5cblx0aWYgKHJlc291cmNlTG9jYXRpb24pIHtcblx0XHRFbnZpcm9ubWVudC5jbG91ZC5kYXRhZGlyID0gcmVzb3VyY2VMb2NhdGlvbjtcblx0fVxuXHRpZiAoYXBwRGF0YUxvY2F0aW9uKSB7XG5cdFx0RW52aXJvbm1lbnQuY2xvdWQuYWRkcmVzcyA9IGFwcERhdGFMb2NhdGlvbjtcblx0fVxuXHRpZiAoIWRldmVsb3Blck1vZGUpIHtcblx0XHRFbnZpcm9ubWVudC5pblByb2R1Y3Rpb24gPSB0cnVlO1xuXHR9XG5cblx0Ly8gY3JlYXRlIGFuZCBwbGFjZSBtZW51IGJlZm9yZSBhcHBsaWNhdGlvbiB3cmFwcGVyXG5cdEludGVyZmFjZXMubWVudS5wdXQobWFpbldpbmRvdy5kb2N1bWVudC5ib2R5LCBhcHBsaWNhdGlvbldyYXBwZXIpO1xuXG5cdC8vIGRldGVjdCBjbGllbnQgc2V0dGluZ3Ncblx0Q2xpZW50LmluaXQoKTtcblxuXHRpZiAoSW50ZXJmYWNlcy5ib2FyZC5pc1NldCgpKSB7XG5cdFx0dmFyIGJvYXJkTmFtZSA9IEludGVyZmFjZXMuYm9hcmQuZ2V0TmFtZSgpO1xuXHRcdGlmIChJbnRlcmZhY2VzLmJvYXJkLmlzTmFtZVJlc3RyaWN0ZWQoYm9hcmROYW1lKSB8fCBJbnRlcmZhY2VzLmJvYXJkLmlzTmFtZUludmFsaWQoYm9hcmROYW1lKSkge1xuXHRcdFx0SW50ZXJmYWNlcy5zcGxhc2guc2hvdyhJbnRlcmZhY2VzLCBFdmVudHMsIENsaWVudCwgbWFpbldpbmRvdywgbWFpbldpbmRvdy5kb2N1bWVudC5ib2R5KTtcblx0XHRcdGlmIChJbnRlcmZhY2VzLmJvYXJkLmlzTmFtZVJlc3RyaWN0ZWQoYm9hcmROYW1lKSkge1xuXHRcdFx0XHRJbnRlcmZhY2VzLnNwbGFzaC5zaG93QWxlcnQoSW50ZXJmYWNlcywgJ1RoYXQgYWxidW0gaXMgcmVzdHJpY3RlZCwgcGxlYXNlIHRyeSBhbm90aGVyLicpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0SW50ZXJmYWNlcy5zcGxhc2guc2hvd0FsZXJ0KEludGVyZmFjZXMsICdZb3VyIGFsYnVtIGNvbnRhaW5zIGludmFsaWQgY2hhcmFjdGVycy4nKTtcblx0XHRcdH1cblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRJbnRlcmZhY2VzLmJvYXJkLnNob3coSW50ZXJmYWNlcywgRXZlbnRzLCBTZXJ2ZXIsIG1haW5XaW5kb3csIGFwcGxpY2F0aW9uV3JhcHBlcik7XG5cdFx0SW50ZXJmYWNlcy5ib2FyZC5zaG93QWxlcnQoJ0xvYWRpbmcsIHBsZWFzZSB3YWl0Li4uJyk7XG5cdH0gZWxzZSB7XG5cdFx0Ly8gc2hvdyBtYWluIHZpZXdcblx0XHRJbnRlcmZhY2VzLnNwbGFzaC5zaG93KEludGVyZmFjZXMsIEV2ZW50cywgQ2xpZW50LCBtYWluV2luZG93LCBtYWluV2luZG93LmRvY3VtZW50LmJvZHkpO1xuXHRcdGlmIChFbnZpcm9ubWVudC5pc1VwZGF0aW5nKSB7XG5cdFx0XHRJbnRlcmZhY2VzLnNwbGFzaC5zaG93QWxlcnQoSW50ZXJmYWNlcywgJ1VwZGF0ZXMgYXJlIGN1cnJlbnRseSBpbiBwcm9ncmVzcy4uLicpO1xuXHRcdH1cblx0fVxufVxuXG53aW5kb3cuUGljdHJlID0gUGljdHJlOyIsIi8qKlxuICogQ2xpZW50IG1hbmFnZXIgZm9yIGFwcGxpY2F0aW9uIHJ1bnRpbWUuIFByb3ZpZGVzIHV0aWxpdGllcyBhbmRcbiAqIGF3YXJlbmVzcyBvZiBicm93c2VyIGluZm9ybWF0aW9uIC8gY29tcGF0aWJpbGl0eS5cbiAqXG4gKiBAYXV0aG9yIGp1YW52YWxsZWpvXG4gKiBAZGF0ZSA2LzEvMTVcbiAqL1xuXG52YXIgSW50ZXJmYWNlID0gcmVxdWlyZSgnLi9pbnRlcmZhY2UuanMnKTtcblxudmFyIENsaWVudCA9IHt9O1xuXG4vLyBob2xkcyBicm93c2VyIG5hbWVzXG5DbGllbnQuYnJvd3NlciA9IHtcblxuXHRVTktOT1dOOiAwLFxuXHRDSFJPTUU6IDEsXG5cdFNBRkFSSTogMixcblx0TU9CSUxFX1NBRkFSSTogMyxcblx0RklSRUZPWDogNCxcblx0T1BFUkE6IDUsXG5cdElFX01PREVSTjogNixcblx0SUVfVU5TVVBQT1JURUQ6IDcsXG5cdElFX09USEVSOiA4XG5cbn07XG5cbi8qKlxuICogZmxhZyBpbmRpY2F0aW5nIGlmIHVzaW5nIGNvbXBhdGlibGUgYnJvd3NlclxuICovXG5DbGllbnQuY29tcGF0aWJsZSA9IHRydWU7XG5DbGllbnQuaWQgPSBDbGllbnQuYnJvd3Nlci5VTktOT1dOXG5DbGllbnQubmFtZSA9ICdVbmtub3duJztcbkNsaWVudC52ZXJzaW9uID0gMDtcblxuQ2xpZW50Lm9zID0gbmF2aWdhdG9yLnBsYXRmb3JtO1xuQ2xpZW50Lm9ubGluZSA9IG5hdmlnYXRvci5vbkxpbmU7XG5cbkNsaWVudC5nZXRJZCA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gQ2xpZW50LmlkO1xufTtcblxuQ2xpZW50LmlzSUUgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIENsaWVudC5pZCA9PSBDbGllbnQuYnJvd3Nlci5JRV9NT0RFUk4gfHwgQ2xpZW50LmlkID09IENsaWVudC5icm93c2VyLklFX1VOU1VQUE9SVEVEIHx8IENsaWVudC5pZCA9PSBDbGllbnQuYnJvd3Nlci5JRV9PVEhFUjtcbn07XG5cbkNsaWVudC5pc01vYmlsZVNhZmFyaSA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gQ2xpZW50LmlkID09IENsaWVudC5icm93c2VyLk1PQklMRV9TQUZBUkk7XG59O1xuXG5DbGllbnQuaXNTYWZhcmkgPSBmdW5jdGlvbih2ZXJzaW9uKSB7XG5cdGlmICh2ZXJzaW9uKSB7XG5cdFx0cmV0dXJuIENsaWVudC5pZCA9PSBDbGllbnQuYnJvd3Nlci5TQUZBUkkgJiYgQ2xpZW50LnZlcnNpb24uc3BsaXQoJycpLmluZGV4T2YodmVyc2lvbikgIT0gLTE7XG5cdH1cblx0cmV0dXJuIENsaWVudC5pZCA9PSBDbGllbnQuYnJvd3Nlci5TQUZBUkk7XG59O1xuXG4vKipcbiAqIENvbGxlY3RzIGluZm9ybWF0aW9uIGFib3V0IGJyb3dzZXIgdmVyc2lvbixcbiAqIGNvbXBhdGliaWxpdHksIG5hbWUsIGFuZCBkaXNwbGF5IGluZm9ybWF0aW9uXG4gKiBiYXNlZCBvbiB1c2VyIGFnZW50IHN0cmluZy5cbiAqL1xuQ2xpZW50LmluaXQgPSBmdW5jdGlvbigpIHtcblxuXHRpZiAobmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKFwiQXBwbGVXZWJLaXRcIikgIT0gLTEpIHtcblxuXHRcdGlmIChuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoXCJDaHJvbWVcIikgIT0gLTEpIHtcblx0XHRcdENsaWVudC5uYW1lID0gXCJDaHJvbWVcIjtcblx0XHRcdENsaWVudC5pZCA9IENsaWVudC5icm93c2VyLkNIUk9NRTtcblx0XHR9IGVsc2Uge1xuXG5cdFx0XHRpZiAobmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKFwiTW9iaWxlXCIpICE9IC0xKSB7XG5cdFx0XHRcdENsaWVudC5uYW1lID0gXCJNb2JpbGUgU2FmYXJpXCI7XG5cdFx0XHRcdENsaWVudC5pZCA9IENsaWVudC5icm93c2VyLk1PQklMRV9TQUZBUkk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRDbGllbnQubmFtZSA9IFwiU2FmYXJpXCI7XG5cdFx0XHRcdENsaWVudC5pZCA9IENsaWVudC5icm93c2VyLlNBRkFSSTtcblxuXHRcdFx0XHR2YXIgdmVyc2lvbiA9IG5hdmlnYXRvci51c2VyQWdlbnQuc3BsaXQoXCJWZXJzaW9uL1wiKTtcblx0XHRcdFx0Q2xpZW50LnZlcnNpb24gPSB2ZXJzaW9uWzFdLnNwbGl0KFwiIFwiKVswXTtcblx0XHRcdH1cblxuXHRcdH1cblxuXHR9IGVsc2Uge1xuXG5cdFx0aWYgKG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZihcIkZpcmVmb3hcIikgIT0gLTEpIHtcblx0XHRcdENsaWVudC5uYW1lID0gXCJGaXJlZm94XCI7XG5cdFx0XHRDbGllbnQuaWQgPSBDbGllbnQuYnJvd3Nlci5GSVJFRk9YO1xuXHRcdH0gZWxzZSBpZiAobmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKFwiT3BlcmFcIikgIT0gLTEpIHtcblx0XHRcdENsaWVudC5uYW1lID0gXCJPcGVyYVwiO1xuXHRcdFx0Q2xpZW50LmlkID0gQ2xpZW50LmJyb3dzZXIuT1BFUkE7XG5cdFx0fSBlbHNlIGlmIChuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoXCJNU0lFIFwiKSAhPSAtMSkge1xuXG5cdFx0XHRpZiAobmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKFwiVHJpZGVudFwiKSAhPSAtMSkge1xuXG5cdFx0XHRcdHZhciB2ZXJzaW9uID0gbmF2aWdhdG9yLnVzZXJBZ2VudC5zcGxpdChcIjtcIilbMV07XG5cdFx0XHRcdHZlcnNpb24gPSBwYXJzZUludCh2ZXJzaW9uLnNwbGl0KFwiIFwiKVsyXSk7XG5cblx0XHRcdFx0Q2xpZW50Lm5hbWUgPSBcIkludGVybmV0IEV4cGxvcmVyXCI7XG5cdFx0XHRcdENsaWVudC52ZXJzaW9uID0gdmVyc2lvbjtcblxuXHRcdFx0XHRpZiAodmVyc2lvbiA+IDgpIHtcblx0XHRcdFx0XHRDbGllbnQuaWQgPSBDbGllbnQuYnJvd3Nlci5JRV9NT0RFUk47XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Q2xpZW50LmlkID0gQ2xpZW50LmJyb3dzZXIuSUVfVU5TVVBQT1JURUQ7XG5cdFx0XHRcdH1cblxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Q2xpZW50Lm5hbWUgPSBcIkludGVybmV0IEV4cGxvcmVyXCI7XG5cdFx0XHRcdENsaWVudC5pZCA9IENsaWVudC5icm93c2VyLklFX09USEVSO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRDbGllbnQubmFtZSA9ICdPdGhlcic7XG5cdFx0XHRDbGllbnQuaWQgPSBDbGllbnQuYnJvd3Nlci5VTktOT1dOO1xuXHRcdH1cblxuXHR9XG5cblx0Ly8gRGV0ZWN0IGlmIHVzaW5nIGhvcGVsZXNzIGJyb3dzZXJcblx0aWYgKENsaWVudC5pZCA9PSBDbGllbnQuYnJvd3Nlci5JRV9VTlNVUFBPUlRFRCB8fCBDbGllbnQuaWQgPT0gQ2xpZW50LmJyb3dzZXIuSUVfT1RIRVIpIHtcblxuXHRcdHZhciB3YXJuaW5nO1xuXHRcdHZhciBsb2NrID0gZmFsc2U7XG5cdFx0dmFyIGhlYWRlciA9ICdTb3JyeSBhYm91dCB0aGF0ISc7XG5cblx0XHRpZiAoQ2xpZW50LmlkID09IENsaWVudC5icm93c2VyLklFX09USEVSKSB7XG5cblx0XHRcdHdhcm5pbmcgPSBcIlVuZm9ydHVuYXRlbHkgUGljdHJlIGlzIG5vdCBzdXBwb3J0ZWQgaW4geW91ciBicm93c2VyLCBwbGVhc2UgY29uc2lkZXIgdXBncmFkaW5nIHRvIEdvb2dsZSBDaHJvbWUsIGJ5IGNsaWNraW5nIGhlcmUsIGZvciBhbiBvcHRpbWFsIGJyb3dzaW5nIGV4cGVyaWVuY2UuXCI7XG5cdFx0XHRsb2NrID0gdHJ1ZTtcblxuXHRcdFx0SW50ZXJmYWNlLndhcm5pbmcub25jbGljayA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR3aW5kb3cub3BlbihcImh0dHA6Ly9jaHJvbWUuZ29vZ2xlLmNvbVwiLCBcIl9ibGFua1wiKTtcblx0XHRcdH07XG5cblx0XHR9IGVsc2Uge1xuXG5cdFx0XHRoZWFkZXIgPSAnTm90aWNlISc7XG5cdFx0XHR3YXJuaW5nID0gXCJTb21lIG9mIFBpY3RyZSdzIGZlYXR1cmVzIG1heSBub3QgYmUgZnVsbHkgc3VwcG9ydGVkIGluIHlvdXIgYnJvd3Nlci5cIjtcblxuXHRcdFx0SW50ZXJmYWNlLndhcm5pbmcub25jbGljayA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR0aGlzLnJlbW92ZSgpO1xuXHRcdFx0fTtcblxuXHRcdH1cblxuXHRcdENsaWVudC5jb21wYXRpYmxlID0gZmFsc2U7XG5cblx0XHRJbnRlcmZhY2Uud2FybmluZy5wdXQoe1xuXG5cdFx0XHRoZWFkZXI6IGhlYWRlcixcblx0XHRcdGJvZHk6IHdhcm5pbmcsXG5cdFx0XHRsb2NrZWQ6IGxvY2tcblxuXHRcdH0pO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQ2xpZW50OyIsIi8qKlxuICogQXBwbGljYXRpb24gZW52aXJvbm1lbnQgZHVyaW5nIHJ1bnRpbWUuIFN0b3JlcyBkeW5hbWljXG4gKiBnbG9iYWwgdmFsdWVzIGZvciBhcHBsaWNhdGlvbiBtb2R1bGUgc3VwcG9ydC5cbiAqXG4gKiBAYXV0aG9yIGp1YW52YWxsZWpvXG4gKiBAZGF0ZSA1LzMxLzE1XG4gKi9cblxudmFyIEVudmlyb25tZW50ID0ge307XG5cbkVudmlyb25tZW50LmNsb3VkID0ge1xuXHRkYXRhZGlyOiAnJyxcblx0YWRkcmVzczogJydcbn1cblxuRW52aXJvbm1lbnQuYXBwID0ge1xuXHR0aXRsZTogJ1BpY3RyZSdcbn1cblxuRW52aXJvbm1lbnQuZXZlbnRzID0ge307XG5cbkVudmlyb25tZW50LmluUHJvZHVjdGlvbiA9IGZhbHNlO1xuRW52aXJvbm1lbnQuaXNVcGRhdGluZyA9IGZhbHNlO1xuXG5FbnZpcm9ubWVudC5hbmltYXRpb25TcGVlZCA9IDEwMDA7XG5FbnZpcm9ubWVudC5tYXhJbWFnZVdpZHRoID0gODAwO1xuRW52aXJvbm1lbnQubWF4SW1hZ2VIZWlnaHQgPSAxMzc7XG5FbnZpcm9ubWVudC5hbGVydER1cmF0aW9uID0gMTAwMDA7XG5cbkVudmlyb25tZW50LmJhc2VBUElVcmwgPSAnaHR0cDovL3N0YXRpYy1waWN0cmUucmhjbG91ZC5jb20vJztcblxuLy8gbG9hZCB4IGl0ZW1zIG9uIHBhZ2UgbG9hZFxuRW52aXJvbm1lbnQuaXRlbUFtb3VudFBhZ2VMb2FkID0gNTA7XG4vLyBsb2FkIHggaXRlbXMgcGVyIHN1YnNlcXVlbnQgcmVxdWVzdFxuRW52aXJvbm1lbnQuaXRlbUFtb3VudFJlcXVlc3QgPSAyNTtcblxubW9kdWxlLmV4cG9ydHMgPSBFbnZpcm9ubWVudDsiLCIvKipcbiAqIEFwcGxpY2F0aW9uIGV2ZW50cyBjb250cm9sbGVyXG4gKi9cblxudmFyIEV2ZW50cyA9IHt9O1xudmFyIHJlZ2lzdGVyZWRHbG9iYWxFdmVudHMgPSB7fTtcbnZhciByZWdpc3RlcmVkTm9kZUV2ZW50cyA9IHt9O1xuXG52YXIgbm9kZVN0YXRlQ2FjaGUgPSB7fTtcblxuLyoqXG4gKiBMaXN0ZW5zIGZvciBhIGRvbSBldmVudFxuICovXG5FdmVudHMub25DYWNoZWROb2RlRXZlbnQgPSBmdW5jdGlvbihub2RlLCBldmVudE5hbWUsIGNhbGxiYWNrKSB7XG5cdGlmICghcmVnaXN0ZXJlZE5vZGVFdmVudHNbbm9kZS5ub2RlTmFtZV0pIHtcblx0XHRyZWdpc3RlcmVkTm9kZUV2ZW50c1tub2RlLm5vZGVOYW1lXSA9IHt9O1xuXHR9XG5cblx0aWYgKCFyZWdpc3RlcmVkTm9kZUV2ZW50c1tub2RlLm5vZGVOYW1lXVtldmVudE5hbWVdKSB7XG5cdFx0cmVnaXN0ZXJlZE5vZGVFdmVudHNbbm9kZS5ub2RlTmFtZV1bZXZlbnROYW1lXSA9IFtdO1xuXG5cdFx0ZnVuY3Rpb24gbm9kZUV2ZW50KGUpIHtcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgcmVnaXN0ZXJlZE5vZGVFdmVudHNbbm9kZS5ub2RlTmFtZV1bZXZlbnROYW1lXS5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRpZiAodHlwZW9mIHJlZ2lzdGVyZWROb2RlRXZlbnRzW25vZGUubm9kZU5hbWVdW2V2ZW50TmFtZV1baV0gPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdHJlZ2lzdGVyZWROb2RlRXZlbnRzW25vZGUubm9kZU5hbWVdW2V2ZW50TmFtZV1baV0uY2FsbChub2RlLCBlKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHRyeSB7XG5cdFx0XHRub2RlLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBub2RlRXZlbnQpO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdG5vZGUuYXR0YWNoRXZlbnQoJ29uJyArIGV2ZW50TmFtZSwgbm9kZUV2ZW50KTtcblx0XHR9XG5cdH1cblxuXHRyZWdpc3RlcmVkTm9kZUV2ZW50c1tub2RlLm5vZGVOYW1lXVtldmVudE5hbWVdLnB1c2goY2FsbGJhY2spO1xufTtcblxuRXZlbnRzLm9uTm9kZUV2ZW50ID0gZnVuY3Rpb24obm9kZSwgZXZlbnROYW1lLCBjYWxsYmFjaykge1xuXHR0cnkge1xuXHRcdG5vZGUuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGNhbGxiYWNrKTtcblx0fSBjYXRjaCAoZSkge1xuXHRcdG5vZGUuYXR0YWNoRXZlbnQoJ29uJyArIGV2ZW50TmFtZSwgY2FsbGJhY2spO1xuXHR9XG59O1xuXG4vKipcbiAqIENhbGxzIGNhbGxiYWNrIGZ1bmN0aW9uIHNjb3BlZCB0byBub2RlIHBhc3NlZFxuICogd2l0aCB0aGUgJ3Jlc2l6ZScgZXZlbnQgYXMgdGhlIGZpcnN0IHBhcmFtZXRlclxuICogdGhlIGhvcml6b250YWwgZGlmZmVyZW5jZSBhcyB0aGUgc2Vjb25kIHBhcmFtZXRlclxuICogYW5kIHRoZSB2ZXJ0aWNhbCBkaWZmZXJlbmNlIGFzIHRoZSB0aGlyZCBwYXJhbWV0ZXJcbiAqL1xuRXZlbnRzLm9uTm9kZVJlc2l6ZUV2ZW50ID0gZnVuY3Rpb24obm9kZSwgY2FsbGJhY2spIHtcblx0Ly8gbm9kZVN0YXRlQ2FjaGUgY2FuIGJlIHVzZWQgYnkgYW55IG1ldGhvZCBvbiB0aGlzIG1vZHVsZVxuXHQvLyB0aGVyZWZvcmUsIGRlbGF5IGFueSBpbnN0YW50aWF0aW9uIHVudGlsIGFmdGVyIHdlIGtub3dcblx0Ly8gYW4gZW50cnkgZm9yIHRoaXMgbm9kZSBleGlzdHNcblx0aWYgKCFub2RlU3RhdGVDYWNoZVtub2RlLm5vZGVOYW1lXSkge1xuXHRcdG5vZGVTdGF0ZUNhY2hlW25vZGUubm9kZU5hbWVdID0ge307XG5cdH1cblx0aWYgKCFub2RlU3RhdGVDYWNoZVtub2RlLm5vZGVOYW1lXS5vbk5vZGVSZXNpemVFdmVudCkge1xuXHRcdG5vZGVTdGF0ZUNhY2hlW25vZGUubm9kZU5hbWVdLm9uTm9kZVJlc2l6ZUV2ZW50ID0gdHJ1ZTtcblx0XHRub2RlU3RhdGVDYWNoZVtub2RlLm5vZGVOYW1lXS5yZWdpc3RlcmVkUmVzaXplQ2FsbGJhY2tzID0gW107XG5cdFx0bm9kZVN0YXRlQ2FjaGVbbm9kZS5ub2RlTmFtZV0ubGFzdFdpZHRoID0gbm9kZS5pbm5lcldpZHRoIHx8IG5vZGUuY2xpZW50V2lkdGg7XG5cdFx0bm9kZVN0YXRlQ2FjaGVbbm9kZS5ub2RlTmFtZV0ubGFzdEhlaWdodCA9IG5vZGUuaW5uZXJIZWlnaHQgfHwgbm9kZS5jbGllbnRIZWlnaHQ7XG5cdH0gZWxzZSB7XG5cdFx0bm9kZVN0YXRlQ2FjaGVbbm9kZS5ub2RlTmFtZV0ucmVnaXN0ZXJlZFJlc2l6ZUNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRub2RlU3RhdGVDYWNoZVtub2RlLm5vZGVOYW1lXS5yZWdpc3RlcmVkUmVzaXplQ2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuXG5cdHRyeSB7XG5cdFx0bm9kZS5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCBldmVudEhhbmRsZXIpO1xuXHR9IGNhdGNoIChlKSB7XG5cdFx0bm9kZS5hdHRhY2hFdmVudCgnb25yZXNpemUnLCBldmVudEhhbmRsZXIpO1xuXHR9XG5cblx0ZnVuY3Rpb24gZXZlbnRIYW5kbGVyKGUpIHtcblx0XHRyZXR1cm4gKGZ1bmN0aW9uKG5vZGUpIHtcblx0XHRcdHZhciB3aWR0aCA9IG5vZGUuaW5uZXJXaWR0aDtcblx0XHRcdHZhciBoZWlnaHQgPSBub2RlLmlubmVySGVpZ2h0O1xuXG5cdFx0XHRpZiAoIXdpZHRoKSB7XG5cdFx0XHRcdHdpZHRoID0gbm9kZS5jbGllbnRXaWR0aDtcblx0XHRcdH1cblx0XHRcdGlmICghaGVpZ2h0KSB7XG5cdFx0XHRcdGhlaWdodCA9IG5vZGUuY2xpZW50SGVpZ2h0O1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgaG9yRGlmZiA9IG51bGw7XG5cdFx0XHR2YXIgdmVydERpZmYgPSBudWxsO1xuXHRcdFx0aWYgKHdpZHRoICE9IG5vZGVTdGF0ZUNhY2hlW25vZGUubm9kZU5hbWVdLmxhc3RXaWR0aCkge1xuXHRcdFx0XHRob3JEaWZmID0gKHdpZHRoIC0gbm9kZVN0YXRlQ2FjaGVbbm9kZS5ub2RlTmFtZV0ubGFzdFdpZHRoIHx8IDApO1xuXHRcdFx0fVxuXHRcdFx0aWYgKGhlaWdodCAhPSBub2RlU3RhdGVDYWNoZVtub2RlLm5vZGVOYW1lXS5sYXN0SGVpZ2h0KSB7XG5cdFx0XHRcdHZlcnREaWZmID0gKGhlaWdodCAtIG5vZGVTdGF0ZUNhY2hlW25vZGUubm9kZU5hbWVdLmxhc3RIZWlnaHQgfHwgMCk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIGl0ZXJhdGUgdGhyb3VnaCBhbGwgcmVnaXN0ZXJlZCByZXNpemUgZXZlbnRzIGZvciB0aGlzIG5vZGVcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZVN0YXRlQ2FjaGVbbm9kZS5ub2RlTmFtZV0ucmVnaXN0ZXJlZFJlc2l6ZUNhbGxiYWNrcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRpZiAodHlwZW9mIG5vZGVTdGF0ZUNhY2hlW25vZGUubm9kZU5hbWVdLnJlZ2lzdGVyZWRSZXNpemVDYWxsYmFja3NbaV0gPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdG5vZGVTdGF0ZUNhY2hlW25vZGUubm9kZU5hbWVdLnJlZ2lzdGVyZWRSZXNpemVDYWxsYmFja3NbaV0uY2FsbChub2RlLCBlLCBob3JEaWZmLCB2ZXJ0RGlmZik7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0bm9kZVN0YXRlQ2FjaGVbbm9kZS5ub2RlTmFtZV0ubGFzdFdpZHRoID0gd2lkdGg7XG5cdFx0XHRub2RlU3RhdGVDYWNoZVtub2RlLm5vZGVOYW1lXS5sYXN0SGVpZ2h0ID0gaGVpZ2h0O1xuXHRcdH0pKG5vZGUpO1xuXHR9XG59XG5cbkV2ZW50cy5vbk5vZGVIb3Jpem9udGFsUmVzaXplRXZlbnQgPSBmdW5jdGlvbihub2RlLCBjYWxsYmFjaykge1xuXHRFdmVudHMub25Ob2RlUmVzaXplRXZlbnQobm9kZSwgZnVuY3Rpb24oZSwgaG9yaXpvbnRhbERpZmYsIHZlcnRpY2FsRGlmZikge1xuXHRcdGlmIChob3Jpem9udGFsRGlmZikge1xuXHRcdFx0Y2FsbGJhY2suY2FsbChub2RlLCBob3Jpem9udGFsRGlmZik7XG5cdFx0fVxuXHR9KTtcbn07XG5cbkV2ZW50cy5vbk5vZGVWZXJ0aWNhbFJlc2l6ZUV2ZW50ID0gZnVuY3Rpb24obm9kZSwgY2FsbGJhY2spIHtcblx0RXZlbnRzLm9uTm9kZVJlc2l6ZUV2ZW50KG5vZGUsIGZ1bmN0aW9uKGUsIGhvcml6b250YWxEaWZmLCB2ZXJ0aWNhbERpZmYpIHtcblx0XHRpZiAodmVydGljYWxEaWZmKSB7XG5cdFx0XHRjYWxsYmFjay5jYWxsKG5vZGUsIHZlcnRpY2FsRGlmZik7XG5cdFx0fVxuXHR9KTtcbn07XG5cbkV2ZW50cy5vbk5vZGVTY3JvbGxFdmVudCA9IGZ1bmN0aW9uKG5vZGUsIGNhbGxiYWNrKSB7XG5cdGlmICghbm9kZVN0YXRlQ2FjaGVbbm9kZS5ub2RlTmFtZV0pIHtcblx0XHRub2RlU3RhdGVDYWNoZVtub2RlLm5vZGVOYW1lXSA9IHt9O1xuXHR9XG5cdGlmICghbm9kZVN0YXRlQ2FjaGVbbm9kZS5ub2RlTmFtZV0ub25Ob2RlU2Nyb2xsRXZlbnQpIHtcblx0XHRub2RlU3RhdGVDYWNoZVtub2RlLm5vZGVOYW1lXS5vbk5vZGVTY3JvbGxFdmVudCA9IHRydWU7XG5cdFx0bm9kZVN0YXRlQ2FjaGVbbm9kZS5ub2RlTmFtZV0ucmVnaXN0ZXJlZFNjcm9sbENhbGxiYWNrcyA9IFtdO1xuXHR9IGVsc2Uge1xuXHRcdG5vZGVTdGF0ZUNhY2hlW25vZGUubm9kZU5hbWVdLnJlZ2lzdGVyZWRTY3JvbGxDYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0bm9kZVN0YXRlQ2FjaGVbbm9kZS5ub2RlTmFtZV0ucmVnaXN0ZXJlZFNjcm9sbENhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcblxuXHR0cnkge1xuXHRcdG5vZGUuYWRkRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgZXZlbnRIYW5kbGVyKTtcblx0fSBjYXRjaCAoZSkge1xuXHRcdG5vZGUuYXR0YWNoRXZlbnQoJ29uc2Nyb2xsJywgZXZlbnRIYW5kbGVyKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGV2ZW50SGFuZGxlcihlKSB7XG5cdFx0cmV0dXJuIChmdW5jdGlvbihub2RlKSB7XG5cdFx0XHQvLyBpdGVyYXRlIHRocm91Z2ggYWxsIHJlZ2lzdGVyZWQgcmVzaXplIGV2ZW50cyBmb3IgdGhpcyBub2RlXG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IG5vZGVTdGF0ZUNhY2hlW25vZGUubm9kZU5hbWVdLnJlZ2lzdGVyZWRTY3JvbGxDYWxsYmFja3MubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0aWYgKHR5cGVvZiBub2RlU3RhdGVDYWNoZVtub2RlLm5vZGVOYW1lXS5yZWdpc3RlcmVkU2Nyb2xsQ2FsbGJhY2tzW2ldID09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRub2RlU3RhdGVDYWNoZVtub2RlLm5vZGVOYW1lXS5yZWdpc3RlcmVkU2Nyb2xsQ2FsbGJhY2tzW2ldLmNhbGwobm9kZSwgZSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9KShub2RlKTtcblx0fVxufTtcblxuLy8gZW1pdHMgYW4gZXZlbnQgd2hlbmV2ZXIgdGhlIGJvdHRvbSBzY3JvbGwgb2Zmc2V0IG9mIGEgZ2l2ZW4gbm9kZVxuLy8gaXMgYSBjZXJ0YWluIG9mZnNldFZhbHVlIGZyb20gdGhlIGFic29sdXRlIGJvdHRvbSBvZiB0aGUgdmlld3BvcnQuXG5FdmVudHMub25Ob2RlU2Nyb2xsQm90dG9tT2Zmc2V0RXZlbnQgPSBmdW5jdGlvbihub2RlLCBvZmZzZXRWYWx1ZSwgY2FsbGJhY2spIHtcblx0RXZlbnRzLm9uTm9kZVNjcm9sbEV2ZW50KG5vZGUsIGNhbGxiYWNrKTtcbn07XG5cbi8vIGV4ZWN1dGVzIGV2ZW50IFwiY2FsbGJhY2tzXCIgb24gYSBub2RlIGV2ZW50IGFuZCBzdG9yZXMgdGhlbVxuLy8gZm9yIGZ1dHVyZSBjYXNlcyBvZiBzdWNoIGV2ZW50IGhhcHBlbmluZy5cbi8vIFdhcm5pbmc6IGV2ZW50IG9iamVjdCB3aWxsIG5vdCBiZSBpbnN0YW50bHkgYXZhaWxhYmxlIGZvclxuLy8gY2FsbGJhY2sgdG8gcmVjZWl2ZSBkdWUgdG8gY2FsbGJhY2sgYmVpbmcgY2FsbGVkXG4vLyBiZWZvcmUgYmVpbmcgcXVldWVkIHVwIGZvciBpdHMgY29ycmVzcG9uZGluZyBldmVudC5cbkV2ZW50cy5ub3dBbmRPbk5vZGVFdmVudCA9IGZ1bmN0aW9uKG5vZGUsIGV2ZW50TmFtZSwgY2FsbGJhY2spIHtcblx0Y2FsbGJhY2suY2FsbChub2RlLCBudWxsKTtcblx0RXZlbnRzLm9uTm9kZUV2ZW50KG5vZGUsIGV2ZW50TmFtZSwgY2FsbGJhY2spO1xufTtcblxuLyoqXG4gKiBUcmlnZ2VycyBkb20gZXZlbnRcbiAqL1xuRXZlbnRzLmVtaXROb2RlRXZlbnQgPSBmdW5jdGlvbigpIHtcblxufTtcblxuLyoqXG4gKiBSZWdpc3RlcnMgbmV3IGFwcCBldmVudCBhbmQgZmlyZXNcbiAqIHBhc3NlZCBjYWxsYmFjayB3aGVuIGVtaXR0ZWQgXG4gKi9cbkV2ZW50cy5yZWdpc3Rlckdsb2JhbEV2ZW50ID0gZnVuY3Rpb24oZXZlbnROYW1lLCBjYWxsYmFjaykge1xuXHRpZiAoIXRoaXMucmVnaXN0ZXJlZEdsb2JhbEV2ZW50c1tldmVudE5hbWVdKSB7XG5cdFx0dGhpcy5yZWdpc3RlcmVkR2xvYmFsRXZlbnRzW2V2ZW50TmFtZV0gPSBbXTtcblx0fVxuXG5cdHRoaXMucmVnaXN0ZXJlZEdsb2JhbEV2ZW50c1tldmVudE5hbWVdLnB1c2goY2FsbGJhY2spO1xufVxuXG4vKipcbiAqIFRyaWdnZXJzIHJlZ2lzdGVyZWQgYXBwIGV2ZW50c1xuICogYnkgY2FsbGluZyBjYWxsYmFja3MgYXNzaWduZWQgdG9cbiAqIHRoYXQgZXZlbnROYW1lXG4gKi9cbkV2ZW50cy5lbWl0UmVnaXN0ZXJlZEdsb2JhbEV2ZW50ID0gZnVuY3Rpb24oZXZlbnROYW1lLCBhcmdzKSB7XG5cdGlmICghcmVnaXN0ZXJlZEdsb2JhbEV2ZW50c1tldmVudE5hbWVdKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnJlZ2lzdGVyZWRHbG9iYWxFdmVudHNbZXZlbnROYW1lXS5sZW5ndGg7IGkrKykge1xuXHRcdHRoaXMucmVnaXN0ZXJlZEdsb2JhbEV2ZW50c1tldmVudE5hbWVdW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuXHR9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50czsiLCIvKipcbiAqIEltYWdlIG9iamVjdCBtb2R1bGUuIEFkZHMgaW1hZ2UgcHJvcGVydGllcyBhbmQgZXZlbnQgbGlzdGVuZXJzLlxuICpcbiAqIEBhdXRob3IganVhbnZhbGxlam9cbiAqIEBkYXRlIDgvMjEvMTZcbiAqL1xuXG5mdW5jdGlvbiBJbWcoRXZlbnRzLCBtYWluV2luZG93LCBzb3VyY2UpIHtcblx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdHRoaXMubm9kZSA9IG5ldyBJbWFnZSgpO1xuXHR0aGlzLm5vZGUuc3JjID0gc291cmNlO1xuXG5cdHRoaXMuaGFzTG9hZGVkID0gZmFsc2U7XG5cdHRoaXMuc291cmNlID0gc291cmNlO1xuXG5cdHRoaXMuZXZlbnRzID0ge307XG5cblx0dGhpcy5zZXRTb3VyY2UgPSBmdW5jdGlvbihzb3VyY2UpIHtcblx0XHR0aGlzLnNvdXJjZSA9IHNvdXJjZTtcblx0XHR0aGlzLm5vZGUuc3JjID0gc291cmNlO1xuXHR9O1xuXG5cdC8vIHJldHJpZXZlIHRoaXMgbm9kZSdzIGNvbXB1dGVkIHN0eWxlIGZvciBzcGVjaWZpYyBwcm9wZXJ0eVxuXHR0aGlzLmdldENTU0NvbXB1dGVkU3R5bGUgPSBmdW5jdGlvbihwcm9wZXJ0eSkge1xuXHRcdHJldHVybiBtYWluV2luZG93LmdldENvbXB1dGVkU3R5bGUodGhpcy5ub2RlKS5nZXRQcm9wZXJ0eVZhbHVlKHByb3BlcnR5KTtcblx0fTtcblxuXHR0aGlzLmdldENTU0NvbXB1dGVkU3R5bGVBc0ludCA9IGZ1bmN0aW9uKHByb3BlcnR5KSB7XG5cdFx0cmV0dXJuIHBhcnNlSW50KHRoaXMuZ2V0Q1NTQ29tcHV0ZWRTdHlsZShwcm9wZXJ0eSkuc3BsaXQoXCJweFwiKVswXSk7XG5cdH07XG5cblx0dGhpcy5nZXROb2RlID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMubm9kZTtcblx0fTtcblxuXHR0aGlzLmxvYWRFdmVudEhhbmRsZXIgPSBmdW5jdGlvbihlKSB7XG5cdFx0aWYgKHNlbGYuZXZlbnRzWydsb2FkJ10pIHtcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgc2VsZi5ldmVudHNbJ2xvYWQnXS5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRzZWxmLmV2ZW50c1snbG9hZCddW2ldLmNhbGwoc2VsZiwgbnVsbCwgZSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xuXG5cdHRoaXMubG9hZEVycm9yRXZlbnRIYW5kbGVyID0gZnVuY3Rpb24oZXJyKSB7XG5cdFx0aWYgKHNlbGYuZXZlbnRzWydsb2FkJ10pIHtcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgc2VsZi5ldmVudHNbJ2xvYWQnXS5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRzZWxmLmV2ZW50c1snbG9hZCddW2ldLmNhbGwoc2VsZiwgZXJyKTtcblx0XHRcdH1cblx0XHR9XG5cdH07XG5cblx0Ly8gcmVnaXN0ZXIgYW4gZXZlbnQgY2FsbGJhY2sgZm9yIHRoaXMgaW5zdGFuY2Vcblx0dGhpcy5vbiA9IGZ1bmN0aW9uKGV2ZW50TmFtZSwgY2FsbGJhY2spIHtcblx0XHRpZiAoIXRoaXMuZXZlbnRzW2V2ZW50TmFtZV0pIHtcblx0XHRcdHRoaXMuZXZlbnRzW2V2ZW50TmFtZV0gPSBbXTtcblx0XHR9XG5cblx0XHR0aGlzLmV2ZW50c1tldmVudE5hbWVdLnB1c2goY2FsbGJhY2spO1xuXHR9O1xuXG5cdC8vIGF0dGFjaCBldmVudHNcblx0YXR0YWNoRXZlbnRMb2FkKEV2ZW50cywgdGhpcy5ub2RlLCB0aGlzLmxvYWRFdmVudEhhbmRsZXIpO1xuXHRhdHRhY2hFdmVudExvYWRFcnJvcihFdmVudHMsIHRoaXMubm9kZSwgdGhpcy5sb2FkRXJyb3JFdmVudEhhbmRsZXIpO1xufTtcblxuLy8gaW50ZXJuYWwgb2JqZWN0IGZ1bmN0aW9uc1xuZnVuY3Rpb24gYXR0YWNoRXZlbnRMb2FkKEV2ZW50cywgbm9kZSwgaGFuZGxlcikge1xuXHRFdmVudHMub25Ob2RlRXZlbnQobm9kZSwgJ2xvYWQnLCBoYW5kbGVyKTtcbn1cblxuZnVuY3Rpb24gYXR0YWNoRXZlbnRMb2FkRXJyb3IoRXZlbnRzLCBub2RlLCBoYW5kbGVyKSB7XG5cdEV2ZW50cy5vbk5vZGVFdmVudChub2RlLCAnZXJyb3InLCBoYW5kbGVyKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBJbWc7IiwiLyoqXG4gKiBBcHBsaWNhdGlvbiBpbnRlcmZhY2UgbWFuYWdlci4gRXhwb3NlcyBhbGwgaW50ZXJmYWNlIG1vZHVsZXMgdG8gZ2xvYmFsIHNjb3BlLlxuICpcbiAqIEBhdXRob3IganVhbnZhbGxlam9cbiAqIEBkYXRlIDUvMzEvMTVcbiAqL1xuXG52YXIgSW50ZXJmYWNlID0gcmVxdWlyZSgnLi9pbnRlcmZhY2VzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gSW50ZXJmYWNlOyIsIi8qKlxuICogQm9hcmQgaW50ZXJmYWNlIG1vZHVsZSAtIGNvbnNpc3RzIG9mIGEgXCJ3cmFwcGVyXCIgcm9vdCBub2RlIGFuZCBhIFwibm90aWNlXCIgYWxlcnQgbm9kZVxuICovXG5cbnZhciBFbnZpcm9ubWVudCA9IHJlcXVpcmUoJy4uL2Vudmlyb25tZW50LmpzJyk7XG52YXIgUGljdHVyZSA9IHJlcXVpcmUoJy4uL3BpY3R1cmUuanMnKTtcbnZhciBJbWcgPSByZXF1aXJlKCcuLi9pbWFnZS5qcycpO1xuXG4vLyBwcml2YXRlIGZpZWxkcyBhbmQgZnVuY3Rpb25zXG52YXIgaXNTZXQgPSBmYWxzZTtcbnZhciBub2RlcyA9IHtcblx0Ly8gdXNlZCB0byBkaXNwbGF5IGFsZXJ0cyBhbmQgYm9hcmQgaW5mb1xuXHRhbGVydE5vZGU6IG51bGwsXG5cdGFsZXJ0Tm9kZUNvbXBvbmVudHM6IHtcblx0XHRib2R5OiBudWxsLFxuXHRcdGV4dHJhOiBudWxsXG5cdH0sXG5cblx0bG9hZGVyTm9kZTogbnVsbCxcblxuXHQvLyBob2xkcyBtYWluIGJvYXJkIGNvbXBvbmVudCAoZXhjbHVzaXZlIG9mIHRoZSBhbGVydE5vZGUpXG5cdHJvb3ROb2RlOiBudWxsXG59O1xuXG52YXIgZXZlbnRzID0ge307XG52YXIgY2FjaGUgPSB7fTtcblxudmFyIGxvYWRlZEltYWdlQ291bnQgPSAwO1xudmFyIGlzTG9hZGluZyA9IGZhbHNlO1xudmFyIGlzTG9hZGVkSW1hZ2VzID0gZmFsc2U7XG52YXIgaXNDcmVhdGVkID0gZmFsc2U7XG52YXIgcGFyZW50Tm9kZUNhY2hlID0ge307XG52YXIgcmVzdHJpY3RlZE5hbWVzID0gW1xuXHQnZGF0YScsXG5cdCdyZXN0cmljdGVkJyxcblx0JzQwNCcsXG5cdCd1bmRlZmluZWQnXG5dO1xuXG52YXIgQm9hcmQgPSB7fTtcblxuQm9hcmQuYWxlcnROb2RlQ29tcG9uZW50cyA9IHtcblx0Ym9keTogJ1VudGl0bGVkJyxcblx0ZXh0cmE6IG51bGxcbn07XG5cbkJvYXJkLmFsYnVtUmVxdWVzdENvbXBvbmVudHMgPSB7XG5cdGFuY2hvcjogMCxcblx0bGltaXQ6IEVudmlyb25tZW50Lml0ZW1BbW91bnRQYWdlTG9hZFxufTtcblxuQm9hcmQucGljdHVyZXMgPSBbXTtcblxuQm9hcmQuaXNOYW1lUmVzdHJpY3RlZCA9IGZ1bmN0aW9uKG5hbWUpIHtcblx0cmV0dXJuIHJlc3RyaWN0ZWROYW1lcy5pbmRleE9mKG5hbWUudG9Mb3dlckNhc2UoKSkgIT0gLTE7XG59O1xuXG5Cb2FyZC5pc05hbWVJbnZhbGlkID0gZnVuY3Rpb24obmFtZSkge1xuXHRyZXR1cm4gbmFtZS50b0xvd2VyQ2FzZSgpLm1hdGNoKC9bXmEtejAtOVxcLVxcLlxcK1xcX1xcIF0vZ2kpO1xufTtcblxuQm9hcmQuaXNOYW1lV2l0aFNwYWNlcyA9IGZ1bmN0aW9uKG5hbWUpIHtcblx0cmV0dXJuIG5hbWUubWF0Y2goL1tcXCBdL2cpO1xufTtcblxuQm9hcmQuaXNTZXQgPSBmdW5jdGlvbigpIHtcblx0Qm9hcmQuZGV0ZWN0KCk7XG5cdHJldHVybiBpc1NldDtcbn07XG5cbkJvYXJkLmRldGVjdCA9IGZ1bmN0aW9uKCkge1xuXG5cdGlmICghd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lLnNwbGl0KCcvJylbMV0pIHtcblx0XHR3aW5kb3cuZG9jdW1lbnQudGl0bGUgPSBFbnZpcm9ubWVudC5hcHAudGl0bGU7XG5cdFx0aXNTZXQgPSBmYWxzZTtcblx0XHRyZXR1cm4gQm9hcmQ7XG5cdH1cblxuXHRpc1NldCA9IHRydWU7XG5cdHdpbmRvdy5kb2N1bWVudC50aXRsZSA9ICdQaWN0cmUgLSAnICsgQm9hcmQuZ2V0TmFtZSgpO1xuXG5cdHJldHVybiBCb2FyZDtcbn1cblxuQm9hcmQuZ2V0TmFtZSA9IGZ1bmN0aW9uKCkge1xuXHR2YXIgYm9hcmQ7XG5cblx0Ly8gY2FwaXRhbGl6ZSBuYW1lIG9mIGJvYXJkXG5cdGlmIChpc1NldCkge1xuXHRcdHZhciBuYW1lID0gd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lLnNwbGl0KFwiL1wiKVsxXS50b0xvd2VyQ2FzZSgpO1xuXHRcdHZhciBuYW1lQXJyYXkgPSBuYW1lLnNwbGl0KCcnKTtcblx0XHRuYW1lQXJyYXkuc3BsaWNlKDAsIDEpO1xuXG5cdFx0dmFyIG5hbWVGaXJzdENoYXIgPSBuYW1lLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpO1xuXHRcdGJvYXJkID0gbmFtZUZpcnN0Q2hhciArIG5hbWVBcnJheS5qb2luKCcnKTtcblx0fVxuXG5cdHJldHVybiBib2FyZDtcblxufVxuXG5Cb2FyZC5zZXRMb2FkZXJXaXRoRXJyb3IgPSBmdW5jdGlvbihyYXRpbykge1xuXHRpZiAoIW5vZGVzLmxvYWRlck5vZGUpIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRCb2FyZC5zZXRMb2FkZXIocmF0aW8sIGZ1bmN0aW9uKHByb2dyZXNzQmFyKSB7XG5cdFx0cHJvZ3Jlc3NCYXIuc3R5bGUuYmFja2dyb3VuZCA9ICdyZ2JhKDIwNSw1NSwwLCAwLjYpJztcblx0fSk7XG59XG5cbkJvYXJkLnNldExvYWRlciA9IGZ1bmN0aW9uKHJhdGlvLCBjYWxsYmFjaykge1xuXHRpZiAoIW5vZGVzLmxvYWRlck5vZGUgfHwgIW5vZGVzLmxvYWRlck5vZGUuY2hpbGRyZW4pIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRub2Rlcy5sb2FkZXJOb2RlLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuXHRub2Rlcy5sb2FkZXJOb2RlLmNoaWxkcmVuWzBdLnN0eWxlLndpZHRoID0gTWF0aC5tYXgocmF0aW8gKiAxMDAsIDApICsgJyUnO1xuXG5cdGlmICh0eXBlb2YgY2FsbGJhY2sgPT0gJ2Z1bmN0aW9uJykge1xuXHRcdGNhbGxiYWNrLmNhbGwoQm9hcmQsIG5vZGVzLmxvYWRlck5vZGUuY2hpbGRyZW5bMF0pO1xuXHR9XG59O1xuXG5Cb2FyZC51bnNldExvYWRlciA9IGZ1bmN0aW9uKCkge1xuXHRpZiAoIW5vZGVzLmxvYWRlck5vZGUpIHtcblx0XHRyZXR1cm47XG5cdH1cblx0bm9kZXMubG9hZGVyTm9kZS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xufTtcblxuLy8gbG9hZHMgYSBzaW5nbGUgYXBpIGltYWdlIGludG8gdGhlIGJvYXJkXG5Cb2FyZC5sb2FkSW1hZ2UgPSBmdW5jdGlvbihJbnRlcmZhY2VzLCBFdmVudHMsIG1haW5XaW5kb3csIG9iamVjdCwgaW1hZ2VMb2FkSGFuZGxlcikge1xuXHR2YXIgcGljdHVyZSA9IG5ldyBQaWN0dXJlKEludGVyZmFjZXMsIEV2ZW50cywgbWFpbldpbmRvdyk7XG5cdHBpY3R1cmUuc2V0Tm9kZUlEKCdwaWMnICsgb2JqZWN0LmlkKTtcblx0cGljdHVyZS5zZXREYXRhKG9iamVjdCk7XG5cdHBpY3R1cmUuc2V0UGFyZW50Tm9kZShub2Rlcy5yb290Tm9kZSk7XG5cblx0Qm9hcmQucGljdHVyZXMucHVzaChwaWN0dXJlKTtcblxuXHQvLyByZS1wb3NpdGlvbiBsb2FkaW5nIGltYWdlXG5cdGlmIChCb2FyZC5nZXRSZXF1ZXN0QW5jaG9yKCkpIHtcblx0XHRCb2FyZC5jaGlzZWwobWFpbldpbmRvdywgbm9kZXMucm9vdE5vZGUsIEJvYXJkLnBpY3R1cmVzLCBCb2FyZC5nZXRSZXF1ZXN0QW5jaG9yKCkpO1xuXHR9XG5cblx0dmFyIGltYWdlID0gbmV3IEltZyhFdmVudHMsIG1haW5XaW5kb3csIEVudmlyb25tZW50LmJhc2VBUElVcmwgKyAnLycgKyBvYmplY3QudGh1bWIpO1xuXG5cdGlmICghQm9hcmQuZ2V0UmVxdWVzdEFuY2hvcigpICYmICFpc0xvYWRlZEltYWdlcyAmJiBub2Rlcy5yb290Tm9kZS5zdHlsZS5kaXNwbGF5ICE9ICdub25lJykge1xuXHRcdG5vZGVzLnJvb3ROb2RlLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG5cdH1cblxuXHRpbWFnZS5vbignbG9hZCcsIGZ1bmN0aW9uKGVyciwgZSkge1xuXHRcdGlmICghZXJyKSB7XG5cdFx0XHRyZXR1cm4gKGZ1bmN0aW9uKHBpY3R1cmUsIGltYWdlKSB7XG5cdFx0XHRcdGltYWdlTG9hZEhhbmRsZXIocGljdHVyZSwgaW1hZ2UpO1xuXHRcdFx0fSkocGljdHVyZSwgaW1hZ2UpO1xuXHRcdH1cblxuXHRcdC8vIGFzc3VtZSBlcnJvciBsb2FkaW5nIGltYWdlXG5cdFx0dmFyIGhlaWdodCA9IEVudmlyb25tZW50Lm1heEltYWdlSGVpZ2h0O1xuXHRcdHZhciBwYWRkaW5nVG9wID0gcGljdHVyZS5nZXRDU1NDb21wdXRlZFN0eWxlQXNJbnQobWFpbldpbmRvdywgJ3BhZGRpbmctdG9wJykgKyAxO1xuXHRcdHZhciBwYWRkaW5nQm90dG9tID0gcGljdHVyZS5nZXRDU1NDb21wdXRlZFN0eWxlQXNJbnQobWFpbldpbmRvdywgJ3BhZGRpbmctYm90dG9tJykgKyAxO1xuXG5cdFx0dmFyIGVyckltZyA9IG5ldyBJbWcoRXZlbnRzLCBtYWluV2luZG93LCAnL3N0YXRpYy9pL1BpY3RyZS00MDQucG5nJyk7XG5cblx0XHR0aGlzLnNldERhdGFWYWx1ZSgnc3JjJywgJy9zdGF0aWMvaS9QaWN0cmUtNDA0LmZ1bGwucG5nJyk7XG5cdFx0dGhpcy5zZXRDU1NQcm9wZXJ0eVZhbHVlKCdoZWlnaHQnLCAoaGVpZ2h0IC0gcGFkZGluZ1RvcCArIHBhZGRpbmdCb3R0b20gKiAyKSArICdweCcpO1xuXG5cdFx0aW1hZ2VMb2FkSGFuZGxlcih0aGlzLCBlcnJJbWcpO1xuXHR9LmJpbmQocGljdHVyZSkpO1xufTtcblxuLy8gbG9hZHMgYSBqc29uIGFycmF5IG9mIGltYWdlcyBpbnRvIHRoZSBib2FyZFxuQm9hcmQubG9hZCA9IGZ1bmN0aW9uKEludGVyZmFjZXMsIEV2ZW50cywgbWFpbldpbmRvdywgb2JqZWN0cykge1xuXHRmdW5jdGlvbiBoYW5kbGVyKHBpY3R1cmUsIGltYWdlKSB7XG5cdFx0cGljdHVyZS5zZXRJbm5lclRleHQoJycpO1xuXHRcdHBpY3R1cmUuYWRkSW1hZ2UoaW1hZ2UpO1xuXHRcdEJvYXJkLmltYWdlTG9hZEhhbmRsZXIobWFpbldpbmRvdywgb2JqZWN0cy5sZW5ndGgpO1xuXHR9XG5cblx0Zm9yICh2YXIgaSBpbiBvYmplY3RzKSB7XG5cdFx0Qm9hcmQubG9hZEltYWdlKEludGVyZmFjZXMsIEV2ZW50cywgbWFpbldpbmRvdywgb2JqZWN0c1tpXSwgaGFuZGxlcik7XG5cdH1cbn07XG5cbi8vIGNhbGxlZCB3aGVuIGEgc2luZ2xlIGltYWdlIGlzIGxvYWRlZFxuQm9hcmQuaW1hZ2VMb2FkSGFuZGxlciA9IGZ1bmN0aW9uKG1haW5XaW5kb3csIHNldENvdW50KSB7XG5cdGxvYWRlZEltYWdlQ291bnQrKztcblxuXHQvLyBubyBhbmNob3IgbWVhbnMgYmxhbmsgcm9vbSBmb3IgbG9hZGVyXG5cdGlmICghQm9hcmQuZ2V0UmVxdWVzdEFuY2hvcigpKSB7XG5cdFx0Qm9hcmQuc2V0TG9hZGVyKGxvYWRlZEltYWdlQ291bnQgLyBzZXRDb3VudCk7XG5cdH0gZWxzZSB7XG5cdFx0Qm9hcmQuY2hpc2VsKG1haW5XaW5kb3csIG5vZGVzLnJvb3ROb2RlLCBCb2FyZC5waWN0dXJlcywgQm9hcmQuZ2V0UmVxdWVzdEFuY2hvcigpKTtcblx0fVxuXG5cdGlmIChsb2FkZWRJbWFnZUNvdW50ID09IHNldENvdW50KSB7XG5cdFx0bG9hZGVkSW1hZ2VDb3VudCA9IDA7XG5cdFx0aXNMb2FkaW5nID0gZmFsc2U7XG5cblx0XHQvLyBpZiBhbmNob3IgaXMgMCwgdGhhdCBtZWFucyBsb2FkaW5nIGltYWdlcyBmb3Jcblx0XHQvLyB0aGUgZmlyc3QgdGltZS4gU2V0IGxvYWRlciBiYXIgdG8gZnVsbFxuXHRcdGlmICghQm9hcmQuYWxidW1SZXF1ZXN0Q29tcG9uZW50cy5hbmNob3IpIHtcblx0XHRcdEJvYXJkLnVuc2V0TG9hZGVyKCk7XG5cdFx0XHRub2Rlcy5yb290Tm9kZS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcblx0XHR9XG5cblx0XHQvLyBlbWl0ICdsb2FkJyBldmVudFxuXHRcdEJvYXJkLmVtaXQoJ2xvYWQnLCBbc2V0Q291bnRdKTtcblx0fVxufTtcblxuLy8gcGVyZm9ybXMgYSByZW1vdGUgY2FsbCB0byB0aGUgc2VydmVyIGFwaSwgZmV0Y2hpbmcgZXZlcnkgaW1hZ2UsXG4vLyBhcyB3ZWxsIGFzIHRvdGFsIGltYWdlIGNvdW50LCBhdmFpbGFibGUgZm9yIHRoZSBjdXJyZW50IGFsYnVtXG5Cb2FyZC51cGRhdGUgPSBmdW5jdGlvbihJbnRlcmZhY2VzLCBFdmVudHMsIFNlcnZlciwgbWFpbldpbmRvdykge1xuXHRpZiAoIWlzQ3JlYXRlZCB8fCBpc0xvYWRpbmcpIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRpc0xvYWRpbmcgPSB0cnVlO1xuXG5cdC8vIHJlcXVlc3QgY3VycmVudCBzZXQgb2YgaW1hZ2VzXG5cdFNlcnZlci5zZXRSZXF1ZXN0QW5jaG9yKEJvYXJkLmdldFJlcXVlc3RBbmNob3IoKSk7XG5cdFNlcnZlci5zZXRSZXF1ZXN0TGltaXQoQm9hcmQuZ2V0UmVxdWVzdExpbWl0KCkpO1xuXHRTZXJ2ZXIuZ2V0QWxidW0oQm9hcmQuZ2V0TmFtZSgpLnRvTG93ZXJDYXNlKCksIGZ1bmN0aW9uKGVyciwgZGF0YSkge1xuXHRcdGlmIChlcnIpIHtcblx0XHRcdEJvYXJkLnNob3dBbGVydCgnVW5hYmxlIHRvIGxvYWQgaW1hZ2VzIGF0IHRoaXMgdGltZScpO1xuXHRcdFx0Qm9hcmQuc2V0TG9hZGVyV2l0aEVycm9yKDEpO1xuXHRcdFx0cmV0dXJuIGNvbnNvbGUubG9nKCdFUlIgU0VSVkVSIEFMQlVNIFJFUVVFU1QnLCBlcnIpO1xuXHRcdH1cblxuXHRcdGlmICghZGF0YS5sZW5ndGgpIHtcblx0XHRcdEJvYXJkLmVtaXQoJ2xvYWQnKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRCb2FyZC5zZXRBbGVydEV4dHJhKGRhdGFbMF0udG90YWwpO1xuXHRcdEJvYXJkLmxvYWQoSW50ZXJmYWNlcywgRXZlbnRzLCBtYWluV2luZG93LCBkYXRhKTtcblx0fSk7XG5cblx0Ly8gdXBkYXRlIGFsZXJ0Tm9kZUNvbXBvbmVudHNcblx0Qm9hcmQudXBkYXRlQWxlcnRDb21wb25lbnRzKCk7XG59O1xuXG5Cb2FyZC51cGRhdGVBbGVydENvbXBvbmVudHMgPSBmdW5jdGlvbigpIHtcblx0aWYgKEJvYXJkLmFsZXJ0Tm9kZUNvbXBvbmVudHMuZXh0cmEpIHtcblx0XHRub2Rlcy5hbGVydE5vZGVDb21wb25lbnRzLmV4dHJhLmlubmVySFRNTCA9IEJvYXJkLmFsZXJ0Tm9kZUNvbXBvbmVudHMuZXh0cmE7XG5cdFx0bm9kZXMuYWxlcnROb2RlQ29tcG9uZW50cy5leHRyYS50aXRsZSA9ICdUaGlzIGJvYXJkIGNvbnRhaW5zICcgKyBCb2FyZC5hbGVydE5vZGVDb21wb25lbnRzLmV4dHJhICsgJyBpbWFnZXMnO1xuXHR9IGVsc2Uge1xuXHRcdG5vZGVzLmFsZXJ0Tm9kZUNvbXBvbmVudHMuZXh0cmEuaW5uZXJIVE1MID0gJyc7XG5cdFx0bm9kZXMuYWxlcnROb2RlQ29tcG9uZW50cy5leHRyYS50aXRsZSA9ICcnO1xuXHR9XG5cdG5vZGVzLmFsZXJ0Tm9kZUNvbXBvbmVudHMuYm9keS5pbm5lckhUTUwgPSBCb2FyZC5hbGVydE5vZGVDb21wb25lbnRzLmJvZHk7XG59O1xuXG4vLyBjcmVhdGUgYWxsIGJvYXJkIGNvbXBvbmVudHNcbkJvYXJkLmNyZWF0ZSA9IGZ1bmN0aW9uKEludGVyZmFjZXMsIEV2ZW50cywgbWFpbldpbmRvdywgcGFyZW50Tm9kZSkge1xuXHRpZiAoIWlzQ3JlYXRlZCkge1xuXHRcdGlzQ3JlYXRlZCA9IHRydWU7XG5cdH1cblxuXHQvLyB1c2VkIGZvciBkaXNwbGF5aW5nIGFsZXJ0cyBhbmQgYm9hcmQgaW5mb3JtYXRpb25cblx0Ly8gc2libGluZyBvZiBhcHBsaWNhdGlvbiB3cmFwcGVyXG5cdG5vZGVzLmFsZXJ0Tm9kZSA9IEludGVyZmFjZXMuY29udHJvbGxlci5jcmVhdGVEaXZOb2RlKG1haW5XaW5kb3cpO1xuXHRub2Rlcy5hbGVydE5vZGUuY2xhc3NOYW1lID0gJ1BpY3RyZS1ub3RpY2UnO1xuXG5cdG5vZGVzLmFsZXJ0Tm9kZUNvbXBvbmVudHMuZXh0cmEgPSBJbnRlcmZhY2VzLmNvbnRyb2xsZXIuY3JlYXRlRGl2Tm9kZShtYWluV2luZG93KTtcblx0bm9kZXMuYWxlcnROb2RlQ29tcG9uZW50cy5leHRyYS5jbGFzc05hbWUgPSAnUGljdHJlLW5vdGljZS1leHRyYSc7XG5cblx0bm9kZXMuYWxlcnROb2RlQ29tcG9uZW50cy5ib2R5ID0gSW50ZXJmYWNlcy5jb250cm9sbGVyLmNyZWF0ZURpdk5vZGUobWFpbldpbmRvdyk7XG5cblx0Ly8gY3JlYXRlIHJvb3QgXCJ3cmFwcGVyXCIgbm9kZSAoZ29lcyBpbnNpZGUgb2YgYXBwbGljYXRpb24gd3JhcHBlcilcblx0bm9kZXMucm9vdE5vZGUgPSBJbnRlcmZhY2VzLmNvbnRyb2xsZXIuY3JlYXRlRGl2Tm9kZShtYWluV2luZG93KTtcblx0bm9kZXMucm9vdE5vZGUuaWQgPSAnUGljdHJlLXdyYXBwZXInO1xuXHRub2Rlcy5yb290Tm9kZS5zdHlsZS5tYXJnaW5Ub3AgPSAnNTJweCc7XG5cdG5vZGVzLnJvb3ROb2RlLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuXG5cdC8vIGNyZWF0ZSBsb2FkZXIgbm9kZVxuXHR2YXIgbG9hZGVyQ2hpbGROb2RlID0gSW50ZXJmYWNlcy5jb250cm9sbGVyLmNyZWF0ZURpdk5vZGUobWFpbldpbmRvdyk7XG5cdGxvYWRlckNoaWxkTm9kZS5jbGFzc05hbWUgPSAnUGljdHJlLWxvYWRlci1wcm9ncmVzcyc7XG5cblx0bm9kZXMubG9hZGVyTm9kZSA9IEludGVyZmFjZXMuY29udHJvbGxlci5jcmVhdGVEaXZOb2RlKG1haW5XaW5kb3cpO1xuXHRub2Rlcy5sb2FkZXJOb2RlLmNsYXNzTmFtZSA9ICdQaWN0cmUtbG9hZGVyLXdyYXBwZXInO1xuXHRub2Rlcy5sb2FkZXJOb2RlLnN0eWxlLm1hcmdpblRvcCA9ICctNiUnO1xuXG5cdC8vIGNyZWF0ZSBub2RlIHRyZWVcblx0bm9kZXMuYWxlcnROb2RlLmFwcGVuZENoaWxkKG5vZGVzLmFsZXJ0Tm9kZUNvbXBvbmVudHMuYm9keSk7XG5cdG5vZGVzLmFsZXJ0Tm9kZS5hcHBlbmRDaGlsZChub2Rlcy5hbGVydE5vZGVDb21wb25lbnRzLmV4dHJhKTtcblx0cGFyZW50Tm9kZS5hcHBlbmRDaGlsZChub2Rlcy5hbGVydE5vZGUpO1xuXHRwYXJlbnROb2RlLmFwcGVuZENoaWxkKG5vZGVzLnJvb3ROb2RlKTtcblx0bm9kZXMubG9hZGVyTm9kZS5hcHBlbmRDaGlsZChsb2FkZXJDaGlsZE5vZGUpO1xuXHRwYXJlbnROb2RlLmFwcGVuZENoaWxkKG5vZGVzLmxvYWRlck5vZGUpO1xuXG5cdC8vIGNlbnRlciBub2Rlc1xuXHRFdmVudHMubm93QW5kT25Ob2RlRXZlbnQobWFpbldpbmRvdywgJ3Jlc2l6ZScsIGZ1bmN0aW9uKCkge1xuXHRcdEludGVyZmFjZXMuY29udHJvbGxlci5jZW50ZXJOb2RlUmVsYXRpdmVUbyhub2Rlcy5sb2FkZXJOb2RlLCBtYWluV2luZG93KTtcblx0XHRJbnRlcmZhY2VzLmNvbnRyb2xsZXIuaG9yaXpvbnRhbENlbnRlck5vZGVSZWxhdGl2ZVRvKG5vZGVzLnJvb3ROb2RlLCBtYWluV2luZG93KTtcblx0fSk7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgdmlldyBlbGVtZW50cyBpZiBub24tZXhpc3RlbnQgYW5kIGRpc3BsYXlzIGJvYXJkIGNvbXBvbmVudHMuXG4gKi9cbkJvYXJkLnNob3cgPSBmdW5jdGlvbihJbnRlcmZhY2VzLCBFdmVudHMsIFNlcnZlciwgbWFpbldpbmRvdywgcGFyZW50Tm9kZSkge1xuXHRpZiAoIWlzQ3JlYXRlZCkge1xuXHRcdEJvYXJkLmNyZWF0ZShJbnRlcmZhY2VzLCBFdmVudHMsIG1haW5XaW5kb3csIHBhcmVudE5vZGUpO1xuXG5cdFx0Ly8gZW5zdXJlIHRoZXNlIGV2ZW50cyBhcmUgb25seSByZWdpc3RlcmVkIG9uY2Vcblx0XHQvLyBieSBwbGFjaW5nIHRoZW0gaW5zaWRlIHRoaXMgbG9naWMgYmxvY2tcblx0XHRCb2FyZC5vbignbG9hZCcsIGZ1bmN0aW9uKHNldENvdW50KSB7XG5cdFx0XHR2YXIgb2Zmc2V0ID0gQm9hcmQuZ2V0UmVxdWVzdEFuY2hvcigpO1xuXHRcdFx0dmFyIGNvdW50ID0gQm9hcmQuZ2V0QWxlcnRFeHRyYSgpO1xuXHRcdFx0aWYgKCFjb3VudCkge1xuXHRcdFx0XHRjb3VudCA9IHNldENvdW50O1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIUJvYXJkLmdldFJlcXVlc3RBbmNob3IoKSkge1xuXHRcdFx0XHRCb2FyZC5zaG93QWxlcnQoQm9hcmQuZ2V0TmFtZSgpICsgJyBQaWN0dXJlIEJvYXJkJywgY291bnQpO1xuXHRcdFx0XHRCb2FyZC5jaGlzZWwobWFpbldpbmRvdywgbm9kZXMucm9vdE5vZGUsIEJvYXJkLnBpY3R1cmVzLCBvZmZzZXQpO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyB1cGRhdGUgcmVxdWVzdCBzZXR0aW5ncyBmb3IgbmV4dCB1cGRhdGVcblx0XHRcdEJvYXJkLnNldFJlcXVlc3RBbmNob3IoQm9hcmQuZ2V0UmVxdWVzdEFuY2hvcigpICsgQm9hcmQuZ2V0UmVxdWVzdExpbWl0KCkpO1xuXHRcdFx0Qm9hcmQuc2V0UmVxdWVzdExpbWl0KEVudmlyb25tZW50Lml0ZW1BbW91bnRSZXF1ZXN0KTtcblx0XHR9KTtcblxuXHRcdEJvYXJkLm9uKCdjaGlzZWwnLCBmdW5jdGlvbihub2RlLCBpdGVtTWFyZ2luKSB7XG5cdFx0XHRwYXJlbnROb2RlLnN0eWxlLmhlaWdodCA9IChub2RlLnNjcm9sbEhlaWdodCArIGl0ZW1NYXJnaW4gKiAyKSArIFwicHhcIjtcblx0XHRcdEludGVyZmFjZXMuY29udHJvbGxlci5ob3Jpem9udGFsQ2VudGVyTm9kZVJlbGF0aXZlVG8obm9kZSwgbWFpbldpbmRvdyk7XG5cdFx0fSk7XG5cblx0XHRFdmVudHMub25Ob2RlSG9yaXpvbnRhbFJlc2l6ZUV2ZW50KG1haW5XaW5kb3csIGZ1bmN0aW9uKGUsIGRpZmYpIHtcblx0XHRcdEJvYXJkLmNoaXNlbCh0aGlzLCBub2Rlcy5yb290Tm9kZSwgQm9hcmQucGljdHVyZXMpO1xuXHRcdH0pO1xuXG5cdFx0RXZlbnRzLm9uTm9kZVNjcm9sbEV2ZW50KG1haW5XaW5kb3csIGZ1bmN0aW9uKGUpIHtcblx0XHRcdHZhciB0b3RhbFZpZXdIZWlnaHQgPSBub2Rlcy5yb290Tm9kZS5zY3JvbGxIZWlnaHQgKyBub2Rlcy5yb290Tm9kZS5vZmZzZXRUb3A7XG5cdFx0XHR2YXIgc2Nyb2xsT2Zmc2V0ID0gKHRoaXMucGFnZVlPZmZzZXQgfHwgdGhpcy5kb2N1bWVudC5ib2R5LnNjcm9sbFRvcCkgKyB0aGlzLmlubmVySGVpZ2h0O1xuXHRcdFx0dmFyIGJvdHRvbU9mZnNldCA9IE1hdGguZmxvb3IodGhpcy5pbm5lckhlaWdodCAqIDAuMjUpO1xuXG5cdFx0XHQvLyBzY3JvbGwgYXQgMjUlIG9mZnNldCBmcm9tIGJvdHRvbVxuXHRcdFx0aWYgKHRvdGFsVmlld0hlaWdodCAtIHNjcm9sbE9mZnNldCAtIGJvdHRvbU9mZnNldCA8IDApIHtcblx0XHRcdFx0Qm9hcmQudXBkYXRlKEludGVyZmFjZXMsIEV2ZW50cywgU2VydmVyLCBtYWluV2luZG93KTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxuXG5cdEJvYXJkLnVwZGF0ZShJbnRlcmZhY2VzLCBFdmVudHMsIFNlcnZlciwgbWFpbldpbmRvdyk7XG59O1xuXG5Cb2FyZC5zaG93QWxlcnQgPSBmdW5jdGlvbihib2R5VGV4dCwgZXh0cmFUZXh0KSB7XG5cdGlmICghbm9kZXMuYWxlcnROb2RlKSB7XG5cdFx0cmV0dXJuIGNvbnNvbGUubG9nKCdCT0FSRCBBTEVSVCcsICdBbiBhdHRlbXB0IHdhcyBtYWRlIHRvIHBsYWNlIGFuIGFsZXJ0IHdpdGhvdXQgY3JlYXRpbmcgdGhlIGJvYXJkIGNvbXBvbmVudHMgZmlyc3QuJyk7XG5cdH1cblxuXHRCb2FyZC5zZXRBbGVydEJvZHkoYm9keVRleHQgfHwgJycpO1xuXHRCb2FyZC5zZXRBbGVydEV4dHJhKGV4dHJhVGV4dCk7XG5cdEJvYXJkLnVwZGF0ZUFsZXJ0Q29tcG9uZW50cygpO1xufTtcblxuQm9hcmQuc2V0QWxlcnRCb2R5ID0gZnVuY3Rpb24odGV4dCkge1xuXHRCb2FyZC5hbGVydE5vZGVDb21wb25lbnRzLmJvZHkgPSB0ZXh0O1xufTtcblxuQm9hcmQuc2V0QWxlcnRFeHRyYSA9IGZ1bmN0aW9uKHRleHQpIHtcblx0Qm9hcmQuYWxlcnROb2RlQ29tcG9uZW50cy5leHRyYSA9IHRleHQ7XG59O1xuXG5Cb2FyZC5zZXRSZXF1ZXN0QW5jaG9yID0gZnVuY3Rpb24oYW5jaG9yKSB7XG5cdEJvYXJkLmFsYnVtUmVxdWVzdENvbXBvbmVudHMuYW5jaG9yID0gYW5jaG9yO1xufTtcblxuQm9hcmQuc2V0UmVxdWVzdExpbWl0ID0gZnVuY3Rpb24obG1pdCkge1xuXHRCb2FyZC5hbGJ1bVJlcXVlc3RDb21wb25lbnRzLmxpbWl0ID0gbG1pdDtcbn07XG5cbkJvYXJkLmdldEFsZXJ0RXh0cmEgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIEJvYXJkLmFsZXJ0Tm9kZUNvbXBvbmVudHMuZXh0cmE7XG59O1xuXG5Cb2FyZC5nZXRSZXF1ZXN0QW5jaG9yID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiBCb2FyZC5hbGJ1bVJlcXVlc3RDb21wb25lbnRzLmFuY2hvcjtcbn07XG5cbkJvYXJkLmdldFJlcXVlc3RMaW1pdCA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gQm9hcmQuYWxidW1SZXF1ZXN0Q29tcG9uZW50cy5saW1pdDtcbn07XG5cbi8vIGxvY2FsIGV2ZW50c1xuQm9hcmQub24gPSBmdW5jdGlvbihldmVudE5hbWUsIGNhbGxiYWNrLCBvbmNlKSB7XG5cdGlmICghZXZlbnRzW2V2ZW50TmFtZV0pIHtcblx0XHRldmVudHNbZXZlbnROYW1lXSA9IFtdO1xuXHR9XG5cdGNhbGxiYWNrLm9uY2UgPSBvbmNlO1xuXHRldmVudHNbZXZlbnROYW1lXS5wdXNoKGNhbGxiYWNrKTtcbn07XG5cbkJvYXJkLmVtaXQgPSBmdW5jdGlvbihldmVudE5hbWUsIGFyZ3MpIHtcblx0aWYgKCFldmVudHNbZXZlbnROYW1lXSkge1xuXHRcdHJldHVybjtcblx0fVxuXHRpZiAoIShhcmdzIGluc3RhbmNlb2YgQXJyYXkpKSB7XG5cdFx0YXJncyA9IFthcmdzXVxuXHR9XG5cdGZvciAodmFyIGkgPSAwOyBpIDwgZXZlbnRzW2V2ZW50TmFtZV0ubGVuZ3RoOyBpKyspIHtcblx0XHRldmVudHNbZXZlbnROYW1lXVtpXS5hcHBseShCb2FyZCwgYXJncyk7XG5cdFx0aWYgKGV2ZW50c1tldmVudE5hbWVdW2ldLm9uY2UpIHtcblx0XHRcdGV2ZW50c1tldmVudE5hbWVdLnNwbGljZShpLCAxKTtcblx0XHR9XG5cdH1cbn07XG5cbi8vIEV4cGVjdHMgYW4gb2Zmc2V0IChvciB6ZXJvKSBhbmQgcGxhY2VzIGVhY2ggaXRlbSBpblxuLy8gYSBjb2xsZWN0aW9uIGluIGEgZ2FsbGVyeSBsYXlvdXQuXG4vLyBUaGlzIG1ldGhvZCBleHBldGNzIGVhY2ggY29sbGVjdGlvbiBpdGVtIHRvIGJlIGFscmVhZHlcbi8vIGFwcGVuZGVkIHRvIGEgcm9vdE5vZGVcbkJvYXJkLmNoaXNlbCA9IGZ1bmN0aW9uKG1haW5XaW5kb3csIHJvb3ROb2RlLCBjb2xsZWN0aW9uLCBvZmZzZXQpIHtcblx0aWYgKCFyb290Tm9kZSB8fCAhbWFpbldpbmRvdyB8fCAhY29sbGVjdGlvbi5sZW5ndGggfHwgb2Zmc2V0IDwgMCkge1xuXHRcdHJldHVybjtcblx0fVxuXHRpZiAoIW9mZnNldCkge1xuXHRcdG9mZnNldCA9IDA7XG5cdH1cblxuXHR2YXIgd2luZG93V2lkdGggPSBtYWluV2luZG93LmlubmVyV2lkdGg7XG5cdHZhciBpdGVtV2lkdGggPSBjb2xsZWN0aW9uWzBdLmdldE5vZGVQcm9wZXJ0eVZhbHVlKCdvZmZzZXRXaWR0aCcpO1xuXHR2YXIgaXRlbU1hcmdpbiA9IDA7XG5cdHZhciBjb2x1bW5Db3VudCA9IDA7XG5cblx0aWYgKHdpbmRvd1dpZHRoICYmIGl0ZW1XaWR0aCkge1xuXHRcdGl0ZW1NYXJnaW4gPSBjb2xsZWN0aW9uWzBdLmdldENTU0NvbXB1dGVkU3R5bGVBc0ludCgnbWFyZ2luLWxlZnQnKSAqIDI7XG5cdFx0Y29sdW1uQ291bnQgPSBNYXRoLm1heCgxLCBNYXRoLmZsb29yKHdpbmRvd1dpZHRoIC8gKGl0ZW1XaWR0aCArIGl0ZW1NYXJnaW4pKSk7XG5cdFx0aWYgKGNvbHVtbkNvdW50ID4gY29sbGVjdGlvbi5sZW5ndGgpIHtcblx0XHRcdGNvbHVtbkNvdW50ID0gY29sbGVjdGlvbi5sZW5ndGg7XG5cdFx0fVxuXG5cdFx0Ly8gcHJldmVudCBhbnkgZnVydGhlciBhY3Rpb24gaWYgY29sdW1uIGNvdW50IGhhcyBub3QgY2hhbmdlZFxuXHRcdC8vIGFuZCB0aGUgZW50aXJlIGNvbGxlY3Rpb24gaXMgYmVpbmcgcHJvY2Vzc2VkIHdpdGggbm8gb2Zmc2V0XG5cdFx0aWYgKGNvbHVtbkNvdW50ID09IGNhY2hlLmxhc3RDb2x1bW5Db3VudCAmJiBvZmZzZXQgPT0gMCkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXG5cdFx0cm9vdE5vZGUuc3R5bGUud2lkdGggPSAoY29sdW1uQ291bnQgKiAoaXRlbVdpZHRoICsgKGl0ZW1NYXJnaW4pKSkgKyBcInB4XCI7XG5cdFx0Y2FjaGUubGFzdENvbHVtbkNvdW50ID0gY29sdW1uQ291bnQ7XG5cblx0XHRmb3IgKHZhciBpID0gb2Zmc2V0OyBpIDwgY29sbGVjdGlvbi5sZW5ndGg7IGkrKykge1xuXHRcdFx0Y29sbGVjdGlvbltpXS5yZW1vdmVGbGFnKCdmaXJzdCcpO1xuXHRcdFx0Y29sbGVjdGlvbltpXS5zZXRGbGFnKCdsZWZ0JywgMCk7XG5cdFx0XHRjb2xsZWN0aW9uW2ldLnNldENTU1Byb3BlcnR5VmFsdWUoJ3RvcCcsICcwcHgnKTtcblx0XHRcdGNvbGxlY3Rpb25baV0uc2V0Q1NTUHJvcGVydHlWYWx1ZSgnbGVmdCcsICcwcHgnKTtcblx0XHR9XG5cblx0XHRpZiAob2Zmc2V0ID09IDApIHtcblx0XHRcdGZvciAodmFyIGkgPSBvZmZzZXQ7IGkgPCBjb2xsZWN0aW9uLmxlbmd0aDsgaSArPSBjb2x1bW5Db3VudCkge1xuXHRcdFx0XHRjb2xsZWN0aW9uW2ldLnNldEZsYWcoJ2ZpcnN0Jyk7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdGZvciAodmFyIGkgPSBvZmZzZXQ7IGkgPCBjb2xsZWN0aW9uLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGlmIChjb2xsZWN0aW9uW2kgLSBjb2x1bW5Db3VudF0gJiYgY29sbGVjdGlvbltpIC0gY29sdW1uQ291bnRdLmhhc0ZsYWcoJ2ZpcnN0JykpIHtcblx0XHRcdFx0XHRjb2xsZWN0aW9uW2ldLnNldEZsYWcoJ2ZpcnN0Jyk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRmb3IgKHZhciBpID0gb2Zmc2V0OyBpIDwgY29sbGVjdGlvbi5sZW5ndGg7IGkrKykge1xuXHRcdFx0aWYgKCFjb2xsZWN0aW9uW2ldLmhhc0ZsYWcoJ2ZpcnN0JykpIHtcblx0XHRcdFx0Y29sbGVjdGlvbltpXS5zZXRGbGFnKCdsZWZ0JywgY29sbGVjdGlvbltpIC0gMV0uZ2V0RmxhZygnbGVmdCcpICsgY29sbGVjdGlvbltpIC0gMV0uZ2V0Tm9kZVByb3BlcnR5VmFsdWUoJ29mZnNldFdpZHRoJykgKyBpdGVtTWFyZ2luKTtcblx0XHRcdFx0Y29sbGVjdGlvbltpXS5zZXRDU1NQcm9wZXJ0eVZhbHVlKCdsZWZ0JywgY29sbGVjdGlvbltpXS5nZXRGbGFnKCdsZWZ0JykgKyBcInB4XCIpO1xuXG5cdFx0XHR9XG5cdFx0XHRpZiAoY29sbGVjdGlvbltpIC0gY29sdW1uQ291bnRdKSB7XG5cdFx0XHRcdGNvbGxlY3Rpb25baV0uc2V0Q1NTUHJvcGVydHlWYWx1ZSgndG9wJyxcblx0XHRcdFx0XHQoY29sbGVjdGlvbltpIC0gY29sdW1uQ291bnRdLmdldE5vZGVQcm9wZXJ0eVZhbHVlKCdvZmZzZXRUb3AnKSArIGNvbGxlY3Rpb25baSAtIGNvbHVtbkNvdW50XS5nZXROb2RlUHJvcGVydHlWYWx1ZSgnb2Zmc2V0SGVpZ2h0JykgKyBpdGVtTWFyZ2luIC0gKGNvbGxlY3Rpb25baV0uZ2V0Tm9kZVByb3BlcnR5VmFsdWUoJ29mZnNldFRvcCcpKSkgKyBcInB4XCIpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdEJvYXJkLmVtaXQoJ2NoaXNlbCcsIFtyb290Tm9kZSwgaXRlbU1hcmdpbl0pO1xufTtcblxuQm9hcmQuZ2V0SW1hZ2VCeUluZGV4ID0gZnVuY3Rpb24oaW5kZXgpIHtcblx0dmFyIHBpY3R1cmUgPSBCb2FyZC5nZXRQaWN0dXJlQnlJbmRleChpbmRleClcblx0aWYgKHBpY3R1cmUpIHtcblx0XHRyZXR1cm4gcGljdHVyZS5nZXRJbWFnZU5vZGUoKTtcblx0fVxuXHRyZXR1cm4gbnVsbDtcbn07XG5cbkJvYXJkLmdldEltYWdlQnlJZCA9IGZ1bmN0aW9uKGlkKSB7XG5cdGZvciAodmFyIGkgPSAwOyBpIDwgQm9hcmQucGljdHVyZXMubGVuZ3RoOyBpKyspIHtcblx0XHRpZiAoQm9hcmQucGljdHVyZXNbaV0uZ2V0Tm9kZUlEKCkgPT0gaWQpIHtcblx0XHRcdHJldHVybiBCb2FyZC5waWN0dXJlc1tpXTtcblx0XHR9XG5cdH1cbn07XG5cbkJvYXJkLmdldFBpY3R1cmVCeUluZGV4ID0gZnVuY3Rpb24oaW5kZXgpIHtcblx0cmV0dXJuIEJvYXJkLnBpY3R1cmVzW2luZGV4XTtcbn07XG5cbi8vIHJldHVybiBsb2FkZWQgcGljdHVyZSBjb3VudFxuQm9hcmQuZ2V0U2l6ZSA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gQm9hcmQucGljdHVyZXMubGVuZ3RoO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBCb2FyZDsiLCJ2YXIgSW50Q29udHJvbGxlciA9IHt9XG5cbmZ1bmN0aW9uIGludGVyZmFjZU5vZGUoKSB7XG5cdHRoaXMuY2FsbGJhY2tzID0ge307XG5cblx0Ly8gV2FybmluZzogZG9lcyBub3QgcmVnaXN0ZXIgXCJET01UcmVlXCIgbm9kZSBldmVudHNcblx0Ly8gdGhhdCBzaG91bGQgYmUgd2F0Y2hlZCB3aXRoIFwiYWRkRXZlbnRMaXN0ZW5lclwiLlxuXHQvLyBvbmx5IHJlZ2lzdGVycyBcImxvY2FsXCIgaW5zdGFuY2UgZXZlbnRzLiBVc2Vcblx0Ly8gXCJFdmVudHMub25Ob2RlRXZlbnRcIiB0byBsaXN0ZW4gZm9yIGFjdHVhbCBkb20gZXZ0cy5cblx0dGhpcy5vbiA9IGZ1bmN0aW9uKGV2ZW50TmFtZSwgY2FsbGJhY2spIHtcblx0XHRpZiAoIXRoaXMuY2FsbGJhY2tzW2V2ZW50TmFtZV0pIHtcblx0XHRcdHRoaXMuY2FsbGJhY2tzW2V2ZW50TmFtZV0gPSBbXTtcblx0XHR9XG5cblx0XHR0aGlzLmNhbGxiYWNrc1tldmVudE5hbWVdLnB1c2goY2FsbGJhY2spO1xuXHR9O1xuXG5cdHRoaXMuZW1pdCA9IGZ1bmN0aW9uKGV2ZW50TmFtZSwgYXJncykge1xuXHRcdGlmICghdGhpcy5jYWxsYmFja3NbZXZlbnROYW1lXSkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5jYWxsYmFja3NbZXZlbnROYW1lXS5sZW5ndGg7IGkrKykge1xuXHRcdFx0dGhpcy5jYWxsYmFja3NbZXZlbnROYW1lXVtpXS5hcHBseSh0aGlzLCBhcmdzKTtcblx0XHR9XG5cdH07XG59XG5cbmZ1bmN0aW9uIGludGVyZmFjZUlucHV0Tm9kZShFdmVudHMsIG1haW5XaW5kb3cpIHtcblx0dmFyIHNjb3BlID0gdGhpcztcblxuXHR0aGlzLm5vZGUgPSBtYWluV2luZG93LmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbnB1dFwiKTtcblx0dGhpcy50eXBlID0gXCJ0ZXh0XCI7XG5cdHRoaXMucGFzc3dvcmQgPSBmYWxzZTtcblx0dGhpcy5jbGFzc05hbWUgPSBcIlBpY3RyZS1wYXNzY29kZS1pbnB1dFwiO1xuXHR0aGlzLnBsYWNlaG9sZGVyID0gXCJDcmVhdGUgYSBwYXNzY29kZVwiO1xuXHR0aGlzLnZhbHVlID0gdGhpcy5wbGFjZWhvbGRlcjtcblxuXHR0aGlzLm5vZGUubWF4TGVuZ3RoID0gMTA7XG5cdHRoaXMubm9kZS5jbGFzc05hbWUgPSB0aGlzLmNsYXNzTmFtZTtcblx0dGhpcy5ub2RlLnR5cGUgPSB0aGlzLnR5cGU7XG5cdHRoaXMubm9kZS5wbGFjZWhvbGRlciA9IHRoaXMucGxhY2Vob2xkZXIgfHwgXCJcIjtcblxuXHR0aGlzLmdldE5vZGUgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gc2NvcGUubm9kZTtcblx0fTtcblx0dGhpcy5zZXRTdHlsZSA9IGZ1bmN0aW9uKGF0dHIsIHZhbHVlKSB7XG5cdFx0c2NvcGUubm9kZS5zdHlsZVthdHRyXSA9IHZhbHVlO1xuXHR9O1xuXHR0aGlzLnNldEF0dHJpYnV0ZSA9IGZ1bmN0aW9uKGF0dHIsIHZhbHVlKSB7XG5cdFx0c2NvcGUubm9kZS5zZXRBdHRyaWJ1dGUoYXR0ciwgdmFsdWUpO1xuXHR9O1xuXG5cdHRoaXMuc2V0VmFsdWUgPSBmdW5jdGlvbih0ZXh0KSB7XG5cdFx0dGhpcy5ub2RlLnZhbHVlID0gdGV4dDtcblx0XHR0aGlzLnZhbHVlID0gdGV4dDtcblx0fTtcblxuXHR0aGlzLnNldFBsYWNlaG9sZGVyID0gZnVuY3Rpb24odGV4dCkge1xuXHRcdHRoaXMudmFsdWUgPSB0ZXh0O1xuXHRcdHRoaXMucGxhY2Vob2xkZXIgPSB0ZXh0O1xuXHRcdHRoaXMubm9kZS5wbGFjZWhvbGRlciA9IHRleHQ7XG5cdH07XG5cblx0dGhpcy5nZXRWYWx1ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBzY29wZS5ub2RlLnZhbHVlO1xuXHR9O1xuXHR0aGlzLmdldEVzY2FwZWRWYWx1ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBzY29wZS5ub2RlLnZhbHVlLnRvTG93ZXJDYXNlKClcblx0XHRcdC5yZXBsYWNlKC8mL2csIFwiJmFtcDtcIilcblx0XHRcdC5yZXBsYWNlKC88L2csIFwiJmx0O1wiKVxuXHRcdFx0LnJlcGxhY2UoLz4vZywgXCImZ3Q7XCIpXG5cdFx0XHQucmVwbGFjZSgvXCIvZywgXCImcXVvdDtcIilcblx0XHRcdC5yZXBsYWNlKC8nL2csIFwiJiMwMzk7XCIpO1xuXHR9O1xuXG5cdHRoaXMuaXNWYWx1ZUVtcHR5ID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHNjb3BlLnZhbHVlID09IHNjb3BlLm5vZGUudmFsdWUgfHwgc2NvcGUubm9kZS52YWx1ZSA9PSAnJztcblx0fTtcblxuXHRFdmVudHMub25Ob2RlRXZlbnQodGhpcy5ub2RlLCAnZm9jdXMnLCBmdW5jdGlvbihlKSB7XG5cdFx0c2NvcGUuZW1pdCgnZm9jdXMnLCBbZV0pO1xuXHRcdGlmIChzY29wZS5wYXNzd29yZCkge1xuXHRcdFx0c2NvcGUubm9kZS50eXBlID0gXCJwYXNzd29yZFwiO1xuXHRcdH1cblx0XHRpZiAoc2NvcGUubm9kZS52YWx1ZSA9PSBzY29wZS52YWx1ZSkge1xuXHRcdFx0c2NvcGUubm9kZS52YWx1ZSA9IFwiXCI7XG5cdFx0fVxuXHR9KTtcblxuXHRFdmVudHMub25Ob2RlRXZlbnQodGhpcy5ub2RlLCAnYmx1cicsIGZ1bmN0aW9uKGUpIHtcblx0XHRzY29wZS5lbWl0KCdibHVyJywgW2VdKTtcblx0fSk7XG5cblx0cmV0dXJuIHRoaXM7XG59O1xuXG5pbnRlcmZhY2VJbnB1dE5vZGUucHJvdG90eXBlID0gbmV3IGludGVyZmFjZU5vZGUoKTtcblxuZnVuY3Rpb24gaW50ZXJmYWNlRGl2Tm9kZSgpIHtcblxufVxuXG5JbnRDb250cm9sbGVyLmhvcml6b250YWxDZW50ZXJOb2RlUmVsYXRpdmVUbyA9IGZ1bmN0aW9uKG5vZGUsIHJlbGF0aXZlVG9Ob2RlKSB7XG5cdG5vZGUuc3R5bGUubGVmdCA9ICgkKHJlbGF0aXZlVG9Ob2RlKS53aWR0aCgpIC8gMikgLSAoJChub2RlKS53aWR0aCgpIC8gMikgKyAncHgnO1xufTtcblxuSW50Q29udHJvbGxlci52ZXJ0aWNhbENlbnRlck5vZGVSZWxhdGl2ZVRvID0gZnVuY3Rpb24obm9kZSwgcmVsYXRpdmVUb05vZGUpIHtcblx0bm9kZS5zdHlsZS50b3AgPSAoJChyZWxhdGl2ZVRvTm9kZSkuaGVpZ2h0KCkgLyAyKSAtICgkKG5vZGUpLmhlaWdodCgpIC8gMikgKyAncHgnO1xufTtcblxuSW50Q29udHJvbGxlci5jZW50ZXJOb2RlUmVsYXRpdmVUbyA9IGZ1bmN0aW9uKG5vZGUsIHJlbGF0aXZlVG9Ob2RlKSB7XG5cdEludENvbnRyb2xsZXIuaG9yaXpvbnRhbENlbnRlck5vZGVSZWxhdGl2ZVRvKG5vZGUsIHJlbGF0aXZlVG9Ob2RlKTtcblx0SW50Q29udHJvbGxlci52ZXJ0aWNhbENlbnRlck5vZGVSZWxhdGl2ZVRvKG5vZGUsIHJlbGF0aXZlVG9Ob2RlKTtcbn07XG5cbkludENvbnRyb2xsZXIubmV3SW5wdXROb2RlID0gZnVuY3Rpb24oRXZlbnRzLCBtYWluV2luZG93KSB7XG5cdHJldHVybiBuZXcgaW50ZXJmYWNlSW5wdXROb2RlKEV2ZW50cywgbWFpbldpbmRvdyk7XG59O1xuXG5JbnRDb250cm9sbGVyLm5ld0Rpdk5vZGUgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIG5ldyBpbnRlcmZhY2VEaXZOb2RlKCk7XG59O1xuXG5JbnRDb250cm9sbGVyLmNyZWF0ZURpdk5vZGUgPSBmdW5jdGlvbihtYWluV2luZG93KSB7XG5cdHJldHVybiBtYWluV2luZG93LmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xufTtcblxuSW50Q29udHJvbGxlci5jcmVhdGVOb2RlID0gZnVuY3Rpb24obWFpbldpbmRvdywgbm9kZU5hbWUpIHtcblx0cmV0dXJuIG1haW5XaW5kb3cuZG9jdW1lbnQuY3JlYXRlRWxlbWVudChub2RlTmFtZSk7XG59O1xuXG5JbnRDb250cm9sbGVyLnNldE5vZGVPdmVyZmxvd0hpZGRlbiA9IGZ1bmN0aW9uKG5vZGUpIHtcblx0bm9kZS5zdHlsZS5vdmVyZmxvdyA9ICdoaWRkZW4nO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBJbnRDb250cm9sbGVyOyIsIi8qKlxuICogR2FsbGVyeSB3cmFwcGVyIGZvciBvdmVybGF5IGludGVyZmFjZVxuICovXG5cbnZhciBHYWxsZXJ5SW50ZXJmYWNlID0ge307XG5cbkdhbGxlcnlJbnRlcmZhY2UuaXNGZWF0dXJpbmcgPSBmYWxzZTtcblxuR2FsbGVyeUludGVyZmFjZS5ldmVudHMgPSB7fTtcbkdhbGxlcnlJbnRlcmZhY2UuaW1hZ2VzID0gW107XG5cbkdhbGxlcnlJbnRlcmZhY2UuaW1hZ2UgPSBudWxsO1xuXG52YXIgaXNBY3RpdmUgPSBmYWxzZTtcblxuR2FsbGVyeUludGVyZmFjZS5ldmVudHMub25yZWFkeSA9IGZ1bmN0aW9uKCkge307XG5HYWxsZXJ5SW50ZXJmYWNlLmV2ZW50cy5vbmNsb3NlID0gZnVuY3Rpb24oKSB7fTtcblxuR2FsbGVyeUludGVyZmFjZS5vbkV4aXQgPSBmdW5jdGlvbihleGl0Q2FsbGJhY2spIHtcblx0T3ZlcmxheS5ldmVudHMub25leGl0LnB1c2goZXhpdENhbGxiYWNrKTtcbn07XG5cbkdhbGxlcnlJbnRlcmZhY2UuaGlkZSA9IGZ1bmN0aW9uKCkge1xuXG5cdC8vIGlmICghT3ZlcmxheS5pc0xvY2tlZCkge1xuXG5cdC8vIFx0d2luZG93LmRvY3VtZW50LmJvZHkuc3R5bGUub3ZlcmZsb3cgPSAnYXV0byc7XG5cdC8vIFx0d2luZG93LmRvY3VtZW50LmJvZHkuc3R5bGUuaGVpZ2h0ID0gJ2F1dG8nO1xuXHQvLyBcdEdhbGxlcnlJbnRlcmZhY2UuaXNGZWF0dXJpbmcgPSBmYWxzZTtcblxuXHQvLyBcdE92ZXJsYXkucmVtb3ZlKCk7XG5cdC8vIFx0R2FsbGVyeUludGVyZmFjZS5vbmNsb3NlKCk7XG5cblx0Ly8gXHRmb3IgKHZhciBpID0gMDsgaSA8IE92ZXJsYXkuZXZlbnRzLm9uZXhpdC5sZW5ndGg7IGkrKykge1xuXHQvLyBcdFx0aWYgKE92ZXJsYXkuZXZlbnRzLm9uZXhpdFtpXSkgT3ZlcmxheS5ldmVudHMub25leGl0W2ldLmNhbGwoR2FsbGVyeUludGVyZmFjZSk7XG5cdC8vIFx0fVxuXG5cdC8vIH1cblxufVxuXG4vKipcbiAqIEZlYXR1cmUgYSBnaXZlbiBpbWFnZSBvYmplY3RcbiAqL1xuR2FsbGVyeUludGVyZmFjZS5zaG93ID0gZnVuY3Rpb24oaW1hZ2UpIHtcblxuXHRHYWxsZXJ5SW50ZXJmYWNlLmlzQWN0aXZlID0gdHJ1ZTtcblxuXHR2YXIgc2NvcGUgPSBQaWN0cmU7XG5cblx0Ly8gdmFyIHRodW1iID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblx0Ly8gdGh1bWIuY2xhc3NOYW1lID0gXCJQaWN0cmUtb3ZlcmxheS1waWNcIjtcblx0Ly8gdGh1bWIuZGF0YSA9IGltYWdlLmRhdGE7XG5cdC8vIHRodW1iLnN0eWxlLm1pbldpZHRoID0gRW52aXJvbm1lbnQubWF4SW1hZ2VXaWR0aCArICdweCc7XG5cdC8vIHRodW1iLnN0eWxlLm1heFdpZHRoID0gRW52aXJvbm1lbnQubWF4SW1hZ2VXaWR0aCArICdweCc7XG5cdC8vIHRodW1iLnN0eWxlLndpZHRoID0gRW52aXJvbm1lbnQubWF4SW1hZ2VXaWR0aCArICdweCc7XG5cdC8vIHRodW1iLmlubmVySFRNTCA9IFwiPGRpdiBjbGFzcz0nUGljdHJlLWxvYWRlcic+PHNwYW4gY2xhc3M9J2ZhIGZhLWNpcmNsZS1vLW5vdGNoIGZhLXNwaW4gZmEtM3gnPjwvc3Bhbj48L2Rpdj5cIjtcblxuXHQvLyBPdmVybGF5LmZlYXR1cmUodGh1bWIpO1xuXHQvLyBPdmVybGF5Lml0ZXJhdG9yID0gaW1hZ2UuZGF0YS5pZDtcblxuXHQvLyB3aW5kb3cuZG9jdW1lbnQuYm9keS5zdHlsZS5oZWlnaHQgPSAkKHdpbmRvdykuaGVpZ2h0KCkgKyAncHgnO1xuXHQvLyB3aW5kb3cuZG9jdW1lbnQuYm9keS5zdHlsZS5vdmVyZmxvdyA9ICdoaWRkZW4nO1xuXG5cdC8vIGltYWdlLnN0eWxlLm9wYWNpdHkgPSAnMC4xJztcblxuXHQvLyBHYWxsZXJ5LnNob3dJbWFnZSh0aHVtYik7XG5cdC8vIFBpY3RyZS5nYWxsZXJ5Lm92ZXJsYXkub25jbG9zZSA9IGZ1bmN0aW9uKCkge1xuXHQvLyBcdGlmIChhKSBhLnN0eWxlLm9wYWNpdHkgPSBQaWN0cmUuX3NldHRpbmdzLmRhdGEudmlzaXRlZDtcblx0Ly8gfVxuXG59O1xuXG5HYWxsZXJ5SW50ZXJmYWNlLmlzQWN0aXZlID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiBpc0FjdGl2ZTtcbn07XG5cbkdhbGxlcnlJbnRlcmZhY2UuZ2V0T3ZlcmxheSA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gT3ZlcmxheTtcbn1cblxuR2FsbGVyeUludGVyZmFjZS5wdXRPdmVybGF5ID0gZnVuY3Rpb24oKSB7fVxuXG5tb2R1bGUuZXhwb3J0cyA9IEdhbGxlcnlJbnRlcmZhY2U7IiwiLyoqXG4gKiBFeHBvcnRzIGFsbCBpbnRlcmZhY2UgbW9kdWxlcyBpbiBjdXJyZW50IGRpcmVjdG9yeVxuICovXG5cbi8vaW1wb3J0IGFsbCBtb2R1bGVzXG52YXIgbW9kdWxlcyA9IHtcblx0J2JvYXJkJzogcmVxdWlyZSgnLi9ib2FyZC5qcycpLFxuXHQnY29udHJvbGxlcic6IHJlcXVpcmUoJy4vY29udHJvbGxlci5qcycpLFxuXHQnZ2FsbGVyeSc6IHJlcXVpcmUoJy4vZ2FsbGVyeS5qcycpLFxuXHQnbWVudSc6IHJlcXVpcmUoJy4vbWVudS5qcycpLFxuXHQnbW9kYWwnOiByZXF1aXJlKCcuL21vZGFsLmpzJyksXG5cdCdvdmVybGF5JzogcmVxdWlyZSgnLi9vdmVybGF5LmpzJyksXG5cdCdzcGxhc2gnOiByZXF1aXJlKCcuL3NwbGFzaC5qcycpLFxuXHQnd2FybmluZyc6IHJlcXVpcmUoJy4vd2FybmluZy5qcycpXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IG1vZHVsZXM7IiwiLyoqXG4gKiBOYXZpZ2F0aW9uIGFuZCBtZW51IGludGVyZmFjZVxuICovXG5cbnZhciBFbnZpcm9ubWVudCA9IHJlcXVpcmUoJy4uL2Vudmlyb25tZW50LmpzJyk7XG52YXIgVXRpbGl0aWVzID0gcmVxdWlyZSgnLi4vdXRpbGl0aWVzLmpzJyk7XG5cbnZhciBNZW51SW50ZXJmYWNlID0ge1xuXG5cdGRvbUVsZW1lbnQ6IG51bGwsXG5cdGJ1dHRvbnM6IHt9LFxuXG5cdC8qKlxuXHQgKiBBZGRzIHVpIGljb24gdG8gdGhlIHRvcCBuYXZpZ2F0aW9uIG9mIHRoZSBhcHBsaWNhdGlvblxuXHQgKlxuXHQgKiBAcGFyYW0gYnV0dG9uIFtvYmplY3RdIGRlZmluaW5nIHVpIGFuZCBhY3Rpb24gcHJvcGVydGllcyBmb3IgYnV0dG9uXG5cdCAqIEByZXR1cm4gcG9pbnRlciB0byBhZGRlZCBidXR0b24gb2JqZWN0XG5cdCAqL1xuXHRhZGRCdXR0b246IGZ1bmN0aW9uKGJ1dHRvbikge1xuXG5cdFx0dmFyIGJ1dHRvbkljb25DbGFzc05hbWUgPSAnZmEtY2xvdWQnO1xuXG5cdFx0dGhpcy5idXR0b25zW2J1dHRvbi5uYW1lXSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG5cdFx0dGhpcy5idXR0b25zW2J1dHRvbi5uYW1lXS5pZCA9IGJ1dHRvbi5pZDtcblx0XHR0aGlzLmJ1dHRvbnNbYnV0dG9uLm5hbWVdLmNsYXNzTmFtZSA9IFwidG9wLWJ1dHRvblwiOyAvL1widG9wLWJ1dHRvblwiO1xuXHRcdHRoaXMuYnV0dG9uc1tidXR0b24ubmFtZV0udGl0bGUgPSBidXR0b24udGl0bGU7XG5cblx0XHQvLyBoYW5kbGUgYnV0dG9uIGljb24gdHlwZVxuXHRcdGlmIChidXR0b24uaWQgPT0gJ3VwbG9hZCcpIHtcblx0XHRcdC8vIGFzc2lnbiB1cGxvYWQgaWNvblxuXHRcdFx0YnV0dG9uSWNvbkNsYXNzTmFtZSA9ICdmYS1jbG91ZC11cGxvYWQnO1xuXHRcdH0gZWxzZSBpZiAoYnV0dG9uLmlkID09ICdsb2NrJykge1xuXHRcdFx0Ly8gYXNzaWduICdsb2NrJyBpY29uIHRvIGluZGljYXRlIHNpZ25pbmcgaW5cblx0XHRcdGJ1dHRvbkljb25DbGFzc05hbWUgPSAnZmEtbG9jayc7XG5cdFx0fSBlbHNlIGlmIChidXR0b24uaWQgPT0gJ3VubG9jaycpIHtcblx0XHRcdC8vIGFzc2lnbiAndW5sb2NrJyBpY29uIHRvIGluZGljYXRlIHNpZ25pbmcgb3V0XG5cdFx0XHRidXR0b25JY29uQ2xhc3NOYW1lID0gJ2ZhLXVubG9jayc7XG5cdFx0fSBlbHNlIGlmIChidXR0b24uaWQgPT0gJ2JhY2snKSB7XG5cdFx0XHQvLyBhc3NpZ24gJ2JhY2snIGFycm93IGljb24gdG8gaW5kaWNhdGUgcmV0dXJuaW5nIHRvIGFsYnVtXG5cdFx0XHRidXR0b25JY29uQ2xhc3NOYW1lID0gJ2ZhLWFycm93LWxlZnQnO1xuXHRcdH1cblxuXHRcdHRoaXMuYnV0dG9uc1tidXR0b24ubmFtZV0uaW5uZXJIVE1MID0gJzxzcGFuIGNsYXNzPVwiZmEgJyArIGJ1dHRvbkljb25DbGFzc05hbWUgKyAnIGZhLTJ4XCI+PC9zcGFuPic7XG5cblx0XHR0aGlzLmRvbUVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5idXR0b25zW2J1dHRvbi5uYW1lXSk7XG5cblx0XHR0aGlzLmJ1dHRvbnNbYnV0dG9uLm5hbWVdLnN0eWxlLnRvcCA9ICh0aGlzLmJ1dHRvbnNbYnV0dG9uLm5hbWVdLnBhcmVudE5vZGUuY2xpZW50SGVpZ2h0IC8gMiAtIHRoaXMuYnV0dG9uc1tidXR0b24ubmFtZV0uY2xpZW50SGVpZ2h0IC8gMikgKyAncHgnO1xuXG5cdFx0Ly8gZGVjbGFyZSAnb24nIGZ1bmN0aW9uIHRvIGFsbG93IGFkZGl0aW9uIG9mIGV2ZW50IGxpc3RlbmVyIHRvIGVsZW1lbnRcblx0XHR0aGlzLmJ1dHRvbnNbYnV0dG9uLm5hbWVdLm9uID0gZnVuY3Rpb24oYWN0aW9uLCBjYWxsYmFjaykge1xuXG5cdFx0XHRQaWN0cmUuZXh0ZW5kKHRoaXMpLm9uKGFjdGlvbiwgZnVuY3Rpb24oZXZ0KSB7XG5cdFx0XHRcdGNhbGxiYWNrLmNhbGwodGhpcywgZXZ0KTtcblx0XHRcdH0pO1xuXG5cdFx0XHRyZXR1cm4gdGhpcztcblxuXHRcdH07XG5cblx0XHRyZXR1cm4gdGhpcy5idXR0b25zW2J1dHRvbi5uYW1lXTtcblx0fSxcblxuXHQvKipcblx0ICogUmV0dXJucyBwb2ludGVyIHRvIGJ1dHRvbiB3aXRoIHNwZWNpZmllZCBpZFxuXHQgKi9cblx0Z2V0QnV0dG9uOiBmdW5jdGlvbihidXR0b25JZCkge1xuXHRcdHJldHVybiB0aGlzLmJ1dHRvbnNbYnV0dG9uSWRdO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRydWUgaWYgYnV0dG9uIHdpdGggc3BlY2lmaWVkIGlmIGV4aXN0c1xuXHQgKiBmYWxzZSBvdGhlcndpc2UuXG5cdCAqL1xuXHRoYXNCdXR0b246IGZ1bmN0aW9uKGJ1dHRvbklkKSB7XG5cblx0XHR2YXIgYnV0dG9uRXhpc3RzID0gZmFsc2U7XG5cblx0XHRpZiAodGhpcy5idXR0b25zLmhhc093blByb3BlcnR5KGJ1dHRvbklkKSkge1xuXHRcdFx0YnV0dG9uRXhpc3RzID0gdHJ1ZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gYnV0dG9uRXhpc3RzO1xuXG5cdH0sXG5cblx0LyoqXG5cdCAqIFNldHMgZG9tIHN0eWxlIGRpc3BsYXkgcHJvcGVydHkgdG8gbm9uZSBvZiBidXR0b24gd2l0aFxuXHQgKiBzcGVjaWZpZWQgaWQuIElmIGJ1dHRvbiBkb2VzIG5vdCBleGlzdCwgcmVxdWVzdCBpcyBpZ25vcmVkLlxuXHQgKi9cblx0aGlkZUJ1dHRvbjogZnVuY3Rpb24oYnV0dG9uSWQpIHtcblx0XHRpZiAodGhpcy5oYXNCdXR0b24oYnV0dG9uSWQpKSB7XG5cdFx0XHR0aGlzLmJ1dHRvbnNbYnV0dG9uSWRdLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG5cdFx0fVxuXHR9LFxuXG5cdC8qKlxuXHQgKiBNYWluIGRpc3BsYXkgZnVuY3Rpb24gZm9yIG1lbnUgaW50ZXJmYWNlLiBXaGVuIGNhbGxlZCwgY3JlYXRlc1xuXHQgKiBtZW51IGRvbSBlbGVtZW50LCBhcHBlbmRzIGFwcGxpY2F0aW9uIGJyYW5kLCBhbmQgaW5zZXJ0cyBtZW51XG5cdCAqIGVsZW1lbnQgYmVmb3JlIHRoZSBtYWluIGFwcGxpY2F0aW9uIHdyYXBwZXIuIElmIGFcblx0ICogc2libGluZ05vZGUgaXMgbm90IHN1cHBsaWVkLCB0aGUgbWVudSBlbGVtZW50IGlzIGFwcGVuZGVkXG5cdCAqIHRvIHRoZSBwYXJlbnQgbm9kZSBzdXBwbGllZC4gKFVzdWFsbHkgYm9keSkuXG5cdCAqXG5cdCAqIE5vdGU6IHRoZSBhcHBsaWNhdGlvbiB3cmFwcGVyIGlzIHVzdWFsbHkgY3JlYXRlZCBhbmQgYXBwZW5kZWRcblx0ICogaW4gdGhlIGluZGV4Lmh0bWwgcHJlLWluaXRpYWxpemF0aW9uIHNjcmlwdC5cblx0ICpcblx0ICogQHBhcmFtIHBhcmVudE5vZGUgXHRcdFx0W0RPTUVsZW1lbnRdIHBhcmVudCBub2RlIG9mIGFwcCB3cmFwcGVyIGFuZCBtZW51ICh1c3VhbGx5IGRvY3VtZW50LmJvZHkpXG5cdCAqIEBwYXJhbSBzaWJsaW5nTm9kZSBcdFtET01FbGVtZW50XSBtYWluIGNvbnRlbnQgd3JhcHBlciBmb3IgYXBwbGljYXRpb25cblx0ICovXG5cdHB1dDogZnVuY3Rpb24ocGFyZW50Tm9kZSwgc2libGluZ05vZGUpIHtcblxuXHRcdHRoaXMuZG9tRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG5cdFx0dGhpcy5kb21FbGVtZW50LmlkID0gJ3RvcCc7XG5cblx0XHQvLyBwbGFjZSBsb2dvIG9uIG1lbnVcblx0XHR2YXIgYnJhbmQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuXHRcdGJyYW5kLmlkID0gJ2JyYW5kJztcblx0XHRicmFuZC5pbm5lckhUTUwgPSBFbnZpcm9ubWVudC5hcHAudGl0bGU7XG5cblx0XHRVdGlsaXRpZXMuZXh0ZW5kKGJyYW5kKS5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcblx0XHRcdHdpbmRvdy5sb2NhdGlvbi5hc3NpZ24oJy8nKTtcblx0XHR9KTtcblxuXHRcdHRoaXMuZG9tRWxlbWVudC5hcHBlbmRDaGlsZChicmFuZCk7XG5cblx0XHRpZiAoc2libGluZ05vZGUpIHtcblx0XHRcdHBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKHRoaXMuZG9tRWxlbWVudCwgc2libGluZ05vZGUpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRwYXJlbnROb2RlLmFwcGVuZENoaWxkKHRoaXMuZG9tRWxlbWVudCk7XG5cdFx0fVxuXG5cdFx0YnJhbmQuc3R5bGUudG9wID0gKHRoaXMuZG9tRWxlbWVudC5jbGllbnRIZWlnaHQgLyAyIC0gYnJhbmQuY2xpZW50SGVpZ2h0IC8gMikgKyAncHgnO1xuXHRcdHJldHVybiB0aGlzLmRvbUVsZW1lbnQ7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFJlbW92ZXMgYnV0dG9uIGZyb20gdGhlIGRvY3VtZW50IGFuZCBkZWxldGVzIGRvbSBlbGVtZW50LlxuXHQgKiBJZiBidXR0b24gd2l0aCBzcGVjaWZpZWQgaWQgZG9lcyBub3QgZXhpc3QsIGFjdGlvbiBpcyBpZ25vcmVkLlxuXHQgKlxuXHQgKiBAcGFyYW0gYnV0dG9uSWQgW1N0cmluZ10gaWQgb2YgYnV0dG9uIHRvIHJlbW92ZVxuXHQgKi9cblx0cmVtb3ZlQnV0dG9uOiBmdW5jdGlvbihidXR0b25JZCkge1xuXHRcdGlmICh0aGlzLmhhc0J1dHRvbihidXR0b25JZCkpIHtcblx0XHRcdHRoaXMuZG9tRWxlbWVudC5yZW1vdmVDaGlsZCh0aGlzLmJ1dHRvbnNbYnV0dG9uSWRdKTtcblx0XHRcdGRlbGV0ZSB0aGlzLmJ1dHRvbnNbYnV0dG9uSWRdO1xuXHRcdH1cblx0fSxcblxuXHQvKipcblx0ICogU2V0cyBidXR0b24gY3NzIHN0eWxlIGRpc3BsYXkgcHJvcGVydHkgdG8gYmxvY2suXG5cdCAqIFVzZWQgYWZ0ZXIgaGlkaW5nIGEgYnV0dG9uLiBJZiBhIGJ1dHRvbiB3aXRoXG5cdCAqIHNwZWNpZmllZCBpZCBkb2VzIG5vdCBleGlzdCwgdGhpcyBhY3Rpb24gaXMgaWdub3JlZC5cblx0ICovXG5cdHNob3dCdXR0b246IGZ1bmN0aW9uKGJ1dHRvbklkKSB7XG5cdFx0aWYgKHRoaXMuaGFzQnV0dG9uKGJ1dHRvbklkKSkge1xuXHRcdFx0dGhpcy5idXR0b25zW2J1dHRvbklkXS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcblx0XHR9XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBNZW51SW50ZXJmYWNlOyIsIi8qKlxuICogTW9kYWwgY29udHJvbGxlciAtIGRpc3BsYXlzIGluZm9ybWF0aW9uIHdpdGggb3B0aW9uYWwgdXNlciBpbnB1dHNcbiAqIFJlcXVpcmVzIGFuIG92ZXJsYXlcbiAqL1xuXG52YXIgRW52aXJvbm1lbnQgPSByZXF1aXJlKCcuLi9lbnZpcm9ubWVudC5qcycpO1xuXG52YXIgTW9kYWwgPSB7fTtcbnZhciBub2RlcyA9IHtcblx0Ly8gbm9kZSBhdHRhY2hlZCB0byBhIHBhcmVudE5vZGUgb3IgbWFpbldpbmRvd1xuXHRyb290Tm9kZTogbnVsbCxcblxuXHQvLyBub2RlIHRoYXQgaG9sZHMgYWxsIG1vZGFsIG5vZGVzIGFuZCBjb21wb25lbnRzXG5cdC8vIGF0dGFjaGVkIHRvIHJvb3ROb2RlXG5cdGNvbnRhaW5lck5vZGU6IG51bGwsXG5cdG91dHB1dE5vZGU6IG51bGwsXG5cdGNvbXBvbmVudHM6IHtcblx0XHR0aXRsZTogbnVsbCxcblx0XHRib2R5OiBudWxsLFxuXHRcdGlucHV0czogW11cblx0fVxufTtcblxudmFyIGFsZXJ0VGltZW91dCA9IG51bGw7XG52YXIgaXNDcmVhdGVkID0gZmFsc2U7XG52YXIgbWFpbkRpdiA9IG51bGw7XG5cbnZhciBwYXJlbnROb2RlQ2FjaGUgPSB7fTtcblxuTW9kYWwuc2V0dGluZ3MgPSB7XG5cdGFsZXJ0RHVyYXRpb246IEVudmlyb25tZW50LmFsZXJ0RHVyYXRpb25cbn07XG5cbk1vZGFsLmNvbXBvbmVudHMgPSB7XG5cdHRpdGxlOiBudWxsLFxuXHRib2R5OiAnRW1wdHkgbW9kYWwuJyxcblx0aW5wdXRzOiBbXVxufTtcblxuLy8gdXBkYXRlIGNvbXBvbmVudHNcbk1vZGFsLnVwZGF0ZSA9IGZ1bmN0aW9uKCkge1xuXHRpZiAoTW9kYWwudGl0bGUpIHtcblx0XHRpZiAobm9kZXMuY29tcG9uZW50cy50aXRsZSkge1xuXHRcdFx0bm9kZXMuY29tcG9uZW50cy50aXRsZS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcblx0XHRcdG5vZGVzLmNvbXBvbmVudHMudGl0bGUuaW5uZXJIVE1MID0gTW9kYWwuY29tcG9uZW50cy50aXRsZTtcblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0bm9kZXMuY29tcG9uZW50cy50aXRsZS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuXHR9XG5cdGlmIChub2Rlcy5jb21wb25lbnRzLmJvZHkpIHtcblx0XHRub2Rlcy5jb21wb25lbnRzLmJvZHkuaW5uZXJIVE1MID0gTW9kYWwuY29tcG9uZW50cy5ib2R5O1xuXHR9XG5cdGlmIChNb2RhbC5pbnB1dHMubGVuZ3RoKSB7XG5cdFx0Ly8gVE9ET1xuXHR9XG59O1xuXG5Nb2RhbC5jcmVhdGUgPSBmdW5jdGlvbihJbnRlcmZhY2VzLCBFdmVudHMsIG1haW5XaW5kb3csIHBhcmVudE5vZGUpIHtcblx0Ly8gZ29lcyBvbiB0b3Agb2YgYmFja2dyb3VuZCwgc2ltdWxhdGVzIG92ZXJsYXkgbm9kZVxuXHQvLyBpbiBvcmRlciBmb3IgaXRzIGNoaWxkIG5vZGVzIHRvIGhhdmUgY29ycmVjdCByZWxhdGl2ZVxuXHQvLyBwb3NpdGlvbiB0byBhIGZ1bGwgYnJvd3NlciBwYWdlXG5cdG5vZGVzLnJvb3ROb2RlID0gSW50ZXJmYWNlcy5jb250cm9sbGVyLmNyZWF0ZURpdk5vZGUobWFpbldpbmRvdyk7XG5cdG5vZGVzLnJvb3ROb2RlLnN0eWxlLndpZHRoID0gJzEwMCUnO1xuXHRub2Rlcy5yb290Tm9kZS5zdHlsZS5oZWlnaHQgPSAnMTAwJSc7XG5cdG5vZGVzLnJvb3ROb2RlLnN0eWxlLnBvc2l0aW9uID0gJ2ZpeGVkJztcblx0bm9kZXMucm9vdE5vZGUuc3R5bGUubGVmdCA9IDA7XG5cdG5vZGVzLnJvb3ROb2RlLnN0eWxlLnRvcCA9IDA7XG5cdG5vZGVzLnJvb3ROb2RlLnN0eWxlLnpJbmRleCA9IDEwMDA7XG5cblx0Ly8gbWFpbiBzdWItY29udGFpbmVyIGZvciBpbnB1dHMgLyB0ZXh0XG5cdG5vZGVzLmNvbnRhaW5lck5vZGUgPSBJbnRlcmZhY2VzLmNvbnRyb2xsZXIuY3JlYXRlRGl2Tm9kZShtYWluV2luZG93KTtcblx0bm9kZXMuY29udGFpbmVyTm9kZS5jbGFzc05hbWUgPSAnUGljdHJlLXBhc3Njb2RlLXdyYXBwZXInO1xuXG5cdC8vIHdyYXBwZWQgYnkgY29udGFpbmVyTm9kZS4gV3JhcHMgY29udGVudC1cblx0Ly8gY29udGFpbmluZyBlbGVtZW50cyBzdWNoIGFzIGRpdnMsIHBhcmFncmFwaHMsIGV0Yy5cblx0dmFyIGNvbnRhaW5lck5vZGVDb250ZW50V3JhcHBlciA9IEludGVyZmFjZXMuY29udHJvbGxlci5jcmVhdGVEaXZOb2RlKG1haW5XaW5kb3cpO1xuXHRjb250YWluZXJOb2RlQ29udGVudFdyYXBwZXIuY2xhc3NOYW1lID0gJ1BpY3RyZS1wYXNzY29kZS1pbnB1dC13cmFwcGVyJztcblxuXHQvLyB3cmFwcGVkIGJ5IGNvbnRhaW5lck5vZGVDb250ZW50V3JhcHBlci5cblx0Ly8gbWFpbiB0ZXh0IHZpZXcgZm9yIHNwbGFzaCBcIm1vZGFsXCJcblx0dmFyIGNvbnRhaW5lck5vZGVDb250ZW50V3JhcHBlclRleHRDb250ZW50ID0gSW50ZXJmYWNlcy5jb250cm9sbGVyLmNyZWF0ZURpdk5vZGUobWFpbldpbmRvdyk7XG5cdGNvbnRhaW5lck5vZGVDb250ZW50V3JhcHBlclRleHRDb250ZW50LmNsYXNzTmFtZSA9ICdQaWN0cmUtcGFzc2NvZGUtcCc7XG5cdGNvbnRhaW5lck5vZGVDb250ZW50V3JhcHBlclRleHRDb250ZW50LnN0eWxlLmZvbnRTaXplID0gXCIwLjg1ZW1cIjtcblx0Y29udGFpbmVyTm9kZUNvbnRlbnRXcmFwcGVyVGV4dENvbnRlbnQuaW5uZXJIVE1MID0gJyc7XG5cblx0Ly8gcmVzZXQgaW5wdXRzXG5cdG5vZGVzLmNvbXBvbmVudHMuaW5wdXRzID0gW107XG5cblx0bm9kZXMuY29tcG9uZW50cy50aXRsZSA9IEludGVyZmFjZXMuY29udHJvbGxlci5jcmVhdGVOb2RlKG1haW5XaW5kb3csICdiJyk7XG5cdG5vZGVzLmNvbXBvbmVudHMudGl0bGUuY2xhc3NOYW1lID0gJ2JyYW5kJztcblx0bm9kZXMuY29tcG9uZW50cy50aXRsZS5zdHlsZS53aWR0aCA9ICcxMDAlJztcblx0bm9kZXMuY29tcG9uZW50cy50aXRsZS5zdHlsZS50ZXh0QWxpZ24gPSAnY2VudGVyJztcblx0bm9kZXMuY29tcG9uZW50cy50aXRsZS5zdHlsZS5mb250U2l6ZSA9ICcyLjJlbSc7XG5cdG5vZGVzLmNvbXBvbmVudHMudGl0bGUuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG5cdG5vZGVzLmNvbXBvbmVudHMudGl0bGUuc3R5bGUubWFyZ2luQm90dG9tID0gJzEwcHgnO1xuXG5cdC8vIG9ubHkgZGlzcGxheSB0aXRsZSBpZiBzZXRcblx0aWYgKE1vZGFsLmNvbXBvbmVudHMudGl0bGUpIHtcblx0XHRub2Rlcy5jb21wb25lbnRzLnRpdGxlLmlubmVySFRNTCA9IE1vZGFsLmNvbXBvbmVudHMudGl0bGU7XG5cdH1cblxuXHRub2Rlcy5jb21wb25lbnRzLmJvZHkgPSBJbnRlcmZhY2VzLmNvbnRyb2xsZXIuY3JlYXRlRGl2Tm9kZShtYWluV2luZG93KTtcblx0bm9kZXMuY29tcG9uZW50cy5ib2R5LmlubmVySFRNTCA9IE1vZGFsLmNvbXBvbmVudHMuYm9keTtcblxuXHQvLyB3cmFwcGVkIGJ5IGNvbnRhaW5lck5vZGVDb250ZW50V3JhcHBlclxuXHQvLyBkaXNwbGF5IGFsZXJ0cyBvciBvdXRwdXQgdGV4dFxuXHRub2Rlcy5vdXRwdXROb2RlID0gSW50ZXJmYWNlcy5jb250cm9sbGVyLmNyZWF0ZURpdk5vZGUobWFpbldpbmRvdyk7XG5cdG5vZGVzLm91dHB1dE5vZGUuY2xhc3NOYW1lID0gJ1BpY3RyZS1wYXNzY29kZS1wIFBpY3RyZS1wYXNzY29kZS1mb3JtYWwtZm9udCc7XG5cdG5vZGVzLm91dHB1dE5vZGUuc3R5bGUuZm9udFNpemUgPSAnMC44NWVtJztcblx0bm9kZXMub3V0cHV0Tm9kZS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuXG5cdC8vIGNyZWF0ZSBub2RlIHRyZWVcblx0Y29udGFpbmVyTm9kZUNvbnRlbnRXcmFwcGVyVGV4dENvbnRlbnQuYXBwZW5kQ2hpbGQobm9kZXMuY29tcG9uZW50cy50aXRsZSk7XG5cdGNvbnRhaW5lck5vZGVDb250ZW50V3JhcHBlclRleHRDb250ZW50LmFwcGVuZENoaWxkKG5vZGVzLmNvbXBvbmVudHMuYm9keSk7XG5cdGNvbnRhaW5lck5vZGVDb250ZW50V3JhcHBlci5hcHBlbmRDaGlsZChjb250YWluZXJOb2RlQ29udGVudFdyYXBwZXJUZXh0Q29udGVudCk7XG5cdGNvbnRhaW5lck5vZGVDb250ZW50V3JhcHBlci5hcHBlbmRDaGlsZChub2Rlcy5vdXRwdXROb2RlKTtcblx0aWYgKE1vZGFsLmNvbXBvbmVudHMuaW5wdXRzLmxlbmd0aCkge1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgTW9kYWwuY29tcG9uZW50cy5pbnB1dHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdG5vZGVzLmNvbXBvbmVudHMuaW5wdXRzLnB1c2goTW9kYWwuY29tcG9uZW50cy5pbnB1dHNbaV0pO1xuXHRcdFx0Y29udGFpbmVyTm9kZUNvbnRlbnRXcmFwcGVyLmFwcGVuZENoaWxkKG5vZGVzLmNvbXBvbmVudHMuaW5wdXRzW2ldKTtcblx0XHR9XG5cdH1cblx0bm9kZXMuY29udGFpbmVyTm9kZS5hcHBlbmRDaGlsZChjb250YWluZXJOb2RlQ29udGVudFdyYXBwZXIpO1xuXHRub2Rlcy5yb290Tm9kZS5hcHBlbmRDaGlsZChub2Rlcy5jb250YWluZXJOb2RlKTtcblx0cGFyZW50Tm9kZS5hcHBlbmRDaGlsZChub2Rlcy5yb290Tm9kZSk7XG5cblx0Ly8gaW5pdCBzcGxhc2ggbm9kZSBldmVudHMgYW5kIGFkanVzdCBwb3NpdGlvbnNcblx0RXZlbnRzLm5vd0FuZE9uTm9kZUV2ZW50KG1haW5XaW5kb3csICdyZXNpemUnLCBmdW5jdGlvbihlKSB7XG5cdFx0SW50ZXJmYWNlcy5jb250cm9sbGVyLmNlbnRlck5vZGVSZWxhdGl2ZVRvKG5vZGVzLmNvbnRhaW5lck5vZGUsIG1haW5XaW5kb3cpO1xuXHR9KTtcbn07XG5cbi8qKlxuICogRGlzcGxheXMgb3IgY3JlYXRlcyB0aGUgbW9kYWwsIHRoZW4gZGlzcGxheXMuXG4gKiByZWNlaXZlcyBhbiBvcHRpb25hbCBhcnJheSBvZiBpbnB1dHMgdG8gZGlzcGxheVxuICovXG5Nb2RhbC5zaG93ID0gZnVuY3Rpb24oSW50ZXJmYWNlcywgRXZlbnRzLCBtYWluV2luZG93LCBwYXJlbnROb2RlLCBpbnB1dHNBcnJheSkge1xuXHRpZiAoIWlzQ3JlYXRlZCkge1xuXHRcdGlzQ3JlYXRlZCA9IHRydWU7XG5cdFx0TW9kYWwuY3JlYXRlKEludGVyZmFjZXMsIEV2ZW50cywgbWFpbldpbmRvdywgcGFyZW50Tm9kZSk7XG5cdH0gZWxzZSB7XG5cdFx0TW9kYWwudXBkYXRlKCk7XG5cdFx0SW50ZXJmYWNlcy5jb250cm9sbGVyLmNlbnRlck5vZGVSZWxhdGl2ZVRvKG5vZGVzLmNvbnRhaW5lck5vZGUsIG1haW5XaW5kb3cpO1xuXHR9XG5cblx0Ly8gYXNzdW1lcyByb290Tm9kZSBleGlzdHNcblx0aWYgKCFwYXJlbnROb2RlQ2FjaGVbcGFyZW50Tm9kZS5ub2RlTmFtZV0pIHtcblx0XHRwYXJlbnROb2RlQ2FjaGVbcGFyZW50Tm9kZS5ub2RlTmFtZV0gPSBwYXJlbnROb2RlO1xuXHRcdHJldHVybjtcblx0fVxuXHRub2Rlcy5yb290Tm9kZS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbn07XG5cbk1vZGFsLmhpZGUgPSBmdW5jdGlvbihwYXJlbnROb2RlKSB7XG5cdGlmICghaXNDcmVhdGVkKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdGlmICghcGFyZW50Tm9kZUNhY2hlW3BhcmVudE5vZGUubm9kZU5hbWVdKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdG5vZGVzLnJvb3ROb2RlLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG59O1xuXG5Nb2RhbC5zZXRUaXRsZSA9IGZ1bmN0aW9uKHRpdGxlKSB7XG5cdE1vZGFsLmNvbXBvbmVudHMudGl0bGUgPSB0aXRsZTtcbn07XG5cbk1vZGFsLnNldEJvZHkgPSBmdW5jdGlvbihib2R5KSB7XG5cdE1vZGFsLmNvbXBvbmVudHMuYm9keSA9IGJvZHk7XG59O1xuXG5Nb2RhbC5zZXRJbnB1dHMgPSBmdW5jdGlvbihpbnB1dHNBcnJheSkge1xuXHRpZiAoaW5wdXRzQXJyYXkgaW5zdGFuY2VvZiBBcnJheSkge1xuXHRcdE1vZGFsLmNvbXBvbmVudHMuaW5wdXRzID0gaW5wdXRzQXJyYXk7XG5cdH1cbn07XG5cbk1vZGFsLmFkZElucHV0ID0gZnVuY3Rpb24oaW5wdXQpIHtcblx0TW9kYWwuY29tcG9uZW50cy5pbnB1dHMucHVzaChpbnB1dCk7XG59O1xuXG5Nb2RhbC5zaG93QWxlcnQgPSBmdW5jdGlvbih0ZXh0LCB0aW1lb3V0KSB7XG5cdGlmICghbm9kZXMub3V0cHV0Tm9kZSkge1xuXHRcdHJldHVybiBjb25zb2xlLmxvZygnTU9EQUwgQUxFUlQnLCAnRXJyb3IgZGlzcGxheWluZyBhbGVydCwgbm8gb3V0cHV0Tm9kZSBoYXMgYmVlbiBjcmVhdGVkOyBcInNob3dcIiB0aGUgbm9kZSBmaXJzdC4nKTtcblx0fVxuXG5cdG5vZGVzLm91dHB1dE5vZGUuaW5uZXJIVE1MID0gdGV4dDtcblx0bm9kZXMub3V0cHV0Tm9kZS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcblxuXHRpZiAoIXRpbWVvdXQpIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRjbGVhclRpbWVvdXQoYWxlcnRUaW1lb3V0KTtcblx0YWxlcnRUaW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHRub2Rlcy5vdXRwdXROb2RlLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG5cdH0sIHRpbWVvdXQpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBNb2RhbDsiLCIvKipcbiAqIE92ZXJsYXkgaW50ZXJmYWNlXG4gKi9cblxudmFyIE92ZXJsYXkgPSB7fTtcblxudmFyIGlzTG9ja2VkID0gZmFsc2U7XG52YXIgaXRlcmF0b3IgPSAwO1xudmFyIGNvbW1lbnRzID0gbnVsbDtcbnZhciBkb21FbGVtZW50ID0gbnVsbDtcbnZhciBmZWF0dXJlZEltYWdlID0gbnVsbDtcblxudmFyIGNhbGxiYWNrcyA9IHt9O1xudmFyIG5vZGVzID0ge1xuXHRvdmVybGF5OiBudWxsXG59O1xuXG52YXIgaXNDcmVhdGVkID0gZmFsc2U7XG5cbk92ZXJsYXkuaXNMb2NrZWQgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIGlzTG9ja2VkO1xufVxuXG5PdmVybGF5LmNyZWF0ZSA9IGZ1bmN0aW9uKG1haW5XaW5kb3cpIHtcblx0aXNDcmVhdGVkID0gdHJ1ZTtcblxuXHRub2Rlcy5vdmVybGF5ID0gbWFpbldpbmRvdy5kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblx0bm9kZXMub3ZlcmxheS5jbGFzc05hbWUgPSAnUGljdHJlLW92ZXJsYXknO1xuXHRub2Rlcy5vdmVybGF5LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG5cdG5vZGVzLm92ZXJsYXkuc3R5bGUuekluZGV4ID0gOTk5O1xuXHRtYWluV2luZG93LmRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQobm9kZXMub3ZlcmxheSk7XG59O1xuXG5PdmVybGF5LnNob3cgPSBmdW5jdGlvbihtYWluV2luZG93KSB7XG5cdGlmICghaXNDcmVhdGVkKSB7XG5cdFx0T3ZlcmxheS5jcmVhdGUobWFpbldpbmRvdyk7XG5cdH1cblxuXHQkKG5vZGVzLm92ZXJsYXkpLmZhZGVJbig2MDApO1xufVxuXG5PdmVybGF5LmxvY2sgPSBmdW5jdGlvbigpIHtcblx0aXNMb2NrZWQgPSB0cnVlO1xufTtcblxuT3ZlcmxheS51bmxvY2sgPSBmdW5jdGlvbigpIHtcblx0aXNMb2NrZWQgPSBmYWxzZTtcbn07XG5cbk92ZXJsYXkuaGlkZSA9IGZ1bmN0aW9uKG1haW5XaW5kb3cpIHtcblx0aWYgKCFub2Rlcy5vdmVybGF5KSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0JChub2Rlcy5vdmVybGF5KS5mYWRlT3V0KDYwMCk7XG59XG5cbk92ZXJsYXkuZ2V0RmVhdHVyZWRJbWFnZSA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gZmVhdHVyZWRJbWFnZTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gT3ZlcmxheTsiLCIvKipcbiAqIFNwbGFzaCBpbnRlcmZhY2UgY29udHJvbGxlciBmb3IgZGlzcGxheWluZ1xuICogdGhlIG1haW4gKGZyb250KSB2aWV3IG9mIHRoZSBhcHAuXG4gKi9cblxudmFyIFNwbGFzaEludGVyZmFjZSA9IHt9O1xuXG5ub2RlcyA9IHtcblx0Ly8gaG9sZHMgXCJzcGxhc2hcIiB2aWV3J3MgYmFja2dyb3VuZFxuXHRyb290Tm9kZTogbnVsbCxcblx0aW5wdXROb2RlOiBudWxsXG59O1xuXG5TcGxhc2hJbnRlcmZhY2Uuc2V0dGluZ3MgPSB7XG5cdGFsZXJ0VGltZW91dDogMTAwMDBcbn07XG5cbnZhciBpc0NyZWF0ZWQgPSBmYWxzZTtcbnZhciBwYXJlbnROb2RlQ2FjaGUgPSB7fTtcblxuU3BsYXNoSW50ZXJmYWNlLnNob3dBbGVydCA9IGZ1bmN0aW9uKEludGVyZmFjZXMsIHRleHQpIHtcblx0SW50ZXJmYWNlcy5tb2RhbC5zaG93QWxlcnQodGV4dCk7XG59O1xuXG5TcGxhc2hJbnRlcmZhY2Uuc2hvd0FsZXJ0V2l0aFRpbWVvdXQgPSBmdW5jdGlvbihJbnRlcmZhY2VzLCB0ZXh0LCB0aW1lb3V0KSB7XG5cdEludGVyZmFjZXMubW9kYWwuc2hvd0FsZXJ0KHRleHQsIHRpbWVvdXQgfHwgU3BsYXNoSW50ZXJmYWNlLnNldHRpbmdzLmFsZXJ0VGltZW91dCk7XG59O1xuXG5TcGxhc2hJbnRlcmZhY2UuYXR0YWNoSW5wdXRzID0gZnVuY3Rpb24oSW50ZXJmYWNlcywgRXZlbnRzLCBDbGllbnQsIG1haW5XaW5kb3cpIHtcblx0aWYgKG5vZGVzLmlucHV0Tm9kZSkge1xuXHRcdEludGVyZmFjZXMubW9kYWwuc2V0SW5wdXRzKFtcblx0XHRcdG5vZGVzLmlucHV0Tm9kZS5nZXROb2RlKClcblx0XHRdKTtcblx0XHRyZXR1cm4gbnVsbDtcblx0fVxuXG5cdG5vZGVzLmlucHV0Tm9kZSA9IEludGVyZmFjZXMuY29udHJvbGxlci5uZXdJbnB1dE5vZGUoRXZlbnRzLCBtYWluV2luZG93KTtcblx0bm9kZXMuaW5wdXROb2RlLnNldFN0eWxlKCdjb2xvcicsICd3aGl0ZScpO1xuXHRub2Rlcy5pbnB1dE5vZGUuc2V0QXR0cmlidXRlKCdtYXhsZW5ndGgnLCAxMDApO1xuXHRub2Rlcy5pbnB1dE5vZGUuc2V0UGxhY2Vob2xkZXIoJ0VudGVyIGFuIGFsYnVtIG5hbWUnKTtcblxuXHRpZiAoQ2xpZW50LmlzSUUoKSB8fCBDbGllbnQuaXNNb2JpbGVTYWZhcmkoKSB8fCBDbGllbnQuaXNTYWZhcmkoJzUuMScpKSB7XG5cdFx0bm9kZXMuaW5wdXROb2RlLnNldEF0dHJpYnV0ZSgnbm9mb2N1cycsIHRydWUpO1xuXHRcdG5vZGVzLmlucHV0Tm9kZS5zZXRBdHRyaWJ1dGUoJ3ZhbHVlJywgdmFsdWUpO1xuXG5cdFx0bm9kZXMuaW5wdXROb2RlLm9uKCdibHVyJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0aWYgKHRoaXMubm9kZS52YWx1ZSA9PSBcIlwiICYmIHRoaXMudmFsdWUgIT0gJycpIHtcblx0XHRcdFx0dGhpcy5ub2RlLnZhbHVlID0gdGhpcy52YWx1ZTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxuXG5cdEV2ZW50cy5vbk5vZGVFdmVudChub2Rlcy5pbnB1dE5vZGUuZ2V0Tm9kZSgpLCAna2V5ZG93bicsIGZ1bmN0aW9uKGUpIHtcblx0XHRpZiAoIWUgfHwgZS5rZXlDb2RlICE9IDEzKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0aWYgKCF0aGlzLmlzVmFsdWVFbXB0eSgpKSB7XG5cdFx0XHR2YXIgdmFsdWUgPSB0aGlzLmdldEVzY2FwZWRWYWx1ZSgpO1xuXHRcdFx0aWYgKCFJbnRlcmZhY2VzLmJvYXJkLmlzTmFtZVJlc3RyaWN0ZWQodmFsdWUpKSB7XG5cdFx0XHRcdGlmIChJbnRlcmZhY2VzLmJvYXJkLmlzTmFtZUludmFsaWQodmFsdWUpKSB7XG5cdFx0XHRcdFx0aWYgKEludGVyZmFjZXMuYm9hcmQuaXNOYW1lV2l0aFNwYWNlcyh2YWx1ZSkpIHtcblx0XHRcdFx0XHRcdFNwbGFzaEludGVyZmFjZS5zaG93QWxlcnRXaXRoVGltZW91dChJbnRlcmZhY2VzLCBcIllvdXIgYWxidW0gbmFtZSBjYW5ub3QgY29udGFpbiBzcGFjZXMuXCIpO1xuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRTcGxhc2hJbnRlcmZhY2Uuc2hvd0FsZXJ0V2l0aFRpbWVvdXQoSW50ZXJmYWNlcywgXCJZb3VyIGFsYnVtIG5hbWUgY29udGFpbnMgaW52YWxpZCBjaGFyYWN0ZXJzLlwiKTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblx0XHRcdFx0bWFpbldpbmRvdy5sb2NhdGlvbi5hc3NpZ24odmFsdWUpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhpcy5zZXRWYWx1ZSgnJyk7XG5cdFx0XHRcdFNwbGFzaEludGVyZmFjZS5zaG93QWxlcnRXaXRoVGltZW91dChJbnRlcmZhY2VzLCBcIlRoYXQgYWxidW0gaXMgcmVzdHJpY3RlZCwgcGxlYXNlIHRyeSBhbm90aGVyLlwiKTtcblx0XHRcdH1cblx0XHR9XG5cdH0uYmluZChub2Rlcy5pbnB1dE5vZGUpKTtcblxuXHRJbnRlcmZhY2VzLm1vZGFsLnNldElucHV0cyhbXG5cdFx0bm9kZXMuaW5wdXROb2RlLmdldE5vZGUoKVxuXHRdKTtcblxuXHRyZXR1cm4gbnVsbDtcbn07XG5cblNwbGFzaEludGVyZmFjZS5zaG93ID0gZnVuY3Rpb24oSW50ZXJmYWNlcywgRXZlbnRzLCBDbGllbnQsIG1haW5XaW5kb3csIHBhcmVudE5vZGUpIHtcblx0aWYgKCFpc0NyZWF0ZWQpIHtcblx0XHRpc0NyZWF0ZWQgPSB0cnVlO1xuXHRcdG5vZGVzLnJvb3ROb2RlID0gSW50ZXJmYWNlcy5jb250cm9sbGVyLmNyZWF0ZURpdk5vZGUobWFpbldpbmRvdyk7XG5cdFx0bm9kZXMucm9vdE5vZGUuY2xhc3NOYW1lID0gJ1BpY3RyZS1zcGxhc2gtd3JhcHBlcic7XG5cdFx0bm9kZXMucm9vdE5vZGUuc3R5bGUuekluZGV4ID0gOTk4O1xuXHR9XG5cdGlmICghcGFyZW50Tm9kZUNhY2hlW3BhcmVudE5vZGUubm9kZU5hbWVdKSB7XG5cdFx0cGFyZW50Tm9kZUNhY2hlW3BhcmVudE5vZGUubm9kZU5hbWVdID0gcGFyZW50Tm9kZTtcblx0XHRwYXJlbnROb2RlLmFwcGVuZENoaWxkKG5vZGVzLnJvb3ROb2RlKTtcblx0fVxuXG5cdC8vIHNldCB0aGVzZSBwcm9wZXJ0aWVzIGV2ZXJ5IHRpbWUsIGluIGNhc2UgbW9kYWwgZ2V0cyB1c2VkIGJ5XG5cdC8vIGFub3RoZXIgYXBwbGljYXRpb24gY29tcG9uZW50IHdpdGggZGlmZmVyZW50IHZhbHVlc1xuXHRJbnRlcmZhY2VzLm1vZGFsLnNldFRpdGxlKCdQaWN0cmUnKTtcblx0SW50ZXJmYWNlcy5tb2RhbC5zZXRCb2R5KFwiPGIgY2xhc3M9J2JyYW5kJz5QaWN0cmU8L2I+IDxzcGFuPmlzIGEgY29sbGVjdGlvbiBvZiBjbG91ZCBwaG90byBhbGJ1bXMuIFlvdSBjYW4gdmlldyBvciBjcmVhdGUgcGljdHVyZSBhbGJ1bXMgYmFzZWQgb24gaW50ZXJlc3RzLCBwZW9wbGUsIG9yIGZhbWlsaWVzLiA8L3NwYW4+XCIgK1xuXHRcdFwiPHNwYW4+VG8gZ2V0IHN0YXJ0ZWQsIHNpbXBseSB0eXBlIGFuIGFsYnVtIG5hbWUgYmVsb3cuPC9zcGFuPlwiKTtcblxuXHR2YXIgYWxidW1JbnB1dCA9IEludGVyZmFjZXMuY29udHJvbGxlci5jcmVhdGVOb2RlKG1haW5XaW5kb3csICdpbnB1dCcpO1xuXHRhbGJ1bUlucHV0Lm1heGxlbmd0aCA9IDEwMDtcblx0YWxidW1JbnB1dC5jbGFzc05hbWUgPSAnUGljdHJlLXBhc3Njb2RlLWlucHV0Jztcblx0YWxidW1JbnB1dC50eXBlID0gJ3RleHQ7J1xuXHRhbGJ1bUlucHV0LnBsYWNlaG9sZGVyID0gJ0VudGVyIGFuIGFsYnVtIG5hbWUnO1xuXHRhbGJ1bUlucHV0LnN0eWxlLmNvbG9yID0gJ3doaXRlJztcblxuXHRTcGxhc2hJbnRlcmZhY2UuYXR0YWNoSW5wdXRzKEludGVyZmFjZXMsIEV2ZW50cywgQ2xpZW50LCBtYWluV2luZG93KTtcblxuXHRJbnRlcmZhY2VzLm92ZXJsYXkuc2hvdyhtYWluV2luZG93KTtcblx0SW50ZXJmYWNlcy5tb2RhbC5zaG93KEludGVyZmFjZXMsIEV2ZW50cywgbWFpbldpbmRvdywgcGFyZW50Tm9kZSk7XG5cblx0SW50ZXJmYWNlcy5jb250cm9sbGVyLnNldE5vZGVPdmVyZmxvd0hpZGRlbihtYWluV2luZG93LmRvY3VtZW50LmJvZHkpO1xuXHRJbnRlcmZhY2VzLm92ZXJsYXkubG9jaygpO1xuXG5cdG5vZGVzLmlucHV0Tm9kZS5nZXROb2RlKCkuZm9jdXMoKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTcGxhc2hJbnRlcmZhY2U7IiwiLyoqXG4gKiBXYXJuaW5nIGludGVyZmFjZS4gRGlzcGxheXMgZXJyb3JzLCB3YXJuaW5ncywgZGlhbG9ndWVzLlxuICovXG5cbnZhciBXYXJuaW5nSW50ZXJmYWNlID0ge1xuXG5cdGRvbUVsZW1lbnQ6IG51bGwsXG5cdHJlc3BvbnNlOiBudWxsLFxuXG5cdC8qKlxuXHQgKiBDcmVhdGVzIGFuZCBkaXNwbGF5cyB3YXJuaW5nIGludGVyZmFjZS5cblx0ICogQHBhcmFtIHByb3BlcnRpZXMgW29iamVjdF0gY29udGFpbmluZyBpbnRlcmZhY2Ugc2V0dGluZ3MgdG8gb3ZlcnJpZGVcblx0ICpcblx0ICovXG5cdHB1dDogZnVuY3Rpb24ocHJvcGVydGllcykge1xuXG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdFx0dmFyIHNldHRpbmdzID0ge1xuXG5cdFx0XHRib2R5OiAnQW4gZXJyb3IgaGFzIG9jY3VycmVkLCBkb25cXCd0IHdvcnJ5IHRob3VnaCwgaXRcXCdzIG5vdCB5b3VyIGZhdWx0IScsXG5cdFx0XHRkcm9wem9uZTogZmFsc2UsXG5cdFx0XHRoZWFkZXI6ICdIZXkhJyxcblx0XHRcdGljb246IG51bGwsXG5cdFx0XHRsb2NrZWQ6IGZhbHNlLFxuXHRcdFx0c3R5bGU6IHRydWUsXG5cdFx0XHRtb2RhbDogdHJ1ZVxuXG5cdFx0fTtcblxuXHRcdGlmIChwcm9wZXJ0aWVzKSB7XG5cblx0XHRcdGZvciAodmFyIGkgaW4gcHJvcGVydGllcykge1xuXHRcdFx0XHRzZXR0aW5nc1tpXSA9IHByb3BlcnRpZXNbaV07XG5cdFx0XHR9XG5cblx0XHR9XG5cblx0XHRpZiAoIXNldHRpbmdzLm1vZGFsKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8vLy0tLVxuXHRcdGlmIChQaWN0cmUuZ2FsbGVyeS5pcy5mZWF0dXJpbmcgJiYgc2V0dGluZ3MubG9ja2VkKSB7XG5cdFx0XHRQaWN0cmUuX3N0b3JhZ2Uub3ZlcmxheS5sb2NrZWQgPSBmYWxzZTtcblx0XHRcdFBpY3RyZS5nYWxsZXJ5Lm92ZXJsYXkuZXhpdCgpO1xuXHRcdH1cblxuXHRcdHRoaXMuZG9tRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG5cdFx0dGhpcy5kb21FbGVtZW50LmNsYXNzTmFtZSA9IFwiUGljdHJlLXVwbG9hZCBQaWN0cmUtd2FybmluZ1wiO1xuXG5cdFx0UGljdHJlLmdhbGxlcnkuaXMud2FybmluZyA9IHRydWU7XG5cblx0XHRQaWN0cmUuZXh0ZW5kKFBpY3RyZS5nYWxsZXJ5Lm92ZXJsYXkucHV0KCkuYXBwZW5kQ2hpbGQodGhpcy5kb21FbGVtZW50KSkub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHR9KTtcblxuXHRcdHRoaXMucG9zaXRpb24oKTtcblxuXHRcdFBpY3RyZS5ldmVudHMub24oJ3Jlc2l6ZScsIGZ1bmN0aW9uKCkge1xuXHRcdFx0c2VsZi5wb3NpdGlvbigpO1xuXHRcdH0pO1xuXG5cdFx0dmFyIGhlYWRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG5cdFx0aGVhZGVyLmNsYXNzTmFtZSA9IFwiUGljdHJlLXVwbG9hZC1oZWFkZXJcIjtcblx0XHRoZWFkZXIuaW5uZXJIVE1MID0gc2V0dGluZ3MuaGVhZGVyO1xuXHRcdGhlYWRlci5zdHlsZS56SW5kZXggPSBcIjk5OVwiO1xuXG5cdFx0dmFyIHAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwicFwiKTtcblx0XHRwLmNsYXNzTmFtZSA9IFwiUGljdHJlLXdhcm5pbmctcFwiO1xuXHRcdHAuaW5uZXJIVE1MID0gc2V0dGluZ3MuYm9keSB8fCBcIlVudGl0bGVkIHRleHRcIjtcblxuXHRcdHRoaXMuZG9tRWxlbWVudC5hcHBlbmRDaGlsZChoZWFkZXIpO1xuXG5cdFx0aWYgKHNldHRpbmdzLmRyb3B6b25lKSB7XG5cdFx0XHR2YXIgc2hhZGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblx0XHRcdHNoYWRlci5jbGFzc05hbWUgPSBcIlBpY3RyZS11cGxvYWQtYXJlYS1zaGFkZXJcIjtcblx0XHRcdHNoYWRlci5hcHBlbmRDaGlsZChwKTtcblx0XHRcdHZhciBhcmVhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblx0XHRcdGFyZWEuY2xhc3NOYW1lID0gXCJQaWN0cmUtdXBsb2FkLWFyZWFcIjtcblx0XHRcdGFyZWEuYXBwZW5kQ2hpbGQoc2hhZGVyKTtcblx0XHRcdHRoaXMuZG9tRWxlbWVudC5hcHBlbmRDaGlsZChhcmVhKTtcblx0XHRcdGFyZWEuc3R5bGUubWFyZ2luTGVmdCA9ICgtYXJlYS5jbGllbnRXaWR0aCAvIDIpICsgXCJweFwiO1xuXHRcdFx0YXJlYS5zdHlsZS5tYXJnaW5Ub3AgPSAoLWFyZWEuY2xpZW50SGVpZ2h0IC8gMiArIDIwKSArIFwicHhcIjtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gbm90IHVwbG9hZCBpbnRlcmZhY2UsIHdhcm5pbmcgdWkgaW5zdGVhZFxuXHRcdFx0dGhpcy5kb21FbGVtZW50LmFwcGVuZENoaWxkKHApO1xuXHRcdFx0cC5zdHlsZS5tYXJnaW5Ub3AgPSAoKHRoaXMuZG9tRWxlbWVudC5jbGllbnRIZWlnaHQgLSBoZWFkZXIuY2xpZW50SGVpZ2h0KSAvIDIgLSAocC5jbGllbnRIZWlnaHQgLyAyKSkgKyBcInB4XCI7XG5cblx0XHRcdGhlYWRlci5zdHlsZS50b3AgPSAoLXAuY2xpZW50SGVpZ2h0KSArICdweCc7XG5cdFx0fVxuXG5cdFx0aWYgKHNldHRpbmdzLmljb24pIHtcblxuXHRcdFx0dmFyIGljb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW1nXCIpO1xuXHRcdFx0aWNvbi5zcmMgPSBzZXR0aW5ncy5pY29uO1xuXHRcdFx0aWNvbi5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiO1xuXHRcdFx0aWNvbi5zdHlsZS5tYXJnaW4gPSBcIjIwcHggYXV0byAwIGF1dG9cIjtcblxuXHRcdFx0cC5hcHBlbmRDaGlsZChpY29uKTtcblxuXHRcdH1cblxuXHRcdGlmIChzZXR0aW5ncy5sb2NrZWQpIHtcblx0XHRcdFBpY3RyZS5fc3RvcmFnZS5vdmVybGF5LmxvY2tlZCA9IHRydWU7XG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiB0aGlzLm9uY2xpY2sgPT0gJ2Z1bmN0aW9uJykge1xuXG5cdFx0XHRpZiAoc2V0dGluZ3MuZHJvcHpvbmUpIHtcblxuXHRcdFx0XHRQaWN0cmUuZXh0ZW5kKGFyZWEpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHNlbGYub25jbGljaygpO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0fSBlbHNlIHtcblxuXHRcdFx0XHRQaWN0cmUuZXh0ZW5kKHRoaXMuZG9tRWxlbWVudCkub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0c2VsZi5vbmNsaWNrKCk7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHR9XG5cblx0XHR9XG5cdH0sXG5cblx0b25jbGljazogbnVsbCxcblxuXHRwb3NpdGlvbjogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKHRoaXMuZG9tRWxlbWVudCkge1xuXHRcdFx0dGhpcy5kb21FbGVtZW50LnN0eWxlLmxlZnQgPSBNYXRoLm1heCgkKHdpbmRvdykud2lkdGgoKSAvIDIgLSAodGhpcy5kb21FbGVtZW50LmNsaWVudFdpZHRoIC8gMiksIDApICsgXCJweFwiO1xuXHRcdFx0dGhpcy5kb21FbGVtZW50LnN0eWxlLnRvcCA9IE1hdGgubWF4KCgkKHdpbmRvdykuaGVpZ2h0KCkgLyAyIC0gKHRoaXMuZG9tRWxlbWVudC5jbGllbnRIZWlnaHQgLyAyKSksIDApICsgXCJweFwiO1xuXHRcdH1cblx0fSxcblxuXHRyZW1vdmU6IGZ1bmN0aW9uKCkge1xuXHRcdFBpY3RyZS5nYWxsZXJ5LmlzLndhcm5pbmcgPSBmYWxzZTtcblx0XHRQaWN0cmUuZ2FsbGVyeS5vdmVybGF5LmV4aXQoKTtcblx0XHR0aGlzLmRvbUVsZW1lbnQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLmRvbUVsZW1lbnQpO1xuXHRcdHRoaXMuZG9tRWxlbWVudCA9IG51bGw7XG5cdH1cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFdhcm5pbmdJbnRlcmZhY2U7IiwiLyoqXG4gKiBQaWN0dXJlIG9iamVjdCBtb2R1bGUuIEFkZHMgUGljdHVyZSBwcm9wZXJ0aWVzIGFuZCBldmVudCBsaXN0ZW5lcnMuXG4gKiBAaW5zdGFuY2VkIG1vZHVsZVxuICpcbiAqIEBhdXRob3IganVhbnZhbGxlam9cbiAqIEBkYXRlIDgvMjEvMTZcbiAqL1xuXG52YXIgSW1nID0gcmVxdWlyZSgnLi9pbWFnZS5qcycpO1xudmFyIHBpY3R1cmVfaW5uZXJfdGV4dCA9ICdMb2FkaW5nLi4uJztcblxuZnVuY3Rpb24gUGljdHVyZShJbnRlcmZhY2VzLCBFdmVudHMsIG1haW5XaW5kb3cpIHtcblx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdHRoaXMubm9kZSA9IEludGVyZmFjZXMuY29udHJvbGxlci5jcmVhdGVEaXZOb2RlKG1haW5XaW5kb3cpO1xuXHR0aGlzLm5vZGUuaW5uZXJIVE1MID0gcGljdHVyZV9pbm5lcl90ZXh0O1xuXHR0aGlzLm5vZGUuY2xhc3NOYW1lID0gJ1BpY3RyZS1waWMnO1xuXG5cdHRoaXMuaW1hZ2VPYmplY3QgPSBudWxsO1xuXG5cdHRoaXMucGFyZW50Tm9kZSA9IG51bGw7XG5cdHRoaXMuaW1hZ2VOb2RlID0gbnVsbDtcblxuXHR0aGlzLmNoaWxkTm9kZXMgPSBbXTtcblx0dGhpcy5kYXRhID0ge307XG5cdHRoaXMuZmxhZ3MgPSB7fTtcblxuXHQvLyBzZXQgbm9kZSBpZFxuXHR0aGlzLnNldE5vZGVJRCA9IGZ1bmN0aW9uKGlkKSB7XG5cdFx0dGhpcy5ub2RlLmlkID0gaWQ7XG5cdH07XG5cblx0dGhpcy5nZXROb2RlSUQgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5ub2RlLmlkO1xuXHR9O1xuXG5cdC8vIHNldCBvYmplY3QgZGF0YSBtb2RlbCAoSlNPTiBvYmplY3Qgd2l0aCBzZXJ2ZXIgb2JqZWN0IHByb3BlcnRpZXMpXG5cdHRoaXMuc2V0RGF0YSA9IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHR0aGlzLmRhdGEgPSBkYXRhO1xuXHR9O1xuXG5cdC8vIGFzc3VtZXMgc2V0RGF0YSBoYXMgYWxyZWFkeSBiZWVuIGNhbGxlZC5cblx0Ly8gc2V0cyBhIHNwZWNpZmljIHByb3BlcnR5IHZhbHVlIGZvciB0aGUgZGF0YSBzdHJ1Y3Rcblx0dGhpcy5zZXREYXRhVmFsdWUgPSBmdW5jdGlvbihwcm9wZXJ0eSwgdmFsdWUpIHtcblx0XHR0aGlzLmRhdGFbcHJvcGVydHldID0gdmFsdWU7XG5cdH07XG5cblx0Ly8gcmV0cmlldmUgdGhpcyBub2RlJ3MgY29tcHV0ZWQgc3R5bGUgZm9yIHNwZWNpZmljIHByb3BlcnR5XG5cdHRoaXMuZ2V0Q1NTQ29tcHV0ZWRTdHlsZSA9IGZ1bmN0aW9uKHByb3BlcnR5KSB7XG5cdFx0cmV0dXJuIG1haW5XaW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSh0aGlzLm5vZGUpLmdldFByb3BlcnR5VmFsdWUocHJvcGVydHkpO1xuXHR9O1xuXG5cdHRoaXMuZ2V0Q1NTQ29tcHV0ZWRTdHlsZUFzSW50ID0gZnVuY3Rpb24ocHJvcGVydHkpIHtcblx0XHRyZXR1cm4gcGFyc2VJbnQodGhpcy5nZXRDU1NDb21wdXRlZFN0eWxlKHByb3BlcnR5KS5zcGxpdChcInB4XCIpWzBdKTtcblx0fTtcblxuXHR0aGlzLmdldE5vZGVQcm9wZXJ0eVZhbHVlID0gZnVuY3Rpb24ocHJvcGVydHkpIHtcblx0XHRyZXR1cm4gdGhpcy5ub2RlW3Byb3BlcnR5XVxuXHR9O1xuXG5cdHRoaXMuc2V0Tm9kZVByb3BlcnR5VmFsdWUgPSBmdW5jdGlvbihwcm9wZXJ0eSwgdmFsdWUpIHtcblx0XHR0aGlzLm5vZGVbcHJvcGVydHldID0gdmFsdWU7XG5cdH07XG5cblx0Ly8gc2V0cyBzdHlsZSBwcm9wZXJ0eSBmb3Igbm9kZVxuXHR0aGlzLnNldENTU1Byb3BlcnR5VmFsdWUgPSBmdW5jdGlvbihwcm9wZXJ0eSwgdmFsdWUpIHtcblx0XHR0aGlzLm5vZGUuc3R5bGVbcHJvcGVydHldID0gdmFsdWU7XG5cdH07XG5cblx0dGhpcy5nZXRDU1NQcm9wZXJ0eVZhbHVlID0gZnVuY3Rpb24ocHJvcGVydHkpIHtcblx0XHRyZXR1cm4gdGhpcy5ub2RlLnN0eWxlW3Byb3BlcnR5XTtcblx0fTtcblxuXHQvLyBzZXRzIHRoaXMubm9kZSdzIHBhcmVudFxuXHR0aGlzLnNldFBhcmVudE5vZGUgPSBmdW5jdGlvbihwYXJlbnROb2RlKSB7XG5cdFx0cGFyZW50Tm9kZS5hcHBlbmRDaGlsZCh0aGlzLm5vZGUpO1xuXHRcdHRoaXMucGFyZW50Tm9kZSA9IHBhcmVudE5vZGU7XG5cdH07XG5cblx0Ly8gYWRkIGRpc3RpbmN0aXZlIGZsYWcgdG8gZGlmZmVyZW50aWF0ZSB0aGlzIHNwZWNpZmljIGluc3RhbmNlLlxuXHQvLyBmbGFnIGlzIGEgcHJvcGVydHkgYWRkZWQgdG8gdGhlIGNsYXNzLCBub3QgdGhlIG5vZGVcblx0dGhpcy5zZXRGbGFnID0gZnVuY3Rpb24oZmxhZywgdmFsdWUpIHtcblx0XHR0aGlzLmZsYWdzW2ZsYWddID0gdmFsdWUgfHwgdHJ1ZTtcblx0fTtcblxuXHR0aGlzLnJlbW92ZUZsYWcgPSBmdW5jdGlvbihmbGFnKSB7XG5cdFx0aWYgKHRoaXMuZmxhZ3NbZmxhZ10pIHtcblx0XHRcdHRoaXMuZmxhZ3NbZmxhZ10gPSBmYWxzZTtcblx0XHR9XG5cdH07XG5cblx0dGhpcy5nZXRGbGFnID0gZnVuY3Rpb24oZmxhZykge1xuXHRcdHJldHVybiB0aGlzLmZsYWdzW2ZsYWddO1xuXHR9O1xuXG5cdHRoaXMuaGFzRmxhZyA9IGZ1bmN0aW9uKGZsYWcpIHtcblx0XHRyZXR1cm4gdGhpcy5mbGFnc1tmbGFnXTtcblx0fTtcblxuXHR0aGlzLmdldE5vZGUgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5ub2RlO1xuXHR9O1xuXG5cdC8vIGFwcGVuZHMgYSBub2RlIGVsZW1lbnRcblx0dGhpcy5hZGRDaGlsZE5vZGUgPSBmdW5jdGlvbihub2RlKSB7XG5cdFx0dGhpcy5jaGlsZE5vZGVzLnB1c2gobm9kZSk7XG5cdFx0dGhpcy5ub2RlLmFwcGVuZENoaWxkKG5vZGUpO1xuXHR9O1xuXG5cdC8vIGFkZCBpbWFnZSBub2RlIGZyb20gYW4gSW1nIG9iamVjdFxuXHR0aGlzLmFkZEltYWdlID0gZnVuY3Rpb24ob2JqZWN0KSB7XG5cdFx0aWYgKCEob2JqZWN0IGluc3RhbmNlb2YgSW1nKSkge1xuXHRcdFx0cmV0dXJuIGNvbnNvbGUubG9nKCdFUlIgUElDVFVSRV9KUyBhZGRJbWFnZScsICdhdHRlbXB0ZWQgdG8gYWRkIGFuIGluY29ycmVjdCBvYmplY3QgdHlwZSBhcyBpbWFnZSBvYmplY3QuJyk7XG5cdFx0fVxuXHRcdHRoaXMuaW1hZ2VPYmplY3QgPSBvYmplY3Q7XG5cdFx0dGhpcy5hZGRJbWFnZU5vZGUob2JqZWN0LmdldE5vZGUoKSk7XG5cdH07XG5cblx0Ly8gYWRkIGltYWdlIGNoaWxkIG5vZGVcblx0dGhpcy5hZGRJbWFnZU5vZGUgPSBmdW5jdGlvbihub2RlKSB7XG5cdFx0dGhpcy5hZGRDaGlsZE5vZGUobm9kZSk7XG5cdFx0dGhpcy5pbWFnZU5vZGUgPSBub2RlO1xuXHR9O1xuXG5cdHRoaXMuZ2V0SW1hZ2VOb2RlID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMuaW1hZ2VOb2RlO1xuXHR9O1xuXG5cdHRoaXMuZ2V0Q2hpbGROb2RlID0gZnVuY3Rpb24obm9kZUluZGV4KSB7XG5cdFx0cmV0dXJuIHRoaXMuY2hpbGROb2Rlc1tub2RlSW5kZXhdO1xuXHR9O1xuXG5cdHRoaXMuZ2V0Q2hpbGROb2RlcyA9IGZ1bmN0aW9uKG5vZGVJbmRleCkge1xuXHRcdHJldHVybiB0aGlzLmNoaWxkTm9kZXM7XG5cdH07XG5cblx0Ly8gYWx0ZXJzIG9ubHkgdGhpcyBpbnN0YW5jZSwgc2V0cyBub2RlIGlubmVySFRNTFxuXHR0aGlzLnNldElubmVyVGV4dCA9IGZ1bmN0aW9uKHRleHQpIHtcblx0XHR0aGlzLm5vZGUuaW5uZXJIVE1MID0gdGV4dDtcblx0fTtcblxuXHQvLyBkZWZpbmUgZXZlbnQgaGFuZGxlcnMgZm9yIHRoaXMgaW5zdGFuY2Vcblx0dGhpcy5jbGlja0V2ZW50SGFuZGxlciA9IGZ1bmN0aW9uKGUpIHtcblx0XHRjb25zb2xlLmxvZyhJbnRlcmZhY2VzLm92ZXJsYXkpO1xuXHR9O1xuXG5cdC8vIGF0dGFjaCBub2RlIGV2ZW50c1xuXHRhdHRhY2hFdmVudENsaWNrKEV2ZW50cywgdGhpcy5ub2RlLCB0aGlzLmNsaWNrRXZlbnRIYW5kbGVyKTtcbn1cblxuLy8gYWx0ZXJzIGFsbCBuZXcgaW5zdGFuY2VzXG5QaWN0dXJlLnNldElubmVyVGV4dCA9IGZ1bmN0aW9uKHRleHQpIHtcblx0cGljdHVyZV9pbm5lcl90ZXh0ID0gdGV4dDtcbn07XG5cbi8vIGludGVybmFsIG9iamVjdCBmdW5jdGlvbnNcbmZ1bmN0aW9uIGF0dGFjaEV2ZW50Q2xpY2soRXZlbnRzLCBub2RlLCBoYW5kbGVyKSB7XG5cdEV2ZW50cy5vbk5vZGVFdmVudChub2RlLCAnY2xpY2snLCBoYW5kbGVyKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBQaWN0dXJlOyIsIi8qKlxuICogTW9kdWxlIGZvciBoYW5kbGluZyBzZXJ2ZXIgcmVxdWV0c1xuICovXG5cbnZhciBFbnZpcm9ubWVudCA9IHJlcXVpcmUoJy4vZW52aXJvbm1lbnQuanMnKTtcbnZhciBTZXJ2ZXIgPSB7fTtcblxuU2VydmVyLmNvbXBvbmVudHMgPSB7XG5cdGFuY2hvcjogMCxcblx0bGltaXQ6IEVudmlyb25tZW50Lml0ZW1BbW91bnRQYWdlTG9hZFxufVxuXG4vLyAvYXBpL2FsYnVtLzxhbGJ1bW5hbWU+L29mZnNldDwwPi9saW1pdDwxMDA+XG5TZXJ2ZXIuZ2V0ID0gZnVuY3Rpb24oZW5kcG9pbnQsIGNhbGxiYWNrKSB7XG5cdHZhciByZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cdHJlcXVlc3Qub3BlbignR0VUJywgZW5kcG9pbnQsIHRydWUpO1xuXG5cdGlmICh3aW5kb3cuWERvbWFpblJlcXVlc3QpIHtcblx0XHR2YXIgeGRyID0gbmV3IFhEb21haW5SZXF1ZXN0KCk7XG5cdFx0eGRyLm9wZW4oXCJnZXRcIiwgZW5kcG9pbnQpO1xuXHRcdHhkci5zZW5kKG51bGwpO1xuXHRcdHhkci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcblx0XHRcdGNhbGxiYWNrLmNhbGwoeGRyLCBudWxsLCB4ZHIucmVzcG9uc2VUZXh0KTtcblx0XHR9O1xuXHRcdHhkci5vbmVycm9yID0gZnVuY3Rpb24oZXJyb3IpIHtcblx0XHRcdGNhbGxiYWNrLmNhbGwoeGRyLCBlcnJvciwgbnVsbCk7XG5cdFx0fTtcblx0fSBlbHNlIHtcblx0XHQkLnN1cHBvcnQuY29ycyA9IHRydWU7XG5cdFx0JC5hamF4KHtcblx0XHRcdHR5cGU6ICdHRVQnLFxuXHRcdFx0dXJsOiBlbmRwb2ludCxcblx0XHRcdGFzeW5jOiB0cnVlLFxuXHRcdFx0Y3Jvc3NEb21haW46IHRydWUsXG5cdFx0XHRzdWNjZXNzOiBmdW5jdGlvbihkYXRhKSB7XG5cdFx0XHRcdGNhbGxiYWNrLmNhbGwodGhpcywgbnVsbCwgZGF0YSk7XG5cdFx0XHR9LFxuXHRcdFx0ZXJyb3I6IGZ1bmN0aW9uKGVycm9yKSB7XG5cdFx0XHRcdGNhbGxiYWNrLmNhbGwodGhpcywgZXJyb3IsIG51bGwpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG59O1xuXG5TZXJ2ZXIuZ2V0QWxidW1TaXplID0gZnVuY3Rpb24oYWxidW1OYW1lLCBjYWxsYmFjaykge1xuXHRTZXJ2ZXIuZ2V0KCcvYXBpL2FsYnVtc2l6ZS8nICsgYWxidW1OYW1lLCBmdW5jdGlvbihlcnIsIHJlc3BvbnNlKSB7XG5cdFx0aWYgKGVycikge1xuXHRcdFx0cmV0dXJuIGNhbGxiYWNrLmNhbGwoU2VydmVyLCBlcnIsIG51bGwpO1xuXHRcdH1cblxuXHRcdHRyeSB7XG5cdFx0XHRjYWxsYmFjay5jYWxsKFNlcnZlciwgbnVsbCwgcmVzcG9uc2UpXG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0Y2FsbGJhY2suY2FsbChTZXJ2ZXIsIGUsIG51bGwpO1xuXHRcdH1cblx0fSk7XG59O1xuXG4vLyByZXRyaWV2ZXMgYWxidW0gZGF0YSBzdGFydGluZyBhdCBhIHNwZWNpZmljIGFuY2hvclxuU2VydmVyLmdldEFsYnVtQXRBbmNob3IgPSBmdW5jdGlvbihhbGJ1bU5hbWUsIG9mZnNldCwgbGltaXQsIGNhbGxiYWNrKSB7XG5cdFNlcnZlci5nZXQoJy9hcGkvYWxidW0vJyArIGFsYnVtTmFtZSArICcvJyArIG9mZnNldCArICcvJyArIGxpbWl0LCBmdW5jdGlvbihlcnIsIHJlc3BvbnNlKSB7XG5cdFx0aWYgKGVycikge1xuXHRcdFx0cmV0dXJuIGNhbGxiYWNrLmNhbGwoU2VydmVyLCBlcnIsIG51bGwpO1xuXHRcdH1cblxuXHRcdHRyeSB7XG5cdFx0XHRjYWxsYmFjay5jYWxsKFNlcnZlciwgbnVsbCwgcmVzcG9uc2UpO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGNhbGxiYWNrLmNhbGwoU2VydmVyLCBlLCBudWxsKTtcblx0XHR9XG5cdH0pO1xufTtcblxuU2VydmVyLmdldEFsYnVtID0gZnVuY3Rpb24oYWxidW1OYW1lLCBjYWxsYmFjaykge1xuXHRTZXJ2ZXIuZ2V0QWxidW1BdEFuY2hvcihhbGJ1bU5hbWUsIFNlcnZlci5jb21wb25lbnRzLmFuY2hvciwgU2VydmVyLmNvbXBvbmVudHMubGltaXQsIGNhbGxiYWNrKTtcbn07XG5cblNlcnZlci5zZXRSZXF1ZXN0QW5jaG9yID0gZnVuY3Rpb24oZGF0YSkge1xuXHRTZXJ2ZXIuY29tcG9uZW50cy5hbmNob3IgPSBkYXRhO1xufTtcblxuU2VydmVyLnNldFJlcXVlc3RMaW1pdCA9IGZ1bmN0aW9uKGRhdGEpIHtcblx0U2VydmVyLmNvbXBvbmVudHMubGltaXQgPSBkYXRhO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFNlcnZlcjsiLCIvKipcbiAqIEhlbHBlciBmdW5jdGlvbnNcbiAqL1xuXG52YXIgVXRpbGl0aWVzID0ge307XG5cblV0aWxpdGllcy5leHRlbmQgPSBmdW5jdGlvbihkb21PYmplY3QpIHtcblxuXHRyZXR1cm4ge1xuXHRcdG9uOiBmdW5jdGlvbih0eXBlLCBjYWxsYmFjaykge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0ZG9tT2JqZWN0LmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgZnVuY3Rpb24oZSkge1xuXHRcdFx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2suY2FsbChkb21PYmplY3QsIGUpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0ZG9tT2JqZWN0LmF0dGFjaEV2ZW50KCdvbicgKyB0eXBlLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRcdFx0aWYgKHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nKSBjYWxsYmFjay5jYWxsKGRvbU9iamVjdCwgZSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH1cblx0fTtcblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFV0aWxpdGllczsiXX0=
