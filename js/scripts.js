var qual_attrs = [
"data-dish-name",
"data-serving-size"
]

var quant_attrs = [
"data-calories",
"data-cholesterol",
"data-dietary-fiber",
"data-protein",
"data-sat-fat",
"data-sodium",
"data-sugars",
"data-total-carb",
"data-total-fat",
"data-trans-fat"
]

// I don't know what this stands for, but it's used in the online menu
// as an ID for each dining common
var tids = {
	Worcester:1,
	Franklin:2,
	Hampshire:3,
	Berkshire:4
}

function getKey(obj,value) {
  return Object.keys(obj).find(key => obj[key] === value);
};

// Get the implicit nutritional data from a given <a> element
function getImplicitData(element){
	var payload = {}
	// Save the qualitative properties as regular strings
	$.each(qual_attrs, function(i,attr){
		payload[attr] = $(element).attr(attr);
	});
	// Parse the quantitative properties as quantities.js objects
	$.each(quant_attrs, function(i,attr){
		payload[attr] = Qty($(element).attr(attr));
	});
	return payload;
}

function getURL(loc){
	return "http://umassdining.com/locations-menus/"+loc+"/menu";
}

function getNewURL(tid, date){
	return "http://umassdining.com/foodpro-menu-ajax?tid="+tid+"&date="+date;
}

function addData(tid,date){
	$.get(getNewURL(tid,date), function(data){
		// The first element of each 'lightbox-nutrition' <li> is an <a>
		// with the nutritional data attributes
		locObj = JSON.parse(data);
		var loc = getKey(tids,tid);
		var dishObj;
		var secData;
		for (meal in locObj){
			for (section in locObj[meal]){
				secData = $.map($(locObj[meal][section])
					.filter(".lightbox-nutrition")
					.find("a").get(),
					function(element){
						dishObj = getImplicitData(element);
						dishObj["data-meal"] = meal;
						dishObj["data-section"] = section;
						dishObj["data-location"] = loc;
						return dishObj;
					});
				appendData(secData);
			}
		}
		$("#food-table").tabulator("setData", tableData);
	});
}

function appendData(data){
	tableData = tableData.concat(data);
}

function resetData(){
	tableData = [];
}

function getLocData(tid,date){
	resetData();
	addData(tid,date);
}

function settingsHandler(){
	var tid = tids[$("#dc-selector").val()];
	var date = $("#datepicker").val();
	getLocData(tid,date);
}

$(document).ready(function(){
	$( "#accordion" ).accordion({
		animate:200,
		collapsible:true,
		active:false
	});
	$("#datepicker").datepicker({
		onSelect:settingsHandler
	});
	$("#datepicker").datepicker("setDate", new Date());
	$("#dc-selector").change(settingsHandler);
	//getLocData('Hampshire');
	var unitSorter = function(a,b){
		return a.baseScalar-b.baseScalar;
	};
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
	];
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