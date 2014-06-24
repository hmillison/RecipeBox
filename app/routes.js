// app/routes.js

	module.exports = function(app) {

		// server routes ===========================================================
		// handle things like api calls
		// authentication routes

		// sample api route
		app.get('/api/nerds', function(req, res) {
			// use mongoose to get all nerds in the database
			Nerd.find(function(err, nerds) {

				// if there is an error retrieving, send the error. nothing after res.send(err) will execute
				if (err)
					res.send(err);

				res.json(nerds); // return all nerds in JSON format
			});
		});

		// route to handle creating (app.post)
		app.set('port', process.env.PORT || 8081);

		// route to handle delete (app.delete)

		// frontend routes =========================================================
		// route to handle all angular requests
		app.get('*', function(req, res) {
			res.sendfile('./public/index.html'); // load our public/index.html file
		});

	};