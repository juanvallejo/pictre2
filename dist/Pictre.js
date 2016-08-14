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

		// } else {
		// 	Pictre.board.exists = true;
		// 	var wrapper = document.createElement("div");
		// 	wrapper.id = "Pictre-wrapper";
		// 	applicationWrapper.appendChild(wrapper);
		// 	this.set.wrapper(wrapper);
		// 	Pictre.get.ui.notice("Loading, please wait...");
		// 	Pictre.get.db({
		// 		album: true,
		// 		resource: 'album',
		// 		limit: Pictre._settings.data.limit.pageload
		// 	}, function(data) {

		// 		// detect 'loading bar' demo
		// 		if (Pictre._settings.demo.loader) {

		// 			console.log("Warning: loader demo active.");

		// 			(function demo(n, t) {
		// 				if (t) clearTimeout(t);
		// 				t = setTimeout(function() {
		// 					Pictre.get.ui.loader.put(n);
		// 					n += 0.002;
		// 					if (n >= 0.995) n = 0;
		// 					demo(n, t);
		// 				}, 1000 / 60);
		// 			})(0);

		// 		} else {
		// 			Pictre.load(data);
		// 		}

		// 	});

		// 	Pictre.events.on('dragover', function() {
		// 		if (!Pictre.gallery.is.featuring && !Pictre.is.spotlight && Pictre._settings.allowUploads) Pictre.get.ui.upload.put();
		// 	});

		// 	Pictre.events.on('hashchange', function() {
		// 		Pictre.get.hash();
		// 	});
		// }
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
	head: Environment.itemAmountPageLoad
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

