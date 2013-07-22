// There is a tutorial on how to build this example game at
// http://icecreamyou.github.io/HTML5-Canvas-Game-Boilerplate/docs/#!/guide/walkthrough

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
                    'images/sky.png',
                    'images/hills.png',
                    'images/hills2.png',
                    'images/player.png',
                    'images/grass2.png',
                    'images/grass2body.png',
                    'images/grass2corner.png',
                    'images/centipede.png',
                    'images/castle.png',
                    'images/coin.png',
                    ];

/**
 * Layers.
 */
var bkgd, hills, hills2, geo, hud;

/**
 * Win location.
 */
var castle;

/**
 * A TileMap of level geometry.
 */
var solid;

/**
 * All our coins.
 */
var coins;

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
    if (now > this.lastReversed + this.width) {
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
  player.collideSolid(solid);
  // Parallax
  hills.scroll(player.x - player.lastX, 0);
  hills2.scroll(player.x - player.lastX, 0);

  enemies.forEach(function(enemy) {
    // Reverse if we get to the edge of a platform.
    if (!enemy.standingOn(solid) &&
        (!enemy.STAY_IN_WORLD || enemy.y != world.height - enemy.height)) {
      enemy.reverse();
    }
    enemy.update();
    // Reverse if we run into a wall.
    if (enemy.collideSolid(solid).x) {
      enemy.reverse();
    }
    // Reverse if we run into the side of the world.
    else if (enemy.STAY_IN_WORLD &&
        (enemy.x < 0 || enemy.x + enemy.width >= world.width)) {
      enemy.reverse();
    }
    // The player dies if it touches an enemy.
    if (enemy.collides(player)) {
      App.gameOver();
    }
  });

  bullets.forEach(function(bullet) {
    bullet.update();
    // Shoot enemies.
    var enemy = bullet.collides(enemies);
    if (enemy) {
      player.increaseScore(10);
      enemies.remove(enemy);
      enemy.destroy();
    }
    // Returning true removes the bullet from the Collection and destroy()s it.
    // This destroys the bullet if it hits a solid or goes out of the world.
    return enemy || bullet.collides(solid) || !world.isInWorld(bullet, true);
  });

  coins.forEach(function(coin) {
    if (player.overlaps(coin)) {
      player.increaseScore(1);
      return true;
    }
  });

  if (castle.overlaps(player)) {
    App.gameOver("YOU WIN!");
  }
}

/**
 * A magic-named function where all drawing should occur.
 */
function draw() {
  bkgd.draw();
  hills.draw();
  hills2.draw();
  geo.draw();
  coins.draw();
  enemies.draw();
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
  // The map layout
  var grid =  "      F             F                                           FFF    C              \n" +
              "      GGGGF         F     GGG              GCBBBBBBBDF     G          CB              \n" +
              "          G    G        GCBBBDG E         CBBBB F BBB      B      E  CBB              \n" +
              "            E  BD     GCBBBBBBBDG     GG       E         G F GGGGGGGCBBBDGGGGGGGGGGGGG";
  // Change the size of the playable area. Do this before placing items!
  world.resize(Math.max(canvas.width, grid.indexOf("\n")*80), Math.max(canvas.height + 200, 520));

  // Switch from top-down to side view.
  Actor.prototype.GRAVITY = true;

  // Initialize the player.
  player = new Player(200, 200, 60, 80);
  player.MOVEWORLD = 0.33;
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

  // Define terrain types and initialize the level layout.
  solid = new TileMap(grid, {
    B: 'images/grass2body.png',
    C: 'images/grass2corner.png',
    D: new Sprite('images/grass2corner.png', {flipped: {horizontal: true}}),
    E: Enemy,
    F: 'images/coin.png',
    G: 'images/grass2.png',
  });

  // Add enemies and coins.
  // We used the TileMap to initialize them but we want to track them separately
  coins = new Collection();
  enemies = new Collection();
  solid.forEach(function(o, i, j) {
    if (o instanceof Enemy) {
      solid.clearCell(i, j);
      enemies.add(o);
    }
    else if (o.src == 'images/coin.png') {
      solid.clearCell(i, j);
      coins.add(o);
    }
  });

  // Set up bullets.
  bullets = new Collection();

  // Set up the background layers.
  bkgd = new Layer({src: 'images/sky.png'});
  geo = new Layer();
  solid.draw(geo.context);
  var p = 0.018, w = world.width+player.x*p+(world.width-player.x)*p;
  hills = new Layer({
    src: 'images/hills2.png',
    x: (-player.x*p)|0,
    y: (world.height-world.height*(w/world.width)/2)|0,
    width: w,
    height: (world.height*(w/world.width)/2)|0,
    parallax: p,
  });
  p = 0.1;
  hills2 = new Layer({
    x: (-player.x*p)|0,
    y: world.height-480,
    width: world.width+player.x*p+(world.width-player.x)*p,
    height: 480,
    parallax: p,
  });
  // Magnify the background pipes
  var ca = document.createElement('canvas');
  ca.width = 1920;
  ca.height = 480;
  co = ca.getContext('2d');
  co.drawImage('images/hills.png', 0, 0, 960, 480); // first half
  co.save();
  co.translate(ca.width, 0);
  co.scale(-1, 1);
  co.drawImage('images/hills.png', 0, 0, 960, 480); // flipped and translated
  co.restore();
  hills2.context.drawPattern(ca, 0, 0, hills2.width, hills2.height, 'repeat-x');

  // Set up the castle.
  castle = new Box(grid.indexOf("\n")*80-320, world.height-320, 240, 240);
  castle.src = 'images/castle.png';
  castle.draw(geo.context);

  // Set up the Heads-Up Display layer.
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

  // Track the score.
  var score = 0;
  player.increaseScore = function(amount) {
    score += amount;
    hud.context.clear();
    hud.context.strokeText('Score: ' + score, canvas.width - 15, 15);
    hud.context.fillText('Score: ' + score, canvas.width - 15, 15);
  };

  // Provide instructions the first time the game is run.
  if (first) {
    var a = $('<div style="background-color: rgba(255, 255, 255, 0.9); border: 2px solid #999999; border-radius: 42px; display: inline-block; font-size: 24px; height: 34px; left: 50%; margin: -69px 0 0 -343px; overflow-x: auto; overflow-y: hidden; padding: 50px; position: absolute; text-align: center; top: 50%; width: 542px; z-index: 10;">Use the arrow keys to move and &lt;space&gt; to shoot.</div>');
    $canvas.after(a);
    a.click(function(e) {
      if (e.which == 1) { // Left click only
        a.remove();
      }
    });
    a.animate({opacity: 1}, 2500).fadeOut(1000);
  }
}
