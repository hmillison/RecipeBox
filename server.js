//=====set up===
var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();
var mongoose = require('mongoose'); //MongoDB
var passport = require('passport');
var flash 	 = require('connect-flash');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');
app.use(bodyParser());

// configuration ===========================================
		
	// config files
	var db = require('./config/db');

	var port = process.env.PORT || 8080; // set our port
	mongoose.connect(db.url); // connect to our mongoDB database
	
     app.use(express.static(__dirname + '../public'));
 
		
       require('./config/passport')(passport); // pass passport for configuration

		// set up our express application
		app.use(morgan('dev')); // log every request to the console
		app.use(cookieParser()); // read cookies (needed for auth)
		app.set('view engine', 'ejs'); // set up ejs for templating
		// required for passport
		app.use(session({ secret: 'ilovescotchscotchyscotchscotch' })); // session secret
		app.use(passport.initialize());
		app.use(passport.session()); // persistent login sessions
		app.use(flash()); // use connect-flash for flash messages stored in session
	// routes ==================================================

	require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport

// define model =================
var recipe = mongoose.model('recipe', {
		text : String
});





var posturl = ""
// This route receives the posted form.
// As explained above, usage of 'body-parser' means
// that `req.body` will be filled in with the form elements
app.post('/', function(req, res){
  posturl = req.body.url;
 
  res.redirect('/scrape');
  	 var loading = "<i class='icon-spinner icon-spin icon-large'></i>";
   res.render('index.ejs',{recipes: loading}); // load the index.ejs file

});


//=====web scraper for Food Network recipes===
app.get('/scrape', function(req, res){

	url = posturl;
	//Appends http:// to urls to ensure proper scraping
	if(url.substr(0,3) == "www")
	{
		url = "http://" + url
	}
	
	
	request(url, function(error, response, html){
		//Checks url to ensure it matches the supported websites
	    var validurl = "foodnetwork.com/recipes/";
	    if(url.indexOf(validurl) == -1)
	    {
		  html = "<div class='flashmessage'> ERROR LOADING RECIPE: please only use foodnetwork.com recipes </div>";
	    }
		else if(!error){
			var $ = cheerio.load(html);

			var food, ingredients, directions, image;
			var json = { name : "", image: "", ingredients : "", directions : ""};
	
			//Get name of food item
			$('.tier-3.title').filter(function(){
		        var data = $(this);
		        name = data.children().first().text();

		        json.name = name;
	        })

			 //Get food image url
	        $('.col12.pic.collapsed').filter(function(){
	        	var data = $(this).find('img');
	        	image = data.attr('src');
	        	json.image = image;	
	        })
	        
			//Get ingredients separated by ::
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
	        
	       
	        //Get directions separated by ::
	        $('.col12.directions').filter(function(){
	        	var data = $(this);
	        	var list = data.children().nextUntil($('.categories'));
	        	var parts = [];
	        	directions = ""
	        	list.each(function(i,elem){
	        		parts[i] = $(this).text();
	        		directions += parts[i] + "::";
	        	});
	        	json.directions = directions;	
	        })
	        fs.writeFile('output.json', JSON.stringify(json, null, 4), function(err){
        	console.log('File successfully written! - Check your project directory for the output.json file');
        })
        var ingredientoutput = '<ul> <h4>Ingredients</h4>'
        ingredientlist = json.ingredients.split("::");
        for(var i = 0;i<ingredientlist.length;i++)
        {
        	if(ingredientlist[i] != "")
        	{
        		ingredientoutput += '<li>'+ ingredientlist[i] + '</li>';
        	}
        }
        ingredientoutput += '</ul>'
        var directionoutput = '<ul> <h4>Directions</h4>'
        directionlist = json.directions.split("::");
        for(var i = 0;i<directionlist.length;i++)
        {
        	if(directionlist[i] != "")
        	{
        		directionoutput += '<li>'+ directionlist[i] + '</li>';
        	}
        }
        directionoutput += '</ul>'
	 	var html = '<div class="row"><div class="col-sm-6 col-md-4"> <div class="thumbnail"><img src="' +  
	 	json.image + '" alt="food" height="150px" id="foodpic" style="border-radius:25px"><h3>' +
	 	json.name + '</h3><div class="caption" style="display:none"><p>' + ingredientoutput +
	 	'</p><p>' + directionoutput + '</p><p><a href="#" class="btn btn-primary" role="button">Add to List</a> <a href="#" class="btn btn-default" role="button">Delete</a></p> </div> </div></div></div>';
	 	
		}
		else
		{
			html = "<div class='flashmessage'> ERROR LOADING RECIPE: invalid url </div>";
		}
		
		res.render('index.ejs',{recipes: html}); // load the index.ejs file
        //res.write('Check your console!')
	})
})
app.listen('8081');
console.log('Magic happens on port 8081');
exports = module.exports = app;
