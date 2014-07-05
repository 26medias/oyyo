var _ 				= require('underscore');
var qs 				= require("querystring");
var toolset 		= require("toolset");
var path 			= require("path");

// Users
function api() {
	
}
api.prototype.init = function(Gamify, callback){
	var scope = this;
	
	this.Gamify = Gamify;
	
	// Return the methods
	var methods = {
		
		upload: {
			require:		[],
			auth:			'apikey',
			description:	"Upload endpoint",
			params:			{},
			status:			'stable',
			version:		1,
			callback:		function(params, req, res, callback) {
				
				Gamify.log("0","");
				if (req.files && req.files.component) {
					// Copy the file
					var tempname 		= toolset.crypto.uuid();
					var zipfile 		= path.normalize(Gamify.directory+'/temp/'+tempname+'.tar.gz');
					var tempDirectory	= path.normalize(Gamify.directory+'temp/'+tempname+'/');
					
					Gamify.log("1","");
					toolset.file.copy(req.files.component.path, zipfile, function() {
						
						Gamify.log("2","");
						// Unzip
						toolset.archive.extract(zipfile, tempDirectory, function() {
							
							Gamify.log("3","");
							// Delete the zip
							toolset.file.removeFile(zipfile, function() {
								
								Gamify.log("4","");
								// Check the component's data
								Gamify.data.component.getProjectData(tempDirectory+'/component.json', function(componentData) {
									
									Gamify.log("5",componentData);
									if (!componentData) {
										
										Gamify.log("6 A","");
										
										callback(Gamify.api.errorResponse("This is not a valid component."));
										
										// Delete the temp files
										toolset.file.removeDir(tempDirectory, function() {});
										
									} else {
									
										Gamify.log("6 B","");
										
										// Check if the component exists
										Gamify.data.component.get({
											uid:	params.__auth,
											query:	{
												id:		componentData.id
											}
										}, function(component) {
											
											Gamify.log("7","");
											// Does the user has the admin rights to update that component?
											if (component == "NORIGHT") {
												// Component exist but the user doesn't have admin rights
												callback(Gamify.api.errorResponse("You do not have admin rights for that component. If you think this is a mistake, please contact the owner of that component."));
												
												// In the background, remove the temp files
												toolset.file.removeDir(tempDirectory, function() {});
												
												return false;
											}
											
											Gamify.log("8","");
											
											// Component exists and we have the right to update it.
											// Upload the new files to the CDN
											// Prepare the list of files
											toolset.file.listFiles(tempDirectory, false, function(files) {
												
												Gamify.log("9",files);
												// Now we setup the directory on the CDN
												var cdnPath = '/components/'+componentData.id+'/'+[componentData.version.major,componentData.version.minor,componentData.version.build].join('.')+'/';
												// Now we upload all the files to the CDN
												
												Gamify.data.cdn.batchUpload({
													filenames:	files,
													root:		tempDirectory,
													remotePath:	cdnPath,
													container:	Gamify.data.cdn.containerNames.components,
													local:		false
												}, function(cdnResponse) {
													
													Gamify.log("10","");
													
													if (component === false) {
														
														Gamify.log("11 A","");
														// New components
														Gamify.data.cdn.getContainerData(Gamify.data.cdn.containerNames.components, function(containerData) {
															
															Gamify.log("12 A","");
															// Update the compponent's data
															componentData.cdnPath = containerData.url+cdnPath;
															
															// Create
															Gamify.data.component.create({
																uid:	params.__auth,
																data:	componentData
															}, function(response) {
																Gamify.log("13 A","");
																callback(response);
															});
														});
													} else {
														Gamify.log("11 B","");
														
														// Existing component
														// Update
														Gamify.data.cdn.getContainerData(Gamify.data.cdn.containerNames.components, function(containerData) {
															
															Gamify.log("12 B","");
															// Update the compponent's data
															componentData.cdnPath = containerData.url+cdnPath;
															Gamify.data.component.update({
																uid:	params.__auth,
																data:	componentData
															}, function(response) {
																
																Gamify.log("13 B","");
																callback({
																	updated: true
																});
															});
														});
													}
													
													
													// In the background, remove the temp files
													toolset.file.removeDir(tempDirectory, function() {});
												});
											});
										})
									}
								});
							});
						});
					});
				}
			}
		},
		
		sysupload: {
			require:		[],
			auth:			'sys',
			description:	"Upload endpoint for system data, like the SDK",
			params:			{},
			status:			'stable',
			version:		1,
			callback:		function(params, req, res, callback) {
				
				
				// List the files to upload
				var files	= [];
				
				// ProcessStack
				var processStack = new Gamify.stack();
				
				var tempDirectory	= path.normalize(Gamify.directory+'temp/');
				
				// Get the container data
				Gamify.data.cdn.getContainerData(Gamify.data.cdn.containerNames.SDK, function(containerData) {
					
					var uploadParam;
					for (uploadParam in req.files) {
						processStack.add(function(p, cb) {
							
							// Copy the file to a temp folder
							var filename	= path.normalize(tempDirectory+req.files[p.uploadParam].originalFilename);
							toolset.log("Copying from "+req.files[p.uploadParam].path+" to "+filename);
							toolset.file.copy(req.files[p.uploadParam].path, filename, function() {
								files.push(filename);
								cb();
							});
							
						},{uploadParam:uploadParam});
					}
					
					processStack.process(function() {
						Gamify.data.cdn.batchUpload({
							filenames:	files,
							remotePath:	'',
							container:	Gamify.data.cdn.containerNames.SDK,
							local:		false
						}, function(cdnResponse) {
							callback({
								files:	cdnResponse
							});
						});
					}, true);
					
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