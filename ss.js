var todays_image = "screens/deathloop.jpg";

function init () {
	setImage(todays_image);
}

function setImage(path) {
	var img = document.createElement("IMG");
	img.src = path;
	$('#image').html(img);
}