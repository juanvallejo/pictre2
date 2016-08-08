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
 * adds a user, logged in through facebook to the mysql database
 */
API.addUserToDatabase = function(name, thumbnail, facebookId, callback) {
	Database.insertInto('keeptouch_user', ['name', 'thumbnail', 'fb_id'], [name, thumbnail, facebookId], callback);
}

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
	Database.selectFrom('all', ['*'], 'album="' + albumName + '" ORDER BY time DESC LIMIT ' + anchor + ',' + limit, callback);
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
 * Used to update conversation values, primarily after a message has been posted dynamically
 */
API.updateConversationById = function(conversationId, columnsToUpdate, valuesToUpdate, callback) {
	Database.update('keeptouch_conversation', columnsToUpdate, valuesToUpdate, 'id="' + conversationId + '"', callback);
}

/**
 * Fetch an individual conversation for a pair of users from mysql database. Returns as JSON response
 * Does NOT include any messages. Simply the conversation's data
 *
 * @param conversationId 	= [Integer]		id of conversation item to fetch (Does NOT include messages)
 * @param callback 			= [Function]	function to call after message is returned
 */
API.getConversationFromDatabase = function(conversationId, callback) {
	Database.selectFrom('keeptouch_conversation', ['*'], 'id="' + conversationId + '"', callback);
}

/**
 * Fetch an individual conversation for a pair of users from mysql database, using both of those user's ids. Returns as JSON response
 * Does NOT include any messages. Simply the conversation's data. Sample endpoint -> /conversation/{user_id_1}/{user_id_2}
 *
 * @param firstRecipientId 	= [Integer]		id of the first user involved in a conversation
 * @param secondRecipientId = [Integer]		id of the second user involved in a conversation
 * @param callback 			= [Function]	function to call after message is returned
 */
API.getConversationByRecipientIdsFromDatabase = function(firstRecipientId, secondRecipientId, callback) {
	Database.selectFrom('keeptouch_conversation', ['*'], '(user1_id="' + firstRecipientId + '" AND user2_id="' + secondRecipientId + '") OR (user1_id="' + secondRecipientId + '" AND user2_id="' + firstRecipientId + '")', callback);
}

/**
 * Requires a conversation id. Returns the last 20 messages in a conversation between two users,
 * ordered by message timestamp.
 *
 * @param conversationId 	= [Integer] id of conversation to return
 * @param callback			= [Function] id of second user participating in conversation to fetch
 */
API.getConversationMessagesFromDatabase = function(conversationId, callback) {
	Database.selectFrom('keeptouch_message', ['*'], 'conversation_id="' + conversationId + '" ORDER BY timestamp ASC LIMIT 20', callback);
}

/**
 * Returns all conversations where a user is either the recipient or sender. Ordered by timestamp, descending. Includes the latest message for each conversation in
 * the returned object.
 * 
 * @param recipientId 	= [Integer] 	id of recipient to return messages by sender for
 * @param callback		= [Function]	function to call after query returns
 */
API.getConversationsForRecipientIdFromDatabase = function(recipientId, callback) {
	Database.selectFrom('keeptouch_conversation', ['*'], 'user1_id="' + recipientId + '" OR user2_id="' + recipientId + '"', callback);
}

/**
 * Returns all contacts for a specific user id.
 *
 * @param recipientId 	= [Integer] 	id of recipient to return messages by sender for
 * @param callback		= [Function]	function to call after query returns
 */
API.getContactsForRecipientIdFromDatabase = function(recipientId, callback) {
	Database.selectFrom('keeptouch_user_friends LEFT JOIN keeptouch_user ON keeptouch_user_friends.to_user_id=keeptouch_user.id', ['*'], 'from_user_id="' + recipientId + '"', callback);
}

/**
 * Fetch a user object from a normal id
 *
 * @param userId 		= [Integer] 	facebook id of user to return user object for
 * @param callback		= [Function]	function to call after query returns
 */
API.getUserFromId = function(userId, callback) {
	Database.selectFrom('keeptouch_user', ['*'], 'id="' + userId + '"', callback);
}

/**
 * Fetch a user object from a facebook id
 *
 * @param facebookId 	= [Integer] 	facebook id of user to return user object for
 * @param callback		= [Function]	function to call after query returns
 */
API.getUserFromFacebookId = function(facebookId, callback) {
	Database.selectFrom('keeptouch_user', ['*'], 'fb_id="' + facebookId + '"', callback);
}

/**
 * checks to see if a conversation between two users exists, if it does, that one is returned, if not it is created, and then returned.
 */