Board.setLoader = function(ratio) {
	if (!nodes.loaderNode) {
		return;
	}

	nodes.loaderNode.style.display = 'block';
	if (nodes.loaderNode.children) {
		nodes.loaderNode.children[0].style.width = Math.max(ratio * 100, 0) + '%';
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
	var picture = Interfaces.controller.createDivNode(mainWindow);
	picture.className = 'Pictre-pic';
	picture.id = 'pic' + object.id;
	picture.data = object;

	var image = new Image();
	image.src = Environment.baseAPIUrl + '/' + object.thumb;

	if (!isLoadedImages && nodes.rootNode.style.display != 'none') {
		nodes.rootNode.style.display = 'none';
	}

	Events.onNodeEvent(image, 'load', function() {
		return (function(picture, image) {
			imageLoadHandler(picture, image);
		})(picture, image);
	});

	Events.onNodeEvent(image, 'error', function() {
		var height = Environment.maxImageHeight;
		var paddingTop = parseInt(mainWindow.getComputedStyle(picture).getPropertyValue('padding-top').split("px")[0]) + 1;
		var paddingBottom = parseInt(mainWindow.getComputedStyle(picture).getPropertyValue('padding-bottom').split("px")[0]);

		var errImg = new Image();
		errImg.src = '/static/i/Pictre-404.png';

		this.innerHTML = '';
		this.data.src = '/static/i/Pictre-404.full.png';
		this.style.height = (height - paddingTop + paddingBottom * 2) + 'px';

		imageLoadHandler(this, errImg);
	}.bind(picture));
};

// loads a json array of images into the board
Board.load = function(Interfaces, Events, mainWindow, objects) {
	isLoading = true;

	function handler(picture, image) {
		Board.imageLoadHandler(picture, image, objects.length);
	}

	for (var i in objects) {
		Board.loadImage(Interfaces, Events, mainWindow, objects[i], handler);
	}
};

// called when a single image is loaded
Board.imageLoadHandler = function(picture, image, setCount) {
	loadedImageCount++;

	// no anchor means blank room for loader
	if (!Board.albumRequestComponents.anchor) {
		Board.setLoader(loadedImageCount / setCount);
	}

	// build tree
	picture.appendChild(image);
	nodes.rootNode.appendChild(picture);

	Board.pictures.push(picture);

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

// alert entire board
Board.update = function(Interfaces, Events, Server, mainWindow) {
	if (!isCreated) {
		return;
	}

	// request first set of images
	Server.setRequestAnchor(Board.albumRequestComponents.anchor);
	Server.setRequestHead(Board.albumRequestComponents.head);
	Server.getAlbum(Board.getName().toLowerCase(), function(err, data) {
		if (err) {
			Board.showAlert('Error: Unable to load images...');
			return console.log('ERR SERVER ALBUM REQUEST', err);
		}

		Board.load(Interfaces, Events, mainWindow, data);
	});

	// update alertNodeComponents
	Board.updateAlertComponents();
};

Board.updateAlertComponents = function() {
	if (Board.alertNodeComponents.extra) {
		nodes.alertNodeComponents.extra.innerHTML = Board.alertNodeComponents.extra;
	} else {
		nodes.alertNodeComponents.extra.innerHTML = '';
	}
	nodes.alertNodeComponents.body.innerHTML = Board.alertNodeComponents.body;
};

// create all board components
Board.create = function(Interfaces, Events, mainWindow, parentNode) {
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
		isCreated = true;
		Board.create(Interfaces, Events, mainWindow, parentNode);
	}

	Board.update(Interfaces, Events, Server, mainWindow);
	Board.on('load', function(setCount) {
		Board.showAlert(Board.getName() + ' Picture Board', setCount);
		Board.chisel(mainWindow);
	});

	Board.on('chisel', function(node, itemMargin) {
		parentNode.style.height = (node.scrollHeight + itemMargin) + "px";
		Interfaces.controller.horizontalCenterNodeRelativeTo(node, mainWindow);
	});

	Events.onNodeEvent(mainWindow, 'resize', function() {
		Board.chisel(mainWindow);
	});

};

Board.showAlert = function(bodyText, extraText) {
	if (!nodes.alertNode) {
		return console.log('BOARD ALERT', 'An attempt was made to place an alert without "show"ing the board first.');
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

Board.setRequestHead = function(head) {
	Board.albumRequestComponents.head = head;
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

// expects an offset (or zero)
// scaffolds picture gallery
Board.chisel = function(mainWindow, offset) {
	if (!nodes.rootNode || !mainWindow || !Board.getSize()) {
		return;
	}

	var windowWidth = mainWindow.innerWidth;
	var itemWidth = Board.pictures[0].offsetWidth;
	var itemMargin = 0;
	var columnCount = 0;

	if (windowWidth && itemWidth) {
		itemMargin = parseInt(mainWindow.getComputedStyle(Board.pictures[0]).getPropertyValue('margin-left').split("px")[0] * 2);
		columnCount = Math.floor(windowWidth / (itemWidth + itemMargin));

		if (columnCount > Board.getSize()) {
			columnCount = Board.getSize();
		}

		// prevent any further action if column count has not changed
		if (columnCount == cache.lastColumnCount) {
			return;
		}

		nodes.rootNode.style.width = (columnCount * (itemWidth + (itemMargin))) + "px";
		cache.lastColumnCount = columnCount;

		if (offset) {
			// var x = a + 1;
			// for (var i = x; i < x + Pictre._settings.data.limit.request; i++) {
			// 	var top = parseInt(this._storage.pictures[i - columnCount].style.top.split("px")[0]) + this._storage.pictures[i - columnCount].offsetHeight + itemMargin;
			// 	this._storage.pictures[i].style.left = this._storage.pictures[i - columnCount].style.left;
			// 	this._storage.pictures[i].style.top = top + "px";
			// }
		} else {
			for (var i = 0; i < Board.pictures.length; i++) {
				Board.pictures[i].first = false;
				Board.pictures[i].style.clear = 'none';
				Board.pictures[i].style.top = '0px';
				Board.pictures[i].style.left = '0px';
			}
			for (var i = 0; i < Board.pictures.length; i += columnCount) {
				Board.pictures[i].first = true;
			}
			for (var i = 0; i < Board.pictures.length; i++) {
				if (!Board.pictures[i].first) {
					Board.pictures[i].style.left = (parseInt(Board.pictures[i - 1].style.left.split("px")[0]) + Board.pictures[i - 1].offsetWidth + itemMargin) + "px";
				}
			}
			for (var i = 0; i < Board.pictures.length; i++) {
				if (Board.pictures[i + columnCount]) {
					Board.pictures[i + columnCount].style.top = ((Board.pictures[i].offsetTop + Board.pictures[i].offsetHeight + itemMargin) - (Board.pictures[i + columnCount].offsetTop)) + "px";
				}
			}
		}

		Board.emit('chisel', [nodes.rootNode, itemMargin]);
	}
};

Board.getImageByIndex = function(index) {
	var picture = Board.getPictureByIndex(index)
	if (picture) {
		return picture.children[0];
	}
	return null;
};

Board.getImageById = function(id) {
	for (var i = 0; i < Board.pictures.length; i++) {
		if (Board.pictures[i].data.id == id) {
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
},{"../environment.js":"/Volumes/TINY/Documents/Pictre-pro/src/environment.js"}],"/Volumes/TINY/Documents/Pictre-pro/src/interfaces/controller.js":[function(require,module,exports){
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

var OverlayInterface = {};

var isLocked = false;
var iterator = 0;
var comments = null;
var domElement = null;
var featuredImage = null;

var callbacks = {};
var nodes = {
	overlay: null
};

OverlayInterface.isLocked = function() {
	return isLocked;
}

OverlayInterface.show = function(mainWindow) {
	if (!nodes.overlay) {
		nodes.overlay = mainWindow.document.createElement('div');
		nodes.overlay.className = 'Pictre-overlay';
		nodes.overlay.style.display = 'none';
		nodes.overlay.style.zIndex = 999;
		mainWindow.document.body.appendChild(nodes.overlay);
	}

	$(nodes.overlay).fadeIn(600);
}

OverlayInterface.lock = function() {
	isLocked = true;
};

OverlayInterface.unlock = function() {
	isLocked = false;
};

OverlayInterface.hide = function(mainWindow) {
	if (!nodes.overlay) {
		return;
	}

	$(nodes.overlay).fadeOut(600);
}

OverlayInterface.getFeaturedImage = function() {
	return featuredImage;
};

module.exports = OverlayInterface;
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
},{}],"/Volumes/TINY/Documents/Pictre-pro/src/server.js":[function(require,module,exports){
/**
 * Module for handling server requets
 */

var Environment = require('./environment.js');
var Server = {};

Server.components = {
	anchor: 0,
	head: Environment.itemAmountPageLoad
}

// /api/album/<albumname>/from<0>/tolimit<100>
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

// retrieves album images starting at specific index
Server.getAlbumAtAnchor = function(albumName, from, to, callback) {
	Server.get('/api/album/' + albumName + '/' + from + '/' + to, function(err, response) {
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
	Server.getAlbumAtAnchor(albumName, Server.components.anchor, Server.components.head, callback);
};

Server.setRequestAnchor = function(data) {
	Server.components.anchor = data;
};

Server.setRequestHead = function(data) {
	Server.components.head = data;
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvbWFpbi5qcyIsInNyYy9jbGllbnQuanMiLCJzcmMvZW52aXJvbm1lbnQuanMiLCJzcmMvZXZlbnRzLmpzIiwic3JjL2ludGVyZmFjZS5qcyIsInNyYy9pbnRlcmZhY2VzL2JvYXJkLmpzIiwic3JjL2ludGVyZmFjZXMvY29udHJvbGxlci5qcyIsInNyYy9pbnRlcmZhY2VzL2dhbGxlcnkuanMiLCJzcmMvaW50ZXJmYWNlcy9pbmRleC5qcyIsInNyYy9pbnRlcmZhY2VzL21lbnUuanMiLCJzcmMvaW50ZXJmYWNlcy9tb2RhbC5qcyIsInNyYy9pbnRlcmZhY2VzL292ZXJsYXkuanMiLCJzcmMvaW50ZXJmYWNlcy9zcGxhc2guanMiLCJzcmMvaW50ZXJmYWNlcy93YXJuaW5nLmpzIiwic3JjL3NlcnZlci5qcyIsInNyYy91dGlsaXRpZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogUGljdHJlIGNsaWVudCBjb3JlLiBVc2VzIGJyb3dzZXJpZnkgdG8gbWFpbnRhaW5cbiAqIE5vZGUtbGlrZSBtb2R1bGFyIHN0cnVjdHVyZS4gRG8gJ25wbSBpbnN0YWxsJyBpbiBvcmRlclxuICogdG8gb2J0YWluIGFsbCByZXF1aXJlZCBkZXYgcGFja2FnZXMuIEJ1aWxkIHN5c3RlbSBpcyAnZ3VscCcuXG4gKiBCdWlsZHMgdG8gJy9kaXN0L1BpY3RyZS5qcycuXG4gKlxuICogQGF1dGhvciBqdWFudmFsbGVqb1xuICogQGRhdGUgNS8zMS8xNVxuICovXG5cbnZhciBDbGllbnQgPSByZXF1aXJlKCcuL2NsaWVudC5qcycpO1xudmFyIEVudmlyb25tZW50ID0gcmVxdWlyZSgnLi9lbnZpcm9ubWVudC5qcycpO1xudmFyIEludGVyZmFjZXMgPSByZXF1aXJlKCcuL2ludGVyZmFjZS5qcycpO1xudmFyIEV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzLmpzJyk7XG52YXIgU2VydmVyID0gcmVxdWlyZSgnLi9zZXJ2ZXIuanMnKTtcblxudmFyIFBpY3RyZSA9IHt9O1xuXG4vKipcbiAqIEluaXRpYWxpemVzIGFwcGxpY2F0aW9uIHZhcmlhYmxlcyBhbmQgZGVmYXVsdCBzZXR0aW5ncy5cbiAqXG4gKiBAcGFyYW0gYXBwbGljYXRpb25XcmFwcGVyIFx0W1N0cmluZ10gZG9tIGVsZW1lbnQgaWQgb2YgYXBwbGljYXRpb24gY29udGFpbmVyXG4gKiBAcGFyYW0gcmVzb3VyY2VMb2NhdGlvbiBcdFx0W1N0cmluZ10gdXJsIG9mIGNsb3VkIGRpcmVjdG9yeSBjb250YWluaW5nIGFsbCBpbWFnZXNcbiAqIEBwYXJhbSBhcHBEYXRhTG9jYXRpb24gXHRcdFtTdHJpbmddIHVybCBvZiBjbG91ZCBkaXJlY3RvcnkgY29udGFpbmluZyBhcHBsaWNhdGlvbiBmaWxlc1xuICovXG5QaWN0cmUuaW5pdCA9IGZ1bmN0aW9uKG1haW5XaW5kb3csIGFwcGxpY2F0aW9uV3JhcHBlciwgcmVzb3VyY2VMb2NhdGlvbiwgYXBwRGF0YUxvY2F0aW9uLCBkZXZlbG9wZXJNb2RlKSB7XG5cdHZhciBzcGFjZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuXHRzcGFjZXIuY2xhc3NOYW1lID0gXCJQaWN0cmUtc3BhY2VyXCI7XG5cblx0aWYgKHJlc291cmNlTG9jYXRpb24pIHtcblx0XHRFbnZpcm9ubWVudC5jbG91ZC5kYXRhZGlyID0gcmVzb3VyY2VMb2NhdGlvbjtcblx0fVxuXHRpZiAoYXBwRGF0YUxvY2F0aW9uKSB7XG5cdFx0RW52aXJvbm1lbnQuY2xvdWQuYWRkcmVzcyA9IGFwcERhdGFMb2NhdGlvbjtcblx0fVxuXHRpZiAoIWRldmVsb3Blck1vZGUpIHtcblx0XHRFbnZpcm9ubWVudC5pblByb2R1Y3Rpb24gPSB0cnVlO1xuXHR9XG5cblx0Ly8gY3JlYXRlIGFuZCBwbGFjZSBtZW51IGJlZm9yZSBhcHBsaWNhdGlvbiB3cmFwcGVyXG5cdEludGVyZmFjZXMubWVudS5wdXQobWFpbldpbmRvdy5kb2N1bWVudC5ib2R5LCBhcHBsaWNhdGlvbldyYXBwZXIpO1xuXG5cdC8vIGRldGVjdCBjbGllbnQgc2V0dGluZ3Ncblx0Q2xpZW50LmluaXQoKTtcblxuXHRpZiAoSW50ZXJmYWNlcy5ib2FyZC5pc1NldCgpKSB7XG5cdFx0dmFyIGJvYXJkTmFtZSA9IEludGVyZmFjZXMuYm9hcmQuZ2V0TmFtZSgpO1xuXHRcdGlmIChJbnRlcmZhY2VzLmJvYXJkLmlzTmFtZVJlc3RyaWN0ZWQoYm9hcmROYW1lKSB8fCBJbnRlcmZhY2VzLmJvYXJkLmlzTmFtZUludmFsaWQoYm9hcmROYW1lKSkge1xuXHRcdFx0SW50ZXJmYWNlcy5zcGxhc2guc2hvdyhJbnRlcmZhY2VzLCBFdmVudHMsIENsaWVudCwgbWFpbldpbmRvdywgbWFpbldpbmRvdy5kb2N1bWVudC5ib2R5KTtcblx0XHRcdGlmIChJbnRlcmZhY2VzLmJvYXJkLmlzTmFtZVJlc3RyaWN0ZWQoYm9hcmROYW1lKSkge1xuXHRcdFx0XHRJbnRlcmZhY2VzLnNwbGFzaC5zaG93QWxlcnQoSW50ZXJmYWNlcywgJ1RoYXQgYWxidW0gaXMgcmVzdHJpY3RlZCwgcGxlYXNlIHRyeSBhbm90aGVyLicpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0SW50ZXJmYWNlcy5zcGxhc2guc2hvd0FsZXJ0KEludGVyZmFjZXMsICdZb3VyIGFsYnVtIGNvbnRhaW5zIGludmFsaWQgY2hhcmFjdGVycy4nKTtcblx0XHRcdH1cblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRJbnRlcmZhY2VzLmJvYXJkLnNob3coSW50ZXJmYWNlcywgRXZlbnRzLCBTZXJ2ZXIsIG1haW5XaW5kb3csIGFwcGxpY2F0aW9uV3JhcHBlcik7XG5cdFx0SW50ZXJmYWNlcy5ib2FyZC5zaG93QWxlcnQoJ0xvYWRpbmcsIHBsZWFzZSB3YWl0Li4uJyk7XG5cblx0XHQvLyB9IGVsc2Uge1xuXHRcdC8vIFx0UGljdHJlLmJvYXJkLmV4aXN0cyA9IHRydWU7XG5cdFx0Ly8gXHR2YXIgd3JhcHBlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG5cdFx0Ly8gXHR3cmFwcGVyLmlkID0gXCJQaWN0cmUtd3JhcHBlclwiO1xuXHRcdC8vIFx0YXBwbGljYXRpb25XcmFwcGVyLmFwcGVuZENoaWxkKHdyYXBwZXIpO1xuXHRcdC8vIFx0dGhpcy5zZXQud3JhcHBlcih3cmFwcGVyKTtcblx0XHQvLyBcdFBpY3RyZS5nZXQudWkubm90aWNlKFwiTG9hZGluZywgcGxlYXNlIHdhaXQuLi5cIik7XG5cdFx0Ly8gXHRQaWN0cmUuZ2V0LmRiKHtcblx0XHQvLyBcdFx0YWxidW06IHRydWUsXG5cdFx0Ly8gXHRcdHJlc291cmNlOiAnYWxidW0nLFxuXHRcdC8vIFx0XHRsaW1pdDogUGljdHJlLl9zZXR0aW5ncy5kYXRhLmxpbWl0LnBhZ2Vsb2FkXG5cdFx0Ly8gXHR9LCBmdW5jdGlvbihkYXRhKSB7XG5cblx0XHQvLyBcdFx0Ly8gZGV0ZWN0ICdsb2FkaW5nIGJhcicgZGVtb1xuXHRcdC8vIFx0XHRpZiAoUGljdHJlLl9zZXR0aW5ncy5kZW1vLmxvYWRlcikge1xuXG5cdFx0Ly8gXHRcdFx0Y29uc29sZS5sb2coXCJXYXJuaW5nOiBsb2FkZXIgZGVtbyBhY3RpdmUuXCIpO1xuXG5cdFx0Ly8gXHRcdFx0KGZ1bmN0aW9uIGRlbW8obiwgdCkge1xuXHRcdC8vIFx0XHRcdFx0aWYgKHQpIGNsZWFyVGltZW91dCh0KTtcblx0XHQvLyBcdFx0XHRcdHQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdC8vIFx0XHRcdFx0XHRQaWN0cmUuZ2V0LnVpLmxvYWRlci5wdXQobik7XG5cdFx0Ly8gXHRcdFx0XHRcdG4gKz0gMC4wMDI7XG5cdFx0Ly8gXHRcdFx0XHRcdGlmIChuID49IDAuOTk1KSBuID0gMDtcblx0XHQvLyBcdFx0XHRcdFx0ZGVtbyhuLCB0KTtcblx0XHQvLyBcdFx0XHRcdH0sIDEwMDAgLyA2MCk7XG5cdFx0Ly8gXHRcdFx0fSkoMCk7XG5cblx0XHQvLyBcdFx0fSBlbHNlIHtcblx0XHQvLyBcdFx0XHRQaWN0cmUubG9hZChkYXRhKTtcblx0XHQvLyBcdFx0fVxuXG5cdFx0Ly8gXHR9KTtcblxuXHRcdC8vIFx0UGljdHJlLmV2ZW50cy5vbignZHJhZ292ZXInLCBmdW5jdGlvbigpIHtcblx0XHQvLyBcdFx0aWYgKCFQaWN0cmUuZ2FsbGVyeS5pcy5mZWF0dXJpbmcgJiYgIVBpY3RyZS5pcy5zcG90bGlnaHQgJiYgUGljdHJlLl9zZXR0aW5ncy5hbGxvd1VwbG9hZHMpIFBpY3RyZS5nZXQudWkudXBsb2FkLnB1dCgpO1xuXHRcdC8vIFx0fSk7XG5cblx0XHQvLyBcdFBpY3RyZS5ldmVudHMub24oJ2hhc2hjaGFuZ2UnLCBmdW5jdGlvbigpIHtcblx0XHQvLyBcdFx0UGljdHJlLmdldC5oYXNoKCk7XG5cdFx0Ly8gXHR9KTtcblx0XHQvLyB9XG5cdH0gZWxzZSB7XG5cdFx0Ly8gc2hvdyBtYWluIHZpZXdcblx0XHRJbnRlcmZhY2VzLnNwbGFzaC5zaG93KEludGVyZmFjZXMsIEV2ZW50cywgQ2xpZW50LCBtYWluV2luZG93LCBtYWluV2luZG93LmRvY3VtZW50LmJvZHkpO1xuXHRcdGlmIChFbnZpcm9ubWVudC5pc1VwZGF0aW5nKSB7XG5cdFx0XHRJbnRlcmZhY2VzLnNwbGFzaC5zaG93QWxlcnQoSW50ZXJmYWNlcywgJ1VwZGF0ZXMgYXJlIGN1cnJlbnRseSBpbiBwcm9ncmVzcy4uLicpO1xuXHRcdH1cblx0fVxufVxuXG53aW5kb3cuUGljdHJlID0gUGljdHJlOyIsIi8qKlxuICogQ2xpZW50IG1hbmFnZXIgZm9yIGFwcGxpY2F0aW9uIHJ1bnRpbWUuIFByb3ZpZGVzIHV0aWxpdGllcyBhbmRcbiAqIGF3YXJlbmVzcyBvZiBicm93c2VyIGluZm9ybWF0aW9uIC8gY29tcGF0aWJpbGl0eS5cbiAqXG4gKiBAYXV0aG9yIGp1YW52YWxsZWpvXG4gKiBAZGF0ZSA2LzEvMTVcbiAqL1xuXG52YXIgSW50ZXJmYWNlID0gcmVxdWlyZSgnLi9pbnRlcmZhY2UuanMnKTtcblxudmFyIENsaWVudCA9IHt9O1xuXG4vLyBob2xkcyBicm93c2VyIG5hbWVzXG5DbGllbnQuYnJvd3NlciA9IHtcblxuXHRVTktOT1dOOiAwLFxuXHRDSFJPTUU6IDEsXG5cdFNBRkFSSTogMixcblx0TU9CSUxFX1NBRkFSSTogMyxcblx0RklSRUZPWDogNCxcblx0T1BFUkE6IDUsXG5cdElFX01PREVSTjogNixcblx0SUVfVU5TVVBQT1JURUQ6IDcsXG5cdElFX09USEVSOiA4XG5cbn07XG5cbi8qKlxuICogZmxhZyBpbmRpY2F0aW5nIGlmIHVzaW5nIGNvbXBhdGlibGUgYnJvd3NlclxuICovXG5DbGllbnQuY29tcGF0aWJsZSA9IHRydWU7XG5DbGllbnQuaWQgPSBDbGllbnQuYnJvd3Nlci5VTktOT1dOXG5DbGllbnQubmFtZSA9ICdVbmtub3duJztcbkNsaWVudC52ZXJzaW9uID0gMDtcblxuQ2xpZW50Lm9zID0gbmF2aWdhdG9yLnBsYXRmb3JtO1xuQ2xpZW50Lm9ubGluZSA9IG5hdmlnYXRvci5vbkxpbmU7XG5cbkNsaWVudC5nZXRJZCA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gQ2xpZW50LmlkO1xufTtcblxuQ2xpZW50LmlzSUUgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIENsaWVudC5pZCA9PSBDbGllbnQuYnJvd3Nlci5JRV9NT0RFUk4gfHwgQ2xpZW50LmlkID09IENsaWVudC5icm93c2VyLklFX1VOU1VQUE9SVEVEIHx8IENsaWVudC5pZCA9PSBDbGllbnQuYnJvd3Nlci5JRV9PVEhFUjtcbn07XG5cbkNsaWVudC5pc01vYmlsZVNhZmFyaSA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gQ2xpZW50LmlkID09IENsaWVudC5icm93c2VyLk1PQklMRV9TQUZBUkk7XG59O1xuXG5DbGllbnQuaXNTYWZhcmkgPSBmdW5jdGlvbih2ZXJzaW9uKSB7XG5cdGlmICh2ZXJzaW9uKSB7XG5cdFx0cmV0dXJuIENsaWVudC5pZCA9PSBDbGllbnQuYnJvd3Nlci5TQUZBUkkgJiYgQ2xpZW50LnZlcnNpb24uc3BsaXQoJycpLmluZGV4T2YodmVyc2lvbikgIT0gLTE7XG5cdH1cblx0cmV0dXJuIENsaWVudC5pZCA9PSBDbGllbnQuYnJvd3Nlci5TQUZBUkk7XG59O1xuXG4vKipcbiAqIENvbGxlY3RzIGluZm9ybWF0aW9uIGFib3V0IGJyb3dzZXIgdmVyc2lvbixcbiAqIGNvbXBhdGliaWxpdHksIG5hbWUsIGFuZCBkaXNwbGF5IGluZm9ybWF0aW9uXG4gKiBiYXNlZCBvbiB1c2VyIGFnZW50IHN0cmluZy5cbiAqL1xuQ2xpZW50LmluaXQgPSBmdW5jdGlvbigpIHtcblxuXHRpZiAobmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKFwiQXBwbGVXZWJLaXRcIikgIT0gLTEpIHtcblxuXHRcdGlmIChuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoXCJDaHJvbWVcIikgIT0gLTEpIHtcblx0XHRcdENsaWVudC5uYW1lID0gXCJDaHJvbWVcIjtcblx0XHRcdENsaWVudC5pZCA9IENsaWVudC5icm93c2VyLkNIUk9NRTtcblx0XHR9IGVsc2Uge1xuXG5cdFx0XHRpZiAobmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKFwiTW9iaWxlXCIpICE9IC0xKSB7XG5cdFx0XHRcdENsaWVudC5uYW1lID0gXCJNb2JpbGUgU2FmYXJpXCI7XG5cdFx0XHRcdENsaWVudC5pZCA9IENsaWVudC5icm93c2VyLk1PQklMRV9TQUZBUkk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRDbGllbnQubmFtZSA9IFwiU2FmYXJpXCI7XG5cdFx0XHRcdENsaWVudC5pZCA9IENsaWVudC5icm93c2VyLlNBRkFSSTtcblxuXHRcdFx0XHR2YXIgdmVyc2lvbiA9IG5hdmlnYXRvci51c2VyQWdlbnQuc3BsaXQoXCJWZXJzaW9uL1wiKTtcblx0XHRcdFx0Q2xpZW50LnZlcnNpb24gPSB2ZXJzaW9uWzFdLnNwbGl0KFwiIFwiKVswXTtcblx0XHRcdH1cblxuXHRcdH1cblxuXHR9IGVsc2Uge1xuXG5cdFx0aWYgKG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZihcIkZpcmVmb3hcIikgIT0gLTEpIHtcblx0XHRcdENsaWVudC5uYW1lID0gXCJGaXJlZm94XCI7XG5cdFx0XHRDbGllbnQuaWQgPSBDbGllbnQuYnJvd3Nlci5GSVJFRk9YO1xuXHRcdH0gZWxzZSBpZiAobmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKFwiT3BlcmFcIikgIT0gLTEpIHtcblx0XHRcdENsaWVudC5uYW1lID0gXCJPcGVyYVwiO1xuXHRcdFx0Q2xpZW50LmlkID0gQ2xpZW50LmJyb3dzZXIuT1BFUkE7XG5cdFx0fSBlbHNlIGlmIChuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoXCJNU0lFIFwiKSAhPSAtMSkge1xuXG5cdFx0XHRpZiAobmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKFwiVHJpZGVudFwiKSAhPSAtMSkge1xuXG5cdFx0XHRcdHZhciB2ZXJzaW9uID0gbmF2aWdhdG9yLnVzZXJBZ2VudC5zcGxpdChcIjtcIilbMV07XG5cdFx0XHRcdHZlcnNpb24gPSBwYXJzZUludCh2ZXJzaW9uLnNwbGl0KFwiIFwiKVsyXSk7XG5cblx0XHRcdFx0Q2xpZW50Lm5hbWUgPSBcIkludGVybmV0IEV4cGxvcmVyXCI7XG5cdFx0XHRcdENsaWVudC52ZXJzaW9uID0gdmVyc2lvbjtcblxuXHRcdFx0XHRpZiAodmVyc2lvbiA+IDgpIHtcblx0XHRcdFx0XHRDbGllbnQuaWQgPSBDbGllbnQuYnJvd3Nlci5JRV9NT0RFUk47XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Q2xpZW50LmlkID0gQ2xpZW50LmJyb3dzZXIuSUVfVU5TVVBQT1JURUQ7XG5cdFx0XHRcdH1cblxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Q2xpZW50Lm5hbWUgPSBcIkludGVybmV0IEV4cGxvcmVyXCI7XG5cdFx0XHRcdENsaWVudC5pZCA9IENsaWVudC5icm93c2VyLklFX09USEVSO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRDbGllbnQubmFtZSA9ICdPdGhlcic7XG5cdFx0XHRDbGllbnQuaWQgPSBDbGllbnQuYnJvd3Nlci5VTktOT1dOO1xuXHRcdH1cblxuXHR9XG5cblx0Ly8gRGV0ZWN0IGlmIHVzaW5nIGhvcGVsZXNzIGJyb3dzZXJcblx0aWYgKENsaWVudC5pZCA9PSBDbGllbnQuYnJvd3Nlci5JRV9VTlNVUFBPUlRFRCB8fCBDbGllbnQuaWQgPT0gQ2xpZW50LmJyb3dzZXIuSUVfT1RIRVIpIHtcblxuXHRcdHZhciB3YXJuaW5nO1xuXHRcdHZhciBsb2NrID0gZmFsc2U7XG5cdFx0dmFyIGhlYWRlciA9ICdTb3JyeSBhYm91dCB0aGF0ISc7XG5cblx0XHRpZiAoQ2xpZW50LmlkID09IENsaWVudC5icm93c2VyLklFX09USEVSKSB7XG5cblx0XHRcdHdhcm5pbmcgPSBcIlVuZm9ydHVuYXRlbHkgUGljdHJlIGlzIG5vdCBzdXBwb3J0ZWQgaW4geW91ciBicm93c2VyLCBwbGVhc2UgY29uc2lkZXIgdXBncmFkaW5nIHRvIEdvb2dsZSBDaHJvbWUsIGJ5IGNsaWNraW5nIGhlcmUsIGZvciBhbiBvcHRpbWFsIGJyb3dzaW5nIGV4cGVyaWVuY2UuXCI7XG5cdFx0XHRsb2NrID0gdHJ1ZTtcblxuXHRcdFx0SW50ZXJmYWNlLndhcm5pbmcub25jbGljayA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR3aW5kb3cub3BlbihcImh0dHA6Ly9jaHJvbWUuZ29vZ2xlLmNvbVwiLCBcIl9ibGFua1wiKTtcblx0XHRcdH07XG5cblx0XHR9IGVsc2Uge1xuXG5cdFx0XHRoZWFkZXIgPSAnTm90aWNlISc7XG5cdFx0XHR3YXJuaW5nID0gXCJTb21lIG9mIFBpY3RyZSdzIGZlYXR1cmVzIG1heSBub3QgYmUgZnVsbHkgc3VwcG9ydGVkIGluIHlvdXIgYnJvd3Nlci5cIjtcblxuXHRcdFx0SW50ZXJmYWNlLndhcm5pbmcub25jbGljayA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR0aGlzLnJlbW92ZSgpO1xuXHRcdFx0fTtcblxuXHRcdH1cblxuXHRcdENsaWVudC5jb21wYXRpYmxlID0gZmFsc2U7XG5cblx0XHRJbnRlcmZhY2Uud2FybmluZy5wdXQoe1xuXG5cdFx0XHRoZWFkZXI6IGhlYWRlcixcblx0XHRcdGJvZHk6IHdhcm5pbmcsXG5cdFx0XHRsb2NrZWQ6IGxvY2tcblxuXHRcdH0pO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQ2xpZW50OyIsIi8qKlxuICogQXBwbGljYXRpb24gZW52aXJvbm1lbnQgZHVyaW5nIHJ1bnRpbWUuIFN0b3JlcyBkeW5hbWljXG4gKiBnbG9iYWwgdmFsdWVzIGZvciBhcHBsaWNhdGlvbiBtb2R1bGUgc3VwcG9ydC5cbiAqXG4gKiBAYXV0aG9yIGp1YW52YWxsZWpvXG4gKiBAZGF0ZSA1LzMxLzE1XG4gKi9cblxudmFyIEVudmlyb25tZW50ID0ge307XG5cbkVudmlyb25tZW50LmNsb3VkID0ge1xuXHRkYXRhZGlyOiAnJyxcblx0YWRkcmVzczogJydcbn1cblxuRW52aXJvbm1lbnQuYXBwID0ge1xuXHR0aXRsZTogJ1BpY3RyZSdcbn1cblxuRW52aXJvbm1lbnQuZXZlbnRzID0ge307XG5cbkVudmlyb25tZW50LmluUHJvZHVjdGlvbiA9IGZhbHNlO1xuRW52aXJvbm1lbnQuaXNVcGRhdGluZyA9IGZhbHNlO1xuXG5FbnZpcm9ubWVudC5hbmltYXRpb25TcGVlZCA9IDEwMDA7XG5FbnZpcm9ubWVudC5tYXhJbWFnZVdpZHRoID0gODAwO1xuRW52aXJvbm1lbnQubWF4SW1hZ2VIZWlnaHQgPSAxMzc7XG5FbnZpcm9ubWVudC5hbGVydER1cmF0aW9uID0gMTAwMDA7XG5cbkVudmlyb25tZW50LmJhc2VBUElVcmwgPSAnaHR0cDovL3N0YXRpYy1waWN0cmUucmhjbG91ZC5jb20vJztcblxuLy8gbG9hZCB4IGl0ZW1zIG9uIHBhZ2UgbG9hZFxuRW52aXJvbm1lbnQuaXRlbUFtb3VudFBhZ2VMb2FkID0gNTA7XG4vLyBsb2FkIHggaXRlbXMgcGVyIHN1YnNlcXVlbnQgcmVxdWVzdFxuRW52aXJvbm1lbnQuaXRlbUFtb3VudFJlcXVlc3QgPSAyNTtcblxubW9kdWxlLmV4cG9ydHMgPSBFbnZpcm9ubWVudDsiLCIvKipcbiAqIEFwcGxpY2F0aW9uIGV2ZW50cyBjb250cm9sbGVyXG4gKi9cblxudmFyIEV2ZW50cyA9IHt9O1xudmFyIHJlZ2lzdGVyZWRHbG9iYWxFdmVudHMgPSB7fTtcbnZhciByZWdpc3RlcmVkTm9kZUV2ZW50cyA9IHt9O1xuXG4vKipcbiAqIExpc3RlbnMgZm9yIGEgZG9tIGV2ZW50XG4gKi9cbkV2ZW50cy5vbkNhY2hlZE5vZGVFdmVudCA9IGZ1bmN0aW9uKG5vZGUsIGV2ZW50TmFtZSwgY2FsbGJhY2spIHtcblx0aWYgKCFyZWdpc3RlcmVkTm9kZUV2ZW50c1tub2RlLm5vZGVOYW1lXSkge1xuXHRcdHJlZ2lzdGVyZWROb2RlRXZlbnRzW25vZGUubm9kZU5hbWVdID0ge307XG5cdH1cblxuXHRpZiAoIXJlZ2lzdGVyZWROb2RlRXZlbnRzW25vZGUubm9kZU5hbWVdW2V2ZW50TmFtZV0pIHtcblx0XHRyZWdpc3RlcmVkTm9kZUV2ZW50c1tub2RlLm5vZGVOYW1lXVtldmVudE5hbWVdID0gW107XG5cblx0XHRmdW5jdGlvbiBub2RlRXZlbnQoZSkge1xuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCByZWdpc3RlcmVkTm9kZUV2ZW50c1tub2RlLm5vZGVOYW1lXVtldmVudE5hbWVdLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGlmICh0eXBlb2YgcmVnaXN0ZXJlZE5vZGVFdmVudHNbbm9kZS5ub2RlTmFtZV1bZXZlbnROYW1lXVtpXSA9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0cmVnaXN0ZXJlZE5vZGVFdmVudHNbbm9kZS5ub2RlTmFtZV1bZXZlbnROYW1lXVtpXS5jYWxsKG5vZGUsIGUpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0dHJ5IHtcblx0XHRcdG5vZGUuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIG5vZGVFdmVudCk7XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0bm9kZS5hdHRhY2hFdmVudCgnb24nICsgZXZlbnROYW1lLCBub2RlRXZlbnQpO1xuXHRcdH1cblx0fVxuXG5cdHJlZ2lzdGVyZWROb2RlRXZlbnRzW25vZGUubm9kZU5hbWVdW2V2ZW50TmFtZV0ucHVzaChjYWxsYmFjayk7XG59O1xuXG5FdmVudHMub25Ob2RlRXZlbnQgPSBmdW5jdGlvbihub2RlLCBldmVudE5hbWUsIGNhbGxiYWNrKSB7XG5cdHRyeSB7XG5cdFx0bm9kZS5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgY2FsbGJhY2spO1xuXHR9IGNhdGNoIChlKSB7XG5cdFx0bm9kZS5hdHRhY2hFdmVudCgnb24nICsgZXZlbnROYW1lLCBjYWxsYmFjayk7XG5cdH1cbn07XG5cbi8vIGV4ZWN1dGVzIGV2ZW50IFwiY2FsbGJhY2tzXCIgb24gYSBub2RlIGV2ZW50IGFuZCBzdG9yZXMgdGhlbVxuLy8gZm9yIGZ1dHVyZSBjYXNlcyBvZiBzdWNoIGV2ZW50IGhhcHBlbmluZy5cbi8vIFdhcm5pbmc6IGV2ZW50IG9iamVjdCB3aWxsIG5vdCBiZSBpbnN0YW50bHkgYXZhaWxhYmxlIGZvclxuLy8gY2FsbGJhY2sgdG8gcmVjZWl2ZSBkdWUgdG8gY2FsbGJhY2sgYmVpbmcgY2FsbGVkXG4vLyBiZWZvcmUgYmVpbmcgcXVldWVkIHVwIGZvciBpdHMgY29ycmVzcG9uZGluZyBldmVudC5cbkV2ZW50cy5ub3dBbmRPbk5vZGVFdmVudCA9IGZ1bmN0aW9uKG5vZGUsIGV2ZW50TmFtZSwgY2FsbGJhY2spIHtcblx0Y2FsbGJhY2suY2FsbChub2RlLCBudWxsKTtcblx0RXZlbnRzLm9uTm9kZUV2ZW50KG5vZGUsIGV2ZW50TmFtZSwgY2FsbGJhY2spO1xufTtcblxuLyoqXG4gKiBUcmlnZ2VycyBkb20gZXZlbnRcbiAqL1xuRXZlbnRzLmVtaXROb2RlRXZlbnQgPSBmdW5jdGlvbigpIHtcblxufTtcblxuLyoqXG4gKiBSZWdpc3RlcnMgbmV3IGFwcCBldmVudCBhbmQgZmlyZXNcbiAqIHBhc3NlZCBjYWxsYmFjayB3aGVuIGVtaXR0ZWQgXG4gKi9cbkV2ZW50cy5yZWdpc3Rlckdsb2JhbEV2ZW50ID0gZnVuY3Rpb24oZXZlbnROYW1lLCBjYWxsYmFjaykge1xuXHRpZiAoIXRoaXMucmVnaXN0ZXJlZEdsb2JhbEV2ZW50c1tldmVudE5hbWVdKSB7XG5cdFx0dGhpcy5yZWdpc3RlcmVkR2xvYmFsRXZlbnRzW2V2ZW50TmFtZV0gPSBbXTtcblx0fVxuXG5cdHRoaXMucmVnaXN0ZXJlZEdsb2JhbEV2ZW50c1tldmVudE5hbWVdLnB1c2goY2FsbGJhY2spO1xufVxuXG4vKipcbiAqIFRyaWdnZXJzIHJlZ2lzdGVyZWQgYXBwIGV2ZW50c1xuICogYnkgY2FsbGluZyBjYWxsYmFja3MgYXNzaWduZWQgdG9cbiAqIHRoYXQgZXZlbnROYW1lXG4gKi9cbkV2ZW50cy5lbWl0UmVnaXN0ZXJlZEdsb2JhbEV2ZW50ID0gZnVuY3Rpb24oZXZlbnROYW1lLCBhcmdzKSB7XG5cdGlmICghcmVnaXN0ZXJlZEdsb2JhbEV2ZW50c1tldmVudE5hbWVdKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnJlZ2lzdGVyZWRHbG9iYWxFdmVudHNbZXZlbnROYW1lXS5sZW5ndGg7IGkrKykge1xuXHRcdHRoaXMucmVnaXN0ZXJlZEdsb2JhbEV2ZW50c1tldmVudE5hbWVdW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuXHR9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50czsiLCIvKipcbiAqIEFwcGxpY2F0aW9uIGludGVyZmFjZSBtYW5hZ2VyLiBFeHBvc2VzIGFsbCBpbnRlcmZhY2UgbW9kdWxlcyB0byBnbG9iYWwgc2NvcGUuXG4gKlxuICogQGF1dGhvciBqdWFudmFsbGVqb1xuICogQGRhdGUgNS8zMS8xNVxuICovXG5cbnZhciBJbnRlcmZhY2UgPSByZXF1aXJlKCcuL2ludGVyZmFjZXMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBJbnRlcmZhY2U7IiwiLyoqXG4gKiBCb2FyZCBpbnRlcmZhY2UgbW9kdWxlIC0gY29uc2lzdHMgb2YgYSBcIndyYXBwZXJcIiByb290IG5vZGUgYW5kIGEgXCJub3RpY2VcIiBhbGVydCBub2RlXG4gKi9cblxudmFyIEVudmlyb25tZW50ID0gcmVxdWlyZSgnLi4vZW52aXJvbm1lbnQuanMnKTtcblxuLy8gcHJpdmF0ZSBmaWVsZHMgYW5kIGZ1bmN0aW9uc1xudmFyIGlzU2V0ID0gZmFsc2U7XG52YXIgbm9kZXMgPSB7XG5cdC8vIHVzZWQgdG8gZGlzcGxheSBhbGVydHMgYW5kIGJvYXJkIGluZm9cblx0YWxlcnROb2RlOiBudWxsLFxuXHRhbGVydE5vZGVDb21wb25lbnRzOiB7XG5cdFx0Ym9keTogbnVsbCxcblx0XHRleHRyYTogbnVsbFxuXHR9LFxuXG5cdGxvYWRlck5vZGU6IG51bGwsXG5cblx0Ly8gaG9sZHMgbWFpbiBib2FyZCBjb21wb25lbnQgKGV4Y2x1c2l2ZSBvZiB0aGUgYWxlcnROb2RlKVxuXHRyb290Tm9kZTogbnVsbFxufTtcblxudmFyIGV2ZW50cyA9IHt9O1xudmFyIGNhY2hlID0ge307XG5cbnZhciBsb2FkZWRJbWFnZUNvdW50ID0gMDtcbnZhciBpc0xvYWRpbmcgPSBmYWxzZTtcbnZhciBpc0xvYWRlZEltYWdlcyA9IGZhbHNlO1xudmFyIGlzQ3JlYXRlZCA9IGZhbHNlO1xudmFyIHBhcmVudE5vZGVDYWNoZSA9IHt9O1xudmFyIHJlc3RyaWN0ZWROYW1lcyA9IFtcblx0J2RhdGEnLFxuXHQncmVzdHJpY3RlZCcsXG5cdCc0MDQnLFxuXHQndW5kZWZpbmVkJ1xuXTtcblxudmFyIEJvYXJkID0ge307XG5cbkJvYXJkLmFsZXJ0Tm9kZUNvbXBvbmVudHMgPSB7XG5cdGJvZHk6ICdVbnRpdGxlZCcsXG5cdGV4dHJhOiBudWxsXG59O1xuXG5Cb2FyZC5hbGJ1bVJlcXVlc3RDb21wb25lbnRzID0ge1xuXHRhbmNob3I6IDAsXG5cdGhlYWQ6IEVudmlyb25tZW50Lml0ZW1BbW91bnRQYWdlTG9hZFxufTtcblxuQm9hcmQucGljdHVyZXMgPSBbXTtcblxuQm9hcmQuaXNOYW1lUmVzdHJpY3RlZCA9IGZ1bmN0aW9uKG5hbWUpIHtcblx0cmV0dXJuIHJlc3RyaWN0ZWROYW1lcy5pbmRleE9mKG5hbWUudG9Mb3dlckNhc2UoKSkgIT0gLTE7XG59O1xuXG5Cb2FyZC5pc05hbWVJbnZhbGlkID0gZnVuY3Rpb24obmFtZSkge1xuXHRyZXR1cm4gbmFtZS50b0xvd2VyQ2FzZSgpLm1hdGNoKC9bXmEtejAtOVxcLVxcLlxcK1xcX1xcIF0vZ2kpO1xufTtcblxuQm9hcmQuaXNOYW1lV2l0aFNwYWNlcyA9IGZ1bmN0aW9uKG5hbWUpIHtcblx0cmV0dXJuIG5hbWUubWF0Y2goL1tcXCBdL2cpO1xufTtcblxuQm9hcmQuaXNTZXQgPSBmdW5jdGlvbigpIHtcblx0Qm9hcmQuZGV0ZWN0KCk7XG5cdHJldHVybiBpc1NldDtcbn07XG5cbkJvYXJkLmRldGVjdCA9IGZ1bmN0aW9uKCkge1xuXG5cdGlmICghd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lLnNwbGl0KCcvJylbMV0pIHtcblx0XHR3aW5kb3cuZG9jdW1lbnQudGl0bGUgPSBFbnZpcm9ubWVudC5hcHAudGl0bGU7XG5cdFx0aXNTZXQgPSBmYWxzZTtcblx0XHRyZXR1cm4gQm9hcmQ7XG5cdH1cblxuXHRpc1NldCA9IHRydWU7XG5cdHdpbmRvdy5kb2N1bWVudC50aXRsZSA9ICdQaWN0cmUgLSAnICsgQm9hcmQuZ2V0TmFtZSgpO1xuXG5cdHJldHVybiBCb2FyZDtcbn1cblxuQm9hcmQuZ2V0TmFtZSA9IGZ1bmN0aW9uKCkge1xuXG5cdHZhciBib2FyZDtcblxuXHQvLyBjYXBpdGFsaXplIG5hbWUgb2YgYm9hcmRcblx0aWYgKGlzU2V0KSB7XG5cdFx0dmFyIG5hbWUgPSB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUuc3BsaXQoXCIvXCIpWzFdLnRvTG93ZXJDYXNlKCk7XG5cdFx0dmFyIG5hbWVBcnJheSA9IG5hbWUuc3BsaXQoJycpO1xuXHRcdG5hbWVBcnJheS5zcGxpY2UoMCwgMSk7XG5cblx0XHR2YXIgbmFtZUZpcnN0Q2hhciA9IG5hbWUuY2hhckF0KDApLnRvVXBwZXJDYXNlKCk7XG5cdFx0Ym9hcmQgPSBuYW1lRmlyc3RDaGFyICsgbmFtZUFycmF5LmpvaW4oJycpO1xuXHR9XG5cblx0cmV0dXJuIGJvYXJkO1xuXG59XG5cbkJvYXJkLnNldExvYWRlciA9IGZ1bmN0aW9uKHJhdGlvKSB7XG5cdGlmICghbm9kZXMubG9hZGVyTm9kZSkge1xuXHRcdHJldHVybjtcblx0fVxuXG5cdG5vZGVzLmxvYWRlck5vZGUuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG5cdGlmIChub2Rlcy5sb2FkZXJOb2RlLmNoaWxkcmVuKSB7XG5cdFx0bm9kZXMubG9hZGVyTm9kZS5jaGlsZHJlblswXS5zdHlsZS53aWR0aCA9IE1hdGgubWF4KHJhdGlvICogMTAwLCAwKSArICclJztcblx0fVxufTtcblxuQm9hcmQudW5zZXRMb2FkZXIgPSBmdW5jdGlvbigpIHtcblx0aWYgKCFub2Rlcy5sb2FkZXJOb2RlKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdG5vZGVzLmxvYWRlck5vZGUuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbn07XG5cbi8vIGxvYWRzIGEgc2luZ2xlIGFwaSBpbWFnZSBpbnRvIHRoZSBib2FyZFxuQm9hcmQubG9hZEltYWdlID0gZnVuY3Rpb24oSW50ZXJmYWNlcywgRXZlbnRzLCBtYWluV2luZG93LCBvYmplY3QsIGltYWdlTG9hZEhhbmRsZXIpIHtcblx0dmFyIHBpY3R1cmUgPSBJbnRlcmZhY2VzLmNvbnRyb2xsZXIuY3JlYXRlRGl2Tm9kZShtYWluV2luZG93KTtcblx0cGljdHVyZS5jbGFzc05hbWUgPSAnUGljdHJlLXBpYyc7XG5cdHBpY3R1cmUuaWQgPSAncGljJyArIG9iamVjdC5pZDtcblx0cGljdHVyZS5kYXRhID0gb2JqZWN0O1xuXG5cdHZhciBpbWFnZSA9IG5ldyBJbWFnZSgpO1xuXHRpbWFnZS5zcmMgPSBFbnZpcm9ubWVudC5iYXNlQVBJVXJsICsgJy8nICsgb2JqZWN0LnRodW1iO1xuXG5cdGlmICghaXNMb2FkZWRJbWFnZXMgJiYgbm9kZXMucm9vdE5vZGUuc3R5bGUuZGlzcGxheSAhPSAnbm9uZScpIHtcblx0XHRub2Rlcy5yb290Tm9kZS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuXHR9XG5cblx0RXZlbnRzLm9uTm9kZUV2ZW50KGltYWdlLCAnbG9hZCcsIGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAoZnVuY3Rpb24ocGljdHVyZSwgaW1hZ2UpIHtcblx0XHRcdGltYWdlTG9hZEhhbmRsZXIocGljdHVyZSwgaW1hZ2UpO1xuXHRcdH0pKHBpY3R1cmUsIGltYWdlKTtcblx0fSk7XG5cblx0RXZlbnRzLm9uTm9kZUV2ZW50KGltYWdlLCAnZXJyb3InLCBmdW5jdGlvbigpIHtcblx0XHR2YXIgaGVpZ2h0ID0gRW52aXJvbm1lbnQubWF4SW1hZ2VIZWlnaHQ7XG5cdFx0dmFyIHBhZGRpbmdUb3AgPSBwYXJzZUludChtYWluV2luZG93LmdldENvbXB1dGVkU3R5bGUocGljdHVyZSkuZ2V0UHJvcGVydHlWYWx1ZSgncGFkZGluZy10b3AnKS5zcGxpdChcInB4XCIpWzBdKSArIDE7XG5cdFx0dmFyIHBhZGRpbmdCb3R0b20gPSBwYXJzZUludChtYWluV2luZG93LmdldENvbXB1dGVkU3R5bGUocGljdHVyZSkuZ2V0UHJvcGVydHlWYWx1ZSgncGFkZGluZy1ib3R0b20nKS5zcGxpdChcInB4XCIpWzBdKTtcblxuXHRcdHZhciBlcnJJbWcgPSBuZXcgSW1hZ2UoKTtcblx0XHRlcnJJbWcuc3JjID0gJy9zdGF0aWMvaS9QaWN0cmUtNDA0LnBuZyc7XG5cblx0XHR0aGlzLmlubmVySFRNTCA9ICcnO1xuXHRcdHRoaXMuZGF0YS5zcmMgPSAnL3N0YXRpYy9pL1BpY3RyZS00MDQuZnVsbC5wbmcnO1xuXHRcdHRoaXMuc3R5bGUuaGVpZ2h0ID0gKGhlaWdodCAtIHBhZGRpbmdUb3AgKyBwYWRkaW5nQm90dG9tICogMikgKyAncHgnO1xuXG5cdFx0aW1hZ2VMb2FkSGFuZGxlcih0aGlzLCBlcnJJbWcpO1xuXHR9LmJpbmQocGljdHVyZSkpO1xufTtcblxuLy8gbG9hZHMgYSBqc29uIGFycmF5IG9mIGltYWdlcyBpbnRvIHRoZSBib2FyZFxuQm9hcmQubG9hZCA9IGZ1bmN0aW9uKEludGVyZmFjZXMsIEV2ZW50cywgbWFpbldpbmRvdywgb2JqZWN0cykge1xuXHRpc0xvYWRpbmcgPSB0cnVlO1xuXG5cdGZ1bmN0aW9uIGhhbmRsZXIocGljdHVyZSwgaW1hZ2UpIHtcblx0XHRCb2FyZC5pbWFnZUxvYWRIYW5kbGVyKHBpY3R1cmUsIGltYWdlLCBvYmplY3RzLmxlbmd0aCk7XG5cdH1cblxuXHRmb3IgKHZhciBpIGluIG9iamVjdHMpIHtcblx0XHRCb2FyZC5sb2FkSW1hZ2UoSW50ZXJmYWNlcywgRXZlbnRzLCBtYWluV2luZG93LCBvYmplY3RzW2ldLCBoYW5kbGVyKTtcblx0fVxufTtcblxuLy8gY2FsbGVkIHdoZW4gYSBzaW5nbGUgaW1hZ2UgaXMgbG9hZGVkXG5Cb2FyZC5pbWFnZUxvYWRIYW5kbGVyID0gZnVuY3Rpb24ocGljdHVyZSwgaW1hZ2UsIHNldENvdW50KSB7XG5cdGxvYWRlZEltYWdlQ291bnQrKztcblxuXHQvLyBubyBhbmNob3IgbWVhbnMgYmxhbmsgcm9vbSBmb3IgbG9hZGVyXG5cdGlmICghQm9hcmQuYWxidW1SZXF1ZXN0Q29tcG9uZW50cy5hbmNob3IpIHtcblx0XHRCb2FyZC5zZXRMb2FkZXIobG9hZGVkSW1hZ2VDb3VudCAvIHNldENvdW50KTtcblx0fVxuXG5cdC8vIGJ1aWxkIHRyZWVcblx0cGljdHVyZS5hcHBlbmRDaGlsZChpbWFnZSk7XG5cdG5vZGVzLnJvb3ROb2RlLmFwcGVuZENoaWxkKHBpY3R1cmUpO1xuXG5cdEJvYXJkLnBpY3R1cmVzLnB1c2gocGljdHVyZSk7XG5cblx0aWYgKGxvYWRlZEltYWdlQ291bnQgPT0gc2V0Q291bnQpIHtcblx0XHRsb2FkZWRJbWFnZUNvdW50ID0gMDtcblx0XHRpc0xvYWRpbmcgPSBmYWxzZTtcblxuXHRcdC8vIGlmIGFuY2hvciBpcyAwLCB0aGF0IG1lYW5zIGxvYWRpbmcgaW1hZ2VzIGZvclxuXHRcdC8vIHRoZSBmaXJzdCB0aW1lLiBTZXQgbG9hZGVyIGJhciB0byBmdWxsXG5cdFx0aWYgKCFCb2FyZC5hbGJ1bVJlcXVlc3RDb21wb25lbnRzLmFuY2hvcikge1xuXHRcdFx0Qm9hcmQudW5zZXRMb2FkZXIoKTtcblx0XHRcdG5vZGVzLnJvb3ROb2RlLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuXHRcdH1cblxuXHRcdC8vIGVtaXQgJ2xvYWQnIGV2ZW50XG5cdFx0Qm9hcmQuZW1pdCgnbG9hZCcsIFtzZXRDb3VudF0pO1xuXHR9XG59O1xuXG4vLyBhbGVydCBlbnRpcmUgYm9hcmRcbkJvYXJkLnVwZGF0ZSA9IGZ1bmN0aW9uKEludGVyZmFjZXMsIEV2ZW50cywgU2VydmVyLCBtYWluV2luZG93KSB7XG5cdGlmICghaXNDcmVhdGVkKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0Ly8gcmVxdWVzdCBmaXJzdCBzZXQgb2YgaW1hZ2VzXG5cdFNlcnZlci5zZXRSZXF1ZXN0QW5jaG9yKEJvYXJkLmFsYnVtUmVxdWVzdENvbXBvbmVudHMuYW5jaG9yKTtcblx0U2VydmVyLnNldFJlcXVlc3RIZWFkKEJvYXJkLmFsYnVtUmVxdWVzdENvbXBvbmVudHMuaGVhZCk7XG5cdFNlcnZlci5nZXRBbGJ1bShCb2FyZC5nZXROYW1lKCkudG9Mb3dlckNhc2UoKSwgZnVuY3Rpb24oZXJyLCBkYXRhKSB7XG5cdFx0aWYgKGVycikge1xuXHRcdFx0Qm9hcmQuc2hvd0FsZXJ0KCdFcnJvcjogVW5hYmxlIHRvIGxvYWQgaW1hZ2VzLi4uJyk7XG5cdFx0XHRyZXR1cm4gY29uc29sZS5sb2coJ0VSUiBTRVJWRVIgQUxCVU0gUkVRVUVTVCcsIGVycik7XG5cdFx0fVxuXG5cdFx0Qm9hcmQubG9hZChJbnRlcmZhY2VzLCBFdmVudHMsIG1haW5XaW5kb3csIGRhdGEpO1xuXHR9KTtcblxuXHQvLyB1cGRhdGUgYWxlcnROb2RlQ29tcG9uZW50c1xuXHRCb2FyZC51cGRhdGVBbGVydENvbXBvbmVudHMoKTtcbn07XG5cbkJvYXJkLnVwZGF0ZUFsZXJ0Q29tcG9uZW50cyA9IGZ1bmN0aW9uKCkge1xuXHRpZiAoQm9hcmQuYWxlcnROb2RlQ29tcG9uZW50cy5leHRyYSkge1xuXHRcdG5vZGVzLmFsZXJ0Tm9kZUNvbXBvbmVudHMuZXh0cmEuaW5uZXJIVE1MID0gQm9hcmQuYWxlcnROb2RlQ29tcG9uZW50cy5leHRyYTtcblx0fSBlbHNlIHtcblx0XHRub2Rlcy5hbGVydE5vZGVDb21wb25lbnRzLmV4dHJhLmlubmVySFRNTCA9ICcnO1xuXHR9XG5cdG5vZGVzLmFsZXJ0Tm9kZUNvbXBvbmVudHMuYm9keS5pbm5lckhUTUwgPSBCb2FyZC5hbGVydE5vZGVDb21wb25lbnRzLmJvZHk7XG59O1xuXG4vLyBjcmVhdGUgYWxsIGJvYXJkIGNvbXBvbmVudHNcbkJvYXJkLmNyZWF0ZSA9IGZ1bmN0aW9uKEludGVyZmFjZXMsIEV2ZW50cywgbWFpbldpbmRvdywgcGFyZW50Tm9kZSkge1xuXHQvLyB1c2VkIGZvciBkaXNwbGF5aW5nIGFsZXJ0cyBhbmQgYm9hcmQgaW5mb3JtYXRpb25cblx0Ly8gc2libGluZyBvZiBhcHBsaWNhdGlvbiB3cmFwcGVyXG5cdG5vZGVzLmFsZXJ0Tm9kZSA9IEludGVyZmFjZXMuY29udHJvbGxlci5jcmVhdGVEaXZOb2RlKG1haW5XaW5kb3cpO1xuXHRub2Rlcy5hbGVydE5vZGUuY2xhc3NOYW1lID0gJ1BpY3RyZS1ub3RpY2UnO1xuXG5cdG5vZGVzLmFsZXJ0Tm9kZUNvbXBvbmVudHMuZXh0cmEgPSBJbnRlcmZhY2VzLmNvbnRyb2xsZXIuY3JlYXRlRGl2Tm9kZShtYWluV2luZG93KTtcblx0bm9kZXMuYWxlcnROb2RlQ29tcG9uZW50cy5leHRyYS5jbGFzc05hbWUgPSAnUGljdHJlLW5vdGljZS1leHRyYSc7XG5cblx0bm9kZXMuYWxlcnROb2RlQ29tcG9uZW50cy5ib2R5ID0gSW50ZXJmYWNlcy5jb250cm9sbGVyLmNyZWF0ZURpdk5vZGUobWFpbldpbmRvdyk7XG5cblx0Ly8gY3JlYXRlIHJvb3QgXCJ3cmFwcGVyXCIgbm9kZSAoZ29lcyBpbnNpZGUgb2YgYXBwbGljYXRpb24gd3JhcHBlcilcblx0bm9kZXMucm9vdE5vZGUgPSBJbnRlcmZhY2VzLmNvbnRyb2xsZXIuY3JlYXRlRGl2Tm9kZShtYWluV2luZG93KTtcblx0bm9kZXMucm9vdE5vZGUuaWQgPSAnUGljdHJlLXdyYXBwZXInO1xuXHRub2Rlcy5yb290Tm9kZS5zdHlsZS5tYXJnaW5Ub3AgPSAnNTJweCc7XG5cdG5vZGVzLnJvb3ROb2RlLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuXG5cdC8vIGNyZWF0ZSBsb2FkZXIgbm9kZVxuXHR2YXIgbG9hZGVyQ2hpbGROb2RlID0gSW50ZXJmYWNlcy5jb250cm9sbGVyLmNyZWF0ZURpdk5vZGUobWFpbldpbmRvdyk7XG5cdGxvYWRlckNoaWxkTm9kZS5jbGFzc05hbWUgPSAnUGljdHJlLWxvYWRlci1wcm9ncmVzcyc7XG5cblx0bm9kZXMubG9hZGVyTm9kZSA9IEludGVyZmFjZXMuY29udHJvbGxlci5jcmVhdGVEaXZOb2RlKG1haW5XaW5kb3cpO1xuXHRub2Rlcy5sb2FkZXJOb2RlLmNsYXNzTmFtZSA9ICdQaWN0cmUtbG9hZGVyLXdyYXBwZXInO1xuXHRub2Rlcy5sb2FkZXJOb2RlLnN0eWxlLm1hcmdpblRvcCA9ICctNiUnO1xuXG5cdC8vIGNyZWF0ZSBub2RlIHRyZWVcblx0bm9kZXMuYWxlcnROb2RlLmFwcGVuZENoaWxkKG5vZGVzLmFsZXJ0Tm9kZUNvbXBvbmVudHMuYm9keSk7XG5cdG5vZGVzLmFsZXJ0Tm9kZS5hcHBlbmRDaGlsZChub2Rlcy5hbGVydE5vZGVDb21wb25lbnRzLmV4dHJhKTtcblx0cGFyZW50Tm9kZS5hcHBlbmRDaGlsZChub2Rlcy5hbGVydE5vZGUpO1xuXHRwYXJlbnROb2RlLmFwcGVuZENoaWxkKG5vZGVzLnJvb3ROb2RlKTtcblx0bm9kZXMubG9hZGVyTm9kZS5hcHBlbmRDaGlsZChsb2FkZXJDaGlsZE5vZGUpO1xuXHRwYXJlbnROb2RlLmFwcGVuZENoaWxkKG5vZGVzLmxvYWRlck5vZGUpO1xuXG5cdC8vIGNlbnRlciBub2Rlc1xuXHRFdmVudHMubm93QW5kT25Ob2RlRXZlbnQobWFpbldpbmRvdywgJ3Jlc2l6ZScsIGZ1bmN0aW9uKCkge1xuXHRcdEludGVyZmFjZXMuY29udHJvbGxlci5jZW50ZXJOb2RlUmVsYXRpdmVUbyhub2Rlcy5sb2FkZXJOb2RlLCBtYWluV2luZG93KTtcblx0XHRJbnRlcmZhY2VzLmNvbnRyb2xsZXIuaG9yaXpvbnRhbENlbnRlck5vZGVSZWxhdGl2ZVRvKG5vZGVzLnJvb3ROb2RlLCBtYWluV2luZG93KTtcblx0fSk7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgdmlldyBlbGVtZW50cyBpZiBub24tZXhpc3RlbnQgYW5kIGRpc3BsYXlzIGJvYXJkIGNvbXBvbmVudHMuXG4gKi9cbkJvYXJkLnNob3cgPSBmdW5jdGlvbihJbnRlcmZhY2VzLCBFdmVudHMsIFNlcnZlciwgbWFpbldpbmRvdywgcGFyZW50Tm9kZSkge1xuXHRpZiAoIWlzQ3JlYXRlZCkge1xuXHRcdGlzQ3JlYXRlZCA9IHRydWU7XG5cdFx0Qm9hcmQuY3JlYXRlKEludGVyZmFjZXMsIEV2ZW50cywgbWFpbldpbmRvdywgcGFyZW50Tm9kZSk7XG5cdH1cblxuXHRCb2FyZC51cGRhdGUoSW50ZXJmYWNlcywgRXZlbnRzLCBTZXJ2ZXIsIG1haW5XaW5kb3cpO1xuXHRCb2FyZC5vbignbG9hZCcsIGZ1bmN0aW9uKHNldENvdW50KSB7XG5cdFx0Qm9hcmQuc2hvd0FsZXJ0KEJvYXJkLmdldE5hbWUoKSArICcgUGljdHVyZSBCb2FyZCcsIHNldENvdW50KTtcblx0XHRCb2FyZC5jaGlzZWwobWFpbldpbmRvdyk7XG5cdH0pO1xuXG5cdEJvYXJkLm9uKCdjaGlzZWwnLCBmdW5jdGlvbihub2RlLCBpdGVtTWFyZ2luKSB7XG5cdFx0cGFyZW50Tm9kZS5zdHlsZS5oZWlnaHQgPSAobm9kZS5zY3JvbGxIZWlnaHQgKyBpdGVtTWFyZ2luKSArIFwicHhcIjtcblx0XHRJbnRlcmZhY2VzLmNvbnRyb2xsZXIuaG9yaXpvbnRhbENlbnRlck5vZGVSZWxhdGl2ZVRvKG5vZGUsIG1haW5XaW5kb3cpO1xuXHR9KTtcblxuXHRFdmVudHMub25Ob2RlRXZlbnQobWFpbldpbmRvdywgJ3Jlc2l6ZScsIGZ1bmN0aW9uKCkge1xuXHRcdEJvYXJkLmNoaXNlbChtYWluV2luZG93KTtcblx0fSk7XG5cbn07XG5cbkJvYXJkLnNob3dBbGVydCA9IGZ1bmN0aW9uKGJvZHlUZXh0LCBleHRyYVRleHQpIHtcblx0aWYgKCFub2Rlcy5hbGVydE5vZGUpIHtcblx0XHRyZXR1cm4gY29uc29sZS5sb2coJ0JPQVJEIEFMRVJUJywgJ0FuIGF0dGVtcHQgd2FzIG1hZGUgdG8gcGxhY2UgYW4gYWxlcnQgd2l0aG91dCBcInNob3dcImluZyB0aGUgYm9hcmQgZmlyc3QuJyk7XG5cdH1cblxuXHRCb2FyZC5zZXRBbGVydEJvZHkoYm9keVRleHQgfHwgJycpO1xuXHRCb2FyZC5zZXRBbGVydEV4dHJhKGV4dHJhVGV4dCk7XG5cdEJvYXJkLnVwZGF0ZUFsZXJ0Q29tcG9uZW50cygpO1xufTtcblxuQm9hcmQuc2V0QWxlcnRCb2R5ID0gZnVuY3Rpb24odGV4dCkge1xuXHRCb2FyZC5hbGVydE5vZGVDb21wb25lbnRzLmJvZHkgPSB0ZXh0O1xufTtcblxuQm9hcmQuc2V0QWxlcnRFeHRyYSA9IGZ1bmN0aW9uKHRleHQpIHtcblx0Qm9hcmQuYWxlcnROb2RlQ29tcG9uZW50cy5leHRyYSA9IHRleHQ7XG59O1xuXG5Cb2FyZC5zZXRSZXF1ZXN0QW5jaG9yID0gZnVuY3Rpb24oYW5jaG9yKSB7XG5cdEJvYXJkLmFsYnVtUmVxdWVzdENvbXBvbmVudHMuYW5jaG9yID0gYW5jaG9yO1xufTtcblxuQm9hcmQuc2V0UmVxdWVzdEhlYWQgPSBmdW5jdGlvbihoZWFkKSB7XG5cdEJvYXJkLmFsYnVtUmVxdWVzdENvbXBvbmVudHMuaGVhZCA9IGhlYWQ7XG59O1xuXG4vLyBsb2NhbCBldmVudHNcbkJvYXJkLm9uID0gZnVuY3Rpb24oZXZlbnROYW1lLCBjYWxsYmFjaywgb25jZSkge1xuXHRpZiAoIWV2ZW50c1tldmVudE5hbWVdKSB7XG5cdFx0ZXZlbnRzW2V2ZW50TmFtZV0gPSBbXTtcblx0fVxuXHRjYWxsYmFjay5vbmNlID0gb25jZTtcblx0ZXZlbnRzW2V2ZW50TmFtZV0ucHVzaChjYWxsYmFjayk7XG59O1xuXG5Cb2FyZC5lbWl0ID0gZnVuY3Rpb24oZXZlbnROYW1lLCBhcmdzKSB7XG5cdGlmICghZXZlbnRzW2V2ZW50TmFtZV0pIHtcblx0XHRyZXR1cm47XG5cdH1cblx0aWYgKCEoYXJncyBpbnN0YW5jZW9mIEFycmF5KSkge1xuXHRcdGFyZ3MgPSBbYXJnc11cblx0fVxuXHRmb3IgKHZhciBpID0gMDsgaSA8IGV2ZW50c1tldmVudE5hbWVdLmxlbmd0aDsgaSsrKSB7XG5cdFx0ZXZlbnRzW2V2ZW50TmFtZV1baV0uYXBwbHkoQm9hcmQsIGFyZ3MpO1xuXHRcdGlmIChldmVudHNbZXZlbnROYW1lXVtpXS5vbmNlKSB7XG5cdFx0XHRldmVudHNbZXZlbnROYW1lXS5zcGxpY2UoaSwgMSk7XG5cdFx0fVxuXHR9XG59O1xuXG4vLyBleHBlY3RzIGFuIG9mZnNldCAob3IgemVybylcbi8vIHNjYWZmb2xkcyBwaWN0dXJlIGdhbGxlcnlcbkJvYXJkLmNoaXNlbCA9IGZ1bmN0aW9uKG1haW5XaW5kb3csIG9mZnNldCkge1xuXHRpZiAoIW5vZGVzLnJvb3ROb2RlIHx8ICFtYWluV2luZG93IHx8ICFCb2FyZC5nZXRTaXplKCkpIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHR2YXIgd2luZG93V2lkdGggPSBtYWluV2luZG93LmlubmVyV2lkdGg7XG5cdHZhciBpdGVtV2lkdGggPSBCb2FyZC5waWN0dXJlc1swXS5vZmZzZXRXaWR0aDtcblx0dmFyIGl0ZW1NYXJnaW4gPSAwO1xuXHR2YXIgY29sdW1uQ291bnQgPSAwO1xuXG5cdGlmICh3aW5kb3dXaWR0aCAmJiBpdGVtV2lkdGgpIHtcblx0XHRpdGVtTWFyZ2luID0gcGFyc2VJbnQobWFpbldpbmRvdy5nZXRDb21wdXRlZFN0eWxlKEJvYXJkLnBpY3R1cmVzWzBdKS5nZXRQcm9wZXJ0eVZhbHVlKCdtYXJnaW4tbGVmdCcpLnNwbGl0KFwicHhcIilbMF0gKiAyKTtcblx0XHRjb2x1bW5Db3VudCA9IE1hdGguZmxvb3Iod2luZG93V2lkdGggLyAoaXRlbVdpZHRoICsgaXRlbU1hcmdpbikpO1xuXG5cdFx0aWYgKGNvbHVtbkNvdW50ID4gQm9hcmQuZ2V0U2l6ZSgpKSB7XG5cdFx0XHRjb2x1bW5Db3VudCA9IEJvYXJkLmdldFNpemUoKTtcblx0XHR9XG5cblx0XHQvLyBwcmV2ZW50IGFueSBmdXJ0aGVyIGFjdGlvbiBpZiBjb2x1bW4gY291bnQgaGFzIG5vdCBjaGFuZ2VkXG5cdFx0aWYgKGNvbHVtbkNvdW50ID09IGNhY2hlLmxhc3RDb2x1bW5Db3VudCkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdG5vZGVzLnJvb3ROb2RlLnN0eWxlLndpZHRoID0gKGNvbHVtbkNvdW50ICogKGl0ZW1XaWR0aCArIChpdGVtTWFyZ2luKSkpICsgXCJweFwiO1xuXHRcdGNhY2hlLmxhc3RDb2x1bW5Db3VudCA9IGNvbHVtbkNvdW50O1xuXG5cdFx0aWYgKG9mZnNldCkge1xuXHRcdFx0Ly8gdmFyIHggPSBhICsgMTtcblx0XHRcdC8vIGZvciAodmFyIGkgPSB4OyBpIDwgeCArIFBpY3RyZS5fc2V0dGluZ3MuZGF0YS5saW1pdC5yZXF1ZXN0OyBpKyspIHtcblx0XHRcdC8vIFx0dmFyIHRvcCA9IHBhcnNlSW50KHRoaXMuX3N0b3JhZ2UucGljdHVyZXNbaSAtIGNvbHVtbkNvdW50XS5zdHlsZS50b3Auc3BsaXQoXCJweFwiKVswXSkgKyB0aGlzLl9zdG9yYWdlLnBpY3R1cmVzW2kgLSBjb2x1bW5Db3VudF0ub2Zmc2V0SGVpZ2h0ICsgaXRlbU1hcmdpbjtcblx0XHRcdC8vIFx0dGhpcy5fc3RvcmFnZS5waWN0dXJlc1tpXS5zdHlsZS5sZWZ0ID0gdGhpcy5fc3RvcmFnZS5waWN0dXJlc1tpIC0gY29sdW1uQ291bnRdLnN0eWxlLmxlZnQ7XG5cdFx0XHQvLyBcdHRoaXMuX3N0b3JhZ2UucGljdHVyZXNbaV0uc3R5bGUudG9wID0gdG9wICsgXCJweFwiO1xuXHRcdFx0Ly8gfVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IEJvYXJkLnBpY3R1cmVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdEJvYXJkLnBpY3R1cmVzW2ldLmZpcnN0ID0gZmFsc2U7XG5cdFx0XHRcdEJvYXJkLnBpY3R1cmVzW2ldLnN0eWxlLmNsZWFyID0gJ25vbmUnO1xuXHRcdFx0XHRCb2FyZC5waWN0dXJlc1tpXS5zdHlsZS50b3AgPSAnMHB4Jztcblx0XHRcdFx0Qm9hcmQucGljdHVyZXNbaV0uc3R5bGUubGVmdCA9ICcwcHgnO1xuXHRcdFx0fVxuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBCb2FyZC5waWN0dXJlcy5sZW5ndGg7IGkgKz0gY29sdW1uQ291bnQpIHtcblx0XHRcdFx0Qm9hcmQucGljdHVyZXNbaV0uZmlyc3QgPSB0cnVlO1xuXHRcdFx0fVxuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBCb2FyZC5waWN0dXJlcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRpZiAoIUJvYXJkLnBpY3R1cmVzW2ldLmZpcnN0KSB7XG5cdFx0XHRcdFx0Qm9hcmQucGljdHVyZXNbaV0uc3R5bGUubGVmdCA9IChwYXJzZUludChCb2FyZC5waWN0dXJlc1tpIC0gMV0uc3R5bGUubGVmdC5zcGxpdChcInB4XCIpWzBdKSArIEJvYXJkLnBpY3R1cmVzW2kgLSAxXS5vZmZzZXRXaWR0aCArIGl0ZW1NYXJnaW4pICsgXCJweFwiO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IEJvYXJkLnBpY3R1cmVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGlmIChCb2FyZC5waWN0dXJlc1tpICsgY29sdW1uQ291bnRdKSB7XG5cdFx0XHRcdFx0Qm9hcmQucGljdHVyZXNbaSArIGNvbHVtbkNvdW50XS5zdHlsZS50b3AgPSAoKEJvYXJkLnBpY3R1cmVzW2ldLm9mZnNldFRvcCArIEJvYXJkLnBpY3R1cmVzW2ldLm9mZnNldEhlaWdodCArIGl0ZW1NYXJnaW4pIC0gKEJvYXJkLnBpY3R1cmVzW2kgKyBjb2x1bW5Db3VudF0ub2Zmc2V0VG9wKSkgKyBcInB4XCI7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRCb2FyZC5lbWl0KCdjaGlzZWwnLCBbbm9kZXMucm9vdE5vZGUsIGl0ZW1NYXJnaW5dKTtcblx0fVxufTtcblxuQm9hcmQuZ2V0SW1hZ2VCeUluZGV4ID0gZnVuY3Rpb24oaW5kZXgpIHtcblx0dmFyIHBpY3R1cmUgPSBCb2FyZC5nZXRQaWN0dXJlQnlJbmRleChpbmRleClcblx0aWYgKHBpY3R1cmUpIHtcblx0XHRyZXR1cm4gcGljdHVyZS5jaGlsZHJlblswXTtcblx0fVxuXHRyZXR1cm4gbnVsbDtcbn07XG5cbkJvYXJkLmdldEltYWdlQnlJZCA9IGZ1bmN0aW9uKGlkKSB7XG5cdGZvciAodmFyIGkgPSAwOyBpIDwgQm9hcmQucGljdHVyZXMubGVuZ3RoOyBpKyspIHtcblx0XHRpZiAoQm9hcmQucGljdHVyZXNbaV0uZGF0YS5pZCA9PSBpZCkge1xuXHRcdFx0cmV0dXJuIEJvYXJkLnBpY3R1cmVzW2ldO1xuXHRcdH1cblx0fVxufTtcblxuQm9hcmQuZ2V0UGljdHVyZUJ5SW5kZXggPSBmdW5jdGlvbihpbmRleCkge1xuXHRyZXR1cm4gQm9hcmQucGljdHVyZXNbaW5kZXhdO1xufTtcblxuLy8gcmV0dXJuIGxvYWRlZCBwaWN0dXJlIGNvdW50XG5Cb2FyZC5nZXRTaXplID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiBCb2FyZC5waWN0dXJlcy5sZW5ndGg7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJvYXJkOyIsInZhciBJbnRDb250cm9sbGVyID0ge31cblxuZnVuY3Rpb24gaW50ZXJmYWNlTm9kZSgpIHtcblx0dGhpcy5jYWxsYmFja3MgPSB7fTtcblxuXHQvLyBXYXJuaW5nOiBkb2VzIG5vdCByZWdpc3RlciBcIkRPTVRyZWVcIiBub2RlIGV2ZW50c1xuXHQvLyB0aGF0IHNob3VsZCBiZSB3YXRjaGVkIHdpdGggXCJhZGRFdmVudExpc3RlbmVyXCIuXG5cdC8vIG9ubHkgcmVnaXN0ZXJzIFwibG9jYWxcIiBpbnN0YW5jZSBldmVudHMuIFVzZVxuXHQvLyBcIkV2ZW50cy5vbk5vZGVFdmVudFwiIHRvIGxpc3RlbiBmb3IgYWN0dWFsIGRvbSBldnRzLlxuXHR0aGlzLm9uID0gZnVuY3Rpb24oZXZlbnROYW1lLCBjYWxsYmFjaykge1xuXHRcdGlmICghdGhpcy5jYWxsYmFja3NbZXZlbnROYW1lXSkge1xuXHRcdFx0dGhpcy5jYWxsYmFja3NbZXZlbnROYW1lXSA9IFtdO1xuXHRcdH1cblxuXHRcdHRoaXMuY2FsbGJhY2tzW2V2ZW50TmFtZV0ucHVzaChjYWxsYmFjayk7XG5cdH07XG5cblx0dGhpcy5lbWl0ID0gZnVuY3Rpb24oZXZlbnROYW1lLCBhcmdzKSB7XG5cdFx0aWYgKCF0aGlzLmNhbGxiYWNrc1tldmVudE5hbWVdKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmNhbGxiYWNrc1tldmVudE5hbWVdLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR0aGlzLmNhbGxiYWNrc1tldmVudE5hbWVdW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuXHRcdH1cblx0fTtcbn1cblxuZnVuY3Rpb24gaW50ZXJmYWNlSW5wdXROb2RlKEV2ZW50cywgbWFpbldpbmRvdykge1xuXHR2YXIgc2NvcGUgPSB0aGlzO1xuXG5cdHRoaXMubm9kZSA9IG1haW5XaW5kb3cuZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlucHV0XCIpO1xuXHR0aGlzLnR5cGUgPSBcInRleHRcIjtcblx0dGhpcy5wYXNzd29yZCA9IGZhbHNlO1xuXHR0aGlzLmNsYXNzTmFtZSA9IFwiUGljdHJlLXBhc3Njb2RlLWlucHV0XCI7XG5cdHRoaXMucGxhY2Vob2xkZXIgPSBcIkNyZWF0ZSBhIHBhc3Njb2RlXCI7XG5cdHRoaXMudmFsdWUgPSB0aGlzLnBsYWNlaG9sZGVyO1xuXG5cdHRoaXMubm9kZS5tYXhMZW5ndGggPSAxMDtcblx0dGhpcy5ub2RlLmNsYXNzTmFtZSA9IHRoaXMuY2xhc3NOYW1lO1xuXHR0aGlzLm5vZGUudHlwZSA9IHRoaXMudHlwZTtcblx0dGhpcy5ub2RlLnBsYWNlaG9sZGVyID0gdGhpcy5wbGFjZWhvbGRlciB8fCBcIlwiO1xuXG5cdHRoaXMuZ2V0Tm9kZSA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBzY29wZS5ub2RlO1xuXHR9O1xuXHR0aGlzLnNldFN0eWxlID0gZnVuY3Rpb24oYXR0ciwgdmFsdWUpIHtcblx0XHRzY29wZS5ub2RlLnN0eWxlW2F0dHJdID0gdmFsdWU7XG5cdH07XG5cdHRoaXMuc2V0QXR0cmlidXRlID0gZnVuY3Rpb24oYXR0ciwgdmFsdWUpIHtcblx0XHRzY29wZS5ub2RlLnNldEF0dHJpYnV0ZShhdHRyLCB2YWx1ZSk7XG5cdH07XG5cblx0dGhpcy5zZXRWYWx1ZSA9IGZ1bmN0aW9uKHRleHQpIHtcblx0XHR0aGlzLm5vZGUudmFsdWUgPSB0ZXh0O1xuXHRcdHRoaXMudmFsdWUgPSB0ZXh0O1xuXHR9O1xuXG5cdHRoaXMuc2V0UGxhY2Vob2xkZXIgPSBmdW5jdGlvbih0ZXh0KSB7XG5cdFx0dGhpcy52YWx1ZSA9IHRleHQ7XG5cdFx0dGhpcy5wbGFjZWhvbGRlciA9IHRleHQ7XG5cdFx0dGhpcy5ub2RlLnBsYWNlaG9sZGVyID0gdGV4dDtcblx0fTtcblxuXHR0aGlzLmdldFZhbHVlID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHNjb3BlLm5vZGUudmFsdWU7XG5cdH07XG5cdHRoaXMuZ2V0RXNjYXBlZFZhbHVlID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHNjb3BlLm5vZGUudmFsdWUudG9Mb3dlckNhc2UoKVxuXHRcdFx0LnJlcGxhY2UoLyYvZywgXCImYW1wO1wiKVxuXHRcdFx0LnJlcGxhY2UoLzwvZywgXCImbHQ7XCIpXG5cdFx0XHQucmVwbGFjZSgvPi9nLCBcIiZndDtcIilcblx0XHRcdC5yZXBsYWNlKC9cIi9nLCBcIiZxdW90O1wiKVxuXHRcdFx0LnJlcGxhY2UoLycvZywgXCImIzAzOTtcIik7XG5cdH07XG5cblx0dGhpcy5pc1ZhbHVlRW1wdHkgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gc2NvcGUudmFsdWUgPT0gc2NvcGUubm9kZS52YWx1ZSB8fCBzY29wZS5ub2RlLnZhbHVlID09ICcnO1xuXHR9O1xuXG5cdEV2ZW50cy5vbk5vZGVFdmVudCh0aGlzLm5vZGUsICdmb2N1cycsIGZ1bmN0aW9uKGUpIHtcblx0XHRzY29wZS5lbWl0KCdmb2N1cycsIFtlXSk7XG5cdFx0aWYgKHNjb3BlLnBhc3N3b3JkKSB7XG5cdFx0XHRzY29wZS5ub2RlLnR5cGUgPSBcInBhc3N3b3JkXCI7XG5cdFx0fVxuXHRcdGlmIChzY29wZS5ub2RlLnZhbHVlID09IHNjb3BlLnZhbHVlKSB7XG5cdFx0XHRzY29wZS5ub2RlLnZhbHVlID0gXCJcIjtcblx0XHR9XG5cdH0pO1xuXG5cdEV2ZW50cy5vbk5vZGVFdmVudCh0aGlzLm5vZGUsICdibHVyJywgZnVuY3Rpb24oZSkge1xuXHRcdHNjb3BlLmVtaXQoJ2JsdXInLCBbZV0pO1xuXHR9KTtcblxuXHRyZXR1cm4gdGhpcztcbn07XG5cbmludGVyZmFjZUlucHV0Tm9kZS5wcm90b3R5cGUgPSBuZXcgaW50ZXJmYWNlTm9kZSgpO1xuXG5mdW5jdGlvbiBpbnRlcmZhY2VEaXZOb2RlKCkge1xuXG59XG5cbkludENvbnRyb2xsZXIuaG9yaXpvbnRhbENlbnRlck5vZGVSZWxhdGl2ZVRvID0gZnVuY3Rpb24obm9kZSwgcmVsYXRpdmVUb05vZGUpIHtcblx0bm9kZS5zdHlsZS5sZWZ0ID0gKCQocmVsYXRpdmVUb05vZGUpLndpZHRoKCkgLyAyKSAtICgkKG5vZGUpLndpZHRoKCkgLyAyKSArICdweCc7XG59O1xuXG5JbnRDb250cm9sbGVyLnZlcnRpY2FsQ2VudGVyTm9kZVJlbGF0aXZlVG8gPSBmdW5jdGlvbihub2RlLCByZWxhdGl2ZVRvTm9kZSkge1xuXHRub2RlLnN0eWxlLnRvcCA9ICgkKHJlbGF0aXZlVG9Ob2RlKS5oZWlnaHQoKSAvIDIpIC0gKCQobm9kZSkuaGVpZ2h0KCkgLyAyKSArICdweCc7XG59O1xuXG5JbnRDb250cm9sbGVyLmNlbnRlck5vZGVSZWxhdGl2ZVRvID0gZnVuY3Rpb24obm9kZSwgcmVsYXRpdmVUb05vZGUpIHtcblx0SW50Q29udHJvbGxlci5ob3Jpem9udGFsQ2VudGVyTm9kZVJlbGF0aXZlVG8obm9kZSwgcmVsYXRpdmVUb05vZGUpO1xuXHRJbnRDb250cm9sbGVyLnZlcnRpY2FsQ2VudGVyTm9kZVJlbGF0aXZlVG8obm9kZSwgcmVsYXRpdmVUb05vZGUpO1xufTtcblxuSW50Q29udHJvbGxlci5uZXdJbnB1dE5vZGUgPSBmdW5jdGlvbihFdmVudHMsIG1haW5XaW5kb3cpIHtcblx0cmV0dXJuIG5ldyBpbnRlcmZhY2VJbnB1dE5vZGUoRXZlbnRzLCBtYWluV2luZG93KTtcbn07XG5cbkludENvbnRyb2xsZXIubmV3RGl2Tm9kZSA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gbmV3IGludGVyZmFjZURpdk5vZGUoKTtcbn07XG5cbkludENvbnRyb2xsZXIuY3JlYXRlRGl2Tm9kZSA9IGZ1bmN0aW9uKG1haW5XaW5kb3cpIHtcblx0cmV0dXJuIG1haW5XaW5kb3cuZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG59O1xuXG5JbnRDb250cm9sbGVyLmNyZWF0ZU5vZGUgPSBmdW5jdGlvbihtYWluV2luZG93LCBub2RlTmFtZSkge1xuXHRyZXR1cm4gbWFpbldpbmRvdy5kb2N1bWVudC5jcmVhdGVFbGVtZW50KG5vZGVOYW1lKTtcbn07XG5cbkludENvbnRyb2xsZXIuc2V0Tm9kZU92ZXJmbG93SGlkZGVuID0gZnVuY3Rpb24obm9kZSkge1xuXHRub2RlLnN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbic7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEludENvbnRyb2xsZXI7IiwiLyoqXG4gKiBHYWxsZXJ5IHdyYXBwZXIgZm9yIG92ZXJsYXkgaW50ZXJmYWNlXG4gKi9cblxudmFyIEdhbGxlcnlJbnRlcmZhY2UgPSB7fTtcblxuR2FsbGVyeUludGVyZmFjZS5pc0ZlYXR1cmluZyA9IGZhbHNlO1xuXG5HYWxsZXJ5SW50ZXJmYWNlLmV2ZW50cyA9IHt9O1xuR2FsbGVyeUludGVyZmFjZS5pbWFnZXMgPSBbXTtcblxuR2FsbGVyeUludGVyZmFjZS5pbWFnZSA9IG51bGw7XG5cbnZhciBpc0FjdGl2ZSA9IGZhbHNlO1xuXG5HYWxsZXJ5SW50ZXJmYWNlLmV2ZW50cy5vbnJlYWR5ID0gZnVuY3Rpb24oKSB7fTtcbkdhbGxlcnlJbnRlcmZhY2UuZXZlbnRzLm9uY2xvc2UgPSBmdW5jdGlvbigpIHt9O1xuXG5HYWxsZXJ5SW50ZXJmYWNlLm9uRXhpdCA9IGZ1bmN0aW9uKGV4aXRDYWxsYmFjaykge1xuXHRPdmVybGF5LmV2ZW50cy5vbmV4aXQucHVzaChleGl0Q2FsbGJhY2spO1xufTtcblxuR2FsbGVyeUludGVyZmFjZS5oaWRlID0gZnVuY3Rpb24oKSB7XG5cblx0Ly8gaWYgKCFPdmVybGF5LmlzTG9ja2VkKSB7XG5cblx0Ly8gXHR3aW5kb3cuZG9jdW1lbnQuYm9keS5zdHlsZS5vdmVyZmxvdyA9ICdhdXRvJztcblx0Ly8gXHR3aW5kb3cuZG9jdW1lbnQuYm9keS5zdHlsZS5oZWlnaHQgPSAnYXV0byc7XG5cdC8vIFx0R2FsbGVyeUludGVyZmFjZS5pc0ZlYXR1cmluZyA9IGZhbHNlO1xuXG5cdC8vIFx0T3ZlcmxheS5yZW1vdmUoKTtcblx0Ly8gXHRHYWxsZXJ5SW50ZXJmYWNlLm9uY2xvc2UoKTtcblxuXHQvLyBcdGZvciAodmFyIGkgPSAwOyBpIDwgT3ZlcmxheS5ldmVudHMub25leGl0Lmxlbmd0aDsgaSsrKSB7XG5cdC8vIFx0XHRpZiAoT3ZlcmxheS5ldmVudHMub25leGl0W2ldKSBPdmVybGF5LmV2ZW50cy5vbmV4aXRbaV0uY2FsbChHYWxsZXJ5SW50ZXJmYWNlKTtcblx0Ly8gXHR9XG5cblx0Ly8gfVxuXG59XG5cbi8qKlxuICogRmVhdHVyZSBhIGdpdmVuIGltYWdlIG9iamVjdFxuICovXG5HYWxsZXJ5SW50ZXJmYWNlLnNob3cgPSBmdW5jdGlvbihpbWFnZSkge1xuXG5cdEdhbGxlcnlJbnRlcmZhY2UuaXNBY3RpdmUgPSB0cnVlO1xuXG5cdHZhciBzY29wZSA9IFBpY3RyZTtcblxuXHQvLyB2YXIgdGh1bWIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuXHQvLyB0aHVtYi5jbGFzc05hbWUgPSBcIlBpY3RyZS1vdmVybGF5LXBpY1wiO1xuXHQvLyB0aHVtYi5kYXRhID0gaW1hZ2UuZGF0YTtcblx0Ly8gdGh1bWIuc3R5bGUubWluV2lkdGggPSBFbnZpcm9ubWVudC5tYXhJbWFnZVdpZHRoICsgJ3B4Jztcblx0Ly8gdGh1bWIuc3R5bGUubWF4V2lkdGggPSBFbnZpcm9ubWVudC5tYXhJbWFnZVdpZHRoICsgJ3B4Jztcblx0Ly8gdGh1bWIuc3R5bGUud2lkdGggPSBFbnZpcm9ubWVudC5tYXhJbWFnZVdpZHRoICsgJ3B4Jztcblx0Ly8gdGh1bWIuaW5uZXJIVE1MID0gXCI8ZGl2IGNsYXNzPSdQaWN0cmUtbG9hZGVyJz48c3BhbiBjbGFzcz0nZmEgZmEtY2lyY2xlLW8tbm90Y2ggZmEtc3BpbiBmYS0zeCc+PC9zcGFuPjwvZGl2PlwiO1xuXG5cdC8vIE92ZXJsYXkuZmVhdHVyZSh0aHVtYik7XG5cdC8vIE92ZXJsYXkuaXRlcmF0b3IgPSBpbWFnZS5kYXRhLmlkO1xuXG5cdC8vIHdpbmRvdy5kb2N1bWVudC5ib2R5LnN0eWxlLmhlaWdodCA9ICQod2luZG93KS5oZWlnaHQoKSArICdweCc7XG5cdC8vIHdpbmRvdy5kb2N1bWVudC5ib2R5LnN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbic7XG5cblx0Ly8gaW1hZ2Uuc3R5bGUub3BhY2l0eSA9ICcwLjEnO1xuXG5cdC8vIEdhbGxlcnkuc2hvd0ltYWdlKHRodW1iKTtcblx0Ly8gUGljdHJlLmdhbGxlcnkub3ZlcmxheS5vbmNsb3NlID0gZnVuY3Rpb24oKSB7XG5cdC8vIFx0aWYgKGEpIGEuc3R5bGUub3BhY2l0eSA9IFBpY3RyZS5fc2V0dGluZ3MuZGF0YS52aXNpdGVkO1xuXHQvLyB9XG5cbn07XG5cbkdhbGxlcnlJbnRlcmZhY2UuaXNBY3RpdmUgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIGlzQWN0aXZlO1xufTtcblxuR2FsbGVyeUludGVyZmFjZS5nZXRPdmVybGF5ID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiBPdmVybGF5O1xufVxuXG5HYWxsZXJ5SW50ZXJmYWNlLnB1dE92ZXJsYXkgPSBmdW5jdGlvbigpIHt9XG5cbm1vZHVsZS5leHBvcnRzID0gR2FsbGVyeUludGVyZmFjZTsiLCIvKipcbiAqIEV4cG9ydHMgYWxsIGludGVyZmFjZSBtb2R1bGVzIGluIGN1cnJlbnQgZGlyZWN0b3J5XG4gKi9cblxuLy9pbXBvcnQgYWxsIG1vZHVsZXNcbnZhciBtb2R1bGVzID0ge1xuXHQnYm9hcmQnOiByZXF1aXJlKCcuL2JvYXJkLmpzJyksXG5cdCdjb250cm9sbGVyJzogcmVxdWlyZSgnLi9jb250cm9sbGVyLmpzJyksXG5cdCdnYWxsZXJ5JzogcmVxdWlyZSgnLi9nYWxsZXJ5LmpzJyksXG5cdCdtZW51JzogcmVxdWlyZSgnLi9tZW51LmpzJyksXG5cdCdtb2RhbCc6IHJlcXVpcmUoJy4vbW9kYWwuanMnKSxcblx0J292ZXJsYXknOiByZXF1aXJlKCcuL292ZXJsYXkuanMnKSxcblx0J3NwbGFzaCc6IHJlcXVpcmUoJy4vc3BsYXNoLmpzJyksXG5cdCd3YXJuaW5nJzogcmVxdWlyZSgnLi93YXJuaW5nLmpzJylcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gbW9kdWxlczsiLCIvKipcbiAqIE5hdmlnYXRpb24gYW5kIG1lbnUgaW50ZXJmYWNlXG4gKi9cblxudmFyIEVudmlyb25tZW50ID0gcmVxdWlyZSgnLi4vZW52aXJvbm1lbnQuanMnKTtcbnZhciBVdGlsaXRpZXMgPSByZXF1aXJlKCcuLi91dGlsaXRpZXMuanMnKTtcblxudmFyIE1lbnVJbnRlcmZhY2UgPSB7XG5cblx0ZG9tRWxlbWVudDogbnVsbCxcblx0YnV0dG9uczoge30sXG5cblx0LyoqXG5cdCAqIEFkZHMgdWkgaWNvbiB0byB0aGUgdG9wIG5hdmlnYXRpb24gb2YgdGhlIGFwcGxpY2F0aW9uXG5cdCAqXG5cdCAqIEBwYXJhbSBidXR0b24gW29iamVjdF0gZGVmaW5pbmcgdWkgYW5kIGFjdGlvbiBwcm9wZXJ0aWVzIGZvciBidXR0b25cblx0ICogQHJldHVybiBwb2ludGVyIHRvIGFkZGVkIGJ1dHRvbiBvYmplY3Rcblx0ICovXG5cdGFkZEJ1dHRvbjogZnVuY3Rpb24oYnV0dG9uKSB7XG5cblx0XHR2YXIgYnV0dG9uSWNvbkNsYXNzTmFtZSA9ICdmYS1jbG91ZCc7XG5cblx0XHR0aGlzLmJ1dHRvbnNbYnV0dG9uLm5hbWVdID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblx0XHR0aGlzLmJ1dHRvbnNbYnV0dG9uLm5hbWVdLmlkID0gYnV0dG9uLmlkO1xuXHRcdHRoaXMuYnV0dG9uc1tidXR0b24ubmFtZV0uY2xhc3NOYW1lID0gXCJ0b3AtYnV0dG9uXCI7IC8vXCJ0b3AtYnV0dG9uXCI7XG5cdFx0dGhpcy5idXR0b25zW2J1dHRvbi5uYW1lXS50aXRsZSA9IGJ1dHRvbi50aXRsZTtcblxuXHRcdC8vIGhhbmRsZSBidXR0b24gaWNvbiB0eXBlXG5cdFx0aWYgKGJ1dHRvbi5pZCA9PSAndXBsb2FkJykge1xuXHRcdFx0Ly8gYXNzaWduIHVwbG9hZCBpY29uXG5cdFx0XHRidXR0b25JY29uQ2xhc3NOYW1lID0gJ2ZhLWNsb3VkLXVwbG9hZCc7XG5cdFx0fSBlbHNlIGlmIChidXR0b24uaWQgPT0gJ2xvY2snKSB7XG5cdFx0XHQvLyBhc3NpZ24gJ2xvY2snIGljb24gdG8gaW5kaWNhdGUgc2lnbmluZyBpblxuXHRcdFx0YnV0dG9uSWNvbkNsYXNzTmFtZSA9ICdmYS1sb2NrJztcblx0XHR9IGVsc2UgaWYgKGJ1dHRvbi5pZCA9PSAndW5sb2NrJykge1xuXHRcdFx0Ly8gYXNzaWduICd1bmxvY2snIGljb24gdG8gaW5kaWNhdGUgc2lnbmluZyBvdXRcblx0XHRcdGJ1dHRvbkljb25DbGFzc05hbWUgPSAnZmEtdW5sb2NrJztcblx0XHR9IGVsc2UgaWYgKGJ1dHRvbi5pZCA9PSAnYmFjaycpIHtcblx0XHRcdC8vIGFzc2lnbiAnYmFjaycgYXJyb3cgaWNvbiB0byBpbmRpY2F0ZSByZXR1cm5pbmcgdG8gYWxidW1cblx0XHRcdGJ1dHRvbkljb25DbGFzc05hbWUgPSAnZmEtYXJyb3ctbGVmdCc7XG5cdFx0fVxuXG5cdFx0dGhpcy5idXR0b25zW2J1dHRvbi5uYW1lXS5pbm5lckhUTUwgPSAnPHNwYW4gY2xhc3M9XCJmYSAnICsgYnV0dG9uSWNvbkNsYXNzTmFtZSArICcgZmEtMnhcIj48L3NwYW4+JztcblxuXHRcdHRoaXMuZG9tRWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLmJ1dHRvbnNbYnV0dG9uLm5hbWVdKTtcblxuXHRcdHRoaXMuYnV0dG9uc1tidXR0b24ubmFtZV0uc3R5bGUudG9wID0gKHRoaXMuYnV0dG9uc1tidXR0b24ubmFtZV0ucGFyZW50Tm9kZS5jbGllbnRIZWlnaHQgLyAyIC0gdGhpcy5idXR0b25zW2J1dHRvbi5uYW1lXS5jbGllbnRIZWlnaHQgLyAyKSArICdweCc7XG5cblx0XHQvLyBkZWNsYXJlICdvbicgZnVuY3Rpb24gdG8gYWxsb3cgYWRkaXRpb24gb2YgZXZlbnQgbGlzdGVuZXIgdG8gZWxlbWVudFxuXHRcdHRoaXMuYnV0dG9uc1tidXR0b24ubmFtZV0ub24gPSBmdW5jdGlvbihhY3Rpb24sIGNhbGxiYWNrKSB7XG5cblx0XHRcdFBpY3RyZS5leHRlbmQodGhpcykub24oYWN0aW9uLCBmdW5jdGlvbihldnQpIHtcblx0XHRcdFx0Y2FsbGJhY2suY2FsbCh0aGlzLCBldnQpO1xuXHRcdFx0fSk7XG5cblx0XHRcdHJldHVybiB0aGlzO1xuXG5cdFx0fTtcblxuXHRcdHJldHVybiB0aGlzLmJ1dHRvbnNbYnV0dG9uLm5hbWVdO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIHBvaW50ZXIgdG8gYnV0dG9uIHdpdGggc3BlY2lmaWVkIGlkXG5cdCAqL1xuXHRnZXRCdXR0b246IGZ1bmN0aW9uKGJ1dHRvbklkKSB7XG5cdFx0cmV0dXJuIHRoaXMuYnV0dG9uc1tidXR0b25JZF07XG5cdH0sXG5cblx0LyoqXG5cdCAqIFJldHVybnMgdHJ1ZSBpZiBidXR0b24gd2l0aCBzcGVjaWZpZWQgaWYgZXhpc3RzXG5cdCAqIGZhbHNlIG90aGVyd2lzZS5cblx0ICovXG5cdGhhc0J1dHRvbjogZnVuY3Rpb24oYnV0dG9uSWQpIHtcblxuXHRcdHZhciBidXR0b25FeGlzdHMgPSBmYWxzZTtcblxuXHRcdGlmICh0aGlzLmJ1dHRvbnMuaGFzT3duUHJvcGVydHkoYnV0dG9uSWQpKSB7XG5cdFx0XHRidXR0b25FeGlzdHMgPSB0cnVlO1xuXHRcdH1cblxuXHRcdHJldHVybiBidXR0b25FeGlzdHM7XG5cblx0fSxcblxuXHQvKipcblx0ICogU2V0cyBkb20gc3R5bGUgZGlzcGxheSBwcm9wZXJ0eSB0byBub25lIG9mIGJ1dHRvbiB3aXRoXG5cdCAqIHNwZWNpZmllZCBpZC4gSWYgYnV0dG9uIGRvZXMgbm90IGV4aXN0LCByZXF1ZXN0IGlzIGlnbm9yZWQuXG5cdCAqL1xuXHRoaWRlQnV0dG9uOiBmdW5jdGlvbihidXR0b25JZCkge1xuXHRcdGlmICh0aGlzLmhhc0J1dHRvbihidXR0b25JZCkpIHtcblx0XHRcdHRoaXMuYnV0dG9uc1tidXR0b25JZF0uc3R5bGUuZGlzcGxheSA9ICdub25lJztcblx0XHR9XG5cdH0sXG5cblx0LyoqXG5cdCAqIE1haW4gZGlzcGxheSBmdW5jdGlvbiBmb3IgbWVudSBpbnRlcmZhY2UuIFdoZW4gY2FsbGVkLCBjcmVhdGVzXG5cdCAqIG1lbnUgZG9tIGVsZW1lbnQsIGFwcGVuZHMgYXBwbGljYXRpb24gYnJhbmQsIGFuZCBpbnNlcnRzIG1lbnVcblx0ICogZWxlbWVudCBiZWZvcmUgdGhlIG1haW4gYXBwbGljYXRpb24gd3JhcHBlci4gSWYgYVxuXHQgKiBzaWJsaW5nTm9kZSBpcyBub3Qgc3VwcGxpZWQsIHRoZSBtZW51IGVsZW1lbnQgaXMgYXBwZW5kZWRcblx0ICogdG8gdGhlIHBhcmVudCBub2RlIHN1cHBsaWVkLiAoVXN1YWxseSBib2R5KS5cblx0ICpcblx0ICogTm90ZTogdGhlIGFwcGxpY2F0aW9uIHdyYXBwZXIgaXMgdXN1YWxseSBjcmVhdGVkIGFuZCBhcHBlbmRlZFxuXHQgKiBpbiB0aGUgaW5kZXguaHRtbCBwcmUtaW5pdGlhbGl6YXRpb24gc2NyaXB0LlxuXHQgKlxuXHQgKiBAcGFyYW0gcGFyZW50Tm9kZSBcdFx0XHRbRE9NRWxlbWVudF0gcGFyZW50IG5vZGUgb2YgYXBwIHdyYXBwZXIgYW5kIG1lbnUgKHVzdWFsbHkgZG9jdW1lbnQuYm9keSlcblx0ICogQHBhcmFtIHNpYmxpbmdOb2RlIFx0W0RPTUVsZW1lbnRdIG1haW4gY29udGVudCB3cmFwcGVyIGZvciBhcHBsaWNhdGlvblxuXHQgKi9cblx0cHV0OiBmdW5jdGlvbihwYXJlbnROb2RlLCBzaWJsaW5nTm9kZSkge1xuXG5cdFx0dGhpcy5kb21FbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblx0XHR0aGlzLmRvbUVsZW1lbnQuaWQgPSAndG9wJztcblxuXHRcdC8vIHBsYWNlIGxvZ28gb24gbWVudVxuXHRcdHZhciBicmFuZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG5cdFx0YnJhbmQuaWQgPSAnYnJhbmQnO1xuXHRcdGJyYW5kLmlubmVySFRNTCA9IEVudmlyb25tZW50LmFwcC50aXRsZTtcblxuXHRcdFV0aWxpdGllcy5leHRlbmQoYnJhbmQpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuXHRcdFx0d2luZG93LmxvY2F0aW9uLmFzc2lnbignLycpO1xuXHRcdH0pO1xuXG5cdFx0dGhpcy5kb21FbGVtZW50LmFwcGVuZENoaWxkKGJyYW5kKTtcblxuXHRcdGlmIChzaWJsaW5nTm9kZSkge1xuXHRcdFx0cGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUodGhpcy5kb21FbGVtZW50LCBzaWJsaW5nTm9kZSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHBhcmVudE5vZGUuYXBwZW5kQ2hpbGQodGhpcy5kb21FbGVtZW50KTtcblx0XHR9XG5cblx0XHRicmFuZC5zdHlsZS50b3AgPSAodGhpcy5kb21FbGVtZW50LmNsaWVudEhlaWdodCAvIDIgLSBicmFuZC5jbGllbnRIZWlnaHQgLyAyKSArICdweCc7XG5cdFx0cmV0dXJuIHRoaXMuZG9tRWxlbWVudDtcblx0fSxcblxuXHQvKipcblx0ICogUmVtb3ZlcyBidXR0b24gZnJvbSB0aGUgZG9jdW1lbnQgYW5kIGRlbGV0ZXMgZG9tIGVsZW1lbnQuXG5cdCAqIElmIGJ1dHRvbiB3aXRoIHNwZWNpZmllZCBpZCBkb2VzIG5vdCBleGlzdCwgYWN0aW9uIGlzIGlnbm9yZWQuXG5cdCAqXG5cdCAqIEBwYXJhbSBidXR0b25JZCBbU3RyaW5nXSBpZCBvZiBidXR0b24gdG8gcmVtb3ZlXG5cdCAqL1xuXHRyZW1vdmVCdXR0b246IGZ1bmN0aW9uKGJ1dHRvbklkKSB7XG5cdFx0aWYgKHRoaXMuaGFzQnV0dG9uKGJ1dHRvbklkKSkge1xuXHRcdFx0dGhpcy5kb21FbGVtZW50LnJlbW92ZUNoaWxkKHRoaXMuYnV0dG9uc1tidXR0b25JZF0pO1xuXHRcdFx0ZGVsZXRlIHRoaXMuYnV0dG9uc1tidXR0b25JZF07XG5cdFx0fVxuXHR9LFxuXG5cdC8qKlxuXHQgKiBTZXRzIGJ1dHRvbiBjc3Mgc3R5bGUgZGlzcGxheSBwcm9wZXJ0eSB0byBibG9jay5cblx0ICogVXNlZCBhZnRlciBoaWRpbmcgYSBidXR0b24uIElmIGEgYnV0dG9uIHdpdGhcblx0ICogc3BlY2lmaWVkIGlkIGRvZXMgbm90IGV4aXN0LCB0aGlzIGFjdGlvbiBpcyBpZ25vcmVkLlxuXHQgKi9cblx0c2hvd0J1dHRvbjogZnVuY3Rpb24oYnV0dG9uSWQpIHtcblx0XHRpZiAodGhpcy5oYXNCdXR0b24oYnV0dG9uSWQpKSB7XG5cdFx0XHR0aGlzLmJ1dHRvbnNbYnV0dG9uSWRdLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuXHRcdH1cblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IE1lbnVJbnRlcmZhY2U7IiwiLyoqXG4gKiBNb2RhbCBjb250cm9sbGVyIC0gZGlzcGxheXMgaW5mb3JtYXRpb24gd2l0aCBvcHRpb25hbCB1c2VyIGlucHV0c1xuICogUmVxdWlyZXMgYW4gb3ZlcmxheVxuICovXG5cbnZhciBFbnZpcm9ubWVudCA9IHJlcXVpcmUoJy4uL2Vudmlyb25tZW50LmpzJyk7XG5cbnZhciBNb2RhbCA9IHt9O1xudmFyIG5vZGVzID0ge1xuXHQvLyBub2RlIGF0dGFjaGVkIHRvIGEgcGFyZW50Tm9kZSBvciBtYWluV2luZG93XG5cdHJvb3ROb2RlOiBudWxsLFxuXG5cdC8vIG5vZGUgdGhhdCBob2xkcyBhbGwgbW9kYWwgbm9kZXMgYW5kIGNvbXBvbmVudHNcblx0Ly8gYXR0YWNoZWQgdG8gcm9vdE5vZGVcblx0Y29udGFpbmVyTm9kZTogbnVsbCxcblx0b3V0cHV0Tm9kZTogbnVsbCxcblx0Y29tcG9uZW50czoge1xuXHRcdHRpdGxlOiBudWxsLFxuXHRcdGJvZHk6IG51bGwsXG5cdFx0aW5wdXRzOiBbXVxuXHR9XG59O1xuXG52YXIgYWxlcnRUaW1lb3V0ID0gbnVsbDtcbnZhciBpc0NyZWF0ZWQgPSBmYWxzZTtcbnZhciBtYWluRGl2ID0gbnVsbDtcblxudmFyIHBhcmVudE5vZGVDYWNoZSA9IHt9O1xuXG5Nb2RhbC5zZXR0aW5ncyA9IHtcblx0YWxlcnREdXJhdGlvbjogRW52aXJvbm1lbnQuYWxlcnREdXJhdGlvblxufTtcblxuTW9kYWwuY29tcG9uZW50cyA9IHtcblx0dGl0bGU6IG51bGwsXG5cdGJvZHk6ICdFbXB0eSBtb2RhbC4nLFxuXHRpbnB1dHM6IFtdXG59O1xuXG4vLyB1cGRhdGUgY29tcG9uZW50c1xuTW9kYWwudXBkYXRlID0gZnVuY3Rpb24oKSB7XG5cdGlmIChNb2RhbC50aXRsZSkge1xuXHRcdGlmIChub2Rlcy5jb21wb25lbnRzLnRpdGxlKSB7XG5cdFx0XHRub2Rlcy5jb21wb25lbnRzLnRpdGxlLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuXHRcdFx0bm9kZXMuY29tcG9uZW50cy50aXRsZS5pbm5lckhUTUwgPSBNb2RhbC5jb21wb25lbnRzLnRpdGxlO1xuXHRcdH1cblx0fSBlbHNlIHtcblx0XHRub2Rlcy5jb21wb25lbnRzLnRpdGxlLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG5cdH1cblx0aWYgKG5vZGVzLmNvbXBvbmVudHMuYm9keSkge1xuXHRcdG5vZGVzLmNvbXBvbmVudHMuYm9keS5pbm5lckhUTUwgPSBNb2RhbC5jb21wb25lbnRzLmJvZHk7XG5cdH1cblx0aWYgKE1vZGFsLmlucHV0cy5sZW5ndGgpIHtcblx0XHQvLyBUT0RPXG5cdH1cbn07XG5cbk1vZGFsLmNyZWF0ZSA9IGZ1bmN0aW9uKEludGVyZmFjZXMsIEV2ZW50cywgbWFpbldpbmRvdywgcGFyZW50Tm9kZSkge1xuXHQvLyBnb2VzIG9uIHRvcCBvZiBiYWNrZ3JvdW5kLCBzaW11bGF0ZXMgb3ZlcmxheSBub2RlXG5cdC8vIGluIG9yZGVyIGZvciBpdHMgY2hpbGQgbm9kZXMgdG8gaGF2ZSBjb3JyZWN0IHJlbGF0aXZlXG5cdC8vIHBvc2l0aW9uIHRvIGEgZnVsbCBicm93c2VyIHBhZ2Vcblx0bm9kZXMucm9vdE5vZGUgPSBJbnRlcmZhY2VzLmNvbnRyb2xsZXIuY3JlYXRlRGl2Tm9kZShtYWluV2luZG93KTtcblx0bm9kZXMucm9vdE5vZGUuc3R5bGUud2lkdGggPSAnMTAwJSc7XG5cdG5vZGVzLnJvb3ROb2RlLnN0eWxlLmhlaWdodCA9ICcxMDAlJztcblx0bm9kZXMucm9vdE5vZGUuc3R5bGUucG9zaXRpb24gPSAnZml4ZWQnO1xuXHRub2Rlcy5yb290Tm9kZS5zdHlsZS5sZWZ0ID0gMDtcblx0bm9kZXMucm9vdE5vZGUuc3R5bGUudG9wID0gMDtcblx0bm9kZXMucm9vdE5vZGUuc3R5bGUuekluZGV4ID0gMTAwMDtcblxuXHQvLyBtYWluIHN1Yi1jb250YWluZXIgZm9yIGlucHV0cyAvIHRleHRcblx0bm9kZXMuY29udGFpbmVyTm9kZSA9IEludGVyZmFjZXMuY29udHJvbGxlci5jcmVhdGVEaXZOb2RlKG1haW5XaW5kb3cpO1xuXHRub2Rlcy5jb250YWluZXJOb2RlLmNsYXNzTmFtZSA9ICdQaWN0cmUtcGFzc2NvZGUtd3JhcHBlcic7XG5cblx0Ly8gd3JhcHBlZCBieSBjb250YWluZXJOb2RlLiBXcmFwcyBjb250ZW50LVxuXHQvLyBjb250YWluaW5nIGVsZW1lbnRzIHN1Y2ggYXMgZGl2cywgcGFyYWdyYXBocywgZXRjLlxuXHR2YXIgY29udGFpbmVyTm9kZUNvbnRlbnRXcmFwcGVyID0gSW50ZXJmYWNlcy5jb250cm9sbGVyLmNyZWF0ZURpdk5vZGUobWFpbldpbmRvdyk7XG5cdGNvbnRhaW5lck5vZGVDb250ZW50V3JhcHBlci5jbGFzc05hbWUgPSAnUGljdHJlLXBhc3Njb2RlLWlucHV0LXdyYXBwZXInO1xuXG5cdC8vIHdyYXBwZWQgYnkgY29udGFpbmVyTm9kZUNvbnRlbnRXcmFwcGVyLlxuXHQvLyBtYWluIHRleHQgdmlldyBmb3Igc3BsYXNoIFwibW9kYWxcIlxuXHR2YXIgY29udGFpbmVyTm9kZUNvbnRlbnRXcmFwcGVyVGV4dENvbnRlbnQgPSBJbnRlcmZhY2VzLmNvbnRyb2xsZXIuY3JlYXRlRGl2Tm9kZShtYWluV2luZG93KTtcblx0Y29udGFpbmVyTm9kZUNvbnRlbnRXcmFwcGVyVGV4dENvbnRlbnQuY2xhc3NOYW1lID0gJ1BpY3RyZS1wYXNzY29kZS1wJztcblx0Y29udGFpbmVyTm9kZUNvbnRlbnRXcmFwcGVyVGV4dENvbnRlbnQuc3R5bGUuZm9udFNpemUgPSBcIjAuODVlbVwiO1xuXHRjb250YWluZXJOb2RlQ29udGVudFdyYXBwZXJUZXh0Q29udGVudC5pbm5lckhUTUwgPSAnJztcblxuXHQvLyByZXNldCBpbnB1dHNcblx0bm9kZXMuY29tcG9uZW50cy5pbnB1dHMgPSBbXTtcblxuXHRub2Rlcy5jb21wb25lbnRzLnRpdGxlID0gSW50ZXJmYWNlcy5jb250cm9sbGVyLmNyZWF0ZU5vZGUobWFpbldpbmRvdywgJ2InKTtcblx0bm9kZXMuY29tcG9uZW50cy50aXRsZS5jbGFzc05hbWUgPSAnYnJhbmQnO1xuXHRub2Rlcy5jb21wb25lbnRzLnRpdGxlLnN0eWxlLndpZHRoID0gJzEwMCUnO1xuXHRub2Rlcy5jb21wb25lbnRzLnRpdGxlLnN0eWxlLnRleHRBbGlnbiA9ICdjZW50ZXInO1xuXHRub2Rlcy5jb21wb25lbnRzLnRpdGxlLnN0eWxlLmZvbnRTaXplID0gJzIuMmVtJztcblx0bm9kZXMuY29tcG9uZW50cy50aXRsZS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcblx0bm9kZXMuY29tcG9uZW50cy50aXRsZS5zdHlsZS5tYXJnaW5Cb3R0b20gPSAnMTBweCc7XG5cblx0Ly8gb25seSBkaXNwbGF5IHRpdGxlIGlmIHNldFxuXHRpZiAoTW9kYWwuY29tcG9uZW50cy50aXRsZSkge1xuXHRcdG5vZGVzLmNvbXBvbmVudHMudGl0bGUuaW5uZXJIVE1MID0gTW9kYWwuY29tcG9uZW50cy50aXRsZTtcblx0fVxuXG5cdG5vZGVzLmNvbXBvbmVudHMuYm9keSA9IEludGVyZmFjZXMuY29udHJvbGxlci5jcmVhdGVEaXZOb2RlKG1haW5XaW5kb3cpO1xuXHRub2Rlcy5jb21wb25lbnRzLmJvZHkuaW5uZXJIVE1MID0gTW9kYWwuY29tcG9uZW50cy5ib2R5O1xuXG5cdC8vIHdyYXBwZWQgYnkgY29udGFpbmVyTm9kZUNvbnRlbnRXcmFwcGVyXG5cdC8vIGRpc3BsYXkgYWxlcnRzIG9yIG91dHB1dCB0ZXh0XG5cdG5vZGVzLm91dHB1dE5vZGUgPSBJbnRlcmZhY2VzLmNvbnRyb2xsZXIuY3JlYXRlRGl2Tm9kZShtYWluV2luZG93KTtcblx0bm9kZXMub3V0cHV0Tm9kZS5jbGFzc05hbWUgPSAnUGljdHJlLXBhc3Njb2RlLXAgUGljdHJlLXBhc3Njb2RlLWZvcm1hbC1mb250Jztcblx0bm9kZXMub3V0cHV0Tm9kZS5zdHlsZS5mb250U2l6ZSA9ICcwLjg1ZW0nO1xuXHRub2Rlcy5vdXRwdXROb2RlLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG5cblx0Ly8gY3JlYXRlIG5vZGUgdHJlZVxuXHRjb250YWluZXJOb2RlQ29udGVudFdyYXBwZXJUZXh0Q29udGVudC5hcHBlbmRDaGlsZChub2Rlcy5jb21wb25lbnRzLnRpdGxlKTtcblx0Y29udGFpbmVyTm9kZUNvbnRlbnRXcmFwcGVyVGV4dENvbnRlbnQuYXBwZW5kQ2hpbGQobm9kZXMuY29tcG9uZW50cy5ib2R5KTtcblx0Y29udGFpbmVyTm9kZUNvbnRlbnRXcmFwcGVyLmFwcGVuZENoaWxkKGNvbnRhaW5lck5vZGVDb250ZW50V3JhcHBlclRleHRDb250ZW50KTtcblx0Y29udGFpbmVyTm9kZUNvbnRlbnRXcmFwcGVyLmFwcGVuZENoaWxkKG5vZGVzLm91dHB1dE5vZGUpO1xuXHRpZiAoTW9kYWwuY29tcG9uZW50cy5pbnB1dHMubGVuZ3RoKSB7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBNb2RhbC5jb21wb25lbnRzLmlucHV0cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0bm9kZXMuY29tcG9uZW50cy5pbnB1dHMucHVzaChNb2RhbC5jb21wb25lbnRzLmlucHV0c1tpXSk7XG5cdFx0XHRjb250YWluZXJOb2RlQ29udGVudFdyYXBwZXIuYXBwZW5kQ2hpbGQobm9kZXMuY29tcG9uZW50cy5pbnB1dHNbaV0pO1xuXHRcdH1cblx0fVxuXHRub2Rlcy5jb250YWluZXJOb2RlLmFwcGVuZENoaWxkKGNvbnRhaW5lck5vZGVDb250ZW50V3JhcHBlcik7XG5cdG5vZGVzLnJvb3ROb2RlLmFwcGVuZENoaWxkKG5vZGVzLmNvbnRhaW5lck5vZGUpO1xuXHRwYXJlbnROb2RlLmFwcGVuZENoaWxkKG5vZGVzLnJvb3ROb2RlKTtcblxuXHQvLyBpbml0IHNwbGFzaCBub2RlIGV2ZW50cyBhbmQgYWRqdXN0IHBvc2l0aW9uc1xuXHRFdmVudHMubm93QW5kT25Ob2RlRXZlbnQobWFpbldpbmRvdywgJ3Jlc2l6ZScsIGZ1bmN0aW9uKGUpIHtcblx0XHRJbnRlcmZhY2VzLmNvbnRyb2xsZXIuY2VudGVyTm9kZVJlbGF0aXZlVG8obm9kZXMuY29udGFpbmVyTm9kZSwgbWFpbldpbmRvdyk7XG5cdH0pO1xufTtcblxuLyoqXG4gKiBEaXNwbGF5cyBvciBjcmVhdGVzIHRoZSBtb2RhbCwgdGhlbiBkaXNwbGF5cy5cbiAqIHJlY2VpdmVzIGFuIG9wdGlvbmFsIGFycmF5IG9mIGlucHV0cyB0byBkaXNwbGF5XG4gKi9cbk1vZGFsLnNob3cgPSBmdW5jdGlvbihJbnRlcmZhY2VzLCBFdmVudHMsIG1haW5XaW5kb3csIHBhcmVudE5vZGUsIGlucHV0c0FycmF5KSB7XG5cdGlmICghaXNDcmVhdGVkKSB7XG5cdFx0aXNDcmVhdGVkID0gdHJ1ZTtcblx0XHRNb2RhbC5jcmVhdGUoSW50ZXJmYWNlcywgRXZlbnRzLCBtYWluV2luZG93LCBwYXJlbnROb2RlKTtcblx0fSBlbHNlIHtcblx0XHRNb2RhbC51cGRhdGUoKTtcblx0XHRJbnRlcmZhY2VzLmNvbnRyb2xsZXIuY2VudGVyTm9kZVJlbGF0aXZlVG8obm9kZXMuY29udGFpbmVyTm9kZSwgbWFpbldpbmRvdyk7XG5cdH1cblxuXHQvLyBhc3N1bWVzIHJvb3ROb2RlIGV4aXN0c1xuXHRpZiAoIXBhcmVudE5vZGVDYWNoZVtwYXJlbnROb2RlLm5vZGVOYW1lXSkge1xuXHRcdHBhcmVudE5vZGVDYWNoZVtwYXJlbnROb2RlLm5vZGVOYW1lXSA9IHBhcmVudE5vZGU7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdG5vZGVzLnJvb3ROb2RlLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xufTtcblxuTW9kYWwuaGlkZSA9IGZ1bmN0aW9uKHBhcmVudE5vZGUpIHtcblx0aWYgKCFpc0NyZWF0ZWQpIHtcblx0XHRyZXR1cm47XG5cdH1cblx0aWYgKCFwYXJlbnROb2RlQ2FjaGVbcGFyZW50Tm9kZS5ub2RlTmFtZV0pIHtcblx0XHRyZXR1cm47XG5cdH1cblx0bm9kZXMucm9vdE5vZGUuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbn07XG5cbk1vZGFsLnNldFRpdGxlID0gZnVuY3Rpb24odGl0bGUpIHtcblx0TW9kYWwuY29tcG9uZW50cy50aXRsZSA9IHRpdGxlO1xufTtcblxuTW9kYWwuc2V0Qm9keSA9IGZ1bmN0aW9uKGJvZHkpIHtcblx0TW9kYWwuY29tcG9uZW50cy5ib2R5ID0gYm9keTtcbn07XG5cbk1vZGFsLnNldElucHV0cyA9IGZ1bmN0aW9uKGlucHV0c0FycmF5KSB7XG5cdGlmIChpbnB1dHNBcnJheSBpbnN0YW5jZW9mIEFycmF5KSB7XG5cdFx0TW9kYWwuY29tcG9uZW50cy5pbnB1dHMgPSBpbnB1dHNBcnJheTtcblx0fVxufTtcblxuTW9kYWwuYWRkSW5wdXQgPSBmdW5jdGlvbihpbnB1dCkge1xuXHRNb2RhbC5jb21wb25lbnRzLmlucHV0cy5wdXNoKGlucHV0KTtcbn07XG5cbk1vZGFsLnNob3dBbGVydCA9IGZ1bmN0aW9uKHRleHQsIHRpbWVvdXQpIHtcblx0aWYgKCFub2Rlcy5vdXRwdXROb2RlKSB7XG5cdFx0cmV0dXJuIGNvbnNvbGUubG9nKCdNT0RBTCBBTEVSVCcsICdFcnJvciBkaXNwbGF5aW5nIGFsZXJ0LCBubyBvdXRwdXROb2RlIGhhcyBiZWVuIGNyZWF0ZWQ7IFwic2hvd1wiIHRoZSBub2RlIGZpcnN0LicpO1xuXHR9XG5cblx0bm9kZXMub3V0cHV0Tm9kZS5pbm5lckhUTUwgPSB0ZXh0O1xuXHRub2Rlcy5vdXRwdXROb2RlLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuXG5cdGlmICghdGltZW91dCkge1xuXHRcdHJldHVybjtcblx0fVxuXG5cdGNsZWFyVGltZW91dChhbGVydFRpbWVvdXQpO1xuXHRhbGVydFRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdG5vZGVzLm91dHB1dE5vZGUuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblx0fSwgdGltZW91dCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1vZGFsOyIsIi8qKlxuICogT3ZlcmxheSBpbnRlcmZhY2VcbiAqL1xuXG52YXIgT3ZlcmxheUludGVyZmFjZSA9IHt9O1xuXG52YXIgaXNMb2NrZWQgPSBmYWxzZTtcbnZhciBpdGVyYXRvciA9IDA7XG52YXIgY29tbWVudHMgPSBudWxsO1xudmFyIGRvbUVsZW1lbnQgPSBudWxsO1xudmFyIGZlYXR1cmVkSW1hZ2UgPSBudWxsO1xuXG52YXIgY2FsbGJhY2tzID0ge307XG52YXIgbm9kZXMgPSB7XG5cdG92ZXJsYXk6IG51bGxcbn07XG5cbk92ZXJsYXlJbnRlcmZhY2UuaXNMb2NrZWQgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIGlzTG9ja2VkO1xufVxuXG5PdmVybGF5SW50ZXJmYWNlLnNob3cgPSBmdW5jdGlvbihtYWluV2luZG93KSB7XG5cdGlmICghbm9kZXMub3ZlcmxheSkge1xuXHRcdG5vZGVzLm92ZXJsYXkgPSBtYWluV2luZG93LmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHRcdG5vZGVzLm92ZXJsYXkuY2xhc3NOYW1lID0gJ1BpY3RyZS1vdmVybGF5Jztcblx0XHRub2Rlcy5vdmVybGF5LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG5cdFx0bm9kZXMub3ZlcmxheS5zdHlsZS56SW5kZXggPSA5OTk7XG5cdFx0bWFpbldpbmRvdy5kb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKG5vZGVzLm92ZXJsYXkpO1xuXHR9XG5cblx0JChub2Rlcy5vdmVybGF5KS5mYWRlSW4oNjAwKTtcbn1cblxuT3ZlcmxheUludGVyZmFjZS5sb2NrID0gZnVuY3Rpb24oKSB7XG5cdGlzTG9ja2VkID0gdHJ1ZTtcbn07XG5cbk92ZXJsYXlJbnRlcmZhY2UudW5sb2NrID0gZnVuY3Rpb24oKSB7XG5cdGlzTG9ja2VkID0gZmFsc2U7XG59O1xuXG5PdmVybGF5SW50ZXJmYWNlLmhpZGUgPSBmdW5jdGlvbihtYWluV2luZG93KSB7XG5cdGlmICghbm9kZXMub3ZlcmxheSkge1xuXHRcdHJldHVybjtcblx0fVxuXG5cdCQobm9kZXMub3ZlcmxheSkuZmFkZU91dCg2MDApO1xufVxuXG5PdmVybGF5SW50ZXJmYWNlLmdldEZlYXR1cmVkSW1hZ2UgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIGZlYXR1cmVkSW1hZ2U7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE92ZXJsYXlJbnRlcmZhY2U7IiwiLyoqXG4gKiBTcGxhc2ggaW50ZXJmYWNlIGNvbnRyb2xsZXIgZm9yIGRpc3BsYXlpbmdcbiAqIHRoZSBtYWluIChmcm9udCkgdmlldyBvZiB0aGUgYXBwLlxuICovXG5cbnZhciBTcGxhc2hJbnRlcmZhY2UgPSB7fTtcblxubm9kZXMgPSB7XG5cdC8vIGhvbGRzIFwic3BsYXNoXCIgdmlldydzIGJhY2tncm91bmRcblx0cm9vdE5vZGU6IG51bGwsXG5cdGlucHV0Tm9kZTogbnVsbFxufTtcblxuU3BsYXNoSW50ZXJmYWNlLnNldHRpbmdzID0ge1xuXHRhbGVydFRpbWVvdXQ6IDEwMDAwXG59O1xuXG52YXIgaXNDcmVhdGVkID0gZmFsc2U7XG52YXIgcGFyZW50Tm9kZUNhY2hlID0ge307XG5cblNwbGFzaEludGVyZmFjZS5zaG93QWxlcnQgPSBmdW5jdGlvbihJbnRlcmZhY2VzLCB0ZXh0KSB7XG5cdEludGVyZmFjZXMubW9kYWwuc2hvd0FsZXJ0KHRleHQpO1xufTtcblxuU3BsYXNoSW50ZXJmYWNlLnNob3dBbGVydFdpdGhUaW1lb3V0ID0gZnVuY3Rpb24oSW50ZXJmYWNlcywgdGV4dCwgdGltZW91dCkge1xuXHRJbnRlcmZhY2VzLm1vZGFsLnNob3dBbGVydCh0ZXh0LCB0aW1lb3V0IHx8IFNwbGFzaEludGVyZmFjZS5zZXR0aW5ncy5hbGVydFRpbWVvdXQpO1xufTtcblxuU3BsYXNoSW50ZXJmYWNlLmF0dGFjaElucHV0cyA9IGZ1bmN0aW9uKEludGVyZmFjZXMsIEV2ZW50cywgQ2xpZW50LCBtYWluV2luZG93KSB7XG5cdGlmIChub2Rlcy5pbnB1dE5vZGUpIHtcblx0XHRJbnRlcmZhY2VzLm1vZGFsLnNldElucHV0cyhbXG5cdFx0XHRub2Rlcy5pbnB1dE5vZGUuZ2V0Tm9kZSgpXG5cdFx0XSk7XG5cdFx0cmV0dXJuIG51bGw7XG5cdH1cblxuXHRub2Rlcy5pbnB1dE5vZGUgPSBJbnRlcmZhY2VzLmNvbnRyb2xsZXIubmV3SW5wdXROb2RlKEV2ZW50cywgbWFpbldpbmRvdyk7XG5cdG5vZGVzLmlucHV0Tm9kZS5zZXRTdHlsZSgnY29sb3InLCAnd2hpdGUnKTtcblx0bm9kZXMuaW5wdXROb2RlLnNldEF0dHJpYnV0ZSgnbWF4bGVuZ3RoJywgMTAwKTtcblx0bm9kZXMuaW5wdXROb2RlLnNldFBsYWNlaG9sZGVyKCdFbnRlciBhbiBhbGJ1bSBuYW1lJyk7XG5cblx0aWYgKENsaWVudC5pc0lFKCkgfHwgQ2xpZW50LmlzTW9iaWxlU2FmYXJpKCkgfHwgQ2xpZW50LmlzU2FmYXJpKCc1LjEnKSkge1xuXHRcdG5vZGVzLmlucHV0Tm9kZS5zZXRBdHRyaWJ1dGUoJ25vZm9jdXMnLCB0cnVlKTtcblx0XHRub2Rlcy5pbnB1dE5vZGUuc2V0QXR0cmlidXRlKCd2YWx1ZScsIHZhbHVlKTtcblxuXHRcdG5vZGVzLmlucHV0Tm9kZS5vbignYmx1cicsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdGlmICh0aGlzLm5vZGUudmFsdWUgPT0gXCJcIiAmJiB0aGlzLnZhbHVlICE9ICcnKSB7XG5cdFx0XHRcdHRoaXMubm9kZS52YWx1ZSA9IHRoaXMudmFsdWU7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblxuXHRFdmVudHMub25Ob2RlRXZlbnQobm9kZXMuaW5wdXROb2RlLmdldE5vZGUoKSwgJ2tleWRvd24nLCBmdW5jdGlvbihlKSB7XG5cdFx0aWYgKCFlIHx8IGUua2V5Q29kZSAhPSAxMykge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmICghdGhpcy5pc1ZhbHVlRW1wdHkoKSkge1xuXHRcdFx0dmFyIHZhbHVlID0gdGhpcy5nZXRFc2NhcGVkVmFsdWUoKTtcblx0XHRcdGlmICghSW50ZXJmYWNlcy5ib2FyZC5pc05hbWVSZXN0cmljdGVkKHZhbHVlKSkge1xuXHRcdFx0XHRpZiAoSW50ZXJmYWNlcy5ib2FyZC5pc05hbWVJbnZhbGlkKHZhbHVlKSkge1xuXHRcdFx0XHRcdGlmIChJbnRlcmZhY2VzLmJvYXJkLmlzTmFtZVdpdGhTcGFjZXModmFsdWUpKSB7XG5cdFx0XHRcdFx0XHRTcGxhc2hJbnRlcmZhY2Uuc2hvd0FsZXJ0V2l0aFRpbWVvdXQoSW50ZXJmYWNlcywgXCJZb3VyIGFsYnVtIG5hbWUgY2Fubm90IGNvbnRhaW4gc3BhY2VzLlwiKTtcblx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0U3BsYXNoSW50ZXJmYWNlLnNob3dBbGVydFdpdGhUaW1lb3V0KEludGVyZmFjZXMsIFwiWW91ciBhbGJ1bSBuYW1lIGNvbnRhaW5zIGludmFsaWQgY2hhcmFjdGVycy5cIik7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cdFx0XHRcdG1haW5XaW5kb3cubG9jYXRpb24uYXNzaWduKHZhbHVlKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMuc2V0VmFsdWUoJycpO1xuXHRcdFx0XHRTcGxhc2hJbnRlcmZhY2Uuc2hvd0FsZXJ0V2l0aFRpbWVvdXQoSW50ZXJmYWNlcywgXCJUaGF0IGFsYnVtIGlzIHJlc3RyaWN0ZWQsIHBsZWFzZSB0cnkgYW5vdGhlci5cIik7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LmJpbmQobm9kZXMuaW5wdXROb2RlKSk7XG5cblx0SW50ZXJmYWNlcy5tb2RhbC5zZXRJbnB1dHMoW1xuXHRcdG5vZGVzLmlucHV0Tm9kZS5nZXROb2RlKClcblx0XSk7XG5cblx0cmV0dXJuIG51bGw7XG59O1xuXG5TcGxhc2hJbnRlcmZhY2Uuc2hvdyA9IGZ1bmN0aW9uKEludGVyZmFjZXMsIEV2ZW50cywgQ2xpZW50LCBtYWluV2luZG93LCBwYXJlbnROb2RlKSB7XG5cdGlmICghaXNDcmVhdGVkKSB7XG5cdFx0aXNDcmVhdGVkID0gdHJ1ZTtcblx0XHRub2Rlcy5yb290Tm9kZSA9IEludGVyZmFjZXMuY29udHJvbGxlci5jcmVhdGVEaXZOb2RlKG1haW5XaW5kb3cpO1xuXHRcdG5vZGVzLnJvb3ROb2RlLmNsYXNzTmFtZSA9ICdQaWN0cmUtc3BsYXNoLXdyYXBwZXInO1xuXHRcdG5vZGVzLnJvb3ROb2RlLnN0eWxlLnpJbmRleCA9IDk5ODtcblx0fVxuXHRpZiAoIXBhcmVudE5vZGVDYWNoZVtwYXJlbnROb2RlLm5vZGVOYW1lXSkge1xuXHRcdHBhcmVudE5vZGVDYWNoZVtwYXJlbnROb2RlLm5vZGVOYW1lXSA9IHBhcmVudE5vZGU7XG5cdFx0cGFyZW50Tm9kZS5hcHBlbmRDaGlsZChub2Rlcy5yb290Tm9kZSk7XG5cdH1cblxuXHQvLyBzZXQgdGhlc2UgcHJvcGVydGllcyBldmVyeSB0aW1lLCBpbiBjYXNlIG1vZGFsIGdldHMgdXNlZCBieVxuXHQvLyBhbm90aGVyIGFwcGxpY2F0aW9uIGNvbXBvbmVudCB3aXRoIGRpZmZlcmVudCB2YWx1ZXNcblx0SW50ZXJmYWNlcy5tb2RhbC5zZXRUaXRsZSgnUGljdHJlJyk7XG5cdEludGVyZmFjZXMubW9kYWwuc2V0Qm9keShcIjxiIGNsYXNzPSdicmFuZCc+UGljdHJlPC9iPiA8c3Bhbj5pcyBhIGNvbGxlY3Rpb24gb2YgY2xvdWQgcGhvdG8gYWxidW1zLiBZb3UgY2FuIHZpZXcgb3IgY3JlYXRlIHBpY3R1cmUgYWxidW1zIGJhc2VkIG9uIGludGVyZXN0cywgcGVvcGxlLCBvciBmYW1pbGllcy4gPC9zcGFuPlwiICtcblx0XHRcIjxzcGFuPlRvIGdldCBzdGFydGVkLCBzaW1wbHkgdHlwZSBhbiBhbGJ1bSBuYW1lIGJlbG93Ljwvc3Bhbj5cIik7XG5cblx0dmFyIGFsYnVtSW5wdXQgPSBJbnRlcmZhY2VzLmNvbnRyb2xsZXIuY3JlYXRlTm9kZShtYWluV2luZG93LCAnaW5wdXQnKTtcblx0YWxidW1JbnB1dC5tYXhsZW5ndGggPSAxMDA7XG5cdGFsYnVtSW5wdXQuY2xhc3NOYW1lID0gJ1BpY3RyZS1wYXNzY29kZS1pbnB1dCc7XG5cdGFsYnVtSW5wdXQudHlwZSA9ICd0ZXh0Oydcblx0YWxidW1JbnB1dC5wbGFjZWhvbGRlciA9ICdFbnRlciBhbiBhbGJ1bSBuYW1lJztcblx0YWxidW1JbnB1dC5zdHlsZS5jb2xvciA9ICd3aGl0ZSc7XG5cblx0U3BsYXNoSW50ZXJmYWNlLmF0dGFjaElucHV0cyhJbnRlcmZhY2VzLCBFdmVudHMsIENsaWVudCwgbWFpbldpbmRvdyk7XG5cblx0SW50ZXJmYWNlcy5vdmVybGF5LnNob3cobWFpbldpbmRvdyk7XG5cdEludGVyZmFjZXMubW9kYWwuc2hvdyhJbnRlcmZhY2VzLCBFdmVudHMsIG1haW5XaW5kb3csIHBhcmVudE5vZGUpO1xuXG5cdEludGVyZmFjZXMuY29udHJvbGxlci5zZXROb2RlT3ZlcmZsb3dIaWRkZW4obWFpbldpbmRvdy5kb2N1bWVudC5ib2R5KTtcblx0SW50ZXJmYWNlcy5vdmVybGF5LmxvY2soKTtcblxuXHRub2Rlcy5pbnB1dE5vZGUuZ2V0Tm9kZSgpLmZvY3VzKCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gU3BsYXNoSW50ZXJmYWNlOyIsIi8qKlxuICogV2FybmluZyBpbnRlcmZhY2UuIERpc3BsYXlzIGVycm9ycywgd2FybmluZ3MsIGRpYWxvZ3Vlcy5cbiAqL1xuXG52YXIgV2FybmluZ0ludGVyZmFjZSA9IHtcblxuXHRkb21FbGVtZW50OiBudWxsLFxuXHRyZXNwb25zZTogbnVsbCxcblxuXHQvKipcblx0ICogQ3JlYXRlcyBhbmQgZGlzcGxheXMgd2FybmluZyBpbnRlcmZhY2UuXG5cdCAqIEBwYXJhbSBwcm9wZXJ0aWVzIFtvYmplY3RdIGNvbnRhaW5pbmcgaW50ZXJmYWNlIHNldHRpbmdzIHRvIG92ZXJyaWRlXG5cdCAqXG5cdCAqL1xuXHRwdXQ6IGZ1bmN0aW9uKHByb3BlcnRpZXMpIHtcblxuXHRcdHZhciBzZWxmID0gdGhpcztcblxuXHRcdHZhciBzZXR0aW5ncyA9IHtcblxuXHRcdFx0Ym9keTogJ0FuIGVycm9yIGhhcyBvY2N1cnJlZCwgZG9uXFwndCB3b3JyeSB0aG91Z2gsIGl0XFwncyBub3QgeW91ciBmYXVsdCEnLFxuXHRcdFx0ZHJvcHpvbmU6IGZhbHNlLFxuXHRcdFx0aGVhZGVyOiAnSGV5IScsXG5cdFx0XHRpY29uOiBudWxsLFxuXHRcdFx0bG9ja2VkOiBmYWxzZSxcblx0XHRcdHN0eWxlOiB0cnVlLFxuXHRcdFx0bW9kYWw6IHRydWVcblxuXHRcdH07XG5cblx0XHRpZiAocHJvcGVydGllcykge1xuXG5cdFx0XHRmb3IgKHZhciBpIGluIHByb3BlcnRpZXMpIHtcblx0XHRcdFx0c2V0dGluZ3NbaV0gPSBwcm9wZXJ0aWVzW2ldO1xuXHRcdFx0fVxuXG5cdFx0fVxuXG5cdFx0aWYgKCFzZXR0aW5ncy5tb2RhbCkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vLy8tLS1cblx0XHRpZiAoUGljdHJlLmdhbGxlcnkuaXMuZmVhdHVyaW5nICYmIHNldHRpbmdzLmxvY2tlZCkge1xuXHRcdFx0UGljdHJlLl9zdG9yYWdlLm92ZXJsYXkubG9ja2VkID0gZmFsc2U7XG5cdFx0XHRQaWN0cmUuZ2FsbGVyeS5vdmVybGF5LmV4aXQoKTtcblx0XHR9XG5cblx0XHR0aGlzLmRvbUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuXHRcdHRoaXMuZG9tRWxlbWVudC5jbGFzc05hbWUgPSBcIlBpY3RyZS11cGxvYWQgUGljdHJlLXdhcm5pbmdcIjtcblxuXHRcdFBpY3RyZS5nYWxsZXJ5LmlzLndhcm5pbmcgPSB0cnVlO1xuXG5cdFx0UGljdHJlLmV4dGVuZChQaWN0cmUuZ2FsbGVyeS5vdmVybGF5LnB1dCgpLmFwcGVuZENoaWxkKHRoaXMuZG9tRWxlbWVudCkpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0fSk7XG5cblx0XHR0aGlzLnBvc2l0aW9uKCk7XG5cblx0XHRQaWN0cmUuZXZlbnRzLm9uKCdyZXNpemUnLCBmdW5jdGlvbigpIHtcblx0XHRcdHNlbGYucG9zaXRpb24oKTtcblx0XHR9KTtcblxuXHRcdHZhciBoZWFkZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuXHRcdGhlYWRlci5jbGFzc05hbWUgPSBcIlBpY3RyZS11cGxvYWQtaGVhZGVyXCI7XG5cdFx0aGVhZGVyLmlubmVySFRNTCA9IHNldHRpbmdzLmhlYWRlcjtcblx0XHRoZWFkZXIuc3R5bGUuekluZGV4ID0gXCI5OTlcIjtcblxuXHRcdHZhciBwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInBcIik7XG5cdFx0cC5jbGFzc05hbWUgPSBcIlBpY3RyZS13YXJuaW5nLXBcIjtcblx0XHRwLmlubmVySFRNTCA9IHNldHRpbmdzLmJvZHkgfHwgXCJVbnRpdGxlZCB0ZXh0XCI7XG5cblx0XHR0aGlzLmRvbUVsZW1lbnQuYXBwZW5kQ2hpbGQoaGVhZGVyKTtcblxuXHRcdGlmIChzZXR0aW5ncy5kcm9wem9uZSkge1xuXHRcdFx0dmFyIHNoYWRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG5cdFx0XHRzaGFkZXIuY2xhc3NOYW1lID0gXCJQaWN0cmUtdXBsb2FkLWFyZWEtc2hhZGVyXCI7XG5cdFx0XHRzaGFkZXIuYXBwZW5kQ2hpbGQocCk7XG5cdFx0XHR2YXIgYXJlYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG5cdFx0XHRhcmVhLmNsYXNzTmFtZSA9IFwiUGljdHJlLXVwbG9hZC1hcmVhXCI7XG5cdFx0XHRhcmVhLmFwcGVuZENoaWxkKHNoYWRlcik7XG5cdFx0XHR0aGlzLmRvbUVsZW1lbnQuYXBwZW5kQ2hpbGQoYXJlYSk7XG5cdFx0XHRhcmVhLnN0eWxlLm1hcmdpbkxlZnQgPSAoLWFyZWEuY2xpZW50V2lkdGggLyAyKSArIFwicHhcIjtcblx0XHRcdGFyZWEuc3R5bGUubWFyZ2luVG9wID0gKC1hcmVhLmNsaWVudEhlaWdodCAvIDIgKyAyMCkgKyBcInB4XCI7XG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIG5vdCB1cGxvYWQgaW50ZXJmYWNlLCB3YXJuaW5nIHVpIGluc3RlYWRcblx0XHRcdHRoaXMuZG9tRWxlbWVudC5hcHBlbmRDaGlsZChwKTtcblx0XHRcdHAuc3R5bGUubWFyZ2luVG9wID0gKCh0aGlzLmRvbUVsZW1lbnQuY2xpZW50SGVpZ2h0IC0gaGVhZGVyLmNsaWVudEhlaWdodCkgLyAyIC0gKHAuY2xpZW50SGVpZ2h0IC8gMikpICsgXCJweFwiO1xuXG5cdFx0XHRoZWFkZXIuc3R5bGUudG9wID0gKC1wLmNsaWVudEhlaWdodCkgKyAncHgnO1xuXHRcdH1cblxuXHRcdGlmIChzZXR0aW5ncy5pY29uKSB7XG5cblx0XHRcdHZhciBpY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImltZ1wiKTtcblx0XHRcdGljb24uc3JjID0gc2V0dGluZ3MuaWNvbjtcblx0XHRcdGljb24uc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcblx0XHRcdGljb24uc3R5bGUubWFyZ2luID0gXCIyMHB4IGF1dG8gMCBhdXRvXCI7XG5cblx0XHRcdHAuYXBwZW5kQ2hpbGQoaWNvbik7XG5cblx0XHR9XG5cblx0XHRpZiAoc2V0dGluZ3MubG9ja2VkKSB7XG5cdFx0XHRQaWN0cmUuX3N0b3JhZ2Uub3ZlcmxheS5sb2NrZWQgPSB0cnVlO1xuXHRcdH1cblxuXHRcdGlmICh0eXBlb2YgdGhpcy5vbmNsaWNrID09ICdmdW5jdGlvbicpIHtcblxuXHRcdFx0aWYgKHNldHRpbmdzLmRyb3B6b25lKSB7XG5cblx0XHRcdFx0UGljdHJlLmV4dGVuZChhcmVhKS5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRzZWxmLm9uY2xpY2soKTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdH0gZWxzZSB7XG5cblx0XHRcdFx0UGljdHJlLmV4dGVuZCh0aGlzLmRvbUVsZW1lbnQpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHNlbGYub25jbGljaygpO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0fVxuXG5cdFx0fVxuXHR9LFxuXG5cdG9uY2xpY2s6IG51bGwsXG5cblx0cG9zaXRpb246IGZ1bmN0aW9uKCkge1xuXHRcdGlmICh0aGlzLmRvbUVsZW1lbnQpIHtcblx0XHRcdHRoaXMuZG9tRWxlbWVudC5zdHlsZS5sZWZ0ID0gTWF0aC5tYXgoJCh3aW5kb3cpLndpZHRoKCkgLyAyIC0gKHRoaXMuZG9tRWxlbWVudC5jbGllbnRXaWR0aCAvIDIpLCAwKSArIFwicHhcIjtcblx0XHRcdHRoaXMuZG9tRWxlbWVudC5zdHlsZS50b3AgPSBNYXRoLm1heCgoJCh3aW5kb3cpLmhlaWdodCgpIC8gMiAtICh0aGlzLmRvbUVsZW1lbnQuY2xpZW50SGVpZ2h0IC8gMikpLCAwKSArIFwicHhcIjtcblx0XHR9XG5cdH0sXG5cblx0cmVtb3ZlOiBmdW5jdGlvbigpIHtcblx0XHRQaWN0cmUuZ2FsbGVyeS5pcy53YXJuaW5nID0gZmFsc2U7XG5cdFx0UGljdHJlLmdhbGxlcnkub3ZlcmxheS5leGl0KCk7XG5cdFx0dGhpcy5kb21FbGVtZW50LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5kb21FbGVtZW50KTtcblx0XHR0aGlzLmRvbUVsZW1lbnQgPSBudWxsO1xuXHR9XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBXYXJuaW5nSW50ZXJmYWNlOyIsIi8qKlxuICogTW9kdWxlIGZvciBoYW5kbGluZyBzZXJ2ZXIgcmVxdWV0c1xuICovXG5cbnZhciBFbnZpcm9ubWVudCA9IHJlcXVpcmUoJy4vZW52aXJvbm1lbnQuanMnKTtcbnZhciBTZXJ2ZXIgPSB7fTtcblxuU2VydmVyLmNvbXBvbmVudHMgPSB7XG5cdGFuY2hvcjogMCxcblx0aGVhZDogRW52aXJvbm1lbnQuaXRlbUFtb3VudFBhZ2VMb2FkXG59XG5cbi8vIC9hcGkvYWxidW0vPGFsYnVtbmFtZT4vZnJvbTwwPi90b2xpbWl0PDEwMD5cblNlcnZlci5nZXQgPSBmdW5jdGlvbihlbmRwb2ludCwgY2FsbGJhY2spIHtcblx0dmFyIHJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblx0cmVxdWVzdC5vcGVuKCdHRVQnLCBlbmRwb2ludCwgdHJ1ZSk7XG5cblx0aWYgKHdpbmRvdy5YRG9tYWluUmVxdWVzdCkge1xuXHRcdHZhciB4ZHIgPSBuZXcgWERvbWFpblJlcXVlc3QoKTtcblx0XHR4ZHIub3BlbihcImdldFwiLCBlbmRwb2ludCk7XG5cdFx0eGRyLnNlbmQobnVsbCk7XG5cdFx0eGRyLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0Y2FsbGJhY2suY2FsbCh4ZHIsIG51bGwsIHhkci5yZXNwb25zZVRleHQpO1xuXHRcdH07XG5cdFx0eGRyLm9uZXJyb3IgPSBmdW5jdGlvbihlcnJvcikge1xuXHRcdFx0Y2FsbGJhY2suY2FsbCh4ZHIsIGVycm9yLCBudWxsKTtcblx0XHR9O1xuXHR9IGVsc2Uge1xuXHRcdCQuc3VwcG9ydC5jb3JzID0gdHJ1ZTtcblx0XHQkLmFqYXgoe1xuXHRcdFx0dHlwZTogJ0dFVCcsXG5cdFx0XHR1cmw6IGVuZHBvaW50LFxuXHRcdFx0YXN5bmM6IHRydWUsXG5cdFx0XHRjcm9zc0RvbWFpbjogdHJ1ZSxcblx0XHRcdHN1Y2Nlc3M6IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdFx0Y2FsbGJhY2suY2FsbCh0aGlzLCBudWxsLCBkYXRhKTtcblx0XHRcdH0sXG5cdFx0XHRlcnJvcjogZnVuY3Rpb24oZXJyb3IpIHtcblx0XHRcdFx0Y2FsbGJhY2suY2FsbCh0aGlzLCBlcnJvciwgbnVsbCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cbn07XG5cbi8vIHJldHJpZXZlcyBhbGJ1bSBpbWFnZXMgc3RhcnRpbmcgYXQgc3BlY2lmaWMgaW5kZXhcblNlcnZlci5nZXRBbGJ1bUF0QW5jaG9yID0gZnVuY3Rpb24oYWxidW1OYW1lLCBmcm9tLCB0bywgY2FsbGJhY2spIHtcblx0U2VydmVyLmdldCgnL2FwaS9hbGJ1bS8nICsgYWxidW1OYW1lICsgJy8nICsgZnJvbSArICcvJyArIHRvLCBmdW5jdGlvbihlcnIsIHJlc3BvbnNlKSB7XG5cdFx0aWYgKGVycikge1xuXHRcdFx0cmV0dXJuIGNhbGxiYWNrLmNhbGwoU2VydmVyLCBlcnIsIG51bGwpO1xuXHRcdH1cblxuXHRcdHRyeSB7XG5cdFx0XHRjYWxsYmFjay5jYWxsKFNlcnZlciwgbnVsbCwgcmVzcG9uc2UpO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGNhbGxiYWNrLmNhbGwoU2VydmVyLCBlLCBudWxsKTtcblx0XHR9XG5cdH0pO1xufTtcblxuU2VydmVyLmdldEFsYnVtID0gZnVuY3Rpb24oYWxidW1OYW1lLCBjYWxsYmFjaykge1xuXHRTZXJ2ZXIuZ2V0QWxidW1BdEFuY2hvcihhbGJ1bU5hbWUsIFNlcnZlci5jb21wb25lbnRzLmFuY2hvciwgU2VydmVyLmNvbXBvbmVudHMuaGVhZCwgY2FsbGJhY2spO1xufTtcblxuU2VydmVyLnNldFJlcXVlc3RBbmNob3IgPSBmdW5jdGlvbihkYXRhKSB7XG5cdFNlcnZlci5jb21wb25lbnRzLmFuY2hvciA9IGRhdGE7XG59O1xuXG5TZXJ2ZXIuc2V0UmVxdWVzdEhlYWQgPSBmdW5jdGlvbihkYXRhKSB7XG5cdFNlcnZlci5jb21wb25lbnRzLmhlYWQgPSBkYXRhO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFNlcnZlcjsiLCIvKipcbiAqIEhlbHBlciBmdW5jdGlvbnNcbiAqL1xuXG52YXIgVXRpbGl0aWVzID0ge307XG5cblV0aWxpdGllcy5leHRlbmQgPSBmdW5jdGlvbihkb21PYmplY3QpIHtcblxuXHRyZXR1cm4ge1xuXHRcdG9uOiBmdW5jdGlvbih0eXBlLCBjYWxsYmFjaykge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0ZG9tT2JqZWN0LmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgZnVuY3Rpb24oZSkge1xuXHRcdFx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2suY2FsbChkb21PYmplY3QsIGUpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0ZG9tT2JqZWN0LmF0dGFjaEV2ZW50KCdvbicgKyB0eXBlLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRcdFx0aWYgKHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nKSBjYWxsYmFjay5jYWxsKGRvbU9iamVjdCwgZSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH1cblx0fTtcblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFV0aWxpdGllczsiXX0=
