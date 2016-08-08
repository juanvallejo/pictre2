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

	Client.init();

	if (Interfaces.board.isSet()) {
		// if (Board.get().toLowerCase().match(/[^a-z0-9\-\.\+\_]/gi)) {
		// 	var err = document.createElement("p");
		// 	err.innerHTML = "404. The album you are looking for cannot be found.";
		// 	err.className = "Pictre-home-wrapper-about";
		// 	Pictre.get.ui.notice("This album does not exist as it contains invalid characters in its name.");
		// 	err.appendChild(spacer);
		// 	Pictre.get.ui.splash.put("This album does not exist as it contains invalid characters in its name.");

		// } else if (Pictre._settings.pages.restricted.indexOf(Pictre.board.get().toLowerCase()) != -1) {
		// 	var err = document.createElement("p");
		// 	err.innerHTML = "403. The album you are looking for is restricted. Try another one by typing it above or type another album address.";
		// 	err.className = "Pictre-home-wrapper-about";
		// 	Pictre.get.ui.notice("This album is private or restricted. Please try another one.");
		// 	err.appendChild(spacer);
		// 	Pictre.get.ui.splash.put("This album is private or restricted.");

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
},{"./client.js":"/Volumes/TINY/Documents/Pictre-pro/src/client.js","./environment.js":"/Volumes/TINY/Documents/Pictre-pro/src/environment.js","./events.js":"/Volumes/TINY/Documents/Pictre-pro/src/events.js","./interface.js":"/Volumes/TINY/Documents/Pictre-pro/src/interface.js"}],"/Volumes/TINY/Documents/Pictre-pro/src/client.js":[function(require,module,exports){
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

Environment.inProduction 	= false;
Environment.isUpdating 		= false;

Environment.animationSpeed 	= 1000;
Environment.maxImageWidth 	= 800;

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
Events.onNodeEvent = function(node, eventName, callback) {
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
 * Board interface module
 */

var Environment = require('../environment.js');

// private fields and functions
var isSet = false;
var nodes = {
	notice: null
};

var parentNodeCache = {};
var restrictedNames = [
	'data',
	'restricted',
	'404',
	'undefined'
];

var Board = {};

Board.isNameRestricted = function(name) {
	return restrictedNames.indexOf(name) != -1;
};

Board.isNameInvalid = function(name) {
	return name.match(/[^a-z0-9\-\.\+\_\ ]/gi);
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

Board.putNotice = function(mainWindow, parentNode, text) {
	if (!text) {
		console.log('WARN', 'BOARD', 'NOTICE', 'A notice attempt was made with no text.');
		return;
	}
	if (!parentNode) {
		console.log('WARN', 'BOARD', 'NOTICE', 'A notice attempt was made with no parentNode passed.');
		return;
	}
	if (!nodes.notice) {
		console.log('WARN', 'BOARD', 'NOTICE', 'A notice attempt was made without initializing the Board.');
		return;
	}

	if (!nodes.notice) {
		nodes.notice = mainWindow.document.createElement('div');
		nodes.notice.className = 'Pictre-notice';
	}
	if (!parentNodeCache[parentNode.nodeName]) {
		parentNodeCache[parentNode.nodeName] = parentNode;
		parentNode.appendChild(nodes.notice);
	}

	nodes.notice.innerHTML = text;

};

Board.removeNotice = function(parentNode) {
	if (!parentNodeCache[parentNode.nodeName]) {
		console.log('WARN', 'BOARD', 'NOTICE', 'An attempt was made to remove a board notice from an invalid parentNode.');
		return false;
	}

	parentNode.removeChild(nodes.notice);
	parentNodeCache[parentNode.nodeName] = null;
	return true;
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
			window.location.href = Pictre._settings.app.address;
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
 */

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
	alertDuration: 10000
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

Modal.create = function(Interfaces, Events, Client, mainWindow, parentNode) {
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
Modal.show = function(Interfaces, Events, Client, mainWindow, parentNode, inputsArray) {
	if (!isCreated) {
		isCreated = true;
		Modal.create(Interfaces, Events, Client, mainWindow, parentNode);
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
},{}],"/Volumes/TINY/Documents/Pictre-pro/src/interfaces/overlay.js":[function(require,module,exports){
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
	if (!nodes.rootNode) {
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
	Interfaces.modal.show(Interfaces, Events, Client, mainWindow, parentNode);

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
},{}],"/Volumes/TINY/Documents/Pictre-pro/src/utilities.js":[function(require,module,exports){
/**
 * Helper functions
 */

var Utilities = {};

Utilities.extend = function(domObject) {

	return {
		on: function(type, callback) {
			try {
				domObject.addEventListener(type,function(e) {
					if(typeof callback == 'function') callback.call(domElement, e);
				});
			} catch(e) {
				domObject.attachEvent('on' + type,function(e) {
					if(typeof callback == 'function') callback.call(domElement,e);
				});
			}
		}
	};

}

module.exports = Utilities;
},{}]},{},["./src/main.js"])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvbWFpbi5qcyIsInNyYy9jbGllbnQuanMiLCJzcmMvZW52aXJvbm1lbnQuanMiLCJzcmMvZXZlbnRzLmpzIiwic3JjL2ludGVyZmFjZS5qcyIsInNyYy9pbnRlcmZhY2VzL2JvYXJkLmpzIiwic3JjL2ludGVyZmFjZXMvY29udHJvbGxlci5qcyIsInNyYy9pbnRlcmZhY2VzL2dhbGxlcnkuanMiLCJzcmMvaW50ZXJmYWNlcy9pbmRleC5qcyIsInNyYy9pbnRlcmZhY2VzL21lbnUuanMiLCJzcmMvaW50ZXJmYWNlcy9tb2RhbC5qcyIsInNyYy9pbnRlcmZhY2VzL292ZXJsYXkuanMiLCJzcmMvaW50ZXJmYWNlcy9zcGxhc2guanMiLCJzcmMvaW50ZXJmYWNlcy93YXJuaW5nLmpzIiwic3JjL3V0aWxpdGllcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaE1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqIFBpY3RyZSBjbGllbnQgY29yZS4gVXNlcyBicm93c2VyaWZ5IHRvIG1haW50YWluXG4gKiBOb2RlLWxpa2UgbW9kdWxhciBzdHJ1Y3R1cmUuIERvICducG0gaW5zdGFsbCcgaW4gb3JkZXJcbiAqIHRvIG9idGFpbiBhbGwgcmVxdWlyZWQgZGV2IHBhY2thZ2VzLiBCdWlsZCBzeXN0ZW0gaXMgJ2d1bHAnLlxuICogQnVpbGRzIHRvICcvZGlzdC9QaWN0cmUuanMnLlxuICpcbiAqIEBhdXRob3IganVhbnZhbGxlam9cbiAqIEBkYXRlIDUvMzEvMTVcbiAqL1xuXG52YXIgQ2xpZW50ID0gcmVxdWlyZSgnLi9jbGllbnQuanMnKTtcbnZhciBFbnZpcm9ubWVudCA9IHJlcXVpcmUoJy4vZW52aXJvbm1lbnQuanMnKTtcbnZhciBJbnRlcmZhY2VzID0gcmVxdWlyZSgnLi9pbnRlcmZhY2UuanMnKTtcbnZhciBFdmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cy5qcycpO1xuXG52YXIgUGljdHJlID0ge307XG5cbi8qKlxuICogSW5pdGlhbGl6ZXMgYXBwbGljYXRpb24gdmFyaWFibGVzIGFuZCBkZWZhdWx0IHNldHRpbmdzLlxuICpcbiAqIEBwYXJhbSBhcHBsaWNhdGlvbldyYXBwZXIgXHRbU3RyaW5nXSBkb20gZWxlbWVudCBpZCBvZiBhcHBsaWNhdGlvbiBjb250YWluZXJcbiAqIEBwYXJhbSByZXNvdXJjZUxvY2F0aW9uIFx0XHRbU3RyaW5nXSB1cmwgb2YgY2xvdWQgZGlyZWN0b3J5IGNvbnRhaW5pbmcgYWxsIGltYWdlc1xuICogQHBhcmFtIGFwcERhdGFMb2NhdGlvbiBcdFx0W1N0cmluZ10gdXJsIG9mIGNsb3VkIGRpcmVjdG9yeSBjb250YWluaW5nIGFwcGxpY2F0aW9uIGZpbGVzXG4gKi9cblBpY3RyZS5pbml0ID0gZnVuY3Rpb24obWFpbldpbmRvdywgYXBwbGljYXRpb25XcmFwcGVyLCByZXNvdXJjZUxvY2F0aW9uLCBhcHBEYXRhTG9jYXRpb24sIGRldmVsb3Blck1vZGUpIHtcblx0dmFyIHNwYWNlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG5cdHNwYWNlci5jbGFzc05hbWUgPSBcIlBpY3RyZS1zcGFjZXJcIjtcblxuXHRpZiAocmVzb3VyY2VMb2NhdGlvbikge1xuXHRcdEVudmlyb25tZW50LmNsb3VkLmRhdGFkaXIgPSByZXNvdXJjZUxvY2F0aW9uO1xuXHR9XG5cdGlmIChhcHBEYXRhTG9jYXRpb24pIHtcblx0XHRFbnZpcm9ubWVudC5jbG91ZC5hZGRyZXNzID0gYXBwRGF0YUxvY2F0aW9uO1xuXHR9XG5cdGlmICghZGV2ZWxvcGVyTW9kZSkge1xuXHRcdEVudmlyb25tZW50LmluUHJvZHVjdGlvbiA9IHRydWU7XG5cdH1cblxuXHQvLyBjcmVhdGUgYW5kIHBsYWNlIG1lbnUgYmVmb3JlIGFwcGxpY2F0aW9uIHdyYXBwZXJcblx0SW50ZXJmYWNlcy5tZW51LnB1dChtYWluV2luZG93LmRvY3VtZW50LmJvZHksIGFwcGxpY2F0aW9uV3JhcHBlcik7XG5cblx0Q2xpZW50LmluaXQoKTtcblxuXHRpZiAoSW50ZXJmYWNlcy5ib2FyZC5pc1NldCgpKSB7XG5cdFx0Ly8gaWYgKEJvYXJkLmdldCgpLnRvTG93ZXJDYXNlKCkubWF0Y2goL1teYS16MC05XFwtXFwuXFwrXFxfXS9naSkpIHtcblx0XHQvLyBcdHZhciBlcnIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwicFwiKTtcblx0XHQvLyBcdGVyci5pbm5lckhUTUwgPSBcIjQwNC4gVGhlIGFsYnVtIHlvdSBhcmUgbG9va2luZyBmb3IgY2Fubm90IGJlIGZvdW5kLlwiO1xuXHRcdC8vIFx0ZXJyLmNsYXNzTmFtZSA9IFwiUGljdHJlLWhvbWUtd3JhcHBlci1hYm91dFwiO1xuXHRcdC8vIFx0UGljdHJlLmdldC51aS5ub3RpY2UoXCJUaGlzIGFsYnVtIGRvZXMgbm90IGV4aXN0IGFzIGl0IGNvbnRhaW5zIGludmFsaWQgY2hhcmFjdGVycyBpbiBpdHMgbmFtZS5cIik7XG5cdFx0Ly8gXHRlcnIuYXBwZW5kQ2hpbGQoc3BhY2VyKTtcblx0XHQvLyBcdFBpY3RyZS5nZXQudWkuc3BsYXNoLnB1dChcIlRoaXMgYWxidW0gZG9lcyBub3QgZXhpc3QgYXMgaXQgY29udGFpbnMgaW52YWxpZCBjaGFyYWN0ZXJzIGluIGl0cyBuYW1lLlwiKTtcblxuXHRcdC8vIH0gZWxzZSBpZiAoUGljdHJlLl9zZXR0aW5ncy5wYWdlcy5yZXN0cmljdGVkLmluZGV4T2YoUGljdHJlLmJvYXJkLmdldCgpLnRvTG93ZXJDYXNlKCkpICE9IC0xKSB7XG5cdFx0Ly8gXHR2YXIgZXJyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInBcIik7XG5cdFx0Ly8gXHRlcnIuaW5uZXJIVE1MID0gXCI0MDMuIFRoZSBhbGJ1bSB5b3UgYXJlIGxvb2tpbmcgZm9yIGlzIHJlc3RyaWN0ZWQuIFRyeSBhbm90aGVyIG9uZSBieSB0eXBpbmcgaXQgYWJvdmUgb3IgdHlwZSBhbm90aGVyIGFsYnVtIGFkZHJlc3MuXCI7XG5cdFx0Ly8gXHRlcnIuY2xhc3NOYW1lID0gXCJQaWN0cmUtaG9tZS13cmFwcGVyLWFib3V0XCI7XG5cdFx0Ly8gXHRQaWN0cmUuZ2V0LnVpLm5vdGljZShcIlRoaXMgYWxidW0gaXMgcHJpdmF0ZSBvciByZXN0cmljdGVkLiBQbGVhc2UgdHJ5IGFub3RoZXIgb25lLlwiKTtcblx0XHQvLyBcdGVyci5hcHBlbmRDaGlsZChzcGFjZXIpO1xuXHRcdC8vIFx0UGljdHJlLmdldC51aS5zcGxhc2gucHV0KFwiVGhpcyBhbGJ1bSBpcyBwcml2YXRlIG9yIHJlc3RyaWN0ZWQuXCIpO1xuXG5cdFx0Ly8gfSBlbHNlIHtcblx0XHQvLyBcdFBpY3RyZS5ib2FyZC5leGlzdHMgPSB0cnVlO1xuXHRcdC8vIFx0dmFyIHdyYXBwZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuXHRcdC8vIFx0d3JhcHBlci5pZCA9IFwiUGljdHJlLXdyYXBwZXJcIjtcblx0XHQvLyBcdGFwcGxpY2F0aW9uV3JhcHBlci5hcHBlbmRDaGlsZCh3cmFwcGVyKTtcblx0XHQvLyBcdHRoaXMuc2V0LndyYXBwZXIod3JhcHBlcik7XG5cdFx0Ly8gXHRQaWN0cmUuZ2V0LnVpLm5vdGljZShcIkxvYWRpbmcsIHBsZWFzZSB3YWl0Li4uXCIpO1xuXHRcdC8vIFx0UGljdHJlLmdldC5kYih7XG5cdFx0Ly8gXHRcdGFsYnVtOiB0cnVlLFxuXHRcdC8vIFx0XHRyZXNvdXJjZTogJ2FsYnVtJyxcblx0XHQvLyBcdFx0bGltaXQ6IFBpY3RyZS5fc2V0dGluZ3MuZGF0YS5saW1pdC5wYWdlbG9hZFxuXHRcdC8vIFx0fSwgZnVuY3Rpb24oZGF0YSkge1xuXG5cdFx0Ly8gXHRcdC8vIGRldGVjdCAnbG9hZGluZyBiYXInIGRlbW9cblx0XHQvLyBcdFx0aWYgKFBpY3RyZS5fc2V0dGluZ3MuZGVtby5sb2FkZXIpIHtcblxuXHRcdC8vIFx0XHRcdGNvbnNvbGUubG9nKFwiV2FybmluZzogbG9hZGVyIGRlbW8gYWN0aXZlLlwiKTtcblxuXHRcdC8vIFx0XHRcdChmdW5jdGlvbiBkZW1vKG4sIHQpIHtcblx0XHQvLyBcdFx0XHRcdGlmICh0KSBjbGVhclRpbWVvdXQodCk7XG5cdFx0Ly8gXHRcdFx0XHR0ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHQvLyBcdFx0XHRcdFx0UGljdHJlLmdldC51aS5sb2FkZXIucHV0KG4pO1xuXHRcdC8vIFx0XHRcdFx0XHRuICs9IDAuMDAyO1xuXHRcdC8vIFx0XHRcdFx0XHRpZiAobiA+PSAwLjk5NSkgbiA9IDA7XG5cdFx0Ly8gXHRcdFx0XHRcdGRlbW8obiwgdCk7XG5cdFx0Ly8gXHRcdFx0XHR9LCAxMDAwIC8gNjApO1xuXHRcdC8vIFx0XHRcdH0pKDApO1xuXG5cdFx0Ly8gXHRcdH0gZWxzZSB7XG5cdFx0Ly8gXHRcdFx0UGljdHJlLmxvYWQoZGF0YSk7XG5cdFx0Ly8gXHRcdH1cblxuXHRcdC8vIFx0fSk7XG5cblx0XHQvLyBcdFBpY3RyZS5ldmVudHMub24oJ2RyYWdvdmVyJywgZnVuY3Rpb24oKSB7XG5cdFx0Ly8gXHRcdGlmICghUGljdHJlLmdhbGxlcnkuaXMuZmVhdHVyaW5nICYmICFQaWN0cmUuaXMuc3BvdGxpZ2h0ICYmIFBpY3RyZS5fc2V0dGluZ3MuYWxsb3dVcGxvYWRzKSBQaWN0cmUuZ2V0LnVpLnVwbG9hZC5wdXQoKTtcblx0XHQvLyBcdH0pO1xuXG5cdFx0Ly8gXHRQaWN0cmUuZXZlbnRzLm9uKCdoYXNoY2hhbmdlJywgZnVuY3Rpb24oKSB7XG5cdFx0Ly8gXHRcdFBpY3RyZS5nZXQuaGFzaCgpO1xuXHRcdC8vIFx0fSk7XG5cdFx0Ly8gfVxuXHR9IGVsc2Uge1xuXHRcdC8vIHNob3cgbWFpbiB2aWV3XG5cdFx0SW50ZXJmYWNlcy5zcGxhc2guc2hvdyhJbnRlcmZhY2VzLCBFdmVudHMsIENsaWVudCwgbWFpbldpbmRvdywgbWFpbldpbmRvdy5kb2N1bWVudC5ib2R5KTtcblx0XHRpZiAoRW52aXJvbm1lbnQuaXNVcGRhdGluZykge1xuXHRcdFx0SW50ZXJmYWNlcy5zcGxhc2guc2hvd0FsZXJ0KEludGVyZmFjZXMsICdVcGRhdGVzIGFyZSBjdXJyZW50bHkgaW4gcHJvZ3Jlc3MuLi4nKTtcblx0XHR9XG5cdH1cbn1cblxud2luZG93LlBpY3RyZSA9IFBpY3RyZTsiLCIvKipcbiAqIENsaWVudCBtYW5hZ2VyIGZvciBhcHBsaWNhdGlvbiBydW50aW1lLiBQcm92aWRlcyB1dGlsaXRpZXMgYW5kXG4gKiBhd2FyZW5lc3Mgb2YgYnJvd3NlciBpbmZvcm1hdGlvbiAvIGNvbXBhdGliaWxpdHkuXG4gKlxuICogQGF1dGhvciBqdWFudmFsbGVqb1xuICogQGRhdGUgNi8xLzE1XG4gKi9cblxudmFyIEludGVyZmFjZSA9IHJlcXVpcmUoJy4vaW50ZXJmYWNlLmpzJyk7XG5cbnZhciBDbGllbnQgPSB7fTtcblxuLy8gaG9sZHMgYnJvd3NlciBuYW1lc1xuQ2xpZW50LmJyb3dzZXIgPSB7XG5cblx0VU5LTk9XTjogMCxcblx0Q0hST01FOiAxLFxuXHRTQUZBUkk6IDIsXG5cdE1PQklMRV9TQUZBUkk6IDMsXG5cdEZJUkVGT1g6IDQsXG5cdE9QRVJBOiA1LFxuXHRJRV9NT0RFUk46IDYsXG5cdElFX1VOU1VQUE9SVEVEOiA3LFxuXHRJRV9PVEhFUjogOFxuXG59O1xuXG4vKipcbiAqIGZsYWcgaW5kaWNhdGluZyBpZiB1c2luZyBjb21wYXRpYmxlIGJyb3dzZXJcbiAqL1xuQ2xpZW50LmNvbXBhdGlibGUgPSB0cnVlO1xuQ2xpZW50LmlkID0gQ2xpZW50LmJyb3dzZXIuVU5LTk9XTlxuQ2xpZW50Lm5hbWUgPSAnVW5rbm93bic7XG5DbGllbnQudmVyc2lvbiA9IDA7XG5cbkNsaWVudC5vcyA9IG5hdmlnYXRvci5wbGF0Zm9ybTtcbkNsaWVudC5vbmxpbmUgPSBuYXZpZ2F0b3Iub25MaW5lO1xuXG5DbGllbnQuZ2V0SWQgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIENsaWVudC5pZDtcbn07XG5cbkNsaWVudC5pc0lFID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiBDbGllbnQuaWQgPT0gQ2xpZW50LmJyb3dzZXIuSUVfTU9ERVJOIHx8IENsaWVudC5pZCA9PSBDbGllbnQuYnJvd3Nlci5JRV9VTlNVUFBPUlRFRCB8fCBDbGllbnQuaWQgPT0gQ2xpZW50LmJyb3dzZXIuSUVfT1RIRVI7XG59O1xuXG5DbGllbnQuaXNNb2JpbGVTYWZhcmkgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIENsaWVudC5pZCA9PSBDbGllbnQuYnJvd3Nlci5NT0JJTEVfU0FGQVJJO1xufTtcblxuQ2xpZW50LmlzU2FmYXJpID0gZnVuY3Rpb24odmVyc2lvbikge1xuXHRpZiAodmVyc2lvbikge1xuXHRcdHJldHVybiBDbGllbnQuaWQgPT0gQ2xpZW50LmJyb3dzZXIuU0FGQVJJICYmIENsaWVudC52ZXJzaW9uLnNwbGl0KCcnKS5pbmRleE9mKHZlcnNpb24pICE9IC0xO1xuXHR9XG5cdHJldHVybiBDbGllbnQuaWQgPT0gQ2xpZW50LmJyb3dzZXIuU0FGQVJJO1xufTtcblxuLyoqXG4gKiBDb2xsZWN0cyBpbmZvcm1hdGlvbiBhYm91dCBicm93c2VyIHZlcnNpb24sXG4gKiBjb21wYXRpYmlsaXR5LCBuYW1lLCBhbmQgZGlzcGxheSBpbmZvcm1hdGlvblxuICogYmFzZWQgb24gdXNlciBhZ2VudCBzdHJpbmcuXG4gKi9cbkNsaWVudC5pbml0ID0gZnVuY3Rpb24oKSB7XG5cblx0aWYgKG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZihcIkFwcGxlV2ViS2l0XCIpICE9IC0xKSB7XG5cblx0XHRpZiAobmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKFwiQ2hyb21lXCIpICE9IC0xKSB7XG5cdFx0XHRDbGllbnQubmFtZSA9IFwiQ2hyb21lXCI7XG5cdFx0XHRDbGllbnQuaWQgPSBDbGllbnQuYnJvd3Nlci5DSFJPTUU7XG5cdFx0fSBlbHNlIHtcblxuXHRcdFx0aWYgKG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZihcIk1vYmlsZVwiKSAhPSAtMSkge1xuXHRcdFx0XHRDbGllbnQubmFtZSA9IFwiTW9iaWxlIFNhZmFyaVwiO1xuXHRcdFx0XHRDbGllbnQuaWQgPSBDbGllbnQuYnJvd3Nlci5NT0JJTEVfU0FGQVJJO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Q2xpZW50Lm5hbWUgPSBcIlNhZmFyaVwiO1xuXHRcdFx0XHRDbGllbnQuaWQgPSBDbGllbnQuYnJvd3Nlci5TQUZBUkk7XG5cblx0XHRcdFx0dmFyIHZlcnNpb24gPSBuYXZpZ2F0b3IudXNlckFnZW50LnNwbGl0KFwiVmVyc2lvbi9cIik7XG5cdFx0XHRcdENsaWVudC52ZXJzaW9uID0gdmVyc2lvblsxXS5zcGxpdChcIiBcIilbMF07XG5cdFx0XHR9XG5cblx0XHR9XG5cblx0fSBlbHNlIHtcblxuXHRcdGlmIChuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoXCJGaXJlZm94XCIpICE9IC0xKSB7XG5cdFx0XHRDbGllbnQubmFtZSA9IFwiRmlyZWZveFwiO1xuXHRcdFx0Q2xpZW50LmlkID0gQ2xpZW50LmJyb3dzZXIuRklSRUZPWDtcblx0XHR9IGVsc2UgaWYgKG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZihcIk9wZXJhXCIpICE9IC0xKSB7XG5cdFx0XHRDbGllbnQubmFtZSA9IFwiT3BlcmFcIjtcblx0XHRcdENsaWVudC5pZCA9IENsaWVudC5icm93c2VyLk9QRVJBO1xuXHRcdH0gZWxzZSBpZiAobmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKFwiTVNJRSBcIikgIT0gLTEpIHtcblxuXHRcdFx0aWYgKG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZihcIlRyaWRlbnRcIikgIT0gLTEpIHtcblxuXHRcdFx0XHR2YXIgdmVyc2lvbiA9IG5hdmlnYXRvci51c2VyQWdlbnQuc3BsaXQoXCI7XCIpWzFdO1xuXHRcdFx0XHR2ZXJzaW9uID0gcGFyc2VJbnQodmVyc2lvbi5zcGxpdChcIiBcIilbMl0pO1xuXG5cdFx0XHRcdENsaWVudC5uYW1lID0gXCJJbnRlcm5ldCBFeHBsb3JlclwiO1xuXHRcdFx0XHRDbGllbnQudmVyc2lvbiA9IHZlcnNpb247XG5cblx0XHRcdFx0aWYgKHZlcnNpb24gPiA4KSB7XG5cdFx0XHRcdFx0Q2xpZW50LmlkID0gQ2xpZW50LmJyb3dzZXIuSUVfTU9ERVJOO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdENsaWVudC5pZCA9IENsaWVudC5icm93c2VyLklFX1VOU1VQUE9SVEVEO1xuXHRcdFx0XHR9XG5cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdENsaWVudC5uYW1lID0gXCJJbnRlcm5ldCBFeHBsb3JlclwiO1xuXHRcdFx0XHRDbGllbnQuaWQgPSBDbGllbnQuYnJvd3Nlci5JRV9PVEhFUjtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0Q2xpZW50Lm5hbWUgPSAnT3RoZXInO1xuXHRcdFx0Q2xpZW50LmlkID0gQ2xpZW50LmJyb3dzZXIuVU5LTk9XTjtcblx0XHR9XG5cblx0fVxuXG5cdC8vIERldGVjdCBpZiB1c2luZyBob3BlbGVzcyBicm93c2VyXG5cdGlmIChDbGllbnQuaWQgPT0gQ2xpZW50LmJyb3dzZXIuSUVfVU5TVVBQT1JURUQgfHwgQ2xpZW50LmlkID09IENsaWVudC5icm93c2VyLklFX09USEVSKSB7XG5cblx0XHR2YXIgd2FybmluZztcblx0XHR2YXIgbG9jayA9IGZhbHNlO1xuXHRcdHZhciBoZWFkZXIgPSAnU29ycnkgYWJvdXQgdGhhdCEnO1xuXG5cdFx0aWYgKENsaWVudC5pZCA9PSBDbGllbnQuYnJvd3Nlci5JRV9PVEhFUikge1xuXG5cdFx0XHR3YXJuaW5nID0gXCJVbmZvcnR1bmF0ZWx5IFBpY3RyZSBpcyBub3Qgc3VwcG9ydGVkIGluIHlvdXIgYnJvd3NlciwgcGxlYXNlIGNvbnNpZGVyIHVwZ3JhZGluZyB0byBHb29nbGUgQ2hyb21lLCBieSBjbGlja2luZyBoZXJlLCBmb3IgYW4gb3B0aW1hbCBicm93c2luZyBleHBlcmllbmNlLlwiO1xuXHRcdFx0bG9jayA9IHRydWU7XG5cblx0XHRcdEludGVyZmFjZS53YXJuaW5nLm9uY2xpY2sgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0d2luZG93Lm9wZW4oXCJodHRwOi8vY2hyb21lLmdvb2dsZS5jb21cIiwgXCJfYmxhbmtcIik7XG5cdFx0XHR9O1xuXG5cdFx0fSBlbHNlIHtcblxuXHRcdFx0aGVhZGVyID0gJ05vdGljZSEnO1xuXHRcdFx0d2FybmluZyA9IFwiU29tZSBvZiBQaWN0cmUncyBmZWF0dXJlcyBtYXkgbm90IGJlIGZ1bGx5IHN1cHBvcnRlZCBpbiB5b3VyIGJyb3dzZXIuXCI7XG5cblx0XHRcdEludGVyZmFjZS53YXJuaW5nLm9uY2xpY2sgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0dGhpcy5yZW1vdmUoKTtcblx0XHRcdH07XG5cblx0XHR9XG5cblx0XHRDbGllbnQuY29tcGF0aWJsZSA9IGZhbHNlO1xuXG5cdFx0SW50ZXJmYWNlLndhcm5pbmcucHV0KHtcblxuXHRcdFx0aGVhZGVyOiBoZWFkZXIsXG5cdFx0XHRib2R5OiB3YXJuaW5nLFxuXHRcdFx0bG9ja2VkOiBsb2NrXG5cblx0XHR9KTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IENsaWVudDsiLCIvKipcbiAqIEFwcGxpY2F0aW9uIGVudmlyb25tZW50IGR1cmluZyBydW50aW1lLiBTdG9yZXMgZHluYW1pY1xuICogZ2xvYmFsIHZhbHVlcyBmb3IgYXBwbGljYXRpb24gbW9kdWxlIHN1cHBvcnQuXG4gKlxuICogQGF1dGhvciBqdWFudmFsbGVqb1xuICogQGRhdGUgNS8zMS8xNVxuICovXG5cbnZhciBFbnZpcm9ubWVudCA9IHt9O1xuXG5FbnZpcm9ubWVudC5jbG91ZCA9IHtcblx0ZGF0YWRpcjogJycsXG5cdGFkZHJlc3M6ICcnXG59XG5cbkVudmlyb25tZW50LmFwcCA9IHtcblx0dGl0bGU6ICdQaWN0cmUnXG59XG5cbkVudmlyb25tZW50LmV2ZW50cyA9IHt9O1xuXG5FbnZpcm9ubWVudC5pblByb2R1Y3Rpb24gXHQ9IGZhbHNlO1xuRW52aXJvbm1lbnQuaXNVcGRhdGluZyBcdFx0PSBmYWxzZTtcblxuRW52aXJvbm1lbnQuYW5pbWF0aW9uU3BlZWQgXHQ9IDEwMDA7XG5FbnZpcm9ubWVudC5tYXhJbWFnZVdpZHRoIFx0PSA4MDA7XG5cbm1vZHVsZS5leHBvcnRzID0gRW52aXJvbm1lbnQ7IiwiLyoqXG4gKiBBcHBsaWNhdGlvbiBldmVudHMgY29udHJvbGxlclxuICovXG5cbnZhciBFdmVudHMgPSB7fTtcbnZhciByZWdpc3RlcmVkR2xvYmFsRXZlbnRzID0ge307XG52YXIgcmVnaXN0ZXJlZE5vZGVFdmVudHMgPSB7fTtcblxuLyoqXG4gKiBMaXN0ZW5zIGZvciBhIGRvbSBldmVudFxuICovXG5FdmVudHMub25Ob2RlRXZlbnQgPSBmdW5jdGlvbihub2RlLCBldmVudE5hbWUsIGNhbGxiYWNrKSB7XG5cdGlmICghcmVnaXN0ZXJlZE5vZGVFdmVudHNbbm9kZS5ub2RlTmFtZV0pIHtcblx0XHRyZWdpc3RlcmVkTm9kZUV2ZW50c1tub2RlLm5vZGVOYW1lXSA9IHt9O1xuXHR9XG5cblx0aWYgKCFyZWdpc3RlcmVkTm9kZUV2ZW50c1tub2RlLm5vZGVOYW1lXVtldmVudE5hbWVdKSB7XG5cdFx0cmVnaXN0ZXJlZE5vZGVFdmVudHNbbm9kZS5ub2RlTmFtZV1bZXZlbnROYW1lXSA9IFtdO1xuXG5cdFx0ZnVuY3Rpb24gbm9kZUV2ZW50KGUpIHtcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgcmVnaXN0ZXJlZE5vZGVFdmVudHNbbm9kZS5ub2RlTmFtZV1bZXZlbnROYW1lXS5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRpZiAodHlwZW9mIHJlZ2lzdGVyZWROb2RlRXZlbnRzW25vZGUubm9kZU5hbWVdW2V2ZW50TmFtZV1baV0gPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdHJlZ2lzdGVyZWROb2RlRXZlbnRzW25vZGUubm9kZU5hbWVdW2V2ZW50TmFtZV1baV0uY2FsbChub2RlLCBlKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHRyeSB7XG5cdFx0XHRub2RlLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBub2RlRXZlbnQpO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdG5vZGUuYXR0YWNoRXZlbnQoJ29uJyArIGV2ZW50TmFtZSwgbm9kZUV2ZW50KTtcblx0XHR9XG5cdH1cblxuXHRyZWdpc3RlcmVkTm9kZUV2ZW50c1tub2RlLm5vZGVOYW1lXVtldmVudE5hbWVdLnB1c2goY2FsbGJhY2spO1xufTtcblxuLy8gZXhlY3V0ZXMgZXZlbnQgXCJjYWxsYmFja3NcIiBvbiBhIG5vZGUgZXZlbnQgYW5kIHN0b3JlcyB0aGVtXG4vLyBmb3IgZnV0dXJlIGNhc2VzIG9mIHN1Y2ggZXZlbnQgaGFwcGVuaW5nLlxuLy8gV2FybmluZzogZXZlbnQgb2JqZWN0IHdpbGwgbm90IGJlIGluc3RhbnRseSBhdmFpbGFibGUgZm9yXG4vLyBjYWxsYmFjayB0byByZWNlaXZlIGR1ZSB0byBjYWxsYmFjayBiZWluZyBjYWxsZWRcbi8vIGJlZm9yZSBiZWluZyBxdWV1ZWQgdXAgZm9yIGl0cyBjb3JyZXNwb25kaW5nIGV2ZW50LlxuRXZlbnRzLm5vd0FuZE9uTm9kZUV2ZW50ID0gZnVuY3Rpb24obm9kZSwgZXZlbnROYW1lLCBjYWxsYmFjaykge1xuXHRjYWxsYmFjay5jYWxsKG5vZGUsIG51bGwpO1xuXHRFdmVudHMub25Ob2RlRXZlbnQobm9kZSwgZXZlbnROYW1lLCBjYWxsYmFjayk7XG59O1xuXG4vKipcbiAqIFRyaWdnZXJzIGRvbSBldmVudFxuICovXG5FdmVudHMuZW1pdE5vZGVFdmVudCA9IGZ1bmN0aW9uKCkge1xuXG59O1xuXG4vKipcbiAqIFJlZ2lzdGVycyBuZXcgYXBwIGV2ZW50IGFuZCBmaXJlc1xuICogcGFzc2VkIGNhbGxiYWNrIHdoZW4gZW1pdHRlZCBcbiAqL1xuRXZlbnRzLnJlZ2lzdGVyR2xvYmFsRXZlbnQgPSBmdW5jdGlvbihldmVudE5hbWUsIGNhbGxiYWNrKSB7XG5cdGlmICghdGhpcy5yZWdpc3RlcmVkR2xvYmFsRXZlbnRzW2V2ZW50TmFtZV0pIHtcblx0XHR0aGlzLnJlZ2lzdGVyZWRHbG9iYWxFdmVudHNbZXZlbnROYW1lXSA9IFtdO1xuXHR9XG5cblx0dGhpcy5yZWdpc3RlcmVkR2xvYmFsRXZlbnRzW2V2ZW50TmFtZV0ucHVzaChjYWxsYmFjayk7XG59XG5cbi8qKlxuICogVHJpZ2dlcnMgcmVnaXN0ZXJlZCBhcHAgZXZlbnRzXG4gKiBieSBjYWxsaW5nIGNhbGxiYWNrcyBhc3NpZ25lZCB0b1xuICogdGhhdCBldmVudE5hbWVcbiAqL1xuRXZlbnRzLmVtaXRSZWdpc3RlcmVkR2xvYmFsRXZlbnQgPSBmdW5jdGlvbihldmVudE5hbWUsIGFyZ3MpIHtcblx0aWYgKCFyZWdpc3RlcmVkR2xvYmFsRXZlbnRzW2V2ZW50TmFtZV0pIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucmVnaXN0ZXJlZEdsb2JhbEV2ZW50c1tldmVudE5hbWVdLmxlbmd0aDsgaSsrKSB7XG5cdFx0dGhpcy5yZWdpc3RlcmVkR2xvYmFsRXZlbnRzW2V2ZW50TmFtZV1baV0uYXBwbHkodGhpcywgYXJncyk7XG5cdH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRzOyIsIi8qKlxuICogQXBwbGljYXRpb24gaW50ZXJmYWNlIG1hbmFnZXIuIEV4cG9zZXMgYWxsIGludGVyZmFjZSBtb2R1bGVzIHRvIGdsb2JhbCBzY29wZS5cbiAqXG4gKiBAYXV0aG9yIGp1YW52YWxsZWpvXG4gKiBAZGF0ZSA1LzMxLzE1XG4gKi9cblxudmFyIEludGVyZmFjZSA9IHJlcXVpcmUoJy4vaW50ZXJmYWNlcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEludGVyZmFjZTsiLCIvKipcbiAqIEJvYXJkIGludGVyZmFjZSBtb2R1bGVcbiAqL1xuXG52YXIgRW52aXJvbm1lbnQgPSByZXF1aXJlKCcuLi9lbnZpcm9ubWVudC5qcycpO1xuXG4vLyBwcml2YXRlIGZpZWxkcyBhbmQgZnVuY3Rpb25zXG52YXIgaXNTZXQgPSBmYWxzZTtcbnZhciBub2RlcyA9IHtcblx0bm90aWNlOiBudWxsXG59O1xuXG52YXIgcGFyZW50Tm9kZUNhY2hlID0ge307XG52YXIgcmVzdHJpY3RlZE5hbWVzID0gW1xuXHQnZGF0YScsXG5cdCdyZXN0cmljdGVkJyxcblx0JzQwNCcsXG5cdCd1bmRlZmluZWQnXG5dO1xuXG52YXIgQm9hcmQgPSB7fTtcblxuQm9hcmQuaXNOYW1lUmVzdHJpY3RlZCA9IGZ1bmN0aW9uKG5hbWUpIHtcblx0cmV0dXJuIHJlc3RyaWN0ZWROYW1lcy5pbmRleE9mKG5hbWUpICE9IC0xO1xufTtcblxuQm9hcmQuaXNOYW1lSW52YWxpZCA9IGZ1bmN0aW9uKG5hbWUpIHtcblx0cmV0dXJuIG5hbWUubWF0Y2goL1teYS16MC05XFwtXFwuXFwrXFxfXFwgXS9naSk7XG59O1xuXG5Cb2FyZC5pc05hbWVXaXRoU3BhY2VzID0gZnVuY3Rpb24obmFtZSkge1xuXHRyZXR1cm4gbmFtZS5tYXRjaCgvW1xcIF0vZyk7XG59O1xuXG5Cb2FyZC5pc1NldCA9IGZ1bmN0aW9uKCkge1xuXHRCb2FyZC5kZXRlY3QoKTtcblx0cmV0dXJuIGlzU2V0O1xufTtcblxuQm9hcmQuZGV0ZWN0ID0gZnVuY3Rpb24oKSB7XG5cblx0aWYgKCF3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUuc3BsaXQoJy8nKVsxXSkge1xuXHRcdHdpbmRvdy5kb2N1bWVudC50aXRsZSA9IEVudmlyb25tZW50LmFwcC50aXRsZTtcblx0XHRpc1NldCA9IGZhbHNlO1xuXHRcdHJldHVybiBCb2FyZDtcblx0fVxuXG5cdGlzU2V0ID0gdHJ1ZTtcblx0d2luZG93LmRvY3VtZW50LnRpdGxlID0gJ1BpY3RyZSAtICcgKyBCb2FyZC5nZXROYW1lKCk7XG5cblx0cmV0dXJuIEJvYXJkO1xufVxuXG5Cb2FyZC5nZXROYW1lID0gZnVuY3Rpb24oKSB7XG5cblx0dmFyIGJvYXJkO1xuXG5cdC8vIGNhcGl0YWxpemUgbmFtZSBvZiBib2FyZFxuXHRpZiAoaXNTZXQpIHtcblx0XHR2YXIgbmFtZSA9IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZS5zcGxpdChcIi9cIilbMV0udG9Mb3dlckNhc2UoKTtcblx0XHR2YXIgbmFtZUFycmF5ID0gbmFtZS5zcGxpdCgnJyk7XG5cdFx0bmFtZUFycmF5LnNwbGljZSgwLCAxKTtcblxuXHRcdHZhciBuYW1lRmlyc3RDaGFyID0gbmFtZS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKTtcblx0XHRib2FyZCA9IG5hbWVGaXJzdENoYXIgKyBuYW1lQXJyYXkuam9pbignJyk7XG5cdH1cblxuXHRyZXR1cm4gYm9hcmQ7XG5cbn1cblxuQm9hcmQucHV0Tm90aWNlID0gZnVuY3Rpb24obWFpbldpbmRvdywgcGFyZW50Tm9kZSwgdGV4dCkge1xuXHRpZiAoIXRleHQpIHtcblx0XHRjb25zb2xlLmxvZygnV0FSTicsICdCT0FSRCcsICdOT1RJQ0UnLCAnQSBub3RpY2UgYXR0ZW1wdCB3YXMgbWFkZSB3aXRoIG5vIHRleHQuJyk7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdGlmICghcGFyZW50Tm9kZSkge1xuXHRcdGNvbnNvbGUubG9nKCdXQVJOJywgJ0JPQVJEJywgJ05PVElDRScsICdBIG5vdGljZSBhdHRlbXB0IHdhcyBtYWRlIHdpdGggbm8gcGFyZW50Tm9kZSBwYXNzZWQuJyk7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdGlmICghbm9kZXMubm90aWNlKSB7XG5cdFx0Y29uc29sZS5sb2coJ1dBUk4nLCAnQk9BUkQnLCAnTk9USUNFJywgJ0Egbm90aWNlIGF0dGVtcHQgd2FzIG1hZGUgd2l0aG91dCBpbml0aWFsaXppbmcgdGhlIEJvYXJkLicpO1xuXHRcdHJldHVybjtcblx0fVxuXG5cdGlmICghbm9kZXMubm90aWNlKSB7XG5cdFx0bm9kZXMubm90aWNlID0gbWFpbldpbmRvdy5kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblx0XHRub2Rlcy5ub3RpY2UuY2xhc3NOYW1lID0gJ1BpY3RyZS1ub3RpY2UnO1xuXHR9XG5cdGlmICghcGFyZW50Tm9kZUNhY2hlW3BhcmVudE5vZGUubm9kZU5hbWVdKSB7XG5cdFx0cGFyZW50Tm9kZUNhY2hlW3BhcmVudE5vZGUubm9kZU5hbWVdID0gcGFyZW50Tm9kZTtcblx0XHRwYXJlbnROb2RlLmFwcGVuZENoaWxkKG5vZGVzLm5vdGljZSk7XG5cdH1cblxuXHRub2Rlcy5ub3RpY2UuaW5uZXJIVE1MID0gdGV4dDtcblxufTtcblxuQm9hcmQucmVtb3ZlTm90aWNlID0gZnVuY3Rpb24ocGFyZW50Tm9kZSkge1xuXHRpZiAoIXBhcmVudE5vZGVDYWNoZVtwYXJlbnROb2RlLm5vZGVOYW1lXSkge1xuXHRcdGNvbnNvbGUubG9nKCdXQVJOJywgJ0JPQVJEJywgJ05PVElDRScsICdBbiBhdHRlbXB0IHdhcyBtYWRlIHRvIHJlbW92ZSBhIGJvYXJkIG5vdGljZSBmcm9tIGFuIGludmFsaWQgcGFyZW50Tm9kZS4nKTtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblxuXHRwYXJlbnROb2RlLnJlbW92ZUNoaWxkKG5vZGVzLm5vdGljZSk7XG5cdHBhcmVudE5vZGVDYWNoZVtwYXJlbnROb2RlLm5vZGVOYW1lXSA9IG51bGw7XG5cdHJldHVybiB0cnVlO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBCb2FyZDsiLCJ2YXIgSW50Q29udHJvbGxlciA9IHt9XG5cbmZ1bmN0aW9uIGludGVyZmFjZU5vZGUoKSB7XG5cdHRoaXMuY2FsbGJhY2tzID0ge307XG5cblx0Ly8gV2FybmluZzogZG9lcyBub3QgcmVnaXN0ZXIgXCJET01UcmVlXCIgbm9kZSBldmVudHNcblx0Ly8gdGhhdCBzaG91bGQgYmUgd2F0Y2hlZCB3aXRoIFwiYWRkRXZlbnRMaXN0ZW5lclwiLlxuXHQvLyBvbmx5IHJlZ2lzdGVycyBcImxvY2FsXCIgaW5zdGFuY2UgZXZlbnRzLiBVc2Vcblx0Ly8gXCJFdmVudHMub25Ob2RlRXZlbnRcIiB0byBsaXN0ZW4gZm9yIGFjdHVhbCBkb20gZXZ0cy5cblx0dGhpcy5vbiA9IGZ1bmN0aW9uKGV2ZW50TmFtZSwgY2FsbGJhY2spIHtcblx0XHRpZiAoIXRoaXMuY2FsbGJhY2tzW2V2ZW50TmFtZV0pIHtcblx0XHRcdHRoaXMuY2FsbGJhY2tzW2V2ZW50TmFtZV0gPSBbXTtcblx0XHR9XG5cblx0XHR0aGlzLmNhbGxiYWNrc1tldmVudE5hbWVdLnB1c2goY2FsbGJhY2spO1xuXHR9O1xuXG5cdHRoaXMuZW1pdCA9IGZ1bmN0aW9uKGV2ZW50TmFtZSwgYXJncykge1xuXHRcdGlmICghdGhpcy5jYWxsYmFja3NbZXZlbnROYW1lXSkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5jYWxsYmFja3NbZXZlbnROYW1lXS5sZW5ndGg7IGkrKykge1xuXHRcdFx0dGhpcy5jYWxsYmFja3NbZXZlbnROYW1lXVtpXS5hcHBseSh0aGlzLCBhcmdzKTtcblx0XHR9XG5cdH07XG59XG5cbmZ1bmN0aW9uIGludGVyZmFjZUlucHV0Tm9kZShFdmVudHMsIG1haW5XaW5kb3cpIHtcblx0dmFyIHNjb3BlID0gdGhpcztcblxuXHR0aGlzLm5vZGUgPSBtYWluV2luZG93LmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbnB1dFwiKTtcblx0dGhpcy50eXBlID0gXCJ0ZXh0XCI7XG5cdHRoaXMucGFzc3dvcmQgPSBmYWxzZTtcblx0dGhpcy5jbGFzc05hbWUgPSBcIlBpY3RyZS1wYXNzY29kZS1pbnB1dFwiO1xuXHR0aGlzLnBsYWNlaG9sZGVyID0gXCJDcmVhdGUgYSBwYXNzY29kZVwiO1xuXHR0aGlzLnZhbHVlID0gdGhpcy5wbGFjZWhvbGRlcjtcblxuXHR0aGlzLm5vZGUubWF4TGVuZ3RoID0gMTA7XG5cdHRoaXMubm9kZS5jbGFzc05hbWUgPSB0aGlzLmNsYXNzTmFtZTtcblx0dGhpcy5ub2RlLnR5cGUgPSB0aGlzLnR5cGU7XG5cdHRoaXMubm9kZS5wbGFjZWhvbGRlciA9IHRoaXMucGxhY2Vob2xkZXIgfHwgXCJcIjtcblxuXHR0aGlzLmdldE5vZGUgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gc2NvcGUubm9kZTtcblx0fTtcblx0dGhpcy5zZXRTdHlsZSA9IGZ1bmN0aW9uKGF0dHIsIHZhbHVlKSB7XG5cdFx0c2NvcGUubm9kZS5zdHlsZVthdHRyXSA9IHZhbHVlO1xuXHR9O1xuXHR0aGlzLnNldEF0dHJpYnV0ZSA9IGZ1bmN0aW9uKGF0dHIsIHZhbHVlKSB7XG5cdFx0c2NvcGUubm9kZS5zZXRBdHRyaWJ1dGUoYXR0ciwgdmFsdWUpO1xuXHR9O1xuXG5cdHRoaXMuc2V0VmFsdWUgPSBmdW5jdGlvbih0ZXh0KSB7XG5cdFx0dGhpcy5ub2RlLnZhbHVlID0gdGV4dDtcblx0XHR0aGlzLnZhbHVlID0gdGV4dDtcblx0fTtcblxuXHR0aGlzLnNldFBsYWNlaG9sZGVyID0gZnVuY3Rpb24odGV4dCkge1xuXHRcdHRoaXMudmFsdWUgPSB0ZXh0O1xuXHRcdHRoaXMucGxhY2Vob2xkZXIgPSB0ZXh0O1xuXHRcdHRoaXMubm9kZS5wbGFjZWhvbGRlciA9IHRleHQ7XG5cdH07XG5cblx0dGhpcy5nZXRWYWx1ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBzY29wZS5ub2RlLnZhbHVlO1xuXHR9O1xuXHR0aGlzLmdldEVzY2FwZWRWYWx1ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBzY29wZS5ub2RlLnZhbHVlLnRvTG93ZXJDYXNlKClcblx0XHRcdC5yZXBsYWNlKC8mL2csIFwiJmFtcDtcIilcblx0XHRcdC5yZXBsYWNlKC88L2csIFwiJmx0O1wiKVxuXHRcdFx0LnJlcGxhY2UoLz4vZywgXCImZ3Q7XCIpXG5cdFx0XHQucmVwbGFjZSgvXCIvZywgXCImcXVvdDtcIilcblx0XHRcdC5yZXBsYWNlKC8nL2csIFwiJiMwMzk7XCIpO1xuXHR9O1xuXG5cdHRoaXMuaXNWYWx1ZUVtcHR5ID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHNjb3BlLnZhbHVlID09IHNjb3BlLm5vZGUudmFsdWUgfHwgc2NvcGUubm9kZS52YWx1ZSA9PSAnJztcblx0fTtcblxuXHRFdmVudHMub25Ob2RlRXZlbnQodGhpcy5ub2RlLCAnZm9jdXMnLCBmdW5jdGlvbihlKSB7XG5cdFx0c2NvcGUuZW1pdCgnZm9jdXMnLCBbZV0pO1xuXHRcdGlmIChzY29wZS5wYXNzd29yZCkge1xuXHRcdFx0c2NvcGUubm9kZS50eXBlID0gXCJwYXNzd29yZFwiO1xuXHRcdH1cblx0XHRpZiAoc2NvcGUubm9kZS52YWx1ZSA9PSBzY29wZS52YWx1ZSkge1xuXHRcdFx0c2NvcGUubm9kZS52YWx1ZSA9IFwiXCI7XG5cdFx0fVxuXHR9KTtcblxuXHRFdmVudHMub25Ob2RlRXZlbnQodGhpcy5ub2RlLCAnYmx1cicsIGZ1bmN0aW9uKGUpIHtcblx0XHRzY29wZS5lbWl0KCdibHVyJywgW2VdKTtcblx0fSk7XG5cblx0cmV0dXJuIHRoaXM7XG59O1xuXG5pbnRlcmZhY2VJbnB1dE5vZGUucHJvdG90eXBlID0gbmV3IGludGVyZmFjZU5vZGUoKTtcblxuZnVuY3Rpb24gaW50ZXJmYWNlRGl2Tm9kZSgpIHtcblxufVxuXG5JbnRDb250cm9sbGVyLmhvcml6b250YWxDZW50ZXJOb2RlUmVsYXRpdmVUbyA9IGZ1bmN0aW9uKG5vZGUsIHJlbGF0aXZlVG9Ob2RlKSB7XG5cdG5vZGUuc3R5bGUubGVmdCA9ICgkKHJlbGF0aXZlVG9Ob2RlKS53aWR0aCgpIC8gMikgLSAoJChub2RlKS53aWR0aCgpIC8gMikgKyAncHgnO1xufTtcblxuSW50Q29udHJvbGxlci52ZXJ0aWNhbENlbnRlck5vZGVSZWxhdGl2ZVRvID0gZnVuY3Rpb24obm9kZSwgcmVsYXRpdmVUb05vZGUpIHtcblx0bm9kZS5zdHlsZS50b3AgPSAoJChyZWxhdGl2ZVRvTm9kZSkuaGVpZ2h0KCkgLyAyKSAtICgkKG5vZGUpLmhlaWdodCgpIC8gMikgKyAncHgnO1xufTtcblxuSW50Q29udHJvbGxlci5jZW50ZXJOb2RlUmVsYXRpdmVUbyA9IGZ1bmN0aW9uKG5vZGUsIHJlbGF0aXZlVG9Ob2RlKSB7XG5cdEludENvbnRyb2xsZXIuaG9yaXpvbnRhbENlbnRlck5vZGVSZWxhdGl2ZVRvKG5vZGUsIHJlbGF0aXZlVG9Ob2RlKTtcblx0SW50Q29udHJvbGxlci52ZXJ0aWNhbENlbnRlck5vZGVSZWxhdGl2ZVRvKG5vZGUsIHJlbGF0aXZlVG9Ob2RlKTtcbn07XG5cbkludENvbnRyb2xsZXIubmV3SW5wdXROb2RlID0gZnVuY3Rpb24oRXZlbnRzLCBtYWluV2luZG93KSB7XG5cdHJldHVybiBuZXcgaW50ZXJmYWNlSW5wdXROb2RlKEV2ZW50cywgbWFpbldpbmRvdyk7XG59O1xuXG5JbnRDb250cm9sbGVyLm5ld0Rpdk5vZGUgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIG5ldyBpbnRlcmZhY2VEaXZOb2RlKCk7XG59O1xuXG5JbnRDb250cm9sbGVyLmNyZWF0ZURpdk5vZGUgPSBmdW5jdGlvbihtYWluV2luZG93KSB7XG5cdHJldHVybiBtYWluV2luZG93LmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xufTtcblxuSW50Q29udHJvbGxlci5jcmVhdGVOb2RlID0gZnVuY3Rpb24obWFpbldpbmRvdywgbm9kZU5hbWUpIHtcblx0cmV0dXJuIG1haW5XaW5kb3cuZG9jdW1lbnQuY3JlYXRlRWxlbWVudChub2RlTmFtZSk7XG59O1xuXG5JbnRDb250cm9sbGVyLnNldE5vZGVPdmVyZmxvd0hpZGRlbiA9IGZ1bmN0aW9uKG5vZGUpIHtcblx0bm9kZS5zdHlsZS5vdmVyZmxvdyA9ICdoaWRkZW4nO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBJbnRDb250cm9sbGVyOyIsIi8qKlxuICogR2FsbGVyeSB3cmFwcGVyIGZvciBvdmVybGF5IGludGVyZmFjZVxuICovXG5cbnZhciBHYWxsZXJ5SW50ZXJmYWNlID0ge307XG5cbkdhbGxlcnlJbnRlcmZhY2UuaXNGZWF0dXJpbmcgPSBmYWxzZTtcblxuR2FsbGVyeUludGVyZmFjZS5ldmVudHMgPSB7fTtcbkdhbGxlcnlJbnRlcmZhY2UuaW1hZ2VzID0gW107XG5cbkdhbGxlcnlJbnRlcmZhY2UuaW1hZ2UgPSBudWxsO1xuXG52YXIgaXNBY3RpdmUgPSBmYWxzZTtcblxuR2FsbGVyeUludGVyZmFjZS5ldmVudHMub25yZWFkeSA9IGZ1bmN0aW9uKCkge307XG5HYWxsZXJ5SW50ZXJmYWNlLmV2ZW50cy5vbmNsb3NlID0gZnVuY3Rpb24oKSB7fTtcblxuR2FsbGVyeUludGVyZmFjZS5vbkV4aXQgPSBmdW5jdGlvbihleGl0Q2FsbGJhY2spIHtcblx0T3ZlcmxheS5ldmVudHMub25leGl0LnB1c2goZXhpdENhbGxiYWNrKTtcbn07XG5cbkdhbGxlcnlJbnRlcmZhY2UuaGlkZSA9IGZ1bmN0aW9uKCkge1xuXG5cdC8vIGlmICghT3ZlcmxheS5pc0xvY2tlZCkge1xuXG5cdC8vIFx0d2luZG93LmRvY3VtZW50LmJvZHkuc3R5bGUub3ZlcmZsb3cgPSAnYXV0byc7XG5cdC8vIFx0d2luZG93LmRvY3VtZW50LmJvZHkuc3R5bGUuaGVpZ2h0ID0gJ2F1dG8nO1xuXHQvLyBcdEdhbGxlcnlJbnRlcmZhY2UuaXNGZWF0dXJpbmcgPSBmYWxzZTtcblxuXHQvLyBcdE92ZXJsYXkucmVtb3ZlKCk7XG5cdC8vIFx0R2FsbGVyeUludGVyZmFjZS5vbmNsb3NlKCk7XG5cblx0Ly8gXHRmb3IgKHZhciBpID0gMDsgaSA8IE92ZXJsYXkuZXZlbnRzLm9uZXhpdC5sZW5ndGg7IGkrKykge1xuXHQvLyBcdFx0aWYgKE92ZXJsYXkuZXZlbnRzLm9uZXhpdFtpXSkgT3ZlcmxheS5ldmVudHMub25leGl0W2ldLmNhbGwoR2FsbGVyeUludGVyZmFjZSk7XG5cdC8vIFx0fVxuXG5cdC8vIH1cblxufVxuXG4vKipcbiAqIEZlYXR1cmUgYSBnaXZlbiBpbWFnZSBvYmplY3RcbiAqL1xuR2FsbGVyeUludGVyZmFjZS5zaG93ID0gZnVuY3Rpb24oaW1hZ2UpIHtcblxuXHRHYWxsZXJ5SW50ZXJmYWNlLmlzQWN0aXZlID0gdHJ1ZTtcblxuXHR2YXIgc2NvcGUgPSBQaWN0cmU7XG5cblx0Ly8gdmFyIHRodW1iID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblx0Ly8gdGh1bWIuY2xhc3NOYW1lID0gXCJQaWN0cmUtb3ZlcmxheS1waWNcIjtcblx0Ly8gdGh1bWIuZGF0YSA9IGltYWdlLmRhdGE7XG5cdC8vIHRodW1iLnN0eWxlLm1pbldpZHRoID0gRW52aXJvbm1lbnQubWF4SW1hZ2VXaWR0aCArICdweCc7XG5cdC8vIHRodW1iLnN0eWxlLm1heFdpZHRoID0gRW52aXJvbm1lbnQubWF4SW1hZ2VXaWR0aCArICdweCc7XG5cdC8vIHRodW1iLnN0eWxlLndpZHRoID0gRW52aXJvbm1lbnQubWF4SW1hZ2VXaWR0aCArICdweCc7XG5cdC8vIHRodW1iLmlubmVySFRNTCA9IFwiPGRpdiBjbGFzcz0nUGljdHJlLWxvYWRlcic+PHNwYW4gY2xhc3M9J2ZhIGZhLWNpcmNsZS1vLW5vdGNoIGZhLXNwaW4gZmEtM3gnPjwvc3Bhbj48L2Rpdj5cIjtcblxuXHQvLyBPdmVybGF5LmZlYXR1cmUodGh1bWIpO1xuXHQvLyBPdmVybGF5Lml0ZXJhdG9yID0gaW1hZ2UuZGF0YS5pZDtcblxuXHQvLyB3aW5kb3cuZG9jdW1lbnQuYm9keS5zdHlsZS5oZWlnaHQgPSAkKHdpbmRvdykuaGVpZ2h0KCkgKyAncHgnO1xuXHQvLyB3aW5kb3cuZG9jdW1lbnQuYm9keS5zdHlsZS5vdmVyZmxvdyA9ICdoaWRkZW4nO1xuXG5cdC8vIGltYWdlLnN0eWxlLm9wYWNpdHkgPSAnMC4xJztcblxuXHQvLyBHYWxsZXJ5LnNob3dJbWFnZSh0aHVtYik7XG5cdC8vIFBpY3RyZS5nYWxsZXJ5Lm92ZXJsYXkub25jbG9zZSA9IGZ1bmN0aW9uKCkge1xuXHQvLyBcdGlmIChhKSBhLnN0eWxlLm9wYWNpdHkgPSBQaWN0cmUuX3NldHRpbmdzLmRhdGEudmlzaXRlZDtcblx0Ly8gfVxuXG59O1xuXG5HYWxsZXJ5SW50ZXJmYWNlLmlzQWN0aXZlID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiBpc0FjdGl2ZTtcbn07XG5cbkdhbGxlcnlJbnRlcmZhY2UuZ2V0T3ZlcmxheSA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gT3ZlcmxheTtcbn1cblxuR2FsbGVyeUludGVyZmFjZS5wdXRPdmVybGF5ID0gZnVuY3Rpb24oKSB7fVxuXG5tb2R1bGUuZXhwb3J0cyA9IEdhbGxlcnlJbnRlcmZhY2U7IiwiLyoqXG4gKiBFeHBvcnRzIGFsbCBpbnRlcmZhY2UgbW9kdWxlcyBpbiBjdXJyZW50IGRpcmVjdG9yeVxuICovXG5cbi8vaW1wb3J0IGFsbCBtb2R1bGVzXG52YXIgbW9kdWxlcyA9IHtcblx0J2JvYXJkJzogcmVxdWlyZSgnLi9ib2FyZC5qcycpLFxuXHQnY29udHJvbGxlcic6IHJlcXVpcmUoJy4vY29udHJvbGxlci5qcycpLFxuXHQnZ2FsbGVyeSc6IHJlcXVpcmUoJy4vZ2FsbGVyeS5qcycpLFxuXHQnbWVudSc6IHJlcXVpcmUoJy4vbWVudS5qcycpLFxuXHQnbW9kYWwnOiByZXF1aXJlKCcuL21vZGFsLmpzJyksXG5cdCdvdmVybGF5JzogcmVxdWlyZSgnLi9vdmVybGF5LmpzJyksXG5cdCdzcGxhc2gnOiByZXF1aXJlKCcuL3NwbGFzaC5qcycpLFxuXHQnd2FybmluZyc6IHJlcXVpcmUoJy4vd2FybmluZy5qcycpXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IG1vZHVsZXM7IiwiLyoqXG4gKiBOYXZpZ2F0aW9uIGFuZCBtZW51IGludGVyZmFjZVxuICovXG5cbnZhciBFbnZpcm9ubWVudCA9IHJlcXVpcmUoJy4uL2Vudmlyb25tZW50LmpzJyk7XG52YXIgVXRpbGl0aWVzID0gcmVxdWlyZSgnLi4vdXRpbGl0aWVzLmpzJyk7XG5cbnZhciBNZW51SW50ZXJmYWNlID0ge1xuXG5cdGRvbUVsZW1lbnQ6IG51bGwsXG5cdGJ1dHRvbnM6IHt9LFxuXG5cdC8qKlxuXHQgKiBBZGRzIHVpIGljb24gdG8gdGhlIHRvcCBuYXZpZ2F0aW9uIG9mIHRoZSBhcHBsaWNhdGlvblxuXHQgKlxuXHQgKiBAcGFyYW0gYnV0dG9uIFtvYmplY3RdIGRlZmluaW5nIHVpIGFuZCBhY3Rpb24gcHJvcGVydGllcyBmb3IgYnV0dG9uXG5cdCAqIEByZXR1cm4gcG9pbnRlciB0byBhZGRlZCBidXR0b24gb2JqZWN0XG5cdCAqL1xuXHRhZGRCdXR0b246IGZ1bmN0aW9uKGJ1dHRvbikge1xuXG5cdFx0dmFyIGJ1dHRvbkljb25DbGFzc05hbWUgPSAnZmEtY2xvdWQnO1xuXG5cdFx0dGhpcy5idXR0b25zW2J1dHRvbi5uYW1lXSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG5cdFx0dGhpcy5idXR0b25zW2J1dHRvbi5uYW1lXS5pZCA9IGJ1dHRvbi5pZDtcblx0XHR0aGlzLmJ1dHRvbnNbYnV0dG9uLm5hbWVdLmNsYXNzTmFtZSA9IFwidG9wLWJ1dHRvblwiOyAvL1widG9wLWJ1dHRvblwiO1xuXHRcdHRoaXMuYnV0dG9uc1tidXR0b24ubmFtZV0udGl0bGUgPSBidXR0b24udGl0bGU7XG5cblx0XHQvLyBoYW5kbGUgYnV0dG9uIGljb24gdHlwZVxuXHRcdGlmIChidXR0b24uaWQgPT0gJ3VwbG9hZCcpIHtcblx0XHRcdC8vIGFzc2lnbiB1cGxvYWQgaWNvblxuXHRcdFx0YnV0dG9uSWNvbkNsYXNzTmFtZSA9ICdmYS1jbG91ZC11cGxvYWQnO1xuXHRcdH0gZWxzZSBpZiAoYnV0dG9uLmlkID09ICdsb2NrJykge1xuXHRcdFx0Ly8gYXNzaWduICdsb2NrJyBpY29uIHRvIGluZGljYXRlIHNpZ25pbmcgaW5cblx0XHRcdGJ1dHRvbkljb25DbGFzc05hbWUgPSAnZmEtbG9jayc7XG5cdFx0fSBlbHNlIGlmIChidXR0b24uaWQgPT0gJ3VubG9jaycpIHtcblx0XHRcdC8vIGFzc2lnbiAndW5sb2NrJyBpY29uIHRvIGluZGljYXRlIHNpZ25pbmcgb3V0XG5cdFx0XHRidXR0b25JY29uQ2xhc3NOYW1lID0gJ2ZhLXVubG9jayc7XG5cdFx0fSBlbHNlIGlmIChidXR0b24uaWQgPT0gJ2JhY2snKSB7XG5cdFx0XHQvLyBhc3NpZ24gJ2JhY2snIGFycm93IGljb24gdG8gaW5kaWNhdGUgcmV0dXJuaW5nIHRvIGFsYnVtXG5cdFx0XHRidXR0b25JY29uQ2xhc3NOYW1lID0gJ2ZhLWFycm93LWxlZnQnO1xuXHRcdH1cblxuXHRcdHRoaXMuYnV0dG9uc1tidXR0b24ubmFtZV0uaW5uZXJIVE1MID0gJzxzcGFuIGNsYXNzPVwiZmEgJyArIGJ1dHRvbkljb25DbGFzc05hbWUgKyAnIGZhLTJ4XCI+PC9zcGFuPic7XG5cblx0XHR0aGlzLmRvbUVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5idXR0b25zW2J1dHRvbi5uYW1lXSk7XG5cblx0XHR0aGlzLmJ1dHRvbnNbYnV0dG9uLm5hbWVdLnN0eWxlLnRvcCA9ICh0aGlzLmJ1dHRvbnNbYnV0dG9uLm5hbWVdLnBhcmVudE5vZGUuY2xpZW50SGVpZ2h0IC8gMiAtIHRoaXMuYnV0dG9uc1tidXR0b24ubmFtZV0uY2xpZW50SGVpZ2h0IC8gMikgKyAncHgnO1xuXG5cdFx0Ly8gZGVjbGFyZSAnb24nIGZ1bmN0aW9uIHRvIGFsbG93IGFkZGl0aW9uIG9mIGV2ZW50IGxpc3RlbmVyIHRvIGVsZW1lbnRcblx0XHR0aGlzLmJ1dHRvbnNbYnV0dG9uLm5hbWVdLm9uID0gZnVuY3Rpb24oYWN0aW9uLCBjYWxsYmFjaykge1xuXG5cdFx0XHRQaWN0cmUuZXh0ZW5kKHRoaXMpLm9uKGFjdGlvbiwgZnVuY3Rpb24oZXZ0KSB7XG5cdFx0XHRcdGNhbGxiYWNrLmNhbGwodGhpcywgZXZ0KTtcblx0XHRcdH0pO1xuXG5cdFx0XHRyZXR1cm4gdGhpcztcblxuXHRcdH07XG5cblx0XHRyZXR1cm4gdGhpcy5idXR0b25zW2J1dHRvbi5uYW1lXTtcblx0fSxcblxuXHQvKipcblx0ICogUmV0dXJucyBwb2ludGVyIHRvIGJ1dHRvbiB3aXRoIHNwZWNpZmllZCBpZFxuXHQgKi9cblx0Z2V0QnV0dG9uOiBmdW5jdGlvbihidXR0b25JZCkge1xuXHRcdHJldHVybiB0aGlzLmJ1dHRvbnNbYnV0dG9uSWRdO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRydWUgaWYgYnV0dG9uIHdpdGggc3BlY2lmaWVkIGlmIGV4aXN0c1xuXHQgKiBmYWxzZSBvdGhlcndpc2UuXG5cdCAqL1xuXHRoYXNCdXR0b246IGZ1bmN0aW9uKGJ1dHRvbklkKSB7XG5cblx0XHR2YXIgYnV0dG9uRXhpc3RzID0gZmFsc2U7XG5cblx0XHRpZiAodGhpcy5idXR0b25zLmhhc093blByb3BlcnR5KGJ1dHRvbklkKSkge1xuXHRcdFx0YnV0dG9uRXhpc3RzID0gdHJ1ZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gYnV0dG9uRXhpc3RzO1xuXG5cdH0sXG5cblx0LyoqXG5cdCAqIFNldHMgZG9tIHN0eWxlIGRpc3BsYXkgcHJvcGVydHkgdG8gbm9uZSBvZiBidXR0b24gd2l0aFxuXHQgKiBzcGVjaWZpZWQgaWQuIElmIGJ1dHRvbiBkb2VzIG5vdCBleGlzdCwgcmVxdWVzdCBpcyBpZ25vcmVkLlxuXHQgKi9cblx0aGlkZUJ1dHRvbjogZnVuY3Rpb24oYnV0dG9uSWQpIHtcblx0XHRpZiAodGhpcy5oYXNCdXR0b24oYnV0dG9uSWQpKSB7XG5cdFx0XHR0aGlzLmJ1dHRvbnNbYnV0dG9uSWRdLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG5cdFx0fVxuXHR9LFxuXG5cdC8qKlxuXHQgKiBNYWluIGRpc3BsYXkgZnVuY3Rpb24gZm9yIG1lbnUgaW50ZXJmYWNlLiBXaGVuIGNhbGxlZCwgY3JlYXRlc1xuXHQgKiBtZW51IGRvbSBlbGVtZW50LCBhcHBlbmRzIGFwcGxpY2F0aW9uIGJyYW5kLCBhbmQgaW5zZXJ0cyBtZW51XG5cdCAqIGVsZW1lbnQgYmVmb3JlIHRoZSBtYWluIGFwcGxpY2F0aW9uIHdyYXBwZXIuIElmIGFcblx0ICogc2libGluZ05vZGUgaXMgbm90IHN1cHBsaWVkLCB0aGUgbWVudSBlbGVtZW50IGlzIGFwcGVuZGVkXG5cdCAqIHRvIHRoZSBwYXJlbnQgbm9kZSBzdXBwbGllZC4gKFVzdWFsbHkgYm9keSkuXG5cdCAqXG5cdCAqIE5vdGU6IHRoZSBhcHBsaWNhdGlvbiB3cmFwcGVyIGlzIHVzdWFsbHkgY3JlYXRlZCBhbmQgYXBwZW5kZWRcblx0ICogaW4gdGhlIGluZGV4Lmh0bWwgcHJlLWluaXRpYWxpemF0aW9uIHNjcmlwdC5cblx0ICpcblx0ICogQHBhcmFtIHBhcmVudE5vZGUgXHRcdFx0W0RPTUVsZW1lbnRdIHBhcmVudCBub2RlIG9mIGFwcCB3cmFwcGVyIGFuZCBtZW51ICh1c3VhbGx5IGRvY3VtZW50LmJvZHkpXG5cdCAqIEBwYXJhbSBzaWJsaW5nTm9kZSBcdFtET01FbGVtZW50XSBtYWluIGNvbnRlbnQgd3JhcHBlciBmb3IgYXBwbGljYXRpb25cblx0ICovXG5cdHB1dDogZnVuY3Rpb24ocGFyZW50Tm9kZSwgc2libGluZ05vZGUpIHtcblxuXHRcdHRoaXMuZG9tRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG5cdFx0dGhpcy5kb21FbGVtZW50LmlkID0gJ3RvcCc7XG5cblx0XHQvLyBwbGFjZSBsb2dvIG9uIG1lbnVcblx0XHR2YXIgYnJhbmQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuXHRcdGJyYW5kLmlkID0gJ2JyYW5kJztcblx0XHRicmFuZC5pbm5lckhUTUwgPSBFbnZpcm9ubWVudC5hcHAudGl0bGU7XG5cblx0XHRVdGlsaXRpZXMuZXh0ZW5kKGJyYW5kKS5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcblx0XHRcdHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gUGljdHJlLl9zZXR0aW5ncy5hcHAuYWRkcmVzcztcblx0XHR9KTtcblxuXHRcdHRoaXMuZG9tRWxlbWVudC5hcHBlbmRDaGlsZChicmFuZCk7XG5cblx0XHRpZiAoc2libGluZ05vZGUpIHtcblx0XHRcdHBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKHRoaXMuZG9tRWxlbWVudCwgc2libGluZ05vZGUpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRwYXJlbnROb2RlLmFwcGVuZENoaWxkKHRoaXMuZG9tRWxlbWVudCk7XG5cdFx0fVxuXG5cdFx0YnJhbmQuc3R5bGUudG9wID0gKHRoaXMuZG9tRWxlbWVudC5jbGllbnRIZWlnaHQgLyAyIC0gYnJhbmQuY2xpZW50SGVpZ2h0IC8gMikgKyAncHgnO1xuXHRcdHJldHVybiB0aGlzLmRvbUVsZW1lbnQ7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFJlbW92ZXMgYnV0dG9uIGZyb20gdGhlIGRvY3VtZW50IGFuZCBkZWxldGVzIGRvbSBlbGVtZW50LlxuXHQgKiBJZiBidXR0b24gd2l0aCBzcGVjaWZpZWQgaWQgZG9lcyBub3QgZXhpc3QsIGFjdGlvbiBpcyBpZ25vcmVkLlxuXHQgKlxuXHQgKiBAcGFyYW0gYnV0dG9uSWQgW1N0cmluZ10gaWQgb2YgYnV0dG9uIHRvIHJlbW92ZVxuXHQgKi9cblx0cmVtb3ZlQnV0dG9uOiBmdW5jdGlvbihidXR0b25JZCkge1xuXHRcdGlmICh0aGlzLmhhc0J1dHRvbihidXR0b25JZCkpIHtcblx0XHRcdHRoaXMuZG9tRWxlbWVudC5yZW1vdmVDaGlsZCh0aGlzLmJ1dHRvbnNbYnV0dG9uSWRdKTtcblx0XHRcdGRlbGV0ZSB0aGlzLmJ1dHRvbnNbYnV0dG9uSWRdO1xuXHRcdH1cblx0fSxcblxuXHQvKipcblx0ICogU2V0cyBidXR0b24gY3NzIHN0eWxlIGRpc3BsYXkgcHJvcGVydHkgdG8gYmxvY2suXG5cdCAqIFVzZWQgYWZ0ZXIgaGlkaW5nIGEgYnV0dG9uLiBJZiBhIGJ1dHRvbiB3aXRoXG5cdCAqIHNwZWNpZmllZCBpZCBkb2VzIG5vdCBleGlzdCwgdGhpcyBhY3Rpb24gaXMgaWdub3JlZC5cblx0ICovXG5cdHNob3dCdXR0b246IGZ1bmN0aW9uKGJ1dHRvbklkKSB7XG5cdFx0aWYgKHRoaXMuaGFzQnV0dG9uKGJ1dHRvbklkKSkge1xuXHRcdFx0dGhpcy5idXR0b25zW2J1dHRvbklkXS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcblx0XHR9XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBNZW51SW50ZXJmYWNlOyIsIi8qKlxuICogTW9kYWwgY29udHJvbGxlciAtIGRpc3BsYXlzIGluZm9ybWF0aW9uIHdpdGggb3B0aW9uYWwgdXNlciBpbnB1dHNcbiAqL1xuXG52YXIgTW9kYWwgPSB7fTtcbnZhciBub2RlcyA9IHtcblx0Ly8gbm9kZSBhdHRhY2hlZCB0byBhIHBhcmVudE5vZGUgb3IgbWFpbldpbmRvd1xuXHRyb290Tm9kZTogbnVsbCxcblxuXHQvLyBub2RlIHRoYXQgaG9sZHMgYWxsIG1vZGFsIG5vZGVzIGFuZCBjb21wb25lbnRzXG5cdC8vIGF0dGFjaGVkIHRvIHJvb3ROb2RlXG5cdGNvbnRhaW5lck5vZGU6IG51bGwsXG5cdG91dHB1dE5vZGU6IG51bGwsXG5cdGNvbXBvbmVudHM6IHtcblx0XHR0aXRsZTogbnVsbCxcblx0XHRib2R5OiBudWxsLFxuXHRcdGlucHV0czogW11cblx0fVxufTtcblxudmFyIGFsZXJ0VGltZW91dCA9IG51bGw7XG52YXIgaXNDcmVhdGVkID0gZmFsc2U7XG52YXIgbWFpbkRpdiA9IG51bGw7XG5cbnZhciBwYXJlbnROb2RlQ2FjaGUgPSB7fTtcblxuTW9kYWwuc2V0dGluZ3MgPSB7XG5cdGFsZXJ0RHVyYXRpb246IDEwMDAwXG59O1xuXG5Nb2RhbC5jb21wb25lbnRzID0ge1xuXHR0aXRsZTogbnVsbCxcblx0Ym9keTogJ0VtcHR5IG1vZGFsLicsXG5cdGlucHV0czogW11cbn07XG5cbi8vIHVwZGF0ZSBjb21wb25lbnRzXG5Nb2RhbC51cGRhdGUgPSBmdW5jdGlvbigpIHtcblx0aWYgKE1vZGFsLnRpdGxlKSB7XG5cdFx0aWYgKG5vZGVzLmNvbXBvbmVudHMudGl0bGUpIHtcblx0XHRcdG5vZGVzLmNvbXBvbmVudHMudGl0bGUuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG5cdFx0XHRub2Rlcy5jb21wb25lbnRzLnRpdGxlLmlubmVySFRNTCA9IE1vZGFsLmNvbXBvbmVudHMudGl0bGU7XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdG5vZGVzLmNvbXBvbmVudHMudGl0bGUuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblx0fVxuXHRpZiAobm9kZXMuY29tcG9uZW50cy5ib2R5KSB7XG5cdFx0bm9kZXMuY29tcG9uZW50cy5ib2R5LmlubmVySFRNTCA9IE1vZGFsLmNvbXBvbmVudHMuYm9keTtcblx0fVxuXHRpZiAoTW9kYWwuaW5wdXRzLmxlbmd0aCkge1xuXHRcdC8vIFRPRE9cblx0fVxufTtcblxuTW9kYWwuY3JlYXRlID0gZnVuY3Rpb24oSW50ZXJmYWNlcywgRXZlbnRzLCBDbGllbnQsIG1haW5XaW5kb3csIHBhcmVudE5vZGUpIHtcblx0Ly8gZ29lcyBvbiB0b3Agb2YgYmFja2dyb3VuZCwgc2ltdWxhdGVzIG92ZXJsYXkgbm9kZVxuXHQvLyBpbiBvcmRlciBmb3IgaXRzIGNoaWxkIG5vZGVzIHRvIGhhdmUgY29ycmVjdCByZWxhdGl2ZVxuXHQvLyBwb3NpdGlvbiB0byBhIGZ1bGwgYnJvd3NlciBwYWdlXG5cdG5vZGVzLnJvb3ROb2RlID0gSW50ZXJmYWNlcy5jb250cm9sbGVyLmNyZWF0ZURpdk5vZGUobWFpbldpbmRvdyk7XG5cdG5vZGVzLnJvb3ROb2RlLnN0eWxlLndpZHRoID0gJzEwMCUnO1xuXHRub2Rlcy5yb290Tm9kZS5zdHlsZS5oZWlnaHQgPSAnMTAwJSc7XG5cdG5vZGVzLnJvb3ROb2RlLnN0eWxlLnBvc2l0aW9uID0gJ2ZpeGVkJztcblx0bm9kZXMucm9vdE5vZGUuc3R5bGUubGVmdCA9IDA7XG5cdG5vZGVzLnJvb3ROb2RlLnN0eWxlLnRvcCA9IDA7XG5cdG5vZGVzLnJvb3ROb2RlLnN0eWxlLnpJbmRleCA9IDEwMDA7XG5cblx0Ly8gbWFpbiBzdWItY29udGFpbmVyIGZvciBpbnB1dHMgLyB0ZXh0XG5cdG5vZGVzLmNvbnRhaW5lck5vZGUgPSBJbnRlcmZhY2VzLmNvbnRyb2xsZXIuY3JlYXRlRGl2Tm9kZShtYWluV2luZG93KTtcblx0bm9kZXMuY29udGFpbmVyTm9kZS5jbGFzc05hbWUgPSAnUGljdHJlLXBhc3Njb2RlLXdyYXBwZXInO1xuXG5cdC8vIHdyYXBwZWQgYnkgY29udGFpbmVyTm9kZS4gV3JhcHMgY29udGVudC1cblx0Ly8gY29udGFpbmluZyBlbGVtZW50cyBzdWNoIGFzIGRpdnMsIHBhcmFncmFwaHMsIGV0Yy5cblx0dmFyIGNvbnRhaW5lck5vZGVDb250ZW50V3JhcHBlciA9IEludGVyZmFjZXMuY29udHJvbGxlci5jcmVhdGVEaXZOb2RlKG1haW5XaW5kb3cpO1xuXHRjb250YWluZXJOb2RlQ29udGVudFdyYXBwZXIuY2xhc3NOYW1lID0gJ1BpY3RyZS1wYXNzY29kZS1pbnB1dC13cmFwcGVyJztcblxuXHQvLyB3cmFwcGVkIGJ5IGNvbnRhaW5lck5vZGVDb250ZW50V3JhcHBlci5cblx0Ly8gbWFpbiB0ZXh0IHZpZXcgZm9yIHNwbGFzaCBcIm1vZGFsXCJcblx0dmFyIGNvbnRhaW5lck5vZGVDb250ZW50V3JhcHBlclRleHRDb250ZW50ID0gSW50ZXJmYWNlcy5jb250cm9sbGVyLmNyZWF0ZURpdk5vZGUobWFpbldpbmRvdyk7XG5cdGNvbnRhaW5lck5vZGVDb250ZW50V3JhcHBlclRleHRDb250ZW50LmNsYXNzTmFtZSA9ICdQaWN0cmUtcGFzc2NvZGUtcCc7XG5cdGNvbnRhaW5lck5vZGVDb250ZW50V3JhcHBlclRleHRDb250ZW50LnN0eWxlLmZvbnRTaXplID0gXCIwLjg1ZW1cIjtcblx0Y29udGFpbmVyTm9kZUNvbnRlbnRXcmFwcGVyVGV4dENvbnRlbnQuaW5uZXJIVE1MID0gJyc7XG5cblx0Ly8gcmVzZXQgaW5wdXRzXG5cdG5vZGVzLmNvbXBvbmVudHMuaW5wdXRzID0gW107XG5cblx0bm9kZXMuY29tcG9uZW50cy50aXRsZSA9IEludGVyZmFjZXMuY29udHJvbGxlci5jcmVhdGVOb2RlKG1haW5XaW5kb3csICdiJyk7XG5cdG5vZGVzLmNvbXBvbmVudHMudGl0bGUuY2xhc3NOYW1lID0gJ2JyYW5kJztcblx0bm9kZXMuY29tcG9uZW50cy50aXRsZS5zdHlsZS53aWR0aCA9ICcxMDAlJztcblx0bm9kZXMuY29tcG9uZW50cy50aXRsZS5zdHlsZS50ZXh0QWxpZ24gPSAnY2VudGVyJztcblx0bm9kZXMuY29tcG9uZW50cy50aXRsZS5zdHlsZS5mb250U2l6ZSA9ICcyLjJlbSc7XG5cdG5vZGVzLmNvbXBvbmVudHMudGl0bGUuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG5cdG5vZGVzLmNvbXBvbmVudHMudGl0bGUuc3R5bGUubWFyZ2luQm90dG9tID0gJzEwcHgnO1xuXG5cdC8vIG9ubHkgZGlzcGxheSB0aXRsZSBpZiBzZXRcblx0aWYgKE1vZGFsLmNvbXBvbmVudHMudGl0bGUpIHtcblx0XHRub2Rlcy5jb21wb25lbnRzLnRpdGxlLmlubmVySFRNTCA9IE1vZGFsLmNvbXBvbmVudHMudGl0bGU7XG5cdH1cblxuXHRub2Rlcy5jb21wb25lbnRzLmJvZHkgPSBJbnRlcmZhY2VzLmNvbnRyb2xsZXIuY3JlYXRlRGl2Tm9kZShtYWluV2luZG93KTtcblx0bm9kZXMuY29tcG9uZW50cy5ib2R5LmlubmVySFRNTCA9IE1vZGFsLmNvbXBvbmVudHMuYm9keTtcblxuXHQvLyB3cmFwcGVkIGJ5IGNvbnRhaW5lck5vZGVDb250ZW50V3JhcHBlclxuXHQvLyBkaXNwbGF5IGFsZXJ0cyBvciBvdXRwdXQgdGV4dFxuXHRub2Rlcy5vdXRwdXROb2RlID0gSW50ZXJmYWNlcy5jb250cm9sbGVyLmNyZWF0ZURpdk5vZGUobWFpbldpbmRvdyk7XG5cdG5vZGVzLm91dHB1dE5vZGUuY2xhc3NOYW1lID0gJ1BpY3RyZS1wYXNzY29kZS1wIFBpY3RyZS1wYXNzY29kZS1mb3JtYWwtZm9udCc7XG5cdG5vZGVzLm91dHB1dE5vZGUuc3R5bGUuZm9udFNpemUgPSAnMC44NWVtJztcblx0bm9kZXMub3V0cHV0Tm9kZS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuXG5cdC8vIGNyZWF0ZSBub2RlIHRyZWVcblx0Y29udGFpbmVyTm9kZUNvbnRlbnRXcmFwcGVyVGV4dENvbnRlbnQuYXBwZW5kQ2hpbGQobm9kZXMuY29tcG9uZW50cy50aXRsZSk7XG5cdGNvbnRhaW5lck5vZGVDb250ZW50V3JhcHBlclRleHRDb250ZW50LmFwcGVuZENoaWxkKG5vZGVzLmNvbXBvbmVudHMuYm9keSk7XG5cdGNvbnRhaW5lck5vZGVDb250ZW50V3JhcHBlci5hcHBlbmRDaGlsZChjb250YWluZXJOb2RlQ29udGVudFdyYXBwZXJUZXh0Q29udGVudCk7XG5cdGNvbnRhaW5lck5vZGVDb250ZW50V3JhcHBlci5hcHBlbmRDaGlsZChub2Rlcy5vdXRwdXROb2RlKTtcblx0aWYgKE1vZGFsLmNvbXBvbmVudHMuaW5wdXRzLmxlbmd0aCkge1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgTW9kYWwuY29tcG9uZW50cy5pbnB1dHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdG5vZGVzLmNvbXBvbmVudHMuaW5wdXRzLnB1c2goTW9kYWwuY29tcG9uZW50cy5pbnB1dHNbaV0pO1xuXHRcdFx0Y29udGFpbmVyTm9kZUNvbnRlbnRXcmFwcGVyLmFwcGVuZENoaWxkKG5vZGVzLmNvbXBvbmVudHMuaW5wdXRzW2ldKTtcblx0XHR9XG5cdH1cblx0bm9kZXMuY29udGFpbmVyTm9kZS5hcHBlbmRDaGlsZChjb250YWluZXJOb2RlQ29udGVudFdyYXBwZXIpO1xuXHRub2Rlcy5yb290Tm9kZS5hcHBlbmRDaGlsZChub2Rlcy5jb250YWluZXJOb2RlKTtcblx0cGFyZW50Tm9kZS5hcHBlbmRDaGlsZChub2Rlcy5yb290Tm9kZSk7XG5cblx0Ly8gaW5pdCBzcGxhc2ggbm9kZSBldmVudHMgYW5kIGFkanVzdCBwb3NpdGlvbnNcblx0RXZlbnRzLm5vd0FuZE9uTm9kZUV2ZW50KG1haW5XaW5kb3csICdyZXNpemUnLCBmdW5jdGlvbihlKSB7XG5cdFx0SW50ZXJmYWNlcy5jb250cm9sbGVyLmNlbnRlck5vZGVSZWxhdGl2ZVRvKG5vZGVzLmNvbnRhaW5lck5vZGUsIG1haW5XaW5kb3cpO1xuXHR9KTtcbn07XG5cbi8qKlxuICogRGlzcGxheXMgb3IgY3JlYXRlcyB0aGUgbW9kYWwsIHRoZW4gZGlzcGxheXMuXG4gKiByZWNlaXZlcyBhbiBvcHRpb25hbCBhcnJheSBvZiBpbnB1dHMgdG8gZGlzcGxheVxuICovXG5Nb2RhbC5zaG93ID0gZnVuY3Rpb24oSW50ZXJmYWNlcywgRXZlbnRzLCBDbGllbnQsIG1haW5XaW5kb3csIHBhcmVudE5vZGUsIGlucHV0c0FycmF5KSB7XG5cdGlmICghaXNDcmVhdGVkKSB7XG5cdFx0aXNDcmVhdGVkID0gdHJ1ZTtcblx0XHRNb2RhbC5jcmVhdGUoSW50ZXJmYWNlcywgRXZlbnRzLCBDbGllbnQsIG1haW5XaW5kb3csIHBhcmVudE5vZGUpO1xuXHR9IGVsc2Uge1xuXHRcdE1vZGFsLnVwZGF0ZSgpO1xuXHRcdEludGVyZmFjZXMuY29udHJvbGxlci5jZW50ZXJOb2RlUmVsYXRpdmVUbyhub2Rlcy5jb250YWluZXJOb2RlLCBtYWluV2luZG93KTtcblx0fVxuXG5cdC8vIGFzc3VtZXMgcm9vdE5vZGUgZXhpc3RzXG5cdGlmICghcGFyZW50Tm9kZUNhY2hlW3BhcmVudE5vZGUubm9kZU5hbWVdKSB7XG5cdFx0cGFyZW50Tm9kZUNhY2hlW3BhcmVudE5vZGUubm9kZU5hbWVdID0gcGFyZW50Tm9kZTtcblx0XHRyZXR1cm47XG5cdH1cblx0bm9kZXMucm9vdE5vZGUuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG59O1xuXG5Nb2RhbC5oaWRlID0gZnVuY3Rpb24ocGFyZW50Tm9kZSkge1xuXHRpZiAoIWlzQ3JlYXRlZCkge1xuXHRcdHJldHVybjtcblx0fVxuXHRpZiAoIXBhcmVudE5vZGVDYWNoZVtwYXJlbnROb2RlLm5vZGVOYW1lXSkge1xuXHRcdHJldHVybjtcblx0fVxuXHRub2Rlcy5yb290Tm9kZS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xufTtcblxuTW9kYWwuc2V0VGl0bGUgPSBmdW5jdGlvbih0aXRsZSkge1xuXHRNb2RhbC5jb21wb25lbnRzLnRpdGxlID0gdGl0bGU7XG59O1xuXG5Nb2RhbC5zZXRCb2R5ID0gZnVuY3Rpb24oYm9keSkge1xuXHRNb2RhbC5jb21wb25lbnRzLmJvZHkgPSBib2R5O1xufTtcblxuTW9kYWwuc2V0SW5wdXRzID0gZnVuY3Rpb24oaW5wdXRzQXJyYXkpIHtcblx0aWYgKGlucHV0c0FycmF5IGluc3RhbmNlb2YgQXJyYXkpIHtcblx0XHRNb2RhbC5jb21wb25lbnRzLmlucHV0cyA9IGlucHV0c0FycmF5O1xuXHR9XG59O1xuXG5Nb2RhbC5hZGRJbnB1dCA9IGZ1bmN0aW9uKGlucHV0KSB7XG5cdE1vZGFsLmNvbXBvbmVudHMuaW5wdXRzLnB1c2goaW5wdXQpO1xufTtcblxuTW9kYWwuc2hvd0FsZXJ0ID0gZnVuY3Rpb24odGV4dCwgdGltZW91dCkge1xuXHRub2Rlcy5vdXRwdXROb2RlLmlubmVySFRNTCA9IHRleHQ7XG5cdG5vZGVzLm91dHB1dE5vZGUuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG5cblx0aWYgKCF0aW1lb3V0KSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0Y2xlYXJUaW1lb3V0KGFsZXJ0VGltZW91dCk7XG5cdGFsZXJ0VGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0bm9kZXMub3V0cHV0Tm9kZS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuXHR9LCB0aW1lb3V0KTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTW9kYWw7IiwiLyoqXG4gKiBPdmVybGF5IGludGVyZmFjZVxuICovXG5cbnZhciBPdmVybGF5SW50ZXJmYWNlID0ge307XG5cbnZhciBpc0xvY2tlZCA9IGZhbHNlO1xudmFyIGl0ZXJhdG9yID0gMDtcbnZhciBjb21tZW50cyA9IG51bGw7XG52YXIgZG9tRWxlbWVudCA9IG51bGw7XG52YXIgZmVhdHVyZWRJbWFnZSA9IG51bGw7XG5cbnZhciBjYWxsYmFja3MgPSB7fTtcbnZhciBub2RlcyA9IHtcblx0b3ZlcmxheTogbnVsbFxufTtcblxuT3ZlcmxheUludGVyZmFjZS5pc0xvY2tlZCA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gaXNMb2NrZWQ7XG59XG5cbk92ZXJsYXlJbnRlcmZhY2Uuc2hvdyA9IGZ1bmN0aW9uKG1haW5XaW5kb3cpIHtcblx0aWYgKCFub2Rlcy5vdmVybGF5KSB7XG5cdFx0bm9kZXMub3ZlcmxheSA9IG1haW5XaW5kb3cuZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cdFx0bm9kZXMub3ZlcmxheS5jbGFzc05hbWUgPSAnUGljdHJlLW92ZXJsYXknO1xuXHRcdG5vZGVzLm92ZXJsYXkuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblx0XHRub2Rlcy5vdmVybGF5LnN0eWxlLnpJbmRleCA9IDk5OTtcblx0XHRtYWluV2luZG93LmRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQobm9kZXMub3ZlcmxheSk7XG5cdH1cblxuXHQkKG5vZGVzLm92ZXJsYXkpLmZhZGVJbig2MDApO1xufVxuXG5PdmVybGF5SW50ZXJmYWNlLmxvY2sgPSBmdW5jdGlvbigpIHtcblx0aXNMb2NrZWQgPSB0cnVlO1xufTtcblxuT3ZlcmxheUludGVyZmFjZS51bmxvY2sgPSBmdW5jdGlvbigpIHtcblx0aXNMb2NrZWQgPSBmYWxzZTtcbn07XG5cbk92ZXJsYXlJbnRlcmZhY2UuaGlkZSA9IGZ1bmN0aW9uKG1haW5XaW5kb3cpIHtcblx0aWYgKCFub2Rlcy5vdmVybGF5KSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0JChub2Rlcy5vdmVybGF5KS5mYWRlT3V0KDYwMCk7XG59XG5cbk92ZXJsYXlJbnRlcmZhY2UuZ2V0RmVhdHVyZWRJbWFnZSA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gZmVhdHVyZWRJbWFnZTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gT3ZlcmxheUludGVyZmFjZTsiLCIvKipcbiAqIFNwbGFzaCBpbnRlcmZhY2UgY29udHJvbGxlciBmb3IgZGlzcGxheWluZ1xuICogdGhlIG1haW4gKGZyb250KSB2aWV3IG9mIHRoZSBhcHAuXG4gKi9cblxudmFyIFNwbGFzaEludGVyZmFjZSA9IHt9O1xuXG5ub2RlcyA9IHtcblx0Ly8gaG9sZHMgXCJzcGxhc2hcIiB2aWV3J3MgYmFja2dyb3VuZFxuXHRyb290Tm9kZTogbnVsbCxcblx0aW5wdXROb2RlOiBudWxsXG59O1xuXG5TcGxhc2hJbnRlcmZhY2Uuc2V0dGluZ3MgPSB7XG5cdGFsZXJ0VGltZW91dDogMTAwMDBcbn07XG5cbnZhciBwYXJlbnROb2RlQ2FjaGUgPSB7fTtcblxuU3BsYXNoSW50ZXJmYWNlLnNob3dBbGVydCA9IGZ1bmN0aW9uKEludGVyZmFjZXMsIHRleHQpIHtcblx0SW50ZXJmYWNlcy5tb2RhbC5zaG93QWxlcnQodGV4dCk7XG59O1xuXG5TcGxhc2hJbnRlcmZhY2Uuc2hvd0FsZXJ0V2l0aFRpbWVvdXQgPSBmdW5jdGlvbihJbnRlcmZhY2VzLCB0ZXh0LCB0aW1lb3V0KSB7XG5cdEludGVyZmFjZXMubW9kYWwuc2hvd0FsZXJ0KHRleHQsIHRpbWVvdXQgfHwgU3BsYXNoSW50ZXJmYWNlLnNldHRpbmdzLmFsZXJ0VGltZW91dCk7XG59O1xuXG5TcGxhc2hJbnRlcmZhY2UuYXR0YWNoSW5wdXRzID0gZnVuY3Rpb24oSW50ZXJmYWNlcywgRXZlbnRzLCBDbGllbnQsIG1haW5XaW5kb3cpIHtcblx0aWYgKG5vZGVzLmlucHV0Tm9kZSkge1xuXHRcdEludGVyZmFjZXMubW9kYWwuc2V0SW5wdXRzKFtcblx0XHRcdG5vZGVzLmlucHV0Tm9kZS5nZXROb2RlKClcblx0XHRdKTtcblx0XHRyZXR1cm4gbnVsbDtcblx0fVxuXG5cdG5vZGVzLmlucHV0Tm9kZSA9IEludGVyZmFjZXMuY29udHJvbGxlci5uZXdJbnB1dE5vZGUoRXZlbnRzLCBtYWluV2luZG93KTtcblx0bm9kZXMuaW5wdXROb2RlLnNldFN0eWxlKCdjb2xvcicsICd3aGl0ZScpO1xuXHRub2Rlcy5pbnB1dE5vZGUuc2V0QXR0cmlidXRlKCdtYXhsZW5ndGgnLCAxMDApO1xuXHRub2Rlcy5pbnB1dE5vZGUuc2V0UGxhY2Vob2xkZXIoJ0VudGVyIGFuIGFsYnVtIG5hbWUnKTtcblxuXHRpZiAoQ2xpZW50LmlzSUUoKSB8fCBDbGllbnQuaXNNb2JpbGVTYWZhcmkoKSB8fCBDbGllbnQuaXNTYWZhcmkoJzUuMScpKSB7XG5cdFx0bm9kZXMuaW5wdXROb2RlLnNldEF0dHJpYnV0ZSgnbm9mb2N1cycsIHRydWUpO1xuXHRcdG5vZGVzLmlucHV0Tm9kZS5zZXRBdHRyaWJ1dGUoJ3ZhbHVlJywgdmFsdWUpO1xuXG5cdFx0bm9kZXMuaW5wdXROb2RlLm9uKCdibHVyJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0aWYgKHRoaXMubm9kZS52YWx1ZSA9PSBcIlwiICYmIHRoaXMudmFsdWUgIT0gJycpIHtcblx0XHRcdFx0dGhpcy5ub2RlLnZhbHVlID0gdGhpcy52YWx1ZTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxuXG5cdEV2ZW50cy5vbk5vZGVFdmVudChub2Rlcy5pbnB1dE5vZGUuZ2V0Tm9kZSgpLCAna2V5ZG93bicsIGZ1bmN0aW9uKGUpIHtcblx0XHRpZiAoIWUgfHwgZS5rZXlDb2RlICE9IDEzKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0aWYgKCF0aGlzLmlzVmFsdWVFbXB0eSgpKSB7XG5cdFx0XHR2YXIgdmFsdWUgPSB0aGlzLmdldEVzY2FwZWRWYWx1ZSgpO1xuXHRcdFx0aWYgKCFJbnRlcmZhY2VzLmJvYXJkLmlzTmFtZVJlc3RyaWN0ZWQodmFsdWUpKSB7XG5cdFx0XHRcdGlmIChJbnRlcmZhY2VzLmJvYXJkLmlzTmFtZUludmFsaWQodmFsdWUpKSB7XG5cdFx0XHRcdFx0aWYgKEludGVyZmFjZXMuYm9hcmQuaXNOYW1lV2l0aFNwYWNlcyh2YWx1ZSkpIHtcblx0XHRcdFx0XHRcdFNwbGFzaEludGVyZmFjZS5zaG93QWxlcnRXaXRoVGltZW91dChJbnRlcmZhY2VzLCBcIllvdXIgYWxidW0gbmFtZSBjYW5ub3QgY29udGFpbiBzcGFjZXMuXCIpO1xuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRTcGxhc2hJbnRlcmZhY2Uuc2hvd0FsZXJ0V2l0aFRpbWVvdXQoSW50ZXJmYWNlcywgXCJZb3VyIGFsYnVtIG5hbWUgY29udGFpbnMgaW52YWxpZCBjaGFyYWN0ZXJzLlwiKTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblx0XHRcdFx0bWFpbldpbmRvdy5sb2NhdGlvbi5hc3NpZ24odmFsdWUpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhpcy5zZXRWYWx1ZSgnJyk7XG5cdFx0XHRcdFNwbGFzaEludGVyZmFjZS5zaG93QWxlcnRXaXRoVGltZW91dChJbnRlcmZhY2VzLCBcIlRoYXQgYWxidW0gaXMgcmVzdHJpY3RlZCwgcGxlYXNlIHRyeSBhbm90aGVyLlwiKTtcblx0XHRcdH1cblx0XHR9XG5cdH0uYmluZChub2Rlcy5pbnB1dE5vZGUpKTtcblxuXHRJbnRlcmZhY2VzLm1vZGFsLnNldElucHV0cyhbXG5cdFx0bm9kZXMuaW5wdXROb2RlLmdldE5vZGUoKVxuXHRdKTtcblxuXHRyZXR1cm4gbnVsbDtcbn07XG5cblNwbGFzaEludGVyZmFjZS5zaG93ID0gZnVuY3Rpb24oSW50ZXJmYWNlcywgRXZlbnRzLCBDbGllbnQsIG1haW5XaW5kb3csIHBhcmVudE5vZGUpIHtcblx0aWYgKCFub2Rlcy5yb290Tm9kZSkge1xuXHRcdG5vZGVzLnJvb3ROb2RlID0gSW50ZXJmYWNlcy5jb250cm9sbGVyLmNyZWF0ZURpdk5vZGUobWFpbldpbmRvdyk7XG5cdFx0bm9kZXMucm9vdE5vZGUuY2xhc3NOYW1lID0gJ1BpY3RyZS1zcGxhc2gtd3JhcHBlcic7XG5cdFx0bm9kZXMucm9vdE5vZGUuc3R5bGUuekluZGV4ID0gOTk4O1xuXHR9XG5cdGlmICghcGFyZW50Tm9kZUNhY2hlW3BhcmVudE5vZGUubm9kZU5hbWVdKSB7XG5cdFx0cGFyZW50Tm9kZUNhY2hlW3BhcmVudE5vZGUubm9kZU5hbWVdID0gcGFyZW50Tm9kZTtcblx0XHRwYXJlbnROb2RlLmFwcGVuZENoaWxkKG5vZGVzLnJvb3ROb2RlKTtcblx0fVxuXG5cdC8vIHNldCB0aGVzZSBwcm9wZXJ0aWVzIGV2ZXJ5IHRpbWUsIGluIGNhc2UgbW9kYWwgZ2V0cyB1c2VkIGJ5XG5cdC8vIGFub3RoZXIgYXBwbGljYXRpb24gY29tcG9uZW50IHdpdGggZGlmZmVyZW50IHZhbHVlc1xuXHRJbnRlcmZhY2VzLm1vZGFsLnNldFRpdGxlKCdQaWN0cmUnKTtcblx0SW50ZXJmYWNlcy5tb2RhbC5zZXRCb2R5KFwiPGIgY2xhc3M9J2JyYW5kJz5QaWN0cmU8L2I+IDxzcGFuPmlzIGEgY29sbGVjdGlvbiBvZiBjbG91ZCBwaG90byBhbGJ1bXMuIFlvdSBjYW4gdmlldyBvciBjcmVhdGUgcGljdHVyZSBhbGJ1bXMgYmFzZWQgb24gaW50ZXJlc3RzLCBwZW9wbGUsIG9yIGZhbWlsaWVzLiA8L3NwYW4+XCIgK1xuXHRcdFwiPHNwYW4+VG8gZ2V0IHN0YXJ0ZWQsIHNpbXBseSB0eXBlIGFuIGFsYnVtIG5hbWUgYmVsb3cuPC9zcGFuPlwiKTtcblxuXHR2YXIgYWxidW1JbnB1dCA9IEludGVyZmFjZXMuY29udHJvbGxlci5jcmVhdGVOb2RlKG1haW5XaW5kb3csICdpbnB1dCcpO1xuXHRhbGJ1bUlucHV0Lm1heGxlbmd0aCA9IDEwMDtcblx0YWxidW1JbnB1dC5jbGFzc05hbWUgPSAnUGljdHJlLXBhc3Njb2RlLWlucHV0Jztcblx0YWxidW1JbnB1dC50eXBlID0gJ3RleHQ7J1xuXHRhbGJ1bUlucHV0LnBsYWNlaG9sZGVyID0gJ0VudGVyIGFuIGFsYnVtIG5hbWUnO1xuXHRhbGJ1bUlucHV0LnN0eWxlLmNvbG9yID0gJ3doaXRlJztcblxuXHRTcGxhc2hJbnRlcmZhY2UuYXR0YWNoSW5wdXRzKEludGVyZmFjZXMsIEV2ZW50cywgQ2xpZW50LCBtYWluV2luZG93KTtcblxuXHRJbnRlcmZhY2VzLm92ZXJsYXkuc2hvdyhtYWluV2luZG93KTtcblx0SW50ZXJmYWNlcy5tb2RhbC5zaG93KEludGVyZmFjZXMsIEV2ZW50cywgQ2xpZW50LCBtYWluV2luZG93LCBwYXJlbnROb2RlKTtcblxuXHRJbnRlcmZhY2VzLmNvbnRyb2xsZXIuc2V0Tm9kZU92ZXJmbG93SGlkZGVuKG1haW5XaW5kb3cuZG9jdW1lbnQuYm9keSk7XG5cdEludGVyZmFjZXMub3ZlcmxheS5sb2NrKCk7XG5cblx0bm9kZXMuaW5wdXROb2RlLmdldE5vZGUoKS5mb2N1cygpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFNwbGFzaEludGVyZmFjZTsiLCIvKipcbiAqIFdhcm5pbmcgaW50ZXJmYWNlLiBEaXNwbGF5cyBlcnJvcnMsIHdhcm5pbmdzLCBkaWFsb2d1ZXMuXG4gKi9cblxudmFyIFdhcm5pbmdJbnRlcmZhY2UgPSB7XG5cblx0ZG9tRWxlbWVudDogbnVsbCxcblx0cmVzcG9uc2U6IG51bGwsXG5cblx0LyoqXG5cdCAqIENyZWF0ZXMgYW5kIGRpc3BsYXlzIHdhcm5pbmcgaW50ZXJmYWNlLlxuXHQgKiBAcGFyYW0gcHJvcGVydGllcyBbb2JqZWN0XSBjb250YWluaW5nIGludGVyZmFjZSBzZXR0aW5ncyB0byBvdmVycmlkZVxuXHQgKlxuXHQgKi9cblx0cHV0OiBmdW5jdGlvbihwcm9wZXJ0aWVzKSB7XG5cblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0XHR2YXIgc2V0dGluZ3MgPSB7XG5cblx0XHRcdGJvZHk6ICdBbiBlcnJvciBoYXMgb2NjdXJyZWQsIGRvblxcJ3Qgd29ycnkgdGhvdWdoLCBpdFxcJ3Mgbm90IHlvdXIgZmF1bHQhJyxcblx0XHRcdGRyb3B6b25lOiBmYWxzZSxcblx0XHRcdGhlYWRlcjogJ0hleSEnLFxuXHRcdFx0aWNvbjogbnVsbCxcblx0XHRcdGxvY2tlZDogZmFsc2UsXG5cdFx0XHRzdHlsZTogdHJ1ZSxcblx0XHRcdG1vZGFsOiB0cnVlXG5cblx0XHR9O1xuXG5cdFx0aWYgKHByb3BlcnRpZXMpIHtcblxuXHRcdFx0Zm9yICh2YXIgaSBpbiBwcm9wZXJ0aWVzKSB7XG5cdFx0XHRcdHNldHRpbmdzW2ldID0gcHJvcGVydGllc1tpXTtcblx0XHRcdH1cblxuXHRcdH1cblxuXHRcdGlmICghc2V0dGluZ3MubW9kYWwpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQvLy8vLS0tXG5cdFx0aWYgKFBpY3RyZS5nYWxsZXJ5LmlzLmZlYXR1cmluZyAmJiBzZXR0aW5ncy5sb2NrZWQpIHtcblx0XHRcdFBpY3RyZS5fc3RvcmFnZS5vdmVybGF5LmxvY2tlZCA9IGZhbHNlO1xuXHRcdFx0UGljdHJlLmdhbGxlcnkub3ZlcmxheS5leGl0KCk7XG5cdFx0fVxuXG5cdFx0dGhpcy5kb21FbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblx0XHR0aGlzLmRvbUVsZW1lbnQuY2xhc3NOYW1lID0gXCJQaWN0cmUtdXBsb2FkIFBpY3RyZS13YXJuaW5nXCI7XG5cblx0XHRQaWN0cmUuZ2FsbGVyeS5pcy53YXJuaW5nID0gdHJ1ZTtcblxuXHRcdFBpY3RyZS5leHRlbmQoUGljdHJlLmdhbGxlcnkub3ZlcmxheS5wdXQoKS5hcHBlbmRDaGlsZCh0aGlzLmRvbUVsZW1lbnQpKS5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdH0pO1xuXG5cdFx0dGhpcy5wb3NpdGlvbigpO1xuXG5cdFx0UGljdHJlLmV2ZW50cy5vbigncmVzaXplJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRzZWxmLnBvc2l0aW9uKCk7XG5cdFx0fSk7XG5cblx0XHR2YXIgaGVhZGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblx0XHRoZWFkZXIuY2xhc3NOYW1lID0gXCJQaWN0cmUtdXBsb2FkLWhlYWRlclwiO1xuXHRcdGhlYWRlci5pbm5lckhUTUwgPSBzZXR0aW5ncy5oZWFkZXI7XG5cdFx0aGVhZGVyLnN0eWxlLnpJbmRleCA9IFwiOTk5XCI7XG5cblx0XHR2YXIgcCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJwXCIpO1xuXHRcdHAuY2xhc3NOYW1lID0gXCJQaWN0cmUtd2FybmluZy1wXCI7XG5cdFx0cC5pbm5lckhUTUwgPSBzZXR0aW5ncy5ib2R5IHx8IFwiVW50aXRsZWQgdGV4dFwiO1xuXG5cdFx0dGhpcy5kb21FbGVtZW50LmFwcGVuZENoaWxkKGhlYWRlcik7XG5cblx0XHRpZiAoc2V0dGluZ3MuZHJvcHpvbmUpIHtcblx0XHRcdHZhciBzaGFkZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuXHRcdFx0c2hhZGVyLmNsYXNzTmFtZSA9IFwiUGljdHJlLXVwbG9hZC1hcmVhLXNoYWRlclwiO1xuXHRcdFx0c2hhZGVyLmFwcGVuZENoaWxkKHApO1xuXHRcdFx0dmFyIGFyZWEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuXHRcdFx0YXJlYS5jbGFzc05hbWUgPSBcIlBpY3RyZS11cGxvYWQtYXJlYVwiO1xuXHRcdFx0YXJlYS5hcHBlbmRDaGlsZChzaGFkZXIpO1xuXHRcdFx0dGhpcy5kb21FbGVtZW50LmFwcGVuZENoaWxkKGFyZWEpO1xuXHRcdFx0YXJlYS5zdHlsZS5tYXJnaW5MZWZ0ID0gKC1hcmVhLmNsaWVudFdpZHRoIC8gMikgKyBcInB4XCI7XG5cdFx0XHRhcmVhLnN0eWxlLm1hcmdpblRvcCA9ICgtYXJlYS5jbGllbnRIZWlnaHQgLyAyICsgMjApICsgXCJweFwiO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBub3QgdXBsb2FkIGludGVyZmFjZSwgd2FybmluZyB1aSBpbnN0ZWFkXG5cdFx0XHR0aGlzLmRvbUVsZW1lbnQuYXBwZW5kQ2hpbGQocCk7XG5cdFx0XHRwLnN0eWxlLm1hcmdpblRvcCA9ICgodGhpcy5kb21FbGVtZW50LmNsaWVudEhlaWdodCAtIGhlYWRlci5jbGllbnRIZWlnaHQpIC8gMiAtIChwLmNsaWVudEhlaWdodCAvIDIpKSArIFwicHhcIjtcblxuXHRcdFx0aGVhZGVyLnN0eWxlLnRvcCA9ICgtcC5jbGllbnRIZWlnaHQpICsgJ3B4Jztcblx0XHR9XG5cblx0XHRpZiAoc2V0dGluZ3MuaWNvbikge1xuXG5cdFx0XHR2YXIgaWNvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbWdcIik7XG5cdFx0XHRpY29uLnNyYyA9IHNldHRpbmdzLmljb247XG5cdFx0XHRpY29uLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XG5cdFx0XHRpY29uLnN0eWxlLm1hcmdpbiA9IFwiMjBweCBhdXRvIDAgYXV0b1wiO1xuXG5cdFx0XHRwLmFwcGVuZENoaWxkKGljb24pO1xuXG5cdFx0fVxuXG5cdFx0aWYgKHNldHRpbmdzLmxvY2tlZCkge1xuXHRcdFx0UGljdHJlLl9zdG9yYWdlLm92ZXJsYXkubG9ja2VkID0gdHJ1ZTtcblx0XHR9XG5cblx0XHRpZiAodHlwZW9mIHRoaXMub25jbGljayA9PSAnZnVuY3Rpb24nKSB7XG5cblx0XHRcdGlmIChzZXR0aW5ncy5kcm9wem9uZSkge1xuXG5cdFx0XHRcdFBpY3RyZS5leHRlbmQoYXJlYSkub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0c2VsZi5vbmNsaWNrKCk7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHR9IGVsc2Uge1xuXG5cdFx0XHRcdFBpY3RyZS5leHRlbmQodGhpcy5kb21FbGVtZW50KS5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRzZWxmLm9uY2xpY2soKTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdH1cblxuXHRcdH1cblx0fSxcblxuXHRvbmNsaWNrOiBudWxsLFxuXG5cdHBvc2l0aW9uOiBmdW5jdGlvbigpIHtcblx0XHRpZiAodGhpcy5kb21FbGVtZW50KSB7XG5cdFx0XHR0aGlzLmRvbUVsZW1lbnQuc3R5bGUubGVmdCA9IE1hdGgubWF4KCQod2luZG93KS53aWR0aCgpIC8gMiAtICh0aGlzLmRvbUVsZW1lbnQuY2xpZW50V2lkdGggLyAyKSwgMCkgKyBcInB4XCI7XG5cdFx0XHR0aGlzLmRvbUVsZW1lbnQuc3R5bGUudG9wID0gTWF0aC5tYXgoKCQod2luZG93KS5oZWlnaHQoKSAvIDIgLSAodGhpcy5kb21FbGVtZW50LmNsaWVudEhlaWdodCAvIDIpKSwgMCkgKyBcInB4XCI7XG5cdFx0fVxuXHR9LFxuXG5cdHJlbW92ZTogZnVuY3Rpb24oKSB7XG5cdFx0UGljdHJlLmdhbGxlcnkuaXMud2FybmluZyA9IGZhbHNlO1xuXHRcdFBpY3RyZS5nYWxsZXJ5Lm92ZXJsYXkuZXhpdCgpO1xuXHRcdHRoaXMuZG9tRWxlbWVudC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMuZG9tRWxlbWVudCk7XG5cdFx0dGhpcy5kb21FbGVtZW50ID0gbnVsbDtcblx0fVxuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gV2FybmluZ0ludGVyZmFjZTsiLCIvKipcbiAqIEhlbHBlciBmdW5jdGlvbnNcbiAqL1xuXG52YXIgVXRpbGl0aWVzID0ge307XG5cblV0aWxpdGllcy5leHRlbmQgPSBmdW5jdGlvbihkb21PYmplY3QpIHtcblxuXHRyZXR1cm4ge1xuXHRcdG9uOiBmdW5jdGlvbih0eXBlLCBjYWxsYmFjaykge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0ZG9tT2JqZWN0LmFkZEV2ZW50TGlzdGVuZXIodHlwZSxmdW5jdGlvbihlKSB7XG5cdFx0XHRcdFx0aWYodHlwZW9mIGNhbGxiYWNrID09ICdmdW5jdGlvbicpIGNhbGxiYWNrLmNhbGwoZG9tRWxlbWVudCwgZSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSBjYXRjaChlKSB7XG5cdFx0XHRcdGRvbU9iamVjdC5hdHRhY2hFdmVudCgnb24nICsgdHlwZSxmdW5jdGlvbihlKSB7XG5cdFx0XHRcdFx0aWYodHlwZW9mIGNhbGxiYWNrID09ICdmdW5jdGlvbicpIGNhbGxiYWNrLmNhbGwoZG9tRWxlbWVudCxlKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gVXRpbGl0aWVzOyJdfQ==
