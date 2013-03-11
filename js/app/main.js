// The main logic for your project goes in this file.

/**
 * The Player object; an Actor controlled by user input.
 */
var player;

/**
 * Keys used for various directions.
 */
var keys = {
  up: ['up', 'w'],
  down: ['down', 's'],
  left: ['left', 'a'],
  right: ['right', 'd'],
};

/**
 * An array of image file paths to pre-load.
 */
var preloadables = [];

/**
 * A magic-named function where all updates should occur.
 *
 * @param {Number} delta
 *   The amount of time since the last update. Use this to smooth movement.
 *   This has the same value as the global App.physicsDelta.
 * @param {Number} timeElapsed
 *   The amount of time elapsed while animating. This is useful for time-based
 *   movement and limiting the frequency of events. This has the same value as
 *   the global App.physicsTimeElapsed.
 */
function update(delta, timeElapsed) {
  player.update();
}

/**
 * A magic-named function where all drawing should occur.
 */
function draw() {
  // Draw a background. This is just for illustration so we can see scrolling.
  context.drawBkgdRadialGradient();

	player.draw();
}

/**
 * A magic-named function for one-time setup.
 *
 * @param {Boolean} again
 *   true if the app has been reset and is starting over; false the first time
 *   it is being set up.
 */
function setup(again) {
  // Change the size of the playable area. Do this before placing items!
  world.resize(canvas.width + 200, canvas.height + 200);

  // Switch from side view to top-down.
  Actor.prototype.GRAVITY = false;

  // Initialize the player.
  player = new Player();
}
