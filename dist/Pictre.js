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
	picture.addClickHandler(function(e) {
		Interfaces.overlay.showWithPicture(Interfaces, Events, mainWindow, this);
	});

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

var Environment = require('../environment.js');
var Img = require('../image.js');

var Overlay = {};

var isLocked = false;
var iterator = 0;
var comments = null;
var imageNode = null;
var domElement = null;

var maxImageNodeWidth = 800;
var minImageNodeTopOffset = 5;

var callbacks = {};
var nodes = {
	overlay: null,
	imageNodeHolder: null,
};

var events = {
	click: []
};

// stores loaded image objects
// images are stored in key-value
// pairs using their URI string.
var cache = {};

var isCreated = false;
var isShowing = false;

// attempts to retrieve an image previously stored in the cache.
// returns the image object if image is found in cache, or null.
Overlay.loadImageFromCache = function(imageURI) {
	return cache[imageURI];
};

// attempts to load an image from a given URI. If successful,
// the loaded image object is stored in the cache. Receives
// an image URI and a callback to be executed after loading
// an image successfully. Images are stored in cache by URI.
Overlay.loadImageFromURI = function(Events, mainWindow, imageURI, callback) {
	var image = new Img(Events, mainWindow, Environment.baseAPIUrl + '/' + imageURI);
	image.on('load', function(err, e) {
		if (err) {
			return callback.call(Overlay, err, null);
		}
		cache[imageURI] = image;
		callback.call(Overlay, null, image);
	});
};

Overlay.isLocked = function() {
	return isLocked;
};

Overlay.clickHandler = function(e) {
	for (var i = 0; i < events.click.length; i++) {
		events.click[i].call(Overlay, e);
	}
};

Overlay.create = function(Events, mainWindow) {
	isCreated = true;

	nodes.overlay = mainWindow.document.createElement('div');
	nodes.overlay.className = 'Pictre-overlay';
	nodes.overlay.style.display = 'none';
	nodes.overlay.style.zIndex = 999;

	nodes.imageNodeHolder = mainWindow.document.createElement('div');
	nodes.imageNodeHolder.className = 'Pictre-overlay-pic';
	nodes.imageNodeHolder.style.minWidth = maxImageNodeWidth + 'px';
	nodes.imageNodeHolder.style.maxWidth = maxImageNodeWidth + 'px';

	nodes.overlay.appendChild(nodes.imageNodeHolder);
	mainWindow.document.body.appendChild(nodes.overlay);

	Events.onNodeEvent(nodes.overlay, 'click', Overlay.clickHandler);
	Overlay.addClickHandler(function(e) {
		if (this.isLocked()) {
			return;
		}
		this.hide();
	});
};

// display the overlay interface
// returns true if successful
// else false if already showing 
Overlay.show = function(Events, mainWindow) {
	if (!isCreated) {
		Overlay.create(Events, mainWindow);
	}
	if (isShowing) {
		return false;
	}

	isShowing = true;
	$(nodes.overlay).fadeIn(600);
	return true;
};

// returns true if successful, false otherwise
Overlay.showWithPicture = function(Interfaces, Events, mainWindow, picture) {
	var isShowing = Overlay.show(Events, mainWindow);
	if (!isShowing) {
		return false;
	}

	Overlay.setPicture(Interfaces, Events, mainWindow, picture);
	return true;
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
	if (!isShowing) {
		return;
	}

	isShowing = false;
	$(nodes.overlay).fadeOut(600);
}

Overlay.setPicture = function(Interfaces, Events, mainWindow, picture) {
	var imageURI = picture.getImageURI()
	if (!imageURI) {
		console.log('WARN', 'Ignoring picture object with no image data.');
		return;
	}

	// attempt to load an existing image object
	var image = Overlay.loadImageFromCache(imageURI);
	if (!image) {
		return Overlay.loadImageFromURI(Events, mainWindow, imageURI, function(err, object) {
			image = object;
			Overlay.setImageNode(Interfaces, mainWindow, image);
		});
	}

	Overlay.setImageNode(Interfaces, mainWindow, image);
};

// receives a loaded image object and attempts to append its node
// to the overlay node. If the overlay node already has an image node,
// it will be removed prior to appending the new one, if the new one
// is a different node than the currently appended one.
Overlay.setImageNode = function(Interfaces, mainWindow, image) {
	var node = image.getNode();
	if (!node) {
		console.log('WARN', 'Ignoring image object with no image node.');
		return;
	}
	if (Overlay.hasNode(node)) {
		return;
	}
	if (Overlay.hasImageNode()) {
		Overlay.removeImageNode();
	}

	imageNode = node;
	nodes.imageNodeHolder.appendChild(node);
	if (imageNode.width <= maxImageNodeWidth) {
		nodes.imageNodeHolder.style.width = imageNode.width + 'px';
	}
	Interfaces.controller.verticalCenterNodeRelativeTo(nodes.imageNodeHolder, nodes.overlay);

	var negativeOffsetChar = nodes.imageNodeHolder.style.top.substring(0, 1)
	if (negativeOffsetChar == '-') {
		nodes.imageNodeHolder.style.top = minImageNodeTopOffset + 'px';
	}
};

Overlay.getFeaturedImage = function() {
	return Overlay.getImageNode();
};

Overlay.addClickHandler = function(callback) {
	events.click.push(callback);
};

Overlay.hasNode = function(node) {
	for (var i = 0; i < nodes.imageNodeHolder.children.length; i++) {
		if (nodes.imageNodeHolder.children[i] == node) {
			return true;
		}
		return false;
	}
};

Overlay.hasImageNode = function() {
	return imageNode != null;
};

Overlay.getImageNode = function() {
	return imageNode;
};

Overlay.removeNode = function(node) {
	nodes.imageNodeHolder.removeChild(node);
	if (imageNode == node) {
		imageNode = null;
	}
};

Overlay.removeImageNode = function() {
	if (!imageNode) {
		return;
	}
	Overlay.removeNode(imageNode);
};

