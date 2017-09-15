var tableColumns;

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

var unitSorter = function(a,b){
	return a.baseScalar-b.baseScalar;
};

var allColumns = [
{title:"Dish", 			field:"data-dish-name"},
{title:"Serving size", 	field:"data-serving-size",	headerSort:false},
{title:"Location", 		field:"data-location"},
{title:"Meal", 			field:"data-meal"},
{title:"Section",		field:"data-section"},
{title:"Calories", 		field:"data-calories", 		align:"left"},
{title:"Cholesterol", 	field:"data-cholesterol",	align:"left", sorter:unitSorter},
{title:"Dietary fiber", field:"data-dietary-fiber", align:"left", sorter:unitSorter},
{title:"Protein", 		field:"data-protein", 		align:"left", sorter:unitSorter},
{title:"Saturated fat", field:"data-sat-fat", 		align:"left", sorter:unitSorter},
{title:"Sodium", 		field:"data-sodium", 		align:"left", sorter:unitSorter},
{title:"Sugar", 		field:"data-sugars", 		align:"left", sorter:unitSorter},
{title:"Carbohydrates", field:"data-total-carb", 	align:"left", sorter:unitSorter},
{title:"Total fat", 	field:"data-total-fat", 	align:"left", sorter:unitSorter},
{title:"Trans fat", 	field:"data-trans-fat", 	align:"left", sorter:unitSorter}
];

// I don't know what this stands for, but it's used in the online menu
// as an ID for each dining common
var tids = {
	Worcester:1,
	Franklin:2,
	Hampshire:3,
	Berkshire:4
}


// Gets a parameter from the URL query
// ex: www.mysite.com/?param1=val1&param2=val2
// getParameterByName("param1") ==> "val1"
function getParameterByName(name, url) {
	if (!url) url = window.location.href;
	name = name.replace(/[\[\]]/g, "\\$&");
	var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
	results = regex.exec(url);
	if (!results) return null;
	if (!results[2]) return '';
	return decodeURIComponent(results[2].replace(/\+/g, " "));
}

// Find the first key for a certain value in an object
function getKey(obj,value) {
	return Object.keys(obj).find(key => obj[key] === value);
};

// Get the implicit nutritional data from a given <a> element.
// These data values are initially stored as element properties.
function getImplicitData(element){
	var payload = {}
	// Save the qualitative properties as regular strings
	$.map(qual_attrs, function(attr){
		payload[attr] = $(element).attr(attr);
	});
	// Parse the quantitative properties as quantities.js objects
	$.map(quant_attrs, function(attr){
		payload[attr] = Qty($(element).attr(attr));
	});
	return payload;
}

// Builds the AJAX request URL for the UMass menu server
function getURL(tid, date){
	return "http://umassdining.com/foodpro-menu-ajax?tid="+tid+"&date="+date;
}

function addData(tid,date){
	$.get(getURL(tid,date), function(data){
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

function removeColumnOption(col){
	$("#col-adder").find(":contains("+col+")").remove()
}

function addColumn(col){
	tableColumns = tableColumns.concat(col);
	removeColumnOption(col);
	updateColumns();
}

function initColumnAdder(){
	var colAdder = $("#col-adder")
	$.map(allColumns,function(col){
		colAdder.append("<option>"+col.title+"</option>");
	})
}

// Pulls the appropriate column objects from the master list
// according to the titles currently specified in `tableColumns`
// and sends them to the tabulator element.
function updateColumns(){
	$("#food-table").tabulator("setColumns",
		$.map(tableColumns,function(prop){
			return allColumns.find(col => col.title === prop)
		}));
}

$(document).ready(function(){
	$( "#accordion" ).accordion({
		animate:200,
		collapsible:true
	});
	$("#datepicker").datepicker();

	// Sets the default date to today
	$("#datepicker").datepicker("setDate", new Date());

	tableColumns = [];
	initColumnAdder();

	$("#food-table").tabulator({
		responsive: true,
		movableColumns: true,
    });

    // Add a few starter columns to the table
	var defaultColumns = ["Dish", "Calories", "Serving size", "Meal", "Section"]
	$.map(defaultColumns,addColumn);
});