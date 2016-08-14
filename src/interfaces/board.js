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