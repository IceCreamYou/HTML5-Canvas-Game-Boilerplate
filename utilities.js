var debugMode = false;

// SETUP ----------------------------------------------------------------------

var canvas, $canvas, context, mainLayer;
var doAnimate = false;
var mouseCoords = {x: -9999, y: -9999};

$(document).ready(function() {
	// Set up the canvas.
	canvas = document.getElementById('canvas');
	$canvas = $(canvas);
	var maxWidth = $canvas.attr('data-maxwidth') || canvas.width;
	var minWidth = $canvas.attr('data-minwidth') || canvas.width;
	canvas.width = Math.min(maxWidth, Math.max($(window).width(), minWidth));
	var maxHeight = $canvas.attr('data-maxheight') || canvas.height;
	var minHeight = $canvas.attr('data-minheight') || canvas.height;
	canvas.height = Math.min(maxHeight, Math.max($(window).height(), minHeight));
	
	// Track the mouse.
	$canvas.hover(function() {
		$(this).mousemove(function(e) {
			mouseCoords = {
					x: e.pageX - $(this).offset().left,
					y: e.pageY - $(this).offset().top
			};
		});
	}, function() {
		$(this).off('mousemove');
		mouseCoords = {x: -9999, y: -9999};
	});
	
	// Set up the main graphics context.
	context = canvas.getContext('2d');
	
	// Set up the world.
	world = new World();
});

// ANIMATION ------------------------------------------------------------------

// Support animation.
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

/**
 * Starts animating the canvas.
 * 
 * Call this to get the party going.
 * 
 * @see stopAnimating()
 */
function startAnimating() {
	if (!doAnimate) {
		doAnimate = true;
		animate();
	}
}

/**
 * Stop animating the canvas.
 * 
 * @see startAnimating()
 */
function stopAnimating() {
	doAnimate = false;
}

/**
 * Animates the canvas. This is intended for private use and should not be
 * called directly. Instead see startAnimating() and stopAnimating().
 * 
 * @see startAnimating()
 * @see stopAnimating()
 */
function animate() {
    // update
	update($.hotkeys.lastKeysPressed);
    
    // clear
    context.clear();

    // draw
    draw();

    // request new frame
    if (doAnimate) {
    	requestAnimFrame(animate);
    }
}

// OBJECTS --------------------------------------------------------------------

/**
 * A Box shape.
 * 
 * @param x
 *   The x-coordinate of the top-left corner of the box.
 * @param y
 *   The y-coordinate of the top-left corner of the box.
 * @param w
 *   The width of the box.
 * @param h
 *   The height of the box.
 */
var Box = Class.extend({
	init: function(x, y, w, h, fillStyle) {
		this.x = x || 0;
		this.y = y || 0;
		this.width = w || 80;
		this.height = h || 80;
		this.fillStyle = fillStyle || 'black';
		
		this.draw();
	},
	draw: function(ctx) {
		ctx = ctx || context;
		ctx.fillStyle = this.fillStyle;
		ctx.fillRect(this.x, this.y, this.width, this.height);
	},
	// Get the x-coordinate of the center of the box.
	xC: function() {
		return this.x + this.width/2;
	},
	// Get the y-coordinate of the center of the box.
	yC: function() {
		return this.y + this.height/2;
	},
	// Determines whether this box intersects another box.
	overlaps: function(otherBox) {
		return !(
				this.x + this.width < otherBox.x ||
				otherBox.x + otherBox.width < this.x ||
				this.y + this.height < otherBox.y ||
				otherBox.y + otherBox.height < this.y
		);
	},
});

/**
 * A container to keep track of multiple Boxes/Box descendants.
 * 
 * @param items
 *   An Array of items that the Collection should hold. Each item must have the
 *   properties of a Box.
 */
var Collection = Class.extend({
	init: function(items) {
		this.items = items || [];
	},
	draw: function(ctx) {
		ctx = ctx || context;
		for (var i = 0; i < this.items.length; i++)
			this.items[i].draw(ctx);
	},
	// Can collide with any box
	overlaps: function(box) {
		for (var i = 0; i < this.items.length; i++) {
			if (this.items[i].overlaps(box)) {
				return true;
			}
		}
		return false;
	},
	// Execute an arbitrary method of all items in the collection.
	// Arbitrary arguments will be passed on.
	execute: function(name) {
		var args = [];
		for (var i = 1; i < arguments.length; i++)
			args[i] = arguments[i];
		for (var i = 0; i < this.items.length; i++)
			this.items[i][name].apply(this.items[i], args);
	},
	add: function(item) {
		this.items.push(item);
	},
	remove: function(item) {
		this.items.remove(item);
	},
	removeLast: function() {
		return this.items.pop();
	},
	count: function() {
		return this.items.length;
	},
	reset: function() {
		this.items = [];
	}
});

