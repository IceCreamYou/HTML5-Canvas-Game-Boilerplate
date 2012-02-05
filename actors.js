var player;
$(canvas).ready(function() {
	// Place the player in the center of the world by default.
	player = new Player(world.width/2, world.height/2);
});
// The world was just resized. Try to keep the player at the same place in the
// viewport so that the player doesn't disappear off the screen.
$(document).on('resizeWorld', function(e, delta) {
	player.x += delta.x;
	player.y += delta.y;
});

/**
 * The Actor object.
 */
var Actor = Box.extend({
	MOVEAMOUNT: 5,
	
	src: null, // If set, this image will be drawn instead of the placeholder smiley face
	
	draw: function(ctx) {
		ctx = ctx || context;
		if (this.src)
			ctx.drawLoadedImage(src, this.x, this.y);
		else
			context.drawSmiley(this.x + this.width/2, this.y + this.height/2, (this.width+this.height)/4);
	},
	
	// direction can be any string containing either 'left' or 'right' and/or either 'up' or 'down'
	move: function(direction) {
		this.lastDirection = direction;
		
		// Move.
		if (direction.indexOf('left') > -1 && this.x - this.MOVEAMOUNT >= 0) {
			this.x -= this.MOVEAMOUNT;
		}
		else if (direction.indexOf('right') > -1 && this.x + this.width + this.MOVEAMOUNT <= world.width) {
			this.x += this.MOVEAMOUNT;
		}
		if (direction.indexOf('up') > -1 && this.y - this.MOVEAMOUNT >= 0) {
			this.y -= this.MOVEAMOUNT;
		}
		else if (direction.indexOf('down') > -1 && this.y + this.height + this.MOVEAMOUNT <= world.height) {
			this.y += this.MOVEAMOUNT;
		}
	},
});

/**
 * The Player object controlled by the user.
 */
var Player = Actor.extend({
	MOVEWORLD: 0.25,
	
	move: function(e) {
		this._super(e);
		
		// Move the viewport when the player gets near the edge.
		var offsets = world.getOffsets();
		if (offsets.x > 0 && this.x - offsets.x < canvas.width * this.MOVEWORLD) {
			world.xOffset = Math.max(offsets.x - this.MOVEAMOUNT, 0);
			context.translate(offsets.x - world.xOffset, 0);
		}
		else if (offsets.x < world.width - canvas.width &&
				this.x - offsets.x > canvas.width * (1-this.MOVEWORLD)) {
			world.xOffset = Math.min(offsets.x + this.MOVEAMOUNT, world.width - canvas.width);
			context.translate(offsets.x - world.xOffset, 0);
		}
		if (offsets.y > 0 && this.y - offsets.y < canvas.height * this.MOVEWORLD) {
			world.yOffset = Math.max(offsets.y - this.MOVEAMOUNT, 0);
			context.translate(0, offsets.y - world.yOffset);
		}
		else if (offsets.y < world.height - canvas.height &&
				this.y - offsets.y > canvas.height * (1-this.MOVEWORLD)) {
			world.yOffset = Math.min(offsets.y + this.MOVEAMOUNT, world.height - canvas.height);
			context.translate(0, offsets.y - world.yOffset);
		}
		
		if (debugMode) {
			console.log('Moving '+ direction +'; ('+ this.x +', '+ this.y +')');
		}
	},
});

/**
 * A Wall that blocks Actor movement.
 * 
 * The main difference from Boxes in terms of implementation is that Walls
 * support "soft" edges, meaning other Boxes can partially overlap with those
 * edges without being considered intersecting by the overlaps() method.
 * 
 * @param x
 *   The x-coordinate of the top-left corner of the box.
 * @param y
 *   The y-coordinate of the top-left corner of the box.
 * @param w
 *   The width of the box.
 * @param h
 *   The height of the box.
 * @param soft
 *   (optional) An object with top, right, bottom, and left properties. Each
 *   property is a decimal [0, 1) representing how much that edge of the box
 *   can partially overlap with other boxes before being considered colliding.
 * @param fillStyle
 *   (optional) The style in which to draw the wall. Typically a CSS color.
 */
var Wall = Box.extend({
	init: function(x, y, w, h, soft, fillStyle) {
		this.x = x;
		this.y = y;
		this.width = w;
		this.height = h;
		this.soft = $.extend({
			top: 0,
			right: 0,
			bottom: 0,
			left: 0,
		}, soft || {});
		this.fillStyle = fillStyle || '#333333';
	},
	overlaps: function(otherBox) {
		var sXr = this.width * this.soft.right;
		var sXl = this.width * this.soft.left;
		var sYt = this.height * this.soft.top;
		var sYb = this.height * this.soft.bottom;
		return !(
				this.x + this.width - sXr < otherBox.x ||
				otherBox.x + otherBox.width < this.x - sXl ||
				this.y + this.height - sYt < otherBox.y ||
				otherBox.y + otherBox.height < this.y - sYb
		);
	},
});
