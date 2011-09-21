//These are required node library files to assist us.
var sys = require('sys'),
	http = require('http'),
	fs = require('fs'),
	url = require('url'),
	express = require('express')
	M = require('./mustache');

var actions = [];
 actions.push({
     path: "/",
     template: "./templates/index.html",
     view: {
        filename: "", // placeholder
		content: ""	// placeholder
   }
})

var parseData = function(text) {
	// split into lines
	lines = text.split("\n");
	
	tfoot = "", tbody ="", results = "";
	
	console.log("Processing lines:" + lines.length);	
	for(i = 0; i < lines.length; i++) {
		parts = lines[i].split("\t");		
		if(parts[0] != "" && parts[1] != "" && parts[0] != undefined && parts[1] != undefined) {
			tfoot += "<th>" + parts[0] + "</th>\n";
			tbody += "<td>" + parts[1] + "</td>\n";
		}
	}
	
	results += "<table id=\"data\"><tfoot><tr>" + tfoot + "</tr></tfoot><tbody><tr>" + tbody + "</tr></tbody></table>";
	
	return(results);
}

var app = express.createServer(express.logger());

app.get('/', function(request, response) {
	// retrieve the file from Hadoop
	// hardcoded path: https://s3-eu-west-1.amazonaws.com/mrdata/output-hps/part-r-00000
	//uri = "https://s3-eu-west-1.amazonaws.com/mrdata/output-hps/part-r-00000";
	
	if(request.query.file == undefined) {
		response.write("Please provide the URL of a remote resource");
		response.end();
	}
	else {
		urlParts = url.parse(request.query.file);

		http.get({host: urlParts.host, path: urlParts.pathname }, function(res) {
			// placeholder for the data read from the remote server
			data = "";

			res.on('data', function(chunk) {
				// accumulate the data as it is received
				data += chunk;
			});
			res.on('end', function() {
				// when all data has been received...
				fs.readFile(actions[0].template, function(err, template) {
			        response.writeHead(200, {'Content-Type': 'text/html'});
					template = template.toString();								
					actions[0].view['content'] = parseData(data);
					actions[0].view['filename'] = urlParts.pathname;
					response.write(M.to_html(template, actions[0].view));
					response.end()
			   })			
			});
		}).on('error', function(error) {
			sys.log("There was an error loading the file");
			response.write("The remote resource does not exist or it cannot be reached");
			response.end();
		});		
	}	  
});

var port = process.env.PORT || 8080;
app.listen(port, function() {
  console.log("Listening on " + port);
});