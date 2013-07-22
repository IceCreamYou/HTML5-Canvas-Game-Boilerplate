/**
 * Keywords for Actor#update() that move the actor in the specified direction.
 */
var keys = {
  up: ['up'],
  down: ['down'],
  left: ['left'],
  right: ['right'],
};

/**
 * An array of image file paths to pre-load.
 */
var preloadables = [
                    '../../examples/images/grass2body.png',
                    '../../examples/images/bluebase.png',
                    '../../examples/images/redbase.png',
                    ];

// Globals initialized in setup()
var Teams, myTeam, soldiers, bullets, bkgd;

// Seconds between spawning a soldier for each base
var SPAWN_DELAY = 5;
// Seconds it takes between shots for each soldier
var RELOAD_DELAY = 1;
// How close (in pixels) a soldier must be to another soldier before shooting
var SHOOT_NEAR_THRESHOLD = 150;
// Soldier max health
var SOLDIER_MAX_HEALTH = 100;
// Bullet damage amount
var PROJECTILE_DAMAGE = 20;
// Soldier move speed
var SOLDIER_MOVE_SPEED = 300;
// Projectile move speed
var PROJECTILE_MOVE_SPEED = 450;
// Projectile color
var PROJECTILE_COLOR = 'lightGray';
// Sizes
var BASE_SIZE = 80;
var SOLDIER_SIZE = 20;
var PROJECTILE_SIZE = 5;

/**
 * A magic-named function where all updates should occur.
 */
function update() {
  // Attempt to spawn a new soldier.
  Teams.forEach(function(team) {
    team.base.spawn();
  });

  soldiers.forEach(function(soldier) {
    // Move
    soldier.update(soldier.chooseBestDirection());
    // Get hit by projectiles
    bullets.forEach(function(bullet) {
      if (bullet.team != soldier.team && bullet.overlaps(soldier)) {
        soldier.damage(bullet.DAMAGE);
        return true;
      }
    });
    return soldier.health <= 0;
  });

  for (var i = 0, l = soldiers.length, s1, s2; i < l; i++) {
    for (var j = i+1; j < l; j++) {
      s1 = soldiers[i];
      s2 = soldiers[j];
      // Collide with other soldiers
      if (s1.overlaps(s2)) {
        s1.collideSolid(s2);
      }
      // Shoot enemy soldiers
      if (s1.team != s2.team) {
        if (s1.near(s2)) {
          s1.shoot(s2);
        }
        if (s2.near(s1)) {
          s2.shoot(s1);
        }
      }
    }
  }

  // Expire bullets
  bullets.forEach(function(bullet) {
    bullet.update();
    return bullet.movedTooFar() || bullet.target.health <= 0;
  });
}

/**
 * A magic-named function where all drawing should occur.
 */
function draw() {
  bkgd.draw();
  Teams.forEach(function(team) {
    team.base.draw();
  });
  soldiers.draw();
  bullets.draw();
}

/**
 * A magic-named function for one-time setup.
 *
 * @param {Boolean} first
 *   true if the app is being set up for the first time; false if the app has
 *   been reset and is starting over.
 */
function setup(first) {
  if (first) {
    // The world must be resized before anything is placed in it.
    world.resize(3200, 2400);
  }

  // Set up the teams
  Teams = new Collection();
  Teams.add(myTeam = new Team(200, 200, {
    color: 'blue',
    baseImage: '../../examples/images/bluebase.png',
    soldierColor: 'lightBlue',
    soldierHoverColor: '#82D8D4',
    soldierSelectedColor: '#47AD98',
  }));
  Teams.add(new Team(600, 500, {
    color: 'red',
    baseImage: '../../examples/images/redbase.png',
    soldierColor: '#F48D55',
    soldierHoverColor: '#F4AC30',
  }));

  // Focus on the player's base
  world.centerViewportAround(myTeam.base.x, myTeam.base.y);

  // Track all soldiers for easier processing
  soldiers = new Collection();
  // Track all projectiles
  bullets = new Collection();

  // Don't bind events multiple times if we've reset
  if (!first) return;

  // Allow the mouse to scroll the viewport
  Mouse.Scroll.enable();
  Mouse.Scroll.setThreshold(0.3);
  Mouse.Scroll.setScrollDistance(800);

  // Set up the background layer and tile grass over it
  bkgd = new Layer();
  bkgd.context.drawPattern('../../examples/images/grass2body.png', 0, 0, world.width, world.height);

  // Enable zooming, and display the zoom level indicator
  Mouse.Zoom.enable(true);
}

