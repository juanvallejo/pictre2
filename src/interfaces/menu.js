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