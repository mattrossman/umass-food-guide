var qual_attrs = [
'data-dish-name',
'data-serving-size'
]

var quant_attrs = [
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
	$.each(qual_attrs, function(i,attr){
		payload[attr] = $(element).attr(attr);
	});
	// Parse the quantitative properties as quantities.js objects
	$.each(quant_attrs, function(i,attr){
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

function addLocData(loc){
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
	$( "#accordion" ).accordion({
		animate:200,
		collapsible:true,
		active:false
	});
	tableData = [];
	addLocData('Hampshire');
	//addLocData('Berkshire');
	//addLocData('Worcester');
	//addLocData('Franklin');
	var unitSorter = function(a,b){
		return a.baseScalar-b.baseScalar;
	}
	allColumns = [
		{title:"Dish", 			field:"data-dish-name"},
		{title:"Serving size", 	field:"data-serving-size", headerSort:false},
		{title:"Location", 		field:"data-location"},
		{title:"Meal", 			field:"data-meal"},
		{title:"Section",		field:"data-section"},
		{title:"Calories", 		field:"data-calories", align:"left"},
		{title:"Cholesterol", 	field:"data-cholesterol", align:"left", sorter:unitSorter},
		{title:"Dietary fiber", field:"data-dietary-fiber", align:"left", sorter:unitSorter},
		{title:"Protein", 		field:"data-protein", align:"left", sorter:unitSorter},
		{title:"Saturated fat", field:"data-sat-fat", align:"left", sorter:unitSorter},
		{title:"Sodium", 		field:"data-sodium", align:"left", sorter:unitSorter},
		{title:"Sugar", 		field:"data-sugars", align:"left", sorter:unitSorter},
		{title:"Carbohydrates", field:"data-total-carb", align:"left", sorter:unitSorter},
		{title:"Total fat", 	field:"data-total-fat", align:"left", sorter:unitSorter},
		{title:"Trans fat", 	field:"data-trans-fat", align:"left", sorter:unitSorter}
	]
	var activeColumns = ["Dish", "Calories", "Serving size", "Meal", "Section"]
	$("#food-table").tabulator({
	    //height:205, // set height of table
	    fitColumns:false, //fit columns to width of table (optional)
    	// Find the column config objects with the desired titles
	    columns:$.map(activeColumns,function(prop){
	    	return allColumns.find(col => col.title === prop)
	    })
    });
});
