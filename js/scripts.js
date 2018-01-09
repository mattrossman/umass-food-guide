//$(document).ready(function(){

let tableData;

const defaultColumns = ["Dish", "Calories", "Serving size", "Meal", "Section"]

const propList = [
{title:"Dish", 			field:"data-dish-name",		type:"qual"},
{title:"Serving size", 	field:"data-serving-size",	type:"qual"},
{title:"Location", 		field:"data-location",		type:"qual"},
{title:"Meal", 			field:"data-meal",			type:"qual"},
{title:"Section",		field:"data-section",		type:"qual"},
{title:"Calories", 		field:"data-calories",		type:"quant"},
{title:"Cholesterol", 	field:"data-cholesterol",	type:"quant"},
{title:"Dietary fiber", field:"data-dietary-fiber",	type:"quant"},
{title:"Protein", 		field:"data-protein",		type:"quant"},
{title:"Saturated fat", field:"data-sat-fat",		type:"quant"},
{title:"Sodium", 		field:"data-sodium",		type:"quant"},
{title:"Sugar", 		field:"data-sugars",		type:"quant"},
{title:"Carbohydrates", field:"data-total-carb",	type:"quant"},
{title:"Total fat", 	field:"data-total-fat",		type:"quant"},
{title:"Trans fat", 	field:"data-trans-fat",		type:"quant"}
];

// `tid` is used on the UMass menu server as an identifier for each dining hall
const tids = {
	Worcester:1,
	Franklin:2,
	Hampshire:3,
	Berkshire:4
}

// Gets a parameter from the URL query
// ex: www.mysite.com/?param1=val1&param2=bVal
// getParameterByName("param1") ==> "val1"
function getParameterByName(name, url) {
	if (!url) url = window.location.href;
	name = name.replace(/[\[\]]/g, "\\$&");
	const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
	results = regex.exec(url);
	if (!results) return null;
	if (!results[2]) return '';
	return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function getKey(obj, value) {
	return Object.keys(obj).find(key => obj[key] === value);
};

// Get the implicit nutritional data from a given <a> element.
// These data values are initially stored as element properties.
function getImplicitData(element) {
	const payload = {}
	// Save the qualitative properties as regular strings
	for (const prop of propList) {
		const field = prop.field;
		// Playing with a fancy inline switch here
		payload[field] = {
			"qual" : () => $(element).attr(field),		// qualitative (just a string)
			"quant": () => Qty($(element).attr(field))	// quantitative (Quantities.js object)
		}[prop.type]();
	}
	return payload;
}

// Builds the AJAX request URL for the UMass menu server
function getURL(tid, date) {
	return `http://umassdining.com/foodpro-menu-ajax?tid=${tid}&date=${date}`;
}

function getDishObj(element, meal, sec, tid) {
	const dishObj = getImplicitData(element);
	dishObj["data-meal"] = meal;
	dishObj["data-section"] = section;
	dishObj["data-location"] = getKey(tids, tid);
	return dishObj;
};

function addData(data, tid, date) {
	const locObj = JSON.parse(data);
	for (meal in locObj){
		for (section in locObj[meal]){
			const anchors = $(locObj[meal][section])
				.filter(".lightbox-nutrition")
				.find("a").get();
			const secDishes = $.map(anchors,
				el => getDishObj(el, meal, section, tid));
			appendData(secDishes);
		}
	}
	updateTable();
}

function requestData(tid, date) {
	$.get(getURL(tid, date), function(data){
		// The first element of each 'lightbox-nutrition' <li> is an <a>
		// with the nutritional data attributes
		const locObj = JSON.parse(data);
		for (meal in locObj){
			for (section in locObj[meal]){
				const anchors = $(locObj[meal][section])
					.filter(".lightbox-nutrition")
					.find("a").get();
				const secDishes = $.map(anchors,
					el => getDishObj(el, meal, section, tid));
				appendData(secDishes);
			}
		}
		updateTable();
	});
}

function buildTable(data) {
	const cols = getCheckedColumns();
	const colProps = $.map(cols, getProp);
	const head = $("#food-table-head");
	const body = $("#food-table-body");
	head.empty();
	body.empty();
	$.map(cols, function(col){
		head.append($("<th>").text(col))
	});
	$.map(data, function(item){
		body.append($("<tr>").append(
			$.map(colProps, function(prop){
				return $("<td>",{"data-label":prop.title}).text(item[prop.field]);
			})));
	});
}

function updateTable() {
	if ($("#sort-selector").val()!=""){
		sortData($("#sort-selector").val(),$("#sort-direction :radio:checked").val()=="true");
	}
	buildTable(tableData);
}

function appendData(data) {
	tableData = tableData.concat(data);
}

function resetData() {
	tableData = [];
}

function requestLocData(tid, date) {
	resetData();
	$.get(getURL(tid, date), data => addData(data, tid, date));
}

function getLocData(tid, date) {
	resetData();
	requestData(tid,date);
}

function submitHandler() {
	const tid = tids[$("#dc-selector").val()];
	const date = $("#datepicker").val();
	requestLocData(tid, date);
}

function getCheckedColumns() {
	return $("#col-list :input:checked").map(function(i, element){
		return element.value;
	}).get()
}

function getProp(name) {
    return propList.find(prop => prop.title === name);
}

function clickColumnOption(col) {
	$("#col-list label:contains("+col+") :first-child").click();
}

function initColumnOptions() {
	const colList = $("#col-list");
	$.map(propList,function(prop){
		colList.append('<div class="checkbox"><label><input type="checkbox" class="col-option" value="'+prop.title+'">'+prop.title+'</label></div>');
	});
}

class Filter {
	constructor(col, rel, fVal, inverse=false) {
		const prop = getProp(col)
		this.field = prop.field;
		this.isQty = prop.type==="quant";
		this.fVal = fVal;
		this.rel = rel;
		this.inverse = inverse;
	}

	static apply(self, item) {
		let pass;
		const val = item[self.field];
		switch(self.rel){
			case "=":
				pass = self.isQty ? val.eq(self.fVal) : val===self.fVal;
				break;
			case ">":
				pass = self.isQty ? val.gt(self.fVal) : val > self.fVal;
				break;
			case "<":
				pass = self.isQty ? val.lt(self.fVal) : val < self.fVal;
				break;
			case "in":
				pass = (self.isQty ? val.toString() : val).includes(self.fVal);
				break;
		}
		return self.inverse ? !pass : pass;
	}
}

function colClickedHandler(e) {
	const col = $(this).val();
	const sortSelector = $("#sort-selector");
	if ($(this).is(":checked")){
		sortSelector.append($("<option>").append(col));
	}
	else {
		sortSelector.children(":contains('"+col+"')").remove();
	}
}

function sortData(col, ascending=true) {
	const prop = getProp(col);
	const field = prop.field;
	tableData.sort(function(a,b){
		const aVal = a[field], bVal = b[field];
		let compared;
		if (prop.type==="quant")
			compared = aVal.compareTo(bVal);
		else
			compared = aVal.localeCompare(bVal);
		return (ascending ? 1 : -1)*compared;
	});
}

resetData();
$("#datepicker").datepicker();
// Sets the default date to today
$("#datepicker").datepicker("setDate", new Date("12/20/2017"));

initColumnOptions();
$("#col-list :input").click(colClickedHandler);
$("#submit-button").click(submitHandler);
$("#update-button").click(updateTable);

$.map(defaultColumns, clickColumnOption);
updateTable();

//});