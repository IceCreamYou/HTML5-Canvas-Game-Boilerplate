/**
 * This is where the action happens. Your main application logic should be in
 * this file. Mostly you will just add a few lines to update(), draw(), and
 * setup(); see the comments in those functions for how to get started.
 * 
 * TODO:
 *   - Support sprite animation.
 *   - Stop "sticking" against walls due to the collision checking
 *   - Cross-browser testing.
 */

var bgLayer; // the background layer
var zones = new Collection(); // action zones

$(document).ready(function() {
	bgLayer = new Layer(); // initialize the background layer
	
	setup(); // set up the initial scene
	
	preventDefaultKeyEvents('up down left right'); // reserve the key combinations we'll use
	startAnimating(); // everything is ready, start the animation
});

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
	if ($.hotkeys.areKeysDown('up down left right up+left up+right down+left down+right'))
		movePlayer($.hotkeys.keysDown.join('+'));
	
	// Update action zones
	zones.execute('update');
	
	// TODO: Add your game logic here to update actors in the game.
}

/**
 * A magic-named function where all drawing of the current frame should occur.
 * 
 * It is a good idea to draw complex collections of things onto different
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
	zones.draw();
	bgLayer.draw();
	player.draw();
	
	// TODO: Draw any additional actors and layers here.
}

/**
 * Handle player movement and collision.
 * 
 * We do this here so that the Player class doesn't have to be aware of the
 * Wall collection. If you add additional objects that the player can collide
 * with, make sure to check for collision here.
 */
function movePlayer(direction) {
	var x = player.x, y = player.y;
	player.move(direction);
	
	// TODO: If you add additional objects that the player can collide with,
	// make sure to check for collision here.
	if (walls.overlaps(player)) {
		player.x = x;
		player.y = y;
	}
}

/**
 * Set up the initial scene.
 */
function setup() {
	// TODO: Set up your scene here.
	setupExampleScene();
}

// END OF LIBRARY FUNCTIONS ---------------------------------------------------
// Add most custom code below this line.

/**
 * Set up an example scene.
 */
function setupExampleScene() {
	// Optionally set the world size.
	world.resize(1600, 960);
	
	// Optionally position player at the starting point (defaults to center).
	player.x = 760;
	player.y = 440;
	
	// Create the environment.
	walls = new Collection([
			new Wall(150, 20, 500, 100, false),
			new Wall(150, 220, 500, 100, false)
	]);
	zones = new Collection([new Zone(650, 250, 150, 150, function() {
		this.fillStyle = this.overlaps(player) ? '#EADADA' : '#EAEAEA';
	})]);
	
	// Draw the environment onto the background.
	bgLayer.clear();
	walls.draw(bgLayer.context);
}