API.createNewConversation = function(firstRecipientId, secondRecipientId, callback) {

	// see if a conversation between these two recipients exists
	Database.selectFrom('keeptouch_conversation', ['*'], '(user1_id="' + firstRecipientId + '" AND user2_id="' + secondRecipientId + '") OR (user1_id="' + secondRecipientId + '" AND user2_id="' + firstRecipientId + '")', function(err, rows, columns) {

		// determine if a conversation exists
		if (rows.length > 0) {
			return callback.call(Database, err, rows, callback);
		}

		if (err) {
			return PublicResponses.respondWithMessage(response, 'Mysql error: ' + err, 500);
		}

		// create new conversation between the two id's
		Database.insertInto('keeptouch_conversation', ['timestamp', 'is_read', 'user1_id', 'user2_id', 'last_message'], [Utilities.getISODateStamp(), 0, firstRecipientId, secondRecipientId, ''], function(err, result) {

			if (err) {
				return PublicResponses.respondWithMessage(response, 'Mysql error: ' + err, 500);
			}

			Database.selectFrom('keeptouch_conversation', ['*'], 'id="' + result.insertId + '"', callback);

		});


	});

}

/**
 * Parse any request with /api/ as its root
 */
API.parseGETRequest = function(request, response) {

	var apiRequest = request.url.split('/api/')[1];
	var apiRequestFragment = apiRequest.split('/');

	// fetch a resource from the database
	if (apiRequestFragment[0] == 'get') {

		// example: api/get/album/orozco/0/50
		var resource = apiRequestFragment[1]; // album, image, users, etc..
		var identifier = apiRequestFragment[2]; // album name, admin users, etc..
		var anchor = apiRequestFragment[3]; // return rows starting at row {anchor}
		var limit = apiRequestFragment[4]; // how many rows to return of requested resource


		if (resource == 'album') {

			API.getAlbumDataFromDatabase(identifier, anchor, limit, function(err, rows, cols) {

				if (err) {
					console.log('(Error): Api > Mysql -> ' + err);
					return PublicResponses.respondWithJSON(response, Errors.MYSQL.ERR_FETCH_ALBUMDATA, 500);
				}

				// fetch comments
				API.getCommentsFromDatabase(function(err, commentRows, commentCols) {

					if (err) {
						console.log('(Error): Api > Mysql > Mysql -> ' + err);
					}

					// categorize comments by pictureId

					var comments = {};

					for (var i = 0; i < commentRows.length; i++) {

						if (!comments[commentRows[i].pictureId]) {
							comments[commentRows[i].pictureId] = [];
						}

						comments[commentRows[i].pictureId].push(commentRows[i]);

					}

					// add comments to each album row

					for (var i = 0; i < rows.length; i++) {

						var imageComments = [];

						if (comments[rows[i].id]) {
							imageComments = comments[rows[i].id];
						}

						rows[i].comments = imageComments;

					}

					// output image data with comments appended
					PublicResponses.respondWithJSON(response, rows, 200);

				});

			});

		} else if (resource == 'image') {
			PublicResponses.respondWithJSON(response, Errors.API.ERR_API_UNFINISHED_ENDPOINT, 500);
		} else {
			PublicResponses.respondWithJSON(response, Errors.API.ERR_API_UNFINISHED_ENDPOINT, 500);
		}

	} else if (apiRequestFragment[0] == 'message') {

		API.getMessageFromDatabase(apiRequestFragment[1], function(err, rows, cols) {

			if (err) {
				console.log('Mysql error: ' + err);
				return PublicResponses.respondWithMessage(response, 'Mysql error: ' + err, 500);
			}

			PublicResponses.respondWithJSON(response, rows, 200);

		});

		// handle multiple mssage fetching by conversation-batches (conversation_id)
	} else if (apiRequestFragment[0] == 'messages') {

		// fetch all messages for a conversation_id
		if (apiRequestFragment[1] == 'conversation') {

			// check to see that a conversation id is given
			if (!apiRequestFragment[2]) {
				return PublicResponses.respondWithMessage(response, 'Api error: A conversation id is required', 500);
			}

			API.getConversationMessagesFromDatabase(apiRequestFragment[2], function(err, rows, cols) {

				if (err) {
					return PublicResponses.respondWithMessage(response, 'Mysql error: ' + err, 500);
				}

				PublicResponses.respondWithJSON(response, rows, 200);

			});

		} else {
			PublicResponses.respondWithMessage(response, 'unimplemented api', 500);
		}

		// handle single-conversation fetching by conversation_id
	} else if (apiRequestFragment[0] == 'conversation') {

		if (apiRequestFragment[1] == 'users') {

			// check to see that both user id's are given
			if (apiRequestFragment.length != 4) {
				return PublicResponses.respondWithMessage(response, 'Api error: Two user id\'s are required.', 500);
			}

			// get a single conversation item using two user's id's
			API.getConversationByRecipientIdsFromDatabase(apiRequestFragment[2], apiRequestFragment[3], function(err, rows, cols) {

				if (err) {
					return PublicResponses.respondWithMessage(response, 'Mysql error: ' + err, 500);
				}

				PublicResponses.respondWithJSON(response, rows, 200);
			});

			// create a new conversation, if one between two users does not already exist
		}
		if (apiRequestFragment[1] == 'new') {

			//check to see that messages update a conversation
			if (apiRequestFragment.length != 4) {
				return PublicResponses.respondWithMessage(response, 'Api error: a sender and receiver id are required -> /conversation/new/{user_id_1}/{user_id_2}');
			}

			API.createNewConversation(apiRequestFragment[2], apiRequestFragment[3], function(err, rows, cols) {

				if (err) {
					return PublicResponses.respondWithMessage(response, 'Mysql >error: ' + err, 500);
				}

				PublicResponses.respondWithJSON(response, rows, 200);
			});

		} else {

			// get a single conversation item
			API.getConversationFromDatabase(apiRequestFragment[1], function(err, rows, cols) {

				if (err) {
					return PublicResponses.respondWithMessage(response, 'Mysql error: ' + err, 500);
				}

				PublicResponses.respondWithJSON(response, rows, 200);
			});

		}

		// handle multiple conversation fetching by user_id
	} else if (apiRequestFragment[0] == 'conversations') {

		// get all conversations where user_id is participating
		if (apiRequestFragment[1] == 'user') {

			// check to see that a user id is given
			if (!apiRequestFragment[2]) {
				return PublicResponses.respondWithMessage(response, 'Api error: A user id is required', 500);
			}

			API.getConversationsForRecipientIdFromDatabase(apiRequestFragment[2], function(err, rows, cols) {

				if (err) {
					return PublicResponses.respondWithMessage(response, 'Mysql error: ' + err, 500);
				}

				PublicResponses.respondWithJSON(response, rows, 200);

			});

		} else {
			PublicResponses.respondWithMessage(response, 'unimplemented api', 500);
		}

		// handle multiple contact fetching by user_id
	} else if (apiRequestFragment[0] == 'contacts') {

		// get all contacts where user_id is user_from
		if (apiRequestFragment[1] == 'user') {

			// check to see that a user id is given
			if (!apiRequestFragment[2]) {
				return PublicResponses.respondWithMessage(response, 'Api error: A user id is required', 500);
			}

			API.getContactsForRecipientIdFromDatabase(apiRequestFragment[2], function(err, rows, cols) {

				if (err) {
					return PublicResponses.respondWithMessage(response, 'Mysql error: ' + err, 500);
				}

				PublicResponses.respondWithJSON(response, rows, 200);

			});

		} else {
			PublicResponses.respondWithMessage(response, 'unimplemented api', 500);
		}

		// get a user object from a facebook id token
	} else if (apiRequestFragment[0] == 'user') {

		if (apiRequestFragment[1] == 'fb_id') {

			// check to see that a facebook id is given
			if (!apiRequestFragment[2]) {
				return PublicResponses.respondWithMessage(response, 'Api error: A facebook id is required', 500);
			}

			API.getUserFromFacebookId(apiRequestFragment[2], function(err, rows, cols) {

				if (err) {
					return PublicResponses.respondWithMessage(response, 'Mysql error: ' + err, 500);
				}

				PublicResponses.respondWithJSON(response, rows, 200);

			});

		} else if (apiRequestFragment[1] == 'id') {

			// check to see that a facebook id is given
			if (!apiRequestFragment[2]) {
				return PublicResponses.respondWithMessage(response, 'Api error: A user id is required', 500);
			}

			API.getUserFromId(apiRequestFragment[2], function(err, rows, cols) {

				if (err) {
					return PublicResponses.respondWithMessage(response, 'Mysql error: ' + err, 500);
				}

				PublicResponses.respondWithJSON(response, rows, 200);

			});

		} else {
			PublicResponses.respondWithMessage(response, 'unimplemented api', 500);
		}

	} else {
		PublicResponses.respondWithMessage(response, 'Unimplemented api request: ' + apiRequest, 500);
	}

}

// expose our api functions
module.exports = API;