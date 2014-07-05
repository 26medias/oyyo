var _ 					= require('underscore');
var pkgcloud			= require('pkgcloud');
var toolset 			= require("toolset");
var path 				= require("path");
//var progressbar			= require('pace');
var progressbar 		= require('progress');

exports.dataProvider = function (Gamify) {
	
	Gamify.data.cdn = new (function() {
		
		var scope 			= this;
		
		
		var client = pkgcloud.storage.createClient({
			provider: 	'rackspace',
			authUrl: 	"https://identity.api.rackspacecloud.com",
			region: 	"DFW",
			username: 	'pmbcreative',
			password: 	'Turtle91'
		});
		
		this.containerNames = {
			components:		'pv_prototype',
			SDK:			'SDK'
		};
		
		
		this.containers 		= {};
		this.containersFiles 	= {};
		
		this.getContainerData = function(container, callback) {
			if (scope.containers[container]) {
				callback(scope.containers[container]);
			} else {
				client.getContainer(container, function (err, containerData) {
					
					containerData.url 			= containerData.cdnUri;
					//Gamify.log("containerData.url", containerData.url);
					scope.containers[container] = containerData;
					
					callback(scope.containers[container]);
				});
			}
		};
		
		this.getFiles = function(container, callback) {
			if (scope.containersFiles[container]) {
				callback(scope.containersFiles[container]);
			} else {
				client.getFiles(container, {limit:Infinity}, function (err, files) {
					// Process, remove the junk info
					var output = [];
					_.each(files, function(file) {
						output.push(file.name);
					});
					scope.containersFiles[container] = output;
					callback(output);
				});
			}
		};
		
		this.uploadAll = function(options, callback) {
			
			options = _.extend({
				dir:		"./",
				container:	"images-client",
				ext:		["jpg","png"],
				force:		false,
				local:		false
			},options);
			
			
			var fileStack = new Gamify.stack();
			
			// First we list all the files in the container
			scope.getFiles(options.container, function(online_files) {
				
				var filenames 	= [];
				
				// List the files for each type of file extention
				_.each(options.ext, function(ext) {
					fileStack.add(function(p, cb) {
						//Gamify.log("dir",(options.local?"":Gamify.settings.options.basepath)+options.dir);
						toolset.file.listFiles((options.local?"":Gamify.settings.options.basepath)+options.dir, p.ext, function(files) {
							//Gamify.log("files",files);
							_.each(files, function(file) {
								//Gamify.log("file",options.local?file:file.substr(Gamify.settings.options.basepath.length));
								filenames.push(options.local?file:file.substr(Gamify.settings.options.basepath.length));
							});
							cb();
						});
					}, {ext:ext});
				});
				
				
				fileStack.process(function() {
					var uploadList = [];
					
					if (!options.force) {
						// We compare, only upload the files that are not online yet
						_.each(filenames, function(filename) {
							if (!_.contains(online_files, filename)) {
								uploadList.push(filename);
							}
						});
					} else {
						uploadList = filenames;
					}
					
					
					if (uploadList.length == 0) {
						callback({
							found:		filenames,
							files:		[],
							message:	"No new file to upload."
						});
						return true;
					}
					
					
					
					// Upload the files
					scope.batchUpload({
						container:	options.container,
						filenames:	uploadList,
						local:		options.local
					}, function(response) {
						callback({
							found:		filenames,
							files:		response
						});
					});
					
				}, true);
			});
			
		};
		
		this.batchUpload = function(options, callback) {
			
			options = _.extend({
				filenames:	[],
				remotePath:	'/',
				root:		'',		// Root of the files, so the path can be substracted
				container:	"images-client",
				local:		false
			},options);
			
			scope.getContainerData(options.container, function(containerData) {
				
				var output = [];
				
				var stack 	= new Gamify.stack();
					
				var t 		= options.filenames.length;
				var c 		= 0;
				
				//var progress		= progressbar(t);
				console.log('');
				console.log('Uploading '+t+' files to the CDN...');
				console.log('');
				var bar = new progressbar('  Uploading [:bar] :percent :etas', {
					complete: 	'=',
					incomplete:	' ',
					width: 		20,
					total: 		t
				});
				
				_.each(options.filenames, function(filename) {
					stack.add(function(p, cb) {
						
						var remoteFilename	= (options.remotePath+path.relative(options.root, path.dirname(filename))+'/'+path.basename(filename)).replace(/\\/gmi, '/').replace(/\/\//gmi, '/');
						
						toolset.log("remoteFilename", remoteFilename);
						
						scope.upload({
							container:	options.container,
							local:		path.normalize((options.local?Gamify.directory+'/':'')+filename),
							remote:		remoteFilename
						}, function(err, url) {
							output.push(url);
							c++;
							//console.log("Completed: ", (c/t*100).toFixed(2)+"% - ["+c+"/"+t+"]");
							//progress.op(1);
							bar.tick(1);
							cb();
						});
					}, {});
				});
				stack.process(function() {
					//console.log("\n\nUpload finished.");
					callback(output);
				}, true);
			});
			
		}
		
		this.upload = function(options, callback) {
			options = _.extend({
				container:	'images-client',
				remote: 	'zoidberg.jpg',
				local: 		'zoidberg.jpg',
				metadata:	{
					uploaded_on:	new Date().toString()
				}
			},options);
			
			client.upload(options, function(err, status) {
				if (status) {
					scope.getContainerData(options.container, function(data) {
						//toolset.log(">>>>data.url",data.url);
						//toolset.log(">>>>options.remote",options.remote);
						callback(false, data.url+"/"+options.remote);
					});
				} else {
					callback(err);
				}
			});
		};
		
		
		
	})();
};