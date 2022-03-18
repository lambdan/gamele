var START_DATE = "2022-03-18"

var todays_image;
var img = new Image();


var rows = 2;
var cols = 5;

var max_guesses = rows*cols;
var guesses = 0;
var lastclicked = ""; // for double click prevention
var blockers = [];

var gamesjson;
var games = [];
var game_titles = []; // will be sorted for the input box
var game_today = ""; // title we're looking for today

var game_over = false;
var game_won = false;

var default_save_data = {
	"date": 0,
	"revealed": [],
	"wins_1": 0,
	"wins_2": 0,
	"wins_3": 0,
	"wins_4": 0,
	"wins_5": 0,
	"wins_6": 0,
	"wins_7": 0,
	"wins_8": 0,
	"wins_9": 0,
	"wins_10": 0
}

function dateToday() {
	const d = new Date();
	iso = d.toISOString().split("T")[0] // this seems pretty yolo
	return String(iso)
}

function daysSinceStart() {
	start = moment(START_DATE);
	today = moment(dateToday());
	return today.diff(start,'days');
}

function init () {
	// read and parse games.json
	$.each(gamesjson.games, function(k,v) {
		games.push(v);
		game_titles.push(v.title);
	});

	// push sorted list of games to the input box ("datalist")
	$.each(game_titles.sort(), function(k,v) { 
		$("#games").append('<option value="' + v + '">') // push game name to search box
	});

	// game is picked here
	r = daysSinceStart()
	//r = Math.floor(Math.random() * games.length); // random game for testing
	
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


	// setup the image and create blockers
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

function regenPlayfield() {
	console.log("regenPlayfield")
	$("#image").html("<p>Shit</p>")

	$.each(blockers, function(k,v) {
		$(v.id).remove();
	});

	// setup the image and create blockers
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
	w = img.width/cols
	h = img.height/rows

	x = col * w
	y = row * h

	name = "blocker-" + row + "-" + col
	s = '<div id="' + name + '" class="blocker" style="margin-top:' + y + ';margin-left:' + x + ';width:' + w + ';height:' + h +';"></div>';
	$('#playfield').append(s)
	blockers.push({"id": name, "active": true})
}

function clickedBlocker(id) {
	revealSquare(id);
	incrementGuesses();
}

function revealSquare(id) {
	$.each(blockers, function(k,v) {
		if (v.id == id) {
			if (v.active) {
				blockers[k].active = false
			} else {
				return false // blocker was not active
			}
		}
	});

	$("#" + id).fadeOut(1500, function() {
		// animation done
		return true
	});
}

function incrementGuesses() {
	guesses++;
	$("#guesses-count").html(guesses);
}

function revealAll() {
	$.each(blockers, function(k,v) {
		if (v.active) {
			revealSquare(v.id)
		}
	});
}

function makeGuess() {
	if (game_over) {
		return // game is over, do nothing
	}

	incrementGuesses();

	var guess = $('#guess').val();

	if (guess == game_today) { // winner!
		game_won = true;
		game_over = true;

		revealAll();
		$("#guessinput").fadeOut(2000, function() {
			$("#guessinput").html('<h2 class="winner">Winner!</h2><p>The game is: ' + game_today + '</p>')
			$("#guessinput").fadeIn(2000);
		});
	} else if (guesses == max_guesses) { // failure
		game_won = false;
		game_over = true;

		revealAll();
		$("#guessinput").fadeOut(2000, function() {
			$("#guessinput").html('<h2 class="failure">Failure.</h2><p>The game was: ' + game_today + '</p>')
			$("#guessinput").fadeIn(2000);
		});

	} else { // just wrong guess
		$("#playfield").effect("shake");
		
		// reveal one random tile
		r = Math.floor(Math.random() * blockers.length)
		while (blockers[r].active == false) {
			r = Math.floor(Math.random() * blockers.length)
		}
		revealSquare(blockers[r].id)

	}
}

function help() {
	alert("Click a tile to reveal part of a screenshot and guess what game it is.\nEvery wrong guess reveals an additional tile.\n\nPlease avoid changing your browser size.")
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
    		if (lastclicked == id || game_over) {
    			//console.log("blocking double click!!")
    		} else {
    			clickedBlocker(id);
    			lastclicked = id;
    		}
    		
    	}

	});
});

var wwidth = $(window).width();
$(window).on('resize', function() {
  if ($(this).width() !== wwidth) {
    wwidth = $(this).width();
    $("#playfield").hide();
    $("#guessfield").html("<p>Browser size changed. Please reload page.</p>")
  }
});