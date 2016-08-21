#!/bin/env node

/**
 * Non-mutable at runtime
 * Core api functions. Handles functions exposed by the public api endpoints. The API module is invoked any time a request
 * is sent with /api/... at its root.
 *
 * Note: This is an API template based on a previously-done application. Please read comments on `database.js` file to get a better perspective on its method calls.
 * The information from the previous app used with this file is left intact as a sample "template" for future uses.
 *
 * @author	juanvallejo
 * @date 	3/9/15
 */

// import Database object
var Database = require('./database.js');
var Errors = require('./errors.js');
var PublicResponses = require('./public_responses.js');
var Utilities = require('./utilities.js');

// define our main API object
var API = {};

/**
 * Fetch an array of images from a specific album. Values are returned
 * fro most recent to least.
 *
 * @param albumName = [String]		name of album data to fetch
 * @param anchor 	= [Integer]		initial offset of values to fetch
 * @param limit 	= [Integer]		amount of items to fetch
 * @param callback 	= [Function]	function to call after message is returned
 * 
 * @return json array of image sorted by descending order.
 */
API.getAlbumDataFromDatabase = function(albumName, anchor, limit, callback) {
	Database.query('SELECT * FROM `all` LEFT JOIN (SELECT COUNT(id) AS total FROM `all` WHERE album="' + albumName + '") count ON id WHERE album="' + albumName + '" GROUP BY id ORDER BY time DESC LIMIT ' + anchor + ',' + limit, callback);
}

/**
 * Fetch all available comments from database
 *
 * @param imageId 	= [Integer] 	id of image to fetch comments from
 * @param columns 	= [Array] 		columns to select
 * @param callback 	= [Function]	function to call after message is returned
 */
API.getCommentsFromDatabase = function(callback) {
	Database.selectFrom('comments', ['*'], null, callback);
}

/**
 * Fetch all comments for a specific image
 *
 * @param imageId 	= [Integer] 	id of image to fetch comments from
 * @param columns 	= [Array] 		columns to select
 * @param callback 	= [Function]	function to call after message is returned
 */
API.getImageCommentsFromDatabase = function(imageId, columns, callback) {
	Database.selectFrom('comments', columns, 'pictureId="' + imageId + '"', callback);
}

/**
 * Returns total image count for a specific album
 *
 * @param albumName = [String]		name of album data to fetch
 */
API.getAlbumSize = function(albumName, callback) {
	Database.selectFrom('all', ['COUNT(id) AS count'], 'album="' + albumName + '"', callback);
}

/**
 * Parse any request with /api/ as its root
 */
API.parseGETRequest = function(request, response) {

	var apiRequest = request.url.split('/api/')[1];
	var apiRequestFragment = apiRequest.split('/');

	// fetch a resource from the database
	if (apiRequestFragment[0] == 'album') {

		// example: api/get/album/orozco/0/50
		var albumName = apiRequestFragment[1];
		var anchor = apiRequestFragment[2]; // album name, admin users, etc..
		var limit = apiRequestFragment[3]; // limit of items to return

		API.getAlbumDataFromDatabase(albumName, anchor, limit, function(err, rows, cols) {

			if (err) {
				console.log('(Error): Api > Mysql -> ' + err);
				return PublicResponses.respondWithJSON(response, Errors.MYSQL.ERR_FETCH_ALBUMDATA, 500);
			}

			PublicResponses.respondWithJSON(response, rows, 200);
			// fetch comments
			// API.getCommentsFromDatabase(function(err, commentRows, commentCols) {

			// 	if (err) {
			// 		console.log('(Error): Api > Mysql > Mysql -> ' + err);
			// 	}

			// 	// categorize comments by pictureId

			// 	var comments = {};

			// 	for (var i = 0; i < commentRows.length; i++) {

			// 		if (!comments[commentRows[i].pictureId]) {
			// 			comments[commentRows[i].pictureId] = [];
			// 		}

			// 		comments[commentRows[i].pictureId].push(commentRows[i]);

			// 	}

			// 	// add comments to each album row

			// 	for (var i = 0; i < rows.length; i++) {

			// 		var imageComments = [];

			// 		if (comments[rows[i].id]) {
			// 			imageComments = comments[rows[i].id];
			// 		}

			// 		rows[i].comments = imageComments;

			// 	}

			// 	// output image data with comments appended
			// 	PublicResponses.respondWithJSON(response, rows, 200);

			// });

		});

	} else {
		PublicResponses.respondWithMessage(response, 'Unimplemented api request: ' + apiRequest, 500);
	}

}

// expose our api functions
module.exports = API;