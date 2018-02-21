$(document).ready(function(){

/*
Glossary and conventions

Prop:
property of a food item. Can be qualitative or quantitative. Has
a human readable title along with a field name corresponding to the
HTML attribute which stores that property.

Dish:
Object containing all of the properties of a given food labeled by field.

Date:
String in MM/DD/YYYY format

tid:
An identifying number for each dining hall.
I didn't come up with the name, 'tid' is used in the data the UMass
Dining server returns

Request:
Object containing a date and tid

Columns are addressed by title and abbreviated 'cols'

*/


const menu = [];
const filters = {};
let needRefresh = true;
let needSort = false;

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

init();

function Request (tid, date) {
	this.tid = tid;
	this.date = date;
}

// Dynamically form the AJAX URL for each request rather than storing redundant segments
Object.defineProperty(Request.prototype, "url", {
	get: function() { return `http://umassdining.com/foodpro-menu-ajax?
		tid=${this.tid}&date=${this.date}` }
});

// Container is the array that will hold the dishes
// Callback will be run after all dishes have been saved
Request.prototype.send = function(container, callback) {
	$.get(this.url,
		function (data) {
			const menuObj = JSON.parse(data);
			for (meal in menuObj){
				for (section in menuObj[meal]){
					const anchors = $(menuObj[meal][section])
						.filter(".lightbox-nutrition")
						.find("a").get();
					for (el of anchors) {
						container.push(getDishObj(el, meal, section));
					};
				};
			};
			callback();
		});

	function getImplicitData(element) {
		const payload = {}
		// Save the qualitative properties as regular strings
		for (const prop of propList) {
			const fieldStr = $(element).attr(prop.field);
			// Playing with a fancy inline switch here
			payload[prop.field] = {
				"qual" : () => fieldStr,		// qualitative (just a string)
				"quant": () => Qty(fieldStr)	// quantitative (Quantities.js object)
			}[prop.type]();
		}
		return payload;
	};

	function getDishObj(element, meal, sec) {
		const dishObj = getImplicitData(element);
		dishObj["data-meal"] = meal;
		dishObj["data-section"] = sec;
		dishObj["data-location"] = getKey(tids, this.tid);
		return dishObj;
	};
};

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

String.prototype.hashCode = function() {
  for(var ret = 0, i = 0, len = this.length; i < len; i++) {
    ret = (31 * ret + this.charCodeAt(i)) << 0;
  }
  return ret.toString();
};

function getKey(obj, value) {
	return Object.keys(obj).find(key => obj[key] === value);
};

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

function resetData() {
	menu.length = 0;
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
	const colSelect = $("#filter-col-selector");
	for (prop of propList) {
		colList.append($("<div>", {class:"checkbox"})
			.append($("<label>")
				.append($("<input>",
				{
					type:"checkbox",
					class:"col-option",
					value:prop.title
				}))
				.append(prop.title)));
		colSelect.append($("<option>").append(prop.title));
	};
}

function addFilter(filter) {
	const list = $("#filter-list");
	const hash = filter.toString().hashCode()
	filters[hash] = filter;
	const button = $("<button>", {type:"button", class:"close"}).append("&times;");
	const li = $("<li>", {class: "list-group-item"}).append(filter.toString(), button)
	button.click(function() {
		delete filters[hash];
		li.remove();
	})
	list.append(li);
}

function MenuFilter(col, rel, fVal, inverse=false) {
	/*
	col  : the column to operate on
	rel  : the relationship to check for
	fVal : the filter value to compare from
	inverse : whether to invert the filter
	*/
	const prop = getProp(col);
	const isQty = prop.type==="quant";
	fVal = isQty ? new Qty(fVal) : fVal.toLowerCase();

	this.col = col;
	this.rel = rel;
	this.fVal = fVal;
	this.inverse = inverse;
	
	function allow(dish) {
		const dVal = dish[prop.field];
		const pass = {
			"="  : () => isQty ? dVal.eq(fVal) : dVal===fVal,
			">"  : () => isQty ? dVal.gt(fVal) : dVal > fVal,
			"<"  : () => isQty ? dVal.lt(fVal) : dVal < fVal,
			"contains" : () => (dVal.toString().toLowerCase()).includes(fVal)
		}[rel]();
		return inverse ? !pass : pass;
	}

	this.apply = function(container) {
		return container.filter(allow);
	}
}

MenuFilter.prototype.toString = function() {
	const readRel = {
		"="  : "is",
		">"  : "greater than",
		"<"  : "less than",
		"contains" : "contains"
	}[this.rel];
	return [this.col, readRel, "\""+this.fVal+"\""].join(" ");
}

MenuFilter.prototype.reducer = (accum, curr) => curr.apply(accum);

function sortData(col, ascending=true) {
	const prop = getProp(col);
	const field = prop.field;
	menu.sort(function(a,b){
		const aVal = a[field], bVal = b[field];
		let compared;
		if (prop.type==="quant")
			compared = aVal.compareTo(bVal);
		else
			compared = aVal.localeCompare(bVal);
		return (ascending ? 1 : -1)*compared;
	});
}

function registerHandlers() {
	$("#col-list :input").click(colClickedHandler);
	$("#update-btn").click(updateHandler);
	$("#add-filter-btn").click(addFilterHandler);
	$("#dc-selector").change(dataChanged);
	$("#datepicker").change(dataChanged);
	$("#sort-selector").change(sortChanged);
	$(document).keypress(function(e) {
	    if(e.which == 13) {
	    	if ($(e.target).is("#filter-val")) {
		    	addFilterHandler();
		    	$(e.target).blur();
	    	}
	    	else {
	    		updateHandler();
	    	}
	    }
	});

	function submitHandler() {
		const tid = tids[$("#dc-selector").val()];
		const date = $("#datepicker").val();
		resetData();
		new Request(tid, date).send(menu, function() {
			needRefresh = false;
			updateTable();
		});
	};

	function updateHandler() {
		if (needRefresh) {
			submitHandler()
		}
		else {
			updateTable();
		}
	}

	function updateTable() {
		if (needSort){
			runSort();
		}
		buildTable(Object.values(filters).reduce(MenuFilter.prototype.reducer, menu));
		$("#collapse1").collapse("hide");
	}

	function runSort() {
			sortData($("#sort-selector").val(),$("#sort-direction :radio:checked").val()=="true");
			needSort = false;
	}

	function dataChanged() {
		needRefresh = true;
	}

	function sortChanged() {
		needSort = true;
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
	};

	function addFilterHandler() {
		const col = $("#filter-col-selector").val();
		const rel = $("#filter-rel-selector").val();
		const val = $("#filter-val").val();

		const filter = new MenuFilter(col, rel, val);
		if (!filters.hasOwnProperty(filter.toString().hashCode())) {
			addFilter(filter);
		}
	}
}

function init() {
	$("#datepicker").datepicker();
	// Sets the default date to today
	$("#datepicker").datepicker("setDate", new Date());

	initColumnOptions();
	registerHandlers();
	defaultColumns.map(clickColumnOption);
}

});