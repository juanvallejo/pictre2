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