/**
 * The World object.
 * 
 * The World represents the complete playable game area. Its size can be set
 * explicitly or is automatically determined by the "data-worldwidth" and
 * "data-worldheight" attributes set on the HTML canvas element (with a
 * fallback to the canvas width and height). If the size of the world is larger
 * than the canvas, then the view of the world will scroll when the player
 * approaches a side of the canvas. Resizing the world is possible but can
 * cause problems with placement of elements within it so it is recommended
 * not to change the world size after placing items in it.
 * 
 * @param w
 *   (optional) The width of the world. Defaults to the value of the
 *   "data-worldwidth" attribute on the HTML canvas element, or (if that
 *   attribute is not present) the width of the canvas element.
 * @param h
 *   (optional) The height of the world. Defaults to the value of the
 *   "data-worldheight" attribute on the HTML canvas element, or (if that
 *   attribute is not present) the height of the canvas element.
 */
function World(w, h) {
	// The dimensions of the world.
	this.width = w || parseInt($canvas.attr('data-worldwidth')) || canvas.width;
	this.height = h || parseInt($canvas.attr('data-worldheight')) || canvas.height;
	
	// The pixel-offsets of what's being displayed in the canvas compared to the world origin.
	this.xOffset = (this.width - canvas.width)/2;
	this.yOffset = (this.height - canvas.height)/2;
	this.getOffsets = function() {
		return {
			'x': this.xOffset,
			'y': this.yOffset,
		};
	};
	
	// Resize the world to new dimensions.
	// Careful, this can cause things in the world to appear off-center.
	this.resize = function(newWidth, newHeight) {
		// Try to re-center the offset of the part of the world in the canvas
		// so we're still looking at approximately the same thing.
		var deltaX = (newWidth - this.width) / 2, deltaY = (newHeight - this.height) / 2;
		this.xOffset += deltaX;
		this.yOffset += deltaY;
		context.translate(-deltaX, -deltaY);
		
		// Change the world dimensions.
		this.width = newWidth;
		this.height = newHeight;
		
		// Alert everyone else that we changed the world size.
		$(document).trigger('resizeWorld', { 'x': deltaX, 'y': deltaY, 'world': this });
	}
}

/**
 * The Layer object.
 * 
 * Layers allow efficient rendering of complex scenes by acting as caches for
 * parts of the scene that are grouped together. For example, it is recommended
 * to create a layer for your canvas's background so that you can render the
 * background once and then draw the completely rendered background onto the
 * main canvas in each frame instead of re-computing the background for each
 * frame. This can significantly speed up animation.
 * 
 * In general you should create a layer for any significant grouping of items
 * that must be drawn on the canvas, if that grouping moves together when
 * animated. It is more memory-efficient to specify a smaller layer size if
 * possible; otherwise the layer will default to the size of the whole canvas.
 * 
 * After initializing a layer, you can draw it onto the main canvas with the
 * draw() method. You can also move it by changing its x and y coordinates.
 * 
 * @param x
 *   (optional) The x-coordinate of the top-left corner of the layer. Defaults
 *   to 0 (zero).
 * @param y
 *   (optional) The y-coordinate of the top-left corner of the layer. Defaults
 *   to 0 (zero).
 * @param w
 *   (optional) The width of the layer. Defaults to the canvas width.
 * @param h
 *   (optional) The height of the layer. Defaults to the canvas height.
 * @param c
 *   (optional) A Canvas element in which to hold the layer. If not specified,
 *   a new, invisible canvas is created. Careful; if width and height are
 *   specified, the canvas will be resized. This is mainly for internal use.
 */
function Layer(x, y, w, h, c) {
	this.canvas = c || document.createElement('canvas');
	this.context = this.canvas.getContext('2d');
	this.width = w || canvas.width;
	this.height = h || canvas.height;
	this.x = x || 0;
	this.y = y || 0;
	this.canvas.width = this.width;
	this.canvas.height = this.height;
	this.draw = function(x, y) {
		x = x || this.x;
		y = y || this.y;
		context.drawImage(this.canvas, x, y);
	};
	this.clear = function() {
		this.context.clear();
	};
}

/**
 * The Zone object.
 * 
 * A Zone is a Box with an update() function. Use the update() function to
 * detect when relevant events have occurred (such as the player or mouse
 * entering the zone) and take appropriate action.
 */
var Zone = Box.extend({
	init: function(x, y, w, h, update, fillStyle) {
		this._super(x, y, w, h, fillStyle || '#EAEAEA');
		this.update = update || function() {};
	},
});

