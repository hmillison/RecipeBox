//app/email.js
//=========
module.exports = function(app, email, moment) {


//email server config
var server  = email.server.connect({
   user:    "recipebox@hmillie.com",
   password:"theflash",
   host:    "mail.hmillie.com",
   ssl:     false
});

app.get('/listsend', function(req, res){
if(req.user.local.email)
{
	var sendto = req.user.local.email;
}
else
{
	var sendto = req.user.google.email;
}
var content = "<body>";
var list = req.user.data.list;
var shoppinglist;
for(var i = 0;i<list.length;i++)
{
	content += "<ul> " + list[i].name;

	for(var k = 0;k<list[i].ingredients.length;k++)
	{
		if(shoppinglist[k] != "")
		{
			content += "<li>" + list[i].ingredients[k] + "</li>";
		}
	}
	content += "</ul>";
}

content += "</body>";
// send the message and get a callback with an error or details of the message that was sent
var message = {
   text:    "",
   from:    "Recipe Box <recipebox@hmillie.com>",
   to:      sendto,
   subject: "Your Recipe Box Shopping List - " + moment().format('MM/DD'),
   attachment:
     [
      {data:content, alternative:true}
   ]
}

server.send(message, function(err, message) { console.log(err || message); });
req.flash('msg',"<div class='alert alert-success' id='flashmessage'>Email Sent</div>");
res.redirect('/');
});

}
