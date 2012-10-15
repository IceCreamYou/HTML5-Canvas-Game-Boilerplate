/**
 * @file
 *   The main logic for your project goes in this file.
 */

/**
 * An array of image file paths for images to pre-load.
 *
 * Use this to pre-load all images you know you'll need to use ahead of time
 * unless you are using a more advanced pre-loader like PreloadJS:
 * https://github.com/CreateJS/PreloadJS
 */
var preloadables = [];

/**
 * A layer onto which we'll draw the background of the scene.
 */
var bgLayer;

/**
 * A magic-named function where all updates should take place.
 * 
 * This is the best place to move things, check collision, etc.
 * 
 * @param lastKeysPressed
 *    An Array of the last 5 keys pressed (and released). The last key pressed
 *    was push()ed onto the array, so you can get it with .pop(). This is
 *    mostly useful for turn-based games where you care about key presses and
 *    not about holding down keys. If you need to know which keys are being
 *    held down, use jQuery.hotkeys.areKeysDown().
 * 
 * @see jQuery.hotkeys.areKeysDown()
 * @see jQuery.hotkeys.lastKeyPressed()
 * @see draw()
 */
function update(lastKeysPressed) {
	// Use the arrow keys to move the player.
	if ($.hotkeys.areKeysDown('up down left right up+left up+right down+left down+right')) {
		player.move($.hotkeys.keysDown.join('+'));
	}
}

/**
 * A magic-named function where all drawing of the current frame should occur.
 * 
 * To maximize performance, draw complex collections of things onto different
 * Layers that do not need to be updated every frame, and then simply draw the
 * layer itself onto the main graphics context in this function in order to
 * minimize calculations.
 * 
 * Updates should take place in update(), not draw(). The canvas is
 * automatically cleared before drawing.
 * 
 * @see update()
 */
function draw() {
	bgLayer.draw(); // Draw the background layer onto the canvas

	player.draw(); // Draw the player onto the foreground
}

/**
 * Start doing things when the page is finished loading.
 */
$(document).ready(function setup() {
  // Prevent default behavior of these keys because we'll be using them and
  // they can cause other page behavior (like scrolling).
  preventDefaultKeyEvents('up down left right');

  // Change the size of the playable area.
  // Do this before placing items in the world.
  world.resize(world.width + 200, world.height + 200);

  // Initialize the background layer.
  bgLayer = new Layer({
    relative: 'view',
  });

  // Pre-load images and start displaying things when we're done.
	preloadImages(preloadables, {
		finishCallback: function() {
		  // Paint the background.
		  bgLayer.context.drawBkgdRadialGradient();

		  player.x -= Math.floor(player.width/2);
		  player.y -= Math.floor(player.height/2);

		  // Everything is ready. Start the animation!
		  startAnimating();
		},
	});
});

/**
 * React when the world is resized.
 *
 * Try to keep the player at the same place in the viewport so that the player
 * doesn't disappear off the screen.
 *
 * This may not be desirable behavior for many situations where it makes more
 * sense to re-center the viewport around the player's location instead.
 */
$(document).on('resizeWorld', function(e, delta) {
  player.x += delta.x;
  player.y += delta.y;
});
