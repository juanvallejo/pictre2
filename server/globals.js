#!/bin/env node

/**
 * define all global variables and constants for server
 *
 * @author 	juanvallejo
 * @date 	3/9/15
 */

var Globals = {};

// define application constants

Globals.IN_PRODUCTION = process.env.OPENSHIFT_NODEJS_IP ? true : false;
Globals.USE_PRODUCTION_DB = Globals.IN_PRODUCTION;
Globals.USE_HTTPS = process.env.USE_HTTPS || false

// if a --force-production-state flag is passed on the command line, force the global IN_PRODUCTION constant to be true
// used for debugging offline, with a live, port-forwarded copy of the database
if (process.argv[2] == '--force-production-state') {
	console.log('> warning: App is not in live environment, but has been forced into production mode. App will assume Openshift production mysql database has been port-forwarded to localhost.');
	Globals.USE_PRODUCTION_DB = true;
}

Globals.SERVER_HOST = process.env.IP || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';
Globals.SERVER_PORT = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8000;
Globals.SERVER_HEAD_OK = 200;
Globals.SERVER_HEAD_NOTFOUND = 404;
Globals.SERVER_HEAD_ERROR = 500;
Globals.SERVER_RES_OK = '200. Server status: OK';
Globals.SERVER_RES_NOTFOUND = '404. The file you are looking for could not be found.';
Globals.SERVER_RES_ERROR = '500. An invalid request was sent to the server.';

// logs
if (!process.env.OPENSHIFT_NODEJS_IP && !process.env.IP) {
	console.log('No OpenShift env var for host found, defaulting to', Globals.SERVER_HOST);
}
if (!process.env.OPENSHIFT_NODEJS_PORT && !process.env.PORT) {
	console.log('No OpenShift env var for port found, defaulting to', Globals.SERVER_PORT);
}

// header modifier for api domain access control
Globals.DEFAULT_PUBLIC_ACCESS_CONTROL = '*';

// define mysql constants

if (Globals.USE_PRODUCTION_DB) {
	console.log('Using production database / port-forwarded database');
	Globals.MYSQL_DEFAULT_HOST = process.env.OPENSHIFT_MYSQL_DB_HOST || 'localhost';
	Globals.MYSQL_DEFAULT_PASS = 'i4JF6GlABkqW';
	Globals.MYSQL_DEFAULT_DB = 'static';
	Globals.MYSQL_DEFAULT_USER = 'adminHhI41YY';
	Globals.MYSQL_DEFAULT_PORT = process.env.OPENSHIFT_MYSQL_DB_PORT || '41976';

} else {
	console.log('Using local dabatase. Use --force-production-state if port-forwarding.');
	Globals.MYSQL_DEFAULT_HOST = 'localhost';
	Globals.MYSQL_DEFAULT_PASS = '';
	Globals.MYSQL_DEFAULT_DB = 'static';
	Globals.MYSQL_DEFAULT_USER = 'root';
	Globals.MYSQL_DEFAULT_PORT = '3306';

}

// define global variables
Globals.Application = null;
Globals.currentRequest = null;
Globals.rootDirectory = __dirname;

// global response headers for all responses
Globals.defaultResponseHeaders = {
	'Content-Type': 'text/plain'
};

// global response headers for all responses
Globals.defaultPublicResponseHeaders = {

	'Content-Type': 'text/plain',
	'Access-Control-Allow-Origin': Globals.DEFAULT_PUBLIC_ACCESS_CONTROL

};

// expose all global variables
module.exports = Globals;