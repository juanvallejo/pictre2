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