/**
 * A team of soldiers.
 */
var Team = Class.extend({
  base: null,
  color: 'blue',
  soldierColor: 'lightBlue',
  soldierHoverColor: '#82D8D4',
  soldierSelectedColor: '#47AD98',
  soldiers: null,
  init: function(x, y, options) {
    if (typeof options === 'undefined') options = {};
    this.color = options.color || this.color;
    this.soldierColor = options.soldierColor || this.soldierColor;
    this.soldierHoverColor = options.soldierHoverColor || this.soldierHoverColor;
    this.soldierSelectedColor = options.soldierSelectedColor || this.soldierSelectedColor;
    this.base = new Base(this, x, y);
    this.base.src = options.baseImage || '';
    this.soldiers = new Collection();
  },
});

/**
 * A team's base that spawns soldiers.
 */
var Base = Box.extend({
  DEFAULT_WIDTH: BASE_SIZE,
  DEFAULT_HEIGHT: BASE_SIZE,
  team: null,
  canSpawn: true,
  lastSpawned: 0,
  delayBetweenSpawns: SPAWN_DELAY,
  dummySoldier: null,
  spawnLocations: null,
  progressBarColor: 'gray',
  progressBarBorderColor: '#333333',
  init: function(team, x, y) {
    this._super(x, y);
    this.team = team;
    this.fillStyle = team.color;
    this.lastSpawned = App.physicsTimeElapsed - this.delayBetweenSpawns * 0.5;
    this.dummySoldier = new Soldier(team, x, y);
    this.spawnLocations = [
                           -this.dummySoldier.width*1.25,
                           this.width*0.5,
                           this.width + this.dummySoldier.width*1.25
                           ];
  },
  /**
   * Draw a base, including its progress indicator.
   *
   * Mostly copied from Box#draw().
   */
  draw: function(ctx, smooth) {
    ctx = ctx || context;
    if (typeof smooth === 'undefined') {
      smooth = true;
    }
    ctx.save();
    var x = this.x, y = this.y, w = this.width, h = this.height;
    if (smooth) {
      x = Math.round(x);
      y = Math.round(y);
    }
    if (this.radians) {
      ctx.translate(x+w/2, y+h/2);
      ctx.rotate(this.radians);
      ctx.translate(-w/2-x, -h/2-y);
    }
    if (this.src) {
      ctx.drawImage(this.src, x, y, w, h);
    }
    else {
      this.drawDefault(ctx, x, y, w, h);
    }
    var percentComplete = this.canSpawn ?
        (App.physicsTimeElapsed - this.lastSpawned) / this.delayBetweenSpawns :
          1;
      drawProgressBar(ctx, x+w*0.1, y+h*0.9, w*0.8, h*0.075, percentComplete,
          this.progressBarColor, 'transparent', this.progressBarBorderColor);
    ctx.restore();
  },
  /**
   * Try to spawn a new soldier.
   *
   * @param {Boolean} [force=false]
   *   If true, ignore the time delay between spawns and try to create a new
   *   soldier immediately.
   */
  spawn: function(force) {
    // Wait for a certain amount of time between spawns.
    if (!force && this.lastSpawned + this.delayBetweenSpawns > App.physicsTimeElapsed) {
      return;
    }
    // Use a dummy to avoid creating and then disposing of a bunch of soldiers,
    // since we have to have an object to test collision but if there is
    // nowhere to put the soldier we can't add it to the world.
    var s = this.dummySoldier;
    s.team = this.team;
    // We can place soldiers in a grid around the base.
    for (var i = 0; i < this.spawnLocations.length; i++) {
      for (var j = 0; j < this.spawnLocations.length; j++) {
        // Don't place a soldier on the base itself.
        if (i === 1 && j === 1) continue;
        s.x = this.x + this.spawnLocations[i];
        s.y = this.y + this.spawnLocations[j];
        // If we have a spawn location open, add the soldier to the world.
        if (!s.collides(this.team.soldiers)) {
          soldiers.add(s);
          this.team.soldiers.add(s);
          this.dummySoldier = new Soldier(this.team, this.x, this.y);
          this.lastSpawned = App.physicsTimeElapsed;
          this.canSpawn = true;
          // Spawn the soldier in the base, then move it outside.
          s.moveTo(s.x, s.y);
          s.x = this.x + this.width * 0.5 - s.width * 0.5;
          s.y = this.y + this.height * 0.5 - s.height * 0.5;
          return;
        }
      }
    }
    // Track whether we can update the progress indicator.
    this.canSpawn = false;
  },
});

