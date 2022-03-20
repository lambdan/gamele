var todays_image;
var img = new Image();


var rows = 2;
var cols = 5;

var max_guesses = rows*cols;
var lastclicked = ""; // for double click prevention
var blockers = [];

var gamesjson;
var games = [];
var game_titles = []; // will be sorted for the input box
var game_today = ""; // title we're looking for today

var game_over = false;
var game_won = false;

var session_date;
var revealed_today = []
var guesses_today = [];

var user_stats;
var num_emoji = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"]

var perfect_chars = [];
var correct_chars = [];
var wrong_chars = [];

function dateToday() {
	const d = new Date();
	//console.log("moment:", moment(d).format())
	iso = moment(d).format("YYYY-MM-DD")
	//console.log("date is", iso)
	return String(iso)
}

function daysSinceStart() {
	start = moment(START_DATE);
	today = moment(dateToday());
	return today.diff(start,'days');
}

function init () {
	session_date = dateToday()

	// load "save files"
	revealed_today = loadRevealed();
	user_stats = loadStats();
	loadedTodayResults = loadTodaysResult();

	// read and parse games.json
	$.each(gamesjson, function(k,v) {
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
	todays_image = games[r].image
	todays_width = games[r].width

	// set playfield area based on screenshot width
	playfield_max_width = String(todays_width) + "px"

	$("#playfield").css({
		"max-width": playfield_max_width
	});

	$("#image").css({
		"max-width": playfield_max_width
	});

	//$("#guessinput").hide();

	// setup the image and create blockers, after it has loaded
	img.onload = function() {

		console.log("finished loading img")
		$("#loading").hide();
		$("#image").html(img); // image needs to be shown before blockers are added

		// create blockers
		for (let r = 0; r < rows; r++) {
			for (let c = 0; c < cols; c++) {
				addBlock(r,c)
			}
		}

		if (loadedTodayResults) {
			//$("#guessinput").hide();
			if (loadedTodayResults == "win") {
				wonGame();
			} else {
				lostGame();
			}
		} else {
			$("#guessinput").fadeIn();
		}

			if (revealed_today.length > 0) {
				$.each(revealed_today, function(k,v) {
					console.log("revealing", v)
					$("#" + v).fadeOut();
				});
			}

	}

	img.src = todays_image // yes, src is set after the above onload... very weird
}

function sizeChanged() {
	if (game_over) {
		return // dont need to do anything if the game is over
	}

	$("#image").hide(); // hide the image

	$.each(blockers, function(k,v) { // remove all blockers from the html
		$("#" + v.id).remove();
	});
	blockers = []; // wipe the blockers array (as it will be filled by addBlock() again)

	$("#image").show(); // show the image again (so blockers can get their sizes)



	// create blockers
	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < cols; c++) {
			addBlock(r,c)
		}
	}
	// reveal blockers already clicked
	if (revealed_today.length > 0) {
		$.each(revealed_today, function(k,v) {
			console.log("revealing", v)
			$("#" + v).hide();
		});
	}

}

function addBlock(row,col) {
	console.log("addBlock img client sizes:", img.clientWidth, img.clientHeight)
	w = img.clientWidth/cols
	h = img.clientHeight/rows

	x = col * w
	y = row * h

	name = "blocker-" + row + "-" + col

	s = '<div id="' + name + '" class="blocker" style="margin-top:' + y + ';margin-left:' + x + ';width:' + w + ';height:' + h +';"></div>';
	$('#playfield').append(s)
	blockers.push({"id": name, "active": true})
}

function clickedBlocker(id) {
	revealSquare(id);
}

function revealSquare(id) {
	$.each(blockers, function(k,v) {
		if (v.id == id) {
			if (v.active) {
				blockers[k].active = false
				revealed_today.push(id)
				saveRevealed()
			} else {
				return false // blocker was not active
			}
		}
	});

	$("#" + id).fadeOut(2000, function() {
		// animation done
		return true
	});
}


