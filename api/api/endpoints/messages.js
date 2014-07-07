var _ 					= require('underscore');
var qs 					= require("querystring");
var social 				= require("social-api");

// Users
function api() {
	
}
api.prototype.init = function(Gamify, callback){
	var scope = this;
	
	this.Gamify = Gamify;
	
	var fb 			= new social.facebook();
	fb.appid		= Gamify.options.appid;
	fb.appsecret	= Gamify.options.appsecret;
	
	
	
	// Return the methods
	var methods = {
		
		send: {
			require:		['type','to'],
			auth:			"app",
			description:	"Send a message",
			params:			{},
			status:			'dev',
			version:		1.0,
			callback:		function(params, req, res, callback) {
				
				var message;
				
				switch (params.type) {
					default:
					case "positive":
						message = "Hey!";
					break;
					case "negative":
						message = "Fuck you!";
					break;
				}
				
				scope.mongo.insert({
					collection:	'messages',
					data:		{
						id:			scope.Gamify.crypto.md5(scope.Gamify.uuid.v4()),
						from:		params.__auth,
						to:			params.to.toString(),
						message:	message,
						date:		new Date(),
						seen:		false
					}
				}, function(err, message) {
					callback({sent: true, message: message});
				});
				
			}
		},
		read: {
			require:		['id'],
			auth:			"app",
			description:	"mark a message as read",
			params:			{},
			status:			'dev',
			version:		1.0,
			callback:		function(params, req, res, callback) {
				
				scope.mongo.update({
					collection:	'messages',
					query:	{
						id:		params.id,
						to:		params.__auth
					},
					data:		{
						$set:	{
							seen:		new Date()
						}
					}
				}, function(err, message) {
					callback({read: true});
				});
				
			}
		},
		list: {
			require:		[],
			auth:			"app",
			description:	"List the latest unread messages",
			params:			{},
			status:			'dev',
			version:		1.0,
			callback:		function(params, req, res, callback) {
				
				scope.mongo.find({
					collection:	'messages',
					query:	{
						to:		params.__auth,
						seen:	false
					}
				}, function(messages) {
					// List the uids
					var uids = _.pluck(messages, 'from');
					
					// Get the profiles for those uids
					scope.mongo.find({
						collection:	'users',
						query:	{
							fbuid:	{
								$in:	uids
							}
						}
					}, function(users) {
						
						// Filter the profiles
						users = _.map(users, function(user) {
							return {
								fbuid:	user.fbuid,
								name:	user.data.name,
								avatar:	user.avatar
							};
						});
						
						// Index by uid
						var profiles = _.indexBy(users, 'fbuid');
						
						// recreate the message list
						messages = _.map(messages, function(message) {
							message.from	= profiles[message.from];
							return message;
						});
						
						callback(messages);
					});
				});
				
			}
		}
	};
	
	// Init a connection
	this.mongo	= new this.Gamify.mongo({database:Gamify.settings.db});
	this.mongo.init(function() {
		callback(methods);
	});
}
exports.api = api;