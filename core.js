// public/core.js
var recipemanager = angular.module('recipemanager', []);

function mainController($scope, $http) {
	$scope.formData = {};

	// when landing on the page, get all recipe and show them
	$http.get('/api/recipe')
		.success(function(data) {
			$scope.recipe = data;
			console.log(data);
		})
		.error(function(data) {
			console.log('Error: ' + data);
		});

	// when submitting the add form, send the text to the node API
	$scope.createRecipe = function() {
		$http.post('/api/recipe', $scope.formData)
			.success(function(data) {
				$scope.formData = {}; // clear the form so our user is ready to enter another
				$scope.recipe = data;
				console.log(data);
			})
			.error(function(data) {
				console.log('Error: ' + data);
			});
	};

	// delete a todo after checking it
	$scope.deleteRecipe = function(id) {
		$http.delete('/api/recipe/' + id)
			.success(function(data) {
				$scope.recipe = data;
				console.log(data);
			})
			.error(function(data) {
				console.log('Error: ' + data);
			});
	};

}
