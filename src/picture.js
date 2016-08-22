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