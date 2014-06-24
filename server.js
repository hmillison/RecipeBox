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



//=====web scraper for Food Network recipes===
app.get('/scrape', function(req, res){
	url = 'http://www.foodnetwork.com/recipes/bobby-deen/bobbys-loaded-baked-potato-recipe.html?ic1=obinsite';

	request(url, function(error, response, html){
		if(!error){
			var $ = cheerio.load(html);

			var food, ingredients, directions, image;
			var json = { name : "", image: "", ingredients : "", directions : ""};

			$('.tier-3.title').filter(function(){
		        var data = $(this);
		        name = data.children().first().text();

		        json.name = name;
	        })

	        $('.col6.ingredients').filter(function(){
	        	var data = $(this);
	        	var list = data.children().last().children();
	        	var parts = [];
	        	ingredients = ""
	        	list.each(function(i, elem) {
  					parts[i] = $(this).text();
  					ingredients += parts[i] + "::";
				});
	        	json.ingredients = ingredients;
	        })
	        
	        $('.col12.pic.collapsed').filter(function(){
	        	var data = $(this).find('img');
	        	image = data.attr('src');
	        	json.image = image;	
	        })
	        
	        $('.col12.directions').filter(function(){
	        	var data = $(this);
	        	var list = data.children().nextUntil('categories');
	        	var parts = [];
	        	directions = ""
	        	list.each(function(i,elem){
	        		parts[i] = $(this).text();
	        		directions += parts[i] + "::";
	        	});
	        	json.directions = directions;	
	        })
		}

		fs.writeFile('output.json', JSON.stringify(json, null, 4), function(err){
        	console.log('File successfully written! - Check your project directory for the output.json file');
        })

        res.send('Check your console!')
	})
})
app.listen('8081');
console.log('Magic happens on port 8081');
exports = module.exports = app;