// RENDERING ------------------------------------------------------------------

/**
 * Clear the canvas.
 * 
 * Passing the optional fillStyle parameter will cause the entire canvas to be
 * filled in with that style. Otherwise the canvas is simply wiped.
 */
CanvasRenderingContext2D.prototype.clear = function(fillStyle) {
	if (fillStyle) {
		this.fillStyle = fillStyle;
		this.fillRect(0, 0, world.width, world.height);
	}
	else {
		this.clearRect(world.xOffset, world.yOffset, this.canvas.width, this.canvas.height);
	}
}

var images = {};
/**
 * Draws an image onto the canvas.
 * 
 * Always use this instead of drawImage() to draw images from files. This
 * function makes sure the image file is loaded before displaying it and then
 * caches the image so it can be displayed again quickly.
 * 
 * @param src
 *   The file path of the image to load.
 * @param x
 *   The x-coordinate at which to draw the top-left corner of the image.
 * @param y
 *   The y-coordinate at which to draw the top-left corner of the image.
 * @param w
 *   (optional) The width of the image. Defaults to the image width.
 * @param h
 *   (optional) The height of the image. Defaults to the image height.
 */
CanvasRenderingContext2D.prototype.drawLoadedImage = function(src, x, y, w, h) {
	if (images[src]) {
		if (w && h)
			this.drawImage(images[src], x, y, w, h);
		else
			this.drawImage(images[src], x, y);
	}
	else {
		var image = new Image();
		var t = this;
		image.onload = function() {
			if (w && h)
				t.drawImage(image, x, y, w, h);
			else
				t.drawImage(image, x, y);
		}
		image.src = src;
		images[src] = image;
	}
}

var texts = {};
/**
 * Draws cached text.
 * 
 * This function is useful if you need to display text in a layer that needs to
 * be refreshed frequently, for example if you need the text to move. However,
 * the Canvas API doesn't offer sufficient tools to get the measurement and
 * positioning of the hidden helper canvas perfectly correct with reasonable
 * performance. For this reason, you may be better off using fillText() instead
 * and drawing your text onto a custom layer for maximum control.
 * 
 * This method also offers the advantage that it is generally more succinct to
 * use than fillText() since it lets you quickly assign style properties.
 * 
 * @param text
 *   The text to display.
 * @param x
 *   The x-coordinate at which to draw the upper-left corner of the text.
 * @param y
 *   The y-coordinate at which to draw the upper-left corner of the text.
 * @param options
 *   (optional) An object with the following properties used to affect display
 *   of the text. Each property corresponds directly to a canvas graphics
 *   context property:
 *   - fillStyle
 *   - font
 *   - shadowColor
 *   - shadowOffsetX
 *   - shadowOffsetY
 *   - shadowBlur
 */
CanvasRenderingContext2D.prototype.fillGlyphs = function(text, x, y, options) {
	options = options || {};
	options.fillStyle = options.fillStyle || this.fillStyle;
	options.font = options.font || this.font;
	options.shadowColor = options.shadowColor || this.shadowColor || 'transparent';
	options.shadowOffsetX = options.shadowOffsetX || this.shadowOffsetX || 0;
	options.shadowOffsetY = options.shadowOffsetY || this.shadowOffsetY || 0;
	options.shadowBlur = options.shadowBlur || this.shadowBlur || 0;
	
	var substr = text.substr(0, 255), item = texts[substr];
	if (item && item.text == text && hasAtLeastSamePropertyValues(item.options, options)) {
		this.drawImage(item.canvas, x, y);
	}
	else {
		var tempCanvas = document.createElement('canvas');
		var tempContext = tempCanvas.getContext('2d');
		// This width is wider than it needs to be. Unfortunately we can't use
		// context.measureText() because we need the font options to be set first,
		// and those get reset after changing the width!
		tempCanvas.width = parseInt(options.font) * text.length +
				Math.abs(options.shadowOffsetX) + options.shadowBlur;
		// Calculating the text height is particularly inaccurate and
		// makes this function a little awkward to use.
		tempCanvas.height = parseInt(options.font) +
				Math.abs(options.shadowOffsetY) + options.shadowBlur;
		tempContext.fillStyle = options.fillStyle;
		tempContext.font = options.font;
		tempContext.shadowColor = options.shadowColor;
		tempContext.shadowOffsetX = options.shadowOffsetX;
		tempContext.shadowOffsetY = options.shadowOffsetY;
		tempContext.shadowBlur = options.shadowBlur;
		// The offsets here are not exact and make this function awkward to use.
		tempContext.fillText(
				text,
				Math.abs(options.shadowOffsetX) + options.shadowBlur,
				parseInt(options.font) * 0.75
		);
		this.drawImage(tempCanvas, x, y);
		
		texts[substr] = {
			'text': text,
			'options': options,
			'canvas': tempCanvas,
			'context': tempContext,
		};
	}
}