function revealAll() {
	$.each(blockers, function(k,v) {
		if (v.active) {
			$("#" + v.id).fadeOut(500);
		}
	});
}

function wonGame() {
		game_won = true;
		game_over = true;

		revealAll();
		$("#guessinput").fadeOut(2000, function() {
			$("#guessinput").html('<h2 class="winner">Winner!</h2><p><i>' + game_today + '</i></p><a onclick="share()" class="sharebutton">Share</a>')
			$("#guessinput").fadeIn(2000);
		});	
}

function lostGame() {
		game_won = false;
		game_over = true;

		revealAll();
		$("#guessinput").fadeOut(2000, function() {
			$("#guessinput").html('<h2 class="failure">Failure.</h2><p>The game was:<br><i>' + game_today + '</i></p><a onclick="share()" class="sharebutton">Share</a>')
			$("#guessinput").fadeIn(2000);
		});	
}

function makeGuess() {
	if (game_over) {
		return // game is over, do nothing
	}

	var guess = $('#guess').val();

	if (guesses_today.includes(guess)) {
		alert("You've already guessed that game today!");
		return
	} else {
		guesses_today.push(guess);
	}
	
	
	stripped = guess.replace(/[^0-9a-z]/gi, '').toUpperCase() // strip non-alphanumeric
	target = game_today.toUpperCase().replace(/[^0-9a-z]/gi, '') //todays game (alphanumeric and uppercase)

	for (var c = 0; c < stripped.length; c++) { // iterate the (stripped) guess
		chr = stripped.charAt(c)

		if (target.includes(chr)) { // char is in todays game

			if (!correct_chars.includes(chr)) { // push to correct (yellow) letters if not already there
				correct_chars.push(chr);
			}

			for (var h=0; h < target.length; h++) {
				if (target[h] == stripped[h]) {
					perfect_chars[h] = stripped[h];
				}
			}

		} else {
			if (!wrong_chars.includes(chr)) {
				wrong_chars.push(chr);
			}
		}
	}

	$("#perfect-letters").html(perfect_chars.join(""));
	$("#correct-letters").html(correct_chars.join(""));
	$("#wrong-letters").html(wrong_chars.join(""));


	if (guess == game_today) { // winner!
		wonGame();
		saveTodaysResult("win");

	} else if (revealed_today.length == max_guesses) { // failure
		lostGame();
		saveTodaysResult("fail");

	} else { // just wrong guess
		$("#playfield").effect("shake");
		
		// reveal one random tile
		r = Math.floor(Math.random() * blockers.length)
		while (blockers[r].active == false) {
			//console.log("oop, that one was already revealed")
			r = Math.floor(Math.random() * blockers.length)
		}
		revealSquare(blockers[r].id)

	}
}

function help() {
	alert("Click a tile to reveal part of a screenshot and guess what game it is.\n\nEvery wrong guess reveals an additional tile.\n\nGuessing wrong when everything is revealed means game over.")
}

function saveRevealed() {
	save_name = SAVE_PREFIX + "revealed_" + session_date
	localStorage.setItem(save_name, JSON.stringify(revealed_today))
	console.log("saved revealed:", JSON.stringify(revealed_today))
}

function loadRevealed() {
	console.log("loading revealed")
	save_name = SAVE_PREFIX + "revealed_" + session_date
	//console.log("load:", save_name)
	if (localStorage.getItem(save_name) == null) {
		// nothing is saved
		return []
	} else {
		return JSON.parse(localStorage.getItem(save_name))
	}
}

function wipeTodaysReveals() {
	revealed_today = []
	saveRevealed()
	alert("OK reload page")
}

