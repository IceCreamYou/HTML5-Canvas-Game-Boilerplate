/**
 * @file
 *   Defines useful classes for actors in the world.
 */

var player;
$(document).ready(function() {
	// Place the player in the center of the world by default.
	player = new Player(
	    Math.floor(world.width/2),
	    Math.floor(world.height/2)
	);
});

/**
 * Actors are Boxes that can move.
 */
var Actor = Box.extend({
	MOVEAMOUNT: 300, // pixels per second

	init: function(x, y, w, h) {
		this.x = x || 0;
		this.y = y || 0;
		this.width = w || 80;
		this.height = h || 80;
	},

	// Actors draw as a smiley face by default.
	draw: function(ctx) {
		ctx = ctx || context;
		if (this.src) {
			ctx.drawLoadedImage(this.src, this.x, this.y, this.width, this.height);
    }
		else {
			context.drawSmiley(this.x + this.width/2, this.y + this.height/2, (this.width+this.height)/4);
    }
	},

	/**
	 * Moves the actor in a given direction.
	 *
	 * @param direction
	 *   The direction in which to move the actor. Can be any string containing
	 *   either 'left' or 'right' and/or either 'up' or 'down'.
	 *
	 * @return
	 *   An object with 'x' and 'y' properties indicating the number of pixels
	 *   the actor has moved in the respective direction.
	 */
	move: function(direction, delta) {
	  var moveAmount = this.MOVEAMOUNT * App.timer.lastDelta;
		this.lastDirection = direction;
		var moved = {
				x: 0,
				y: 0,
		};

		// Move horizontally.
		if (direction.indexOf('left') > -1 && this.x - moveAmount >= 0) {
			this.x -= moveAmount;
			moved.x = -moveAmount;
		}
		else if (direction.indexOf('right') > -1 && this.x + this.width + moveAmount <= world.width) {
			this.x += moveAmount;
			moved.x = moveAmount;
		}

		// Move vertically.
		if (direction.indexOf('up') > -1 && this.y - moveAmount >= 0) {
			this.y -= moveAmount;
			moved.y = -moveAmount;
		}
		else if (direction.indexOf('down') > -1 && this.y + this.height + moveAmount <= world.height) {
			this.y += moveAmount;
			moved.y = moveAmount;
		}

		return moved;
	},
});

/**
 * The Player object controlled by the user.
 *
 * If the world is bigger than the canvas, the viewport will shift as a Player
 * moves toward an edge of the viewport. This behavior is usually desirable for
 * situations where a Player is desired, and in other cases (e.g. when the
 * viewport should shift based on the mouse's location) generally a Player
 * should not be used.
 */
var Player = Actor.extend({
  /**
   * The default threshold for how close a player has to be to an edge before
   * the viewport shifts (in percent of canvas size). To have the viewport move
   * only when the player is actually at its edge, try a value close to zero.
   * To have the viewport move with the player, try a value close to 0.5.
   */
	MOVEWORLD: 0.33,

	move: function(e) {
		var moved = this._super(e);
    var moveAmount = this.MOVEAMOUNT * App.timer.lastDelta;

		// Move the viewport when the player gets near the edge.
		var offsets = world.getOffsets();
		// left
		if (offsets.x > 0 && this.x + this.width/2 - offsets.x < canvas.width * this.MOVEWORLD) {
			world.xOffset = Math.max(offsets.x - moveAmount, 0);
			context.translate(offsets.x - world.xOffset, 0);
		}
		// right
		else if (offsets.x < world.width - canvas.width &&
				this.x + this.width/2 - offsets.x > canvas.width * (1-this.MOVEWORLD)) {
			world.xOffset = Math.min(offsets.x + moveAmount, world.width - canvas.width);
			context.translate(offsets.x - world.xOffset, 0);
		}
		// up
		if (offsets.y > 0 && this.y + this.height/2 - offsets.y < canvas.height * this.MOVEWORLD) {
			world.yOffset = Math.max(offsets.y - moveAmount, 0);
			context.translate(0, offsets.y - world.yOffset);
		}
		// down
		else if (offsets.y < world.height - canvas.height &&
				this.y + this.height/2 - offsets.y > canvas.height * (1-this.MOVEWORLD)) {
			world.yOffset = Math.min(offsets.y + moveAmount, world.height - canvas.height);
			context.translate(0, offsets.y - world.yOffset);
		}

		if (App.debugMode) {
			//console.log('Moving ' + e + ': ('+ this.x +', '+ this.y +')');
		}

		return moved;
	},
});
