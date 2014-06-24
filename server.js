//=====set up===
var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();
var mongoose = require('mongoose'); //MongoDB


// configuration ===========================================
		
	// config files
	var db = require('./config/db');

	var port = process.env.PORT || 8080; // set our port
	// mongoose.connect(db.url); // connect to our mongoDB database (uncomment after you enter in your own credentials in config/db.js)

	app.configure(function() {
		app.use(express.static(__dirname + '/public')); 	// set the static files location /public/img will be /img for users
		app.use(express.logger('dev')); 					// log every request to the console
		app.use(express.bodyParser()); 						// have the ability to pull information from html in POST
		app.use(express.methodOverride()); 					// have the ability to simulate DELETE and PUT
		app.use(express.json());       // to support JSON-encoded bodies
		app.use(express.urlencoded()); // to support URL-encoded bodies

	});

	// routes ==================================================
	require('./app/routes')(app); // configure our routes


// assuming POST: name=foo&color=red            <-- URL encoding
//
// or       POST: {"name":"foo","color":"red"}  <-- JSON encoding

app.post('/formtest', function(sReq, sRes){

    var name = sReq.query.name.;

}
//=====web scraper===
app.post('/scrape', function(req, res){
	  res.send('You sent the name "' + req.body.name + '".');

	url = 'http://www.imdb.com/title/tt1229340/';

	request(url, function(error, response, html){
		if(!error){
			var $ = cheerio.load(html);

			var title, release, rating;
			var json = { title : "", release : "", rating : ""};

			$('.header').filter(function(){
		        var data = $(this);
		        title = data.children().first().text();            
                release = data.children().last().children().text();

		        json.title = title;
                json.release = release;
	        })

            $('.star-box-giga-star').filter(function(){
	        	var data = $(this);
	        	rating = data.text();

	        	json.rating = rating;
	        })
		}
        // To write to the system we will use the built in 'fs' library.
        // In this example we will pass 3 parameters to the writeFile function
        // Parameter 1 :  output.json - this is what the created filename will be called
        // Parameter 2 :  JSON.stringify(json, null, 4) - the data to write, here we do an extra step by calling JSON.stringify to make our JSON easier to read
        // Parameter 3 :  callback function - a callback function to let us know the status of our function

        fs.writeFile('output.json', JSON.stringify(json, null, 4), function(err){

        	console.log('File successfully written! - Check your project directory for the output.json file');

        })

        // Finally, we'll just send out a message to the browser reminding you that this app does not have a UI.
        res.send('Check your console!')
	})
})

app.listen('8081');
console.log('Magic happens on port 8081');
exports = module.exports = app;