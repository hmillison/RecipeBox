// app/routes.js
module.exports = function(app, passport) {

	// =====================================
	// HOME PAGE (with login links) ========
	// =====================================
	app.get('/', function(req, res) {
	var output = "";
	 if (req.user) {
	 	output  = req.user;
	 }	
		res.render('index.ejs',{user:output,errormessage:""});
	});
	
	

	// =====================================
	// LOGIN ===============================
	// =====================================
	// show the login form
	app.get('/login', function(req, res) {

		// render the page and pass in any flash data if it exists
		res.render('login.ejs', { message: req.flash('loginMessage') }); 
	});

	// process the login form
	// app.post('/login', do all our passport stuff here);

	// =====================================
	// SIGNUP ==============================
	// =====================================
	// show the signup form
	app.get('/signup', function(req, res) {

		// render the page and pass in any flash data if it exists
		res.render('signup.ejs', { message: req.flash('signupMessage') });
	});

	// process the signup form
	// app.post('/signup', do all our passport stuff here);

	// =====================================
	// PROFILE SECTION =====================
	// =====================================
	// we will want this protected so you have to be logged in to visit
	// we will use route middleware to verify this (the isLoggedIn function)
	app.get('/profile', isLoggedIn, function(req, res) {
		res.render('profile.ejs', {
			user : req.user // get the user out of session and pass to template
		});
	});
	
	// process the login form
	app.post('/login', passport.authenticate('local-login', {
		successRedirect : '/', // redirect to the secure profile section
		failureRedirect : '/login', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));


	// =====================================
	// LOGOUT ==============================
	// =====================================
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});
	
	// process the signup form
	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/', // redirect to the secure profile section
		failureRedirect : '/signup', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));
	

	// Recipe api ---------------------------------------------------------------------
	// get all todos
	app.get('/api/recipe', function(req, res) {

		// use mongoose to get all todos in the database
		recipe.find(function(err, recipes) {

			// if there is an error retrieving, send the error. nothing after res.send(err) will execute
			if (err)
				res.send(err)

			res.json(recipes); // return all todos in JSON format
		});
	});

	// create todo and send back all todos after creation
	app.post('/api/recipe', function(req, res) {

		// create a todo, information comes from AJAX request from Angular
		recipe.create({
			text : req.body.text,
			done : false
		}, function(err, recipes) {
			if (err)
				res.send(err);

			// get and return all the todos after you create another
			recipe.find(function(err, recipes) {
				if (err)
					res.send(err)
				res.json(recipes);
			});
		});

	});

	// delete a todo
	app.delete('/api/recipe/:recipe_id', function(req, res) {
		recipe.remove({
			_id : req.params.recipe_id
		}, function(err, recipe) {
			if (err)
				res.send(err);

			// get and return all the todos after you create another
			recipe.find(function(err, recipes) {
				if (err)
					res.send(err)
				res.json(recipes);
			});
		});
	});
};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

	// if user is authenticated in the session, carry on 
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/');

}
