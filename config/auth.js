// config/auth.js

// expose our config directly to our application using module.exports
module.exports = {
	'googleAuth' : {
		'clientID' 		: 'clientID',
		'clientSecret' 	: 'clientSecret',
		'callbackURL' 	: 'http://my-recipe-box.herokuapp.com/oauth2callback'
	}

};
