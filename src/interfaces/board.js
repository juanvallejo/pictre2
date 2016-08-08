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