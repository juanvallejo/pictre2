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
			return console.log('SERVER ALBUM REQUEST', err);
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
		nodes.rootNode.style.width = (columnCount * (itemWidth + (itemMargin))) + "px";

		if (offset) {
			// var x = a + 1;
			// for (var i = x; i < x + Pictre._settings.data.limit.request; i++) {
			// 	var top = parseInt(this._storage.pictures[i - columnCount].style.top.split("px")[0]) + this._storage.pictures[i - columnCount].offsetHeight + itemMargin;
			// 	this._storage.pictures[i].style.left = this._storage.pictures[i - columnCount].style.left;
			// 	this._storage.pictures[i].style.top = top + "px";
			// }
		} else {
			for (var i = 0; i < Board.getSize(); i++) {
				Board.pictures[i].style.clear = 'none';
				Board.pictures[i].style.first = false;
				Board.pictures[i].style.top = '0';
				Board.pictures[i].style.left = '0';
			}
			for (var i = 0; i < Board.getSize(); i += columnCount) {
				Board.pictures[i].first = true;
			}
			for (var i = 0; i < Board.getSize(); i++) {
				var picture = Board.pictures[i];
				var prevPicture = Board.pictures[i - 1];
				if (!picture.first) {
					picture.style.left = (parseInt(prevPicture.style.left.split("px")[0]) + prevPicture.offsetWidth + itemMargin) + "px";
				}
			}
			for (var i = 0; i < Board.getSize(); i++) {
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvbWFpbi5qcyIsInNyYy9jbGllbnQuanMiLCJzcmMvZW52aXJvbm1lbnQuanMiLCJzcmMvZXZlbnRzLmpzIiwic3JjL2ludGVyZmFjZS5qcyIsInNyYy9pbnRlcmZhY2VzL2JvYXJkLmpzIiwic3JjL2ludGVyZmFjZXMvY29udHJvbGxlci5qcyIsInNyYy9pbnRlcmZhY2VzL2dhbGxlcnkuanMiLCJzcmMvaW50ZXJmYWNlcy9pbmRleC5qcyIsInNyYy9pbnRlcmZhY2VzL21lbnUuanMiLCJzcmMvaW50ZXJmYWNlcy9tb2RhbC5qcyIsInNyYy9pbnRlcmZhY2VzL292ZXJsYXkuanMiLCJzcmMvaW50ZXJmYWNlcy9zcGxhc2guanMiLCJzcmMvaW50ZXJmYWNlcy93YXJuaW5nLmpzIiwic3JjL3NlcnZlci5qcyIsInNyYy91dGlsaXRpZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxYUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogUGljdHJlIGNsaWVudCBjb3JlLiBVc2VzIGJyb3dzZXJpZnkgdG8gbWFpbnRhaW5cbiAqIE5vZGUtbGlrZSBtb2R1bGFyIHN0cnVjdHVyZS4gRG8gJ25wbSBpbnN0YWxsJyBpbiBvcmRlclxuICogdG8gb2J0YWluIGFsbCByZXF1aXJlZCBkZXYgcGFja2FnZXMuIEJ1aWxkIHN5c3RlbSBpcyAnZ3VscCcuXG4gKiBCdWlsZHMgdG8gJy9kaXN0L1BpY3RyZS5qcycuXG4gKlxuICogQGF1dGhvciBqdWFudmFsbGVqb1xuICogQGRhdGUgNS8zMS8xNVxuICovXG5cbnZhciBDbGllbnQgPSByZXF1aXJlKCcuL2NsaWVudC5qcycpO1xudmFyIEVudmlyb25tZW50ID0gcmVxdWlyZSgnLi9lbnZpcm9ubWVudC5qcycpO1xudmFyIEludGVyZmFjZXMgPSByZXF1aXJlKCcuL2ludGVyZmFjZS5qcycpO1xudmFyIEV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzLmpzJyk7XG52YXIgU2VydmVyID0gcmVxdWlyZSgnLi9zZXJ2ZXIuanMnKTtcblxudmFyIFBpY3RyZSA9IHt9O1xuXG4vKipcbiAqIEluaXRpYWxpemVzIGFwcGxpY2F0aW9uIHZhcmlhYmxlcyBhbmQgZGVmYXVsdCBzZXR0aW5ncy5cbiAqXG4gKiBAcGFyYW0gYXBwbGljYXRpb25XcmFwcGVyIFx0W1N0cmluZ10gZG9tIGVsZW1lbnQgaWQgb2YgYXBwbGljYXRpb24gY29udGFpbmVyXG4gKiBAcGFyYW0gcmVzb3VyY2VMb2NhdGlvbiBcdFx0W1N0cmluZ10gdXJsIG9mIGNsb3VkIGRpcmVjdG9yeSBjb250YWluaW5nIGFsbCBpbWFnZXNcbiAqIEBwYXJhbSBhcHBEYXRhTG9jYXRpb24gXHRcdFtTdHJpbmddIHVybCBvZiBjbG91ZCBkaXJlY3RvcnkgY29udGFpbmluZyBhcHBsaWNhdGlvbiBmaWxlc1xuICovXG5QaWN0cmUuaW5pdCA9IGZ1bmN0aW9uKG1haW5XaW5kb3csIGFwcGxpY2F0aW9uV3JhcHBlciwgcmVzb3VyY2VMb2NhdGlvbiwgYXBwRGF0YUxvY2F0aW9uLCBkZXZlbG9wZXJNb2RlKSB7XG5cdHZhciBzcGFjZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuXHRzcGFjZXIuY2xhc3NOYW1lID0gXCJQaWN0cmUtc3BhY2VyXCI7XG5cblx0aWYgKHJlc291cmNlTG9jYXRpb24pIHtcblx0XHRFbnZpcm9ubWVudC5jbG91ZC5kYXRhZGlyID0gcmVzb3VyY2VMb2NhdGlvbjtcblx0fVxuXHRpZiAoYXBwRGF0YUxvY2F0aW9uKSB7XG5cdFx0RW52aXJvbm1lbnQuY2xvdWQuYWRkcmVzcyA9IGFwcERhdGFMb2NhdGlvbjtcblx0fVxuXHRpZiAoIWRldmVsb3Blck1vZGUpIHtcblx0XHRFbnZpcm9ubWVudC5pblByb2R1Y3Rpb24gPSB0cnVlO1xuXHR9XG5cblx0Ly8gY3JlYXRlIGFuZCBwbGFjZSBtZW51IGJlZm9yZSBhcHBsaWNhdGlvbiB3cmFwcGVyXG5cdEludGVyZmFjZXMubWVudS5wdXQobWFpbldpbmRvdy5kb2N1bWVudC5ib2R5LCBhcHBsaWNhdGlvbldyYXBwZXIpO1xuXG5cdC8vIGRldGVjdCBjbGllbnQgc2V0dGluZ3Ncblx0Q2xpZW50LmluaXQoKTtcblxuXHRpZiAoSW50ZXJmYWNlcy5ib2FyZC5pc1NldCgpKSB7XG5cdFx0dmFyIGJvYXJkTmFtZSA9IEludGVyZmFjZXMuYm9hcmQuZ2V0TmFtZSgpO1xuXHRcdGlmIChJbnRlcmZhY2VzLmJvYXJkLmlzTmFtZVJlc3RyaWN0ZWQoYm9hcmROYW1lKSB8fCBJbnRlcmZhY2VzLmJvYXJkLmlzTmFtZUludmFsaWQoYm9hcmROYW1lKSkge1xuXHRcdFx0SW50ZXJmYWNlcy5zcGxhc2guc2hvdyhJbnRlcmZhY2VzLCBFdmVudHMsIENsaWVudCwgbWFpbldpbmRvdywgbWFpbldpbmRvdy5kb2N1bWVudC5ib2R5KTtcblx0XHRcdGlmIChJbnRlcmZhY2VzLmJvYXJkLmlzTmFtZVJlc3RyaWN0ZWQoYm9hcmROYW1lKSkge1xuXHRcdFx0XHRJbnRlcmZhY2VzLnNwbGFzaC5zaG93QWxlcnQoSW50ZXJmYWNlcywgJ1RoYXQgYWxidW0gaXMgcmVzdHJpY3RlZCwgcGxlYXNlIHRyeSBhbm90aGVyLicpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0SW50ZXJmYWNlcy5zcGxhc2guc2hvd0FsZXJ0KEludGVyZmFjZXMsICdZb3VyIGFsYnVtIGNvbnRhaW5zIGludmFsaWQgY2hhcmFjdGVycy4nKTtcblx0XHRcdH1cblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRJbnRlcmZhY2VzLmJvYXJkLnNob3coSW50ZXJmYWNlcywgRXZlbnRzLCBTZXJ2ZXIsIG1haW5XaW5kb3csIGFwcGxpY2F0aW9uV3JhcHBlcik7XG5cdFx0SW50ZXJmYWNlcy5ib2FyZC5zaG93QWxlcnQoJ0xvYWRpbmcsIHBsZWFzZSB3YWl0Li4uJyk7XG5cblx0XHQvLyB9IGVsc2Uge1xuXHRcdC8vIFx0UGljdHJlLmJvYXJkLmV4aXN0cyA9IHRydWU7XG5cdFx0Ly8gXHR2YXIgd3JhcHBlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG5cdFx0Ly8gXHR3cmFwcGVyLmlkID0gXCJQaWN0cmUtd3JhcHBlclwiO1xuXHRcdC8vIFx0YXBwbGljYXRpb25XcmFwcGVyLmFwcGVuZENoaWxkKHdyYXBwZXIpO1xuXHRcdC8vIFx0dGhpcy5zZXQud3JhcHBlcih3cmFwcGVyKTtcblx0XHQvLyBcdFBpY3RyZS5nZXQudWkubm90aWNlKFwiTG9hZGluZywgcGxlYXNlIHdhaXQuLi5cIik7XG5cdFx0Ly8gXHRQaWN0cmUuZ2V0LmRiKHtcblx0XHQvLyBcdFx0YWxidW06IHRydWUsXG5cdFx0Ly8gXHRcdHJlc291cmNlOiAnYWxidW0nLFxuXHRcdC8vIFx0XHRsaW1pdDogUGljdHJlLl9zZXR0aW5ncy5kYXRhLmxpbWl0LnBhZ2Vsb2FkXG5cdFx0Ly8gXHR9LCBmdW5jdGlvbihkYXRhKSB7XG5cblx0XHQvLyBcdFx0Ly8gZGV0ZWN0ICdsb2FkaW5nIGJhcicgZGVtb1xuXHRcdC8vIFx0XHRpZiAoUGljdHJlLl9zZXR0aW5ncy5kZW1vLmxvYWRlcikge1xuXG5cdFx0Ly8gXHRcdFx0Y29uc29sZS5sb2coXCJXYXJuaW5nOiBsb2FkZXIgZGVtbyBhY3RpdmUuXCIpO1xuXG5cdFx0Ly8gXHRcdFx0KGZ1bmN0aW9uIGRlbW8obiwgdCkge1xuXHRcdC8vIFx0XHRcdFx0aWYgKHQpIGNsZWFyVGltZW91dCh0KTtcblx0XHQvLyBcdFx0XHRcdHQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdC8vIFx0XHRcdFx0XHRQaWN0cmUuZ2V0LnVpLmxvYWRlci5wdXQobik7XG5cdFx0Ly8gXHRcdFx0XHRcdG4gKz0gMC4wMDI7XG5cdFx0Ly8gXHRcdFx0XHRcdGlmIChuID49IDAuOTk1KSBuID0gMDtcblx0XHQvLyBcdFx0XHRcdFx0ZGVtbyhuLCB0KTtcblx0XHQvLyBcdFx0XHRcdH0sIDEwMDAgLyA2MCk7XG5cdFx0Ly8gXHRcdFx0fSkoMCk7XG5cblx0XHQvLyBcdFx0fSBlbHNlIHtcblx0XHQvLyBcdFx0XHRQaWN0cmUubG9hZChkYXRhKTtcblx0XHQvLyBcdFx0fVxuXG5cdFx0Ly8gXHR9KTtcblxuXHRcdC8vIFx0UGljdHJlLmV2ZW50cy5vbignZHJhZ292ZXInLCBmdW5jdGlvbigpIHtcblx0XHQvLyBcdFx0aWYgKCFQaWN0cmUuZ2FsbGVyeS5pcy5mZWF0dXJpbmcgJiYgIVBpY3RyZS5pcy5zcG90bGlnaHQgJiYgUGljdHJlLl9zZXR0aW5ncy5hbGxvd1VwbG9hZHMpIFBpY3RyZS5nZXQudWkudXBsb2FkLnB1dCgpO1xuXHRcdC8vIFx0fSk7XG5cblx0XHQvLyBcdFBpY3RyZS5ldmVudHMub24oJ2hhc2hjaGFuZ2UnLCBmdW5jdGlvbigpIHtcblx0XHQvLyBcdFx0UGljdHJlLmdldC5oYXNoKCk7XG5cdFx0Ly8gXHR9KTtcblx0XHQvLyB9XG5cdH0gZWxzZSB7XG5cdFx0Ly8gc2hvdyBtYWluIHZpZXdcblx0XHRJbnRlcmZhY2VzLnNwbGFzaC5zaG93KEludGVyZmFjZXMsIEV2ZW50cywgQ2xpZW50LCBtYWluV2luZG93LCBtYWluV2luZG93LmRvY3VtZW50LmJvZHkpO1xuXHRcdGlmIChFbnZpcm9ubWVudC5pc1VwZGF0aW5nKSB7XG5cdFx0XHRJbnRlcmZhY2VzLnNwbGFzaC5zaG93QWxlcnQoSW50ZXJmYWNlcywgJ1VwZGF0ZXMgYXJlIGN1cnJlbnRseSBpbiBwcm9ncmVzcy4uLicpO1xuXHRcdH1cblx0fVxufVxuXG53aW5kb3cuUGljdHJlID0gUGljdHJlOyIsIi8qKlxuICogQ2xpZW50IG1hbmFnZXIgZm9yIGFwcGxpY2F0aW9uIHJ1bnRpbWUuIFByb3ZpZGVzIHV0aWxpdGllcyBhbmRcbiAqIGF3YXJlbmVzcyBvZiBicm93c2VyIGluZm9ybWF0aW9uIC8gY29tcGF0aWJpbGl0eS5cbiAqXG4gKiBAYXV0aG9yIGp1YW52YWxsZWpvXG4gKiBAZGF0ZSA2LzEvMTVcbiAqL1xuXG52YXIgSW50ZXJmYWNlID0gcmVxdWlyZSgnLi9pbnRlcmZhY2UuanMnKTtcblxudmFyIENsaWVudCA9IHt9O1xuXG4vLyBob2xkcyBicm93c2VyIG5hbWVzXG5DbGllbnQuYnJvd3NlciA9IHtcblxuXHRVTktOT1dOOiAwLFxuXHRDSFJPTUU6IDEsXG5cdFNBRkFSSTogMixcblx0TU9CSUxFX1NBRkFSSTogMyxcblx0RklSRUZPWDogNCxcblx0T1BFUkE6IDUsXG5cdElFX01PREVSTjogNixcblx0SUVfVU5TVVBQT1JURUQ6IDcsXG5cdElFX09USEVSOiA4XG5cbn07XG5cbi8qKlxuICogZmxhZyBpbmRpY2F0aW5nIGlmIHVzaW5nIGNvbXBhdGlibGUgYnJvd3NlclxuICovXG5DbGllbnQuY29tcGF0aWJsZSA9IHRydWU7XG5DbGllbnQuaWQgPSBDbGllbnQuYnJvd3Nlci5VTktOT1dOXG5DbGllbnQubmFtZSA9ICdVbmtub3duJztcbkNsaWVudC52ZXJzaW9uID0gMDtcblxuQ2xpZW50Lm9zID0gbmF2aWdhdG9yLnBsYXRmb3JtO1xuQ2xpZW50Lm9ubGluZSA9IG5hdmlnYXRvci5vbkxpbmU7XG5cbkNsaWVudC5nZXRJZCA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gQ2xpZW50LmlkO1xufTtcblxuQ2xpZW50LmlzSUUgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIENsaWVudC5pZCA9PSBDbGllbnQuYnJvd3Nlci5JRV9NT0RFUk4gfHwgQ2xpZW50LmlkID09IENsaWVudC5icm93c2VyLklFX1VOU1VQUE9SVEVEIHx8IENsaWVudC5pZCA9PSBDbGllbnQuYnJvd3Nlci5JRV9PVEhFUjtcbn07XG5cbkNsaWVudC5pc01vYmlsZVNhZmFyaSA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gQ2xpZW50LmlkID09IENsaWVudC5icm93c2VyLk1PQklMRV9TQUZBUkk7XG59O1xuXG5DbGllbnQuaXNTYWZhcmkgPSBmdW5jdGlvbih2ZXJzaW9uKSB7XG5cdGlmICh2ZXJzaW9uKSB7XG5cdFx0cmV0dXJuIENsaWVudC5pZCA9PSBDbGllbnQuYnJvd3Nlci5TQUZBUkkgJiYgQ2xpZW50LnZlcnNpb24uc3BsaXQoJycpLmluZGV4T2YodmVyc2lvbikgIT0gLTE7XG5cdH1cblx0cmV0dXJuIENsaWVudC5pZCA9PSBDbGllbnQuYnJvd3Nlci5TQUZBUkk7XG59O1xuXG4vKipcbiAqIENvbGxlY3RzIGluZm9ybWF0aW9uIGFib3V0IGJyb3dzZXIgdmVyc2lvbixcbiAqIGNvbXBhdGliaWxpdHksIG5hbWUsIGFuZCBkaXNwbGF5IGluZm9ybWF0aW9uXG4gKiBiYXNlZCBvbiB1c2VyIGFnZW50IHN0cmluZy5cbiAqL1xuQ2xpZW50LmluaXQgPSBmdW5jdGlvbigpIHtcblxuXHRpZiAobmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKFwiQXBwbGVXZWJLaXRcIikgIT0gLTEpIHtcblxuXHRcdGlmIChuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoXCJDaHJvbWVcIikgIT0gLTEpIHtcblx0XHRcdENsaWVudC5uYW1lID0gXCJDaHJvbWVcIjtcblx0XHRcdENsaWVudC5pZCA9IENsaWVudC5icm93c2VyLkNIUk9NRTtcblx0XHR9IGVsc2Uge1xuXG5cdFx0XHRpZiAobmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKFwiTW9iaWxlXCIpICE9IC0xKSB7XG5cdFx0XHRcdENsaWVudC5uYW1lID0gXCJNb2JpbGUgU2FmYXJpXCI7XG5cdFx0XHRcdENsaWVudC5pZCA9IENsaWVudC5icm93c2VyLk1PQklMRV9TQUZBUkk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRDbGllbnQubmFtZSA9IFwiU2FmYXJpXCI7XG5cdFx0XHRcdENsaWVudC5pZCA9IENsaWVudC5icm93c2VyLlNBRkFSSTtcblxuXHRcdFx0XHR2YXIgdmVyc2lvbiA9IG5hdmlnYXRvci51c2VyQWdlbnQuc3BsaXQoXCJWZXJzaW9uL1wiKTtcblx0XHRcdFx0Q2xpZW50LnZlcnNpb24gPSB2ZXJzaW9uWzFdLnNwbGl0KFwiIFwiKVswXTtcblx0XHRcdH1cblxuXHRcdH1cblxuXHR9IGVsc2Uge1xuXG5cdFx0aWYgKG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZihcIkZpcmVmb3hcIikgIT0gLTEpIHtcblx0XHRcdENsaWVudC5uYW1lID0gXCJGaXJlZm94XCI7XG5cdFx0XHRDbGllbnQuaWQgPSBDbGllbnQuYnJvd3Nlci5GSVJFRk9YO1xuXHRcdH0gZWxzZSBpZiAobmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKFwiT3BlcmFcIikgIT0gLTEpIHtcblx0XHRcdENsaWVudC5uYW1lID0gXCJPcGVyYVwiO1xuXHRcdFx0Q2xpZW50LmlkID0gQ2xpZW50LmJyb3dzZXIuT1BFUkE7XG5cdFx0fSBlbHNlIGlmIChuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoXCJNU0lFIFwiKSAhPSAtMSkge1xuXG5cdFx0XHRpZiAobmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKFwiVHJpZGVudFwiKSAhPSAtMSkge1xuXG5cdFx0XHRcdHZhciB2ZXJzaW9uID0gbmF2aWdhdG9yLnVzZXJBZ2VudC5zcGxpdChcIjtcIilbMV07XG5cdFx0XHRcdHZlcnNpb24gPSBwYXJzZUludCh2ZXJzaW9uLnNwbGl0KFwiIFwiKVsyXSk7XG5cblx0XHRcdFx0Q2xpZW50Lm5hbWUgPSBcIkludGVybmV0IEV4cGxvcmVyXCI7XG5cdFx0XHRcdENsaWVudC52ZXJzaW9uID0gdmVyc2lvbjtcblxuXHRcdFx0XHRpZiAodmVyc2lvbiA+IDgpIHtcblx0XHRcdFx0XHRDbGllbnQuaWQgPSBDbGllbnQuYnJvd3Nlci5JRV9NT0RFUk47XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Q2xpZW50LmlkID0gQ2xpZW50LmJyb3dzZXIuSUVfVU5TVVBQT1JURUQ7XG5cdFx0XHRcdH1cblxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Q2xpZW50Lm5hbWUgPSBcIkludGVybmV0IEV4cGxvcmVyXCI7XG5cdFx0XHRcdENsaWVudC5pZCA9IENsaWVudC5icm93c2VyLklFX09USEVSO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRDbGllbnQubmFtZSA9ICdPdGhlcic7XG5cdFx0XHRDbGllbnQuaWQgPSBDbGllbnQuYnJvd3Nlci5VTktOT1dOO1xuXHRcdH1cblxuXHR9XG5cblx0Ly8gRGV0ZWN0IGlmIHVzaW5nIGhvcGVsZXNzIGJyb3dzZXJcblx0aWYgKENsaWVudC5pZCA9PSBDbGllbnQuYnJvd3Nlci5JRV9VTlNVUFBPUlRFRCB8fCBDbGllbnQuaWQgPT0gQ2xpZW50LmJyb3dzZXIuSUVfT1RIRVIpIHtcblxuXHRcdHZhciB3YXJuaW5nO1xuXHRcdHZhciBsb2NrID0gZmFsc2U7XG5cdFx0dmFyIGhlYWRlciA9ICdTb3JyeSBhYm91dCB0aGF0ISc7XG5cblx0XHRpZiAoQ2xpZW50LmlkID09IENsaWVudC5icm93c2VyLklFX09USEVSKSB7XG5cblx0XHRcdHdhcm5pbmcgPSBcIlVuZm9ydHVuYXRlbHkgUGljdHJlIGlzIG5vdCBzdXBwb3J0ZWQgaW4geW91ciBicm93c2VyLCBwbGVhc2UgY29uc2lkZXIgdXBncmFkaW5nIHRvIEdvb2dsZSBDaHJvbWUsIGJ5IGNsaWNraW5nIGhlcmUsIGZvciBhbiBvcHRpbWFsIGJyb3dzaW5nIGV4cGVyaWVuY2UuXCI7XG5cdFx0XHRsb2NrID0gdHJ1ZTtcblxuXHRcdFx0SW50ZXJmYWNlLndhcm5pbmcub25jbGljayA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR3aW5kb3cub3BlbihcImh0dHA6Ly9jaHJvbWUuZ29vZ2xlLmNvbVwiLCBcIl9ibGFua1wiKTtcblx0XHRcdH07XG5cblx0XHR9IGVsc2Uge1xuXG5cdFx0XHRoZWFkZXIgPSAnTm90aWNlISc7XG5cdFx0XHR3YXJuaW5nID0gXCJTb21lIG9mIFBpY3RyZSdzIGZlYXR1cmVzIG1heSBub3QgYmUgZnVsbHkgc3VwcG9ydGVkIGluIHlvdXIgYnJvd3Nlci5cIjtcblxuXHRcdFx0SW50ZXJmYWNlLndhcm5pbmcub25jbGljayA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR0aGlzLnJlbW92ZSgpO1xuXHRcdFx0fTtcblxuXHRcdH1cblxuXHRcdENsaWVudC5jb21wYXRpYmxlID0gZmFsc2U7XG5cblx0XHRJbnRlcmZhY2Uud2FybmluZy5wdXQoe1xuXG5cdFx0XHRoZWFkZXI6IGhlYWRlcixcblx0XHRcdGJvZHk6IHdhcm5pbmcsXG5cdFx0XHRsb2NrZWQ6IGxvY2tcblxuXHRcdH0pO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQ2xpZW50OyIsIi8qKlxuICogQXBwbGljYXRpb24gZW52aXJvbm1lbnQgZHVyaW5nIHJ1bnRpbWUuIFN0b3JlcyBkeW5hbWljXG4gKiBnbG9iYWwgdmFsdWVzIGZvciBhcHBsaWNhdGlvbiBtb2R1bGUgc3VwcG9ydC5cbiAqXG4gKiBAYXV0aG9yIGp1YW52YWxsZWpvXG4gKiBAZGF0ZSA1LzMxLzE1XG4gKi9cblxudmFyIEVudmlyb25tZW50ID0ge307XG5cbkVudmlyb25tZW50LmNsb3VkID0ge1xuXHRkYXRhZGlyOiAnJyxcblx0YWRkcmVzczogJydcbn1cblxuRW52aXJvbm1lbnQuYXBwID0ge1xuXHR0aXRsZTogJ1BpY3RyZSdcbn1cblxuRW52aXJvbm1lbnQuZXZlbnRzID0ge307XG5cbkVudmlyb25tZW50LmluUHJvZHVjdGlvbiA9IGZhbHNlO1xuRW52aXJvbm1lbnQuaXNVcGRhdGluZyA9IGZhbHNlO1xuXG5FbnZpcm9ubWVudC5hbmltYXRpb25TcGVlZCA9IDEwMDA7XG5FbnZpcm9ubWVudC5tYXhJbWFnZVdpZHRoID0gODAwO1xuRW52aXJvbm1lbnQubWF4SW1hZ2VIZWlnaHQgPSAxMzc7XG5FbnZpcm9ubWVudC5hbGVydER1cmF0aW9uID0gMTAwMDA7XG5cbkVudmlyb25tZW50LmJhc2VBUElVcmwgPSAnaHR0cDovL3N0YXRpYy1waWN0cmUucmhjbG91ZC5jb20vJztcblxuLy8gbG9hZCB4IGl0ZW1zIG9uIHBhZ2UgbG9hZFxuRW52aXJvbm1lbnQuaXRlbUFtb3VudFBhZ2VMb2FkID0gNTA7XG4vLyBsb2FkIHggaXRlbXMgcGVyIHN1YnNlcXVlbnQgcmVxdWVzdFxuRW52aXJvbm1lbnQuaXRlbUFtb3VudFJlcXVlc3QgPSAyNTtcblxubW9kdWxlLmV4cG9ydHMgPSBFbnZpcm9ubWVudDsiLCIvKipcbiAqIEFwcGxpY2F0aW9uIGV2ZW50cyBjb250cm9sbGVyXG4gKi9cblxudmFyIEV2ZW50cyA9IHt9O1xudmFyIHJlZ2lzdGVyZWRHbG9iYWxFdmVudHMgPSB7fTtcbnZhciByZWdpc3RlcmVkTm9kZUV2ZW50cyA9IHt9O1xuXG4vKipcbiAqIExpc3RlbnMgZm9yIGEgZG9tIGV2ZW50XG4gKi9cbkV2ZW50cy5vbkNhY2hlZE5vZGVFdmVudCA9IGZ1bmN0aW9uKG5vZGUsIGV2ZW50TmFtZSwgY2FsbGJhY2spIHtcblx0aWYgKCFyZWdpc3RlcmVkTm9kZUV2ZW50c1tub2RlLm5vZGVOYW1lXSkge1xuXHRcdHJlZ2lzdGVyZWROb2RlRXZlbnRzW25vZGUubm9kZU5hbWVdID0ge307XG5cdH1cblxuXHRpZiAoIXJlZ2lzdGVyZWROb2RlRXZlbnRzW25vZGUubm9kZU5hbWVdW2V2ZW50TmFtZV0pIHtcblx0XHRyZWdpc3RlcmVkTm9kZUV2ZW50c1tub2RlLm5vZGVOYW1lXVtldmVudE5hbWVdID0gW107XG5cblx0XHRmdW5jdGlvbiBub2RlRXZlbnQoZSkge1xuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCByZWdpc3RlcmVkTm9kZUV2ZW50c1tub2RlLm5vZGVOYW1lXVtldmVudE5hbWVdLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGlmICh0eXBlb2YgcmVnaXN0ZXJlZE5vZGVFdmVudHNbbm9kZS5ub2RlTmFtZV1bZXZlbnROYW1lXVtpXSA9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0cmVnaXN0ZXJlZE5vZGVFdmVudHNbbm9kZS5ub2RlTmFtZV1bZXZlbnROYW1lXVtpXS5jYWxsKG5vZGUsIGUpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0dHJ5IHtcblx0XHRcdG5vZGUuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIG5vZGVFdmVudCk7XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0bm9kZS5hdHRhY2hFdmVudCgnb24nICsgZXZlbnROYW1lLCBub2RlRXZlbnQpO1xuXHRcdH1cblx0fVxuXG5cdHJlZ2lzdGVyZWROb2RlRXZlbnRzW25vZGUubm9kZU5hbWVdW2V2ZW50TmFtZV0ucHVzaChjYWxsYmFjayk7XG59O1xuXG5FdmVudHMub25Ob2RlRXZlbnQgPSBmdW5jdGlvbihub2RlLCBldmVudE5hbWUsIGNhbGxiYWNrKSB7XG5cdHRyeSB7XG5cdFx0bm9kZS5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgY2FsbGJhY2spO1xuXHR9IGNhdGNoIChlKSB7XG5cdFx0bm9kZS5hdHRhY2hFdmVudCgnb24nICsgZXZlbnROYW1lLCBjYWxsYmFjayk7XG5cdH1cbn07XG5cbi8vIGV4ZWN1dGVzIGV2ZW50IFwiY2FsbGJhY2tzXCIgb24gYSBub2RlIGV2ZW50IGFuZCBzdG9yZXMgdGhlbVxuLy8gZm9yIGZ1dHVyZSBjYXNlcyBvZiBzdWNoIGV2ZW50IGhhcHBlbmluZy5cbi8vIFdhcm5pbmc6IGV2ZW50IG9iamVjdCB3aWxsIG5vdCBiZSBpbnN0YW50bHkgYXZhaWxhYmxlIGZvclxuLy8gY2FsbGJhY2sgdG8gcmVjZWl2ZSBkdWUgdG8gY2FsbGJhY2sgYmVpbmcgY2FsbGVkXG4vLyBiZWZvcmUgYmVpbmcgcXVldWVkIHVwIGZvciBpdHMgY29ycmVzcG9uZGluZyBldmVudC5cbkV2ZW50cy5ub3dBbmRPbk5vZGVFdmVudCA9IGZ1bmN0aW9uKG5vZGUsIGV2ZW50TmFtZSwgY2FsbGJhY2spIHtcblx0Y2FsbGJhY2suY2FsbChub2RlLCBudWxsKTtcblx0RXZlbnRzLm9uTm9kZUV2ZW50KG5vZGUsIGV2ZW50TmFtZSwgY2FsbGJhY2spO1xufTtcblxuLyoqXG4gKiBUcmlnZ2VycyBkb20gZXZlbnRcbiAqL1xuRXZlbnRzLmVtaXROb2RlRXZlbnQgPSBmdW5jdGlvbigpIHtcblxufTtcblxuLyoqXG4gKiBSZWdpc3RlcnMgbmV3IGFwcCBldmVudCBhbmQgZmlyZXNcbiAqIHBhc3NlZCBjYWxsYmFjayB3aGVuIGVtaXR0ZWQgXG4gKi9cbkV2ZW50cy5yZWdpc3Rlckdsb2JhbEV2ZW50ID0gZnVuY3Rpb24oZXZlbnROYW1lLCBjYWxsYmFjaykge1xuXHRpZiAoIXRoaXMucmVnaXN0ZXJlZEdsb2JhbEV2ZW50c1tldmVudE5hbWVdKSB7XG5cdFx0dGhpcy5yZWdpc3RlcmVkR2xvYmFsRXZlbnRzW2V2ZW50TmFtZV0gPSBbXTtcblx0fVxuXG5cdHRoaXMucmVnaXN0ZXJlZEdsb2JhbEV2ZW50c1tldmVudE5hbWVdLnB1c2goY2FsbGJhY2spO1xufVxuXG4vKipcbiAqIFRyaWdnZXJzIHJlZ2lzdGVyZWQgYXBwIGV2ZW50c1xuICogYnkgY2FsbGluZyBjYWxsYmFja3MgYXNzaWduZWQgdG9cbiAqIHRoYXQgZXZlbnROYW1lXG4gKi9cbkV2ZW50cy5lbWl0UmVnaXN0ZXJlZEdsb2JhbEV2ZW50ID0gZnVuY3Rpb24oZXZlbnROYW1lLCBhcmdzKSB7XG5cdGlmICghcmVnaXN0ZXJlZEdsb2JhbEV2ZW50c1tldmVudE5hbWVdKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnJlZ2lzdGVyZWRHbG9iYWxFdmVudHNbZXZlbnROYW1lXS5sZW5ndGg7IGkrKykge1xuXHRcdHRoaXMucmVnaXN0ZXJlZEdsb2JhbEV2ZW50c1tldmVudE5hbWVdW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuXHR9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50czsiLCIvKipcbiAqIEFwcGxpY2F0aW9uIGludGVyZmFjZSBtYW5hZ2VyLiBFeHBvc2VzIGFsbCBpbnRlcmZhY2UgbW9kdWxlcyB0byBnbG9iYWwgc2NvcGUuXG4gKlxuICogQGF1dGhvciBqdWFudmFsbGVqb1xuICogQGRhdGUgNS8zMS8xNVxuICovXG5cbnZhciBJbnRlcmZhY2UgPSByZXF1aXJlKCcuL2ludGVyZmFjZXMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBJbnRlcmZhY2U7IiwiLyoqXG4gKiBCb2FyZCBpbnRlcmZhY2UgbW9kdWxlIC0gY29uc2lzdHMgb2YgYSBcIndyYXBwZXJcIiByb290IG5vZGUgYW5kIGEgXCJub3RpY2VcIiBhbGVydCBub2RlXG4gKi9cblxudmFyIEVudmlyb25tZW50ID0gcmVxdWlyZSgnLi4vZW52aXJvbm1lbnQuanMnKTtcblxuLy8gcHJpdmF0ZSBmaWVsZHMgYW5kIGZ1bmN0aW9uc1xudmFyIGlzU2V0ID0gZmFsc2U7XG52YXIgbm9kZXMgPSB7XG5cdC8vIHVzZWQgdG8gZGlzcGxheSBhbGVydHMgYW5kIGJvYXJkIGluZm9cblx0YWxlcnROb2RlOiBudWxsLFxuXHRhbGVydE5vZGVDb21wb25lbnRzOiB7XG5cdFx0Ym9keTogbnVsbCxcblx0XHRleHRyYTogbnVsbFxuXHR9LFxuXG5cdGxvYWRlck5vZGU6IG51bGwsXG5cblx0Ly8gaG9sZHMgbWFpbiBib2FyZCBjb21wb25lbnQgKGV4Y2x1c2l2ZSBvZiB0aGUgYWxlcnROb2RlKVxuXHRyb290Tm9kZTogbnVsbFxufTtcblxudmFyIGV2ZW50cyA9IHt9O1xuXG52YXIgbG9hZGVkSW1hZ2VDb3VudCA9IDA7XG52YXIgaXNMb2FkaW5nID0gZmFsc2U7XG52YXIgaXNMb2FkZWRJbWFnZXMgPSBmYWxzZTtcbnZhciBpc0NyZWF0ZWQgPSBmYWxzZTtcbnZhciBwYXJlbnROb2RlQ2FjaGUgPSB7fTtcbnZhciByZXN0cmljdGVkTmFtZXMgPSBbXG5cdCdkYXRhJyxcblx0J3Jlc3RyaWN0ZWQnLFxuXHQnNDA0Jyxcblx0J3VuZGVmaW5lZCdcbl07XG5cbnZhciBCb2FyZCA9IHt9O1xuXG5Cb2FyZC5hbGVydE5vZGVDb21wb25lbnRzID0ge1xuXHRib2R5OiAnVW50aXRsZWQnLFxuXHRleHRyYTogbnVsbFxufTtcblxuQm9hcmQuYWxidW1SZXF1ZXN0Q29tcG9uZW50cyA9IHtcblx0YW5jaG9yOiAwLFxuXHRoZWFkOiBFbnZpcm9ubWVudC5pdGVtQW1vdW50UGFnZUxvYWRcbn07XG5cbkJvYXJkLnBpY3R1cmVzID0gW107XG5cbkJvYXJkLmlzTmFtZVJlc3RyaWN0ZWQgPSBmdW5jdGlvbihuYW1lKSB7XG5cdHJldHVybiByZXN0cmljdGVkTmFtZXMuaW5kZXhPZihuYW1lLnRvTG93ZXJDYXNlKCkpICE9IC0xO1xufTtcblxuQm9hcmQuaXNOYW1lSW52YWxpZCA9IGZ1bmN0aW9uKG5hbWUpIHtcblx0cmV0dXJuIG5hbWUudG9Mb3dlckNhc2UoKS5tYXRjaCgvW15hLXowLTlcXC1cXC5cXCtcXF9cXCBdL2dpKTtcbn07XG5cbkJvYXJkLmlzTmFtZVdpdGhTcGFjZXMgPSBmdW5jdGlvbihuYW1lKSB7XG5cdHJldHVybiBuYW1lLm1hdGNoKC9bXFwgXS9nKTtcbn07XG5cbkJvYXJkLmlzU2V0ID0gZnVuY3Rpb24oKSB7XG5cdEJvYXJkLmRldGVjdCgpO1xuXHRyZXR1cm4gaXNTZXQ7XG59O1xuXG5Cb2FyZC5kZXRlY3QgPSBmdW5jdGlvbigpIHtcblxuXHRpZiAoIXdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZS5zcGxpdCgnLycpWzFdKSB7XG5cdFx0d2luZG93LmRvY3VtZW50LnRpdGxlID0gRW52aXJvbm1lbnQuYXBwLnRpdGxlO1xuXHRcdGlzU2V0ID0gZmFsc2U7XG5cdFx0cmV0dXJuIEJvYXJkO1xuXHR9XG5cblx0aXNTZXQgPSB0cnVlO1xuXHR3aW5kb3cuZG9jdW1lbnQudGl0bGUgPSAnUGljdHJlIC0gJyArIEJvYXJkLmdldE5hbWUoKTtcblxuXHRyZXR1cm4gQm9hcmQ7XG59XG5cbkJvYXJkLmdldE5hbWUgPSBmdW5jdGlvbigpIHtcblxuXHR2YXIgYm9hcmQ7XG5cblx0Ly8gY2FwaXRhbGl6ZSBuYW1lIG9mIGJvYXJkXG5cdGlmIChpc1NldCkge1xuXHRcdHZhciBuYW1lID0gd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lLnNwbGl0KFwiL1wiKVsxXS50b0xvd2VyQ2FzZSgpO1xuXHRcdHZhciBuYW1lQXJyYXkgPSBuYW1lLnNwbGl0KCcnKTtcblx0XHRuYW1lQXJyYXkuc3BsaWNlKDAsIDEpO1xuXG5cdFx0dmFyIG5hbWVGaXJzdENoYXIgPSBuYW1lLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpO1xuXHRcdGJvYXJkID0gbmFtZUZpcnN0Q2hhciArIG5hbWVBcnJheS5qb2luKCcnKTtcblx0fVxuXG5cdHJldHVybiBib2FyZDtcblxufVxuXG5Cb2FyZC5zZXRMb2FkZXIgPSBmdW5jdGlvbihyYXRpbykge1xuXHRpZiAoIW5vZGVzLmxvYWRlck5vZGUpIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRub2Rlcy5sb2FkZXJOb2RlLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuXHRpZiAobm9kZXMubG9hZGVyTm9kZS5jaGlsZHJlbikge1xuXHRcdG5vZGVzLmxvYWRlck5vZGUuY2hpbGRyZW5bMF0uc3R5bGUud2lkdGggPSBNYXRoLm1heChyYXRpbyAqIDEwMCwgMCkgKyAnJSc7XG5cdH1cbn07XG5cbkJvYXJkLnVuc2V0TG9hZGVyID0gZnVuY3Rpb24oKSB7XG5cdGlmICghbm9kZXMubG9hZGVyTm9kZSkge1xuXHRcdHJldHVybjtcblx0fVxuXHRub2Rlcy5sb2FkZXJOb2RlLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG59O1xuXG4vLyBsb2FkcyBhIHNpbmdsZSBhcGkgaW1hZ2UgaW50byB0aGUgYm9hcmRcbkJvYXJkLmxvYWRJbWFnZSA9IGZ1bmN0aW9uKEludGVyZmFjZXMsIEV2ZW50cywgbWFpbldpbmRvdywgb2JqZWN0LCBpbWFnZUxvYWRIYW5kbGVyKSB7XG5cdHZhciBwaWN0dXJlID0gSW50ZXJmYWNlcy5jb250cm9sbGVyLmNyZWF0ZURpdk5vZGUobWFpbldpbmRvdyk7XG5cdHBpY3R1cmUuY2xhc3NOYW1lID0gJ1BpY3RyZS1waWMnO1xuXHRwaWN0dXJlLmlkID0gJ3BpYycgKyBvYmplY3QuaWQ7XG5cdHBpY3R1cmUuZGF0YSA9IG9iamVjdDtcblxuXHR2YXIgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcblx0aW1hZ2Uuc3JjID0gRW52aXJvbm1lbnQuYmFzZUFQSVVybCArICcvJyArIG9iamVjdC50aHVtYjtcblxuXHRpZiAoIWlzTG9hZGVkSW1hZ2VzICYmIG5vZGVzLnJvb3ROb2RlLnN0eWxlLmRpc3BsYXkgIT0gJ25vbmUnKSB7XG5cdFx0bm9kZXMucm9vdE5vZGUuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblx0fVxuXG5cdEV2ZW50cy5vbk5vZGVFdmVudChpbWFnZSwgJ2xvYWQnLCBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gKGZ1bmN0aW9uKHBpY3R1cmUsIGltYWdlKSB7XG5cdFx0XHRpbWFnZUxvYWRIYW5kbGVyKHBpY3R1cmUsIGltYWdlKTtcblx0XHR9KShwaWN0dXJlLCBpbWFnZSk7XG5cdH0pO1xuXG5cdEV2ZW50cy5vbk5vZGVFdmVudChpbWFnZSwgJ2Vycm9yJywgZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGhlaWdodCA9IEVudmlyb25tZW50Lm1heEltYWdlSGVpZ2h0O1xuXHRcdHZhciBwYWRkaW5nVG9wID0gcGFyc2VJbnQobWFpbldpbmRvdy5nZXRDb21wdXRlZFN0eWxlKHBpY3R1cmUpLmdldFByb3BlcnR5VmFsdWUoJ3BhZGRpbmctdG9wJykuc3BsaXQoXCJweFwiKVswXSkgKyAxO1xuXHRcdHZhciBwYWRkaW5nQm90dG9tID0gcGFyc2VJbnQobWFpbldpbmRvdy5nZXRDb21wdXRlZFN0eWxlKHBpY3R1cmUpLmdldFByb3BlcnR5VmFsdWUoJ3BhZGRpbmctYm90dG9tJykuc3BsaXQoXCJweFwiKVswXSk7XG5cblx0XHR2YXIgZXJySW1nID0gbmV3IEltYWdlKCk7XG5cdFx0ZXJySW1nLnNyYyA9ICcvc3RhdGljL2kvUGljdHJlLTQwNC5wbmcnO1xuXG5cdFx0dGhpcy5pbm5lckhUTUwgPSAnJztcblx0XHR0aGlzLmRhdGEuc3JjID0gJy9zdGF0aWMvaS9QaWN0cmUtNDA0LmZ1bGwucG5nJztcblx0XHR0aGlzLnN0eWxlLmhlaWdodCA9IChoZWlnaHQgLSBwYWRkaW5nVG9wICsgcGFkZGluZ0JvdHRvbSAqIDIpICsgJ3B4JztcblxuXHRcdGltYWdlTG9hZEhhbmRsZXIodGhpcywgZXJySW1nKTtcblx0fS5iaW5kKHBpY3R1cmUpKTtcbn07XG5cbi8vIGxvYWRzIGEganNvbiBhcnJheSBvZiBpbWFnZXMgaW50byB0aGUgYm9hcmRcbkJvYXJkLmxvYWQgPSBmdW5jdGlvbihJbnRlcmZhY2VzLCBFdmVudHMsIG1haW5XaW5kb3csIG9iamVjdHMpIHtcblx0aXNMb2FkaW5nID0gdHJ1ZTtcblxuXHRmdW5jdGlvbiBoYW5kbGVyKHBpY3R1cmUsIGltYWdlKSB7XG5cdFx0Qm9hcmQuaW1hZ2VMb2FkSGFuZGxlcihwaWN0dXJlLCBpbWFnZSwgb2JqZWN0cy5sZW5ndGgpO1xuXHR9XG5cblx0Zm9yICh2YXIgaSBpbiBvYmplY3RzKSB7XG5cdFx0Qm9hcmQubG9hZEltYWdlKEludGVyZmFjZXMsIEV2ZW50cywgbWFpbldpbmRvdywgb2JqZWN0c1tpXSwgaGFuZGxlcik7XG5cdH1cbn07XG5cbi8vIGNhbGxlZCB3aGVuIGEgc2luZ2xlIGltYWdlIGlzIGxvYWRlZFxuQm9hcmQuaW1hZ2VMb2FkSGFuZGxlciA9IGZ1bmN0aW9uKHBpY3R1cmUsIGltYWdlLCBzZXRDb3VudCkge1xuXHRsb2FkZWRJbWFnZUNvdW50Kys7XG5cblx0Ly8gbm8gYW5jaG9yIG1lYW5zIGJsYW5rIHJvb20gZm9yIGxvYWRlclxuXHRpZiAoIUJvYXJkLmFsYnVtUmVxdWVzdENvbXBvbmVudHMuYW5jaG9yKSB7XG5cdFx0Qm9hcmQuc2V0TG9hZGVyKGxvYWRlZEltYWdlQ291bnQgLyBzZXRDb3VudCk7XG5cdH1cblxuXHQvLyBidWlsZCB0cmVlXG5cdHBpY3R1cmUuYXBwZW5kQ2hpbGQoaW1hZ2UpO1xuXHRub2Rlcy5yb290Tm9kZS5hcHBlbmRDaGlsZChwaWN0dXJlKTtcblxuXHRCb2FyZC5waWN0dXJlcy5wdXNoKHBpY3R1cmUpO1xuXG5cdGlmIChsb2FkZWRJbWFnZUNvdW50ID09IHNldENvdW50KSB7XG5cdFx0bG9hZGVkSW1hZ2VDb3VudCA9IDA7XG5cdFx0aXNMb2FkaW5nID0gZmFsc2U7XG5cblx0XHQvLyBpZiBhbmNob3IgaXMgMCwgdGhhdCBtZWFucyBsb2FkaW5nIGltYWdlcyBmb3Jcblx0XHQvLyB0aGUgZmlyc3QgdGltZS4gU2V0IGxvYWRlciBiYXIgdG8gZnVsbFxuXHRcdGlmICghQm9hcmQuYWxidW1SZXF1ZXN0Q29tcG9uZW50cy5hbmNob3IpIHtcblx0XHRcdEJvYXJkLnVuc2V0TG9hZGVyKCk7XG5cdFx0XHRub2Rlcy5yb290Tm9kZS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcblx0XHR9XG5cblx0XHQvLyBlbWl0ICdsb2FkJyBldmVudFxuXHRcdEJvYXJkLmVtaXQoJ2xvYWQnLCBbc2V0Q291bnRdKTtcblx0fVxufTtcblxuLy8gYWxlcnQgZW50aXJlIGJvYXJkXG5Cb2FyZC51cGRhdGUgPSBmdW5jdGlvbihJbnRlcmZhY2VzLCBFdmVudHMsIFNlcnZlciwgbWFpbldpbmRvdykge1xuXHRpZiAoIWlzQ3JlYXRlZCkge1xuXHRcdHJldHVybjtcblx0fVxuXG5cdC8vIHJlcXVlc3QgZmlyc3Qgc2V0IG9mIGltYWdlc1xuXHRTZXJ2ZXIuc2V0UmVxdWVzdEFuY2hvcihCb2FyZC5hbGJ1bVJlcXVlc3RDb21wb25lbnRzLmFuY2hvcik7XG5cdFNlcnZlci5zZXRSZXF1ZXN0SGVhZChCb2FyZC5hbGJ1bVJlcXVlc3RDb21wb25lbnRzLmhlYWQpO1xuXHRTZXJ2ZXIuZ2V0QWxidW0oQm9hcmQuZ2V0TmFtZSgpLnRvTG93ZXJDYXNlKCksIGZ1bmN0aW9uKGVyciwgZGF0YSkge1xuXHRcdGlmIChlcnIpIHtcblx0XHRcdEJvYXJkLnNob3dBbGVydCgnRXJyb3I6IFVuYWJsZSB0byBsb2FkIGltYWdlcy4uLicpO1xuXHRcdFx0cmV0dXJuIGNvbnNvbGUubG9nKCdTRVJWRVIgQUxCVU0gUkVRVUVTVCcsIGVycik7XG5cdFx0fVxuXG5cdFx0Qm9hcmQubG9hZChJbnRlcmZhY2VzLCBFdmVudHMsIG1haW5XaW5kb3csIGRhdGEpO1xuXHR9KTtcblxuXHQvLyB1cGRhdGUgYWxlcnROb2RlQ29tcG9uZW50c1xuXHRCb2FyZC51cGRhdGVBbGVydENvbXBvbmVudHMoKTtcbn07XG5cbkJvYXJkLnVwZGF0ZUFsZXJ0Q29tcG9uZW50cyA9IGZ1bmN0aW9uKCkge1xuXHRpZiAoQm9hcmQuYWxlcnROb2RlQ29tcG9uZW50cy5leHRyYSkge1xuXHRcdG5vZGVzLmFsZXJ0Tm9kZUNvbXBvbmVudHMuZXh0cmEuaW5uZXJIVE1MID0gQm9hcmQuYWxlcnROb2RlQ29tcG9uZW50cy5leHRyYTtcblx0fSBlbHNlIHtcblx0XHRub2Rlcy5hbGVydE5vZGVDb21wb25lbnRzLmV4dHJhLmlubmVySFRNTCA9ICcnO1xuXHR9XG5cdG5vZGVzLmFsZXJ0Tm9kZUNvbXBvbmVudHMuYm9keS5pbm5lckhUTUwgPSBCb2FyZC5hbGVydE5vZGVDb21wb25lbnRzLmJvZHk7XG59O1xuXG4vLyBjcmVhdGUgYWxsIGJvYXJkIGNvbXBvbmVudHNcbkJvYXJkLmNyZWF0ZSA9IGZ1bmN0aW9uKEludGVyZmFjZXMsIEV2ZW50cywgbWFpbldpbmRvdywgcGFyZW50Tm9kZSkge1xuXHQvLyB1c2VkIGZvciBkaXNwbGF5aW5nIGFsZXJ0cyBhbmQgYm9hcmQgaW5mb3JtYXRpb25cblx0Ly8gc2libGluZyBvZiBhcHBsaWNhdGlvbiB3cmFwcGVyXG5cdG5vZGVzLmFsZXJ0Tm9kZSA9IEludGVyZmFjZXMuY29udHJvbGxlci5jcmVhdGVEaXZOb2RlKG1haW5XaW5kb3cpO1xuXHRub2Rlcy5hbGVydE5vZGUuY2xhc3NOYW1lID0gJ1BpY3RyZS1ub3RpY2UnO1xuXG5cdG5vZGVzLmFsZXJ0Tm9kZUNvbXBvbmVudHMuZXh0cmEgPSBJbnRlcmZhY2VzLmNvbnRyb2xsZXIuY3JlYXRlRGl2Tm9kZShtYWluV2luZG93KTtcblx0bm9kZXMuYWxlcnROb2RlQ29tcG9uZW50cy5leHRyYS5jbGFzc05hbWUgPSAnUGljdHJlLW5vdGljZS1leHRyYSc7XG5cblx0bm9kZXMuYWxlcnROb2RlQ29tcG9uZW50cy5ib2R5ID0gSW50ZXJmYWNlcy5jb250cm9sbGVyLmNyZWF0ZURpdk5vZGUobWFpbldpbmRvdyk7XG5cblx0Ly8gY3JlYXRlIHJvb3QgXCJ3cmFwcGVyXCIgbm9kZSAoZ29lcyBpbnNpZGUgb2YgYXBwbGljYXRpb24gd3JhcHBlcilcblx0bm9kZXMucm9vdE5vZGUgPSBJbnRlcmZhY2VzLmNvbnRyb2xsZXIuY3JlYXRlRGl2Tm9kZShtYWluV2luZG93KTtcblx0bm9kZXMucm9vdE5vZGUuaWQgPSAnUGljdHJlLXdyYXBwZXInO1xuXHRub2Rlcy5yb290Tm9kZS5zdHlsZS5tYXJnaW5Ub3AgPSAnNTJweCc7XG5cdG5vZGVzLnJvb3ROb2RlLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuXG5cdC8vIGNyZWF0ZSBsb2FkZXIgbm9kZVxuXHR2YXIgbG9hZGVyQ2hpbGROb2RlID0gSW50ZXJmYWNlcy5jb250cm9sbGVyLmNyZWF0ZURpdk5vZGUobWFpbldpbmRvdyk7XG5cdGxvYWRlckNoaWxkTm9kZS5jbGFzc05hbWUgPSAnUGljdHJlLWxvYWRlci1wcm9ncmVzcyc7XG5cblx0bm9kZXMubG9hZGVyTm9kZSA9IEludGVyZmFjZXMuY29udHJvbGxlci5jcmVhdGVEaXZOb2RlKG1haW5XaW5kb3cpO1xuXHRub2Rlcy5sb2FkZXJOb2RlLmNsYXNzTmFtZSA9ICdQaWN0cmUtbG9hZGVyLXdyYXBwZXInO1xuXHRub2Rlcy5sb2FkZXJOb2RlLnN0eWxlLm1hcmdpblRvcCA9ICctNiUnO1xuXG5cdC8vIGNyZWF0ZSBub2RlIHRyZWVcblx0bm9kZXMuYWxlcnROb2RlLmFwcGVuZENoaWxkKG5vZGVzLmFsZXJ0Tm9kZUNvbXBvbmVudHMuYm9keSk7XG5cdG5vZGVzLmFsZXJ0Tm9kZS5hcHBlbmRDaGlsZChub2Rlcy5hbGVydE5vZGVDb21wb25lbnRzLmV4dHJhKTtcblx0cGFyZW50Tm9kZS5hcHBlbmRDaGlsZChub2Rlcy5hbGVydE5vZGUpO1xuXHRwYXJlbnROb2RlLmFwcGVuZENoaWxkKG5vZGVzLnJvb3ROb2RlKTtcblx0bm9kZXMubG9hZGVyTm9kZS5hcHBlbmRDaGlsZChsb2FkZXJDaGlsZE5vZGUpO1xuXHRwYXJlbnROb2RlLmFwcGVuZENoaWxkKG5vZGVzLmxvYWRlck5vZGUpO1xuXG5cdC8vIGNlbnRlciBub2Rlc1xuXHRFdmVudHMubm93QW5kT25Ob2RlRXZlbnQobWFpbldpbmRvdywgJ3Jlc2l6ZScsIGZ1bmN0aW9uKCkge1xuXHRcdEludGVyZmFjZXMuY29udHJvbGxlci5jZW50ZXJOb2RlUmVsYXRpdmVUbyhub2Rlcy5sb2FkZXJOb2RlLCBtYWluV2luZG93KTtcblx0XHRJbnRlcmZhY2VzLmNvbnRyb2xsZXIuaG9yaXpvbnRhbENlbnRlck5vZGVSZWxhdGl2ZVRvKG5vZGVzLnJvb3ROb2RlLCBtYWluV2luZG93KTtcblx0fSk7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgdmlldyBlbGVtZW50cyBpZiBub24tZXhpc3RlbnQgYW5kIGRpc3BsYXlzIGJvYXJkIGNvbXBvbmVudHMuXG4gKi9cbkJvYXJkLnNob3cgPSBmdW5jdGlvbihJbnRlcmZhY2VzLCBFdmVudHMsIFNlcnZlciwgbWFpbldpbmRvdywgcGFyZW50Tm9kZSkge1xuXHRpZiAoIWlzQ3JlYXRlZCkge1xuXHRcdGlzQ3JlYXRlZCA9IHRydWU7XG5cdFx0Qm9hcmQuY3JlYXRlKEludGVyZmFjZXMsIEV2ZW50cywgbWFpbldpbmRvdywgcGFyZW50Tm9kZSk7XG5cdH1cblxuXHRCb2FyZC51cGRhdGUoSW50ZXJmYWNlcywgRXZlbnRzLCBTZXJ2ZXIsIG1haW5XaW5kb3cpO1xuXHRCb2FyZC5vbignbG9hZCcsIGZ1bmN0aW9uKHNldENvdW50KSB7XG5cdFx0Qm9hcmQuc2hvd0FsZXJ0KEJvYXJkLmdldE5hbWUoKSArICcgUGljdHVyZSBCb2FyZCcsIHNldENvdW50KTtcblx0XHRCb2FyZC5jaGlzZWwobWFpbldpbmRvdyk7XG5cdH0pO1xuXG5cdEJvYXJkLm9uKCdjaGlzZWwnLCBmdW5jdGlvbihub2RlLCBpdGVtTWFyZ2luKSB7XG5cdFx0cGFyZW50Tm9kZS5zdHlsZS5oZWlnaHQgPSAobm9kZS5zY3JvbGxIZWlnaHQgKyBpdGVtTWFyZ2luKSArIFwicHhcIjtcblx0XHRJbnRlcmZhY2VzLmNvbnRyb2xsZXIuaG9yaXpvbnRhbENlbnRlck5vZGVSZWxhdGl2ZVRvKG5vZGUsIG1haW5XaW5kb3cpO1xuXHR9KTtcblxuXHRFdmVudHMub25Ob2RlRXZlbnQobWFpbldpbmRvdywgJ3Jlc2l6ZScsIGZ1bmN0aW9uKCkge1xuXHRcdEJvYXJkLmNoaXNlbChtYWluV2luZG93KTtcblx0fSk7XG5cbn07XG5cbkJvYXJkLnNob3dBbGVydCA9IGZ1bmN0aW9uKGJvZHlUZXh0LCBleHRyYVRleHQpIHtcblx0aWYgKCFub2Rlcy5hbGVydE5vZGUpIHtcblx0XHRyZXR1cm4gY29uc29sZS5sb2coJ0JPQVJEIEFMRVJUJywgJ0FuIGF0dGVtcHQgd2FzIG1hZGUgdG8gcGxhY2UgYW4gYWxlcnQgd2l0aG91dCBcInNob3dcImluZyB0aGUgYm9hcmQgZmlyc3QuJyk7XG5cdH1cblxuXHRCb2FyZC5zZXRBbGVydEJvZHkoYm9keVRleHQgfHwgJycpO1xuXHRCb2FyZC5zZXRBbGVydEV4dHJhKGV4dHJhVGV4dCk7XG5cdEJvYXJkLnVwZGF0ZUFsZXJ0Q29tcG9uZW50cygpO1xufTtcblxuQm9hcmQuc2V0QWxlcnRCb2R5ID0gZnVuY3Rpb24odGV4dCkge1xuXHRCb2FyZC5hbGVydE5vZGVDb21wb25lbnRzLmJvZHkgPSB0ZXh0O1xufTtcblxuQm9hcmQuc2V0QWxlcnRFeHRyYSA9IGZ1bmN0aW9uKHRleHQpIHtcblx0Qm9hcmQuYWxlcnROb2RlQ29tcG9uZW50cy5leHRyYSA9IHRleHQ7XG59O1xuXG5Cb2FyZC5zZXRSZXF1ZXN0QW5jaG9yID0gZnVuY3Rpb24oYW5jaG9yKSB7XG5cdEJvYXJkLmFsYnVtUmVxdWVzdENvbXBvbmVudHMuYW5jaG9yID0gYW5jaG9yO1xufTtcblxuQm9hcmQuc2V0UmVxdWVzdEhlYWQgPSBmdW5jdGlvbihoZWFkKSB7XG5cdEJvYXJkLmFsYnVtUmVxdWVzdENvbXBvbmVudHMuaGVhZCA9IGhlYWQ7XG59O1xuXG4vLyBsb2NhbCBldmVudHNcbkJvYXJkLm9uID0gZnVuY3Rpb24oZXZlbnROYW1lLCBjYWxsYmFjaywgb25jZSkge1xuXHRpZiAoIWV2ZW50c1tldmVudE5hbWVdKSB7XG5cdFx0ZXZlbnRzW2V2ZW50TmFtZV0gPSBbXTtcblx0fVxuXHRjYWxsYmFjay5vbmNlID0gb25jZTtcblx0ZXZlbnRzW2V2ZW50TmFtZV0ucHVzaChjYWxsYmFjayk7XG59O1xuXG5Cb2FyZC5lbWl0ID0gZnVuY3Rpb24oZXZlbnROYW1lLCBhcmdzKSB7XG5cdGlmICghZXZlbnRzW2V2ZW50TmFtZV0pIHtcblx0XHRyZXR1cm47XG5cdH1cblx0aWYgKCEoYXJncyBpbnN0YW5jZW9mIEFycmF5KSkge1xuXHRcdGFyZ3MgPSBbYXJnc11cblx0fVxuXHRmb3IgKHZhciBpID0gMDsgaSA8IGV2ZW50c1tldmVudE5hbWVdLmxlbmd0aDsgaSsrKSB7XG5cdFx0ZXZlbnRzW2V2ZW50TmFtZV1baV0uYXBwbHkoQm9hcmQsIGFyZ3MpO1xuXHRcdGlmIChldmVudHNbZXZlbnROYW1lXVtpXS5vbmNlKSB7XG5cdFx0XHRldmVudHNbZXZlbnROYW1lXS5zcGxpY2UoaSwgMSk7XG5cdFx0fVxuXHR9XG59O1xuXG4vLyBleHBlY3RzIGFuIG9mZnNldCAob3IgemVybylcbi8vIHNjYWZmb2xkcyBwaWN0dXJlIGdhbGxlcnlcbkJvYXJkLmNoaXNlbCA9IGZ1bmN0aW9uKG1haW5XaW5kb3csIG9mZnNldCkge1xuXHRpZiAoIW5vZGVzLnJvb3ROb2RlIHx8ICFtYWluV2luZG93IHx8ICFCb2FyZC5nZXRTaXplKCkpIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHR2YXIgd2luZG93V2lkdGggPSBtYWluV2luZG93LmlubmVyV2lkdGg7XG5cdHZhciBpdGVtV2lkdGggPSBCb2FyZC5waWN0dXJlc1swXS5vZmZzZXRXaWR0aDtcblx0dmFyIGl0ZW1NYXJnaW4gPSAwO1xuXHR2YXIgY29sdW1uQ291bnQgPSAwO1xuXG5cdGlmICh3aW5kb3dXaWR0aCAmJiBpdGVtV2lkdGgpIHtcblx0XHRpdGVtTWFyZ2luID0gcGFyc2VJbnQobWFpbldpbmRvdy5nZXRDb21wdXRlZFN0eWxlKEJvYXJkLnBpY3R1cmVzWzBdKS5nZXRQcm9wZXJ0eVZhbHVlKCdtYXJnaW4tbGVmdCcpLnNwbGl0KFwicHhcIilbMF0gKiAyKTtcblx0XHRjb2x1bW5Db3VudCA9IE1hdGguZmxvb3Iod2luZG93V2lkdGggLyAoaXRlbVdpZHRoICsgaXRlbU1hcmdpbikpO1xuXG5cdFx0aWYgKGNvbHVtbkNvdW50ID4gQm9hcmQuZ2V0U2l6ZSgpKSB7XG5cdFx0XHRjb2x1bW5Db3VudCA9IEJvYXJkLmdldFNpemUoKTtcblx0XHR9XG5cdFx0bm9kZXMucm9vdE5vZGUuc3R5bGUud2lkdGggPSAoY29sdW1uQ291bnQgKiAoaXRlbVdpZHRoICsgKGl0ZW1NYXJnaW4pKSkgKyBcInB4XCI7XG5cblx0XHRpZiAob2Zmc2V0KSB7XG5cdFx0XHQvLyB2YXIgeCA9IGEgKyAxO1xuXHRcdFx0Ly8gZm9yICh2YXIgaSA9IHg7IGkgPCB4ICsgUGljdHJlLl9zZXR0aW5ncy5kYXRhLmxpbWl0LnJlcXVlc3Q7IGkrKykge1xuXHRcdFx0Ly8gXHR2YXIgdG9wID0gcGFyc2VJbnQodGhpcy5fc3RvcmFnZS5waWN0dXJlc1tpIC0gY29sdW1uQ291bnRdLnN0eWxlLnRvcC5zcGxpdChcInB4XCIpWzBdKSArIHRoaXMuX3N0b3JhZ2UucGljdHVyZXNbaSAtIGNvbHVtbkNvdW50XS5vZmZzZXRIZWlnaHQgKyBpdGVtTWFyZ2luO1xuXHRcdFx0Ly8gXHR0aGlzLl9zdG9yYWdlLnBpY3R1cmVzW2ldLnN0eWxlLmxlZnQgPSB0aGlzLl9zdG9yYWdlLnBpY3R1cmVzW2kgLSBjb2x1bW5Db3VudF0uc3R5bGUubGVmdDtcblx0XHRcdC8vIFx0dGhpcy5fc3RvcmFnZS5waWN0dXJlc1tpXS5zdHlsZS50b3AgPSB0b3AgKyBcInB4XCI7XG5cdFx0XHQvLyB9XG5cdFx0fSBlbHNlIHtcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgQm9hcmQuZ2V0U2l6ZSgpOyBpKyspIHtcblx0XHRcdFx0Qm9hcmQucGljdHVyZXNbaV0uc3R5bGUuY2xlYXIgPSAnbm9uZSc7XG5cdFx0XHRcdEJvYXJkLnBpY3R1cmVzW2ldLnN0eWxlLmZpcnN0ID0gZmFsc2U7XG5cdFx0XHRcdEJvYXJkLnBpY3R1cmVzW2ldLnN0eWxlLnRvcCA9ICcwJztcblx0XHRcdFx0Qm9hcmQucGljdHVyZXNbaV0uc3R5bGUubGVmdCA9ICcwJztcblx0XHRcdH1cblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgQm9hcmQuZ2V0U2l6ZSgpOyBpICs9IGNvbHVtbkNvdW50KSB7XG5cdFx0XHRcdEJvYXJkLnBpY3R1cmVzW2ldLmZpcnN0ID0gdHJ1ZTtcblx0XHRcdH1cblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgQm9hcmQuZ2V0U2l6ZSgpOyBpKyspIHtcblx0XHRcdFx0dmFyIHBpY3R1cmUgPSBCb2FyZC5waWN0dXJlc1tpXTtcblx0XHRcdFx0dmFyIHByZXZQaWN0dXJlID0gQm9hcmQucGljdHVyZXNbaSAtIDFdO1xuXHRcdFx0XHRpZiAoIXBpY3R1cmUuZmlyc3QpIHtcblx0XHRcdFx0XHRwaWN0dXJlLnN0eWxlLmxlZnQgPSAocGFyc2VJbnQocHJldlBpY3R1cmUuc3R5bGUubGVmdC5zcGxpdChcInB4XCIpWzBdKSArIHByZXZQaWN0dXJlLm9mZnNldFdpZHRoICsgaXRlbU1hcmdpbikgKyBcInB4XCI7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgQm9hcmQuZ2V0U2l6ZSgpOyBpKyspIHtcblx0XHRcdFx0aWYgKEJvYXJkLnBpY3R1cmVzW2kgKyBjb2x1bW5Db3VudF0pIHtcblx0XHRcdFx0XHRCb2FyZC5waWN0dXJlc1tpICsgY29sdW1uQ291bnRdLnN0eWxlLnRvcCA9ICgoQm9hcmQucGljdHVyZXNbaV0ub2Zmc2V0VG9wICsgQm9hcmQucGljdHVyZXNbaV0ub2Zmc2V0SGVpZ2h0ICsgaXRlbU1hcmdpbikgLSAoQm9hcmQucGljdHVyZXNbaSArIGNvbHVtbkNvdW50XS5vZmZzZXRUb3ApKSArIFwicHhcIjtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdEJvYXJkLmVtaXQoJ2NoaXNlbCcsIFtub2Rlcy5yb290Tm9kZSwgaXRlbU1hcmdpbl0pO1xuXHR9XG59O1xuXG5Cb2FyZC5nZXRJbWFnZUJ5SW5kZXggPSBmdW5jdGlvbihpbmRleCkge1xuXHR2YXIgcGljdHVyZSA9IEJvYXJkLmdldFBpY3R1cmVCeUluZGV4KGluZGV4KVxuXHRpZiAocGljdHVyZSkge1xuXHRcdHJldHVybiBwaWN0dXJlLmNoaWxkcmVuWzBdO1xuXHR9XG5cdHJldHVybiBudWxsO1xufTtcblxuQm9hcmQuZ2V0SW1hZ2VCeUlkID0gZnVuY3Rpb24oaWQpIHtcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBCb2FyZC5waWN0dXJlcy5sZW5ndGg7IGkrKykge1xuXHRcdGlmIChCb2FyZC5waWN0dXJlc1tpXS5kYXRhLmlkID09IGlkKSB7XG5cdFx0XHRyZXR1cm4gQm9hcmQucGljdHVyZXNbaV07XG5cdFx0fVxuXHR9XG59O1xuXG5Cb2FyZC5nZXRQaWN0dXJlQnlJbmRleCA9IGZ1bmN0aW9uKGluZGV4KSB7XG5cdHJldHVybiBCb2FyZC5waWN0dXJlc1tpbmRleF07XG59O1xuXG4vLyByZXR1cm4gbG9hZGVkIHBpY3R1cmUgY291bnRcbkJvYXJkLmdldFNpemUgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIEJvYXJkLnBpY3R1cmVzLmxlbmd0aDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQm9hcmQ7IiwidmFyIEludENvbnRyb2xsZXIgPSB7fVxuXG5mdW5jdGlvbiBpbnRlcmZhY2VOb2RlKCkge1xuXHR0aGlzLmNhbGxiYWNrcyA9IHt9O1xuXG5cdC8vIFdhcm5pbmc6IGRvZXMgbm90IHJlZ2lzdGVyIFwiRE9NVHJlZVwiIG5vZGUgZXZlbnRzXG5cdC8vIHRoYXQgc2hvdWxkIGJlIHdhdGNoZWQgd2l0aCBcImFkZEV2ZW50TGlzdGVuZXJcIi5cblx0Ly8gb25seSByZWdpc3RlcnMgXCJsb2NhbFwiIGluc3RhbmNlIGV2ZW50cy4gVXNlXG5cdC8vIFwiRXZlbnRzLm9uTm9kZUV2ZW50XCIgdG8gbGlzdGVuIGZvciBhY3R1YWwgZG9tIGV2dHMuXG5cdHRoaXMub24gPSBmdW5jdGlvbihldmVudE5hbWUsIGNhbGxiYWNrKSB7XG5cdFx0aWYgKCF0aGlzLmNhbGxiYWNrc1tldmVudE5hbWVdKSB7XG5cdFx0XHR0aGlzLmNhbGxiYWNrc1tldmVudE5hbWVdID0gW107XG5cdFx0fVxuXG5cdFx0dGhpcy5jYWxsYmFja3NbZXZlbnROYW1lXS5wdXNoKGNhbGxiYWNrKTtcblx0fTtcblxuXHR0aGlzLmVtaXQgPSBmdW5jdGlvbihldmVudE5hbWUsIGFyZ3MpIHtcblx0XHRpZiAoIXRoaXMuY2FsbGJhY2tzW2V2ZW50TmFtZV0pIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuY2FsbGJhY2tzW2V2ZW50TmFtZV0ubGVuZ3RoOyBpKyspIHtcblx0XHRcdHRoaXMuY2FsbGJhY2tzW2V2ZW50TmFtZV1baV0uYXBwbHkodGhpcywgYXJncyk7XG5cdFx0fVxuXHR9O1xufVxuXG5mdW5jdGlvbiBpbnRlcmZhY2VJbnB1dE5vZGUoRXZlbnRzLCBtYWluV2luZG93KSB7XG5cdHZhciBzY29wZSA9IHRoaXM7XG5cblx0dGhpcy5ub2RlID0gbWFpbldpbmRvdy5kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW5wdXRcIik7XG5cdHRoaXMudHlwZSA9IFwidGV4dFwiO1xuXHR0aGlzLnBhc3N3b3JkID0gZmFsc2U7XG5cdHRoaXMuY2xhc3NOYW1lID0gXCJQaWN0cmUtcGFzc2NvZGUtaW5wdXRcIjtcblx0dGhpcy5wbGFjZWhvbGRlciA9IFwiQ3JlYXRlIGEgcGFzc2NvZGVcIjtcblx0dGhpcy52YWx1ZSA9IHRoaXMucGxhY2Vob2xkZXI7XG5cblx0dGhpcy5ub2RlLm1heExlbmd0aCA9IDEwO1xuXHR0aGlzLm5vZGUuY2xhc3NOYW1lID0gdGhpcy5jbGFzc05hbWU7XG5cdHRoaXMubm9kZS50eXBlID0gdGhpcy50eXBlO1xuXHR0aGlzLm5vZGUucGxhY2Vob2xkZXIgPSB0aGlzLnBsYWNlaG9sZGVyIHx8IFwiXCI7XG5cblx0dGhpcy5nZXROb2RlID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHNjb3BlLm5vZGU7XG5cdH07XG5cdHRoaXMuc2V0U3R5bGUgPSBmdW5jdGlvbihhdHRyLCB2YWx1ZSkge1xuXHRcdHNjb3BlLm5vZGUuc3R5bGVbYXR0cl0gPSB2YWx1ZTtcblx0fTtcblx0dGhpcy5zZXRBdHRyaWJ1dGUgPSBmdW5jdGlvbihhdHRyLCB2YWx1ZSkge1xuXHRcdHNjb3BlLm5vZGUuc2V0QXR0cmlidXRlKGF0dHIsIHZhbHVlKTtcblx0fTtcblxuXHR0aGlzLnNldFZhbHVlID0gZnVuY3Rpb24odGV4dCkge1xuXHRcdHRoaXMubm9kZS52YWx1ZSA9IHRleHQ7XG5cdFx0dGhpcy52YWx1ZSA9IHRleHQ7XG5cdH07XG5cblx0dGhpcy5zZXRQbGFjZWhvbGRlciA9IGZ1bmN0aW9uKHRleHQpIHtcblx0XHR0aGlzLnZhbHVlID0gdGV4dDtcblx0XHR0aGlzLnBsYWNlaG9sZGVyID0gdGV4dDtcblx0XHR0aGlzLm5vZGUucGxhY2Vob2xkZXIgPSB0ZXh0O1xuXHR9O1xuXG5cdHRoaXMuZ2V0VmFsdWUgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gc2NvcGUubm9kZS52YWx1ZTtcblx0fTtcblx0dGhpcy5nZXRFc2NhcGVkVmFsdWUgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gc2NvcGUubm9kZS52YWx1ZS50b0xvd2VyQ2FzZSgpXG5cdFx0XHQucmVwbGFjZSgvJi9nLCBcIiZhbXA7XCIpXG5cdFx0XHQucmVwbGFjZSgvPC9nLCBcIiZsdDtcIilcblx0XHRcdC5yZXBsYWNlKC8+L2csIFwiJmd0O1wiKVxuXHRcdFx0LnJlcGxhY2UoL1wiL2csIFwiJnF1b3Q7XCIpXG5cdFx0XHQucmVwbGFjZSgvJy9nLCBcIiYjMDM5O1wiKTtcblx0fTtcblxuXHR0aGlzLmlzVmFsdWVFbXB0eSA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBzY29wZS52YWx1ZSA9PSBzY29wZS5ub2RlLnZhbHVlIHx8IHNjb3BlLm5vZGUudmFsdWUgPT0gJyc7XG5cdH07XG5cblx0RXZlbnRzLm9uTm9kZUV2ZW50KHRoaXMubm9kZSwgJ2ZvY3VzJywgZnVuY3Rpb24oZSkge1xuXHRcdHNjb3BlLmVtaXQoJ2ZvY3VzJywgW2VdKTtcblx0XHRpZiAoc2NvcGUucGFzc3dvcmQpIHtcblx0XHRcdHNjb3BlLm5vZGUudHlwZSA9IFwicGFzc3dvcmRcIjtcblx0XHR9XG5cdFx0aWYgKHNjb3BlLm5vZGUudmFsdWUgPT0gc2NvcGUudmFsdWUpIHtcblx0XHRcdHNjb3BlLm5vZGUudmFsdWUgPSBcIlwiO1xuXHRcdH1cblx0fSk7XG5cblx0RXZlbnRzLm9uTm9kZUV2ZW50KHRoaXMubm9kZSwgJ2JsdXInLCBmdW5jdGlvbihlKSB7XG5cdFx0c2NvcGUuZW1pdCgnYmx1cicsIFtlXSk7XG5cdH0pO1xuXG5cdHJldHVybiB0aGlzO1xufTtcblxuaW50ZXJmYWNlSW5wdXROb2RlLnByb3RvdHlwZSA9IG5ldyBpbnRlcmZhY2VOb2RlKCk7XG5cbmZ1bmN0aW9uIGludGVyZmFjZURpdk5vZGUoKSB7XG5cbn1cblxuSW50Q29udHJvbGxlci5ob3Jpem9udGFsQ2VudGVyTm9kZVJlbGF0aXZlVG8gPSBmdW5jdGlvbihub2RlLCByZWxhdGl2ZVRvTm9kZSkge1xuXHRub2RlLnN0eWxlLmxlZnQgPSAoJChyZWxhdGl2ZVRvTm9kZSkud2lkdGgoKSAvIDIpIC0gKCQobm9kZSkud2lkdGgoKSAvIDIpICsgJ3B4Jztcbn07XG5cbkludENvbnRyb2xsZXIudmVydGljYWxDZW50ZXJOb2RlUmVsYXRpdmVUbyA9IGZ1bmN0aW9uKG5vZGUsIHJlbGF0aXZlVG9Ob2RlKSB7XG5cdG5vZGUuc3R5bGUudG9wID0gKCQocmVsYXRpdmVUb05vZGUpLmhlaWdodCgpIC8gMikgLSAoJChub2RlKS5oZWlnaHQoKSAvIDIpICsgJ3B4Jztcbn07XG5cbkludENvbnRyb2xsZXIuY2VudGVyTm9kZVJlbGF0aXZlVG8gPSBmdW5jdGlvbihub2RlLCByZWxhdGl2ZVRvTm9kZSkge1xuXHRJbnRDb250cm9sbGVyLmhvcml6b250YWxDZW50ZXJOb2RlUmVsYXRpdmVUbyhub2RlLCByZWxhdGl2ZVRvTm9kZSk7XG5cdEludENvbnRyb2xsZXIudmVydGljYWxDZW50ZXJOb2RlUmVsYXRpdmVUbyhub2RlLCByZWxhdGl2ZVRvTm9kZSk7XG59O1xuXG5JbnRDb250cm9sbGVyLm5ld0lucHV0Tm9kZSA9IGZ1bmN0aW9uKEV2ZW50cywgbWFpbldpbmRvdykge1xuXHRyZXR1cm4gbmV3IGludGVyZmFjZUlucHV0Tm9kZShFdmVudHMsIG1haW5XaW5kb3cpO1xufTtcblxuSW50Q29udHJvbGxlci5uZXdEaXZOb2RlID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiBuZXcgaW50ZXJmYWNlRGl2Tm9kZSgpO1xufTtcblxuSW50Q29udHJvbGxlci5jcmVhdGVEaXZOb2RlID0gZnVuY3Rpb24obWFpbldpbmRvdykge1xuXHRyZXR1cm4gbWFpbldpbmRvdy5kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbn07XG5cbkludENvbnRyb2xsZXIuY3JlYXRlTm9kZSA9IGZ1bmN0aW9uKG1haW5XaW5kb3csIG5vZGVOYW1lKSB7XG5cdHJldHVybiBtYWluV2luZG93LmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobm9kZU5hbWUpO1xufTtcblxuSW50Q29udHJvbGxlci5zZXROb2RlT3ZlcmZsb3dIaWRkZW4gPSBmdW5jdGlvbihub2RlKSB7XG5cdG5vZGUuc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gSW50Q29udHJvbGxlcjsiLCIvKipcbiAqIEdhbGxlcnkgd3JhcHBlciBmb3Igb3ZlcmxheSBpbnRlcmZhY2VcbiAqL1xuXG52YXIgR2FsbGVyeUludGVyZmFjZSA9IHt9O1xuXG5HYWxsZXJ5SW50ZXJmYWNlLmlzRmVhdHVyaW5nID0gZmFsc2U7XG5cbkdhbGxlcnlJbnRlcmZhY2UuZXZlbnRzID0ge307XG5HYWxsZXJ5SW50ZXJmYWNlLmltYWdlcyA9IFtdO1xuXG5HYWxsZXJ5SW50ZXJmYWNlLmltYWdlID0gbnVsbDtcblxudmFyIGlzQWN0aXZlID0gZmFsc2U7XG5cbkdhbGxlcnlJbnRlcmZhY2UuZXZlbnRzLm9ucmVhZHkgPSBmdW5jdGlvbigpIHt9O1xuR2FsbGVyeUludGVyZmFjZS5ldmVudHMub25jbG9zZSA9IGZ1bmN0aW9uKCkge307XG5cbkdhbGxlcnlJbnRlcmZhY2Uub25FeGl0ID0gZnVuY3Rpb24oZXhpdENhbGxiYWNrKSB7XG5cdE92ZXJsYXkuZXZlbnRzLm9uZXhpdC5wdXNoKGV4aXRDYWxsYmFjayk7XG59O1xuXG5HYWxsZXJ5SW50ZXJmYWNlLmhpZGUgPSBmdW5jdGlvbigpIHtcblxuXHQvLyBpZiAoIU92ZXJsYXkuaXNMb2NrZWQpIHtcblxuXHQvLyBcdHdpbmRvdy5kb2N1bWVudC5ib2R5LnN0eWxlLm92ZXJmbG93ID0gJ2F1dG8nO1xuXHQvLyBcdHdpbmRvdy5kb2N1bWVudC5ib2R5LnN0eWxlLmhlaWdodCA9ICdhdXRvJztcblx0Ly8gXHRHYWxsZXJ5SW50ZXJmYWNlLmlzRmVhdHVyaW5nID0gZmFsc2U7XG5cblx0Ly8gXHRPdmVybGF5LnJlbW92ZSgpO1xuXHQvLyBcdEdhbGxlcnlJbnRlcmZhY2Uub25jbG9zZSgpO1xuXG5cdC8vIFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBPdmVybGF5LmV2ZW50cy5vbmV4aXQubGVuZ3RoOyBpKyspIHtcblx0Ly8gXHRcdGlmIChPdmVybGF5LmV2ZW50cy5vbmV4aXRbaV0pIE92ZXJsYXkuZXZlbnRzLm9uZXhpdFtpXS5jYWxsKEdhbGxlcnlJbnRlcmZhY2UpO1xuXHQvLyBcdH1cblxuXHQvLyB9XG5cbn1cblxuLyoqXG4gKiBGZWF0dXJlIGEgZ2l2ZW4gaW1hZ2Ugb2JqZWN0XG4gKi9cbkdhbGxlcnlJbnRlcmZhY2Uuc2hvdyA9IGZ1bmN0aW9uKGltYWdlKSB7XG5cblx0R2FsbGVyeUludGVyZmFjZS5pc0FjdGl2ZSA9IHRydWU7XG5cblx0dmFyIHNjb3BlID0gUGljdHJlO1xuXG5cdC8vIHZhciB0aHVtYiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG5cdC8vIHRodW1iLmNsYXNzTmFtZSA9IFwiUGljdHJlLW92ZXJsYXktcGljXCI7XG5cdC8vIHRodW1iLmRhdGEgPSBpbWFnZS5kYXRhO1xuXHQvLyB0aHVtYi5zdHlsZS5taW5XaWR0aCA9IEVudmlyb25tZW50Lm1heEltYWdlV2lkdGggKyAncHgnO1xuXHQvLyB0aHVtYi5zdHlsZS5tYXhXaWR0aCA9IEVudmlyb25tZW50Lm1heEltYWdlV2lkdGggKyAncHgnO1xuXHQvLyB0aHVtYi5zdHlsZS53aWR0aCA9IEVudmlyb25tZW50Lm1heEltYWdlV2lkdGggKyAncHgnO1xuXHQvLyB0aHVtYi5pbm5lckhUTUwgPSBcIjxkaXYgY2xhc3M9J1BpY3RyZS1sb2FkZXInPjxzcGFuIGNsYXNzPSdmYSBmYS1jaXJjbGUtby1ub3RjaCBmYS1zcGluIGZhLTN4Jz48L3NwYW4+PC9kaXY+XCI7XG5cblx0Ly8gT3ZlcmxheS5mZWF0dXJlKHRodW1iKTtcblx0Ly8gT3ZlcmxheS5pdGVyYXRvciA9IGltYWdlLmRhdGEuaWQ7XG5cblx0Ly8gd2luZG93LmRvY3VtZW50LmJvZHkuc3R5bGUuaGVpZ2h0ID0gJCh3aW5kb3cpLmhlaWdodCgpICsgJ3B4Jztcblx0Ly8gd2luZG93LmRvY3VtZW50LmJvZHkuc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJztcblxuXHQvLyBpbWFnZS5zdHlsZS5vcGFjaXR5ID0gJzAuMSc7XG5cblx0Ly8gR2FsbGVyeS5zaG93SW1hZ2UodGh1bWIpO1xuXHQvLyBQaWN0cmUuZ2FsbGVyeS5vdmVybGF5Lm9uY2xvc2UgPSBmdW5jdGlvbigpIHtcblx0Ly8gXHRpZiAoYSkgYS5zdHlsZS5vcGFjaXR5ID0gUGljdHJlLl9zZXR0aW5ncy5kYXRhLnZpc2l0ZWQ7XG5cdC8vIH1cblxufTtcblxuR2FsbGVyeUludGVyZmFjZS5pc0FjdGl2ZSA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gaXNBY3RpdmU7XG59O1xuXG5HYWxsZXJ5SW50ZXJmYWNlLmdldE92ZXJsYXkgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIE92ZXJsYXk7XG59XG5cbkdhbGxlcnlJbnRlcmZhY2UucHV0T3ZlcmxheSA9IGZ1bmN0aW9uKCkge31cblxubW9kdWxlLmV4cG9ydHMgPSBHYWxsZXJ5SW50ZXJmYWNlOyIsIi8qKlxuICogRXhwb3J0cyBhbGwgaW50ZXJmYWNlIG1vZHVsZXMgaW4gY3VycmVudCBkaXJlY3RvcnlcbiAqL1xuXG4vL2ltcG9ydCBhbGwgbW9kdWxlc1xudmFyIG1vZHVsZXMgPSB7XG5cdCdib2FyZCc6IHJlcXVpcmUoJy4vYm9hcmQuanMnKSxcblx0J2NvbnRyb2xsZXInOiByZXF1aXJlKCcuL2NvbnRyb2xsZXIuanMnKSxcblx0J2dhbGxlcnknOiByZXF1aXJlKCcuL2dhbGxlcnkuanMnKSxcblx0J21lbnUnOiByZXF1aXJlKCcuL21lbnUuanMnKSxcblx0J21vZGFsJzogcmVxdWlyZSgnLi9tb2RhbC5qcycpLFxuXHQnb3ZlcmxheSc6IHJlcXVpcmUoJy4vb3ZlcmxheS5qcycpLFxuXHQnc3BsYXNoJzogcmVxdWlyZSgnLi9zcGxhc2guanMnKSxcblx0J3dhcm5pbmcnOiByZXF1aXJlKCcuL3dhcm5pbmcuanMnKVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBtb2R1bGVzOyIsIi8qKlxuICogTmF2aWdhdGlvbiBhbmQgbWVudSBpbnRlcmZhY2VcbiAqL1xuXG52YXIgRW52aXJvbm1lbnQgPSByZXF1aXJlKCcuLi9lbnZpcm9ubWVudC5qcycpO1xudmFyIFV0aWxpdGllcyA9IHJlcXVpcmUoJy4uL3V0aWxpdGllcy5qcycpO1xuXG52YXIgTWVudUludGVyZmFjZSA9IHtcblxuXHRkb21FbGVtZW50OiBudWxsLFxuXHRidXR0b25zOiB7fSxcblxuXHQvKipcblx0ICogQWRkcyB1aSBpY29uIHRvIHRoZSB0b3AgbmF2aWdhdGlvbiBvZiB0aGUgYXBwbGljYXRpb25cblx0ICpcblx0ICogQHBhcmFtIGJ1dHRvbiBbb2JqZWN0XSBkZWZpbmluZyB1aSBhbmQgYWN0aW9uIHByb3BlcnRpZXMgZm9yIGJ1dHRvblxuXHQgKiBAcmV0dXJuIHBvaW50ZXIgdG8gYWRkZWQgYnV0dG9uIG9iamVjdFxuXHQgKi9cblx0YWRkQnV0dG9uOiBmdW5jdGlvbihidXR0b24pIHtcblxuXHRcdHZhciBidXR0b25JY29uQ2xhc3NOYW1lID0gJ2ZhLWNsb3VkJztcblxuXHRcdHRoaXMuYnV0dG9uc1tidXR0b24ubmFtZV0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuXHRcdHRoaXMuYnV0dG9uc1tidXR0b24ubmFtZV0uaWQgPSBidXR0b24uaWQ7XG5cdFx0dGhpcy5idXR0b25zW2J1dHRvbi5uYW1lXS5jbGFzc05hbWUgPSBcInRvcC1idXR0b25cIjsgLy9cInRvcC1idXR0b25cIjtcblx0XHR0aGlzLmJ1dHRvbnNbYnV0dG9uLm5hbWVdLnRpdGxlID0gYnV0dG9uLnRpdGxlO1xuXG5cdFx0Ly8gaGFuZGxlIGJ1dHRvbiBpY29uIHR5cGVcblx0XHRpZiAoYnV0dG9uLmlkID09ICd1cGxvYWQnKSB7XG5cdFx0XHQvLyBhc3NpZ24gdXBsb2FkIGljb25cblx0XHRcdGJ1dHRvbkljb25DbGFzc05hbWUgPSAnZmEtY2xvdWQtdXBsb2FkJztcblx0XHR9IGVsc2UgaWYgKGJ1dHRvbi5pZCA9PSAnbG9jaycpIHtcblx0XHRcdC8vIGFzc2lnbiAnbG9jaycgaWNvbiB0byBpbmRpY2F0ZSBzaWduaW5nIGluXG5cdFx0XHRidXR0b25JY29uQ2xhc3NOYW1lID0gJ2ZhLWxvY2snO1xuXHRcdH0gZWxzZSBpZiAoYnV0dG9uLmlkID09ICd1bmxvY2snKSB7XG5cdFx0XHQvLyBhc3NpZ24gJ3VubG9jaycgaWNvbiB0byBpbmRpY2F0ZSBzaWduaW5nIG91dFxuXHRcdFx0YnV0dG9uSWNvbkNsYXNzTmFtZSA9ICdmYS11bmxvY2snO1xuXHRcdH0gZWxzZSBpZiAoYnV0dG9uLmlkID09ICdiYWNrJykge1xuXHRcdFx0Ly8gYXNzaWduICdiYWNrJyBhcnJvdyBpY29uIHRvIGluZGljYXRlIHJldHVybmluZyB0byBhbGJ1bVxuXHRcdFx0YnV0dG9uSWNvbkNsYXNzTmFtZSA9ICdmYS1hcnJvdy1sZWZ0Jztcblx0XHR9XG5cblx0XHR0aGlzLmJ1dHRvbnNbYnV0dG9uLm5hbWVdLmlubmVySFRNTCA9ICc8c3BhbiBjbGFzcz1cImZhICcgKyBidXR0b25JY29uQ2xhc3NOYW1lICsgJyBmYS0yeFwiPjwvc3Bhbj4nO1xuXG5cdFx0dGhpcy5kb21FbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuYnV0dG9uc1tidXR0b24ubmFtZV0pO1xuXG5cdFx0dGhpcy5idXR0b25zW2J1dHRvbi5uYW1lXS5zdHlsZS50b3AgPSAodGhpcy5idXR0b25zW2J1dHRvbi5uYW1lXS5wYXJlbnROb2RlLmNsaWVudEhlaWdodCAvIDIgLSB0aGlzLmJ1dHRvbnNbYnV0dG9uLm5hbWVdLmNsaWVudEhlaWdodCAvIDIpICsgJ3B4JztcblxuXHRcdC8vIGRlY2xhcmUgJ29uJyBmdW5jdGlvbiB0byBhbGxvdyBhZGRpdGlvbiBvZiBldmVudCBsaXN0ZW5lciB0byBlbGVtZW50XG5cdFx0dGhpcy5idXR0b25zW2J1dHRvbi5uYW1lXS5vbiA9IGZ1bmN0aW9uKGFjdGlvbiwgY2FsbGJhY2spIHtcblxuXHRcdFx0UGljdHJlLmV4dGVuZCh0aGlzKS5vbihhY3Rpb24sIGZ1bmN0aW9uKGV2dCkge1xuXHRcdFx0XHRjYWxsYmFjay5jYWxsKHRoaXMsIGV2dCk7XG5cdFx0XHR9KTtcblxuXHRcdFx0cmV0dXJuIHRoaXM7XG5cblx0XHR9O1xuXG5cdFx0cmV0dXJuIHRoaXMuYnV0dG9uc1tidXR0b24ubmFtZV07XG5cdH0sXG5cblx0LyoqXG5cdCAqIFJldHVybnMgcG9pbnRlciB0byBidXR0b24gd2l0aCBzcGVjaWZpZWQgaWRcblx0ICovXG5cdGdldEJ1dHRvbjogZnVuY3Rpb24oYnV0dG9uSWQpIHtcblx0XHRyZXR1cm4gdGhpcy5idXR0b25zW2J1dHRvbklkXTtcblx0fSxcblxuXHQvKipcblx0ICogUmV0dXJucyB0cnVlIGlmIGJ1dHRvbiB3aXRoIHNwZWNpZmllZCBpZiBleGlzdHNcblx0ICogZmFsc2Ugb3RoZXJ3aXNlLlxuXHQgKi9cblx0aGFzQnV0dG9uOiBmdW5jdGlvbihidXR0b25JZCkge1xuXG5cdFx0dmFyIGJ1dHRvbkV4aXN0cyA9IGZhbHNlO1xuXG5cdFx0aWYgKHRoaXMuYnV0dG9ucy5oYXNPd25Qcm9wZXJ0eShidXR0b25JZCkpIHtcblx0XHRcdGJ1dHRvbkV4aXN0cyA9IHRydWU7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGJ1dHRvbkV4aXN0cztcblxuXHR9LFxuXG5cdC8qKlxuXHQgKiBTZXRzIGRvbSBzdHlsZSBkaXNwbGF5IHByb3BlcnR5IHRvIG5vbmUgb2YgYnV0dG9uIHdpdGhcblx0ICogc3BlY2lmaWVkIGlkLiBJZiBidXR0b24gZG9lcyBub3QgZXhpc3QsIHJlcXVlc3QgaXMgaWdub3JlZC5cblx0ICovXG5cdGhpZGVCdXR0b246IGZ1bmN0aW9uKGJ1dHRvbklkKSB7XG5cdFx0aWYgKHRoaXMuaGFzQnV0dG9uKGJ1dHRvbklkKSkge1xuXHRcdFx0dGhpcy5idXR0b25zW2J1dHRvbklkXS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuXHRcdH1cblx0fSxcblxuXHQvKipcblx0ICogTWFpbiBkaXNwbGF5IGZ1bmN0aW9uIGZvciBtZW51IGludGVyZmFjZS4gV2hlbiBjYWxsZWQsIGNyZWF0ZXNcblx0ICogbWVudSBkb20gZWxlbWVudCwgYXBwZW5kcyBhcHBsaWNhdGlvbiBicmFuZCwgYW5kIGluc2VydHMgbWVudVxuXHQgKiBlbGVtZW50IGJlZm9yZSB0aGUgbWFpbiBhcHBsaWNhdGlvbiB3cmFwcGVyLiBJZiBhXG5cdCAqIHNpYmxpbmdOb2RlIGlzIG5vdCBzdXBwbGllZCwgdGhlIG1lbnUgZWxlbWVudCBpcyBhcHBlbmRlZFxuXHQgKiB0byB0aGUgcGFyZW50IG5vZGUgc3VwcGxpZWQuIChVc3VhbGx5IGJvZHkpLlxuXHQgKlxuXHQgKiBOb3RlOiB0aGUgYXBwbGljYXRpb24gd3JhcHBlciBpcyB1c3VhbGx5IGNyZWF0ZWQgYW5kIGFwcGVuZGVkXG5cdCAqIGluIHRoZSBpbmRleC5odG1sIHByZS1pbml0aWFsaXphdGlvbiBzY3JpcHQuXG5cdCAqXG5cdCAqIEBwYXJhbSBwYXJlbnROb2RlIFx0XHRcdFtET01FbGVtZW50XSBwYXJlbnQgbm9kZSBvZiBhcHAgd3JhcHBlciBhbmQgbWVudSAodXN1YWxseSBkb2N1bWVudC5ib2R5KVxuXHQgKiBAcGFyYW0gc2libGluZ05vZGUgXHRbRE9NRWxlbWVudF0gbWFpbiBjb250ZW50IHdyYXBwZXIgZm9yIGFwcGxpY2F0aW9uXG5cdCAqL1xuXHRwdXQ6IGZ1bmN0aW9uKHBhcmVudE5vZGUsIHNpYmxpbmdOb2RlKSB7XG5cblx0XHR0aGlzLmRvbUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuXHRcdHRoaXMuZG9tRWxlbWVudC5pZCA9ICd0b3AnO1xuXG5cdFx0Ly8gcGxhY2UgbG9nbyBvbiBtZW51XG5cdFx0dmFyIGJyYW5kID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblx0XHRicmFuZC5pZCA9ICdicmFuZCc7XG5cdFx0YnJhbmQuaW5uZXJIVE1MID0gRW52aXJvbm1lbnQuYXBwLnRpdGxlO1xuXG5cdFx0VXRpbGl0aWVzLmV4dGVuZChicmFuZCkub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG5cdFx0XHR3aW5kb3cubG9jYXRpb24uYXNzaWduKCcvJyk7XG5cdFx0fSk7XG5cblx0XHR0aGlzLmRvbUVsZW1lbnQuYXBwZW5kQ2hpbGQoYnJhbmQpO1xuXG5cdFx0aWYgKHNpYmxpbmdOb2RlKSB7XG5cdFx0XHRwYXJlbnROb2RlLmluc2VydEJlZm9yZSh0aGlzLmRvbUVsZW1lbnQsIHNpYmxpbmdOb2RlKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cGFyZW50Tm9kZS5hcHBlbmRDaGlsZCh0aGlzLmRvbUVsZW1lbnQpO1xuXHRcdH1cblxuXHRcdGJyYW5kLnN0eWxlLnRvcCA9ICh0aGlzLmRvbUVsZW1lbnQuY2xpZW50SGVpZ2h0IC8gMiAtIGJyYW5kLmNsaWVudEhlaWdodCAvIDIpICsgJ3B4Jztcblx0XHRyZXR1cm4gdGhpcy5kb21FbGVtZW50O1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBSZW1vdmVzIGJ1dHRvbiBmcm9tIHRoZSBkb2N1bWVudCBhbmQgZGVsZXRlcyBkb20gZWxlbWVudC5cblx0ICogSWYgYnV0dG9uIHdpdGggc3BlY2lmaWVkIGlkIGRvZXMgbm90IGV4aXN0LCBhY3Rpb24gaXMgaWdub3JlZC5cblx0ICpcblx0ICogQHBhcmFtIGJ1dHRvbklkIFtTdHJpbmddIGlkIG9mIGJ1dHRvbiB0byByZW1vdmVcblx0ICovXG5cdHJlbW92ZUJ1dHRvbjogZnVuY3Rpb24oYnV0dG9uSWQpIHtcblx0XHRpZiAodGhpcy5oYXNCdXR0b24oYnV0dG9uSWQpKSB7XG5cdFx0XHR0aGlzLmRvbUVsZW1lbnQucmVtb3ZlQ2hpbGQodGhpcy5idXR0b25zW2J1dHRvbklkXSk7XG5cdFx0XHRkZWxldGUgdGhpcy5idXR0b25zW2J1dHRvbklkXTtcblx0XHR9XG5cdH0sXG5cblx0LyoqXG5cdCAqIFNldHMgYnV0dG9uIGNzcyBzdHlsZSBkaXNwbGF5IHByb3BlcnR5IHRvIGJsb2NrLlxuXHQgKiBVc2VkIGFmdGVyIGhpZGluZyBhIGJ1dHRvbi4gSWYgYSBidXR0b24gd2l0aFxuXHQgKiBzcGVjaWZpZWQgaWQgZG9lcyBub3QgZXhpc3QsIHRoaXMgYWN0aW9uIGlzIGlnbm9yZWQuXG5cdCAqL1xuXHRzaG93QnV0dG9uOiBmdW5jdGlvbihidXR0b25JZCkge1xuXHRcdGlmICh0aGlzLmhhc0J1dHRvbihidXR0b25JZCkpIHtcblx0XHRcdHRoaXMuYnV0dG9uc1tidXR0b25JZF0uc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG5cdFx0fVxuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTWVudUludGVyZmFjZTsiLCIvKipcbiAqIE1vZGFsIGNvbnRyb2xsZXIgLSBkaXNwbGF5cyBpbmZvcm1hdGlvbiB3aXRoIG9wdGlvbmFsIHVzZXIgaW5wdXRzXG4gKiBSZXF1aXJlcyBhbiBvdmVybGF5XG4gKi9cblxudmFyIEVudmlyb25tZW50ID0gcmVxdWlyZSgnLi4vZW52aXJvbm1lbnQuanMnKTtcblxudmFyIE1vZGFsID0ge307XG52YXIgbm9kZXMgPSB7XG5cdC8vIG5vZGUgYXR0YWNoZWQgdG8gYSBwYXJlbnROb2RlIG9yIG1haW5XaW5kb3dcblx0cm9vdE5vZGU6IG51bGwsXG5cblx0Ly8gbm9kZSB0aGF0IGhvbGRzIGFsbCBtb2RhbCBub2RlcyBhbmQgY29tcG9uZW50c1xuXHQvLyBhdHRhY2hlZCB0byByb290Tm9kZVxuXHRjb250YWluZXJOb2RlOiBudWxsLFxuXHRvdXRwdXROb2RlOiBudWxsLFxuXHRjb21wb25lbnRzOiB7XG5cdFx0dGl0bGU6IG51bGwsXG5cdFx0Ym9keTogbnVsbCxcblx0XHRpbnB1dHM6IFtdXG5cdH1cbn07XG5cbnZhciBhbGVydFRpbWVvdXQgPSBudWxsO1xudmFyIGlzQ3JlYXRlZCA9IGZhbHNlO1xudmFyIG1haW5EaXYgPSBudWxsO1xuXG52YXIgcGFyZW50Tm9kZUNhY2hlID0ge307XG5cbk1vZGFsLnNldHRpbmdzID0ge1xuXHRhbGVydER1cmF0aW9uOiBFbnZpcm9ubWVudC5hbGVydER1cmF0aW9uXG59O1xuXG5Nb2RhbC5jb21wb25lbnRzID0ge1xuXHR0aXRsZTogbnVsbCxcblx0Ym9keTogJ0VtcHR5IG1vZGFsLicsXG5cdGlucHV0czogW11cbn07XG5cbi8vIHVwZGF0ZSBjb21wb25lbnRzXG5Nb2RhbC51cGRhdGUgPSBmdW5jdGlvbigpIHtcblx0aWYgKE1vZGFsLnRpdGxlKSB7XG5cdFx0aWYgKG5vZGVzLmNvbXBvbmVudHMudGl0bGUpIHtcblx0XHRcdG5vZGVzLmNvbXBvbmVudHMudGl0bGUuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG5cdFx0XHRub2Rlcy5jb21wb25lbnRzLnRpdGxlLmlubmVySFRNTCA9IE1vZGFsLmNvbXBvbmVudHMudGl0bGU7XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdG5vZGVzLmNvbXBvbmVudHMudGl0bGUuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblx0fVxuXHRpZiAobm9kZXMuY29tcG9uZW50cy5ib2R5KSB7XG5cdFx0bm9kZXMuY29tcG9uZW50cy5ib2R5LmlubmVySFRNTCA9IE1vZGFsLmNvbXBvbmVudHMuYm9keTtcblx0fVxuXHRpZiAoTW9kYWwuaW5wdXRzLmxlbmd0aCkge1xuXHRcdC8vIFRPRE9cblx0fVxufTtcblxuTW9kYWwuY3JlYXRlID0gZnVuY3Rpb24oSW50ZXJmYWNlcywgRXZlbnRzLCBtYWluV2luZG93LCBwYXJlbnROb2RlKSB7XG5cdC8vIGdvZXMgb24gdG9wIG9mIGJhY2tncm91bmQsIHNpbXVsYXRlcyBvdmVybGF5IG5vZGVcblx0Ly8gaW4gb3JkZXIgZm9yIGl0cyBjaGlsZCBub2RlcyB0byBoYXZlIGNvcnJlY3QgcmVsYXRpdmVcblx0Ly8gcG9zaXRpb24gdG8gYSBmdWxsIGJyb3dzZXIgcGFnZVxuXHRub2Rlcy5yb290Tm9kZSA9IEludGVyZmFjZXMuY29udHJvbGxlci5jcmVhdGVEaXZOb2RlKG1haW5XaW5kb3cpO1xuXHRub2Rlcy5yb290Tm9kZS5zdHlsZS53aWR0aCA9ICcxMDAlJztcblx0bm9kZXMucm9vdE5vZGUuc3R5bGUuaGVpZ2h0ID0gJzEwMCUnO1xuXHRub2Rlcy5yb290Tm9kZS5zdHlsZS5wb3NpdGlvbiA9ICdmaXhlZCc7XG5cdG5vZGVzLnJvb3ROb2RlLnN0eWxlLmxlZnQgPSAwO1xuXHRub2Rlcy5yb290Tm9kZS5zdHlsZS50b3AgPSAwO1xuXHRub2Rlcy5yb290Tm9kZS5zdHlsZS56SW5kZXggPSAxMDAwO1xuXG5cdC8vIG1haW4gc3ViLWNvbnRhaW5lciBmb3IgaW5wdXRzIC8gdGV4dFxuXHRub2Rlcy5jb250YWluZXJOb2RlID0gSW50ZXJmYWNlcy5jb250cm9sbGVyLmNyZWF0ZURpdk5vZGUobWFpbldpbmRvdyk7XG5cdG5vZGVzLmNvbnRhaW5lck5vZGUuY2xhc3NOYW1lID0gJ1BpY3RyZS1wYXNzY29kZS13cmFwcGVyJztcblxuXHQvLyB3cmFwcGVkIGJ5IGNvbnRhaW5lck5vZGUuIFdyYXBzIGNvbnRlbnQtXG5cdC8vIGNvbnRhaW5pbmcgZWxlbWVudHMgc3VjaCBhcyBkaXZzLCBwYXJhZ3JhcGhzLCBldGMuXG5cdHZhciBjb250YWluZXJOb2RlQ29udGVudFdyYXBwZXIgPSBJbnRlcmZhY2VzLmNvbnRyb2xsZXIuY3JlYXRlRGl2Tm9kZShtYWluV2luZG93KTtcblx0Y29udGFpbmVyTm9kZUNvbnRlbnRXcmFwcGVyLmNsYXNzTmFtZSA9ICdQaWN0cmUtcGFzc2NvZGUtaW5wdXQtd3JhcHBlcic7XG5cblx0Ly8gd3JhcHBlZCBieSBjb250YWluZXJOb2RlQ29udGVudFdyYXBwZXIuXG5cdC8vIG1haW4gdGV4dCB2aWV3IGZvciBzcGxhc2ggXCJtb2RhbFwiXG5cdHZhciBjb250YWluZXJOb2RlQ29udGVudFdyYXBwZXJUZXh0Q29udGVudCA9IEludGVyZmFjZXMuY29udHJvbGxlci5jcmVhdGVEaXZOb2RlKG1haW5XaW5kb3cpO1xuXHRjb250YWluZXJOb2RlQ29udGVudFdyYXBwZXJUZXh0Q29udGVudC5jbGFzc05hbWUgPSAnUGljdHJlLXBhc3Njb2RlLXAnO1xuXHRjb250YWluZXJOb2RlQ29udGVudFdyYXBwZXJUZXh0Q29udGVudC5zdHlsZS5mb250U2l6ZSA9IFwiMC44NWVtXCI7XG5cdGNvbnRhaW5lck5vZGVDb250ZW50V3JhcHBlclRleHRDb250ZW50LmlubmVySFRNTCA9ICcnO1xuXG5cdC8vIHJlc2V0IGlucHV0c1xuXHRub2Rlcy5jb21wb25lbnRzLmlucHV0cyA9IFtdO1xuXG5cdG5vZGVzLmNvbXBvbmVudHMudGl0bGUgPSBJbnRlcmZhY2VzLmNvbnRyb2xsZXIuY3JlYXRlTm9kZShtYWluV2luZG93LCAnYicpO1xuXHRub2Rlcy5jb21wb25lbnRzLnRpdGxlLmNsYXNzTmFtZSA9ICdicmFuZCc7XG5cdG5vZGVzLmNvbXBvbmVudHMudGl0bGUuc3R5bGUud2lkdGggPSAnMTAwJSc7XG5cdG5vZGVzLmNvbXBvbmVudHMudGl0bGUuc3R5bGUudGV4dEFsaWduID0gJ2NlbnRlcic7XG5cdG5vZGVzLmNvbXBvbmVudHMudGl0bGUuc3R5bGUuZm9udFNpemUgPSAnMi4yZW0nO1xuXHRub2Rlcy5jb21wb25lbnRzLnRpdGxlLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuXHRub2Rlcy5jb21wb25lbnRzLnRpdGxlLnN0eWxlLm1hcmdpbkJvdHRvbSA9ICcxMHB4JztcblxuXHQvLyBvbmx5IGRpc3BsYXkgdGl0bGUgaWYgc2V0XG5cdGlmIChNb2RhbC5jb21wb25lbnRzLnRpdGxlKSB7XG5cdFx0bm9kZXMuY29tcG9uZW50cy50aXRsZS5pbm5lckhUTUwgPSBNb2RhbC5jb21wb25lbnRzLnRpdGxlO1xuXHR9XG5cblx0bm9kZXMuY29tcG9uZW50cy5ib2R5ID0gSW50ZXJmYWNlcy5jb250cm9sbGVyLmNyZWF0ZURpdk5vZGUobWFpbldpbmRvdyk7XG5cdG5vZGVzLmNvbXBvbmVudHMuYm9keS5pbm5lckhUTUwgPSBNb2RhbC5jb21wb25lbnRzLmJvZHk7XG5cblx0Ly8gd3JhcHBlZCBieSBjb250YWluZXJOb2RlQ29udGVudFdyYXBwZXJcblx0Ly8gZGlzcGxheSBhbGVydHMgb3Igb3V0cHV0IHRleHRcblx0bm9kZXMub3V0cHV0Tm9kZSA9IEludGVyZmFjZXMuY29udHJvbGxlci5jcmVhdGVEaXZOb2RlKG1haW5XaW5kb3cpO1xuXHRub2Rlcy5vdXRwdXROb2RlLmNsYXNzTmFtZSA9ICdQaWN0cmUtcGFzc2NvZGUtcCBQaWN0cmUtcGFzc2NvZGUtZm9ybWFsLWZvbnQnO1xuXHRub2Rlcy5vdXRwdXROb2RlLnN0eWxlLmZvbnRTaXplID0gJzAuODVlbSc7XG5cdG5vZGVzLm91dHB1dE5vZGUuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblxuXHQvLyBjcmVhdGUgbm9kZSB0cmVlXG5cdGNvbnRhaW5lck5vZGVDb250ZW50V3JhcHBlclRleHRDb250ZW50LmFwcGVuZENoaWxkKG5vZGVzLmNvbXBvbmVudHMudGl0bGUpO1xuXHRjb250YWluZXJOb2RlQ29udGVudFdyYXBwZXJUZXh0Q29udGVudC5hcHBlbmRDaGlsZChub2Rlcy5jb21wb25lbnRzLmJvZHkpO1xuXHRjb250YWluZXJOb2RlQ29udGVudFdyYXBwZXIuYXBwZW5kQ2hpbGQoY29udGFpbmVyTm9kZUNvbnRlbnRXcmFwcGVyVGV4dENvbnRlbnQpO1xuXHRjb250YWluZXJOb2RlQ29udGVudFdyYXBwZXIuYXBwZW5kQ2hpbGQobm9kZXMub3V0cHV0Tm9kZSk7XG5cdGlmIChNb2RhbC5jb21wb25lbnRzLmlucHV0cy5sZW5ndGgpIHtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IE1vZGFsLmNvbXBvbmVudHMuaW5wdXRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRub2Rlcy5jb21wb25lbnRzLmlucHV0cy5wdXNoKE1vZGFsLmNvbXBvbmVudHMuaW5wdXRzW2ldKTtcblx0XHRcdGNvbnRhaW5lck5vZGVDb250ZW50V3JhcHBlci5hcHBlbmRDaGlsZChub2Rlcy5jb21wb25lbnRzLmlucHV0c1tpXSk7XG5cdFx0fVxuXHR9XG5cdG5vZGVzLmNvbnRhaW5lck5vZGUuYXBwZW5kQ2hpbGQoY29udGFpbmVyTm9kZUNvbnRlbnRXcmFwcGVyKTtcblx0bm9kZXMucm9vdE5vZGUuYXBwZW5kQ2hpbGQobm9kZXMuY29udGFpbmVyTm9kZSk7XG5cdHBhcmVudE5vZGUuYXBwZW5kQ2hpbGQobm9kZXMucm9vdE5vZGUpO1xuXG5cdC8vIGluaXQgc3BsYXNoIG5vZGUgZXZlbnRzIGFuZCBhZGp1c3QgcG9zaXRpb25zXG5cdEV2ZW50cy5ub3dBbmRPbk5vZGVFdmVudChtYWluV2luZG93LCAncmVzaXplJywgZnVuY3Rpb24oZSkge1xuXHRcdEludGVyZmFjZXMuY29udHJvbGxlci5jZW50ZXJOb2RlUmVsYXRpdmVUbyhub2Rlcy5jb250YWluZXJOb2RlLCBtYWluV2luZG93KTtcblx0fSk7XG59O1xuXG4vKipcbiAqIERpc3BsYXlzIG9yIGNyZWF0ZXMgdGhlIG1vZGFsLCB0aGVuIGRpc3BsYXlzLlxuICogcmVjZWl2ZXMgYW4gb3B0aW9uYWwgYXJyYXkgb2YgaW5wdXRzIHRvIGRpc3BsYXlcbiAqL1xuTW9kYWwuc2hvdyA9IGZ1bmN0aW9uKEludGVyZmFjZXMsIEV2ZW50cywgbWFpbldpbmRvdywgcGFyZW50Tm9kZSwgaW5wdXRzQXJyYXkpIHtcblx0aWYgKCFpc0NyZWF0ZWQpIHtcblx0XHRpc0NyZWF0ZWQgPSB0cnVlO1xuXHRcdE1vZGFsLmNyZWF0ZShJbnRlcmZhY2VzLCBFdmVudHMsIG1haW5XaW5kb3csIHBhcmVudE5vZGUpO1xuXHR9IGVsc2Uge1xuXHRcdE1vZGFsLnVwZGF0ZSgpO1xuXHRcdEludGVyZmFjZXMuY29udHJvbGxlci5jZW50ZXJOb2RlUmVsYXRpdmVUbyhub2Rlcy5jb250YWluZXJOb2RlLCBtYWluV2luZG93KTtcblx0fVxuXG5cdC8vIGFzc3VtZXMgcm9vdE5vZGUgZXhpc3RzXG5cdGlmICghcGFyZW50Tm9kZUNhY2hlW3BhcmVudE5vZGUubm9kZU5hbWVdKSB7XG5cdFx0cGFyZW50Tm9kZUNhY2hlW3BhcmVudE5vZGUubm9kZU5hbWVdID0gcGFyZW50Tm9kZTtcblx0XHRyZXR1cm47XG5cdH1cblx0bm9kZXMucm9vdE5vZGUuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG59O1xuXG5Nb2RhbC5oaWRlID0gZnVuY3Rpb24ocGFyZW50Tm9kZSkge1xuXHRpZiAoIWlzQ3JlYXRlZCkge1xuXHRcdHJldHVybjtcblx0fVxuXHRpZiAoIXBhcmVudE5vZGVDYWNoZVtwYXJlbnROb2RlLm5vZGVOYW1lXSkge1xuXHRcdHJldHVybjtcblx0fVxuXHRub2Rlcy5yb290Tm9kZS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xufTtcblxuTW9kYWwuc2V0VGl0bGUgPSBmdW5jdGlvbih0aXRsZSkge1xuXHRNb2RhbC5jb21wb25lbnRzLnRpdGxlID0gdGl0bGU7XG59O1xuXG5Nb2RhbC5zZXRCb2R5ID0gZnVuY3Rpb24oYm9keSkge1xuXHRNb2RhbC5jb21wb25lbnRzLmJvZHkgPSBib2R5O1xufTtcblxuTW9kYWwuc2V0SW5wdXRzID0gZnVuY3Rpb24oaW5wdXRzQXJyYXkpIHtcblx0aWYgKGlucHV0c0FycmF5IGluc3RhbmNlb2YgQXJyYXkpIHtcblx0XHRNb2RhbC5jb21wb25lbnRzLmlucHV0cyA9IGlucHV0c0FycmF5O1xuXHR9XG59O1xuXG5Nb2RhbC5hZGRJbnB1dCA9IGZ1bmN0aW9uKGlucHV0KSB7XG5cdE1vZGFsLmNvbXBvbmVudHMuaW5wdXRzLnB1c2goaW5wdXQpO1xufTtcblxuTW9kYWwuc2hvd0FsZXJ0ID0gZnVuY3Rpb24odGV4dCwgdGltZW91dCkge1xuXHRpZiAoIW5vZGVzLm91dHB1dE5vZGUpIHtcblx0XHRyZXR1cm4gY29uc29sZS5sb2coJ01PREFMIEFMRVJUJywgJ0Vycm9yIGRpc3BsYXlpbmcgYWxlcnQsIG5vIG91dHB1dE5vZGUgaGFzIGJlZW4gY3JlYXRlZDsgXCJzaG93XCIgdGhlIG5vZGUgZmlyc3QuJyk7XG5cdH1cblxuXHRub2Rlcy5vdXRwdXROb2RlLmlubmVySFRNTCA9IHRleHQ7XG5cdG5vZGVzLm91dHB1dE5vZGUuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG5cblx0aWYgKCF0aW1lb3V0KSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0Y2xlYXJUaW1lb3V0KGFsZXJ0VGltZW91dCk7XG5cdGFsZXJ0VGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0bm9kZXMub3V0cHV0Tm9kZS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuXHR9LCB0aW1lb3V0KTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTW9kYWw7IiwiLyoqXG4gKiBPdmVybGF5IGludGVyZmFjZVxuICovXG5cbnZhciBPdmVybGF5SW50ZXJmYWNlID0ge307XG5cbnZhciBpc0xvY2tlZCA9IGZhbHNlO1xudmFyIGl0ZXJhdG9yID0gMDtcbnZhciBjb21tZW50cyA9IG51bGw7XG52YXIgZG9tRWxlbWVudCA9IG51bGw7XG52YXIgZmVhdHVyZWRJbWFnZSA9IG51bGw7XG5cbnZhciBjYWxsYmFja3MgPSB7fTtcbnZhciBub2RlcyA9IHtcblx0b3ZlcmxheTogbnVsbFxufTtcblxuT3ZlcmxheUludGVyZmFjZS5pc0xvY2tlZCA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gaXNMb2NrZWQ7XG59XG5cbk92ZXJsYXlJbnRlcmZhY2Uuc2hvdyA9IGZ1bmN0aW9uKG1haW5XaW5kb3cpIHtcblx0aWYgKCFub2Rlcy5vdmVybGF5KSB7XG5cdFx0bm9kZXMub3ZlcmxheSA9IG1haW5XaW5kb3cuZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cdFx0bm9kZXMub3ZlcmxheS5jbGFzc05hbWUgPSAnUGljdHJlLW92ZXJsYXknO1xuXHRcdG5vZGVzLm92ZXJsYXkuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblx0XHRub2Rlcy5vdmVybGF5LnN0eWxlLnpJbmRleCA9IDk5OTtcblx0XHRtYWluV2luZG93LmRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQobm9kZXMub3ZlcmxheSk7XG5cdH1cblxuXHQkKG5vZGVzLm92ZXJsYXkpLmZhZGVJbig2MDApO1xufVxuXG5PdmVybGF5SW50ZXJmYWNlLmxvY2sgPSBmdW5jdGlvbigpIHtcblx0aXNMb2NrZWQgPSB0cnVlO1xufTtcblxuT3ZlcmxheUludGVyZmFjZS51bmxvY2sgPSBmdW5jdGlvbigpIHtcblx0aXNMb2NrZWQgPSBmYWxzZTtcbn07XG5cbk92ZXJsYXlJbnRlcmZhY2UuaGlkZSA9IGZ1bmN0aW9uKG1haW5XaW5kb3cpIHtcblx0aWYgKCFub2Rlcy5vdmVybGF5KSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0JChub2Rlcy5vdmVybGF5KS5mYWRlT3V0KDYwMCk7XG59XG5cbk92ZXJsYXlJbnRlcmZhY2UuZ2V0RmVhdHVyZWRJbWFnZSA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gZmVhdHVyZWRJbWFnZTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gT3ZlcmxheUludGVyZmFjZTsiLCIvKipcbiAqIFNwbGFzaCBpbnRlcmZhY2UgY29udHJvbGxlciBmb3IgZGlzcGxheWluZ1xuICogdGhlIG1haW4gKGZyb250KSB2aWV3IG9mIHRoZSBhcHAuXG4gKi9cblxudmFyIFNwbGFzaEludGVyZmFjZSA9IHt9O1xuXG5ub2RlcyA9IHtcblx0Ly8gaG9sZHMgXCJzcGxhc2hcIiB2aWV3J3MgYmFja2dyb3VuZFxuXHRyb290Tm9kZTogbnVsbCxcblx0aW5wdXROb2RlOiBudWxsXG59O1xuXG5TcGxhc2hJbnRlcmZhY2Uuc2V0dGluZ3MgPSB7XG5cdGFsZXJ0VGltZW91dDogMTAwMDBcbn07XG5cbnZhciBpc0NyZWF0ZWQgPSBmYWxzZTtcbnZhciBwYXJlbnROb2RlQ2FjaGUgPSB7fTtcblxuU3BsYXNoSW50ZXJmYWNlLnNob3dBbGVydCA9IGZ1bmN0aW9uKEludGVyZmFjZXMsIHRleHQpIHtcblx0SW50ZXJmYWNlcy5tb2RhbC5zaG93QWxlcnQodGV4dCk7XG59O1xuXG5TcGxhc2hJbnRlcmZhY2Uuc2hvd0FsZXJ0V2l0aFRpbWVvdXQgPSBmdW5jdGlvbihJbnRlcmZhY2VzLCB0ZXh0LCB0aW1lb3V0KSB7XG5cdEludGVyZmFjZXMubW9kYWwuc2hvd0FsZXJ0KHRleHQsIHRpbWVvdXQgfHwgU3BsYXNoSW50ZXJmYWNlLnNldHRpbmdzLmFsZXJ0VGltZW91dCk7XG59O1xuXG5TcGxhc2hJbnRlcmZhY2UuYXR0YWNoSW5wdXRzID0gZnVuY3Rpb24oSW50ZXJmYWNlcywgRXZlbnRzLCBDbGllbnQsIG1haW5XaW5kb3cpIHtcblx0aWYgKG5vZGVzLmlucHV0Tm9kZSkge1xuXHRcdEludGVyZmFjZXMubW9kYWwuc2V0SW5wdXRzKFtcblx0XHRcdG5vZGVzLmlucHV0Tm9kZS5nZXROb2RlKClcblx0XHRdKTtcblx0XHRyZXR1cm4gbnVsbDtcblx0fVxuXG5cdG5vZGVzLmlucHV0Tm9kZSA9IEludGVyZmFjZXMuY29udHJvbGxlci5uZXdJbnB1dE5vZGUoRXZlbnRzLCBtYWluV2luZG93KTtcblx0bm9kZXMuaW5wdXROb2RlLnNldFN0eWxlKCdjb2xvcicsICd3aGl0ZScpO1xuXHRub2Rlcy5pbnB1dE5vZGUuc2V0QXR0cmlidXRlKCdtYXhsZW5ndGgnLCAxMDApO1xuXHRub2Rlcy5pbnB1dE5vZGUuc2V0UGxhY2Vob2xkZXIoJ0VudGVyIGFuIGFsYnVtIG5hbWUnKTtcblxuXHRpZiAoQ2xpZW50LmlzSUUoKSB8fCBDbGllbnQuaXNNb2JpbGVTYWZhcmkoKSB8fCBDbGllbnQuaXNTYWZhcmkoJzUuMScpKSB7XG5cdFx0bm9kZXMuaW5wdXROb2RlLnNldEF0dHJpYnV0ZSgnbm9mb2N1cycsIHRydWUpO1xuXHRcdG5vZGVzLmlucHV0Tm9kZS5zZXRBdHRyaWJ1dGUoJ3ZhbHVlJywgdmFsdWUpO1xuXG5cdFx0bm9kZXMuaW5wdXROb2RlLm9uKCdibHVyJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0aWYgKHRoaXMubm9kZS52YWx1ZSA9PSBcIlwiICYmIHRoaXMudmFsdWUgIT0gJycpIHtcblx0XHRcdFx0dGhpcy5ub2RlLnZhbHVlID0gdGhpcy52YWx1ZTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxuXG5cdEV2ZW50cy5vbk5vZGVFdmVudChub2Rlcy5pbnB1dE5vZGUuZ2V0Tm9kZSgpLCAna2V5ZG93bicsIGZ1bmN0aW9uKGUpIHtcblx0XHRpZiAoIWUgfHwgZS5rZXlDb2RlICE9IDEzKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0aWYgKCF0aGlzLmlzVmFsdWVFbXB0eSgpKSB7XG5cdFx0XHR2YXIgdmFsdWUgPSB0aGlzLmdldEVzY2FwZWRWYWx1ZSgpO1xuXHRcdFx0aWYgKCFJbnRlcmZhY2VzLmJvYXJkLmlzTmFtZVJlc3RyaWN0ZWQodmFsdWUpKSB7XG5cdFx0XHRcdGlmIChJbnRlcmZhY2VzLmJvYXJkLmlzTmFtZUludmFsaWQodmFsdWUpKSB7XG5cdFx0XHRcdFx0aWYgKEludGVyZmFjZXMuYm9hcmQuaXNOYW1lV2l0aFNwYWNlcyh2YWx1ZSkpIHtcblx0XHRcdFx0XHRcdFNwbGFzaEludGVyZmFjZS5zaG93QWxlcnRXaXRoVGltZW91dChJbnRlcmZhY2VzLCBcIllvdXIgYWxidW0gbmFtZSBjYW5ub3QgY29udGFpbiBzcGFjZXMuXCIpO1xuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRTcGxhc2hJbnRlcmZhY2Uuc2hvd0FsZXJ0V2l0aFRpbWVvdXQoSW50ZXJmYWNlcywgXCJZb3VyIGFsYnVtIG5hbWUgY29udGFpbnMgaW52YWxpZCBjaGFyYWN0ZXJzLlwiKTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblx0XHRcdFx0bWFpbldpbmRvdy5sb2NhdGlvbi5hc3NpZ24odmFsdWUpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhpcy5zZXRWYWx1ZSgnJyk7XG5cdFx0XHRcdFNwbGFzaEludGVyZmFjZS5zaG93QWxlcnRXaXRoVGltZW91dChJbnRlcmZhY2VzLCBcIlRoYXQgYWxidW0gaXMgcmVzdHJpY3RlZCwgcGxlYXNlIHRyeSBhbm90aGVyLlwiKTtcblx0XHRcdH1cblx0XHR9XG5cdH0uYmluZChub2Rlcy5pbnB1dE5vZGUpKTtcblxuXHRJbnRlcmZhY2VzLm1vZGFsLnNldElucHV0cyhbXG5cdFx0bm9kZXMuaW5wdXROb2RlLmdldE5vZGUoKVxuXHRdKTtcblxuXHRyZXR1cm4gbnVsbDtcbn07XG5cblNwbGFzaEludGVyZmFjZS5zaG93ID0gZnVuY3Rpb24oSW50ZXJmYWNlcywgRXZlbnRzLCBDbGllbnQsIG1haW5XaW5kb3csIHBhcmVudE5vZGUpIHtcblx0aWYgKCFpc0NyZWF0ZWQpIHtcblx0XHRpc0NyZWF0ZWQgPSB0cnVlO1xuXHRcdG5vZGVzLnJvb3ROb2RlID0gSW50ZXJmYWNlcy5jb250cm9sbGVyLmNyZWF0ZURpdk5vZGUobWFpbldpbmRvdyk7XG5cdFx0bm9kZXMucm9vdE5vZGUuY2xhc3NOYW1lID0gJ1BpY3RyZS1zcGxhc2gtd3JhcHBlcic7XG5cdFx0bm9kZXMucm9vdE5vZGUuc3R5bGUuekluZGV4ID0gOTk4O1xuXHR9XG5cdGlmICghcGFyZW50Tm9kZUNhY2hlW3BhcmVudE5vZGUubm9kZU5hbWVdKSB7XG5cdFx0cGFyZW50Tm9kZUNhY2hlW3BhcmVudE5vZGUubm9kZU5hbWVdID0gcGFyZW50Tm9kZTtcblx0XHRwYXJlbnROb2RlLmFwcGVuZENoaWxkKG5vZGVzLnJvb3ROb2RlKTtcblx0fVxuXG5cdC8vIHNldCB0aGVzZSBwcm9wZXJ0aWVzIGV2ZXJ5IHRpbWUsIGluIGNhc2UgbW9kYWwgZ2V0cyB1c2VkIGJ5XG5cdC8vIGFub3RoZXIgYXBwbGljYXRpb24gY29tcG9uZW50IHdpdGggZGlmZmVyZW50IHZhbHVlc1xuXHRJbnRlcmZhY2VzLm1vZGFsLnNldFRpdGxlKCdQaWN0cmUnKTtcblx0SW50ZXJmYWNlcy5tb2RhbC5zZXRCb2R5KFwiPGIgY2xhc3M9J2JyYW5kJz5QaWN0cmU8L2I+IDxzcGFuPmlzIGEgY29sbGVjdGlvbiBvZiBjbG91ZCBwaG90byBhbGJ1bXMuIFlvdSBjYW4gdmlldyBvciBjcmVhdGUgcGljdHVyZSBhbGJ1bXMgYmFzZWQgb24gaW50ZXJlc3RzLCBwZW9wbGUsIG9yIGZhbWlsaWVzLiA8L3NwYW4+XCIgK1xuXHRcdFwiPHNwYW4+VG8gZ2V0IHN0YXJ0ZWQsIHNpbXBseSB0eXBlIGFuIGFsYnVtIG5hbWUgYmVsb3cuPC9zcGFuPlwiKTtcblxuXHR2YXIgYWxidW1JbnB1dCA9IEludGVyZmFjZXMuY29udHJvbGxlci5jcmVhdGVOb2RlKG1haW5XaW5kb3csICdpbnB1dCcpO1xuXHRhbGJ1bUlucHV0Lm1heGxlbmd0aCA9IDEwMDtcblx0YWxidW1JbnB1dC5jbGFzc05hbWUgPSAnUGljdHJlLXBhc3Njb2RlLWlucHV0Jztcblx0YWxidW1JbnB1dC50eXBlID0gJ3RleHQ7J1xuXHRhbGJ1bUlucHV0LnBsYWNlaG9sZGVyID0gJ0VudGVyIGFuIGFsYnVtIG5hbWUnO1xuXHRhbGJ1bUlucHV0LnN0eWxlLmNvbG9yID0gJ3doaXRlJztcblxuXHRTcGxhc2hJbnRlcmZhY2UuYXR0YWNoSW5wdXRzKEludGVyZmFjZXMsIEV2ZW50cywgQ2xpZW50LCBtYWluV2luZG93KTtcblxuXHRJbnRlcmZhY2VzLm92ZXJsYXkuc2hvdyhtYWluV2luZG93KTtcblx0SW50ZXJmYWNlcy5tb2RhbC5zaG93KEludGVyZmFjZXMsIEV2ZW50cywgbWFpbldpbmRvdywgcGFyZW50Tm9kZSk7XG5cblx0SW50ZXJmYWNlcy5jb250cm9sbGVyLnNldE5vZGVPdmVyZmxvd0hpZGRlbihtYWluV2luZG93LmRvY3VtZW50LmJvZHkpO1xuXHRJbnRlcmZhY2VzLm92ZXJsYXkubG9jaygpO1xuXG5cdG5vZGVzLmlucHV0Tm9kZS5nZXROb2RlKCkuZm9jdXMoKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTcGxhc2hJbnRlcmZhY2U7IiwiLyoqXG4gKiBXYXJuaW5nIGludGVyZmFjZS4gRGlzcGxheXMgZXJyb3JzLCB3YXJuaW5ncywgZGlhbG9ndWVzLlxuICovXG5cbnZhciBXYXJuaW5nSW50ZXJmYWNlID0ge1xuXG5cdGRvbUVsZW1lbnQ6IG51bGwsXG5cdHJlc3BvbnNlOiBudWxsLFxuXG5cdC8qKlxuXHQgKiBDcmVhdGVzIGFuZCBkaXNwbGF5cyB3YXJuaW5nIGludGVyZmFjZS5cblx0ICogQHBhcmFtIHByb3BlcnRpZXMgW29iamVjdF0gY29udGFpbmluZyBpbnRlcmZhY2Ugc2V0dGluZ3MgdG8gb3ZlcnJpZGVcblx0ICpcblx0ICovXG5cdHB1dDogZnVuY3Rpb24ocHJvcGVydGllcykge1xuXG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdFx0dmFyIHNldHRpbmdzID0ge1xuXG5cdFx0XHRib2R5OiAnQW4gZXJyb3IgaGFzIG9jY3VycmVkLCBkb25cXCd0IHdvcnJ5IHRob3VnaCwgaXRcXCdzIG5vdCB5b3VyIGZhdWx0IScsXG5cdFx0XHRkcm9wem9uZTogZmFsc2UsXG5cdFx0XHRoZWFkZXI6ICdIZXkhJyxcblx0XHRcdGljb246IG51bGwsXG5cdFx0XHRsb2NrZWQ6IGZhbHNlLFxuXHRcdFx0c3R5bGU6IHRydWUsXG5cdFx0XHRtb2RhbDogdHJ1ZVxuXG5cdFx0fTtcblxuXHRcdGlmIChwcm9wZXJ0aWVzKSB7XG5cblx0XHRcdGZvciAodmFyIGkgaW4gcHJvcGVydGllcykge1xuXHRcdFx0XHRzZXR0aW5nc1tpXSA9IHByb3BlcnRpZXNbaV07XG5cdFx0XHR9XG5cblx0XHR9XG5cblx0XHRpZiAoIXNldHRpbmdzLm1vZGFsKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8vLy0tLVxuXHRcdGlmIChQaWN0cmUuZ2FsbGVyeS5pcy5mZWF0dXJpbmcgJiYgc2V0dGluZ3MubG9ja2VkKSB7XG5cdFx0XHRQaWN0cmUuX3N0b3JhZ2Uub3ZlcmxheS5sb2NrZWQgPSBmYWxzZTtcblx0XHRcdFBpY3RyZS5nYWxsZXJ5Lm92ZXJsYXkuZXhpdCgpO1xuXHRcdH1cblxuXHRcdHRoaXMuZG9tRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG5cdFx0dGhpcy5kb21FbGVtZW50LmNsYXNzTmFtZSA9IFwiUGljdHJlLXVwbG9hZCBQaWN0cmUtd2FybmluZ1wiO1xuXG5cdFx0UGljdHJlLmdhbGxlcnkuaXMud2FybmluZyA9IHRydWU7XG5cblx0XHRQaWN0cmUuZXh0ZW5kKFBpY3RyZS5nYWxsZXJ5Lm92ZXJsYXkucHV0KCkuYXBwZW5kQ2hpbGQodGhpcy5kb21FbGVtZW50KSkub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHR9KTtcblxuXHRcdHRoaXMucG9zaXRpb24oKTtcblxuXHRcdFBpY3RyZS5ldmVudHMub24oJ3Jlc2l6ZScsIGZ1bmN0aW9uKCkge1xuXHRcdFx0c2VsZi5wb3NpdGlvbigpO1xuXHRcdH0pO1xuXG5cdFx0dmFyIGhlYWRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG5cdFx0aGVhZGVyLmNsYXNzTmFtZSA9IFwiUGljdHJlLXVwbG9hZC1oZWFkZXJcIjtcblx0XHRoZWFkZXIuaW5uZXJIVE1MID0gc2V0dGluZ3MuaGVhZGVyO1xuXHRcdGhlYWRlci5zdHlsZS56SW5kZXggPSBcIjk5OVwiO1xuXG5cdFx0dmFyIHAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwicFwiKTtcblx0XHRwLmNsYXNzTmFtZSA9IFwiUGljdHJlLXdhcm5pbmctcFwiO1xuXHRcdHAuaW5uZXJIVE1MID0gc2V0dGluZ3MuYm9keSB8fCBcIlVudGl0bGVkIHRleHRcIjtcblxuXHRcdHRoaXMuZG9tRWxlbWVudC5hcHBlbmRDaGlsZChoZWFkZXIpO1xuXG5cdFx0aWYgKHNldHRpbmdzLmRyb3B6b25lKSB7XG5cdFx0XHR2YXIgc2hhZGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblx0XHRcdHNoYWRlci5jbGFzc05hbWUgPSBcIlBpY3RyZS11cGxvYWQtYXJlYS1zaGFkZXJcIjtcblx0XHRcdHNoYWRlci5hcHBlbmRDaGlsZChwKTtcblx0XHRcdHZhciBhcmVhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblx0XHRcdGFyZWEuY2xhc3NOYW1lID0gXCJQaWN0cmUtdXBsb2FkLWFyZWFcIjtcblx0XHRcdGFyZWEuYXBwZW5kQ2hpbGQoc2hhZGVyKTtcblx0XHRcdHRoaXMuZG9tRWxlbWVudC5hcHBlbmRDaGlsZChhcmVhKTtcblx0XHRcdGFyZWEuc3R5bGUubWFyZ2luTGVmdCA9ICgtYXJlYS5jbGllbnRXaWR0aCAvIDIpICsgXCJweFwiO1xuXHRcdFx0YXJlYS5zdHlsZS5tYXJnaW5Ub3AgPSAoLWFyZWEuY2xpZW50SGVpZ2h0IC8gMiArIDIwKSArIFwicHhcIjtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gbm90IHVwbG9hZCBpbnRlcmZhY2UsIHdhcm5pbmcgdWkgaW5zdGVhZFxuXHRcdFx0dGhpcy5kb21FbGVtZW50LmFwcGVuZENoaWxkKHApO1xuXHRcdFx0cC5zdHlsZS5tYXJnaW5Ub3AgPSAoKHRoaXMuZG9tRWxlbWVudC5jbGllbnRIZWlnaHQgLSBoZWFkZXIuY2xpZW50SGVpZ2h0KSAvIDIgLSAocC5jbGllbnRIZWlnaHQgLyAyKSkgKyBcInB4XCI7XG5cblx0XHRcdGhlYWRlci5zdHlsZS50b3AgPSAoLXAuY2xpZW50SGVpZ2h0KSArICdweCc7XG5cdFx0fVxuXG5cdFx0aWYgKHNldHRpbmdzLmljb24pIHtcblxuXHRcdFx0dmFyIGljb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW1nXCIpO1xuXHRcdFx0aWNvbi5zcmMgPSBzZXR0aW5ncy5pY29uO1xuXHRcdFx0aWNvbi5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiO1xuXHRcdFx0aWNvbi5zdHlsZS5tYXJnaW4gPSBcIjIwcHggYXV0byAwIGF1dG9cIjtcblxuXHRcdFx0cC5hcHBlbmRDaGlsZChpY29uKTtcblxuXHRcdH1cblxuXHRcdGlmIChzZXR0aW5ncy5sb2NrZWQpIHtcblx0XHRcdFBpY3RyZS5fc3RvcmFnZS5vdmVybGF5LmxvY2tlZCA9IHRydWU7XG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiB0aGlzLm9uY2xpY2sgPT0gJ2Z1bmN0aW9uJykge1xuXG5cdFx0XHRpZiAoc2V0dGluZ3MuZHJvcHpvbmUpIHtcblxuXHRcdFx0XHRQaWN0cmUuZXh0ZW5kKGFyZWEpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHNlbGYub25jbGljaygpO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0fSBlbHNlIHtcblxuXHRcdFx0XHRQaWN0cmUuZXh0ZW5kKHRoaXMuZG9tRWxlbWVudCkub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0c2VsZi5vbmNsaWNrKCk7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHR9XG5cblx0XHR9XG5cdH0sXG5cblx0b25jbGljazogbnVsbCxcblxuXHRwb3NpdGlvbjogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKHRoaXMuZG9tRWxlbWVudCkge1xuXHRcdFx0dGhpcy5kb21FbGVtZW50LnN0eWxlLmxlZnQgPSBNYXRoLm1heCgkKHdpbmRvdykud2lkdGgoKSAvIDIgLSAodGhpcy5kb21FbGVtZW50LmNsaWVudFdpZHRoIC8gMiksIDApICsgXCJweFwiO1xuXHRcdFx0dGhpcy5kb21FbGVtZW50LnN0eWxlLnRvcCA9IE1hdGgubWF4KCgkKHdpbmRvdykuaGVpZ2h0KCkgLyAyIC0gKHRoaXMuZG9tRWxlbWVudC5jbGllbnRIZWlnaHQgLyAyKSksIDApICsgXCJweFwiO1xuXHRcdH1cblx0fSxcblxuXHRyZW1vdmU6IGZ1bmN0aW9uKCkge1xuXHRcdFBpY3RyZS5nYWxsZXJ5LmlzLndhcm5pbmcgPSBmYWxzZTtcblx0XHRQaWN0cmUuZ2FsbGVyeS5vdmVybGF5LmV4aXQoKTtcblx0XHR0aGlzLmRvbUVsZW1lbnQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLmRvbUVsZW1lbnQpO1xuXHRcdHRoaXMuZG9tRWxlbWVudCA9IG51bGw7XG5cdH1cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFdhcm5pbmdJbnRlcmZhY2U7IiwiLyoqXG4gKiBNb2R1bGUgZm9yIGhhbmRsaW5nIHNlcnZlciByZXF1ZXRzXG4gKi9cblxudmFyIEVudmlyb25tZW50ID0gcmVxdWlyZSgnLi9lbnZpcm9ubWVudC5qcycpO1xudmFyIFNlcnZlciA9IHt9O1xuXG5TZXJ2ZXIuY29tcG9uZW50cyA9IHtcblx0YW5jaG9yOiAwLFxuXHRoZWFkOiBFbnZpcm9ubWVudC5pdGVtQW1vdW50UGFnZUxvYWRcbn1cblxuLy8gL2FwaS9hbGJ1bS88YWxidW1uYW1lPi9mcm9tPDA+L3RvbGltaXQ8MTAwPlxuU2VydmVyLmdldCA9IGZ1bmN0aW9uKGVuZHBvaW50LCBjYWxsYmFjaykge1xuXHR2YXIgcmVxdWVzdCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXHRyZXF1ZXN0Lm9wZW4oJ0dFVCcsIGVuZHBvaW50LCB0cnVlKTtcblxuXHRpZiAod2luZG93LlhEb21haW5SZXF1ZXN0KSB7XG5cdFx0dmFyIHhkciA9IG5ldyBYRG9tYWluUmVxdWVzdCgpO1xuXHRcdHhkci5vcGVuKFwiZ2V0XCIsIGVuZHBvaW50KTtcblx0XHR4ZHIuc2VuZChudWxsKTtcblx0XHR4ZHIub25sb2FkID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRjYWxsYmFjay5jYWxsKHhkciwgbnVsbCwgeGRyLnJlc3BvbnNlVGV4dCk7XG5cdFx0fTtcblx0XHR4ZHIub25lcnJvciA9IGZ1bmN0aW9uKGVycm9yKSB7XG5cdFx0XHRjYWxsYmFjay5jYWxsKHhkciwgZXJyb3IsIG51bGwpO1xuXHRcdH07XG5cdH0gZWxzZSB7XG5cdFx0JC5zdXBwb3J0LmNvcnMgPSB0cnVlO1xuXHRcdCQuYWpheCh7XG5cdFx0XHR0eXBlOiAnR0VUJyxcblx0XHRcdHVybDogZW5kcG9pbnQsXG5cdFx0XHRhc3luYzogdHJ1ZSxcblx0XHRcdGNyb3NzRG9tYWluOiB0cnVlLFxuXHRcdFx0c3VjY2VzczogZnVuY3Rpb24oZGF0YSkge1xuXHRcdFx0XHRjYWxsYmFjay5jYWxsKHRoaXMsIG51bGwsIGRhdGEpO1xuXHRcdFx0fSxcblx0XHRcdGVycm9yOiBmdW5jdGlvbihlcnJvcikge1xuXHRcdFx0XHRjYWxsYmFjay5jYWxsKHRoaXMsIGVycm9yLCBudWxsKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxufTtcblxuLy8gcmV0cmlldmVzIGFsYnVtIGltYWdlcyBzdGFydGluZyBhdCBzcGVjaWZpYyBpbmRleFxuU2VydmVyLmdldEFsYnVtQXRBbmNob3IgPSBmdW5jdGlvbihhbGJ1bU5hbWUsIGZyb20sIHRvLCBjYWxsYmFjaykge1xuXHRTZXJ2ZXIuZ2V0KCcvYXBpL2FsYnVtLycgKyBhbGJ1bU5hbWUgKyAnLycgKyBmcm9tICsgJy8nICsgdG8sIGZ1bmN0aW9uKGVyciwgcmVzcG9uc2UpIHtcblx0XHRpZiAoZXJyKSB7XG5cdFx0XHRyZXR1cm4gY2FsbGJhY2suY2FsbChTZXJ2ZXIsIGVyciwgbnVsbCk7XG5cdFx0fVxuXG5cdFx0dHJ5IHtcblx0XHRcdGNhbGxiYWNrLmNhbGwoU2VydmVyLCBudWxsLCByZXNwb25zZSk7XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0Y2FsbGJhY2suY2FsbChTZXJ2ZXIsIGUsIG51bGwpO1xuXHRcdH1cblx0fSk7XG59O1xuXG5TZXJ2ZXIuZ2V0QWxidW0gPSBmdW5jdGlvbihhbGJ1bU5hbWUsIGNhbGxiYWNrKSB7XG5cdFNlcnZlci5nZXRBbGJ1bUF0QW5jaG9yKGFsYnVtTmFtZSwgU2VydmVyLmNvbXBvbmVudHMuYW5jaG9yLCBTZXJ2ZXIuY29tcG9uZW50cy5oZWFkLCBjYWxsYmFjayk7XG59O1xuXG5TZXJ2ZXIuc2V0UmVxdWVzdEFuY2hvciA9IGZ1bmN0aW9uKGRhdGEpIHtcblx0U2VydmVyLmNvbXBvbmVudHMuYW5jaG9yID0gZGF0YTtcbn07XG5cblNlcnZlci5zZXRSZXF1ZXN0SGVhZCA9IGZ1bmN0aW9uKGRhdGEpIHtcblx0U2VydmVyLmNvbXBvbmVudHMuaGVhZCA9IGRhdGE7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gU2VydmVyOyIsIi8qKlxuICogSGVscGVyIGZ1bmN0aW9uc1xuICovXG5cbnZhciBVdGlsaXRpZXMgPSB7fTtcblxuVXRpbGl0aWVzLmV4dGVuZCA9IGZ1bmN0aW9uKGRvbU9iamVjdCkge1xuXG5cdHJldHVybiB7XG5cdFx0b246IGZ1bmN0aW9uKHR5cGUsIGNhbGxiYWNrKSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRkb21PYmplY3QuYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRcdFx0aWYgKHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nKSBjYWxsYmFjay5jYWxsKGRvbU9iamVjdCwgZSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRkb21PYmplY3QuYXR0YWNoRXZlbnQoJ29uJyArIHR5cGUsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdFx0XHRpZiAodHlwZW9mIGNhbGxiYWNrID09ICdmdW5jdGlvbicpIGNhbGxiYWNrLmNhbGwoZG9tT2JqZWN0LCBlKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gVXRpbGl0aWVzOyJdfQ==
