var _ 					= require('underscore');
var toolset 			= require("toolset");

exports.dataProvider = function (Gamify) {
	
	Gamify.data.component = new (function() {
		
		var scope 			= this;
		
		this.flattenVersion	= function(version, safe) {
			return [version.major, version.minor, version.build].join(safe?'_':'.');
		};
		
		this.get	= function(data, callback) {
			
			var query = _.extend({}, data.query);
			
			scope.mongo.find({
				collection:	'components',
				query:		query
			}, function(response) {
				
				// No component with that query!
				if (response.length == 0) {
					callback(false);
					return false;
				}
				
				// Check for ownership
				if (response[0].admins && _.contains(response[0].admins, data.uid)) {
					callback(response[0]);
				} else {
					callback("NORIGHT");
				}
				
			});
		};
		
		this.create	= function(data, callback) {
			
			// Prepare the versions data
			var version 			= scope.flattenVersion(data.data.version);
			var versionSafe 		= scope.flattenVersion(data.data.version, true);
			var versions			= {};
			versions[versionSafe] 	= data.data;
			
			scope.mongo.insert({
				collection:	'components',
				data:		{
					uid:			data.uid,
					id:				data.data.id,
					type:			data.data.type,
					name:			data.data.name,
					displayName:	data.data.displayName,
					key:			toolset.crypto.uuid(),
					admins:			[data.uid],
					latest:			data.data,
					link:			data.data.link?data.data.link:false,
					onepage:		data.data.onepage?true:false,
					status:			{
						verified:	false,	// else, safe-version (maj_min_build)		This indicates what version has been verified by the pagevamp team
						published:	false,	// else, safe-version (maj_min_build)		This indicates if it's published in the app store, and if yes what version
						awaiting:	false	// else, safe-version (maj_min_build)		This indicates if the user has requested a validation for that app, and if yes, what version
					},
					versions:		versions,
					created_on:		new Date(),
					updated_on:		new Date(),
					history:		[{
						version:		version,
						publishedBy:	data.uid,
						date:			new Date()
					}]
				}
			}, function(err, response) {
				if (err) {
					callback(false);
					return false;
				}
				callback(response[0]);
			});
		};
		
		this.update	= function(data, callback) {
			
			// prepare the update Data
			var updateData = {};
			updateData['versions.'+scope.flattenVersion(data.data.version, true)] = data.data;
			updateData['latest']		= data.data;
			updateData['updated_on']	= new Date();
			updateData['link']			= data.data.link?data.data.link:false;
			
			scope.mongo.update({
				collection:	'components',
				query:		{
					admins:	{
						$in:	[data.uid]
					},
					id:	data.data.id
				},
				data:		{
					$set:	updateData,
					$push:	{
						history:	{
							version:		scope.flattenVersion(data.data.version),
							publishedBy:	data.uid,
							date:			new Date()
						}
					}
				}
			}, function(err, response) {
				if (err) {
					callback(false);
					return false;
				}
				callback(response[0]);
			});
		};
		
		
		this.getProjectData	= function(filename, callback) {
			var scope = this;
			
			toolset.file.exists(filename, function(exists) {
				if (!exists) {
					callback(false);
					return false;
				} else {
					toolset.file.toObject(filename, function(data) {
						if (!data) {
							callback(false);
							return false;
						} else {
							callback(data);
						}
					});
				}
			});
		};
		
		this.mongo	= new Gamify.mongo({database: Gamify.settings.db});
		this.mongo.init(function() {
			
		});
	})();
};