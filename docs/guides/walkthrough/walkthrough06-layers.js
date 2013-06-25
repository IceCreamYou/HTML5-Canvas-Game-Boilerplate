// The main logic for your project goes in this file.

/**
 * The {@link Player} object; an {@link Actor} controlled by user input.
 */
var player;

/**
 * Keys used for various directions.
 *
 * The property names of this object indicate actions, and the values are lists
 * of keyboard keys or key combinations that will invoke these actions. Valid
 * keys include anything that {@link jQuery.hotkeys} accepts. The up, down,
 * left, and right properties are required if the `keys` variable exists; if
 * you don't want to use them, just set them to an empty array. {@link Actor}s
 * can have their own {@link Actor#keys keys} which will override the global
 * set.
 */
var keys = {
  up: ['up', 'w'],
  down: ['down', 's'],
  left: ['left', 'a'],
  right: ['right', 'd'],
  shoot: ['space'],
};

/**
 * An array of image file paths to pre-load.
 */
var preloadables = [
                    '../../examples/images/grass2.png',
                    '../../examples/images/player.png',
                    '../../examples/images/sky.png',
                    ];

/**
 * All our Bullets.
 */
var bullets = new Collection();

/**
 * The Bullet class.
 */
var Bullet = Actor.extend({
  // Override Actor default properties.
  MOVEAMOUNT: 800, // Bullet velocity in pixels per second
  GRAVITY: false, // Just keep going rather than falling down
  CONTINUOUS_MOVEMENT: true, // Keep going in the last specified direction
  STAY_IN_WORLD: false, // Let our bullets leave the world (we'll destroy them when they do)
  DEFAULT_WIDTH: 10,
  DEFAULT_HEIGHT: 10,
  /**
   * Initialize a Bullet.
   *
   * @param direction
   *   An array of keys representing the Bullet's initial direction.
   * @param x
   *   The x-coordinate of the top-left corner of the Bullet.
   * @param y
   *   The y-coordinate of the top-left corner of the Bullet.
   */
  init: function(direction, x, y) {
    // Invoke the parent's init() function, Actor.prototype.init().
    this._super(x, y);
    // Store the direction we want the bullet to go. The CONTINUOUS_MOVEMENT
    // setting uses this property to keep going in the specified direction.
    this.lastLooked = direction;
  },
  /**
   * Override drawDefault() to draw a bullet when there isn't an image associated with it (src === null).
   */
  drawDefault: function(ctx, x, y, w, h) {
    // This draws a circle onto the graphics context (i.e. the canvas).
    // Parameters are x-coordinate of center, y-coordinate of center, radius, fill color, border color
    ctx.circle(x + w/2, y + w/2, (w + h) / 4, 'orange', 'black');
  },
});
/**
 * The minimum number of milliseconds that must pass between firing bullets.
 *
 * Set to 0 (zero) for no limit.
 */
Bullet.fireRate = 250;

/**
 * Bind to the "shoot" key(s) and create a new bullet.
 *
 * Change keyup to keydown to be able to hold down the shoot key.
 */
jQuery(document).keyup(keys.shoot.join(' '), function() {
  var now = Date.now();
  // Throttle bullet firing.
  if (now > (player._lastFired || 0) + Bullet.fireRate && isAnimating()) {
    player._lastFired = now;
    // Shoot in the direction the player looked last (default to right).
    var direction = player.lastLooked.length ? player.lastLooked : keys.right;
    // Center on the player.
    var x = player.x + player.width * 0.5,
        y = player.y + player.height * 0.5;
    // Add the new bullet to our Collection.
    bullets.add(new Bullet(direction, x, y));
  }
});

/**
 * A magic-named function where all updates should occur.
 */
function update() {
  // move
  player.update();
  // enforce collision
  player.collideSolid(solid);

  // The forEach() method runs the specified function on every item in the
  // Collection. forEach() can also take a string, which is interpreted as a
  // method name; for example, bullets.forEach('update') would execute each
  // bullet's "update" method.
  // TileMaps have a forEach() method as well that works the same way.
  bullets.forEach(function(bullet) {
    bullet.update();
    // Returning true removes the bullet from the collection.
    // Destroy the bullet if it hits a solid or goes out of the world.
    return bullet.collides(solid) || !world.isInWorld(bullet, true);
  });
}

/**
 * A magic-named function where all drawing should occur.
 */
function draw() {
  bkgd.draw();
  solid.draw();
	player.draw();
  bullets.draw();
  hud.draw();
}

/**
 * A magic-named function for one-time setup.
 *
 * @param {Boolean} first
 *   true if the app is being set up for the first time; false if the app has
 *   been reset and is starting over.
 */
function setup(first) {
  // world.resize() changes the size of the world, in pixels; defaults to the canvas size
  world.resize(canvas.width + 1200, canvas.height + 200);

  // the GRAVITY property enables gravity
  Actor.prototype.GRAVITY = true;

  // the arguments to create a new player specify its pixel coordinates
  // upper-left is (0, 0)
  player = new Player(200, 200, 60, 80);
  player.src = new SpriteMap('../../examples/images/player.png', {
    stand: [0, 5, 0, 5],
    fall: [0, 5, 1, 5, true],
    left: [0, 0, 0, 4],
    right: [1, 0, 1, 4],
    lookLeft: [0, 2, 0, 2],
    lookRight: [1, 2, 1, 2],
    jumpLeft: [0, 4, 0, 4],
    jumpRight: [1, 4, 1, 4],
  }, {
    frameW: 30,
    frameH: 40,
    interval: 75,
    useTimer: false,
  });

  // Add terrain.
  var grid =  "         B      BB        \n" +
              "              BBBBBB      \n" +
              "      BB    BBBBBBBBBB  BB";
  solid = new TileMap(grid, {B: '../../examples/images/grass2.png'});

  // Set up the static background layer.
  // By default, layers scroll with the world.
  bkgd = new Layer({src: '../../examples/images/sky.png'});
  // Layers have a "context" property that can be drawn onto.
  solid.draw(bkgd.context);

  // Set up the Heads-Up Display layer.
  // This layer will stay in place even while the world scrolls.
  hud = new Layer({relative: 'canvas'});
  hud.context.font = '30px Arial';
  hud.context.textAlign = 'right';
  hud.context.textBaseline = 'top';
  hud.context.fillStyle = 'black';
  hud.context.strokeStyle = 'rgba(211, 211, 211, 0.5)';
  hud.context.lineWidth = 3;
  hud.context.strokeText('Score: 0', canvas.width - 15, 15);
  hud.context.fillText('Score: 0', canvas.width - 15, 15);
}
