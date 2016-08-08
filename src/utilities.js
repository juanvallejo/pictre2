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