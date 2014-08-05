//=====set up===
var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();
var mongoose = require('mongoose');
var passport = require('passport');
var flash 	 = require('connect-flash');
var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');
var email   = require("emailjs");
var scrape = require('./scrape');
var moment = require('moment');
var request = require('request');
app.use(bodyParser({limit:'50mb'}));

// configuration ===========================================

	// config files
	var db = require('./config/db');
	var port = process.env.PORT || 8080; // set our port
	mongoose.connect(db.url); // connect to our mongoDB database
	require('./config/passport')(passport); // pass passport for configuration
	// set up our express application
	app.use(express.static(__dirname + '/public'));
	app.use(morgan('dev')); // log every request to the console
	app.use(cookieParser()); // read cookies (needed for auth)
	app.set('view engine', 'ejs'); // set up ejs for templating
	// required for passport
	app.use(session({ secret: 'keyboard cat' })); // session secret
	app.use(passport.initialize());
	app.use(passport.session()); // persistent login sessions
	app.use(flash()); // use connect-flash for flash messages stored in session
	// routes =============================================cors = require('./cors');
	require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport
	require('./config/email.js')(app, email, moment);


// =====================================
// HOME PAGE (with login links) ========
// =====================================
	app.get('/', function(req, res)
	{
		var output = "empty";
		if (req.user)
		{
			output = req.user;
		}
		 var message = req.flash('msg');

	res.render('index.ejs',{user:output,errormessage:message});
});


// Receives posted form and sends URL to scraper
app.post('/', function(req, res){
	res.redirect('/');

});


//=====web scraper for Food Network recipes===
app.post('/scrape', function(req, res){
	url = req.body.url;
	if (req.user == null) {
			res.redirect('/login');
	}
else {


	var validurl = [
						"foodnetwork.com/recipes/",
						"allrecipes.com/",
						"food.com/recipe/",
						"bonappetit.com/recipe/"
						];
	var urltype = inArray(url,validurl);
	//Appends http:// to urls to ensure proper scraping
	if(url.substr(0,3) == "www")
	{
		url = "http://" + url
	}
	//Checks url to ensure it matches the supported websites
	if(urltype == -1)
	{
	    html = "<div class='alert alert-danger' id='flashmessage'>Invalid URL</div>";
	    //res.render('index.ejs',{
		//	user:req.user,
		//	errormessage:html
		//});
		req.flash('msg',html);
		res.redirect('/');

	}
	else
	{
		request(url, function(error, response, html){
		if(!error){
		var $ = cheerio.load(html);
		var newrecipe = { name : "", image: "", ingredients : "", directions : "", tags : []};
		//determine which method needs to be used to scrape
		if(urltype == 0)
		{
			newrecipe = scrape.foodnetwork(url, $);
		}
		else if(urltype == 1)
		{
			newrecipe = scrape.allrecipes(url, $);

		}
		else if(urltype == 2)
		{
			newrecipe = scrape.food(url, $);
		}
		else if(urltype == 3)
		{
			newrecipe = scrape.bonappetit(url, $);
		}

		//check if the recipe was created correctly
		if(newrecipe != null && (newrecipe.name != "" || newrecipe.ingredients != "" || newrecipe.directions != ""))
		{
			//set placeholder image if recipe has none
			if(newrecipe.image == "")
			{
				newrecipe.image = "/images/placeholder.png";
			}
			req.user.data.recipes.push(newrecipe);

			req.user.save(function(err) {
                    if (err){
                        throw err;
                        html = "<div class='alert alert-danger' id='flashmessage'>Error Saving Recipe</div>";
						req.flash('msg',html);
                        res.redirect('/');
                    }
                    else{

						res.redirect('/sort');
                    }
                });

        }
        else
        {
        	html = "<div class='alert alert-danger' id='flashmessage'>Error Loading Recipe</div>";
			req.flash('msg',html);
			res.redirect('/');
        }

		}
	})

	}
}
});

