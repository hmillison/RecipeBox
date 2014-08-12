// app/models/user.js
// load the things we need
var mongoose = require('mongoose');

// define the schema for our user model
var recipeSchema = mongoose.Schema({

        name        : String,
        image     : String,
    	ingredients     : String,
    	directions     : String



});



// create the model for users and expose it to our app
module.exports = mongoose.model('recipe', recipeSchema);
