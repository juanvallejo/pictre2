/**
 * Define global error definitions for our application.
 * 
 * @author juanvallejo
 * @date 5/27/15
 */

var Errors = {};

// define api error object
Errors.API = {

	ERR_API_UNFINISHED_ENDPOINT : {
		code 	: 'ERR_API_UNFINISHED_ENDPOINT',
		status 	: 500,
		message : 'Error: Unimplemented API Endpoint'
	}

}

// define mysql error object
Errors.MYSQL = {

	ERR_FETCH_ALBUMDATA : {
		code 	: 'ERR_FETCH_ALBUMDATA',
		status 	: 500,
		message : 'Error: Unable to fetch album data at this time.'
	}

}

module.exports = Errors;