// =====================================
// Handles Recipe Searches ==============
// =====================================
app.post('/search', function(req, res){
	var searchkey = encodeURIComponent(req.body.keyword);
	var url =  "http://api.yummly.com/v1/api/recipes?_app_id=---&_app_key=---&q="
							+ searchkey + "&requirePictures=true&maxResult=12";
	/*var url = "http://api.bigoven.com/recipes?pg=1&rpp=25&title_kw="
						+ searchkey
						+ "&api_key=---"*/
	request({
  	uri: url,
  	method: "GET",
  	timeout: 10000,
  	followRedirect: true,
  	maxRedirects: 10
		}, function(error, response, body) {
					res.send(body);
		});

});


// =====================================
// Add Recipe from Yummly API Search ===
// =====================================
app.post('/searchadd', function(req,res){
	var addedrecipes = req.body.recipes;
	for(var i = 0;i<addedrecipes.length;i++){
		var url = "http://api.yummly.com/v1/api/recipe/" + addedrecipes[i]
					  + "?_app_id=---&_app_key=---";
	request({
		uri: url,
		method: "GET",
		timeout: 10000,
		followRedirect: true,
		maxRedirects: 10
		}, function(error, response, body) {
					var json = JSON.parse(body);
					var newrecipe = new Recipe(json.name,json.images[0].hostedLargeUrl,json.ingredientLines,json.source.sourceRecipeUrl);
					if(newrecipe != null && (newrecipe.name != "" || newrecipe.ingredients != "" || newrecipe.directions != ""))
					{
							//set placeholder image if recipe has none
							if(newrecipe.image == "")
							{
								newrecipe.image = "/images/placeholder.png";
							}
							req.user.data.recipes.push(newrecipe);

							req.user.save(function(err) {
														if (err){
																throw err;
																html = "<div class='alert alert-danger' id='flashmessage'>Error Saving Recipe</div>";
																req.flash('msg',html);
																res.redirect('/');
															}
														});
					}
				});
	}
	var html = "<div class='alert alert-success' id='flashmessage'>Recipe Added Succesfully</div>";
	res.send(html);
});



// =====================================
// Sorts Recipes Alphabetically=========
// =====================================
app.get('/sort', function(req, res){
	if(req.user)
	{
		var temp = [];
		temp = req.user.data.recipes;
		temp.sort(compare);
		req.user.data.recipes = temp;
		req.user.save(function(err) {
        	 if (err)
            	    throw err;
                	});

		var html = "<div class='alert alert-success' id='flashmessage'>New Recipe Added!</div>";
		res.render('index.ejs',{user:req.user,errormessage:html});
	}
	else
	{
		res.redirect('/');
	}

});


// =====================================
// Deletes Recipe from Collection=======
// =====================================
app.post('/delete', function(req, res){
	var deleteid = req.query.item;
	var user = req.user;
	var listid = inGroceryList(req.user.data.recipes[deleteid],req.user.data.list);
	console.log(listid);
	if(listid != -1){
		user.data.list.splice(listid,1);
	}
	user.data.recipes.splice(deleteid,1);
	req.user.markModified('data');
	user.save(function(err) {
             	 if (err)
                	throw err;
                });
	//res.render('index.ejs',{user:req.user,errormessage:""});
	var html = "<div class='alert alert-success' id='flashmessage'>Recipe Deleted Succesfully</div>";
	res.send(html);
	//req.flash('msg',html);
	res.redirect('/');
});

// =====================================
// Add Recipe to Grocery List===========
// =====================================
app.post('/listadd', function(req, res){
	var addid = req.query.item;
	if(inGroceryList(req.user.data.recipes[addid],req.user.data.list) == -1)
	{
		req.user.data.list.push(req.user.data.recipes[addid]);
		req.user.save(function(err) {
         		if (err)
              	  throw err;
                });
     	var html = "<div class='alert alert-success' id='flashmessage'>Recipe added to Grocery List</div>";
    }
    else
    {
    	 html = "<div class='alert alert-danger' id='flashmessage'>Recipe is already in Grocery List</div>";
    }
	//res.render('index.ejs',{user:req.user,errormessage:""});
	res.send(html);

});


