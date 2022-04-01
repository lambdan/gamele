var VERSION = "1.0.1" // shown in bottom of help box so we can verify the latest script is loaded

var todays_image;
var img = new Image();


var rows = 2;
var cols = 5;
var max_guesses = (rows*cols) + 1;

var lastclicked = ""; // for double click prevention
var blockers = [];

var gamesjson;
var games = [];
var game_titles = []; // will be sorted for the input box
var game_today = ""; // title we're looking for today

var game_over = false;
var game_won = false;

var session_date;

var user_stats;
var num_emoji = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"]

var today_userdata;

function dateToday() {
	const d = new Date();
	iso = moment(d).format("YYYY-MM-DD")
	return String(iso)
}

function daysSinceStart() {
	start = moment(START_DATE); // set in each page's html <script>
	today = moment(dateToday());
	return today.diff(start,'days');
}

function init () {
	session_date = dateToday()

	// load "save files"
	today_userdata = loadTodayUserdata();
	user_stats = loadStats();

	$("#correct-letters").html(today_userdata.correct.join(""));
	$("#wrong-letters").html(today_userdata.wrong.join(""));
	updateGuessesRemaining();

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

	if (today_userdata.perfect2.length == 0) {
			// generate blank game title with _'s
			for (var c = 0; c < game_today.length; c++) {
		
			if (game_today[c] ==  " ") {
				today_userdata.perfect2[c] = " ";
			} else if (!today_userdata.perfect2[c]) {
				today_userdata.perfect2[c] = "_";
			}
		}
	}
	$("#perfect-letters").html(today_userdata.perfect2.join(""));


	// set playfield area based on screenshot width
	playfield_max_width = String(todays_width) + "px"

	$("#playfield").css({
		"max-width": playfield_max_width
	});

	$("#image").css({
		"max-width": playfield_max_width
	});

	// setup the image and create blockers, after it has loaded
	img.onload = function() {

		console.log("finished loading img")
		$("#loading").hide();
		$("#image").html(img); // image needs to be "shown" before blockers are added

		// create blockers
		for (let r = 0; r < rows; r++) {
			for (let c = 0; c < cols; c++) {
				addBlock(r,c)
			}
		}

		if (today_userdata.result == "incomplete") {
			$("#guessinput").fadeIn();
		} else if (today_userdata.result == "win") {
			wonGame();
		} else if (today_userdata.result == "fail") {
			lostGame();
		}

			if (today_userdata.revealed.length > 0) {
				$.each(today_userdata.revealed, function(k,v) {
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
	if (today_userdata.revealed.length > 0) {
		$.each(today_userdata.revealed, function(k,v) {
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

function guessesRemaining() {
	var remain = max_guesses - (today_userdata.revealed.length + today_userdata.guesses.length)
	return remain
}

function updateGuessesRemaining() {
	$("#guesses-remaining").html("Guesses/Reveals Remaining: " + guessesRemaining())
}

function clickedBlocker(id) {
	today_userdata.revealed.push(id)
	saveTodayUserdata();
	
	updateGuessesRemaining();

	revealSquare(id);

	if (guessesRemaining() <= 0) {
		lostGame();
	}
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

		if (!user_stats.played_days.includes(dateToday())) {
			today_userdata.result = "win";

			user_stats.wins[today_userdata.revealed.length + today_userdata.guesses.length]++;
			user_stats.played_days.push(dateToday());
			saveStats();
		}

		revealAll();
		$("#guessinput").fadeOut(2000, function() {
			$("#guessinput").html('<h2 class="winner">Winner!</h2><a onclick="share()" class="sharebutton">Share</a>')
			$("#guessinput").fadeIn(2000);
		});	
}

function lostGame() {
		game_won = false;
		game_over = true;

		if (!user_stats.played_days.includes(dateToday())) {
			today_userdata.result = "fail";
			user_stats.fails++;
			user_stats.played_days.push(dateToday());
			saveStats();
		}

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

	if (today_userdata.guesses.includes(guess)) {
		alert("You've already guessed that game today!");
		return
	} else {
		today_userdata.guesses.push(guess);
		updateGuessesRemaining();
	}
	
	
	stripped = guess.replace(/[^0-9a-z]/gi, '').toUpperCase() // strip non-alphanumeric
	target = game_today.toUpperCase().replace(/[^0-9a-z]/gi, '') //todays game (alphanumeric and uppercase)

	for (var c = 0; c < stripped.length; c++) { // iterate the (stripped) guess
		chr = stripped.charAt(c)

		if (target.includes(chr)) { // char is in todays game

			if (!today_userdata.correct.includes(chr)) { // push to correct (yellow) letters if not already there
				today_userdata.correct.push(chr);
			}

			/*
			for (var h=0; h < target.length; h++) {
				if (target[h] == stripped[h]) {
					today_userdata.perfect[h] = stripped[h];
				} else if (!today_userdata.perfect[h]) {
					today_userdata.perfect[h] = "*";
				}
			}
			*/

		} else {
			if (!today_userdata.wrong.includes(chr)) {
				today_userdata.wrong.push(chr);
			}
		}
	}

	for (var c = 0; c < game_today.length; c++) {
		if (guess[c] == game_today[c]) {
			today_userdata.perfect2[c] = guess[c].toUpperCase();
		} else if (game_today[c] ==  " ") {
			today_userdata.perfect2[c] = " ";
		} else if (!today_userdata.perfect2[c]) {
			today_userdata.perfect2[c] = "_";
		}
	}

	$("#perfect-letters").html(today_userdata.perfect2.join(""));
	$("#correct-letters").html(today_userdata.correct.join(""));
	$("#wrong-letters").html(today_userdata.wrong.join(""));


	if (guess == game_today) { // winner!
		wonGame();

	} else if (guessesRemaining() <= 0) { // failure
		$("#playfield").effect("shake");
		lostGame();
	} else { // just wrong guess
		$("#playfield").effect("shake");
	}

	saveTodayUserdata();
}

function help() {
	alert("Click a tile to reveal part of a screenshot and try to guess what game it is.\n\n(Version: " + VERSION + ")")
}

function saveTodayUserdata() {
	save_name = SAVE_PREFIX + "userdata_" + session_date
	localStorage.setItem(save_name, JSON.stringify(today_userdata))
	console.log("saved today userdata:", JSON.stringify(today_userdata))
}

function loadTodayUserdata() {
	console.log("loading todays userdata")
	save_name = SAVE_PREFIX + "userdata_" + session_date
	//console.log("load:", save_name)
	if (localStorage.getItem(save_name) == null) {
		// nothing is saved
		return {
			"result": "incomplete",
			"revealed": [],
			"guesses": [],
			"perfect": [],
			"perfect2": [],
			"correct": [],
			"wrong": []
		}
	} else {
		return JSON.parse(localStorage.getItem(save_name))
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
		return {
			"first_played": dateToday(),
			"last_played": dateToday(),
			"played_days": [],
			"wins": Array(max_guesses + 1).fill(0), // +1 so we can start the showStats at 1
			"fails": 0
		}
	} else {
		var s = JSON.parse(localStorage.getItem(save_name))
		if (s.wins.length <= max_guesses) {
			s.wins.push(0); // we changed max_guesses so we need to extend the stats array
		}
		return s
	}
}

function showStats() {
	var s = "First played: " + user_stats.first_played + "\n"
	s += "Played days: " + user_stats.played_days.length + "\n"
	s += "\n"

	for (var g = 1; g <= max_guesses; g++) {
		s += "Wins (" + (g) + "): " + user_stats.wins[g] + "\n"
	}
	s += "\n"
	s += "Fails: " + user_stats.fails + "\n"
	alert(s)
}

function share() {
	var res = "🕹️ " + SITE_URL + " " + daysSinceStart() + "\n";

	var squares = [];

	for (var r = 0; r < rows; r++) {
		squares[r] = [];
		for (var c = 0; c < cols; c++) {
			squares[r][c] = "";
		}
	}

	if (game_won) {
		res += "✅" 
		res += " " + (today_userdata.revealed.length + today_userdata.guesses.length) + "/" + (max_guesses) + "\n"
	} else {
		res += "❌"
		res += " X/" + (max_guesses) + "\n"
	}
	
	// put out the number emojis
	$.each(today_userdata.revealed, function(k,v) {
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