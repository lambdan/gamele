var todays_image;
var img = new Image();


var rows = 2;
var cols = 5;
var guesses = 0;
var lastclicked = ""; // for doube click prevention

var gamesjson;
var games = []; // used for search suggestions
var game_today = ""; // title we're looking for today


function init () {
	// read and parse games.json
	$.each(gamesjson.games, function(k,v) {
		games.push(v);
	});

	r = Math.floor(Math.random() * games.length);

	game_today = games[r].title
	todays_image = "screens/" + games[r].image
	todays_aspect = games[r].aspect

	// calculate playfield area based on what aspect todays game is
	playfield_max_width = 1280
	if (todays_aspect != "16:9") {
		playfield_max_width = 600
	}
	$("#image").css({
		"max-width": playfield_max_width,
	});
	$("#playfield").css({
		"max-width": playfield_max_width
	});


	img.src = todays_image
	img.onload = function() {
		// create blockers
		for (let r = 0; r < rows; r++) {
			for (let c = 0; c < cols; c++) {
			addBlock(r,c)
		}
		}	
	}

	$("#image").html(img)
}

function addBlock(row,col) {
	console.log(img.width, img.height);
	//console.log("adding block", row, col)
	w = img.width/cols
	h = img.height/rows

	x = col * w
	y = row * h

	s = '<div id="blocker-' + row + '-' + col + '" class="blocker" style="margin-top:' + y + ';margin-left:' + x + ';width:' + w + ';height:' + h +';"></div>';
	$('#playfield').append(s)
}

function clickedBlocker(id) {
	revealSquare(id);
	guesses++;
	$("#guesses-count").html(guesses)


}

function revealSquare(id) {
	$("#" + id).fadeOut(1500, function() {
		//console.log("done with fadeout")
	});
}

$(window).on("load", function() {

	// first load json until we do anything else
	$.getJSON("games.json", (data) => {
		gamesjson = data;
	}).then(() => init());


	$(document).click(function(event) { // check where clicked
    	//var e = $(event.target);
    	//console.log( $(event)[0].target.id )
    	id = $(event)[0].target.id
    	if (id.includes("blocker-")) {
    		if (lastclicked == id) {
    			//console.log("blocking double click!!")
    		} else {
    			clickedBlocker(id);
    			lastclicked = id;
    		}
    		
    	}

	});
});

$(window).resize(function() {
	//TODO update blockers on resize
})