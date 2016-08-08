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