module.exports = Overlay;
},{"../environment.js":"/Volumes/TINY/Documents/Pictre-pro/src/environment.js","../image.js":"/Volumes/TINY/Documents/Pictre-pro/src/image.js"}],"/Volumes/TINY/Documents/Pictre-pro/src/interfaces/splash.js":[function(require,module,exports){
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

	this.callbacks = {
		click: []
	};

	// calls all functions in events.callbacks.click
	this.clickHandler = function(e) {
		for (var i = 0; i < self.callbacks.click.length; i++) {
			self.callbacks.click[i].call(self, e);
		}
	};

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

	// retrieves main image URI stored in the picture's data
	this.getImageURI = function() {
		return this.data.src;
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

	// sets callback to call on a click event
	this.addClickHandler = function(callback) {
		this.callbacks.click.push(callback);
	};

	// attach node events to respective callbacks
	bindEvent(Events, 'click', this.node, this.clickHandler);
}

// alters all new instances
Picture.setInnerText = function(text) {
	picture_inner_text = text;
};

// internal object functions
function bindEvent(Events, eventName, node, handler) {
	Events.onNodeEvent(node, eventName, handler);
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvbWFpbi5qcyIsInNyYy9jbGllbnQuanMiLCJzcmMvZW52aXJvbm1lbnQuanMiLCJzcmMvZXZlbnRzLmpzIiwic3JjL2ltYWdlLmpzIiwic3JjL2ludGVyZmFjZS5qcyIsInNyYy9pbnRlcmZhY2VzL2JvYXJkLmpzIiwic3JjL2ludGVyZmFjZXMvY29udHJvbGxlci5qcyIsInNyYy9pbnRlcmZhY2VzL2dhbGxlcnkuanMiLCJzcmMvaW50ZXJmYWNlcy9pbmRleC5qcyIsInNyYy9pbnRlcmZhY2VzL21lbnUuanMiLCJzcmMvaW50ZXJmYWNlcy9tb2RhbC5qcyIsInNyYy9pbnRlcmZhY2VzL292ZXJsYXkuanMiLCJzcmMvaW50ZXJmYWNlcy9zcGxhc2guanMiLCJzcmMvaW50ZXJmYWNlcy93YXJuaW5nLmpzIiwic3JjL3BpY3R1cmUuanMiLCJzcmMvc2VydmVyLmpzIiwic3JjL3V0aWxpdGllcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbE5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdk1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqIFBpY3RyZSBjbGllbnQgY29yZS4gVXNlcyBicm93c2VyaWZ5IHRvIG1haW50YWluXG4gKiBOb2RlLWxpa2UgbW9kdWxhciBzdHJ1Y3R1cmUuIERvICducG0gaW5zdGFsbCcgaW4gb3JkZXJcbiAqIHRvIG9idGFpbiBhbGwgcmVxdWlyZWQgZGV2IHBhY2thZ2VzLiBCdWlsZCBzeXN0ZW0gaXMgJ2d1bHAnLlxuICogQnVpbGRzIHRvICcvZGlzdC9QaWN0cmUuanMnLlxuICpcbiAqIEBhdXRob3IganVhbnZhbGxlam9cbiAqIEBkYXRlIDUvMzEvMTVcbiAqL1xuXG52YXIgQ2xpZW50ID0gcmVxdWlyZSgnLi9jbGllbnQuanMnKTtcbnZhciBFbnZpcm9ubWVudCA9IHJlcXVpcmUoJy4vZW52aXJvbm1lbnQuanMnKTtcbnZhciBJbnRlcmZhY2VzID0gcmVxdWlyZSgnLi9pbnRlcmZhY2UuanMnKTtcbnZhciBFdmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cy5qcycpO1xudmFyIFNlcnZlciA9IHJlcXVpcmUoJy4vc2VydmVyLmpzJyk7XG5cbnZhciBQaWN0cmUgPSB7fTtcblxuLyoqXG4gKiBJbml0aWFsaXplcyBhcHBsaWNhdGlvbiB2YXJpYWJsZXMgYW5kIGRlZmF1bHQgc2V0dGluZ3MuXG4gKlxuICogQHBhcmFtIGFwcGxpY2F0aW9uV3JhcHBlciBcdFtTdHJpbmddIGRvbSBlbGVtZW50IGlkIG9mIGFwcGxpY2F0aW9uIGNvbnRhaW5lclxuICogQHBhcmFtIHJlc291cmNlTG9jYXRpb24gXHRcdFtTdHJpbmddIHVybCBvZiBjbG91ZCBkaXJlY3RvcnkgY29udGFpbmluZyBhbGwgaW1hZ2VzXG4gKiBAcGFyYW0gYXBwRGF0YUxvY2F0aW9uIFx0XHRbU3RyaW5nXSB1cmwgb2YgY2xvdWQgZGlyZWN0b3J5IGNvbnRhaW5pbmcgYXBwbGljYXRpb24gZmlsZXNcbiAqL1xuUGljdHJlLmluaXQgPSBmdW5jdGlvbihtYWluV2luZG93LCBhcHBsaWNhdGlvbldyYXBwZXIsIHJlc291cmNlTG9jYXRpb24sIGFwcERhdGFMb2NhdGlvbiwgZGV2ZWxvcGVyTW9kZSkge1xuXHR2YXIgc3BhY2VyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblx0c3BhY2VyLmNsYXNzTmFtZSA9IFwiUGljdHJlLXNwYWNlclwiO1xuXG5cdGlmIChyZXNvdXJjZUxvY2F0aW9uKSB7XG5cdFx0RW52aXJvbm1lbnQuY2xvdWQuZGF0YWRpciA9IHJlc291cmNlTG9jYXRpb247XG5cdH1cblx0aWYgKGFwcERhdGFMb2NhdGlvbikge1xuXHRcdEVudmlyb25tZW50LmNsb3VkLmFkZHJlc3MgPSBhcHBEYXRhTG9jYXRpb247XG5cdH1cblx0aWYgKCFkZXZlbG9wZXJNb2RlKSB7XG5cdFx0RW52aXJvbm1lbnQuaW5Qcm9kdWN0aW9uID0gdHJ1ZTtcblx0fVxuXG5cdC8vIGNyZWF0ZSBhbmQgcGxhY2UgbWVudSBiZWZvcmUgYXBwbGljYXRpb24gd3JhcHBlclxuXHRJbnRlcmZhY2VzLm1lbnUucHV0KG1haW5XaW5kb3cuZG9jdW1lbnQuYm9keSwgYXBwbGljYXRpb25XcmFwcGVyKTtcblxuXHQvLyBkZXRlY3QgY2xpZW50IHNldHRpbmdzXG5cdENsaWVudC5pbml0KCk7XG5cblx0aWYgKEludGVyZmFjZXMuYm9hcmQuaXNTZXQoKSkge1xuXHRcdHZhciBib2FyZE5hbWUgPSBJbnRlcmZhY2VzLmJvYXJkLmdldE5hbWUoKTtcblx0XHRpZiAoSW50ZXJmYWNlcy5ib2FyZC5pc05hbWVSZXN0cmljdGVkKGJvYXJkTmFtZSkgfHwgSW50ZXJmYWNlcy5ib2FyZC5pc05hbWVJbnZhbGlkKGJvYXJkTmFtZSkpIHtcblx0XHRcdEludGVyZmFjZXMuc3BsYXNoLnNob3coSW50ZXJmYWNlcywgRXZlbnRzLCBDbGllbnQsIG1haW5XaW5kb3csIG1haW5XaW5kb3cuZG9jdW1lbnQuYm9keSk7XG5cdFx0XHRpZiAoSW50ZXJmYWNlcy5ib2FyZC5pc05hbWVSZXN0cmljdGVkKGJvYXJkTmFtZSkpIHtcblx0XHRcdFx0SW50ZXJmYWNlcy5zcGxhc2guc2hvd0FsZXJ0KEludGVyZmFjZXMsICdUaGF0IGFsYnVtIGlzIHJlc3RyaWN0ZWQsIHBsZWFzZSB0cnkgYW5vdGhlci4nKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdEludGVyZmFjZXMuc3BsYXNoLnNob3dBbGVydChJbnRlcmZhY2VzLCAnWW91ciBhbGJ1bSBjb250YWlucyBpbnZhbGlkIGNoYXJhY3RlcnMuJyk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0SW50ZXJmYWNlcy5ib2FyZC5zaG93KEludGVyZmFjZXMsIEV2ZW50cywgU2VydmVyLCBtYWluV2luZG93LCBhcHBsaWNhdGlvbldyYXBwZXIpO1xuXHRcdEludGVyZmFjZXMuYm9hcmQuc2hvd0FsZXJ0KCdMb2FkaW5nLCBwbGVhc2Ugd2FpdC4uLicpO1xuXHR9IGVsc2Uge1xuXHRcdC8vIHNob3cgbWFpbiB2aWV3XG5cdFx0SW50ZXJmYWNlcy5zcGxhc2guc2hvdyhJbnRlcmZhY2VzLCBFdmVudHMsIENsaWVudCwgbWFpbldpbmRvdywgbWFpbldpbmRvdy5kb2N1bWVudC5ib2R5KTtcblx0XHRpZiAoRW52aXJvbm1lbnQuaXNVcGRhdGluZykge1xuXHRcdFx0SW50ZXJmYWNlcy5zcGxhc2guc2hvd0FsZXJ0KEludGVyZmFjZXMsICdVcGRhdGVzIGFyZSBjdXJyZW50bHkgaW4gcHJvZ3Jlc3MuLi4nKTtcblx0XHR9XG5cdH1cbn1cblxud2luZG93LlBpY3RyZSA9IFBpY3RyZTsiLCIvKipcbiAqIENsaWVudCBtYW5hZ2VyIGZvciBhcHBsaWNhdGlvbiBydW50aW1lLiBQcm92aWRlcyB1dGlsaXRpZXMgYW5kXG4gKiBhd2FyZW5lc3Mgb2YgYnJvd3NlciBpbmZvcm1hdGlvbiAvIGNvbXBhdGliaWxpdHkuXG4gKlxuICogQGF1dGhvciBqdWFudmFsbGVqb1xuICogQGRhdGUgNi8xLzE1XG4gKi9cblxudmFyIEludGVyZmFjZSA9IHJlcXVpcmUoJy4vaW50ZXJmYWNlLmpzJyk7XG5cbnZhciBDbGllbnQgPSB7fTtcblxuLy8gaG9sZHMgYnJvd3NlciBuYW1lc1xuQ2xpZW50LmJyb3dzZXIgPSB7XG5cblx0VU5LTk9XTjogMCxcblx0Q0hST01FOiAxLFxuXHRTQUZBUkk6IDIsXG5cdE1PQklMRV9TQUZBUkk6IDMsXG5cdEZJUkVGT1g6IDQsXG5cdE9QRVJBOiA1LFxuXHRJRV9NT0RFUk46IDYsXG5cdElFX1VOU1VQUE9SVEVEOiA3LFxuXHRJRV9PVEhFUjogOFxuXG59O1xuXG4vKipcbiAqIGZsYWcgaW5kaWNhdGluZyBpZiB1c2luZyBjb21wYXRpYmxlIGJyb3dzZXJcbiAqL1xuQ2xpZW50LmNvbXBhdGlibGUgPSB0cnVlO1xuQ2xpZW50LmlkID0gQ2xpZW50LmJyb3dzZXIuVU5LTk9XTlxuQ2xpZW50Lm5hbWUgPSAnVW5rbm93bic7XG5DbGllbnQudmVyc2lvbiA9IDA7XG5cbkNsaWVudC5vcyA9IG5hdmlnYXRvci5wbGF0Zm9ybTtcbkNsaWVudC5vbmxpbmUgPSBuYXZpZ2F0b3Iub25MaW5lO1xuXG5DbGllbnQuZ2V0SWQgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIENsaWVudC5pZDtcbn07XG5cbkNsaWVudC5pc0lFID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiBDbGllbnQuaWQgPT0gQ2xpZW50LmJyb3dzZXIuSUVfTU9ERVJOIHx8IENsaWVudC5pZCA9PSBDbGllbnQuYnJvd3Nlci5JRV9VTlNVUFBPUlRFRCB8fCBDbGllbnQuaWQgPT0gQ2xpZW50LmJyb3dzZXIuSUVfT1RIRVI7XG59O1xuXG5DbGllbnQuaXNNb2JpbGVTYWZhcmkgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIENsaWVudC5pZCA9PSBDbGllbnQuYnJvd3Nlci5NT0JJTEVfU0FGQVJJO1xufTtcblxuQ2xpZW50LmlzU2FmYXJpID0gZnVuY3Rpb24odmVyc2lvbikge1xuXHRpZiAodmVyc2lvbikge1xuXHRcdHJldHVybiBDbGllbnQuaWQgPT0gQ2xpZW50LmJyb3dzZXIuU0FGQVJJICYmIENsaWVudC52ZXJzaW9uLnNwbGl0KCcnKS5pbmRleE9mKHZlcnNpb24pICE9IC0xO1xuXHR9XG5cdHJldHVybiBDbGllbnQuaWQgPT0gQ2xpZW50LmJyb3dzZXIuU0FGQVJJO1xufTtcblxuLyoqXG4gKiBDb2xsZWN0cyBpbmZvcm1hdGlvbiBhYm91dCBicm93c2VyIHZlcnNpb24sXG4gKiBjb21wYXRpYmlsaXR5LCBuYW1lLCBhbmQgZGlzcGxheSBpbmZvcm1hdGlvblxuICogYmFzZWQgb24gdXNlciBhZ2VudCBzdHJpbmcuXG4gKi9cbkNsaWVudC5pbml0ID0gZnVuY3Rpb24oKSB7XG5cblx0aWYgKG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZihcIkFwcGxlV2ViS2l0XCIpICE9IC0xKSB7XG5cblx0XHRpZiAobmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKFwiQ2hyb21lXCIpICE9IC0xKSB7XG5cdFx0XHRDbGllbnQubmFtZSA9IFwiQ2hyb21lXCI7XG5cdFx0XHRDbGllbnQuaWQgPSBDbGllbnQuYnJvd3Nlci5DSFJPTUU7XG5cdFx0fSBlbHNlIHtcblxuXHRcdFx0aWYgKG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZihcIk1vYmlsZVwiKSAhPSAtMSkge1xuXHRcdFx0XHRDbGllbnQubmFtZSA9IFwiTW9iaWxlIFNhZmFyaVwiO1xuXHRcdFx0XHRDbGllbnQuaWQgPSBDbGllbnQuYnJvd3Nlci5NT0JJTEVfU0FGQVJJO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Q2xpZW50Lm5hbWUgPSBcIlNhZmFyaVwiO1xuXHRcdFx0XHRDbGllbnQuaWQgPSBDbGllbnQuYnJvd3Nlci5TQUZBUkk7XG5cblx0XHRcdFx0dmFyIHZlcnNpb24gPSBuYXZpZ2F0b3IudXNlckFnZW50LnNwbGl0KFwiVmVyc2lvbi9cIik7XG5cdFx0XHRcdENsaWVudC52ZXJzaW9uID0gdmVyc2lvblsxXS5zcGxpdChcIiBcIilbMF07XG5cdFx0XHR9XG5cblx0XHR9XG5cblx0fSBlbHNlIHtcblxuXHRcdGlmIChuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoXCJGaXJlZm94XCIpICE9IC0xKSB7XG5cdFx0XHRDbGllbnQubmFtZSA9IFwiRmlyZWZveFwiO1xuXHRcdFx0Q2xpZW50LmlkID0gQ2xpZW50LmJyb3dzZXIuRklSRUZPWDtcblx0XHR9IGVsc2UgaWYgKG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZihcIk9wZXJhXCIpICE9IC0xKSB7XG5cdFx0XHRDbGllbnQubmFtZSA9IFwiT3BlcmFcIjtcblx0XHRcdENsaWVudC5pZCA9IENsaWVudC5icm93c2VyLk9QRVJBO1xuXHRcdH0gZWxzZSBpZiAobmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKFwiTVNJRSBcIikgIT0gLTEpIHtcblxuXHRcdFx0aWYgKG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZihcIlRyaWRlbnRcIikgIT0gLTEpIHtcblxuXHRcdFx0XHR2YXIgdmVyc2lvbiA9IG5hdmlnYXRvci51c2VyQWdlbnQuc3BsaXQoXCI7XCIpWzFdO1xuXHRcdFx0XHR2ZXJzaW9uID0gcGFyc2VJbnQodmVyc2lvbi5zcGxpdChcIiBcIilbMl0pO1xuXG5cdFx0XHRcdENsaWVudC5uYW1lID0gXCJJbnRlcm5ldCBFeHBsb3JlclwiO1xuXHRcdFx0XHRDbGllbnQudmVyc2lvbiA9IHZlcnNpb247XG5cblx0XHRcdFx0aWYgKHZlcnNpb24gPiA4KSB7XG5cdFx0XHRcdFx0Q2xpZW50LmlkID0gQ2xpZW50LmJyb3dzZXIuSUVfTU9ERVJOO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdENsaWVudC5pZCA9IENsaWVudC5icm93c2VyLklFX1VOU1VQUE9SVEVEO1xuXHRcdFx0XHR9XG5cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdENsaWVudC5uYW1lID0gXCJJbnRlcm5ldCBFeHBsb3JlclwiO1xuXHRcdFx0XHRDbGllbnQuaWQgPSBDbGllbnQuYnJvd3Nlci5JRV9PVEhFUjtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0Q2xpZW50Lm5hbWUgPSAnT3RoZXInO1xuXHRcdFx0Q2xpZW50LmlkID0gQ2xpZW50LmJyb3dzZXIuVU5LTk9XTjtcblx0XHR9XG5cblx0fVxuXG5cdC8vIERldGVjdCBpZiB1c2luZyBob3BlbGVzcyBicm93c2VyXG5cdGlmIChDbGllbnQuaWQgPT0gQ2xpZW50LmJyb3dzZXIuSUVfVU5TVVBQT1JURUQgfHwgQ2xpZW50LmlkID09IENsaWVudC5icm93c2VyLklFX09USEVSKSB7XG5cblx0XHR2YXIgd2FybmluZztcblx0XHR2YXIgbG9jayA9IGZhbHNlO1xuXHRcdHZhciBoZWFkZXIgPSAnU29ycnkgYWJvdXQgdGhhdCEnO1xuXG5cdFx0aWYgKENsaWVudC5pZCA9PSBDbGllbnQuYnJvd3Nlci5JRV9PVEhFUikge1xuXG5cdFx0XHR3YXJuaW5nID0gXCJVbmZvcnR1bmF0ZWx5IFBpY3RyZSBpcyBub3Qgc3VwcG9ydGVkIGluIHlvdXIgYnJvd3NlciwgcGxlYXNlIGNvbnNpZGVyIHVwZ3JhZGluZyB0byBHb29nbGUgQ2hyb21lLCBieSBjbGlja2luZyBoZXJlLCBmb3IgYW4gb3B0aW1hbCBicm93c2luZyBleHBlcmllbmNlLlwiO1xuXHRcdFx0bG9jayA9IHRydWU7XG5cblx0XHRcdEludGVyZmFjZS53YXJuaW5nLm9uY2xpY2sgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0d2luZG93Lm9wZW4oXCJodHRwOi8vY2hyb21lLmdvb2dsZS5jb21cIiwgXCJfYmxhbmtcIik7XG5cdFx0XHR9O1xuXG5cdFx0fSBlbHNlIHtcblxuXHRcdFx0aGVhZGVyID0gJ05vdGljZSEnO1xuXHRcdFx0d2FybmluZyA9IFwiU29tZSBvZiBQaWN0cmUncyBmZWF0dXJlcyBtYXkgbm90IGJlIGZ1bGx5IHN1cHBvcnRlZCBpbiB5b3VyIGJyb3dzZXIuXCI7XG5cblx0XHRcdEludGVyZmFjZS53YXJuaW5nLm9uY2xpY2sgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0dGhpcy5yZW1vdmUoKTtcblx0XHRcdH07XG5cblx0XHR9XG5cblx0XHRDbGllbnQuY29tcGF0aWJsZSA9IGZhbHNlO1xuXG5cdFx0SW50ZXJmYWNlLndhcm5pbmcucHV0KHtcblxuXHRcdFx0aGVhZGVyOiBoZWFkZXIsXG5cdFx0XHRib2R5OiB3YXJuaW5nLFxuXHRcdFx0bG9ja2VkOiBsb2NrXG5cblx0XHR9KTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IENsaWVudDsiLCIvKipcbiAqIEFwcGxpY2F0aW9uIGVudmlyb25tZW50IGR1cmluZyBydW50aW1lLiBTdG9yZXMgZHluYW1pY1xuICogZ2xvYmFsIHZhbHVlcyBmb3IgYXBwbGljYXRpb24gbW9kdWxlIHN1cHBvcnQuXG4gKlxuICogQGF1dGhvciBqdWFudmFsbGVqb1xuICogQGRhdGUgNS8zMS8xNVxuICovXG5cbnZhciBFbnZpcm9ubWVudCA9IHt9O1xuXG5FbnZpcm9ubWVudC5jbG91ZCA9IHtcblx0ZGF0YWRpcjogJycsXG5cdGFkZHJlc3M6ICcnXG59XG5cbkVudmlyb25tZW50LmFwcCA9IHtcblx0dGl0bGU6ICdQaWN0cmUnXG59XG5cbkVudmlyb25tZW50LmV2ZW50cyA9IHt9O1xuXG5FbnZpcm9ubWVudC5pblByb2R1Y3Rpb24gPSBmYWxzZTtcbkVudmlyb25tZW50LmlzVXBkYXRpbmcgPSBmYWxzZTtcblxuRW52aXJvbm1lbnQuYW5pbWF0aW9uU3BlZWQgPSAxMDAwO1xuRW52aXJvbm1lbnQubWF4SW1hZ2VXaWR0aCA9IDgwMDtcbkVudmlyb25tZW50Lm1heEltYWdlSGVpZ2h0ID0gMTM3O1xuRW52aXJvbm1lbnQuYWxlcnREdXJhdGlvbiA9IDEwMDAwO1xuXG5FbnZpcm9ubWVudC5iYXNlQVBJVXJsID0gJ2h0dHA6Ly9zdGF0aWMtcGljdHJlLnJoY2xvdWQuY29tLyc7XG5cbi8vIGxvYWQgeCBpdGVtcyBvbiBwYWdlIGxvYWRcbkVudmlyb25tZW50Lml0ZW1BbW91bnRQYWdlTG9hZCA9IDUwO1xuLy8gbG9hZCB4IGl0ZW1zIHBlciBzdWJzZXF1ZW50IHJlcXVlc3RcbkVudmlyb25tZW50Lml0ZW1BbW91bnRSZXF1ZXN0ID0gMjU7XG5cbm1vZHVsZS5leHBvcnRzID0gRW52aXJvbm1lbnQ7IiwiLyoqXG4gKiBBcHBsaWNhdGlvbiBldmVudHMgY29udHJvbGxlclxuICovXG5cbnZhciBFdmVudHMgPSB7fTtcbnZhciByZWdpc3RlcmVkR2xvYmFsRXZlbnRzID0ge307XG52YXIgcmVnaXN0ZXJlZE5vZGVFdmVudHMgPSB7fTtcblxudmFyIG5vZGVTdGF0ZUNhY2hlID0ge307XG5cbi8qKlxuICogTGlzdGVucyBmb3IgYSBkb20gZXZlbnRcbiAqL1xuRXZlbnRzLm9uQ2FjaGVkTm9kZUV2ZW50ID0gZnVuY3Rpb24obm9kZSwgZXZlbnROYW1lLCBjYWxsYmFjaykge1xuXHRpZiAoIXJlZ2lzdGVyZWROb2RlRXZlbnRzW25vZGUubm9kZU5hbWVdKSB7XG5cdFx0cmVnaXN0ZXJlZE5vZGVFdmVudHNbbm9kZS5ub2RlTmFtZV0gPSB7fTtcblx0fVxuXG5cdGlmICghcmVnaXN0ZXJlZE5vZGVFdmVudHNbbm9kZS5ub2RlTmFtZV1bZXZlbnROYW1lXSkge1xuXHRcdHJlZ2lzdGVyZWROb2RlRXZlbnRzW25vZGUubm9kZU5hbWVdW2V2ZW50TmFtZV0gPSBbXTtcblxuXHRcdGZ1bmN0aW9uIG5vZGVFdmVudChlKSB7XG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHJlZ2lzdGVyZWROb2RlRXZlbnRzW25vZGUubm9kZU5hbWVdW2V2ZW50TmFtZV0ubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0aWYgKHR5cGVvZiByZWdpc3RlcmVkTm9kZUV2ZW50c1tub2RlLm5vZGVOYW1lXVtldmVudE5hbWVdW2ldID09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRyZWdpc3RlcmVkTm9kZUV2ZW50c1tub2RlLm5vZGVOYW1lXVtldmVudE5hbWVdW2ldLmNhbGwobm9kZSwgZSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHR0cnkge1xuXHRcdFx0bm9kZS5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgbm9kZUV2ZW50KTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRub2RlLmF0dGFjaEV2ZW50KCdvbicgKyBldmVudE5hbWUsIG5vZGVFdmVudCk7XG5cdFx0fVxuXHR9XG5cblx0cmVnaXN0ZXJlZE5vZGVFdmVudHNbbm9kZS5ub2RlTmFtZV1bZXZlbnROYW1lXS5wdXNoKGNhbGxiYWNrKTtcbn07XG5cbkV2ZW50cy5vbk5vZGVFdmVudCA9IGZ1bmN0aW9uKG5vZGUsIGV2ZW50TmFtZSwgY2FsbGJhY2spIHtcblx0dHJ5IHtcblx0XHRub2RlLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBjYWxsYmFjayk7XG5cdH0gY2F0Y2ggKGUpIHtcblx0XHRub2RlLmF0dGFjaEV2ZW50KCdvbicgKyBldmVudE5hbWUsIGNhbGxiYWNrKTtcblx0fVxufTtcblxuLyoqXG4gKiBDYWxscyBjYWxsYmFjayBmdW5jdGlvbiBzY29wZWQgdG8gbm9kZSBwYXNzZWRcbiAqIHdpdGggdGhlICdyZXNpemUnIGV2ZW50IGFzIHRoZSBmaXJzdCBwYXJhbWV0ZXJcbiAqIHRoZSBob3Jpem9udGFsIGRpZmZlcmVuY2UgYXMgdGhlIHNlY29uZCBwYXJhbWV0ZXJcbiAqIGFuZCB0aGUgdmVydGljYWwgZGlmZmVyZW5jZSBhcyB0aGUgdGhpcmQgcGFyYW1ldGVyXG4gKi9cbkV2ZW50cy5vbk5vZGVSZXNpemVFdmVudCA9IGZ1bmN0aW9uKG5vZGUsIGNhbGxiYWNrKSB7XG5cdC8vIG5vZGVTdGF0ZUNhY2hlIGNhbiBiZSB1c2VkIGJ5IGFueSBtZXRob2Qgb24gdGhpcyBtb2R1bGVcblx0Ly8gdGhlcmVmb3JlLCBkZWxheSBhbnkgaW5zdGFudGlhdGlvbiB1bnRpbCBhZnRlciB3ZSBrbm93XG5cdC8vIGFuIGVudHJ5IGZvciB0aGlzIG5vZGUgZXhpc3RzXG5cdGlmICghbm9kZVN0YXRlQ2FjaGVbbm9kZS5ub2RlTmFtZV0pIHtcblx0XHRub2RlU3RhdGVDYWNoZVtub2RlLm5vZGVOYW1lXSA9IHt9O1xuXHR9XG5cdGlmICghbm9kZVN0YXRlQ2FjaGVbbm9kZS5ub2RlTmFtZV0ub25Ob2RlUmVzaXplRXZlbnQpIHtcblx0XHRub2RlU3RhdGVDYWNoZVtub2RlLm5vZGVOYW1lXS5vbk5vZGVSZXNpemVFdmVudCA9IHRydWU7XG5cdFx0bm9kZVN0YXRlQ2FjaGVbbm9kZS5ub2RlTmFtZV0ucmVnaXN0ZXJlZFJlc2l6ZUNhbGxiYWNrcyA9IFtdO1xuXHRcdG5vZGVTdGF0ZUNhY2hlW25vZGUubm9kZU5hbWVdLmxhc3RXaWR0aCA9IG5vZGUuaW5uZXJXaWR0aCB8fCBub2RlLmNsaWVudFdpZHRoO1xuXHRcdG5vZGVTdGF0ZUNhY2hlW25vZGUubm9kZU5hbWVdLmxhc3RIZWlnaHQgPSBub2RlLmlubmVySGVpZ2h0IHx8IG5vZGUuY2xpZW50SGVpZ2h0O1xuXHR9IGVsc2Uge1xuXHRcdG5vZGVTdGF0ZUNhY2hlW25vZGUubm9kZU5hbWVdLnJlZ2lzdGVyZWRSZXNpemVDYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0bm9kZVN0YXRlQ2FjaGVbbm9kZS5ub2RlTmFtZV0ucmVnaXN0ZXJlZFJlc2l6ZUNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcblxuXHR0cnkge1xuXHRcdG5vZGUuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgZXZlbnRIYW5kbGVyKTtcblx0fSBjYXRjaCAoZSkge1xuXHRcdG5vZGUuYXR0YWNoRXZlbnQoJ29ucmVzaXplJywgZXZlbnRIYW5kbGVyKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGV2ZW50SGFuZGxlcihlKSB7XG5cdFx0cmV0dXJuIChmdW5jdGlvbihub2RlKSB7XG5cdFx0XHR2YXIgd2lkdGggPSBub2RlLmlubmVyV2lkdGg7XG5cdFx0XHR2YXIgaGVpZ2h0ID0gbm9kZS5pbm5lckhlaWdodDtcblxuXHRcdFx0aWYgKCF3aWR0aCkge1xuXHRcdFx0XHR3aWR0aCA9IG5vZGUuY2xpZW50V2lkdGg7XG5cdFx0XHR9XG5cdFx0XHRpZiAoIWhlaWdodCkge1xuXHRcdFx0XHRoZWlnaHQgPSBub2RlLmNsaWVudEhlaWdodDtcblx0XHRcdH1cblxuXHRcdFx0dmFyIGhvckRpZmYgPSBudWxsO1xuXHRcdFx0dmFyIHZlcnREaWZmID0gbnVsbDtcblx0XHRcdGlmICh3aWR0aCAhPSBub2RlU3RhdGVDYWNoZVtub2RlLm5vZGVOYW1lXS5sYXN0V2lkdGgpIHtcblx0XHRcdFx0aG9yRGlmZiA9ICh3aWR0aCAtIG5vZGVTdGF0ZUNhY2hlW25vZGUubm9kZU5hbWVdLmxhc3RXaWR0aCB8fCAwKTtcblx0XHRcdH1cblx0XHRcdGlmIChoZWlnaHQgIT0gbm9kZVN0YXRlQ2FjaGVbbm9kZS5ub2RlTmFtZV0ubGFzdEhlaWdodCkge1xuXHRcdFx0XHR2ZXJ0RGlmZiA9IChoZWlnaHQgLSBub2RlU3RhdGVDYWNoZVtub2RlLm5vZGVOYW1lXS5sYXN0SGVpZ2h0IHx8IDApO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBpdGVyYXRlIHRocm91Z2ggYWxsIHJlZ2lzdGVyZWQgcmVzaXplIGV2ZW50cyBmb3IgdGhpcyBub2RlXG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IG5vZGVTdGF0ZUNhY2hlW25vZGUubm9kZU5hbWVdLnJlZ2lzdGVyZWRSZXNpemVDYWxsYmFja3MubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0aWYgKHR5cGVvZiBub2RlU3RhdGVDYWNoZVtub2RlLm5vZGVOYW1lXS5yZWdpc3RlcmVkUmVzaXplQ2FsbGJhY2tzW2ldID09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRub2RlU3RhdGVDYWNoZVtub2RlLm5vZGVOYW1lXS5yZWdpc3RlcmVkUmVzaXplQ2FsbGJhY2tzW2ldLmNhbGwobm9kZSwgZSwgaG9yRGlmZiwgdmVydERpZmYpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdG5vZGVTdGF0ZUNhY2hlW25vZGUubm9kZU5hbWVdLmxhc3RXaWR0aCA9IHdpZHRoO1xuXHRcdFx0bm9kZVN0YXRlQ2FjaGVbbm9kZS5ub2RlTmFtZV0ubGFzdEhlaWdodCA9IGhlaWdodDtcblx0XHR9KShub2RlKTtcblx0fVxufVxuXG5FdmVudHMub25Ob2RlSG9yaXpvbnRhbFJlc2l6ZUV2ZW50ID0gZnVuY3Rpb24obm9kZSwgY2FsbGJhY2spIHtcblx0RXZlbnRzLm9uTm9kZVJlc2l6ZUV2ZW50KG5vZGUsIGZ1bmN0aW9uKGUsIGhvcml6b250YWxEaWZmLCB2ZXJ0aWNhbERpZmYpIHtcblx0XHRpZiAoaG9yaXpvbnRhbERpZmYpIHtcblx0XHRcdGNhbGxiYWNrLmNhbGwobm9kZSwgaG9yaXpvbnRhbERpZmYpO1xuXHRcdH1cblx0fSk7XG59O1xuXG5FdmVudHMub25Ob2RlVmVydGljYWxSZXNpemVFdmVudCA9IGZ1bmN0aW9uKG5vZGUsIGNhbGxiYWNrKSB7XG5cdEV2ZW50cy5vbk5vZGVSZXNpemVFdmVudChub2RlLCBmdW5jdGlvbihlLCBob3Jpem9udGFsRGlmZiwgdmVydGljYWxEaWZmKSB7XG5cdFx0aWYgKHZlcnRpY2FsRGlmZikge1xuXHRcdFx0Y2FsbGJhY2suY2FsbChub2RlLCB2ZXJ0aWNhbERpZmYpO1xuXHRcdH1cblx0fSk7XG59O1xuXG5FdmVudHMub25Ob2RlU2Nyb2xsRXZlbnQgPSBmdW5jdGlvbihub2RlLCBjYWxsYmFjaykge1xuXHRpZiAoIW5vZGVTdGF0ZUNhY2hlW25vZGUubm9kZU5hbWVdKSB7XG5cdFx0bm9kZVN0YXRlQ2FjaGVbbm9kZS5ub2RlTmFtZV0gPSB7fTtcblx0fVxuXHRpZiAoIW5vZGVTdGF0ZUNhY2hlW25vZGUubm9kZU5hbWVdLm9uTm9kZVNjcm9sbEV2ZW50KSB7XG5cdFx0bm9kZVN0YXRlQ2FjaGVbbm9kZS5ub2RlTmFtZV0ub25Ob2RlU2Nyb2xsRXZlbnQgPSB0cnVlO1xuXHRcdG5vZGVTdGF0ZUNhY2hlW25vZGUubm9kZU5hbWVdLnJlZ2lzdGVyZWRTY3JvbGxDYWxsYmFja3MgPSBbXTtcblx0fSBlbHNlIHtcblx0XHRub2RlU3RhdGVDYWNoZVtub2RlLm5vZGVOYW1lXS5yZWdpc3RlcmVkU2Nyb2xsQ2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuXHRcdHJldHVybjtcblx0fVxuXG5cdG5vZGVTdGF0ZUNhY2hlW25vZGUubm9kZU5hbWVdLnJlZ2lzdGVyZWRTY3JvbGxDYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG5cblx0dHJ5IHtcblx0XHRub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIGV2ZW50SGFuZGxlcik7XG5cdH0gY2F0Y2ggKGUpIHtcblx0XHRub2RlLmF0dGFjaEV2ZW50KCdvbnNjcm9sbCcsIGV2ZW50SGFuZGxlcik7XG5cdH1cblxuXHRmdW5jdGlvbiBldmVudEhhbmRsZXIoZSkge1xuXHRcdHJldHVybiAoZnVuY3Rpb24obm9kZSkge1xuXHRcdFx0Ly8gaXRlcmF0ZSB0aHJvdWdoIGFsbCByZWdpc3RlcmVkIHJlc2l6ZSBldmVudHMgZm9yIHRoaXMgbm9kZVxuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBub2RlU3RhdGVDYWNoZVtub2RlLm5vZGVOYW1lXS5yZWdpc3RlcmVkU2Nyb2xsQ2FsbGJhY2tzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGlmICh0eXBlb2Ygbm9kZVN0YXRlQ2FjaGVbbm9kZS5ub2RlTmFtZV0ucmVnaXN0ZXJlZFNjcm9sbENhbGxiYWNrc1tpXSA9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0bm9kZVN0YXRlQ2FjaGVbbm9kZS5ub2RlTmFtZV0ucmVnaXN0ZXJlZFNjcm9sbENhbGxiYWNrc1tpXS5jYWxsKG5vZGUsIGUpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSkobm9kZSk7XG5cdH1cbn07XG5cbi8vIGVtaXRzIGFuIGV2ZW50IHdoZW5ldmVyIHRoZSBib3R0b20gc2Nyb2xsIG9mZnNldCBvZiBhIGdpdmVuIG5vZGVcbi8vIGlzIGEgY2VydGFpbiBvZmZzZXRWYWx1ZSBmcm9tIHRoZSBhYnNvbHV0ZSBib3R0b20gb2YgdGhlIHZpZXdwb3J0LlxuRXZlbnRzLm9uTm9kZVNjcm9sbEJvdHRvbU9mZnNldEV2ZW50ID0gZnVuY3Rpb24obm9kZSwgb2Zmc2V0VmFsdWUsIGNhbGxiYWNrKSB7XG5cdEV2ZW50cy5vbk5vZGVTY3JvbGxFdmVudChub2RlLCBjYWxsYmFjayk7XG59O1xuXG4vLyBleGVjdXRlcyBldmVudCBcImNhbGxiYWNrc1wiIG9uIGEgbm9kZSBldmVudCBhbmQgc3RvcmVzIHRoZW1cbi8vIGZvciBmdXR1cmUgY2FzZXMgb2Ygc3VjaCBldmVudCBoYXBwZW5pbmcuXG4vLyBXYXJuaW5nOiBldmVudCBvYmplY3Qgd2lsbCBub3QgYmUgaW5zdGFudGx5IGF2YWlsYWJsZSBmb3Jcbi8vIGNhbGxiYWNrIHRvIHJlY2VpdmUgZHVlIHRvIGNhbGxiYWNrIGJlaW5nIGNhbGxlZFxuLy8gYmVmb3JlIGJlaW5nIHF1ZXVlZCB1cCBmb3IgaXRzIGNvcnJlc3BvbmRpbmcgZXZlbnQuXG5FdmVudHMubm93QW5kT25Ob2RlRXZlbnQgPSBmdW5jdGlvbihub2RlLCBldmVudE5hbWUsIGNhbGxiYWNrKSB7XG5cdGNhbGxiYWNrLmNhbGwobm9kZSwgbnVsbCk7XG5cdEV2ZW50cy5vbk5vZGVFdmVudChub2RlLCBldmVudE5hbWUsIGNhbGxiYWNrKTtcbn07XG5cbi8qKlxuICogVHJpZ2dlcnMgZG9tIGV2ZW50XG4gKi9cbkV2ZW50cy5lbWl0Tm9kZUV2ZW50ID0gZnVuY3Rpb24oKSB7XG5cbn07XG5cbi8qKlxuICogUmVnaXN0ZXJzIG5ldyBhcHAgZXZlbnQgYW5kIGZpcmVzXG4gKiBwYXNzZWQgY2FsbGJhY2sgd2hlbiBlbWl0dGVkIFxuICovXG5FdmVudHMucmVnaXN0ZXJHbG9iYWxFdmVudCA9IGZ1bmN0aW9uKGV2ZW50TmFtZSwgY2FsbGJhY2spIHtcblx0aWYgKCF0aGlzLnJlZ2lzdGVyZWRHbG9iYWxFdmVudHNbZXZlbnROYW1lXSkge1xuXHRcdHRoaXMucmVnaXN0ZXJlZEdsb2JhbEV2ZW50c1tldmVudE5hbWVdID0gW107XG5cdH1cblxuXHR0aGlzLnJlZ2lzdGVyZWRHbG9iYWxFdmVudHNbZXZlbnROYW1lXS5wdXNoKGNhbGxiYWNrKTtcbn1cblxuLyoqXG4gKiBUcmlnZ2VycyByZWdpc3RlcmVkIGFwcCBldmVudHNcbiAqIGJ5IGNhbGxpbmcgY2FsbGJhY2tzIGFzc2lnbmVkIHRvXG4gKiB0aGF0IGV2ZW50TmFtZVxuICovXG5FdmVudHMuZW1pdFJlZ2lzdGVyZWRHbG9iYWxFdmVudCA9IGZ1bmN0aW9uKGV2ZW50TmFtZSwgYXJncykge1xuXHRpZiAoIXJlZ2lzdGVyZWRHbG9iYWxFdmVudHNbZXZlbnROYW1lXSkge1xuXHRcdHJldHVybjtcblx0fVxuXG5cdGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5yZWdpc3RlcmVkR2xvYmFsRXZlbnRzW2V2ZW50TmFtZV0ubGVuZ3RoOyBpKyspIHtcblx0XHR0aGlzLnJlZ2lzdGVyZWRHbG9iYWxFdmVudHNbZXZlbnROYW1lXVtpXS5hcHBseSh0aGlzLCBhcmdzKTtcblx0fVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBFdmVudHM7IiwiLyoqXG4gKiBJbWFnZSBvYmplY3QgbW9kdWxlLiBBZGRzIGltYWdlIHByb3BlcnRpZXMgYW5kIGV2ZW50IGxpc3RlbmVycy5cbiAqXG4gKiBAYXV0aG9yIGp1YW52YWxsZWpvXG4gKiBAZGF0ZSA4LzIxLzE2XG4gKi9cblxuZnVuY3Rpb24gSW1nKEV2ZW50cywgbWFpbldpbmRvdywgc291cmNlKSB7XG5cdHZhciBzZWxmID0gdGhpcztcblxuXHR0aGlzLm5vZGUgPSBuZXcgSW1hZ2UoKTtcblx0dGhpcy5ub2RlLnNyYyA9IHNvdXJjZTtcblxuXHR0aGlzLmhhc0xvYWRlZCA9IGZhbHNlO1xuXHR0aGlzLnNvdXJjZSA9IHNvdXJjZTtcblxuXHR0aGlzLmV2ZW50cyA9IHt9O1xuXG5cdHRoaXMuc2V0U291cmNlID0gZnVuY3Rpb24oc291cmNlKSB7XG5cdFx0dGhpcy5zb3VyY2UgPSBzb3VyY2U7XG5cdFx0dGhpcy5ub2RlLnNyYyA9IHNvdXJjZTtcblx0fTtcblxuXHQvLyByZXRyaWV2ZSB0aGlzIG5vZGUncyBjb21wdXRlZCBzdHlsZSBmb3Igc3BlY2lmaWMgcHJvcGVydHlcblx0dGhpcy5nZXRDU1NDb21wdXRlZFN0eWxlID0gZnVuY3Rpb24ocHJvcGVydHkpIHtcblx0XHRyZXR1cm4gbWFpbldpbmRvdy5nZXRDb21wdXRlZFN0eWxlKHRoaXMubm9kZSkuZ2V0UHJvcGVydHlWYWx1ZShwcm9wZXJ0eSk7XG5cdH07XG5cblx0dGhpcy5nZXRDU1NDb21wdXRlZFN0eWxlQXNJbnQgPSBmdW5jdGlvbihwcm9wZXJ0eSkge1xuXHRcdHJldHVybiBwYXJzZUludCh0aGlzLmdldENTU0NvbXB1dGVkU3R5bGUocHJvcGVydHkpLnNwbGl0KFwicHhcIilbMF0pO1xuXHR9O1xuXG5cdHRoaXMuZ2V0Tm9kZSA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLm5vZGU7XG5cdH07XG5cblx0dGhpcy5sb2FkRXZlbnRIYW5kbGVyID0gZnVuY3Rpb24oZSkge1xuXHRcdGlmIChzZWxmLmV2ZW50c1snbG9hZCddKSB7XG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHNlbGYuZXZlbnRzWydsb2FkJ10ubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0c2VsZi5ldmVudHNbJ2xvYWQnXVtpXS5jYWxsKHNlbGYsIG51bGwsIGUpO1xuXHRcdFx0fVxuXHRcdH1cblx0fTtcblxuXHR0aGlzLmxvYWRFcnJvckV2ZW50SGFuZGxlciA9IGZ1bmN0aW9uKGVycikge1xuXHRcdGlmIChzZWxmLmV2ZW50c1snbG9hZCddKSB7XG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHNlbGYuZXZlbnRzWydsb2FkJ10ubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0c2VsZi5ldmVudHNbJ2xvYWQnXVtpXS5jYWxsKHNlbGYsIGVycik7XG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xuXG5cdC8vIHJlZ2lzdGVyIGFuIGV2ZW50IGNhbGxiYWNrIGZvciB0aGlzIGluc3RhbmNlXG5cdHRoaXMub24gPSBmdW5jdGlvbihldmVudE5hbWUsIGNhbGxiYWNrKSB7XG5cdFx0aWYgKCF0aGlzLmV2ZW50c1tldmVudE5hbWVdKSB7XG5cdFx0XHR0aGlzLmV2ZW50c1tldmVudE5hbWVdID0gW107XG5cdFx0fVxuXG5cdFx0dGhpcy5ldmVudHNbZXZlbnROYW1lXS5wdXNoKGNhbGxiYWNrKTtcblx0fTtcblxuXHQvLyBhdHRhY2ggZXZlbnRzXG5cdGF0dGFjaEV2ZW50TG9hZChFdmVudHMsIHRoaXMubm9kZSwgdGhpcy5sb2FkRXZlbnRIYW5kbGVyKTtcblx0YXR0YWNoRXZlbnRMb2FkRXJyb3IoRXZlbnRzLCB0aGlzLm5vZGUsIHRoaXMubG9hZEVycm9yRXZlbnRIYW5kbGVyKTtcbn07XG5cbi8vIGludGVybmFsIG9iamVjdCBmdW5jdGlvbnNcbmZ1bmN0aW9uIGF0dGFjaEV2ZW50TG9hZChFdmVudHMsIG5vZGUsIGhhbmRsZXIpIHtcblx0RXZlbnRzLm9uTm9kZUV2ZW50KG5vZGUsICdsb2FkJywgaGFuZGxlcik7XG59XG5cbmZ1bmN0aW9uIGF0dGFjaEV2ZW50TG9hZEVycm9yKEV2ZW50cywgbm9kZSwgaGFuZGxlcikge1xuXHRFdmVudHMub25Ob2RlRXZlbnQobm9kZSwgJ2Vycm9yJywgaGFuZGxlcik7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gSW1nOyIsIi8qKlxuICogQXBwbGljYXRpb24gaW50ZXJmYWNlIG1hbmFnZXIuIEV4cG9zZXMgYWxsIGludGVyZmFjZSBtb2R1bGVzIHRvIGdsb2JhbCBzY29wZS5cbiAqXG4gKiBAYXV0aG9yIGp1YW52YWxsZWpvXG4gKiBAZGF0ZSA1LzMxLzE1XG4gKi9cblxudmFyIEludGVyZmFjZSA9IHJlcXVpcmUoJy4vaW50ZXJmYWNlcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEludGVyZmFjZTsiLCIvKipcbiAqIEJvYXJkIGludGVyZmFjZSBtb2R1bGUgLSBjb25zaXN0cyBvZiBhIFwid3JhcHBlclwiIHJvb3Qgbm9kZSBhbmQgYSBcIm5vdGljZVwiIGFsZXJ0IG5vZGVcbiAqL1xuXG52YXIgRW52aXJvbm1lbnQgPSByZXF1aXJlKCcuLi9lbnZpcm9ubWVudC5qcycpO1xudmFyIFBpY3R1cmUgPSByZXF1aXJlKCcuLi9waWN0dXJlLmpzJyk7XG52YXIgSW1nID0gcmVxdWlyZSgnLi4vaW1hZ2UuanMnKTtcblxuLy8gcHJpdmF0ZSBmaWVsZHMgYW5kIGZ1bmN0aW9uc1xudmFyIGlzU2V0ID0gZmFsc2U7XG52YXIgbm9kZXMgPSB7XG5cdC8vIHVzZWQgdG8gZGlzcGxheSBhbGVydHMgYW5kIGJvYXJkIGluZm9cblx0YWxlcnROb2RlOiBudWxsLFxuXHRhbGVydE5vZGVDb21wb25lbnRzOiB7XG5cdFx0Ym9keTogbnVsbCxcblx0XHRleHRyYTogbnVsbFxuXHR9LFxuXG5cdGxvYWRlck5vZGU6IG51bGwsXG5cblx0Ly8gaG9sZHMgbWFpbiBib2FyZCBjb21wb25lbnQgKGV4Y2x1c2l2ZSBvZiB0aGUgYWxlcnROb2RlKVxuXHRyb290Tm9kZTogbnVsbFxufTtcblxudmFyIGV2ZW50cyA9IHt9O1xudmFyIGNhY2hlID0ge307XG5cbnZhciBsb2FkZWRJbWFnZUNvdW50ID0gMDtcbnZhciBpc0xvYWRpbmcgPSBmYWxzZTtcbnZhciBpc0xvYWRlZEltYWdlcyA9IGZhbHNlO1xudmFyIGlzQ3JlYXRlZCA9IGZhbHNlO1xudmFyIHBhcmVudE5vZGVDYWNoZSA9IHt9O1xudmFyIHJlc3RyaWN0ZWROYW1lcyA9IFtcblx0J2RhdGEnLFxuXHQncmVzdHJpY3RlZCcsXG5cdCc0MDQnLFxuXHQndW5kZWZpbmVkJ1xuXTtcblxudmFyIEJvYXJkID0ge307XG5cbkJvYXJkLmFsZXJ0Tm9kZUNvbXBvbmVudHMgPSB7XG5cdGJvZHk6ICdVbnRpdGxlZCcsXG5cdGV4dHJhOiBudWxsXG59O1xuXG5Cb2FyZC5hbGJ1bVJlcXVlc3RDb21wb25lbnRzID0ge1xuXHRhbmNob3I6IDAsXG5cdGxpbWl0OiBFbnZpcm9ubWVudC5pdGVtQW1vdW50UGFnZUxvYWRcbn07XG5cbkJvYXJkLnBpY3R1cmVzID0gW107XG5cbkJvYXJkLmlzTmFtZVJlc3RyaWN0ZWQgPSBmdW5jdGlvbihuYW1lKSB7XG5cdHJldHVybiByZXN0cmljdGVkTmFtZXMuaW5kZXhPZihuYW1lLnRvTG93ZXJDYXNlKCkpICE9IC0xO1xufTtcblxuQm9hcmQuaXNOYW1lSW52YWxpZCA9IGZ1bmN0aW9uKG5hbWUpIHtcblx0cmV0dXJuIG5hbWUudG9Mb3dlckNhc2UoKS5tYXRjaCgvW15hLXowLTlcXC1cXC5cXCtcXF9cXCBdL2dpKTtcbn07XG5cbkJvYXJkLmlzTmFtZVdpdGhTcGFjZXMgPSBmdW5jdGlvbihuYW1lKSB7XG5cdHJldHVybiBuYW1lLm1hdGNoKC9bXFwgXS9nKTtcbn07XG5cbkJvYXJkLmlzU2V0ID0gZnVuY3Rpb24oKSB7XG5cdEJvYXJkLmRldGVjdCgpO1xuXHRyZXR1cm4gaXNTZXQ7XG59O1xuXG5Cb2FyZC5kZXRlY3QgPSBmdW5jdGlvbigpIHtcblxuXHRpZiAoIXdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZS5zcGxpdCgnLycpWzFdKSB7XG5cdFx0d2luZG93LmRvY3VtZW50LnRpdGxlID0gRW52aXJvbm1lbnQuYXBwLnRpdGxlO1xuXHRcdGlzU2V0ID0gZmFsc2U7XG5cdFx0cmV0dXJuIEJvYXJkO1xuXHR9XG5cblx0aXNTZXQgPSB0cnVlO1xuXHR3aW5kb3cuZG9jdW1lbnQudGl0bGUgPSAnUGljdHJlIC0gJyArIEJvYXJkLmdldE5hbWUoKTtcblxuXHRyZXR1cm4gQm9hcmQ7XG59XG5cbkJvYXJkLmdldE5hbWUgPSBmdW5jdGlvbigpIHtcblx0dmFyIGJvYXJkO1xuXG5cdC8vIGNhcGl0YWxpemUgbmFtZSBvZiBib2FyZFxuXHRpZiAoaXNTZXQpIHtcblx0XHR2YXIgbmFtZSA9IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZS5zcGxpdChcIi9cIilbMV0udG9Mb3dlckNhc2UoKTtcblx0XHR2YXIgbmFtZUFycmF5ID0gbmFtZS5zcGxpdCgnJyk7XG5cdFx0bmFtZUFycmF5LnNwbGljZSgwLCAxKTtcblxuXHRcdHZhciBuYW1lRmlyc3RDaGFyID0gbmFtZS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKTtcblx0XHRib2FyZCA9IG5hbWVGaXJzdENoYXIgKyBuYW1lQXJyYXkuam9pbignJyk7XG5cdH1cblxuXHRyZXR1cm4gYm9hcmQ7XG5cbn1cblxuQm9hcmQuc2V0TG9hZGVyV2l0aEVycm9yID0gZnVuY3Rpb24ocmF0aW8pIHtcblx0aWYgKCFub2Rlcy5sb2FkZXJOb2RlKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0Qm9hcmQuc2V0TG9hZGVyKHJhdGlvLCBmdW5jdGlvbihwcm9ncmVzc0Jhcikge1xuXHRcdHByb2dyZXNzQmFyLnN0eWxlLmJhY2tncm91bmQgPSAncmdiYSgyMDUsNTUsMCwgMC42KSc7XG5cdH0pO1xufVxuXG5Cb2FyZC5zZXRMb2FkZXIgPSBmdW5jdGlvbihyYXRpbywgY2FsbGJhY2spIHtcblx0aWYgKCFub2Rlcy5sb2FkZXJOb2RlIHx8ICFub2Rlcy5sb2FkZXJOb2RlLmNoaWxkcmVuKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0bm9kZXMubG9hZGVyTm9kZS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcblx0bm9kZXMubG9hZGVyTm9kZS5jaGlsZHJlblswXS5zdHlsZS53aWR0aCA9IE1hdGgubWF4KHJhdGlvICogMTAwLCAwKSArICclJztcblxuXHRpZiAodHlwZW9mIGNhbGxiYWNrID09ICdmdW5jdGlvbicpIHtcblx0XHRjYWxsYmFjay5jYWxsKEJvYXJkLCBub2Rlcy5sb2FkZXJOb2RlLmNoaWxkcmVuWzBdKTtcblx0fVxufTtcblxuQm9hcmQudW5zZXRMb2FkZXIgPSBmdW5jdGlvbigpIHtcblx0aWYgKCFub2Rlcy5sb2FkZXJOb2RlKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdG5vZGVzLmxvYWRlck5vZGUuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbn07XG5cbi8vIGxvYWRzIGEgc2luZ2xlIGFwaSBpbWFnZSBpbnRvIHRoZSBib2FyZFxuQm9hcmQubG9hZEltYWdlID0gZnVuY3Rpb24oSW50ZXJmYWNlcywgRXZlbnRzLCBtYWluV2luZG93LCBvYmplY3QsIGltYWdlTG9hZEhhbmRsZXIpIHtcblx0dmFyIHBpY3R1cmUgPSBuZXcgUGljdHVyZShJbnRlcmZhY2VzLCBFdmVudHMsIG1haW5XaW5kb3cpO1xuXHRwaWN0dXJlLnNldE5vZGVJRCgncGljJyArIG9iamVjdC5pZCk7XG5cdHBpY3R1cmUuc2V0RGF0YShvYmplY3QpO1xuXHRwaWN0dXJlLnNldFBhcmVudE5vZGUobm9kZXMucm9vdE5vZGUpO1xuXHRwaWN0dXJlLmFkZENsaWNrSGFuZGxlcihmdW5jdGlvbihlKSB7XG5cdFx0SW50ZXJmYWNlcy5vdmVybGF5LnNob3dXaXRoUGljdHVyZShJbnRlcmZhY2VzLCBFdmVudHMsIG1haW5XaW5kb3csIHRoaXMpO1xuXHR9KTtcblxuXHRCb2FyZC5waWN0dXJlcy5wdXNoKHBpY3R1cmUpO1xuXG5cdC8vIHJlLXBvc2l0aW9uIGxvYWRpbmcgaW1hZ2Vcblx0aWYgKEJvYXJkLmdldFJlcXVlc3RBbmNob3IoKSkge1xuXHRcdEJvYXJkLmNoaXNlbChtYWluV2luZG93LCBub2Rlcy5yb290Tm9kZSwgQm9hcmQucGljdHVyZXMsIEJvYXJkLmdldFJlcXVlc3RBbmNob3IoKSk7XG5cdH1cblxuXHR2YXIgaW1hZ2UgPSBuZXcgSW1nKEV2ZW50cywgbWFpbldpbmRvdywgRW52aXJvbm1lbnQuYmFzZUFQSVVybCArICcvJyArIG9iamVjdC50aHVtYik7XG5cblx0aWYgKCFCb2FyZC5nZXRSZXF1ZXN0QW5jaG9yKCkgJiYgIWlzTG9hZGVkSW1hZ2VzICYmIG5vZGVzLnJvb3ROb2RlLnN0eWxlLmRpc3BsYXkgIT0gJ25vbmUnKSB7XG5cdFx0bm9kZXMucm9vdE5vZGUuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblx0fVxuXG5cdGltYWdlLm9uKCdsb2FkJywgZnVuY3Rpb24oZXJyLCBlKSB7XG5cdFx0aWYgKCFlcnIpIHtcblx0XHRcdHJldHVybiAoZnVuY3Rpb24ocGljdHVyZSwgaW1hZ2UpIHtcblx0XHRcdFx0aW1hZ2VMb2FkSGFuZGxlcihwaWN0dXJlLCBpbWFnZSk7XG5cdFx0XHR9KShwaWN0dXJlLCBpbWFnZSk7XG5cdFx0fVxuXG5cdFx0Ly8gYXNzdW1lIGVycm9yIGxvYWRpbmcgaW1hZ2Vcblx0XHR2YXIgaGVpZ2h0ID0gRW52aXJvbm1lbnQubWF4SW1hZ2VIZWlnaHQ7XG5cdFx0dmFyIHBhZGRpbmdUb3AgPSBwaWN0dXJlLmdldENTU0NvbXB1dGVkU3R5bGVBc0ludChtYWluV2luZG93LCAncGFkZGluZy10b3AnKSArIDE7XG5cdFx0dmFyIHBhZGRpbmdCb3R0b20gPSBwaWN0dXJlLmdldENTU0NvbXB1dGVkU3R5bGVBc0ludChtYWluV2luZG93LCAncGFkZGluZy1ib3R0b20nKSArIDE7XG5cblx0XHR2YXIgZXJySW1nID0gbmV3IEltZyhFdmVudHMsIG1haW5XaW5kb3csICcvc3RhdGljL2kvUGljdHJlLTQwNC5wbmcnKTtcblxuXHRcdHRoaXMuc2V0RGF0YVZhbHVlKCdzcmMnLCAnL3N0YXRpYy9pL1BpY3RyZS00MDQuZnVsbC5wbmcnKTtcblx0XHR0aGlzLnNldENTU1Byb3BlcnR5VmFsdWUoJ2hlaWdodCcsIChoZWlnaHQgLSBwYWRkaW5nVG9wICsgcGFkZGluZ0JvdHRvbSAqIDIpICsgJ3B4Jyk7XG5cblx0XHRpbWFnZUxvYWRIYW5kbGVyKHRoaXMsIGVyckltZyk7XG5cdH0uYmluZChwaWN0dXJlKSk7XG59O1xuXG4vLyBsb2FkcyBhIGpzb24gYXJyYXkgb2YgaW1hZ2VzIGludG8gdGhlIGJvYXJkXG5Cb2FyZC5sb2FkID0gZnVuY3Rpb24oSW50ZXJmYWNlcywgRXZlbnRzLCBtYWluV2luZG93LCBvYmplY3RzKSB7XG5cdGZ1bmN0aW9uIGhhbmRsZXIocGljdHVyZSwgaW1hZ2UpIHtcblx0XHRwaWN0dXJlLnNldElubmVyVGV4dCgnJyk7XG5cdFx0cGljdHVyZS5hZGRJbWFnZShpbWFnZSk7XG5cdFx0Qm9hcmQuaW1hZ2VMb2FkSGFuZGxlcihtYWluV2luZG93LCBvYmplY3RzLmxlbmd0aCk7XG5cdH1cblxuXHRmb3IgKHZhciBpIGluIG9iamVjdHMpIHtcblx0XHRCb2FyZC5sb2FkSW1hZ2UoSW50ZXJmYWNlcywgRXZlbnRzLCBtYWluV2luZG93LCBvYmplY3RzW2ldLCBoYW5kbGVyKTtcblx0fVxufTtcblxuLy8gY2FsbGVkIHdoZW4gYSBzaW5nbGUgaW1hZ2UgaXMgbG9hZGVkXG5Cb2FyZC5pbWFnZUxvYWRIYW5kbGVyID0gZnVuY3Rpb24obWFpbldpbmRvdywgc2V0Q291bnQpIHtcblx0bG9hZGVkSW1hZ2VDb3VudCsrO1xuXG5cdC8vIG5vIGFuY2hvciBtZWFucyBibGFuayByb29tIGZvciBsb2FkZXJcblx0aWYgKCFCb2FyZC5nZXRSZXF1ZXN0QW5jaG9yKCkpIHtcblx0XHRCb2FyZC5zZXRMb2FkZXIobG9hZGVkSW1hZ2VDb3VudCAvIHNldENvdW50KTtcblx0fSBlbHNlIHtcblx0XHRCb2FyZC5jaGlzZWwobWFpbldpbmRvdywgbm9kZXMucm9vdE5vZGUsIEJvYXJkLnBpY3R1cmVzLCBCb2FyZC5nZXRSZXF1ZXN0QW5jaG9yKCkpO1xuXHR9XG5cblx0aWYgKGxvYWRlZEltYWdlQ291bnQgPT0gc2V0Q291bnQpIHtcblx0XHRsb2FkZWRJbWFnZUNvdW50ID0gMDtcblx0XHRpc0xvYWRpbmcgPSBmYWxzZTtcblxuXHRcdC8vIGlmIGFuY2hvciBpcyAwLCB0aGF0IG1lYW5zIGxvYWRpbmcgaW1hZ2VzIGZvclxuXHRcdC8vIHRoZSBmaXJzdCB0aW1lLiBTZXQgbG9hZGVyIGJhciB0byBmdWxsXG5cdFx0aWYgKCFCb2FyZC5hbGJ1bVJlcXVlc3RDb21wb25lbnRzLmFuY2hvcikge1xuXHRcdFx0Qm9hcmQudW5zZXRMb2FkZXIoKTtcblx0XHRcdG5vZGVzLnJvb3ROb2RlLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuXHRcdH1cblxuXHRcdC8vIGVtaXQgJ2xvYWQnIGV2ZW50XG5cdFx0Qm9hcmQuZW1pdCgnbG9hZCcsIFtzZXRDb3VudF0pO1xuXHR9XG59O1xuXG4vLyBwZXJmb3JtcyBhIHJlbW90ZSBjYWxsIHRvIHRoZSBzZXJ2ZXIgYXBpLCBmZXRjaGluZyBldmVyeSBpbWFnZSxcbi8vIGFzIHdlbGwgYXMgdG90YWwgaW1hZ2UgY291bnQsIGF2YWlsYWJsZSBmb3IgdGhlIGN1cnJlbnQgYWxidW1cbkJvYXJkLnVwZGF0ZSA9IGZ1bmN0aW9uKEludGVyZmFjZXMsIEV2ZW50cywgU2VydmVyLCBtYWluV2luZG93KSB7XG5cdGlmICghaXNDcmVhdGVkIHx8IGlzTG9hZGluZykge1xuXHRcdHJldHVybjtcblx0fVxuXG5cdGlzTG9hZGluZyA9IHRydWU7XG5cblx0Ly8gcmVxdWVzdCBjdXJyZW50IHNldCBvZiBpbWFnZXNcblx0U2VydmVyLnNldFJlcXVlc3RBbmNob3IoQm9hcmQuZ2V0UmVxdWVzdEFuY2hvcigpKTtcblx0U2VydmVyLnNldFJlcXVlc3RMaW1pdChCb2FyZC5nZXRSZXF1ZXN0TGltaXQoKSk7XG5cdFNlcnZlci5nZXRBbGJ1bShCb2FyZC5nZXROYW1lKCkudG9Mb3dlckNhc2UoKSwgZnVuY3Rpb24oZXJyLCBkYXRhKSB7XG5cdFx0aWYgKGVycikge1xuXHRcdFx0Qm9hcmQuc2hvd0FsZXJ0KCdVbmFibGUgdG8gbG9hZCBpbWFnZXMgYXQgdGhpcyB0aW1lJyk7XG5cdFx0XHRCb2FyZC5zZXRMb2FkZXJXaXRoRXJyb3IoMSk7XG5cdFx0XHRyZXR1cm4gY29uc29sZS5sb2coJ0VSUiBTRVJWRVIgQUxCVU0gUkVRVUVTVCcsIGVycik7XG5cdFx0fVxuXG5cdFx0aWYgKCFkYXRhLmxlbmd0aCkge1xuXHRcdFx0Qm9hcmQuZW1pdCgnbG9hZCcpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdEJvYXJkLnNldEFsZXJ0RXh0cmEoZGF0YVswXS50b3RhbCk7XG5cdFx0Qm9hcmQubG9hZChJbnRlcmZhY2VzLCBFdmVudHMsIG1haW5XaW5kb3csIGRhdGEpO1xuXHR9KTtcblxuXHQvLyB1cGRhdGUgYWxlcnROb2RlQ29tcG9uZW50c1xuXHRCb2FyZC51cGRhdGVBbGVydENvbXBvbmVudHMoKTtcbn07XG5cbkJvYXJkLnVwZGF0ZUFsZXJ0Q29tcG9uZW50cyA9IGZ1bmN0aW9uKCkge1xuXHRpZiAoQm9hcmQuYWxlcnROb2RlQ29tcG9uZW50cy5leHRyYSkge1xuXHRcdG5vZGVzLmFsZXJ0Tm9kZUNvbXBvbmVudHMuZXh0cmEuaW5uZXJIVE1MID0gQm9hcmQuYWxlcnROb2RlQ29tcG9uZW50cy5leHRyYTtcblx0XHRub2Rlcy5hbGVydE5vZGVDb21wb25lbnRzLmV4dHJhLnRpdGxlID0gJ1RoaXMgYm9hcmQgY29udGFpbnMgJyArIEJvYXJkLmFsZXJ0Tm9kZUNvbXBvbmVudHMuZXh0cmEgKyAnIGltYWdlcyc7XG5cdH0gZWxzZSB7XG5cdFx0bm9kZXMuYWxlcnROb2RlQ29tcG9uZW50cy5leHRyYS5pbm5lckhUTUwgPSAnJztcblx0XHRub2Rlcy5hbGVydE5vZGVDb21wb25lbnRzLmV4dHJhLnRpdGxlID0gJyc7XG5cdH1cblx0bm9kZXMuYWxlcnROb2RlQ29tcG9uZW50cy5ib2R5LmlubmVySFRNTCA9IEJvYXJkLmFsZXJ0Tm9kZUNvbXBvbmVudHMuYm9keTtcbn07XG5cbi8vIGNyZWF0ZSBhbGwgYm9hcmQgY29tcG9uZW50c1xuQm9hcmQuY3JlYXRlID0gZnVuY3Rpb24oSW50ZXJmYWNlcywgRXZlbnRzLCBtYWluV2luZG93LCBwYXJlbnROb2RlKSB7XG5cdGlmICghaXNDcmVhdGVkKSB7XG5cdFx0aXNDcmVhdGVkID0gdHJ1ZTtcblx0fVxuXG5cdC8vIHVzZWQgZm9yIGRpc3BsYXlpbmcgYWxlcnRzIGFuZCBib2FyZCBpbmZvcm1hdGlvblxuXHQvLyBzaWJsaW5nIG9mIGFwcGxpY2F0aW9uIHdyYXBwZXJcblx0bm9kZXMuYWxlcnROb2RlID0gSW50ZXJmYWNlcy5jb250cm9sbGVyLmNyZWF0ZURpdk5vZGUobWFpbldpbmRvdyk7XG5cdG5vZGVzLmFsZXJ0Tm9kZS5jbGFzc05hbWUgPSAnUGljdHJlLW5vdGljZSc7XG5cblx0bm9kZXMuYWxlcnROb2RlQ29tcG9uZW50cy5leHRyYSA9IEludGVyZmFjZXMuY29udHJvbGxlci5jcmVhdGVEaXZOb2RlKG1haW5XaW5kb3cpO1xuXHRub2Rlcy5hbGVydE5vZGVDb21wb25lbnRzLmV4dHJhLmNsYXNzTmFtZSA9ICdQaWN0cmUtbm90aWNlLWV4dHJhJztcblxuXHRub2Rlcy5hbGVydE5vZGVDb21wb25lbnRzLmJvZHkgPSBJbnRlcmZhY2VzLmNvbnRyb2xsZXIuY3JlYXRlRGl2Tm9kZShtYWluV2luZG93KTtcblxuXHQvLyBjcmVhdGUgcm9vdCBcIndyYXBwZXJcIiBub2RlIChnb2VzIGluc2lkZSBvZiBhcHBsaWNhdGlvbiB3cmFwcGVyKVxuXHRub2Rlcy5yb290Tm9kZSA9IEludGVyZmFjZXMuY29udHJvbGxlci5jcmVhdGVEaXZOb2RlKG1haW5XaW5kb3cpO1xuXHRub2Rlcy5yb290Tm9kZS5pZCA9ICdQaWN0cmUtd3JhcHBlcic7XG5cdG5vZGVzLnJvb3ROb2RlLnN0eWxlLm1hcmdpblRvcCA9ICc1MnB4Jztcblx0bm9kZXMucm9vdE5vZGUuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG5cblx0Ly8gY3JlYXRlIGxvYWRlciBub2RlXG5cdHZhciBsb2FkZXJDaGlsZE5vZGUgPSBJbnRlcmZhY2VzLmNvbnRyb2xsZXIuY3JlYXRlRGl2Tm9kZShtYWluV2luZG93KTtcblx0bG9hZGVyQ2hpbGROb2RlLmNsYXNzTmFtZSA9ICdQaWN0cmUtbG9hZGVyLXByb2dyZXNzJztcblxuXHRub2Rlcy5sb2FkZXJOb2RlID0gSW50ZXJmYWNlcy5jb250cm9sbGVyLmNyZWF0ZURpdk5vZGUobWFpbldpbmRvdyk7XG5cdG5vZGVzLmxvYWRlck5vZGUuY2xhc3NOYW1lID0gJ1BpY3RyZS1sb2FkZXItd3JhcHBlcic7XG5cdG5vZGVzLmxvYWRlck5vZGUuc3R5bGUubWFyZ2luVG9wID0gJy02JSc7XG5cblx0Ly8gY3JlYXRlIG5vZGUgdHJlZVxuXHRub2Rlcy5hbGVydE5vZGUuYXBwZW5kQ2hpbGQobm9kZXMuYWxlcnROb2RlQ29tcG9uZW50cy5ib2R5KTtcblx0bm9kZXMuYWxlcnROb2RlLmFwcGVuZENoaWxkKG5vZGVzLmFsZXJ0Tm9kZUNvbXBvbmVudHMuZXh0cmEpO1xuXHRwYXJlbnROb2RlLmFwcGVuZENoaWxkKG5vZGVzLmFsZXJ0Tm9kZSk7XG5cdHBhcmVudE5vZGUuYXBwZW5kQ2hpbGQobm9kZXMucm9vdE5vZGUpO1xuXHRub2Rlcy5sb2FkZXJOb2RlLmFwcGVuZENoaWxkKGxvYWRlckNoaWxkTm9kZSk7XG5cdHBhcmVudE5vZGUuYXBwZW5kQ2hpbGQobm9kZXMubG9hZGVyTm9kZSk7XG5cblx0Ly8gY2VudGVyIG5vZGVzXG5cdEV2ZW50cy5ub3dBbmRPbk5vZGVFdmVudChtYWluV2luZG93LCAncmVzaXplJywgZnVuY3Rpb24oKSB7XG5cdFx0SW50ZXJmYWNlcy5jb250cm9sbGVyLmNlbnRlck5vZGVSZWxhdGl2ZVRvKG5vZGVzLmxvYWRlck5vZGUsIG1haW5XaW5kb3cpO1xuXHRcdEludGVyZmFjZXMuY29udHJvbGxlci5ob3Jpem9udGFsQ2VudGVyTm9kZVJlbGF0aXZlVG8obm9kZXMucm9vdE5vZGUsIG1haW5XaW5kb3cpO1xuXHR9KTtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyB2aWV3IGVsZW1lbnRzIGlmIG5vbi1leGlzdGVudCBhbmQgZGlzcGxheXMgYm9hcmQgY29tcG9uZW50cy5cbiAqL1xuQm9hcmQuc2hvdyA9IGZ1bmN0aW9uKEludGVyZmFjZXMsIEV2ZW50cywgU2VydmVyLCBtYWluV2luZG93LCBwYXJlbnROb2RlKSB7XG5cdGlmICghaXNDcmVhdGVkKSB7XG5cdFx0Qm9hcmQuY3JlYXRlKEludGVyZmFjZXMsIEV2ZW50cywgbWFpbldpbmRvdywgcGFyZW50Tm9kZSk7XG5cblx0XHQvLyBlbnN1cmUgdGhlc2UgZXZlbnRzIGFyZSBvbmx5IHJlZ2lzdGVyZWQgb25jZVxuXHRcdC8vIGJ5IHBsYWNpbmcgdGhlbSBpbnNpZGUgdGhpcyBsb2dpYyBibG9ja1xuXHRcdEJvYXJkLm9uKCdsb2FkJywgZnVuY3Rpb24oc2V0Q291bnQpIHtcblx0XHRcdHZhciBvZmZzZXQgPSBCb2FyZC5nZXRSZXF1ZXN0QW5jaG9yKCk7XG5cdFx0XHR2YXIgY291bnQgPSBCb2FyZC5nZXRBbGVydEV4dHJhKCk7XG5cdFx0XHRpZiAoIWNvdW50KSB7XG5cdFx0XHRcdGNvdW50ID0gc2V0Q291bnQ7XG5cdFx0XHR9XG5cblx0XHRcdGlmICghQm9hcmQuZ2V0UmVxdWVzdEFuY2hvcigpKSB7XG5cdFx0XHRcdEJvYXJkLnNob3dBbGVydChCb2FyZC5nZXROYW1lKCkgKyAnIFBpY3R1cmUgQm9hcmQnLCBjb3VudCk7XG5cdFx0XHRcdEJvYXJkLmNoaXNlbChtYWluV2luZG93LCBub2Rlcy5yb290Tm9kZSwgQm9hcmQucGljdHVyZXMsIG9mZnNldCk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIHVwZGF0ZSByZXF1ZXN0IHNldHRpbmdzIGZvciBuZXh0IHVwZGF0ZVxuXHRcdFx0Qm9hcmQuc2V0UmVxdWVzdEFuY2hvcihCb2FyZC5nZXRSZXF1ZXN0QW5jaG9yKCkgKyBCb2FyZC5nZXRSZXF1ZXN0TGltaXQoKSk7XG5cdFx0XHRCb2FyZC5zZXRSZXF1ZXN0TGltaXQoRW52aXJvbm1lbnQuaXRlbUFtb3VudFJlcXVlc3QpO1xuXHRcdH0pO1xuXG5cdFx0Qm9hcmQub24oJ2NoaXNlbCcsIGZ1bmN0aW9uKG5vZGUsIGl0ZW1NYXJnaW4pIHtcblx0XHRcdHBhcmVudE5vZGUuc3R5bGUuaGVpZ2h0ID0gKG5vZGUuc2Nyb2xsSGVpZ2h0ICsgaXRlbU1hcmdpbiAqIDIpICsgXCJweFwiO1xuXHRcdFx0SW50ZXJmYWNlcy5jb250cm9sbGVyLmhvcml6b250YWxDZW50ZXJOb2RlUmVsYXRpdmVUbyhub2RlLCBtYWluV2luZG93KTtcblx0XHR9KTtcblxuXHRcdEV2ZW50cy5vbk5vZGVIb3Jpem9udGFsUmVzaXplRXZlbnQobWFpbldpbmRvdywgZnVuY3Rpb24oZSwgZGlmZikge1xuXHRcdFx0Qm9hcmQuY2hpc2VsKHRoaXMsIG5vZGVzLnJvb3ROb2RlLCBCb2FyZC5waWN0dXJlcyk7XG5cdFx0fSk7XG5cblx0XHRFdmVudHMub25Ob2RlU2Nyb2xsRXZlbnQobWFpbldpbmRvdywgZnVuY3Rpb24oZSkge1xuXHRcdFx0dmFyIHRvdGFsVmlld0hlaWdodCA9IG5vZGVzLnJvb3ROb2RlLnNjcm9sbEhlaWdodCArIG5vZGVzLnJvb3ROb2RlLm9mZnNldFRvcDtcblx0XHRcdHZhciBzY3JvbGxPZmZzZXQgPSAodGhpcy5wYWdlWU9mZnNldCB8fCB0aGlzLmRvY3VtZW50LmJvZHkuc2Nyb2xsVG9wKSArIHRoaXMuaW5uZXJIZWlnaHQ7XG5cdFx0XHR2YXIgYm90dG9tT2Zmc2V0ID0gTWF0aC5mbG9vcih0aGlzLmlubmVySGVpZ2h0ICogMC4yNSk7XG5cblx0XHRcdC8vIHNjcm9sbCBhdCAyNSUgb2Zmc2V0IGZyb20gYm90dG9tXG5cdFx0XHRpZiAodG90YWxWaWV3SGVpZ2h0IC0gc2Nyb2xsT2Zmc2V0IC0gYm90dG9tT2Zmc2V0IDwgMCkge1xuXHRcdFx0XHRCb2FyZC51cGRhdGUoSW50ZXJmYWNlcywgRXZlbnRzLCBTZXJ2ZXIsIG1haW5XaW5kb3cpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG5cblx0Qm9hcmQudXBkYXRlKEludGVyZmFjZXMsIEV2ZW50cywgU2VydmVyLCBtYWluV2luZG93KTtcbn07XG5cbkJvYXJkLnNob3dBbGVydCA9IGZ1bmN0aW9uKGJvZHlUZXh0LCBleHRyYVRleHQpIHtcblx0aWYgKCFub2Rlcy5hbGVydE5vZGUpIHtcblx0XHRyZXR1cm4gY29uc29sZS5sb2coJ0JPQVJEIEFMRVJUJywgJ0FuIGF0dGVtcHQgd2FzIG1hZGUgdG8gcGxhY2UgYW4gYWxlcnQgd2l0aG91dCBjcmVhdGluZyB0aGUgYm9hcmQgY29tcG9uZW50cyBmaXJzdC4nKTtcblx0fVxuXG5cdEJvYXJkLnNldEFsZXJ0Qm9keShib2R5VGV4dCB8fCAnJyk7XG5cdEJvYXJkLnNldEFsZXJ0RXh0cmEoZXh0cmFUZXh0KTtcblx0Qm9hcmQudXBkYXRlQWxlcnRDb21wb25lbnRzKCk7XG59O1xuXG5Cb2FyZC5zZXRBbGVydEJvZHkgPSBmdW5jdGlvbih0ZXh0KSB7XG5cdEJvYXJkLmFsZXJ0Tm9kZUNvbXBvbmVudHMuYm9keSA9IHRleHQ7XG59O1xuXG5Cb2FyZC5zZXRBbGVydEV4dHJhID0gZnVuY3Rpb24odGV4dCkge1xuXHRCb2FyZC5hbGVydE5vZGVDb21wb25lbnRzLmV4dHJhID0gdGV4dDtcbn07XG5cbkJvYXJkLnNldFJlcXVlc3RBbmNob3IgPSBmdW5jdGlvbihhbmNob3IpIHtcblx0Qm9hcmQuYWxidW1SZXF1ZXN0Q29tcG9uZW50cy5hbmNob3IgPSBhbmNob3I7XG59O1xuXG5Cb2FyZC5zZXRSZXF1ZXN0TGltaXQgPSBmdW5jdGlvbihsbWl0KSB7XG5cdEJvYXJkLmFsYnVtUmVxdWVzdENvbXBvbmVudHMubGltaXQgPSBsbWl0O1xufTtcblxuQm9hcmQuZ2V0QWxlcnRFeHRyYSA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gQm9hcmQuYWxlcnROb2RlQ29tcG9uZW50cy5leHRyYTtcbn07XG5cbkJvYXJkLmdldFJlcXVlc3RBbmNob3IgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIEJvYXJkLmFsYnVtUmVxdWVzdENvbXBvbmVudHMuYW5jaG9yO1xufTtcblxuQm9hcmQuZ2V0UmVxdWVzdExpbWl0ID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiBCb2FyZC5hbGJ1bVJlcXVlc3RDb21wb25lbnRzLmxpbWl0O1xufTtcblxuLy8gbG9jYWwgZXZlbnRzXG5Cb2FyZC5vbiA9IGZ1bmN0aW9uKGV2ZW50TmFtZSwgY2FsbGJhY2ssIG9uY2UpIHtcblx0aWYgKCFldmVudHNbZXZlbnROYW1lXSkge1xuXHRcdGV2ZW50c1tldmVudE5hbWVdID0gW107XG5cdH1cblx0Y2FsbGJhY2sub25jZSA9IG9uY2U7XG5cdGV2ZW50c1tldmVudE5hbWVdLnB1c2goY2FsbGJhY2spO1xufTtcblxuQm9hcmQuZW1pdCA9IGZ1bmN0aW9uKGV2ZW50TmFtZSwgYXJncykge1xuXHRpZiAoIWV2ZW50c1tldmVudE5hbWVdKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdGlmICghKGFyZ3MgaW5zdGFuY2VvZiBBcnJheSkpIHtcblx0XHRhcmdzID0gW2FyZ3NdXG5cdH1cblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBldmVudHNbZXZlbnROYW1lXS5sZW5ndGg7IGkrKykge1xuXHRcdGV2ZW50c1tldmVudE5hbWVdW2ldLmFwcGx5KEJvYXJkLCBhcmdzKTtcblx0XHRpZiAoZXZlbnRzW2V2ZW50TmFtZV1baV0ub25jZSkge1xuXHRcdFx0ZXZlbnRzW2V2ZW50TmFtZV0uc3BsaWNlKGksIDEpO1xuXHRcdH1cblx0fVxufTtcblxuLy8gRXhwZWN0cyBhbiBvZmZzZXQgKG9yIHplcm8pIGFuZCBwbGFjZXMgZWFjaCBpdGVtIGluXG4vLyBhIGNvbGxlY3Rpb24gaW4gYSBnYWxsZXJ5IGxheW91dC5cbi8vIFRoaXMgbWV0aG9kIGV4cGV0Y3MgZWFjaCBjb2xsZWN0aW9uIGl0ZW0gdG8gYmUgYWxyZWFkeVxuLy8gYXBwZW5kZWQgdG8gYSByb290Tm9kZVxuQm9hcmQuY2hpc2VsID0gZnVuY3Rpb24obWFpbldpbmRvdywgcm9vdE5vZGUsIGNvbGxlY3Rpb24sIG9mZnNldCkge1xuXHRpZiAoIXJvb3ROb2RlIHx8ICFtYWluV2luZG93IHx8ICFjb2xsZWN0aW9uLmxlbmd0aCB8fCBvZmZzZXQgPCAwKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdGlmICghb2Zmc2V0KSB7XG5cdFx0b2Zmc2V0ID0gMDtcblx0fVxuXG5cdHZhciB3aW5kb3dXaWR0aCA9IG1haW5XaW5kb3cuaW5uZXJXaWR0aDtcblx0dmFyIGl0ZW1XaWR0aCA9IGNvbGxlY3Rpb25bMF0uZ2V0Tm9kZVByb3BlcnR5VmFsdWUoJ29mZnNldFdpZHRoJyk7XG5cdHZhciBpdGVtTWFyZ2luID0gMDtcblx0dmFyIGNvbHVtbkNvdW50ID0gMDtcblxuXHRpZiAod2luZG93V2lkdGggJiYgaXRlbVdpZHRoKSB7XG5cdFx0aXRlbU1hcmdpbiA9IGNvbGxlY3Rpb25bMF0uZ2V0Q1NTQ29tcHV0ZWRTdHlsZUFzSW50KCdtYXJnaW4tbGVmdCcpICogMjtcblx0XHRjb2x1bW5Db3VudCA9IE1hdGgubWF4KDEsIE1hdGguZmxvb3Iod2luZG93V2lkdGggLyAoaXRlbVdpZHRoICsgaXRlbU1hcmdpbikpKTtcblx0XHRpZiAoY29sdW1uQ291bnQgPiBjb2xsZWN0aW9uLmxlbmd0aCkge1xuXHRcdFx0Y29sdW1uQ291bnQgPSBjb2xsZWN0aW9uLmxlbmd0aDtcblx0XHR9XG5cblx0XHQvLyBwcmV2ZW50IGFueSBmdXJ0aGVyIGFjdGlvbiBpZiBjb2x1bW4gY291bnQgaGFzIG5vdCBjaGFuZ2VkXG5cdFx0Ly8gYW5kIHRoZSBlbnRpcmUgY29sbGVjdGlvbiBpcyBiZWluZyBwcm9jZXNzZWQgd2l0aCBubyBvZmZzZXRcblx0XHRpZiAoY29sdW1uQ291bnQgPT0gY2FjaGUubGFzdENvbHVtbkNvdW50ICYmIG9mZnNldCA9PSAwKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cblx0XHRyb290Tm9kZS5zdHlsZS53aWR0aCA9IChjb2x1bW5Db3VudCAqIChpdGVtV2lkdGggKyAoaXRlbU1hcmdpbikpKSArIFwicHhcIjtcblx0XHRjYWNoZS5sYXN0Q29sdW1uQ291bnQgPSBjb2x1bW5Db3VudDtcblxuXHRcdGZvciAodmFyIGkgPSBvZmZzZXQ7IGkgPCBjb2xsZWN0aW9uLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRjb2xsZWN0aW9uW2ldLnJlbW92ZUZsYWcoJ2ZpcnN0Jyk7XG5cdFx0XHRjb2xsZWN0aW9uW2ldLnNldEZsYWcoJ2xlZnQnLCAwKTtcblx0XHRcdGNvbGxlY3Rpb25baV0uc2V0Q1NTUHJvcGVydHlWYWx1ZSgndG9wJywgJzBweCcpO1xuXHRcdFx0Y29sbGVjdGlvbltpXS5zZXRDU1NQcm9wZXJ0eVZhbHVlKCdsZWZ0JywgJzBweCcpO1xuXHRcdH1cblxuXHRcdGlmIChvZmZzZXQgPT0gMCkge1xuXHRcdFx0Zm9yICh2YXIgaSA9IG9mZnNldDsgaSA8IGNvbGxlY3Rpb24ubGVuZ3RoOyBpICs9IGNvbHVtbkNvdW50KSB7XG5cdFx0XHRcdGNvbGxlY3Rpb25baV0uc2V0RmxhZygnZmlyc3QnKTtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0Zm9yICh2YXIgaSA9IG9mZnNldDsgaSA8IGNvbGxlY3Rpb24ubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0aWYgKGNvbGxlY3Rpb25baSAtIGNvbHVtbkNvdW50XSAmJiBjb2xsZWN0aW9uW2kgLSBjb2x1bW5Db3VudF0uaGFzRmxhZygnZmlyc3QnKSkge1xuXHRcdFx0XHRcdGNvbGxlY3Rpb25baV0uc2V0RmxhZygnZmlyc3QnKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGZvciAodmFyIGkgPSBvZmZzZXQ7IGkgPCBjb2xsZWN0aW9uLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRpZiAoIWNvbGxlY3Rpb25baV0uaGFzRmxhZygnZmlyc3QnKSkge1xuXHRcdFx0XHRjb2xsZWN0aW9uW2ldLnNldEZsYWcoJ2xlZnQnLCBjb2xsZWN0aW9uW2kgLSAxXS5nZXRGbGFnKCdsZWZ0JykgKyBjb2xsZWN0aW9uW2kgLSAxXS5nZXROb2RlUHJvcGVydHlWYWx1ZSgnb2Zmc2V0V2lkdGgnKSArIGl0ZW1NYXJnaW4pO1xuXHRcdFx0XHRjb2xsZWN0aW9uW2ldLnNldENTU1Byb3BlcnR5VmFsdWUoJ2xlZnQnLCBjb2xsZWN0aW9uW2ldLmdldEZsYWcoJ2xlZnQnKSArIFwicHhcIik7XG5cblx0XHRcdH1cblx0XHRcdGlmIChjb2xsZWN0aW9uW2kgLSBjb2x1bW5Db3VudF0pIHtcblx0XHRcdFx0Y29sbGVjdGlvbltpXS5zZXRDU1NQcm9wZXJ0eVZhbHVlKCd0b3AnLFxuXHRcdFx0XHRcdChjb2xsZWN0aW9uW2kgLSBjb2x1bW5Db3VudF0uZ2V0Tm9kZVByb3BlcnR5VmFsdWUoJ29mZnNldFRvcCcpICsgY29sbGVjdGlvbltpIC0gY29sdW1uQ291bnRdLmdldE5vZGVQcm9wZXJ0eVZhbHVlKCdvZmZzZXRIZWlnaHQnKSArIGl0ZW1NYXJnaW4gLSAoY29sbGVjdGlvbltpXS5nZXROb2RlUHJvcGVydHlWYWx1ZSgnb2Zmc2V0VG9wJykpKSArIFwicHhcIik7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0Qm9hcmQuZW1pdCgnY2hpc2VsJywgW3Jvb3ROb2RlLCBpdGVtTWFyZ2luXSk7XG59O1xuXG5Cb2FyZC5nZXRJbWFnZUJ5SW5kZXggPSBmdW5jdGlvbihpbmRleCkge1xuXHR2YXIgcGljdHVyZSA9IEJvYXJkLmdldFBpY3R1cmVCeUluZGV4KGluZGV4KVxuXHRpZiAocGljdHVyZSkge1xuXHRcdHJldHVybiBwaWN0dXJlLmdldEltYWdlTm9kZSgpO1xuXHR9XG5cdHJldHVybiBudWxsO1xufTtcblxuQm9hcmQuZ2V0SW1hZ2VCeUlkID0gZnVuY3Rpb24oaWQpIHtcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBCb2FyZC5waWN0dXJlcy5sZW5ndGg7IGkrKykge1xuXHRcdGlmIChCb2FyZC5waWN0dXJlc1tpXS5nZXROb2RlSUQoKSA9PSBpZCkge1xuXHRcdFx0cmV0dXJuIEJvYXJkLnBpY3R1cmVzW2ldO1xuXHRcdH1cblx0fVxufTtcblxuQm9hcmQuZ2V0UGljdHVyZUJ5SW5kZXggPSBmdW5jdGlvbihpbmRleCkge1xuXHRyZXR1cm4gQm9hcmQucGljdHVyZXNbaW5kZXhdO1xufTtcblxuLy8gcmV0dXJuIGxvYWRlZCBwaWN0dXJlIGNvdW50XG5Cb2FyZC5nZXRTaXplID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiBCb2FyZC5waWN0dXJlcy5sZW5ndGg7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJvYXJkOyIsInZhciBJbnRDb250cm9sbGVyID0ge31cblxuZnVuY3Rpb24gaW50ZXJmYWNlTm9kZSgpIHtcblx0dGhpcy5jYWxsYmFja3MgPSB7fTtcblxuXHQvLyBXYXJuaW5nOiBkb2VzIG5vdCByZWdpc3RlciBcIkRPTVRyZWVcIiBub2RlIGV2ZW50c1xuXHQvLyB0aGF0IHNob3VsZCBiZSB3YXRjaGVkIHdpdGggXCJhZGRFdmVudExpc3RlbmVyXCIuXG5cdC8vIG9ubHkgcmVnaXN0ZXJzIFwibG9jYWxcIiBpbnN0YW5jZSBldmVudHMuIFVzZVxuXHQvLyBcIkV2ZW50cy5vbk5vZGVFdmVudFwiIHRvIGxpc3RlbiBmb3IgYWN0dWFsIGRvbSBldnRzLlxuXHR0aGlzLm9uID0gZnVuY3Rpb24oZXZlbnROYW1lLCBjYWxsYmFjaykge1xuXHRcdGlmICghdGhpcy5jYWxsYmFja3NbZXZlbnROYW1lXSkge1xuXHRcdFx0dGhpcy5jYWxsYmFja3NbZXZlbnROYW1lXSA9IFtdO1xuXHRcdH1cblxuXHRcdHRoaXMuY2FsbGJhY2tzW2V2ZW50TmFtZV0ucHVzaChjYWxsYmFjayk7XG5cdH07XG5cblx0dGhpcy5lbWl0ID0gZnVuY3Rpb24oZXZlbnROYW1lLCBhcmdzKSB7XG5cdFx0aWYgKCF0aGlzLmNhbGxiYWNrc1tldmVudE5hbWVdKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmNhbGxiYWNrc1tldmVudE5hbWVdLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR0aGlzLmNhbGxiYWNrc1tldmVudE5hbWVdW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuXHRcdH1cblx0fTtcbn1cblxuZnVuY3Rpb24gaW50ZXJmYWNlSW5wdXROb2RlKEV2ZW50cywgbWFpbldpbmRvdykge1xuXHR2YXIgc2NvcGUgPSB0aGlzO1xuXG5cdHRoaXMubm9kZSA9IG1haW5XaW5kb3cuZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlucHV0XCIpO1xuXHR0aGlzLnR5cGUgPSBcInRleHRcIjtcblx0dGhpcy5wYXNzd29yZCA9IGZhbHNlO1xuXHR0aGlzLmNsYXNzTmFtZSA9IFwiUGljdHJlLXBhc3Njb2RlLWlucHV0XCI7XG5cdHRoaXMucGxhY2Vob2xkZXIgPSBcIkNyZWF0ZSBhIHBhc3Njb2RlXCI7XG5cdHRoaXMudmFsdWUgPSB0aGlzLnBsYWNlaG9sZGVyO1xuXG5cdHRoaXMubm9kZS5tYXhMZW5ndGggPSAxMDtcblx0dGhpcy5ub2RlLmNsYXNzTmFtZSA9IHRoaXMuY2xhc3NOYW1lO1xuXHR0aGlzLm5vZGUudHlwZSA9IHRoaXMudHlwZTtcblx0dGhpcy5ub2RlLnBsYWNlaG9sZGVyID0gdGhpcy5wbGFjZWhvbGRlciB8fCBcIlwiO1xuXG5cdHRoaXMuZ2V0Tm9kZSA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBzY29wZS5ub2RlO1xuXHR9O1xuXHR0aGlzLnNldFN0eWxlID0gZnVuY3Rpb24oYXR0ciwgdmFsdWUpIHtcblx0XHRzY29wZS5ub2RlLnN0eWxlW2F0dHJdID0gdmFsdWU7XG5cdH07XG5cdHRoaXMuc2V0QXR0cmlidXRlID0gZnVuY3Rpb24oYXR0ciwgdmFsdWUpIHtcblx0XHRzY29wZS5ub2RlLnNldEF0dHJpYnV0ZShhdHRyLCB2YWx1ZSk7XG5cdH07XG5cblx0dGhpcy5zZXRWYWx1ZSA9IGZ1bmN0aW9uKHRleHQpIHtcblx0XHR0aGlzLm5vZGUudmFsdWUgPSB0ZXh0O1xuXHRcdHRoaXMudmFsdWUgPSB0ZXh0O1xuXHR9O1xuXG5cdHRoaXMuc2V0UGxhY2Vob2xkZXIgPSBmdW5jdGlvbih0ZXh0KSB7XG5cdFx0dGhpcy52YWx1ZSA9IHRleHQ7XG5cdFx0dGhpcy5wbGFjZWhvbGRlciA9IHRleHQ7XG5cdFx0dGhpcy5ub2RlLnBsYWNlaG9sZGVyID0gdGV4dDtcblx0fTtcblxuXHR0aGlzLmdldFZhbHVlID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHNjb3BlLm5vZGUudmFsdWU7XG5cdH07XG5cdHRoaXMuZ2V0RXNjYXBlZFZhbHVlID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHNjb3BlLm5vZGUudmFsdWUudG9Mb3dlckNhc2UoKVxuXHRcdFx0LnJlcGxhY2UoLyYvZywgXCImYW1wO1wiKVxuXHRcdFx0LnJlcGxhY2UoLzwvZywgXCImbHQ7XCIpXG5cdFx0XHQucmVwbGFjZSgvPi9nLCBcIiZndDtcIilcblx0XHRcdC5yZXBsYWNlKC9cIi9nLCBcIiZxdW90O1wiKVxuXHRcdFx0LnJlcGxhY2UoLycvZywgXCImIzAzOTtcIik7XG5cdH07XG5cblx0dGhpcy5pc1ZhbHVlRW1wdHkgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gc2NvcGUudmFsdWUgPT0gc2NvcGUubm9kZS52YWx1ZSB8fCBzY29wZS5ub2RlLnZhbHVlID09ICcnO1xuXHR9O1xuXG5cdEV2ZW50cy5vbk5vZGVFdmVudCh0aGlzLm5vZGUsICdmb2N1cycsIGZ1bmN0aW9uKGUpIHtcblx0XHRzY29wZS5lbWl0KCdmb2N1cycsIFtlXSk7XG5cdFx0aWYgKHNjb3BlLnBhc3N3b3JkKSB7XG5cdFx0XHRzY29wZS5ub2RlLnR5cGUgPSBcInBhc3N3b3JkXCI7XG5cdFx0fVxuXHRcdGlmIChzY29wZS5ub2RlLnZhbHVlID09IHNjb3BlLnZhbHVlKSB7XG5cdFx0XHRzY29wZS5ub2RlLnZhbHVlID0gXCJcIjtcblx0XHR9XG5cdH0pO1xuXG5cdEV2ZW50cy5vbk5vZGVFdmVudCh0aGlzLm5vZGUsICdibHVyJywgZnVuY3Rpb24oZSkge1xuXHRcdHNjb3BlLmVtaXQoJ2JsdXInLCBbZV0pO1xuXHR9KTtcblxuXHRyZXR1cm4gdGhpcztcbn07XG5cbmludGVyZmFjZUlucHV0Tm9kZS5wcm90b3R5cGUgPSBuZXcgaW50ZXJmYWNlTm9kZSgpO1xuXG5mdW5jdGlvbiBpbnRlcmZhY2VEaXZOb2RlKCkge1xuXG59XG5cbkludENvbnRyb2xsZXIuaG9yaXpvbnRhbENlbnRlck5vZGVSZWxhdGl2ZVRvID0gZnVuY3Rpb24obm9kZSwgcmVsYXRpdmVUb05vZGUpIHtcblx0bm9kZS5zdHlsZS5sZWZ0ID0gKCQocmVsYXRpdmVUb05vZGUpLndpZHRoKCkgLyAyKSAtICgkKG5vZGUpLndpZHRoKCkgLyAyKSArICdweCc7XG59O1xuXG5JbnRDb250cm9sbGVyLnZlcnRpY2FsQ2VudGVyTm9kZVJlbGF0aXZlVG8gPSBmdW5jdGlvbihub2RlLCByZWxhdGl2ZVRvTm9kZSkge1xuXHRub2RlLnN0eWxlLnRvcCA9ICgkKHJlbGF0aXZlVG9Ob2RlKS5oZWlnaHQoKSAvIDIpIC0gKCQobm9kZSkuaGVpZ2h0KCkgLyAyKSArICdweCc7XG59O1xuXG5JbnRDb250cm9sbGVyLmNlbnRlck5vZGVSZWxhdGl2ZVRvID0gZnVuY3Rpb24obm9kZSwgcmVsYXRpdmVUb05vZGUpIHtcblx0SW50Q29udHJvbGxlci5ob3Jpem9udGFsQ2VudGVyTm9kZVJlbGF0aXZlVG8obm9kZSwgcmVsYXRpdmVUb05vZGUpO1xuXHRJbnRDb250cm9sbGVyLnZlcnRpY2FsQ2VudGVyTm9kZVJlbGF0aXZlVG8obm9kZSwgcmVsYXRpdmVUb05vZGUpO1xufTtcblxuSW50Q29udHJvbGxlci5uZXdJbnB1dE5vZGUgPSBmdW5jdGlvbihFdmVudHMsIG1haW5XaW5kb3cpIHtcblx0cmV0dXJuIG5ldyBpbnRlcmZhY2VJbnB1dE5vZGUoRXZlbnRzLCBtYWluV2luZG93KTtcbn07XG5cbkludENvbnRyb2xsZXIubmV3RGl2Tm9kZSA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gbmV3IGludGVyZmFjZURpdk5vZGUoKTtcbn07XG5cbkludENvbnRyb2xsZXIuY3JlYXRlRGl2Tm9kZSA9IGZ1bmN0aW9uKG1haW5XaW5kb3cpIHtcblx0cmV0dXJuIG1haW5XaW5kb3cuZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG59O1xuXG5JbnRDb250cm9sbGVyLmNyZWF0ZU5vZGUgPSBmdW5jdGlvbihtYWluV2luZG93LCBub2RlTmFtZSkge1xuXHRyZXR1cm4gbWFpbldpbmRvdy5kb2N1bWVudC5jcmVhdGVFbGVtZW50KG5vZGVOYW1lKTtcbn07XG5cbkludENvbnRyb2xsZXIuc2V0Tm9kZU92ZXJmbG93SGlkZGVuID0gZnVuY3Rpb24obm9kZSkge1xuXHRub2RlLnN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbic7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEludENvbnRyb2xsZXI7IiwiLyoqXG4gKiBHYWxsZXJ5IHdyYXBwZXIgZm9yIG92ZXJsYXkgaW50ZXJmYWNlXG4gKi9cblxudmFyIEdhbGxlcnlJbnRlcmZhY2UgPSB7fTtcblxuR2FsbGVyeUludGVyZmFjZS5pc0ZlYXR1cmluZyA9IGZhbHNlO1xuXG5HYWxsZXJ5SW50ZXJmYWNlLmV2ZW50cyA9IHt9O1xuR2FsbGVyeUludGVyZmFjZS5pbWFnZXMgPSBbXTtcblxuR2FsbGVyeUludGVyZmFjZS5pbWFnZSA9IG51bGw7XG5cbnZhciBpc0FjdGl2ZSA9IGZhbHNlO1xuXG5HYWxsZXJ5SW50ZXJmYWNlLmV2ZW50cy5vbnJlYWR5ID0gZnVuY3Rpb24oKSB7fTtcbkdhbGxlcnlJbnRlcmZhY2UuZXZlbnRzLm9uY2xvc2UgPSBmdW5jdGlvbigpIHt9O1xuXG5HYWxsZXJ5SW50ZXJmYWNlLm9uRXhpdCA9IGZ1bmN0aW9uKGV4aXRDYWxsYmFjaykge1xuXHRPdmVybGF5LmV2ZW50cy5vbmV4aXQucHVzaChleGl0Q2FsbGJhY2spO1xufTtcblxuR2FsbGVyeUludGVyZmFjZS5oaWRlID0gZnVuY3Rpb24oKSB7XG5cblx0Ly8gaWYgKCFPdmVybGF5LmlzTG9ja2VkKSB7XG5cblx0Ly8gXHR3aW5kb3cuZG9jdW1lbnQuYm9keS5zdHlsZS5vdmVyZmxvdyA9ICdhdXRvJztcblx0Ly8gXHR3aW5kb3cuZG9jdW1lbnQuYm9keS5zdHlsZS5oZWlnaHQgPSAnYXV0byc7XG5cdC8vIFx0R2FsbGVyeUludGVyZmFjZS5pc0ZlYXR1cmluZyA9IGZhbHNlO1xuXG5cdC8vIFx0T3ZlcmxheS5yZW1vdmUoKTtcblx0Ly8gXHRHYWxsZXJ5SW50ZXJmYWNlLm9uY2xvc2UoKTtcblxuXHQvLyBcdGZvciAodmFyIGkgPSAwOyBpIDwgT3ZlcmxheS5ldmVudHMub25leGl0Lmxlbmd0aDsgaSsrKSB7XG5cdC8vIFx0XHRpZiAoT3ZlcmxheS5ldmVudHMub25leGl0W2ldKSBPdmVybGF5LmV2ZW50cy5vbmV4aXRbaV0uY2FsbChHYWxsZXJ5SW50ZXJmYWNlKTtcblx0Ly8gXHR9XG5cblx0Ly8gfVxuXG59XG5cbi8qKlxuICogRmVhdHVyZSBhIGdpdmVuIGltYWdlIG9iamVjdFxuICovXG5HYWxsZXJ5SW50ZXJmYWNlLnNob3cgPSBmdW5jdGlvbihpbWFnZSkge1xuXG5cdEdhbGxlcnlJbnRlcmZhY2UuaXNBY3RpdmUgPSB0cnVlO1xuXG5cdHZhciBzY29wZSA9IFBpY3RyZTtcblxuXHQvLyB2YXIgdGh1bWIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuXHQvLyB0aHVtYi5jbGFzc05hbWUgPSBcIlBpY3RyZS1vdmVybGF5LXBpY1wiO1xuXHQvLyB0aHVtYi5kYXRhID0gaW1hZ2UuZGF0YTtcblx0Ly8gdGh1bWIuc3R5bGUubWluV2lkdGggPSBFbnZpcm9ubWVudC5tYXhJbWFnZVdpZHRoICsgJ3B4Jztcblx0Ly8gdGh1bWIuc3R5bGUubWF4V2lkdGggPSBFbnZpcm9ubWVudC5tYXhJbWFnZVdpZHRoICsgJ3B4Jztcblx0Ly8gdGh1bWIuc3R5bGUud2lkdGggPSBFbnZpcm9ubWVudC5tYXhJbWFnZVdpZHRoICsgJ3B4Jztcblx0Ly8gdGh1bWIuaW5uZXJIVE1MID0gXCI8ZGl2IGNsYXNzPSdQaWN0cmUtbG9hZGVyJz48c3BhbiBjbGFzcz0nZmEgZmEtY2lyY2xlLW8tbm90Y2ggZmEtc3BpbiBmYS0zeCc+PC9zcGFuPjwvZGl2PlwiO1xuXG5cdC8vIE92ZXJsYXkuZmVhdHVyZSh0aHVtYik7XG5cdC8vIE92ZXJsYXkuaXRlcmF0b3IgPSBpbWFnZS5kYXRhLmlkO1xuXG5cdC8vIHdpbmRvdy5kb2N1bWVudC5ib2R5LnN0eWxlLmhlaWdodCA9ICQod2luZG93KS5oZWlnaHQoKSArICdweCc7XG5cdC8vIHdpbmRvdy5kb2N1bWVudC5ib2R5LnN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbic7XG5cblx0Ly8gaW1hZ2Uuc3R5bGUub3BhY2l0eSA9ICcwLjEnO1xuXG5cdC8vIEdhbGxlcnkuc2hvd0ltYWdlKHRodW1iKTtcblx0Ly8gUGljdHJlLmdhbGxlcnkub3ZlcmxheS5vbmNsb3NlID0gZnVuY3Rpb24oKSB7XG5cdC8vIFx0aWYgKGEpIGEuc3R5bGUub3BhY2l0eSA9IFBpY3RyZS5fc2V0dGluZ3MuZGF0YS52aXNpdGVkO1xuXHQvLyB9XG5cbn07XG5cbkdhbGxlcnlJbnRlcmZhY2UuaXNBY3RpdmUgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIGlzQWN0aXZlO1xufTtcblxuR2FsbGVyeUludGVyZmFjZS5nZXRPdmVybGF5ID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiBPdmVybGF5O1xufVxuXG5HYWxsZXJ5SW50ZXJmYWNlLnB1dE92ZXJsYXkgPSBmdW5jdGlvbigpIHt9XG5cbm1vZHVsZS5leHBvcnRzID0gR2FsbGVyeUludGVyZmFjZTsiLCIvKipcbiAqIEV4cG9ydHMgYWxsIGludGVyZmFjZSBtb2R1bGVzIGluIGN1cnJlbnQgZGlyZWN0b3J5XG4gKi9cblxuLy9pbXBvcnQgYWxsIG1vZHVsZXNcbnZhciBtb2R1bGVzID0ge1xuXHQnYm9hcmQnOiByZXF1aXJlKCcuL2JvYXJkLmpzJyksXG5cdCdjb250cm9sbGVyJzogcmVxdWlyZSgnLi9jb250cm9sbGVyLmpzJyksXG5cdCdnYWxsZXJ5JzogcmVxdWlyZSgnLi9nYWxsZXJ5LmpzJyksXG5cdCdtZW51JzogcmVxdWlyZSgnLi9tZW51LmpzJyksXG5cdCdtb2RhbCc6IHJlcXVpcmUoJy4vbW9kYWwuanMnKSxcblx0J292ZXJsYXknOiByZXF1aXJlKCcuL292ZXJsYXkuanMnKSxcblx0J3NwbGFzaCc6IHJlcXVpcmUoJy4vc3BsYXNoLmpzJyksXG5cdCd3YXJuaW5nJzogcmVxdWlyZSgnLi93YXJuaW5nLmpzJylcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gbW9kdWxlczsiLCIvKipcbiAqIE5hdmlnYXRpb24gYW5kIG1lbnUgaW50ZXJmYWNlXG4gKi9cblxudmFyIEVudmlyb25tZW50ID0gcmVxdWlyZSgnLi4vZW52aXJvbm1lbnQuanMnKTtcbnZhciBVdGlsaXRpZXMgPSByZXF1aXJlKCcuLi91dGlsaXRpZXMuanMnKTtcblxudmFyIE1lbnVJbnRlcmZhY2UgPSB7XG5cblx0ZG9tRWxlbWVudDogbnVsbCxcblx0YnV0dG9uczoge30sXG5cblx0LyoqXG5cdCAqIEFkZHMgdWkgaWNvbiB0byB0aGUgdG9wIG5hdmlnYXRpb24gb2YgdGhlIGFwcGxpY2F0aW9uXG5cdCAqXG5cdCAqIEBwYXJhbSBidXR0b24gW29iamVjdF0gZGVmaW5pbmcgdWkgYW5kIGFjdGlvbiBwcm9wZXJ0aWVzIGZvciBidXR0b25cblx0ICogQHJldHVybiBwb2ludGVyIHRvIGFkZGVkIGJ1dHRvbiBvYmplY3Rcblx0ICovXG5cdGFkZEJ1dHRvbjogZnVuY3Rpb24oYnV0dG9uKSB7XG5cblx0XHR2YXIgYnV0dG9uSWNvbkNsYXNzTmFtZSA9ICdmYS1jbG91ZCc7XG5cblx0XHR0aGlzLmJ1dHRvbnNbYnV0dG9uLm5hbWVdID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblx0XHR0aGlzLmJ1dHRvbnNbYnV0dG9uLm5hbWVdLmlkID0gYnV0dG9uLmlkO1xuXHRcdHRoaXMuYnV0dG9uc1tidXR0b24ubmFtZV0uY2xhc3NOYW1lID0gXCJ0b3AtYnV0dG9uXCI7IC8vXCJ0b3AtYnV0dG9uXCI7XG5cdFx0dGhpcy5idXR0b25zW2J1dHRvbi5uYW1lXS50aXRsZSA9IGJ1dHRvbi50aXRsZTtcblxuXHRcdC8vIGhhbmRsZSBidXR0b24gaWNvbiB0eXBlXG5cdFx0aWYgKGJ1dHRvbi5pZCA9PSAndXBsb2FkJykge1xuXHRcdFx0Ly8gYXNzaWduIHVwbG9hZCBpY29uXG5cdFx0XHRidXR0b25JY29uQ2xhc3NOYW1lID0gJ2ZhLWNsb3VkLXVwbG9hZCc7XG5cdFx0fSBlbHNlIGlmIChidXR0b24uaWQgPT0gJ2xvY2snKSB7XG5cdFx0XHQvLyBhc3NpZ24gJ2xvY2snIGljb24gdG8gaW5kaWNhdGUgc2lnbmluZyBpblxuXHRcdFx0YnV0dG9uSWNvbkNsYXNzTmFtZSA9ICdmYS1sb2NrJztcblx0XHR9IGVsc2UgaWYgKGJ1dHRvbi5pZCA9PSAndW5sb2NrJykge1xuXHRcdFx0Ly8gYXNzaWduICd1bmxvY2snIGljb24gdG8gaW5kaWNhdGUgc2lnbmluZyBvdXRcblx0XHRcdGJ1dHRvbkljb25DbGFzc05hbWUgPSAnZmEtdW5sb2NrJztcblx0XHR9IGVsc2UgaWYgKGJ1dHRvbi5pZCA9PSAnYmFjaycpIHtcblx0XHRcdC8vIGFzc2lnbiAnYmFjaycgYXJyb3cgaWNvbiB0byBpbmRpY2F0ZSByZXR1cm5pbmcgdG8gYWxidW1cblx0XHRcdGJ1dHRvbkljb25DbGFzc05hbWUgPSAnZmEtYXJyb3ctbGVmdCc7XG5cdFx0fVxuXG5cdFx0dGhpcy5idXR0b25zW2J1dHRvbi5uYW1lXS5pbm5lckhUTUwgPSAnPHNwYW4gY2xhc3M9XCJmYSAnICsgYnV0dG9uSWNvbkNsYXNzTmFtZSArICcgZmEtMnhcIj48L3NwYW4+JztcblxuXHRcdHRoaXMuZG9tRWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLmJ1dHRvbnNbYnV0dG9uLm5hbWVdKTtcblxuXHRcdHRoaXMuYnV0dG9uc1tidXR0b24ubmFtZV0uc3R5bGUudG9wID0gKHRoaXMuYnV0dG9uc1tidXR0b24ubmFtZV0ucGFyZW50Tm9kZS5jbGllbnRIZWlnaHQgLyAyIC0gdGhpcy5idXR0b25zW2J1dHRvbi5uYW1lXS5jbGllbnRIZWlnaHQgLyAyKSArICdweCc7XG5cblx0XHQvLyBkZWNsYXJlICdvbicgZnVuY3Rpb24gdG8gYWxsb3cgYWRkaXRpb24gb2YgZXZlbnQgbGlzdGVuZXIgdG8gZWxlbWVudFxuXHRcdHRoaXMuYnV0dG9uc1tidXR0b24ubmFtZV0ub24gPSBmdW5jdGlvbihhY3Rpb24sIGNhbGxiYWNrKSB7XG5cblx0XHRcdFBpY3RyZS5leHRlbmQodGhpcykub24oYWN0aW9uLCBmdW5jdGlvbihldnQpIHtcblx0XHRcdFx0Y2FsbGJhY2suY2FsbCh0aGlzLCBldnQpO1xuXHRcdFx0fSk7XG5cblx0XHRcdHJldHVybiB0aGlzO1xuXG5cdFx0fTtcblxuXHRcdHJldHVybiB0aGlzLmJ1dHRvbnNbYnV0dG9uLm5hbWVdO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIHBvaW50ZXIgdG8gYnV0dG9uIHdpdGggc3BlY2lmaWVkIGlkXG5cdCAqL1xuXHRnZXRCdXR0b246IGZ1bmN0aW9uKGJ1dHRvbklkKSB7XG5cdFx0cmV0dXJuIHRoaXMuYnV0dG9uc1tidXR0b25JZF07XG5cdH0sXG5cblx0LyoqXG5cdCAqIFJldHVybnMgdHJ1ZSBpZiBidXR0b24gd2l0aCBzcGVjaWZpZWQgaWYgZXhpc3RzXG5cdCAqIGZhbHNlIG90aGVyd2lzZS5cblx0ICovXG5cdGhhc0J1dHRvbjogZnVuY3Rpb24oYnV0dG9uSWQpIHtcblxuXHRcdHZhciBidXR0b25FeGlzdHMgPSBmYWxzZTtcblxuXHRcdGlmICh0aGlzLmJ1dHRvbnMuaGFzT3duUHJvcGVydHkoYnV0dG9uSWQpKSB7XG5cdFx0XHRidXR0b25FeGlzdHMgPSB0cnVlO1xuXHRcdH1cblxuXHRcdHJldHVybiBidXR0b25FeGlzdHM7XG5cblx0fSxcblxuXHQvKipcblx0ICogU2V0cyBkb20gc3R5bGUgZGlzcGxheSBwcm9wZXJ0eSB0byBub25lIG9mIGJ1dHRvbiB3aXRoXG5cdCAqIHNwZWNpZmllZCBpZC4gSWYgYnV0dG9uIGRvZXMgbm90IGV4aXN0LCByZXF1ZXN0IGlzIGlnbm9yZWQuXG5cdCAqL1xuXHRoaWRlQnV0dG9uOiBmdW5jdGlvbihidXR0b25JZCkge1xuXHRcdGlmICh0aGlzLmhhc0J1dHRvbihidXR0b25JZCkpIHtcblx0XHRcdHRoaXMuYnV0dG9uc1tidXR0b25JZF0uc3R5bGUuZGlzcGxheSA9ICdub25lJztcblx0XHR9XG5cdH0sXG5cblx0LyoqXG5cdCAqIE1haW4gZGlzcGxheSBmdW5jdGlvbiBmb3IgbWVudSBpbnRlcmZhY2UuIFdoZW4gY2FsbGVkLCBjcmVhdGVzXG5cdCAqIG1lbnUgZG9tIGVsZW1lbnQsIGFwcGVuZHMgYXBwbGljYXRpb24gYnJhbmQsIGFuZCBpbnNlcnRzIG1lbnVcblx0ICogZWxlbWVudCBiZWZvcmUgdGhlIG1haW4gYXBwbGljYXRpb24gd3JhcHBlci4gSWYgYVxuXHQgKiBzaWJsaW5nTm9kZSBpcyBub3Qgc3VwcGxpZWQsIHRoZSBtZW51IGVsZW1lbnQgaXMgYXBwZW5kZWRcblx0ICogdG8gdGhlIHBhcmVudCBub2RlIHN1cHBsaWVkLiAoVXN1YWxseSBib2R5KS5cblx0ICpcblx0ICogTm90ZTogdGhlIGFwcGxpY2F0aW9uIHdyYXBwZXIgaXMgdXN1YWxseSBjcmVhdGVkIGFuZCBhcHBlbmRlZFxuXHQgKiBpbiB0aGUgaW5kZXguaHRtbCBwcmUtaW5pdGlhbGl6YXRpb24gc2NyaXB0LlxuXHQgKlxuXHQgKiBAcGFyYW0gcGFyZW50Tm9kZSBcdFx0XHRbRE9NRWxlbWVudF0gcGFyZW50IG5vZGUgb2YgYXBwIHdyYXBwZXIgYW5kIG1lbnUgKHVzdWFsbHkgZG9jdW1lbnQuYm9keSlcblx0ICogQHBhcmFtIHNpYmxpbmdOb2RlIFx0W0RPTUVsZW1lbnRdIG1haW4gY29udGVudCB3cmFwcGVyIGZvciBhcHBsaWNhdGlvblxuXHQgKi9cblx0cHV0OiBmdW5jdGlvbihwYXJlbnROb2RlLCBzaWJsaW5nTm9kZSkge1xuXG5cdFx0dGhpcy5kb21FbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblx0XHR0aGlzLmRvbUVsZW1lbnQuaWQgPSAndG9wJztcblxuXHRcdC8vIHBsYWNlIGxvZ28gb24gbWVudVxuXHRcdHZhciBicmFuZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG5cdFx0YnJhbmQuaWQgPSAnYnJhbmQnO1xuXHRcdGJyYW5kLmlubmVySFRNTCA9IEVudmlyb25tZW50LmFwcC50aXRsZTtcblxuXHRcdFV0aWxpdGllcy5leHRlbmQoYnJhbmQpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuXHRcdFx0d2luZG93LmxvY2F0aW9uLmFzc2lnbignLycpO1xuXHRcdH0pO1xuXG5cdFx0dGhpcy5kb21FbGVtZW50LmFwcGVuZENoaWxkKGJyYW5kKTtcblxuXHRcdGlmIChzaWJsaW5nTm9kZSkge1xuXHRcdFx0cGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUodGhpcy5kb21FbGVtZW50LCBzaWJsaW5nTm9kZSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHBhcmVudE5vZGUuYXBwZW5kQ2hpbGQodGhpcy5kb21FbGVtZW50KTtcblx0XHR9XG5cblx0XHRicmFuZC5zdHlsZS50b3AgPSAodGhpcy5kb21FbGVtZW50LmNsaWVudEhlaWdodCAvIDIgLSBicmFuZC5jbGllbnRIZWlnaHQgLyAyKSArICdweCc7XG5cdFx0cmV0dXJuIHRoaXMuZG9tRWxlbWVudDtcblx0fSxcblxuXHQvKipcblx0ICogUmVtb3ZlcyBidXR0b24gZnJvbSB0aGUgZG9jdW1lbnQgYW5kIGRlbGV0ZXMgZG9tIGVsZW1lbnQuXG5cdCAqIElmIGJ1dHRvbiB3aXRoIHNwZWNpZmllZCBpZCBkb2VzIG5vdCBleGlzdCwgYWN0aW9uIGlzIGlnbm9yZWQuXG5cdCAqXG5cdCAqIEBwYXJhbSBidXR0b25JZCBbU3RyaW5nXSBpZCBvZiBidXR0b24gdG8gcmVtb3ZlXG5cdCAqL1xuXHRyZW1vdmVCdXR0b246IGZ1bmN0aW9uKGJ1dHRvbklkKSB7XG5cdFx0aWYgKHRoaXMuaGFzQnV0dG9uKGJ1dHRvbklkKSkge1xuXHRcdFx0dGhpcy5kb21FbGVtZW50LnJlbW92ZUNoaWxkKHRoaXMuYnV0dG9uc1tidXR0b25JZF0pO1xuXHRcdFx0ZGVsZXRlIHRoaXMuYnV0dG9uc1tidXR0b25JZF07XG5cdFx0fVxuXHR9LFxuXG5cdC8qKlxuXHQgKiBTZXRzIGJ1dHRvbiBjc3Mgc3R5bGUgZGlzcGxheSBwcm9wZXJ0eSB0byBibG9jay5cblx0ICogVXNlZCBhZnRlciBoaWRpbmcgYSBidXR0b24uIElmIGEgYnV0dG9uIHdpdGhcblx0ICogc3BlY2lmaWVkIGlkIGRvZXMgbm90IGV4aXN0LCB0aGlzIGFjdGlvbiBpcyBpZ25vcmVkLlxuXHQgKi9cblx0c2hvd0J1dHRvbjogZnVuY3Rpb24oYnV0dG9uSWQpIHtcblx0XHRpZiAodGhpcy5oYXNCdXR0b24oYnV0dG9uSWQpKSB7XG5cdFx0XHR0aGlzLmJ1dHRvbnNbYnV0dG9uSWRdLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuXHRcdH1cblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IE1lbnVJbnRlcmZhY2U7IiwiLyoqXG4gKiBNb2RhbCBjb250cm9sbGVyIC0gZGlzcGxheXMgaW5mb3JtYXRpb24gd2l0aCBvcHRpb25hbCB1c2VyIGlucHV0c1xuICogUmVxdWlyZXMgYW4gb3ZlcmxheVxuICovXG5cbnZhciBFbnZpcm9ubWVudCA9IHJlcXVpcmUoJy4uL2Vudmlyb25tZW50LmpzJyk7XG5cbnZhciBNb2RhbCA9IHt9O1xudmFyIG5vZGVzID0ge1xuXHQvLyBub2RlIGF0dGFjaGVkIHRvIGEgcGFyZW50Tm9kZSBvciBtYWluV2luZG93XG5cdHJvb3ROb2RlOiBudWxsLFxuXG5cdC8vIG5vZGUgdGhhdCBob2xkcyBhbGwgbW9kYWwgbm9kZXMgYW5kIGNvbXBvbmVudHNcblx0Ly8gYXR0YWNoZWQgdG8gcm9vdE5vZGVcblx0Y29udGFpbmVyTm9kZTogbnVsbCxcblx0b3V0cHV0Tm9kZTogbnVsbCxcblx0Y29tcG9uZW50czoge1xuXHRcdHRpdGxlOiBudWxsLFxuXHRcdGJvZHk6IG51bGwsXG5cdFx0aW5wdXRzOiBbXVxuXHR9XG59O1xuXG52YXIgYWxlcnRUaW1lb3V0ID0gbnVsbDtcbnZhciBpc0NyZWF0ZWQgPSBmYWxzZTtcbnZhciBtYWluRGl2ID0gbnVsbDtcblxudmFyIHBhcmVudE5vZGVDYWNoZSA9IHt9O1xuXG5Nb2RhbC5zZXR0aW5ncyA9IHtcblx0YWxlcnREdXJhdGlvbjogRW52aXJvbm1lbnQuYWxlcnREdXJhdGlvblxufTtcblxuTW9kYWwuY29tcG9uZW50cyA9IHtcblx0dGl0bGU6IG51bGwsXG5cdGJvZHk6ICdFbXB0eSBtb2RhbC4nLFxuXHRpbnB1dHM6IFtdXG59O1xuXG4vLyB1cGRhdGUgY29tcG9uZW50c1xuTW9kYWwudXBkYXRlID0gZnVuY3Rpb24oKSB7XG5cdGlmIChNb2RhbC50aXRsZSkge1xuXHRcdGlmIChub2Rlcy5jb21wb25lbnRzLnRpdGxlKSB7XG5cdFx0XHRub2Rlcy5jb21wb25lbnRzLnRpdGxlLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuXHRcdFx0bm9kZXMuY29tcG9uZW50cy50aXRsZS5pbm5lckhUTUwgPSBNb2RhbC5jb21wb25lbnRzLnRpdGxlO1xuXHRcdH1cblx0fSBlbHNlIHtcblx0XHRub2Rlcy5jb21wb25lbnRzLnRpdGxlLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG5cdH1cblx0aWYgKG5vZGVzLmNvbXBvbmVudHMuYm9keSkge1xuXHRcdG5vZGVzLmNvbXBvbmVudHMuYm9keS5pbm5lckhUTUwgPSBNb2RhbC5jb21wb25lbnRzLmJvZHk7XG5cdH1cblx0aWYgKE1vZGFsLmlucHV0cy5sZW5ndGgpIHtcblx0XHQvLyBUT0RPXG5cdH1cbn07XG5cbk1vZGFsLmNyZWF0ZSA9IGZ1bmN0aW9uKEludGVyZmFjZXMsIEV2ZW50cywgbWFpbldpbmRvdywgcGFyZW50Tm9kZSkge1xuXHQvLyBnb2VzIG9uIHRvcCBvZiBiYWNrZ3JvdW5kLCBzaW11bGF0ZXMgb3ZlcmxheSBub2RlXG5cdC8vIGluIG9yZGVyIGZvciBpdHMgY2hpbGQgbm9kZXMgdG8gaGF2ZSBjb3JyZWN0IHJlbGF0aXZlXG5cdC8vIHBvc2l0aW9uIHRvIGEgZnVsbCBicm93c2VyIHBhZ2Vcblx0bm9kZXMucm9vdE5vZGUgPSBJbnRlcmZhY2VzLmNvbnRyb2xsZXIuY3JlYXRlRGl2Tm9kZShtYWluV2luZG93KTtcblx0bm9kZXMucm9vdE5vZGUuc3R5bGUud2lkdGggPSAnMTAwJSc7XG5cdG5vZGVzLnJvb3ROb2RlLnN0eWxlLmhlaWdodCA9ICcxMDAlJztcblx0bm9kZXMucm9vdE5vZGUuc3R5bGUucG9zaXRpb24gPSAnZml4ZWQnO1xuXHRub2Rlcy5yb290Tm9kZS5zdHlsZS5sZWZ0ID0gMDtcblx0bm9kZXMucm9vdE5vZGUuc3R5bGUudG9wID0gMDtcblx0bm9kZXMucm9vdE5vZGUuc3R5bGUuekluZGV4ID0gMTAwMDtcblxuXHQvLyBtYWluIHN1Yi1jb250YWluZXIgZm9yIGlucHV0cyAvIHRleHRcblx0bm9kZXMuY29udGFpbmVyTm9kZSA9IEludGVyZmFjZXMuY29udHJvbGxlci5jcmVhdGVEaXZOb2RlKG1haW5XaW5kb3cpO1xuXHRub2Rlcy5jb250YWluZXJOb2RlLmNsYXNzTmFtZSA9ICdQaWN0cmUtcGFzc2NvZGUtd3JhcHBlcic7XG5cblx0Ly8gd3JhcHBlZCBieSBjb250YWluZXJOb2RlLiBXcmFwcyBjb250ZW50LVxuXHQvLyBjb250YWluaW5nIGVsZW1lbnRzIHN1Y2ggYXMgZGl2cywgcGFyYWdyYXBocywgZXRjLlxuXHR2YXIgY29udGFpbmVyTm9kZUNvbnRlbnRXcmFwcGVyID0gSW50ZXJmYWNlcy5jb250cm9sbGVyLmNyZWF0ZURpdk5vZGUobWFpbldpbmRvdyk7XG5cdGNvbnRhaW5lck5vZGVDb250ZW50V3JhcHBlci5jbGFzc05hbWUgPSAnUGljdHJlLXBhc3Njb2RlLWlucHV0LXdyYXBwZXInO1xuXG5cdC8vIHdyYXBwZWQgYnkgY29udGFpbmVyTm9kZUNvbnRlbnRXcmFwcGVyLlxuXHQvLyBtYWluIHRleHQgdmlldyBmb3Igc3BsYXNoIFwibW9kYWxcIlxuXHR2YXIgY29udGFpbmVyTm9kZUNvbnRlbnRXcmFwcGVyVGV4dENvbnRlbnQgPSBJbnRlcmZhY2VzLmNvbnRyb2xsZXIuY3JlYXRlRGl2Tm9kZShtYWluV2luZG93KTtcblx0Y29udGFpbmVyTm9kZUNvbnRlbnRXcmFwcGVyVGV4dENvbnRlbnQuY2xhc3NOYW1lID0gJ1BpY3RyZS1wYXNzY29kZS1wJztcblx0Y29udGFpbmVyTm9kZUNvbnRlbnRXcmFwcGVyVGV4dENvbnRlbnQuc3R5bGUuZm9udFNpemUgPSBcIjAuODVlbVwiO1xuXHRjb250YWluZXJOb2RlQ29udGVudFdyYXBwZXJUZXh0Q29udGVudC5pbm5lckhUTUwgPSAnJztcblxuXHQvLyByZXNldCBpbnB1dHNcblx0bm9kZXMuY29tcG9uZW50cy5pbnB1dHMgPSBbXTtcblxuXHRub2Rlcy5jb21wb25lbnRzLnRpdGxlID0gSW50ZXJmYWNlcy5jb250cm9sbGVyLmNyZWF0ZU5vZGUobWFpbldpbmRvdywgJ2InKTtcblx0bm9kZXMuY29tcG9uZW50cy50aXRsZS5jbGFzc05hbWUgPSAnYnJhbmQnO1xuXHRub2Rlcy5jb21wb25lbnRzLnRpdGxlLnN0eWxlLndpZHRoID0gJzEwMCUnO1xuXHRub2Rlcy5jb21wb25lbnRzLnRpdGxlLnN0eWxlLnRleHRBbGlnbiA9ICdjZW50ZXInO1xuXHRub2Rlcy5jb21wb25lbnRzLnRpdGxlLnN0eWxlLmZvbnRTaXplID0gJzIuMmVtJztcblx0bm9kZXMuY29tcG9uZW50cy50aXRsZS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcblx0bm9kZXMuY29tcG9uZW50cy50aXRsZS5zdHlsZS5tYXJnaW5Cb3R0b20gPSAnMTBweCc7XG5cblx0Ly8gb25seSBkaXNwbGF5IHRpdGxlIGlmIHNldFxuXHRpZiAoTW9kYWwuY29tcG9uZW50cy50aXRsZSkge1xuXHRcdG5vZGVzLmNvbXBvbmVudHMudGl0bGUuaW5uZXJIVE1MID0gTW9kYWwuY29tcG9uZW50cy50aXRsZTtcblx0fVxuXG5cdG5vZGVzLmNvbXBvbmVudHMuYm9keSA9IEludGVyZmFjZXMuY29udHJvbGxlci5jcmVhdGVEaXZOb2RlKG1haW5XaW5kb3cpO1xuXHRub2Rlcy5jb21wb25lbnRzLmJvZHkuaW5uZXJIVE1MID0gTW9kYWwuY29tcG9uZW50cy5ib2R5O1xuXG5cdC8vIHdyYXBwZWQgYnkgY29udGFpbmVyTm9kZUNvbnRlbnRXcmFwcGVyXG5cdC8vIGRpc3BsYXkgYWxlcnRzIG9yIG91dHB1dCB0ZXh0XG5cdG5vZGVzLm91dHB1dE5vZGUgPSBJbnRlcmZhY2VzLmNvbnRyb2xsZXIuY3JlYXRlRGl2Tm9kZShtYWluV2luZG93KTtcblx0bm9kZXMub3V0cHV0Tm9kZS5jbGFzc05hbWUgPSAnUGljdHJlLXBhc3Njb2RlLXAgUGljdHJlLXBhc3Njb2RlLWZvcm1hbC1mb250Jztcblx0bm9kZXMub3V0cHV0Tm9kZS5zdHlsZS5mb250U2l6ZSA9ICcwLjg1ZW0nO1xuXHRub2Rlcy5vdXRwdXROb2RlLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG5cblx0Ly8gY3JlYXRlIG5vZGUgdHJlZVxuXHRjb250YWluZXJOb2RlQ29udGVudFdyYXBwZXJUZXh0Q29udGVudC5hcHBlbmRDaGlsZChub2Rlcy5jb21wb25lbnRzLnRpdGxlKTtcblx0Y29udGFpbmVyTm9kZUNvbnRlbnRXcmFwcGVyVGV4dENvbnRlbnQuYXBwZW5kQ2hpbGQobm9kZXMuY29tcG9uZW50cy5ib2R5KTtcblx0Y29udGFpbmVyTm9kZUNvbnRlbnRXcmFwcGVyLmFwcGVuZENoaWxkKGNvbnRhaW5lck5vZGVDb250ZW50V3JhcHBlclRleHRDb250ZW50KTtcblx0Y29udGFpbmVyTm9kZUNvbnRlbnRXcmFwcGVyLmFwcGVuZENoaWxkKG5vZGVzLm91dHB1dE5vZGUpO1xuXHRpZiAoTW9kYWwuY29tcG9uZW50cy5pbnB1dHMubGVuZ3RoKSB7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBNb2RhbC5jb21wb25lbnRzLmlucHV0cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0bm9kZXMuY29tcG9uZW50cy5pbnB1dHMucHVzaChNb2RhbC5jb21wb25lbnRzLmlucHV0c1tpXSk7XG5cdFx0XHRjb250YWluZXJOb2RlQ29udGVudFdyYXBwZXIuYXBwZW5kQ2hpbGQobm9kZXMuY29tcG9uZW50cy5pbnB1dHNbaV0pO1xuXHRcdH1cblx0fVxuXHRub2Rlcy5jb250YWluZXJOb2RlLmFwcGVuZENoaWxkKGNvbnRhaW5lck5vZGVDb250ZW50V3JhcHBlcik7XG5cdG5vZGVzLnJvb3ROb2RlLmFwcGVuZENoaWxkKG5vZGVzLmNvbnRhaW5lck5vZGUpO1xuXHRwYXJlbnROb2RlLmFwcGVuZENoaWxkKG5vZGVzLnJvb3ROb2RlKTtcblxuXHQvLyBpbml0IHNwbGFzaCBub2RlIGV2ZW50cyBhbmQgYWRqdXN0IHBvc2l0aW9uc1xuXHRFdmVudHMubm93QW5kT25Ob2RlRXZlbnQobWFpbldpbmRvdywgJ3Jlc2l6ZScsIGZ1bmN0aW9uKGUpIHtcblx0XHRJbnRlcmZhY2VzLmNvbnRyb2xsZXIuY2VudGVyTm9kZVJlbGF0aXZlVG8obm9kZXMuY29udGFpbmVyTm9kZSwgbWFpbldpbmRvdyk7XG5cdH0pO1xufTtcblxuLyoqXG4gKiBEaXNwbGF5cyBvciBjcmVhdGVzIHRoZSBtb2RhbCwgdGhlbiBkaXNwbGF5cy5cbiAqIHJlY2VpdmVzIGFuIG9wdGlvbmFsIGFycmF5IG9mIGlucHV0cyB0byBkaXNwbGF5XG4gKi9cbk1vZGFsLnNob3cgPSBmdW5jdGlvbihJbnRlcmZhY2VzLCBFdmVudHMsIG1haW5XaW5kb3csIHBhcmVudE5vZGUsIGlucHV0c0FycmF5KSB7XG5cdGlmICghaXNDcmVhdGVkKSB7XG5cdFx0aXNDcmVhdGVkID0gdHJ1ZTtcblx0XHRNb2RhbC5jcmVhdGUoSW50ZXJmYWNlcywgRXZlbnRzLCBtYWluV2luZG93LCBwYXJlbnROb2RlKTtcblx0fSBlbHNlIHtcblx0XHRNb2RhbC51cGRhdGUoKTtcblx0XHRJbnRlcmZhY2VzLmNvbnRyb2xsZXIuY2VudGVyTm9kZVJlbGF0aXZlVG8obm9kZXMuY29udGFpbmVyTm9kZSwgbWFpbldpbmRvdyk7XG5cdH1cblxuXHQvLyBhc3N1bWVzIHJvb3ROb2RlIGV4aXN0c1xuXHRpZiAoIXBhcmVudE5vZGVDYWNoZVtwYXJlbnROb2RlLm5vZGVOYW1lXSkge1xuXHRcdHBhcmVudE5vZGVDYWNoZVtwYXJlbnROb2RlLm5vZGVOYW1lXSA9IHBhcmVudE5vZGU7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdG5vZGVzLnJvb3ROb2RlLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xufTtcblxuTW9kYWwuaGlkZSA9IGZ1bmN0aW9uKHBhcmVudE5vZGUpIHtcblx0aWYgKCFpc0NyZWF0ZWQpIHtcblx0XHRyZXR1cm47XG5cdH1cblx0aWYgKCFwYXJlbnROb2RlQ2FjaGVbcGFyZW50Tm9kZS5ub2RlTmFtZV0pIHtcblx0XHRyZXR1cm47XG5cdH1cblx0bm9kZXMucm9vdE5vZGUuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbn07XG5cbk1vZGFsLnNldFRpdGxlID0gZnVuY3Rpb24odGl0bGUpIHtcblx0TW9kYWwuY29tcG9uZW50cy50aXRsZSA9IHRpdGxlO1xufTtcblxuTW9kYWwuc2V0Qm9keSA9IGZ1bmN0aW9uKGJvZHkpIHtcblx0TW9kYWwuY29tcG9uZW50cy5ib2R5ID0gYm9keTtcbn07XG5cbk1vZGFsLnNldElucHV0cyA9IGZ1bmN0aW9uKGlucHV0c0FycmF5KSB7XG5cdGlmIChpbnB1dHNBcnJheSBpbnN0YW5jZW9mIEFycmF5KSB7XG5cdFx0TW9kYWwuY29tcG9uZW50cy5pbnB1dHMgPSBpbnB1dHNBcnJheTtcblx0fVxufTtcblxuTW9kYWwuYWRkSW5wdXQgPSBmdW5jdGlvbihpbnB1dCkge1xuXHRNb2RhbC5jb21wb25lbnRzLmlucHV0cy5wdXNoKGlucHV0KTtcbn07XG5cbk1vZGFsLnNob3dBbGVydCA9IGZ1bmN0aW9uKHRleHQsIHRpbWVvdXQpIHtcblx0aWYgKCFub2Rlcy5vdXRwdXROb2RlKSB7XG5cdFx0cmV0dXJuIGNvbnNvbGUubG9nKCdNT0RBTCBBTEVSVCcsICdFcnJvciBkaXNwbGF5aW5nIGFsZXJ0LCBubyBvdXRwdXROb2RlIGhhcyBiZWVuIGNyZWF0ZWQ7IFwic2hvd1wiIHRoZSBub2RlIGZpcnN0LicpO1xuXHR9XG5cblx0bm9kZXMub3V0cHV0Tm9kZS5pbm5lckhUTUwgPSB0ZXh0O1xuXHRub2Rlcy5vdXRwdXROb2RlLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuXG5cdGlmICghdGltZW91dCkge1xuXHRcdHJldHVybjtcblx0fVxuXG5cdGNsZWFyVGltZW91dChhbGVydFRpbWVvdXQpO1xuXHRhbGVydFRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdG5vZGVzLm91dHB1dE5vZGUuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblx0fSwgdGltZW91dCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1vZGFsOyIsIi8qKlxuICogT3ZlcmxheSBpbnRlcmZhY2VcbiAqL1xuXG52YXIgRW52aXJvbm1lbnQgPSByZXF1aXJlKCcuLi9lbnZpcm9ubWVudC5qcycpO1xudmFyIEltZyA9IHJlcXVpcmUoJy4uL2ltYWdlLmpzJyk7XG5cbnZhciBPdmVybGF5ID0ge307XG5cbnZhciBpc0xvY2tlZCA9IGZhbHNlO1xudmFyIGl0ZXJhdG9yID0gMDtcbnZhciBjb21tZW50cyA9IG51bGw7XG52YXIgaW1hZ2VOb2RlID0gbnVsbDtcbnZhciBkb21FbGVtZW50ID0gbnVsbDtcblxudmFyIG1heEltYWdlTm9kZVdpZHRoID0gODAwO1xudmFyIG1pbkltYWdlTm9kZVRvcE9mZnNldCA9IDU7XG5cbnZhciBjYWxsYmFja3MgPSB7fTtcbnZhciBub2RlcyA9IHtcblx0b3ZlcmxheTogbnVsbCxcblx0aW1hZ2VOb2RlSG9sZGVyOiBudWxsLFxufTtcblxudmFyIGV2ZW50cyA9IHtcblx0Y2xpY2s6IFtdXG59O1xuXG4vLyBzdG9yZXMgbG9hZGVkIGltYWdlIG9iamVjdHNcbi8vIGltYWdlcyBhcmUgc3RvcmVkIGluIGtleS12YWx1ZVxuLy8gcGFpcnMgdXNpbmcgdGhlaXIgVVJJIHN0cmluZy5cbnZhciBjYWNoZSA9IHt9O1xuXG52YXIgaXNDcmVhdGVkID0gZmFsc2U7XG52YXIgaXNTaG93aW5nID0gZmFsc2U7XG5cbi8vIGF0dGVtcHRzIHRvIHJldHJpZXZlIGFuIGltYWdlIHByZXZpb3VzbHkgc3RvcmVkIGluIHRoZSBjYWNoZS5cbi8vIHJldHVybnMgdGhlIGltYWdlIG9iamVjdCBpZiBpbWFnZSBpcyBmb3VuZCBpbiBjYWNoZSwgb3IgbnVsbC5cbk92ZXJsYXkubG9hZEltYWdlRnJvbUNhY2hlID0gZnVuY3Rpb24oaW1hZ2VVUkkpIHtcblx0cmV0dXJuIGNhY2hlW2ltYWdlVVJJXTtcbn07XG5cbi8vIGF0dGVtcHRzIHRvIGxvYWQgYW4gaW1hZ2UgZnJvbSBhIGdpdmVuIFVSSS4gSWYgc3VjY2Vzc2Z1bCxcbi8vIHRoZSBsb2FkZWQgaW1hZ2Ugb2JqZWN0IGlzIHN0b3JlZCBpbiB0aGUgY2FjaGUuIFJlY2VpdmVzXG4vLyBhbiBpbWFnZSBVUkkgYW5kIGEgY2FsbGJhY2sgdG8gYmUgZXhlY3V0ZWQgYWZ0ZXIgbG9hZGluZ1xuLy8gYW4gaW1hZ2Ugc3VjY2Vzc2Z1bGx5LiBJbWFnZXMgYXJlIHN0b3JlZCBpbiBjYWNoZSBieSBVUkkuXG5PdmVybGF5LmxvYWRJbWFnZUZyb21VUkkgPSBmdW5jdGlvbihFdmVudHMsIG1haW5XaW5kb3csIGltYWdlVVJJLCBjYWxsYmFjaykge1xuXHR2YXIgaW1hZ2UgPSBuZXcgSW1nKEV2ZW50cywgbWFpbldpbmRvdywgRW52aXJvbm1lbnQuYmFzZUFQSVVybCArICcvJyArIGltYWdlVVJJKTtcblx0aW1hZ2Uub24oJ2xvYWQnLCBmdW5jdGlvbihlcnIsIGUpIHtcblx0XHRpZiAoZXJyKSB7XG5cdFx0XHRyZXR1cm4gY2FsbGJhY2suY2FsbChPdmVybGF5LCBlcnIsIG51bGwpO1xuXHRcdH1cblx0XHRjYWNoZVtpbWFnZVVSSV0gPSBpbWFnZTtcblx0XHRjYWxsYmFjay5jYWxsKE92ZXJsYXksIG51bGwsIGltYWdlKTtcblx0fSk7XG59O1xuXG5PdmVybGF5LmlzTG9ja2VkID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiBpc0xvY2tlZDtcbn07XG5cbk92ZXJsYXkuY2xpY2tIYW5kbGVyID0gZnVuY3Rpb24oZSkge1xuXHRmb3IgKHZhciBpID0gMDsgaSA8IGV2ZW50cy5jbGljay5sZW5ndGg7IGkrKykge1xuXHRcdGV2ZW50cy5jbGlja1tpXS5jYWxsKE92ZXJsYXksIGUpO1xuXHR9XG59O1xuXG5PdmVybGF5LmNyZWF0ZSA9IGZ1bmN0aW9uKEV2ZW50cywgbWFpbldpbmRvdykge1xuXHRpc0NyZWF0ZWQgPSB0cnVlO1xuXG5cdG5vZGVzLm92ZXJsYXkgPSBtYWluV2luZG93LmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHRub2Rlcy5vdmVybGF5LmNsYXNzTmFtZSA9ICdQaWN0cmUtb3ZlcmxheSc7XG5cdG5vZGVzLm92ZXJsYXkuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblx0bm9kZXMub3ZlcmxheS5zdHlsZS56SW5kZXggPSA5OTk7XG5cblx0bm9kZXMuaW1hZ2VOb2RlSG9sZGVyID0gbWFpbldpbmRvdy5kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblx0bm9kZXMuaW1hZ2VOb2RlSG9sZGVyLmNsYXNzTmFtZSA9ICdQaWN0cmUtb3ZlcmxheS1waWMnO1xuXHRub2Rlcy5pbWFnZU5vZGVIb2xkZXIuc3R5bGUubWluV2lkdGggPSBtYXhJbWFnZU5vZGVXaWR0aCArICdweCc7XG5cdG5vZGVzLmltYWdlTm9kZUhvbGRlci5zdHlsZS5tYXhXaWR0aCA9IG1heEltYWdlTm9kZVdpZHRoICsgJ3B4JztcblxuXHRub2Rlcy5vdmVybGF5LmFwcGVuZENoaWxkKG5vZGVzLmltYWdlTm9kZUhvbGRlcik7XG5cdG1haW5XaW5kb3cuZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChub2Rlcy5vdmVybGF5KTtcblxuXHRFdmVudHMub25Ob2RlRXZlbnQobm9kZXMub3ZlcmxheSwgJ2NsaWNrJywgT3ZlcmxheS5jbGlja0hhbmRsZXIpO1xuXHRPdmVybGF5LmFkZENsaWNrSGFuZGxlcihmdW5jdGlvbihlKSB7XG5cdFx0aWYgKHRoaXMuaXNMb2NrZWQoKSkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHR0aGlzLmhpZGUoKTtcblx0fSk7XG59O1xuXG4vLyBkaXNwbGF5IHRoZSBvdmVybGF5IGludGVyZmFjZVxuLy8gcmV0dXJucyB0cnVlIGlmIHN1Y2Nlc3NmdWxcbi8vIGVsc2UgZmFsc2UgaWYgYWxyZWFkeSBzaG93aW5nIFxuT3ZlcmxheS5zaG93ID0gZnVuY3Rpb24oRXZlbnRzLCBtYWluV2luZG93KSB7XG5cdGlmICghaXNDcmVhdGVkKSB7XG5cdFx0T3ZlcmxheS5jcmVhdGUoRXZlbnRzLCBtYWluV2luZG93KTtcblx0fVxuXHRpZiAoaXNTaG93aW5nKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0aXNTaG93aW5nID0gdHJ1ZTtcblx0JChub2Rlcy5vdmVybGF5KS5mYWRlSW4oNjAwKTtcblx0cmV0dXJuIHRydWU7XG59O1xuXG4vLyByZXR1cm5zIHRydWUgaWYgc3VjY2Vzc2Z1bCwgZmFsc2Ugb3RoZXJ3aXNlXG5PdmVybGF5LnNob3dXaXRoUGljdHVyZSA9IGZ1bmN0aW9uKEludGVyZmFjZXMsIEV2ZW50cywgbWFpbldpbmRvdywgcGljdHVyZSkge1xuXHR2YXIgaXNTaG93aW5nID0gT3ZlcmxheS5zaG93KEV2ZW50cywgbWFpbldpbmRvdyk7XG5cdGlmICghaXNTaG93aW5nKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0T3ZlcmxheS5zZXRQaWN0dXJlKEludGVyZmFjZXMsIEV2ZW50cywgbWFpbldpbmRvdywgcGljdHVyZSk7XG5cdHJldHVybiB0cnVlO1xufVxuXG5PdmVybGF5LmxvY2sgPSBmdW5jdGlvbigpIHtcblx0aXNMb2NrZWQgPSB0cnVlO1xufTtcblxuT3ZlcmxheS51bmxvY2sgPSBmdW5jdGlvbigpIHtcblx0aXNMb2NrZWQgPSBmYWxzZTtcbn07XG5cbk92ZXJsYXkuaGlkZSA9IGZ1bmN0aW9uKG1haW5XaW5kb3cpIHtcblx0aWYgKCFub2Rlcy5vdmVybGF5KSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdGlmICghaXNTaG93aW5nKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0aXNTaG93aW5nID0gZmFsc2U7XG5cdCQobm9kZXMub3ZlcmxheSkuZmFkZU91dCg2MDApO1xufVxuXG5PdmVybGF5LnNldFBpY3R1cmUgPSBmdW5jdGlvbihJbnRlcmZhY2VzLCBFdmVudHMsIG1haW5XaW5kb3csIHBpY3R1cmUpIHtcblx0dmFyIGltYWdlVVJJID0gcGljdHVyZS5nZXRJbWFnZVVSSSgpXG5cdGlmICghaW1hZ2VVUkkpIHtcblx0XHRjb25zb2xlLmxvZygnV0FSTicsICdJZ25vcmluZyBwaWN0dXJlIG9iamVjdCB3aXRoIG5vIGltYWdlIGRhdGEuJyk7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0Ly8gYXR0ZW1wdCB0byBsb2FkIGFuIGV4aXN0aW5nIGltYWdlIG9iamVjdFxuXHR2YXIgaW1hZ2UgPSBPdmVybGF5LmxvYWRJbWFnZUZyb21DYWNoZShpbWFnZVVSSSk7XG5cdGlmICghaW1hZ2UpIHtcblx0XHRyZXR1cm4gT3ZlcmxheS5sb2FkSW1hZ2VGcm9tVVJJKEV2ZW50cywgbWFpbldpbmRvdywgaW1hZ2VVUkksIGZ1bmN0aW9uKGVyciwgb2JqZWN0KSB7XG5cdFx0XHRpbWFnZSA9IG9iamVjdDtcblx0XHRcdE92ZXJsYXkuc2V0SW1hZ2VOb2RlKEludGVyZmFjZXMsIG1haW5XaW5kb3csIGltYWdlKTtcblx0XHR9KTtcblx0fVxuXG5cdE92ZXJsYXkuc2V0SW1hZ2VOb2RlKEludGVyZmFjZXMsIG1haW5XaW5kb3csIGltYWdlKTtcbn07XG5cbi8vIHJlY2VpdmVzIGEgbG9hZGVkIGltYWdlIG9iamVjdCBhbmQgYXR0ZW1wdHMgdG8gYXBwZW5kIGl0cyBub2RlXG4vLyB0byB0aGUgb3ZlcmxheSBub2RlLiBJZiB0aGUgb3ZlcmxheSBub2RlIGFscmVhZHkgaGFzIGFuIGltYWdlIG5vZGUsXG4vLyBpdCB3aWxsIGJlIHJlbW92ZWQgcHJpb3IgdG8gYXBwZW5kaW5nIHRoZSBuZXcgb25lLCBpZiB0aGUgbmV3IG9uZVxuLy8gaXMgYSBkaWZmZXJlbnQgbm9kZSB0aGFuIHRoZSBjdXJyZW50bHkgYXBwZW5kZWQgb25lLlxuT3ZlcmxheS5zZXRJbWFnZU5vZGUgPSBmdW5jdGlvbihJbnRlcmZhY2VzLCBtYWluV2luZG93LCBpbWFnZSkge1xuXHR2YXIgbm9kZSA9IGltYWdlLmdldE5vZGUoKTtcblx0aWYgKCFub2RlKSB7XG5cdFx0Y29uc29sZS5sb2coJ1dBUk4nLCAnSWdub3JpbmcgaW1hZ2Ugb2JqZWN0IHdpdGggbm8gaW1hZ2Ugbm9kZS4nKTtcblx0XHRyZXR1cm47XG5cdH1cblx0aWYgKE92ZXJsYXkuaGFzTm9kZShub2RlKSkge1xuXHRcdHJldHVybjtcblx0fVxuXHRpZiAoT3ZlcmxheS5oYXNJbWFnZU5vZGUoKSkge1xuXHRcdE92ZXJsYXkucmVtb3ZlSW1hZ2VOb2RlKCk7XG5cdH1cblxuXHRpbWFnZU5vZGUgPSBub2RlO1xuXHRub2Rlcy5pbWFnZU5vZGVIb2xkZXIuYXBwZW5kQ2hpbGQobm9kZSk7XG5cdGlmIChpbWFnZU5vZGUud2lkdGggPD0gbWF4SW1hZ2VOb2RlV2lkdGgpIHtcblx0XHRub2Rlcy5pbWFnZU5vZGVIb2xkZXIuc3R5bGUud2lkdGggPSBpbWFnZU5vZGUud2lkdGggKyAncHgnO1xuXHR9XG5cdEludGVyZmFjZXMuY29udHJvbGxlci52ZXJ0aWNhbENlbnRlck5vZGVSZWxhdGl2ZVRvKG5vZGVzLmltYWdlTm9kZUhvbGRlciwgbm9kZXMub3ZlcmxheSk7XG5cblx0dmFyIG5lZ2F0aXZlT2Zmc2V0Q2hhciA9IG5vZGVzLmltYWdlTm9kZUhvbGRlci5zdHlsZS50b3Auc3Vic3RyaW5nKDAsIDEpXG5cdGlmIChuZWdhdGl2ZU9mZnNldENoYXIgPT0gJy0nKSB7XG5cdFx0bm9kZXMuaW1hZ2VOb2RlSG9sZGVyLnN0eWxlLnRvcCA9IG1pbkltYWdlTm9kZVRvcE9mZnNldCArICdweCc7XG5cdH1cbn07XG5cbk92ZXJsYXkuZ2V0RmVhdHVyZWRJbWFnZSA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gT3ZlcmxheS5nZXRJbWFnZU5vZGUoKTtcbn07XG5cbk92ZXJsYXkuYWRkQ2xpY2tIYW5kbGVyID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcblx0ZXZlbnRzLmNsaWNrLnB1c2goY2FsbGJhY2spO1xufTtcblxuT3ZlcmxheS5oYXNOb2RlID0gZnVuY3Rpb24obm9kZSkge1xuXHRmb3IgKHZhciBpID0gMDsgaSA8IG5vZGVzLmltYWdlTm9kZUhvbGRlci5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHRcdGlmIChub2Rlcy5pbWFnZU5vZGVIb2xkZXIuY2hpbGRyZW5baV0gPT0gbm9kZSkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXHRcdHJldHVybiBmYWxzZTtcblx0fVxufTtcblxuT3ZlcmxheS5oYXNJbWFnZU5vZGUgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIGltYWdlTm9kZSAhPSBudWxsO1xufTtcblxuT3ZlcmxheS5nZXRJbWFnZU5vZGUgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIGltYWdlTm9kZTtcbn07XG5cbk92ZXJsYXkucmVtb3ZlTm9kZSA9IGZ1bmN0aW9uKG5vZGUpIHtcblx0bm9kZXMuaW1hZ2VOb2RlSG9sZGVyLnJlbW92ZUNoaWxkKG5vZGUpO1xuXHRpZiAoaW1hZ2VOb2RlID09IG5vZGUpIHtcblx0XHRpbWFnZU5vZGUgPSBudWxsO1xuXHR9XG59O1xuXG5PdmVybGF5LnJlbW92ZUltYWdlTm9kZSA9IGZ1bmN0aW9uKCkge1xuXHRpZiAoIWltYWdlTm9kZSkge1xuXHRcdHJldHVybjtcblx0fVxuXHRPdmVybGF5LnJlbW92ZU5vZGUoaW1hZ2VOb2RlKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gT3ZlcmxheTsiLCIvKipcbiAqIFNwbGFzaCBpbnRlcmZhY2UgY29udHJvbGxlciBmb3IgZGlzcGxheWluZ1xuICogdGhlIG1haW4gKGZyb250KSB2aWV3IG9mIHRoZSBhcHAuXG4gKi9cblxudmFyIFNwbGFzaEludGVyZmFjZSA9IHt9O1xuXG5ub2RlcyA9IHtcblx0Ly8gaG9sZHMgXCJzcGxhc2hcIiB2aWV3J3MgYmFja2dyb3VuZFxuXHRyb290Tm9kZTogbnVsbCxcblx0aW5wdXROb2RlOiBudWxsXG59O1xuXG5TcGxhc2hJbnRlcmZhY2Uuc2V0dGluZ3MgPSB7XG5cdGFsZXJ0VGltZW91dDogMTAwMDBcbn07XG5cbnZhciBpc0NyZWF0ZWQgPSBmYWxzZTtcbnZhciBwYXJlbnROb2RlQ2FjaGUgPSB7fTtcblxuU3BsYXNoSW50ZXJmYWNlLnNob3dBbGVydCA9IGZ1bmN0aW9uKEludGVyZmFjZXMsIHRleHQpIHtcblx0SW50ZXJmYWNlcy5tb2RhbC5zaG93QWxlcnQodGV4dCk7XG59O1xuXG5TcGxhc2hJbnRlcmZhY2Uuc2hvd0FsZXJ0V2l0aFRpbWVvdXQgPSBmdW5jdGlvbihJbnRlcmZhY2VzLCB0ZXh0LCB0aW1lb3V0KSB7XG5cdEludGVyZmFjZXMubW9kYWwuc2hvd0FsZXJ0KHRleHQsIHRpbWVvdXQgfHwgU3BsYXNoSW50ZXJmYWNlLnNldHRpbmdzLmFsZXJ0VGltZW91dCk7XG59O1xuXG5TcGxhc2hJbnRlcmZhY2UuYXR0YWNoSW5wdXRzID0gZnVuY3Rpb24oSW50ZXJmYWNlcywgRXZlbnRzLCBDbGllbnQsIG1haW5XaW5kb3cpIHtcblx0aWYgKG5vZGVzLmlucHV0Tm9kZSkge1xuXHRcdEludGVyZmFjZXMubW9kYWwuc2V0SW5wdXRzKFtcblx0XHRcdG5vZGVzLmlucHV0Tm9kZS5nZXROb2RlKClcblx0XHRdKTtcblx0XHRyZXR1cm4gbnVsbDtcblx0fVxuXG5cdG5vZGVzLmlucHV0Tm9kZSA9IEludGVyZmFjZXMuY29udHJvbGxlci5uZXdJbnB1dE5vZGUoRXZlbnRzLCBtYWluV2luZG93KTtcblx0bm9kZXMuaW5wdXROb2RlLnNldFN0eWxlKCdjb2xvcicsICd3aGl0ZScpO1xuXHRub2Rlcy5pbnB1dE5vZGUuc2V0QXR0cmlidXRlKCdtYXhsZW5ndGgnLCAxMDApO1xuXHRub2Rlcy5pbnB1dE5vZGUuc2V0UGxhY2Vob2xkZXIoJ0VudGVyIGFuIGFsYnVtIG5hbWUnKTtcblxuXHRpZiAoQ2xpZW50LmlzSUUoKSB8fCBDbGllbnQuaXNNb2JpbGVTYWZhcmkoKSB8fCBDbGllbnQuaXNTYWZhcmkoJzUuMScpKSB7XG5cdFx0bm9kZXMuaW5wdXROb2RlLnNldEF0dHJpYnV0ZSgnbm9mb2N1cycsIHRydWUpO1xuXHRcdG5vZGVzLmlucHV0Tm9kZS5zZXRBdHRyaWJ1dGUoJ3ZhbHVlJywgdmFsdWUpO1xuXG5cdFx0bm9kZXMuaW5wdXROb2RlLm9uKCdibHVyJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0aWYgKHRoaXMubm9kZS52YWx1ZSA9PSBcIlwiICYmIHRoaXMudmFsdWUgIT0gJycpIHtcblx0XHRcdFx0dGhpcy5ub2RlLnZhbHVlID0gdGhpcy52YWx1ZTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxuXG5cdEV2ZW50cy5vbk5vZGVFdmVudChub2Rlcy5pbnB1dE5vZGUuZ2V0Tm9kZSgpLCAna2V5ZG93bicsIGZ1bmN0aW9uKGUpIHtcblx0XHRpZiAoIWUgfHwgZS5rZXlDb2RlICE9IDEzKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0aWYgKCF0aGlzLmlzVmFsdWVFbXB0eSgpKSB7XG5cdFx0XHR2YXIgdmFsdWUgPSB0aGlzLmdldEVzY2FwZWRWYWx1ZSgpO1xuXHRcdFx0aWYgKCFJbnRlcmZhY2VzLmJvYXJkLmlzTmFtZVJlc3RyaWN0ZWQodmFsdWUpKSB7XG5cdFx0XHRcdGlmIChJbnRlcmZhY2VzLmJvYXJkLmlzTmFtZUludmFsaWQodmFsdWUpKSB7XG5cdFx0XHRcdFx0aWYgKEludGVyZmFjZXMuYm9hcmQuaXNOYW1lV2l0aFNwYWNlcyh2YWx1ZSkpIHtcblx0XHRcdFx0XHRcdFNwbGFzaEludGVyZmFjZS5zaG93QWxlcnRXaXRoVGltZW91dChJbnRlcmZhY2VzLCBcIllvdXIgYWxidW0gbmFtZSBjYW5ub3QgY29udGFpbiBzcGFjZXMuXCIpO1xuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRTcGxhc2hJbnRlcmZhY2Uuc2hvd0FsZXJ0V2l0aFRpbWVvdXQoSW50ZXJmYWNlcywgXCJZb3VyIGFsYnVtIG5hbWUgY29udGFpbnMgaW52YWxpZCBjaGFyYWN0ZXJzLlwiKTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblx0XHRcdFx0bWFpbldpbmRvdy5sb2NhdGlvbi5hc3NpZ24odmFsdWUpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhpcy5zZXRWYWx1ZSgnJyk7XG5cdFx0XHRcdFNwbGFzaEludGVyZmFjZS5zaG93QWxlcnRXaXRoVGltZW91dChJbnRlcmZhY2VzLCBcIlRoYXQgYWxidW0gaXMgcmVzdHJpY3RlZCwgcGxlYXNlIHRyeSBhbm90aGVyLlwiKTtcblx0XHRcdH1cblx0XHR9XG5cdH0uYmluZChub2Rlcy5pbnB1dE5vZGUpKTtcblxuXHRJbnRlcmZhY2VzLm1vZGFsLnNldElucHV0cyhbXG5cdFx0bm9kZXMuaW5wdXROb2RlLmdldE5vZGUoKVxuXHRdKTtcblxuXHRyZXR1cm4gbnVsbDtcbn07XG5cblNwbGFzaEludGVyZmFjZS5zaG93ID0gZnVuY3Rpb24oSW50ZXJmYWNlcywgRXZlbnRzLCBDbGllbnQsIG1haW5XaW5kb3csIHBhcmVudE5vZGUpIHtcblx0aWYgKCFpc0NyZWF0ZWQpIHtcblx0XHRpc0NyZWF0ZWQgPSB0cnVlO1xuXHRcdG5vZGVzLnJvb3ROb2RlID0gSW50ZXJmYWNlcy5jb250cm9sbGVyLmNyZWF0ZURpdk5vZGUobWFpbldpbmRvdyk7XG5cdFx0bm9kZXMucm9vdE5vZGUuY2xhc3NOYW1lID0gJ1BpY3RyZS1zcGxhc2gtd3JhcHBlcic7XG5cdFx0bm9kZXMucm9vdE5vZGUuc3R5bGUuekluZGV4ID0gOTk4O1xuXHR9XG5cdGlmICghcGFyZW50Tm9kZUNhY2hlW3BhcmVudE5vZGUubm9kZU5hbWVdKSB7XG5cdFx0cGFyZW50Tm9kZUNhY2hlW3BhcmVudE5vZGUubm9kZU5hbWVdID0gcGFyZW50Tm9kZTtcblx0XHRwYXJlbnROb2RlLmFwcGVuZENoaWxkKG5vZGVzLnJvb3ROb2RlKTtcblx0fVxuXG5cdC8vIHNldCB0aGVzZSBwcm9wZXJ0aWVzIGV2ZXJ5IHRpbWUsIGluIGNhc2UgbW9kYWwgZ2V0cyB1c2VkIGJ5XG5cdC8vIGFub3RoZXIgYXBwbGljYXRpb24gY29tcG9uZW50IHdpdGggZGlmZmVyZW50IHZhbHVlc1xuXHRJbnRlcmZhY2VzLm1vZGFsLnNldFRpdGxlKCdQaWN0cmUnKTtcblx0SW50ZXJmYWNlcy5tb2RhbC5zZXRCb2R5KFwiPGIgY2xhc3M9J2JyYW5kJz5QaWN0cmU8L2I+IDxzcGFuPmlzIGEgY29sbGVjdGlvbiBvZiBjbG91ZCBwaG90byBhbGJ1bXMuIFlvdSBjYW4gdmlldyBvciBjcmVhdGUgcGljdHVyZSBhbGJ1bXMgYmFzZWQgb24gaW50ZXJlc3RzLCBwZW9wbGUsIG9yIGZhbWlsaWVzLiA8L3NwYW4+XCIgK1xuXHRcdFwiPHNwYW4+VG8gZ2V0IHN0YXJ0ZWQsIHNpbXBseSB0eXBlIGFuIGFsYnVtIG5hbWUgYmVsb3cuPC9zcGFuPlwiKTtcblxuXHR2YXIgYWxidW1JbnB1dCA9IEludGVyZmFjZXMuY29udHJvbGxlci5jcmVhdGVOb2RlKG1haW5XaW5kb3csICdpbnB1dCcpO1xuXHRhbGJ1bUlucHV0Lm1heGxlbmd0aCA9IDEwMDtcblx0YWxidW1JbnB1dC5jbGFzc05hbWUgPSAnUGljdHJlLXBhc3Njb2RlLWlucHV0Jztcblx0YWxidW1JbnB1dC50eXBlID0gJ3RleHQ7J1xuXHRhbGJ1bUlucHV0LnBsYWNlaG9sZGVyID0gJ0VudGVyIGFuIGFsYnVtIG5hbWUnO1xuXHRhbGJ1bUlucHV0LnN0eWxlLmNvbG9yID0gJ3doaXRlJztcblxuXHRTcGxhc2hJbnRlcmZhY2UuYXR0YWNoSW5wdXRzKEludGVyZmFjZXMsIEV2ZW50cywgQ2xpZW50LCBtYWluV2luZG93KTtcblxuXHRJbnRlcmZhY2VzLm92ZXJsYXkuc2hvdyhtYWluV2luZG93KTtcblx0SW50ZXJmYWNlcy5tb2RhbC5zaG93KEludGVyZmFjZXMsIEV2ZW50cywgbWFpbldpbmRvdywgcGFyZW50Tm9kZSk7XG5cblx0SW50ZXJmYWNlcy5jb250cm9sbGVyLnNldE5vZGVPdmVyZmxvd0hpZGRlbihtYWluV2luZG93LmRvY3VtZW50LmJvZHkpO1xuXHRJbnRlcmZhY2VzLm92ZXJsYXkubG9jaygpO1xuXG5cdG5vZGVzLmlucHV0Tm9kZS5nZXROb2RlKCkuZm9jdXMoKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTcGxhc2hJbnRlcmZhY2U7IiwiLyoqXG4gKiBXYXJuaW5nIGludGVyZmFjZS4gRGlzcGxheXMgZXJyb3JzLCB3YXJuaW5ncywgZGlhbG9ndWVzLlxuICovXG5cbnZhciBXYXJuaW5nSW50ZXJmYWNlID0ge1xuXG5cdGRvbUVsZW1lbnQ6IG51bGwsXG5cdHJlc3BvbnNlOiBudWxsLFxuXG5cdC8qKlxuXHQgKiBDcmVhdGVzIGFuZCBkaXNwbGF5cyB3YXJuaW5nIGludGVyZmFjZS5cblx0ICogQHBhcmFtIHByb3BlcnRpZXMgW29iamVjdF0gY29udGFpbmluZyBpbnRlcmZhY2Ugc2V0dGluZ3MgdG8gb3ZlcnJpZGVcblx0ICpcblx0ICovXG5cdHB1dDogZnVuY3Rpb24ocHJvcGVydGllcykge1xuXG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdFx0dmFyIHNldHRpbmdzID0ge1xuXG5cdFx0XHRib2R5OiAnQW4gZXJyb3IgaGFzIG9jY3VycmVkLCBkb25cXCd0IHdvcnJ5IHRob3VnaCwgaXRcXCdzIG5vdCB5b3VyIGZhdWx0IScsXG5cdFx0XHRkcm9wem9uZTogZmFsc2UsXG5cdFx0XHRoZWFkZXI6ICdIZXkhJyxcblx0XHRcdGljb246IG51bGwsXG5cdFx0XHRsb2NrZWQ6IGZhbHNlLFxuXHRcdFx0c3R5bGU6IHRydWUsXG5cdFx0XHRtb2RhbDogdHJ1ZVxuXG5cdFx0fTtcblxuXHRcdGlmIChwcm9wZXJ0aWVzKSB7XG5cblx0XHRcdGZvciAodmFyIGkgaW4gcHJvcGVydGllcykge1xuXHRcdFx0XHRzZXR0aW5nc1tpXSA9IHByb3BlcnRpZXNbaV07XG5cdFx0XHR9XG5cblx0XHR9XG5cblx0XHRpZiAoIXNldHRpbmdzLm1vZGFsKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8vLy0tLVxuXHRcdGlmIChQaWN0cmUuZ2FsbGVyeS5pcy5mZWF0dXJpbmcgJiYgc2V0dGluZ3MubG9ja2VkKSB7XG5cdFx0XHRQaWN0cmUuX3N0b3JhZ2Uub3ZlcmxheS5sb2NrZWQgPSBmYWxzZTtcblx0XHRcdFBpY3RyZS5nYWxsZXJ5Lm92ZXJsYXkuZXhpdCgpO1xuXHRcdH1cblxuXHRcdHRoaXMuZG9tRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG5cdFx0dGhpcy5kb21FbGVtZW50LmNsYXNzTmFtZSA9IFwiUGljdHJlLXVwbG9hZCBQaWN0cmUtd2FybmluZ1wiO1xuXG5cdFx0UGljdHJlLmdhbGxlcnkuaXMud2FybmluZyA9IHRydWU7XG5cblx0XHRQaWN0cmUuZXh0ZW5kKFBpY3RyZS5nYWxsZXJ5Lm92ZXJsYXkucHV0KCkuYXBwZW5kQ2hpbGQodGhpcy5kb21FbGVtZW50KSkub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHR9KTtcblxuXHRcdHRoaXMucG9zaXRpb24oKTtcblxuXHRcdFBpY3RyZS5ldmVudHMub24oJ3Jlc2l6ZScsIGZ1bmN0aW9uKCkge1xuXHRcdFx0c2VsZi5wb3NpdGlvbigpO1xuXHRcdH0pO1xuXG5cdFx0dmFyIGhlYWRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG5cdFx0aGVhZGVyLmNsYXNzTmFtZSA9IFwiUGljdHJlLXVwbG9hZC1oZWFkZXJcIjtcblx0XHRoZWFkZXIuaW5uZXJIVE1MID0gc2V0dGluZ3MuaGVhZGVyO1xuXHRcdGhlYWRlci5zdHlsZS56SW5kZXggPSBcIjk5OVwiO1xuXG5cdFx0dmFyIHAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwicFwiKTtcblx0XHRwLmNsYXNzTmFtZSA9IFwiUGljdHJlLXdhcm5pbmctcFwiO1xuXHRcdHAuaW5uZXJIVE1MID0gc2V0dGluZ3MuYm9keSB8fCBcIlVudGl0bGVkIHRleHRcIjtcblxuXHRcdHRoaXMuZG9tRWxlbWVudC5hcHBlbmRDaGlsZChoZWFkZXIpO1xuXG5cdFx0aWYgKHNldHRpbmdzLmRyb3B6b25lKSB7XG5cdFx0XHR2YXIgc2hhZGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblx0XHRcdHNoYWRlci5jbGFzc05hbWUgPSBcIlBpY3RyZS11cGxvYWQtYXJlYS1zaGFkZXJcIjtcblx0XHRcdHNoYWRlci5hcHBlbmRDaGlsZChwKTtcblx0XHRcdHZhciBhcmVhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblx0XHRcdGFyZWEuY2xhc3NOYW1lID0gXCJQaWN0cmUtdXBsb2FkLWFyZWFcIjtcblx0XHRcdGFyZWEuYXBwZW5kQ2hpbGQoc2hhZGVyKTtcblx0XHRcdHRoaXMuZG9tRWxlbWVudC5hcHBlbmRDaGlsZChhcmVhKTtcblx0XHRcdGFyZWEuc3R5bGUubWFyZ2luTGVmdCA9ICgtYXJlYS5jbGllbnRXaWR0aCAvIDIpICsgXCJweFwiO1xuXHRcdFx0YXJlYS5zdHlsZS5tYXJnaW5Ub3AgPSAoLWFyZWEuY2xpZW50SGVpZ2h0IC8gMiArIDIwKSArIFwicHhcIjtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gbm90IHVwbG9hZCBpbnRlcmZhY2UsIHdhcm5pbmcgdWkgaW5zdGVhZFxuXHRcdFx0dGhpcy5kb21FbGVtZW50LmFwcGVuZENoaWxkKHApO1xuXHRcdFx0cC5zdHlsZS5tYXJnaW5Ub3AgPSAoKHRoaXMuZG9tRWxlbWVudC5jbGllbnRIZWlnaHQgLSBoZWFkZXIuY2xpZW50SGVpZ2h0KSAvIDIgLSAocC5jbGllbnRIZWlnaHQgLyAyKSkgKyBcInB4XCI7XG5cblx0XHRcdGhlYWRlci5zdHlsZS50b3AgPSAoLXAuY2xpZW50SGVpZ2h0KSArICdweCc7XG5cdFx0fVxuXG5cdFx0aWYgKHNldHRpbmdzLmljb24pIHtcblxuXHRcdFx0dmFyIGljb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW1nXCIpO1xuXHRcdFx0aWNvbi5zcmMgPSBzZXR0aW5ncy5pY29uO1xuXHRcdFx0aWNvbi5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiO1xuXHRcdFx0aWNvbi5zdHlsZS5tYXJnaW4gPSBcIjIwcHggYXV0byAwIGF1dG9cIjtcblxuXHRcdFx0cC5hcHBlbmRDaGlsZChpY29uKTtcblxuXHRcdH1cblxuXHRcdGlmIChzZXR0aW5ncy5sb2NrZWQpIHtcblx0XHRcdFBpY3RyZS5fc3RvcmFnZS5vdmVybGF5LmxvY2tlZCA9IHRydWU7XG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiB0aGlzLm9uY2xpY2sgPT0gJ2Z1bmN0aW9uJykge1xuXG5cdFx0XHRpZiAoc2V0dGluZ3MuZHJvcHpvbmUpIHtcblxuXHRcdFx0XHRQaWN0cmUuZXh0ZW5kKGFyZWEpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHNlbGYub25jbGljaygpO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0fSBlbHNlIHtcblxuXHRcdFx0XHRQaWN0cmUuZXh0ZW5kKHRoaXMuZG9tRWxlbWVudCkub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0c2VsZi5vbmNsaWNrKCk7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHR9XG5cblx0XHR9XG5cdH0sXG5cblx0b25jbGljazogbnVsbCxcblxuXHRwb3NpdGlvbjogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKHRoaXMuZG9tRWxlbWVudCkge1xuXHRcdFx0dGhpcy5kb21FbGVtZW50LnN0eWxlLmxlZnQgPSBNYXRoLm1heCgkKHdpbmRvdykud2lkdGgoKSAvIDIgLSAodGhpcy5kb21FbGVtZW50LmNsaWVudFdpZHRoIC8gMiksIDApICsgXCJweFwiO1xuXHRcdFx0dGhpcy5kb21FbGVtZW50LnN0eWxlLnRvcCA9IE1hdGgubWF4KCgkKHdpbmRvdykuaGVpZ2h0KCkgLyAyIC0gKHRoaXMuZG9tRWxlbWVudC5jbGllbnRIZWlnaHQgLyAyKSksIDApICsgXCJweFwiO1xuXHRcdH1cblx0fSxcblxuXHRyZW1vdmU6IGZ1bmN0aW9uKCkge1xuXHRcdFBpY3RyZS5nYWxsZXJ5LmlzLndhcm5pbmcgPSBmYWxzZTtcblx0XHRQaWN0cmUuZ2FsbGVyeS5vdmVybGF5LmV4aXQoKTtcblx0XHR0aGlzLmRvbUVsZW1lbnQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLmRvbUVsZW1lbnQpO1xuXHRcdHRoaXMuZG9tRWxlbWVudCA9IG51bGw7XG5cdH1cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFdhcm5pbmdJbnRlcmZhY2U7IiwiLyoqXG4gKiBQaWN0dXJlIG9iamVjdCBtb2R1bGUuIEFkZHMgUGljdHVyZSBwcm9wZXJ0aWVzIGFuZCBldmVudCBsaXN0ZW5lcnMuXG4gKiBAaW5zdGFuY2VkIG1vZHVsZVxuICpcbiAqIEBhdXRob3IganVhbnZhbGxlam9cbiAqIEBkYXRlIDgvMjEvMTZcbiAqL1xuXG52YXIgSW1nID0gcmVxdWlyZSgnLi9pbWFnZS5qcycpO1xudmFyIHBpY3R1cmVfaW5uZXJfdGV4dCA9ICdMb2FkaW5nLi4uJztcblxuZnVuY3Rpb24gUGljdHVyZShJbnRlcmZhY2VzLCBFdmVudHMsIG1haW5XaW5kb3cpIHtcblx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdHRoaXMubm9kZSA9IEludGVyZmFjZXMuY29udHJvbGxlci5jcmVhdGVEaXZOb2RlKG1haW5XaW5kb3cpO1xuXHR0aGlzLm5vZGUuaW5uZXJIVE1MID0gcGljdHVyZV9pbm5lcl90ZXh0O1xuXHR0aGlzLm5vZGUuY2xhc3NOYW1lID0gJ1BpY3RyZS1waWMnO1xuXG5cdHRoaXMuaW1hZ2VPYmplY3QgPSBudWxsO1xuXG5cdHRoaXMucGFyZW50Tm9kZSA9IG51bGw7XG5cdHRoaXMuaW1hZ2VOb2RlID0gbnVsbDtcblxuXHR0aGlzLmNoaWxkTm9kZXMgPSBbXTtcblx0dGhpcy5kYXRhID0ge307XG5cdHRoaXMuZmxhZ3MgPSB7fTtcblxuXHR0aGlzLmNhbGxiYWNrcyA9IHtcblx0XHRjbGljazogW11cblx0fTtcblxuXHQvLyBjYWxscyBhbGwgZnVuY3Rpb25zIGluIGV2ZW50cy5jYWxsYmFja3MuY2xpY2tcblx0dGhpcy5jbGlja0hhbmRsZXIgPSBmdW5jdGlvbihlKSB7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBzZWxmLmNhbGxiYWNrcy5jbGljay5sZW5ndGg7IGkrKykge1xuXHRcdFx0c2VsZi5jYWxsYmFja3MuY2xpY2tbaV0uY2FsbChzZWxmLCBlKTtcblx0XHR9XG5cdH07XG5cblx0Ly8gc2V0IG5vZGUgaWRcblx0dGhpcy5zZXROb2RlSUQgPSBmdW5jdGlvbihpZCkge1xuXHRcdHRoaXMubm9kZS5pZCA9IGlkO1xuXHR9O1xuXG5cdHRoaXMuZ2V0Tm9kZUlEID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMubm9kZS5pZDtcblx0fTtcblxuXHQvLyBzZXQgb2JqZWN0IGRhdGEgbW9kZWwgKEpTT04gb2JqZWN0IHdpdGggc2VydmVyIG9iamVjdCBwcm9wZXJ0aWVzKVxuXHR0aGlzLnNldERhdGEgPSBmdW5jdGlvbihkYXRhKSB7XG5cdFx0dGhpcy5kYXRhID0gZGF0YTtcblx0fTtcblxuXHQvLyBhc3N1bWVzIHNldERhdGEgaGFzIGFscmVhZHkgYmVlbiBjYWxsZWQuXG5cdC8vIHNldHMgYSBzcGVjaWZpYyBwcm9wZXJ0eSB2YWx1ZSBmb3IgdGhlIGRhdGEgc3RydWN0XG5cdHRoaXMuc2V0RGF0YVZhbHVlID0gZnVuY3Rpb24ocHJvcGVydHksIHZhbHVlKSB7XG5cdFx0dGhpcy5kYXRhW3Byb3BlcnR5XSA9IHZhbHVlO1xuXHR9O1xuXG5cdC8vIHJldHJpZXZlcyBtYWluIGltYWdlIFVSSSBzdG9yZWQgaW4gdGhlIHBpY3R1cmUncyBkYXRhXG5cdHRoaXMuZ2V0SW1hZ2VVUkkgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5kYXRhLnNyYztcblx0fTtcblxuXHQvLyByZXRyaWV2ZSB0aGlzIG5vZGUncyBjb21wdXRlZCBzdHlsZSBmb3Igc3BlY2lmaWMgcHJvcGVydHlcblx0dGhpcy5nZXRDU1NDb21wdXRlZFN0eWxlID0gZnVuY3Rpb24ocHJvcGVydHkpIHtcblx0XHRyZXR1cm4gbWFpbldpbmRvdy5nZXRDb21wdXRlZFN0eWxlKHRoaXMubm9kZSkuZ2V0UHJvcGVydHlWYWx1ZShwcm9wZXJ0eSk7XG5cdH07XG5cblx0dGhpcy5nZXRDU1NDb21wdXRlZFN0eWxlQXNJbnQgPSBmdW5jdGlvbihwcm9wZXJ0eSkge1xuXHRcdHJldHVybiBwYXJzZUludCh0aGlzLmdldENTU0NvbXB1dGVkU3R5bGUocHJvcGVydHkpLnNwbGl0KFwicHhcIilbMF0pO1xuXHR9O1xuXG5cdHRoaXMuZ2V0Tm9kZVByb3BlcnR5VmFsdWUgPSBmdW5jdGlvbihwcm9wZXJ0eSkge1xuXHRcdHJldHVybiB0aGlzLm5vZGVbcHJvcGVydHldXG5cdH07XG5cblx0dGhpcy5zZXROb2RlUHJvcGVydHlWYWx1ZSA9IGZ1bmN0aW9uKHByb3BlcnR5LCB2YWx1ZSkge1xuXHRcdHRoaXMubm9kZVtwcm9wZXJ0eV0gPSB2YWx1ZTtcblx0fTtcblxuXHQvLyBzZXRzIHN0eWxlIHByb3BlcnR5IGZvciBub2RlXG5cdHRoaXMuc2V0Q1NTUHJvcGVydHlWYWx1ZSA9IGZ1bmN0aW9uKHByb3BlcnR5LCB2YWx1ZSkge1xuXHRcdHRoaXMubm9kZS5zdHlsZVtwcm9wZXJ0eV0gPSB2YWx1ZTtcblx0fTtcblxuXHR0aGlzLmdldENTU1Byb3BlcnR5VmFsdWUgPSBmdW5jdGlvbihwcm9wZXJ0eSkge1xuXHRcdHJldHVybiB0aGlzLm5vZGUuc3R5bGVbcHJvcGVydHldO1xuXHR9O1xuXG5cdC8vIHNldHMgdGhpcy5ub2RlJ3MgcGFyZW50XG5cdHRoaXMuc2V0UGFyZW50Tm9kZSA9IGZ1bmN0aW9uKHBhcmVudE5vZGUpIHtcblx0XHRwYXJlbnROb2RlLmFwcGVuZENoaWxkKHRoaXMubm9kZSk7XG5cdFx0dGhpcy5wYXJlbnROb2RlID0gcGFyZW50Tm9kZTtcblx0fTtcblxuXHQvLyBhZGQgZGlzdGluY3RpdmUgZmxhZyB0byBkaWZmZXJlbnRpYXRlIHRoaXMgc3BlY2lmaWMgaW5zdGFuY2UuXG5cdC8vIGZsYWcgaXMgYSBwcm9wZXJ0eSBhZGRlZCB0byB0aGUgY2xhc3MsIG5vdCB0aGUgbm9kZVxuXHR0aGlzLnNldEZsYWcgPSBmdW5jdGlvbihmbGFnLCB2YWx1ZSkge1xuXHRcdHRoaXMuZmxhZ3NbZmxhZ10gPSB2YWx1ZSB8fCB0cnVlO1xuXHR9O1xuXG5cdHRoaXMucmVtb3ZlRmxhZyA9IGZ1bmN0aW9uKGZsYWcpIHtcblx0XHRpZiAodGhpcy5mbGFnc1tmbGFnXSkge1xuXHRcdFx0dGhpcy5mbGFnc1tmbGFnXSA9IGZhbHNlO1xuXHRcdH1cblx0fTtcblxuXHR0aGlzLmdldEZsYWcgPSBmdW5jdGlvbihmbGFnKSB7XG5cdFx0cmV0dXJuIHRoaXMuZmxhZ3NbZmxhZ107XG5cdH07XG5cblx0dGhpcy5oYXNGbGFnID0gZnVuY3Rpb24oZmxhZykge1xuXHRcdHJldHVybiB0aGlzLmZsYWdzW2ZsYWddO1xuXHR9O1xuXG5cdHRoaXMuZ2V0Tm9kZSA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLm5vZGU7XG5cdH07XG5cblx0Ly8gYXBwZW5kcyBhIG5vZGUgZWxlbWVudFxuXHR0aGlzLmFkZENoaWxkTm9kZSA9IGZ1bmN0aW9uKG5vZGUpIHtcblx0XHR0aGlzLmNoaWxkTm9kZXMucHVzaChub2RlKTtcblx0XHR0aGlzLm5vZGUuYXBwZW5kQ2hpbGQobm9kZSk7XG5cdH07XG5cblx0Ly8gYWRkIGltYWdlIG5vZGUgZnJvbSBhbiBJbWcgb2JqZWN0XG5cdHRoaXMuYWRkSW1hZ2UgPSBmdW5jdGlvbihvYmplY3QpIHtcblx0XHRpZiAoIShvYmplY3QgaW5zdGFuY2VvZiBJbWcpKSB7XG5cdFx0XHRyZXR1cm4gY29uc29sZS5sb2coJ0VSUiBQSUNUVVJFX0pTIGFkZEltYWdlJywgJ2F0dGVtcHRlZCB0byBhZGQgYW4gaW5jb3JyZWN0IG9iamVjdCB0eXBlIGFzIGltYWdlIG9iamVjdC4nKTtcblx0XHR9XG5cdFx0dGhpcy5pbWFnZU9iamVjdCA9IG9iamVjdDtcblx0XHR0aGlzLmFkZEltYWdlTm9kZShvYmplY3QuZ2V0Tm9kZSgpKTtcblx0fTtcblxuXHQvLyBhZGQgaW1hZ2UgY2hpbGQgbm9kZVxuXHR0aGlzLmFkZEltYWdlTm9kZSA9IGZ1bmN0aW9uKG5vZGUpIHtcblx0XHR0aGlzLmFkZENoaWxkTm9kZShub2RlKTtcblx0XHR0aGlzLmltYWdlTm9kZSA9IG5vZGU7XG5cdH07XG5cblx0dGhpcy5nZXRJbWFnZU5vZGUgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5pbWFnZU5vZGU7XG5cdH07XG5cblx0dGhpcy5nZXRDaGlsZE5vZGUgPSBmdW5jdGlvbihub2RlSW5kZXgpIHtcblx0XHRyZXR1cm4gdGhpcy5jaGlsZE5vZGVzW25vZGVJbmRleF07XG5cdH07XG5cblx0dGhpcy5nZXRDaGlsZE5vZGVzID0gZnVuY3Rpb24obm9kZUluZGV4KSB7XG5cdFx0cmV0dXJuIHRoaXMuY2hpbGROb2Rlcztcblx0fTtcblxuXHQvLyBhbHRlcnMgb25seSB0aGlzIGluc3RhbmNlLCBzZXRzIG5vZGUgaW5uZXJIVE1MXG5cdHRoaXMuc2V0SW5uZXJUZXh0ID0gZnVuY3Rpb24odGV4dCkge1xuXHRcdHRoaXMubm9kZS5pbm5lckhUTUwgPSB0ZXh0O1xuXHR9O1xuXG5cdC8vIHNldHMgY2FsbGJhY2sgdG8gY2FsbCBvbiBhIGNsaWNrIGV2ZW50XG5cdHRoaXMuYWRkQ2xpY2tIYW5kbGVyID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcblx0XHR0aGlzLmNhbGxiYWNrcy5jbGljay5wdXNoKGNhbGxiYWNrKTtcblx0fTtcblxuXHQvLyBhdHRhY2ggbm9kZSBldmVudHMgdG8gcmVzcGVjdGl2ZSBjYWxsYmFja3Ncblx0YmluZEV2ZW50KEV2ZW50cywgJ2NsaWNrJywgdGhpcy5ub2RlLCB0aGlzLmNsaWNrSGFuZGxlcik7XG59XG5cbi8vIGFsdGVycyBhbGwgbmV3IGluc3RhbmNlc1xuUGljdHVyZS5zZXRJbm5lclRleHQgPSBmdW5jdGlvbih0ZXh0KSB7XG5cdHBpY3R1cmVfaW5uZXJfdGV4dCA9IHRleHQ7XG59O1xuXG4vLyBpbnRlcm5hbCBvYmplY3QgZnVuY3Rpb25zXG5mdW5jdGlvbiBiaW5kRXZlbnQoRXZlbnRzLCBldmVudE5hbWUsIG5vZGUsIGhhbmRsZXIpIHtcblx0RXZlbnRzLm9uTm9kZUV2ZW50KG5vZGUsIGV2ZW50TmFtZSwgaGFuZGxlcik7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUGljdHVyZTsiLCIvKipcbiAqIE1vZHVsZSBmb3IgaGFuZGxpbmcgc2VydmVyIHJlcXVldHNcbiAqL1xuXG52YXIgRW52aXJvbm1lbnQgPSByZXF1aXJlKCcuL2Vudmlyb25tZW50LmpzJyk7XG52YXIgU2VydmVyID0ge307XG5cblNlcnZlci5jb21wb25lbnRzID0ge1xuXHRhbmNob3I6IDAsXG5cdGxpbWl0OiBFbnZpcm9ubWVudC5pdGVtQW1vdW50UGFnZUxvYWRcbn1cblxuLy8gL2FwaS9hbGJ1bS88YWxidW1uYW1lPi9vZmZzZXQ8MD4vbGltaXQ8MTAwPlxuU2VydmVyLmdldCA9IGZ1bmN0aW9uKGVuZHBvaW50LCBjYWxsYmFjaykge1xuXHR2YXIgcmVxdWVzdCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXHRyZXF1ZXN0Lm9wZW4oJ0dFVCcsIGVuZHBvaW50LCB0cnVlKTtcblxuXHRpZiAod2luZG93LlhEb21haW5SZXF1ZXN0KSB7XG5cdFx0dmFyIHhkciA9IG5ldyBYRG9tYWluUmVxdWVzdCgpO1xuXHRcdHhkci5vcGVuKFwiZ2V0XCIsIGVuZHBvaW50KTtcblx0XHR4ZHIuc2VuZChudWxsKTtcblx0XHR4ZHIub25sb2FkID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRjYWxsYmFjay5jYWxsKHhkciwgbnVsbCwgeGRyLnJlc3BvbnNlVGV4dCk7XG5cdFx0fTtcblx0XHR4ZHIub25lcnJvciA9IGZ1bmN0aW9uKGVycm9yKSB7XG5cdFx0XHRjYWxsYmFjay5jYWxsKHhkciwgZXJyb3IsIG51bGwpO1xuXHRcdH07XG5cdH0gZWxzZSB7XG5cdFx0JC5zdXBwb3J0LmNvcnMgPSB0cnVlO1xuXHRcdCQuYWpheCh7XG5cdFx0XHR0eXBlOiAnR0VUJyxcblx0XHRcdHVybDogZW5kcG9pbnQsXG5cdFx0XHRhc3luYzogdHJ1ZSxcblx0XHRcdGNyb3NzRG9tYWluOiB0cnVlLFxuXHRcdFx0c3VjY2VzczogZnVuY3Rpb24oZGF0YSkge1xuXHRcdFx0XHRjYWxsYmFjay5jYWxsKHRoaXMsIG51bGwsIGRhdGEpO1xuXHRcdFx0fSxcblx0XHRcdGVycm9yOiBmdW5jdGlvbihlcnJvcikge1xuXHRcdFx0XHRjYWxsYmFjay5jYWxsKHRoaXMsIGVycm9yLCBudWxsKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxufTtcblxuU2VydmVyLmdldEFsYnVtU2l6ZSA9IGZ1bmN0aW9uKGFsYnVtTmFtZSwgY2FsbGJhY2spIHtcblx0U2VydmVyLmdldCgnL2FwaS9hbGJ1bXNpemUvJyArIGFsYnVtTmFtZSwgZnVuY3Rpb24oZXJyLCByZXNwb25zZSkge1xuXHRcdGlmIChlcnIpIHtcblx0XHRcdHJldHVybiBjYWxsYmFjay5jYWxsKFNlcnZlciwgZXJyLCBudWxsKTtcblx0XHR9XG5cblx0XHR0cnkge1xuXHRcdFx0Y2FsbGJhY2suY2FsbChTZXJ2ZXIsIG51bGwsIHJlc3BvbnNlKVxuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGNhbGxiYWNrLmNhbGwoU2VydmVyLCBlLCBudWxsKTtcblx0XHR9XG5cdH0pO1xufTtcblxuLy8gcmV0cmlldmVzIGFsYnVtIGRhdGEgc3RhcnRpbmcgYXQgYSBzcGVjaWZpYyBhbmNob3JcblNlcnZlci5nZXRBbGJ1bUF0QW5jaG9yID0gZnVuY3Rpb24oYWxidW1OYW1lLCBvZmZzZXQsIGxpbWl0LCBjYWxsYmFjaykge1xuXHRTZXJ2ZXIuZ2V0KCcvYXBpL2FsYnVtLycgKyBhbGJ1bU5hbWUgKyAnLycgKyBvZmZzZXQgKyAnLycgKyBsaW1pdCwgZnVuY3Rpb24oZXJyLCByZXNwb25zZSkge1xuXHRcdGlmIChlcnIpIHtcblx0XHRcdHJldHVybiBjYWxsYmFjay5jYWxsKFNlcnZlciwgZXJyLCBudWxsKTtcblx0XHR9XG5cblx0XHR0cnkge1xuXHRcdFx0Y2FsbGJhY2suY2FsbChTZXJ2ZXIsIG51bGwsIHJlc3BvbnNlKTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRjYWxsYmFjay5jYWxsKFNlcnZlciwgZSwgbnVsbCk7XG5cdFx0fVxuXHR9KTtcbn07XG5cblNlcnZlci5nZXRBbGJ1bSA9IGZ1bmN0aW9uKGFsYnVtTmFtZSwgY2FsbGJhY2spIHtcblx0U2VydmVyLmdldEFsYnVtQXRBbmNob3IoYWxidW1OYW1lLCBTZXJ2ZXIuY29tcG9uZW50cy5hbmNob3IsIFNlcnZlci5jb21wb25lbnRzLmxpbWl0LCBjYWxsYmFjayk7XG59O1xuXG5TZXJ2ZXIuc2V0UmVxdWVzdEFuY2hvciA9IGZ1bmN0aW9uKGRhdGEpIHtcblx0U2VydmVyLmNvbXBvbmVudHMuYW5jaG9yID0gZGF0YTtcbn07XG5cblNlcnZlci5zZXRSZXF1ZXN0TGltaXQgPSBmdW5jdGlvbihkYXRhKSB7XG5cdFNlcnZlci5jb21wb25lbnRzLmxpbWl0ID0gZGF0YTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTZXJ2ZXI7IiwiLyoqXG4gKiBIZWxwZXIgZnVuY3Rpb25zXG4gKi9cblxudmFyIFV0aWxpdGllcyA9IHt9O1xuXG5VdGlsaXRpZXMuZXh0ZW5kID0gZnVuY3Rpb24oZG9tT2JqZWN0KSB7XG5cblx0cmV0dXJuIHtcblx0XHRvbjogZnVuY3Rpb24odHlwZSwgY2FsbGJhY2spIHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGRvbU9iamVjdC5hZGRFdmVudExpc3RlbmVyKHR5cGUsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdFx0XHRpZiAodHlwZW9mIGNhbGxiYWNrID09ICdmdW5jdGlvbicpIGNhbGxiYWNrLmNhbGwoZG9tT2JqZWN0LCBlKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdGRvbU9iamVjdC5hdHRhY2hFdmVudCgnb24nICsgdHlwZSwgZnVuY3Rpb24oZSkge1xuXHRcdFx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2suY2FsbChkb21PYmplY3QsIGUpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9XG5cdH07XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBVdGlsaXRpZXM7Il19
