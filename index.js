#!/bin/env node

/**
 * Provided under the MIT License (c) 2014
 * See LICENSE @file for details.
 *
 * @file index.js
 *
 * @author juanvallejo
 * @date 2/28/15
 *
 * Pictre.org modular server framework. Integrates with Red Hat's OPENSHIFT platform.
 * Fork of @juanvallejo's NodT Modular server application framework.
 *
 **/

// import http module
var http = require('http');

// import custom node libraries
var Globals = require('./server/globals.js');
var Handlers = require('./server/handlers.js');
// var Sockets			= require('./server/sockets.js');

// define root of working directory
Globals.rootDirectory = __dirname;

// initialize application
(function main(application) {

	// define global application server and bind to a specified port
	application = http.createServer(function(req, res) {
		Handlers.mainRequestHandler(req, res, Globals)
	});
	application.listen(Globals.SERVER_PORT, Globals.SERVER_HOST);

	application.on('error', function(err) {
		if (err.code == 'EADDRINUSE') {
			console.log('SERVER INFO port' + Globals.SERVER_PORT + ' busy.');
			Globals.SERVER_PORT++
			
			console.log('SERVER INFO restarting application on port', Globals.SERVER_PORT);
			main(Globals.Application);
			return;
		}
		console.log('SERVER ERR', err);
	})

	application.on('request', function(req, res) {
		console.log('SERVER REQUEST received a request', req.url);
	})

	console.log('Application listening on port', Globals.SERVER_PORT);
	// initialize socket.io
	// Sockets.listen(application);

})(Globals.Application);