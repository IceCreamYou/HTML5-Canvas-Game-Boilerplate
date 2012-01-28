var debugMode = false;

// ANIMATION-------------------------------------------------------------------

var canvas, $canvas, context;
var doAnimate = false;

$(document).ready(function() {
	canvas = document.getElementById('canvas');
	$canvas = $(canvas);
	context = canvas.getContext('2d');
	world = new World();
});

window.requestAnimFrame = (function(callback){
    return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function(callback){
        window.setTimeout(callback, 1000 / 60);
    };
})();

function startAnimating() {
	if (!doAnimate) {
		doAnimate = true;
		animate();
	}
}

function stopAnimating() {
	doAnimate = false;
}

// Magic functions. Override these
function update() {}
function draw() {}

function animate() {
    // update
	update();

    // clear
    context.clear();

    // draw
    draw();

    // request new frame
    if (doAnimate) {
    	requestAnimFrame(animate);
    }
}

/**
 * The World object.
 */
function World(w, h) {
	this.width = w || canvas.width;
	this.height = h || canvas.height;
	this.xOffset = (this.width - canvas.width)/2;
	this.yOffset = (this.height - canvas.height)/2;
	this.getOffsets = function() { return { 'x': this.xOffset, 'y': this.yOffset }; };
	this.resize = function(newWidth, newHeight) {
		var deltaX = (newWidth - this.width) / 2, deltaY = (newHeight - this.height) / 2;
		this.xOffset += deltaX;
		this.yOffset += deltaY;
		context.translate(-deltaX, -deltaY);
		this.width = newWidth;
		this.height = newHeight;
		$(document).trigger('resizeWorld', { 'x': deltaX, 'y': deltaY });
	}
}

CanvasRenderingContext2D.prototype.clear = function(style) {
	if (style) {
		this.fillStyle = style;
		this.fillRect(0, 0, world.width, world.height);
	}
	else {
		this.clearRect(world.xOffset, world.yOffset, this.canvas.width, this.canvas.height);
	}
}

// DRAW SHAPES ----------------------------------------------------------------

CanvasRenderingContext2D.prototype.drawSmiley = function(x, y, r) {
	var thickness = Math.max(Math.ceil(r/15), 1);
	
	// Circle
	this.beginPath();
	this.arc(x, y, r, 0, 2 * Math.PI, false);
	this.fillStyle = 'lightBlue';
	this.fill();
	this.lineWidth = thickness;
	this.strokeStyle = 'black';
	this.stroke();
	
	// Smile
	this.beginPath();
	this.arc(x, y, r*0.6, Math.PI*0.1, Math.PI*0.9, false);
	this.lineWidth = thickness;
	this.strokeStyle = 'black';
	this.stroke();
    
    // Eyes
	this.beginPath();
	this.arc(x - r*0.3, y - r*0.25, Math.max(Math.ceil(r/15), 1), 0, 2 * Math.PI, false);
	this.fillStyle = 'black';
	this.fill();
	this.arc(x + r*0.3, y - r*0.25, Math.max(Math.ceil(r/15), 1), 0, 2 * Math.PI, false);
	this.fillStyle = 'black';
	this.fill();
}

CanvasRenderingContext2D.prototype.drawBkgdRadialGradient = function() {
	// Draw a radial gradient on the background.
	var radgrad = context.createRadialGradient(
			world.width/2, world.height/2, 50,
			world.width/2, world.height/2, world.width/2
	);
    radgrad.addColorStop(0, '#A7D30C');
    radgrad.addColorStop(0.6, '#067A9E');
    radgrad.addColorStop(1, 'rgba(1,159,98,0)');
    this.clear(radgrad);
}

// MATH -----------------------------------------------------------------------

function getRandBetween(lo, hi) {
    return parseInt(Math.floor(Math.random()*(hi-lo+1))+lo);
};

function keys(obj){
    var keys = [];
    for (var key in obj) {
        if (obj.hasOwnProperty(key))
            keys.push(key);
    }
    return keys;
};

Array.prototype.remove = function(item) {
    var i = $.inArray(item, this);
    if (i === undefined || i < 0) return undefined;
    return this.splice(i, 1);
};

Array.prototype.getRandomElement = function() {
    if (this.length == 0)
        return undefined;
    var i = getRandBetween(0, this.length-1);
    return this[i];
};