// =====================================
// Remove Recipe from Grocery List======
// =====================================
app.post('/listrm', function(req, res){
	var deleteid = req.query.item;
	var temp = [];
	temp = req.user.data.list;
	temp.splice(deleteid,1);
	req.user.data.list = temp;
	req.user.save(function(err) {
             	 if (err)
                	throw err;
                });
	//res.render('index.ejs',{user:req.user,errormessage:""});
	var html = "<div class='alert alert-danger' id='flashmessage'>Recipe removed from Grocery List</div>";
	res.send(html);

});




// =====================================
// Add a Recipe from User Input=========
// =====================================
app.post('/addrecipe', function(req, res){
	var html = "";
	console.log(req.files);
	/*var newrecipe = { name : "", image: "", ingredients : "", directions : ""};
	//check if the recipe was added correctly
	if(req.body != null && (req.body.name != "" || req.body.ingredients != "" || req.body.directions != ""))
	{
		newrecipe.name = req.body.name;
		/*fs.readFile(req.body.image, function (err, data) {
		  // ...
  			var newPath = "/uploads/" + data;
  			fs.writeFile(newPath, data, function (err) {
 		 });
		});
		newrecipe.image = "";
		newrecipe.ingredients = req.body.ingredients;
		newrecipe.directions = req.body.directions;
		req.user.data.recipes.push(newrecipe);

		req.user.save(function(err) {
               if (err){
                  throw err;
                    html = "<div class='alert alert-danger' id='flashmessage'>Error Adding Recipe</div>";
					req.flash('msg',html);
                     res.redirect('/');
                    }
                    else{
                    req.flash('msg',html);
					res.redirect('/sort');
                    }
                });

	}
	else
	{
		     html = "<div class='alert alert-danger' id='flashmessage'>Error Adding Recipe</div>";
			req.flash('msg',html);
            res.redirect('/');
	}*/
});

// =====================================
// Update List of Tags for Recipe ======
// =====================================
app.post('/updatetags', function(req, res){
	var html = "";
	var recipeid = req.query.item;
	req.user.data.recipes[recipeid].tags = [];
	//doc.markModified(req.user);
	for(var index in req.body)
	{
		if(index == "newtag" && req.body[index].length > 0)
		{
			req.user.data.recipes[recipeid].tags.push(req.body[index]);
			req.user.data.tags.push(req.body[index]);
		}
		else if(index != "newtag")
		{
			req.user.data.recipes[recipeid].tags.push(req.body[index]);
		}
	}
	req.user.markModified('data');
	req.user.save(function(err) {
               if (err){
                  throw err;
                    html = "<div class='alert alert-danger' id='flashmessage'>Error Adding Tags</div>";
					req.flash('msg',html);
                     res.redirect('/');
                    }
                    else{
                    req.flash('msg',html);
					res.redirect('/');
                    }
                });
});

// =====================================
// Functions =========================
// =====================================

//helper function to determine if the url is supported by scraping
function inArray(url, valid)
{
	var output = -1;
	for(var i = 0;i<valid.length;i++)
	{
		if(url.indexOf(valid[i]) != -1)
		{
			output = i;
		}
	}
	return output;
}

//Helper function for sort
function compare(a,b) {
  if (a.name < b.name)
     return -1;
  if (a.name > b.name)
    return 1;
  return 0;
}

function Recipe(name, image, ingredients, directions)
{
	this.name = name;
	this.image = image;
	this.ingredients = ingredients;
	this.directions = directions;
}

function inGroceryList(recipe, list)
{
	for(var i = 0;i<list.length;i++)
	{
		if(recipe.name == list[i].name && recipe.image == list[i].image && recipe.directions == list[i].directions)
		{
			return i;
		}
	}
	return -1;
}


app.listen('8081');
console.log('Magic happens on port 8081');
exports = module.exports = app;
