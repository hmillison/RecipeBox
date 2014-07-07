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
app.use(bodyParser());

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
	// routes ==================================================
	require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport




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
	

var posturl = ""
// Receives posted form and sends URL to scraper
app.post('/', function(req, res){
  posturl = req.body.url;
 if (req.user) {
	 res.redirect('/scrape');
  	 var loading = "<i class='icon-spinner icon-spin icon-large'></i>";
   //res.render('index.ejs'); // load the index.ejs file

} else {
    res.redirect('/login');
}
 
});


//=====web scraper for Food Network recipes===
app.get('/scrape', function(req, res){
	var validurl = [
						"foodnetwork.com/recipes/",
						"allrecipes.com/Recipe/",
						"food.com/recipe/",
						"bonappetit.com/recipe/"
						];
	url = posturl;
	var urltype = getScrapeFxn(url,validurl);
	//Appends http:// to urls to ensure proper scraping
	if(url.substr(0,3) == "www")
	{
		url = "http://" + url
	}
	//Checks url to ensure it matches the supported websites
	if(urltype == -1)
	{
	    html = "<div class='alert alert-danger' id='flashmessage'>Error Loading Recipe</div>";
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
		var newrecipe = { name : "", image: "", ingredients : "", directions : ""};
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
			req.user.recipes.push(newrecipe);
			
			req.user.save(function(err) {
                    if (err){
                        throw err;
                        html = "<div class='alert alert-danger' id='flashmessage'>Error Loading Recipe</div>";
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
        	html = "<div class='alert alert-danger' id='flashmessage'>Error Loading Recipe</div>";
			req.flash('msg',html);
			res.redirect('/');
        }
       
		}
	})
	
	}
});

//helper function to determine scraping function
function getScrapeFxn(url, valid)
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

// =====================================
// Sorts Recipes Alphabetically=========
// =====================================
app.get('/sort', function(req, res){
	var temp = [];
	temp = req.user.recipes;
	temp.sort(compare);
	req.user.recipes = temp;
	req.user.save(function(err) {
         if (err)
                throw err;
                }); 

	res.render('index.ejs',{user:req.user,errormessage:""});
		var html = "<div class='alert alert-success' id='flashmessage'>New Recipe Added</div>";
	//res.redirect('/');

});

//Helper function for sort
function compare(a,b) {
  if (a.name < b.name)
     return -1;
  if (a.name > b.name)
    return 1;
  return 0;
}

// =====================================
// Deletes Recipe from Collection=======
// =====================================
app.post('/delete', function(req, res){
	var deleteid = req.query.item;
	var temp = [];
	temp = req.user.recipes;
	temp.splice(deleteid,1);
	req.user.recipes = temp;
	req.user.save(function(err) {
             	 if (err)
                	throw err;
                });      
	//res.render('index.ejs',{user:req.user,errormessage:""});
	res.redirect('/');
});

// =====================================
// Add Recipe to Grocery List===========
// =====================================
app.post('/listadd', function(req, res){
	var addid = req.query.item;
	req.user.list.push(req.user.recipes[addid]);
	req.user.save(function(err) {
         		if (err)
              	  throw err;
                }); 
	//res.render('index.ejs',{user:req.user,errormessage:""});
	res.redirect('/');

});

// =====================================
// Remove Recipe from Grocery List======
// =====================================
app.post('/listrm', function(req, res){
	var deleteid = req.query.item;
	var temp = [];
	temp = req.user.list;
	temp.splice(deleteid,1);
	req.user.list = temp;
	req.user.save(function(err) {
             	 if (err)
                	throw err;
                });  
	//res.render('index.ejs',{user:req.user,errormessage:""});
	res.redirect('/');

});



// =====================================
// Sends Grocery List to User Email=====
// =====================================

//email server config
var server  = email.server.connect({
   user:    "hmillison@gmail.com", 
   password:"",
   host:    "smtp.gmail.com", 
   ssl:     true
});

app.get('/listsend', function(req, res){
var sendto = req.user.local.email;
var content = "<body>";
var list = req.user.list;
var shoppinglist;
var output = "helloworld";
for(var i = 0;i<list.length;i++)
{
	content += "<ul> " + list[i].name;
	var shoppinglist = list[i].ingredients.split("//");

	for(var k = 0;k<shoppinglist.length;k++)
	{
		if(shoppinglist[k] != "")
		{
			content += "<li>" + shoppinglist[k] + "</li>";
		}
	}
	content += "</ul>";
}

content += "</body>";
// send the message and get a callback with an error or details of the message that was sent
var message ={
   text:    "", 
   from:    "Recipe Box <recipebox@hmillie.com>", 
   to:      sendto,
   subject: "Your Recipe Box Shopping List - " + moment().format('MM/DD'),
   attachment:
     [
      {data:content, alternative:true}
   ]
};

server.send(message, function(err, message) { 
							if(err){
								output = "<div class='alert alert-danger' id='flashmessage'>Error Sending Email!</div>";
								req.flash('msg',output);
								res.redirect('/');

							}
							else
							{
							 output = "<div class='alert alert-success' id='flashmessage'>Email Sent!</div>";
							req.user.list = [];
							req.user.save(function(err) {
             	 						if (err)
                						throw err;
                						});
                				req.flash('msg',output);
								res.redirect('/')
							}
						
						});

});

// =====================================
// Add a Recipe from User Input=========
// =====================================
app.post('/addrecipe', function(req, res){
	var html = "";
	var newrecipe = { name : "", image: "", ingredients : "", directions : ""};
	//check if the recipe was added correctly
	if(req.body != null && (req.body.name != "" || req.body.ingredients != "" || req.body.directions != ""))
	{
		newrecipe.name = req.body.name;
		newrecipe.image = req.body.image;
		newrecipe.ingredients = req.body.ingredients;
		newrecipe.directions = req.body.directions;
		req.user.recipes.push(newrecipe);
			
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
	}
});

app.listen('8081');
console.log('Magic happens on port 8081');
exports = module.exports = app;
