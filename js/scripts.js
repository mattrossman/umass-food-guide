var qual_props = {
	'Dish':'data-dish-name',
	'Serving size':'data-serving-size'
}

var int_props = {
	'Calories':'data-calories',
}

var unit_props = {
	'Cholesterol':'data-cholesterol',
	'Dietary fiber':'data-dietary-fiber',
	'Protein':'data-protein',
	'Saturated fat':'data-sat-fat',
	'Sodium':'data-sodium',
	'Sugar':'data-sugars',
	'Carbs':'data-total-carb',
	'Total fat':'data-total-fat',
	'Trans fat':'data-trans-fat'
}

function getMeal(element){
	return $(element).parent().parent().prevAll('h2').first().text()
}

function getSection(element){
	return $(element).parent().prevAll('.menu_category_name').first().text()
}

// Get the nutritional data from a given <a> element
function getElementData(element){
	var payload = {}
	// Just return the qualitative properties as strings
	$.each(qual_props, function(lbl, attr){
		payload[lbl] = $(element).attr(attr);
	});
	// Parse the integer based properties as ints
	$.each(int_props, function(lbl, attr){
		payload[lbl] = parseInt($(element).attr(attr));
	});
	// Parse the unit based properties as math.unit objects
	$.each(unit_props, function(lbl, attr){
		try {
			payload[lbl] = Qty($(element).attr(attr));
		}
		catch(err){
			payload[lbl] = Qty(0)
		}
	});
	// These last two properties are not implicit to the element
	payload['Meal'] = getMeal(element);
	payload['Section'] = getSection(element);
	return payload;
}

function getURL(loc){
	return "https://umassdining.com/locations-menus/"+loc+"/menu";
}

var exJSON;

function getLocData(loc){
	$.get(getURL(loc), function(data){
		// The first element of each 'lightbox-nutrition' <li> is an <a>
		// with the nutritional data attributes
		var dishObj;
		var locObj = $('.lightbox-nutrition :first-child',data).map(function(){
			dishObj =  getElementData(this);
			dishObj['Location'] = loc;
			return dishObj;
		}).get();
		appendData(locObj);
	});
}

function appendData(data){
	foodObj = foodObj.concat(data)
    $("#food-table").tabulator("setData", foodObj);
}


$(document).ready(function(){
	foodObj = [];
	getLocData('Hampshire');
	getLocData('Berkshire');
	getLocData('Worcester');
	getLocData('Franklin');
	var unitSorter = function(a,b){
		return a.baseScalar-b.baseScalar;
	}
	$("#food-table").tabulator({
	    //height:205, // set height of table
	    fitColumns:true, //fit columns to width of table (optional)
	    columns:[ //Define Table Columns
	        {title:"Dish", field:"Dish"},
	        {title:"Serving size", field:"Serving size"},
	        {title:"Location", field:"Location"},
	        {title:"Meal", field:"Meal"},
	        {title:"Section", field:"Section"},
	        {title:"Calories", field:"Calories", align:"left"},
	        {title:"Protein", field:"Protein", align:"left", sorter:unitSorter},
	        {title:"Sodium", field:"Sodium", align:"left", sorter:unitSorter}
    	],
	});
});