/**
 * Actors belonging to a Team that fight other Soldiers.
 */
var Soldier = Actor.extend({
  MOVEAMOUNT: SOLDIER_MOVE_SPEED,
  DEFAULT_WIDTH: SOLDIER_SIZE,
  DEFAULT_HEIGHT: SOLDIER_SIZE,
  NEAR_THRESHOLD: SHOOT_NEAR_THRESHOLD,
  SHOOT_DELAY: RELOAD_DELAY,
  team: null,
  selected: false,
  moveToX: 0,
  moveToY: 0,
  health: SOLDIER_MAX_HEALTH,
  lastShot: 0,
  init: function(team, x, y) {
    this._super.call(this, x, y);
    this.team = team;
    this.lastShot = App.physicsTimeElapsed;
  },
  /**
   * Draw a soldier with colors and a health indicator.
   */
  drawDefault: function(ctx, x, y, w, h) {
    // Draw the soldier
    this.fillStyle = this.selected ? this.team.soldierSelectedColor :
      this.team.soldierColor;
    this._super.call(this, ctx, x, y, w, h);

    // Draw the health indicator
    drawProgressBar(ctx, x, y - 10, w, h*0.2, this.health/SOLDIER_MAX_HEALTH,
        '#00DA00', '#EA3311', 'black');
  },
  toggleSelected: function() {
    this.selected = !this.selected;
    // Stop moving
    this.moveToX = this.xC();
    this.moveToY = this.yC();
  },
  moveTo: function(x, y) {
    this.moveToX = x;
    this.moveToY = y;
  },
  /**
   * Choose the best direction in order to move towards the target.
   *
   * Since this is just an example, the algorithm is simple: move directly
   * towards the target. A more sophisticated algorithm should avoid obstacles.
   */
  chooseBestDirection: function() {
    var dir = [];
    if (this.xC() < this.moveToX - 1) dir.push(keys.right[0]);
    else if (this.xC() > this.moveToX + 1) dir.push(keys.left[0]);
    if (this.yC() < this.moveToY - 1) dir.push(keys.down[0]);
    else if (this.yC() > this.moveToY + 1) dir.push(keys.up[0]);
    return dir;
  },
  /**
   * Cause damage to the soldier's health.
   */
  damage: function(dmg) {
    this.health -= dmg;
  },
  /**
   * Whether this soldier is close enough to another soldier to shoot.
   */
  near: function(other) {
    return (this.x-other.x)*(this.x-other.x) +
           (this.y-other.y)*(this.y-other.y) <
           this.NEAR_THRESHOLD*this.NEAR_THRESHOLD;
  },
  /**
   * Shoot at a target soldier.
   */
  shoot: function(target) {
    if (App.physicsTimeElapsed > this.lastShot + this.SHOOT_DELAY) {
      this.lastShot = App.physicsTimeElapsed;
      bullets.add(new Projectile(
          this.x+this.width*0.5,
          this.y+this.width*0.5,
          this.team,
          target
      ));
    }
  },
  destroy: function() {
    this._super.apply(this, arguments);
    this.team.soldiers.remove(this);
  },
});

