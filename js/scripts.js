var qual_props = [
	'data-dish-name',
	'data-serving-size'
]

var quant_props = [
	'data-calories',
	'data-cholesterol',
	'data-dietary-fiber',
	'data-protein',
	'data-sat-fat',
	'data-sodium',
	'data-sugars',
	'data-total-carb',
	'data-total-fat',
	'data-trans-fat'
]

function getMeal(element){
	return $(element).parent().parent().prevAll('h2').first().text()
}

function getSection(element){
	return $(element).parent().prevAll('.menu_category_name').first().text()
}

// Get the nutritional data from a given <a> element
function getElementData(element){
	var payload = {}
	// Save the qualitative properties as regular strings
	$.each(qual_props, function(i,attr){
		payload[attr] = $(element).attr(attr);
	});
	// Parse the quantitative properties as quantities.js objects
	$.each(quant_props, function(i,attr){
		payload[attr] = Qty($(element).attr(attr));
	});
	// The meal and section properties are not implicit to the element
	payload['data-meal'] = getMeal(element);
	payload['data-section'] = getSection(element);
	return payload;
}

function getURL(loc){
	return "http://umassdining.com/locations-menus/"+loc+"/menu";
}

function getLocData(loc){
	$.get(getURL(loc), function(data){
		// The first element of each 'lightbox-nutrition' <li> is an <a>
		// with the nutritional data attributes
		var dishObj;
		var locObj = $('.lightbox-nutrition :first-child',data).map(function(){
			dishObj =  getElementData(this);
			dishObj['data-location'] = loc;
			return dishObj;
		}).get();
		appendData(locObj);
	});
}

function appendData(data){
	tableData = tableData.concat(data)
    $("#food-table").tabulator("setData", tableData);
}


$(document).ready(function(){
	tableData = [];
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
	        {title:"Dish", field:"data-dish-name"},
	        {title:"Serving size", field:"data-serving-size"},
	        {title:"Location", field:"data-location"},
	        {title:"Meal", field:"data-meal"},
	        {title:"Section", field:"data-section"},
	        {title:"Calories", field:"data-calories", align:"left"},
	        {title:"Protein", field:"data-protein", align:"left", sorter:unitSorter},
	        {title:"Sodium", field:"data-sodium", align:"left", sorter:unitSorter}
    	],
	});
});
