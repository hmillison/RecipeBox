//scrape.js
//=========

module.exports = {
	foodnetwork : function(url, $)
	{
			var name, ingredients, directions, image;
			var json = { name : "", image: "", ingredients : "", directions : ""};
	
			//Get name of food item
			$('.tier-3.title').filter(function(){
		        var data = $(this);
		        name = data.children().first().text();

		        json.name = name;
	        })

			 //Get recipe image url
	        $('.col12.pic.collapsed').filter(function(){
	        	var data = $(this).find('img');
	        	image = data.attr('src');
	        	json.image = image;	
	        })
	        
			//Get ingredients separated by //
	        $('.col6.ingredients').filter(function(){
	        	var data = $(this);
	        	var list = data.children().last().children();
	        	var parts = [];
	        	ingredients = ""
	        	list.each(function(i, elem) {
  					parts[i] = $(this).text();
  					ingredients += parts[i] + "//";
				});
	        	json.ingredients = ingredients;
	        })
	        
	       
	        //Get directions separated by //
	        $('.col12.directions').filter(function(){
	        	var data = $(this);
	        	var list = data.children().nextUntil($('.categories'));
	        	var parts = [];
	        	directions = ""
	        	list.each(function(i,elem){
	        		parts[i] = $(this).text();
	        		directions += parts[i] + "//";
	        	});
	        	json.directions = directions;	
	        })
        
        	return json;

		}
	,
	allrecipes : function(url, $)
	{
		var name, ingredients, directions, image;
		var json = { name : "", image: "", ingredients : "", directions : ""};
		
		//get recipe name
		$('#itemTitle').filter(function(){
			var data = $(this);
			name = data.text();
			json.name = name;
		})
		
		//get recipe image url
		$('#imgPhoto').filter(function(){
			var data = $(this);
	        image = data.attr('src');
	        json.image = image;	
		})
		
		//Get ingredients separated by //
		$('.ingred-left').filter(function(){
			var data = $(this);
			var list = data.find('.ingredient-wrap').children();

			var parts = [];
	        ingredients = ""
	        list.each(function(i, elem) {
  				parts[i] = $(this).text();
  				ingredients += parts[i] + "//";
			});
			
	        json.ingredients = ingredients;
		})
		
		$('.directLeft').filter(function(){
			var data = $(this);
			var list = data.children().next().children();
			var parts = [];
	        directions = ""
	        list.each(function(i,elem){
	        		
	        		parts[i] = $(this).text();
	        		if(parts[i] != "Kitchen-Friendly View")
	        		{
	        			directions += parts[i] + "//";
	        		}
	        	});
			json.directions = directions;
		})
		
		//Get directions separated by //
		
		return json;
	},
	food : function(url, $)
	{
	},
	bonappetit : function(url, $)
	{
	}
	
};