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
		
		list: {
			require:		['fbuid','secret'],
			auth:			false,
			description:	"List a user's friends",
			params:			{},
			status:			'dev',
			version:		1.0,
			callback:		function(params, req, res, callback) {
				
				// Find the user's friends first
				scope.mongo.find({
					collection:	'users',
					query:	{
						fbuid:		params.fbuid.toString(),
						secret:		params.secret.toString()
					}
				}, function(response) {
					if (response.length == 0) {
						callback(Gamify.api.errorResponse("Couldn't identify the user."));
					} else {
						
						var user = response[0];
						
						// Now we list the profiles
						scope.mongo.find({
							collection:	'users',
							query:	{
								fbuid:		{
									$in:	user.fbfriends
								}
							}
						}, function(friends) {
							
							// Filter the data
							friends = _.map(friends, function(friend) {
								return {
									fbuid:	friend.fbuid,
									name:	friend.data.name,
									avatar:	friend.avatar
								};
							});
							
							callback(friends);
						});
						
					}
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