// DRAW SHAPES ----------------------------------------------------------------

/**
 * Draw a circle.
 * 
 * @param x
 *   The x-coordinate of the center of the circle.
 * @param y
 *   The y-coordinate of the center of the circle.
 * @param r
 *   The radius of the circle.
 * @param fillStyle
 *   A canvas fillStyle used to fill the circle. If not specified, the circle uses the current
 *   fillStyle. If null, the circle is not filled.
 * @param strokeStyle
 *   A canvas strokeStyle used to draw the circle's border. If not specified,
 *   no border is drawn on the circle. If null, the border uses the current
 *   strokeStyle.
 */
CanvasRenderingContext2D.prototype.circle = function(x, y, r, fillStyle, strokeStyle) {
	// Circle
	this.beginPath();
	this.arc(x, y, r, 0, 2 * Math.PI, false);
	if (fillStyle !== null) {
		if (fillStyle)
			this.fillStyle = fillStyle;
		this.fill();
	}
	if (strokeStyle !== undefined) {
		this.lineWidth = Math.max(Math.ceil(r/15), 1);
		if (strokeStyle)
			this.strokeStyle = strokeStyle;
		this.stroke();
	}
}

/**
 * Draw a smiley face.
 * 
 * The Actor class uses this as a placeholder.
 * 
 * @param x
 *   The x-coordinate of the center of the smiley face.
 * @param y
 *   The y-coordinate of the center of the smiley face.
 * @param r
 *   The radius of the smiley face.
 * @param fillStyle
 *   (optional) The color / fill-style of the smiley face.
 */
CanvasRenderingContext2D.prototype.drawSmiley = function(x, y, r, fillStyle) {
	var thickness = Math.max(Math.ceil(r/15), 1);
	
	// Circle
	this.circle(x, y, r, fillStyle || 'lightBlue', 'black');
	
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

/**
 * Draws a blue-and-yellow radial gradient across the entire background of the
 * world. This is mainly useful to demonstrate that scrolling works if the
 * world is bigger than the canvas.
 */
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

// INPUT ----------------------------------------------------------------------

/**
 * Prevent the default behavior from occurring when hitting keys.
 * 
 * This won't prevent everything -- for example it won't prevent combinations
 * of multiple non-control-character keys -- and if you want to do something
 * like prevent the default effect of hitting Enter but not Shift+Enter then
 * you need to handle that yourself.
 */
function preventDefaultKeyEvents(combinations) {
	$(document).keydown(combinations, function() { return false; });
}

// MATH AND OPERATIONS --------------------------------------------------------

// Convert a percent (out of 100%) to the corresponding pixel position in the world.
function percentToPixels(percent) {
  return {
	  x: Math.floor(world.width * percent / 100),
	  y: Math.floor(world.height * percent / 100),
  };
}

// Get a random integer between lo and hi, inclusive.
// Assumes lo and hi are integers and lo is lower than hi.
function getRandBetween(lo, hi) {
    return parseInt(Math.floor(Math.random()*(hi-lo+1))+lo);
};

// Get the keys (property names) of an object.
// This would be useful as an extension of Object, but jQuery complains if Object is extended.
function keys(obj){
    var keys = [];
    for (var key in obj) {
        if (obj.hasOwnProperty(key))
            keys.push(key);
    }
    return keys;
};

// Check if an object b has at least the same properties and values as another object a
// (although b could have additional properties).
function hasAtLeastSamePropertyValues(a, b) {
	for (var prop in a) {
		if (a.hasOwnProperty(prop)) {
			if (!b.hasOwnProperty(prop) || a[prop] != b[prop])
				return false;
		}
	}
	return true;
}

// Check whether an object has a property with a given value and if so, return that property.
// This would be useful as an extension of Object, but jQuery complains if Object is extended.
function hasPropValue(obj, val) {
	for (var prop in obj) {
		if (obj.hasOwnProperty(prop) && obj[prop] == val) {
			return prop;
		}
	}
	return false;
}

// Remove an item from an array by value.
Array.prototype.remove = function(item) {
    var i = $.inArray(item, this);
    if (i === undefined || i < 0) return undefined;
    return this.splice(i, 1);
};

// Get a random element out of an array.
Array.prototype.getRandomElement = function() {
    if (this.length == 0)
        return undefined;
    var i = getRandBetween(0, this.length-1);
    return this[i];
};
