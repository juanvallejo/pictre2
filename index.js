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

	// initialize socket.io
	// Sockets.listen(application);

})(Globals.Application);