/**
 * A bullet.
 */
var Projectile = Actor.extend({
  DEFAULT_WIDTH: PROJECTILE_SIZE,
  DEFAULT_HEIGHT: PROJECTILE_SIZE,
  STAY_IN_WORLD: false,
  MOVEAMOUNT: PROJECTILE_MOVE_SPEED,
  MAX_DISTANCE: SHOOT_NEAR_THRESHOLD + PROJECTILE_SIZE, // Distance bullets can fly before being destroyed
  DAMAGE: PROJECTILE_DAMAGE,
  init: function(x, y, team, target) {
    this._super.call(this, x, y);
    this.fillStyle = PROJECTILE_COLOR;
    this.x -= this.DEFAULT_WIDTH*0.5;
    this.y -= this.DEFAULT_HEIGHT*0.5;
    this.startX = this.x;
    this.startY = this.y;
    this.team = team;
    this.target = target;
    // Go directly towards the target.
    var xDist = this.target.x+this.target.width*0.5 - this.x+this.width*0.5,
        yDist = this.target.y+this.target.height*0.5 - this.y+this.height*0.5,
        ratio = Math.abs(xDist)/(Math.abs(xDist)+Math.abs(yDist));
    this.xVelocity = this.MOVEAMOUNT*xDist.sign()*ratio;
    this.yVelocity = this.MOVEAMOUNT*yDist.sign()*(1-ratio);
  },
  drawDefault: function(ctx, x, y, w, h) {
    ctx.circle(x + w/2, y + h/2, (w+h)/4);
  },
  movedTooFar: function() {
    return (this.startX-this.x)*(this.startX-this.x) +
           (this.startY-this.y)*(this.startY-this.y) >
           this.MAX_DISTANCE*this.MAX_DISTANCE;
  },
  move: function() {
    this.x += this.xVelocity*App.physicsDelta;
    this.y += this.yVelocity*App.physicsDelta;
  },
  // Don't slow down.
  dampVelocity: function() {},
});

/**
 * Draw a progress bar.
 *
 * @param {CanvasRenderingContext2D} ctx
 *   A canvas graphics context onto which this progress bar should be drawn.
 * @param {Number} x
 *   The x-coordinate of the upper-left corner of the progress bar.
 * @param {Number} y
 *   The y-coordinate of the upper-left corner of the progress bar.
 * @param {Number} w
 *   The width of the progress bar.
 * @param {Number} h
 *   The height of the progress bar.
 * @param {Number} pct
 *   The fractional percent that the progress bar is complete.
 * @param {String} doneColor
 *   The CSS color of the completed portion of the progress bar.
 * @param {String} [remainingColor='transparent']
 *   The CSS color of the remaining portion of the progress bar.
 * @param {String} [borderColor='black']
 *   The CSS color of the border of the progress bar.
 */
function drawProgressBar(ctx, x, y, w, h, pct, doneColor, remainingColor, borderColor) {
  ctx.lineWidth = 1;
  ctx.fillStyle = doneColor;
  ctx.fillRect(x, y, w*pct, h);
  ctx.fillStyle = remainingColor || 'transparent';
  ctx.fillRect(x+w*pct, y, w*(1-pct), h);
  ctx.strokeStyle = borderColor || 'black';
  ctx.strokeRect(x, y, w, h);
}