function saveTodaysResult(result) {
	save_name = SAVE_PREFIX + "result_" + session_date
	localStorage.setItem(save_name, result)
	console.log("saved result", save_name)

	// save stats
	if (user_stats.played_days.includes(dateToday())) {
		console.log("today was in stats already")
	} else {
		console.log("today was not in stats")
		user_stats.played_days.push(dateToday())
		if (result == "win") {
			user_stats.wins[revealed_today.length]++;
		} else {
			user_stats.fails++;
		}
		saveStats();
	}
}

function loadTodaysResult() {
	console.log("loading todays results")
	save_name = SAVE_PREFIX + "result_" + session_date
	if (localStorage.getItem(save_name) == null) {
		// nothing is saved
		return false
	} else {
		return localStorage.getItem(save_name)
	}
}

function saveStats() {
	save_name = SAVE_PREFIX + "stats"
	localStorage.setItem(save_name, JSON.stringify(user_stats))
	console.log("saved stats", save_name)
}

function loadStats() {
	console.log("loading stats")
	save_name = SAVE_PREFIX + "stats"
	if (localStorage.getItem(save_name) == null) {
		// nothing is saved, generate defaults
		//console.log("no stats, generating defaults")
		return {
			"first_played": dateToday(),
			"last_played": dateToday(),
			"played_days": [],
			"wins": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			"fails": 0
		}
	} else {
		//console.log("found stats")
		return JSON.parse(localStorage.getItem(save_name))
	}
}

function showStats() {
	var s = "First played: " + user_stats.first_played + "\n"
	s += "Played days: " + user_stats.played_days.length + "\n"
	s += "\n"
	s += "Wins (0 revealed): " + user_stats.wins[0] + "\n"
	s += "Wins (1 revealed): " + user_stats.wins[1] + "\n"
	s += "Wins (2 revealed): " + user_stats.wins[2] + "\n"
	s += "Wins (3 revealed): " + user_stats.wins[3] + "\n"
	s += "Wins (4 revealed): " + user_stats.wins[4] + "\n"
	s += "Wins (5 revealed): " + user_stats.wins[5] + "\n"
	s += "Wins (6 revealed): " + user_stats.wins[6] + "\n"
	s += "Wins (7 revealed): " + user_stats.wins[7] + "\n"
	s += "Wins (8 revealed): " + user_stats.wins[8] + "\n"
	s += "Wins (9 revealed): " + user_stats.wins[9] + "\n"
	s += "Wins (10 revealed): " + user_stats.wins[10] + "\n"
	s += "\n"
	s += "Fails: " + user_stats.fails + "\n"
	alert(s)
}

function share() {
	var res = SITE_URL + " " + daysSinceStart() + "\n";

	var squares = [["","","","",""], ["","","","",""]]

	if (game_won) {
		res += "✅" 
	} else {
		res += "❌"
	}

	res += " " + revealed_today.length + "/" + (rows*cols) + "\n"
	
	// put out the number emojis
	$.each(revealed_today, function(k,v) {
		splits = v.split("-")
		squares[splits[1]][splits[2]] = num_emoji[k]
		//console.log(splits)
	});

	// fill the rest with black squares
	$.each(squares, function(k,v) {
		$.each(v, function(x,y) {
			if (squares[k][x] == "") {
				squares[k][x] = "⬛️"
			}
		});
	});

	// format the squares
	$.each(squares, function(k,v){
		$.each(v, function(x,y) {
			res += y
		});
		res += "\n"
	});

	var shareData = {
		text: res
	}

	navigator.clipboard.writeText(res).then(function() {
		$(".sharebutton").html("Copied to clipboard")
	});

	try {
		navigator.share(shareData) // this fails when testing in http:
	} catch(error) {
		console.log(error)
	}
	
}

$(window).on("load", function() {

	// first load json until we do anything else
	$.getJSON(GAMES_JSON, (data) => {
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
    //$("#playfield").hide();
    //$("#guessfield").html("<p>Browser size changed. Please reload page. (Progress is saved)</p>")
    sizeChanged();
  }
});