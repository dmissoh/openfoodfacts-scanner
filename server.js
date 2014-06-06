var express = require('express'),
        app = express(),
       path = require('path'),
    request = require("request"),
       cors = require('cors');

/**
 * CORS support.
 */
app.use(cors());

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res){
  	var body = "This is the entry point of the application.";
  	res.setHeader('Content-Type', 'text/html');
  	res.setHeader('Content-Length', body.length);
  	res.end(body);
});

app.get('/foodfacts', function(req, res){
	var barcode = req.query.barcode;
	replyObj = {
        status: 'product not found'
    };
	request("http://fr.openfoodfacts.org/api/v0/produit/" + barcode + ".json", function(error, response, body) {
		var json = JSON.parse(body);
		var status_verbose = json.status_verbose;
		if(status_verbose == 'product found'){
			var product = json.product;
			console.log("product: ", product);
			replyObj.status = "product found"
			replyObj.product = product;
			res.send(200, replyObj);
		} else {
			res.send(200, replyObj);
		}
	});
});

app.listen(3000);
console.log("Node.js server is running on port 3000");
