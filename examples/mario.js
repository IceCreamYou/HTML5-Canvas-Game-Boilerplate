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
  shoot: ['space'],
};

/**
 * An array of image file paths to pre-load.
 */
var preloadables = [
                    'images/nature.jpg',
                    'images/player.png',
                    'images/grass.png',
                    'images/dirt.png',
                    'images/rock.png',
                    'images/centipede.png',
                    ];

/**
 * Layers.
 */
var bkgd, hud;

/**
 * A TileMap of level geometry.
 */
var solid;

/**
 * All our enemies.
 */
var enemies;

/**
 * The Enemy class.
 */
var Enemy = Actor.extend({
  MOVEAMOUNT: 100,
  GRAVITY: false,
  CONTINUOUS_MOVEMENT: true, // These enemies will just move back and forth
  lastReversed: 0,
  init: function() {
    this._super.apply(this, arguments);
    this.lastLooked = keys.right; // Start off moving right
    this.src = new SpriteMap('images/centipede.png', {
      stand: [0, 13, 0, 13],
      left: [0, 0, 0, 12, false, {horizontal: true, vertical: false}],
      right: [0, 0, 0, 12],
    }, {
      frameW: 52,
      frameH: 52,
      interval: 75,
      useTimer: false,
    });
  },
  /**
   * Switch direction.
   */
  reverse: function() {
    // To avoid any edge cases of endless reversal, add a minimum delay.
    var now = Date.now();
    if (now > this.lastReversed + 52) {
      this.lastReversed = now;
      this.lastLooked = App.Utils.anyIn(keys.right, this.lastLooked) ? keys.left : keys.right;
    }
  },
});

/**
 * All our Bullets.
 */
var bullets;

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
   * @param {String[]} direction
   *   An Array of keys representing the Bullet's initial direction.
   * @param {Number} x
   *   The x-coordinate of the top-left corner of the Bullet.
   * @param {Number} y
   *   The y-coordinate of the top-left corner of the Bullet.
   */
  init: function(direction, x, y) {
    this._super(x, y);
    // Store the direction we want the bullet to go. The CONTINUOUS_MOVEMENT
    // setting uses this property to keep going in the specified direction.
    this.lastLooked = direction;
  },
  /**
   * Draw a bullet when there isn't an image associated with it (src === null).
   */
  drawDefault: function(ctx, x, y, w, h) {
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
  if (now > (player._lastFired || 0) + Bullet.fireRate) {
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
  var moved = player.update();
  player.collideSolid(moved, solid);

  enemies.forEach(function(enemy) {
    // Reverse if we get to the edge of a platform.
    if (!enemy.standingOn(solid) &&
        (!enemy.STAY_IN_WORLD || enemy.y != world.height - enemy.height)) {
      enemy.reverse();
    }
    var moved = enemy.update();
    // Reverse if we run into a wall.
    if (enemy.collideSolid(moved, solid)) {
      enemy.reverse();
    }
    // Reverse if we run into the side of the world.
    else if (enemy.STAY_IN_WORLD &&
        (enemy.x < 0 || enemy.x + enemy.width + moved.x > world.width)) {
      enemy.reverse();
    }
    // The player dies if it touches an enemy.
    if (enemy.collides(player)) {
      player.destroy();
      App.gameOver();
    }
  });

  bullets.forEach(function(bullet) {
    bullet.update();
    // Shoot enemies.
    var enemy = bullet.collides(enemies);
    if (enemy) {
      enemies.remove(enemy);
      enemy.destroy();
    }
    // Returning true removes the bullet from the collection.
    // Destroy the bullet if it hits a solid or goes out of the world.
    return enemy || bullet.collides(solid) || !world.isInWorld(bullet, true);
  });
}

/**
 * A magic-named function where all drawing should occur.
 */
function draw() {
  bkgd.draw();
  enemies.draw();
  player.draw();
  bullets.draw();
  hud.draw();
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
  world.resize(canvas.width + 1200, canvas.height + 200);

  // Switch from top-down to side view.
  Actor.prototype.GRAVITY = true;

  // Initialize the player.
  player = new Player(200, 200, 60, 80);
  player.src = new SpriteMap('images/player.png', {
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
  var Grass = Box.extend({ src: 'images/grass.png', });
  var Dirt = Box.extend({ src: 'images/dirt.png', });
  var Rock = Box.extend({ src: 'images/rock.png', });
  var grid =  "         D      GG        \n" +
              "              GGDDGG      \n" +
              "      GG    GGRRRRRRGG  GG";
  solid = new TileMap(grid, {D: Dirt, G: Grass, R: Rock});

  // Add enemies.
  enemies = new Collection();
  enemies.add(new Enemy(840, world.height-52, 52, 52));
  enemies.add(new Enemy(1920, world.height-52-Box.prototype.DEFAULT_HEIGHT, 52, 52));
  if (world.width > 2320) enemies.add(new Enemy(2240, world.height-52, 52, 52));

  // Set up bullets.
  bullets = new Collection();

  // Set up the background layer.
  bkgd = new Layer({src: 'images/nature.jpg'});
  //bkgd.context.drawImage('images/nature.jpg', 0, world.height-Caches.images['images/nature.jpg'].height, world.width, Caches.images['images/nature.jpg'].height);
  solid.draw(bkgd.context);

  // Set up the foreground layer.
  hud = new Layer({
    relative: 'canvas',
  });
  hud.context.font = '30px Arial';
  hud.context.textAlign = 'right';
  hud.context.textBaseline = 'top';
  hud.context.fillStyle = 'black';
  hud.context.strokeStyle = 'rgba(211, 211, 211, 0.5)';
  hud.context.lineWidth = 3;
  hud.context.strokeText('Score: 0', canvas.width - 15, 15);
  hud.context.fillText('Score: 0', canvas.width - 15, 15);
}
