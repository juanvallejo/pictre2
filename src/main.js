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