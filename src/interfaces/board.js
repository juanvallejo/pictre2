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
	var picture = Interfaces.controller.createDivNode(mainWindow);
	picture.innerHTML = 'Loading...';
	picture.className = 'Pictre-pic';
	picture.id = 'pic' + object.id;
	picture.data = object;

	Board.pictures.push(picture);
	nodes.rootNode.appendChild(picture);

	// re-position loading image
	if (Board.getRequestAnchor()) {
		Board.chisel(mainWindow, nodes.rootNode, Board.pictures, Board.getRequestAnchor());
	}

	var image = new Image();
	image.src = Environment.baseAPIUrl + '/' + object.thumb;

	if (!Board.getRequestAnchor() && !isLoadedImages && nodes.rootNode.style.display != 'none') {
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

	function handler(picture, image) {
		Board.imageLoadHandler(mainWindow, picture, image, objects.length);
	}

	for (var i in objects) {
		Board.loadImage(Interfaces, Events, mainWindow, objects[i], handler);
	}
};

// called when a single image is loaded
Board.imageLoadHandler = function(mainWindow, picture, image, setCount) {
	loadedImageCount++;

	// remove "loading" note from picture and append image
	picture.innerHTML = '';
	picture.appendChild(image);

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
	var itemWidth = collection[0].offsetWidth;
	var itemMargin = 0;
	var columnCount = 0;

	if (windowWidth && itemWidth) {
		itemMargin = parseInt(mainWindow.getComputedStyle(collection[0]).getPropertyValue('margin-left').split("px")[0] * 2);
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
			collection[i].first = false;
			collection[i].left = 0;
			collection[i].style.top = '0px';
			collection[i].style.left = '0px';
		}

		if (offset == 0) {
			for (var i = offset; i < collection.length; i += columnCount) {
				collection[i].first = true;
			}
		} else {
			for (var i = offset; i < collection.length; i++) {
				if (collection[i - columnCount] && collection[i - columnCount].first) {
					collection[i].first = true;
				}
			}
		}

		for (var i = offset; i < collection.length; i++) {
			if (!collection[i].first) {
				collection[i].left = collection[i - 1].left + collection[i - 1].offsetWidth + itemMargin;
				collection[i].style.left = collection[i].left + "px";

			}
			if (collection[i - columnCount]) {
				collection[i].style.top = (collection[i - columnCount].offsetTop + collection[i - columnCount].offsetHeight + itemMargin - (collection[i].offsetTop)) + "px";
			}
		}
	}

	Board.emit('chisel', [rootNode, itemMargin]);
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