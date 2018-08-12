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

// Constants
var UNIT = 30, // Size of each square in the map
    WIGGLE = 1, // Room between Pacman and the wall
    PAUSE = 1500, // Pause between levels and after death
    INITIAL_LIVES = 3,
    DOT_SCORE = 10, // Points for eating a dot
    POWERUP_SCORE = 50, // Points for eating a powerup
    LEVEL_SCORE = 0, // Points for eating all dots in a level
    GHOST_SCORE = 200, // Points for eating the first scared ghost
    GHOST_MULTIPLIER = 2, // Increase GHOST_SCORE for each additional ghost
    GHOST_UNSCARED_WARNING = 2000, // Milliseconds of warning before becoming un-scared
    GHOST_REGEN_TIME = 3000, // Time ghosts spend regenerating before leaving their home
    POWERUP_LENGTH = function() { // Multiplier for Power Dot duration
      return Math.max(1, 5 - (level-1)%5)*(1-0.15*Math.min(5, (level/5)|0));
    };

/**
 * A magic-named function where all updates should occur.
 *
 * @param {Number} delta
 *   The amount of time since the last update. Use this to smooth movement.
 *   This has the same value as the global `App.physicsDelta`.
 * @param {Number} timeElapsed
 *   The amount of time elapsed while animating. This is useful for time-based
 *   movement and limiting the frequency of events. This has the same value as
 *   the global `App.physicsTimeElapsed`.
 */
function update(delta, timeElapsed) {
  // Move the player, collide with the map, and eat dots and powerups.
  player.update();
  player.collideSolid(map);
  dots.forEach(function(dot) {
    if (player.overlaps(dot)) {
      player.increaseScore(DOT_SCORE);
      return true;
    }
  });
  powerups.forEach(function(dot) {
    if (player.overlaps(dot)) {
      player.lastPoweredUp = Date.now();
      player.increaseScore(POWERUP_SCORE);
      return true;
    }
  });
  // In the interest of brevity, this means points can continue to increase if
  // another powerup is eaten before the current powerup runs out.
  if (!player.isPoweredUp()) {
    ghostsEaten = 0;
  }

  // If all the dots and powerups are eaten, go to the next level.
  if (!dots.length && !powerups.length) {
    player.increaseScore(LEVEL_SCORE);
    stopAnimating();
    player.destroy();
    setTimeout(App.reset, PAUSE); // Reset everything (this calls setup())
    level++;
  }

  ghosts.forEach(function(ghost) {
    // Move the ghosts and collide with the map.
    ghost.update();
    ghost.collideSolid(map);
    if (player.overlaps(ghost)) {
      // Eat and then reset scared ghosts.
      if (player.isPoweredUp()) {
        setTimeout(function() {
          ghostNum = 1;
          var startCoords = map.getPixelCoords(9, 9);
          ghosts.add(new Ghost(startCoords.x+WIGGLE, startCoords.y+WIGGLE));
        }, PAUSE);
        player.increaseScore(GHOST_SCORE*Math.pow(GHOST_MULTIPLIER, ghostsEaten++));
        return true;
      }
      // Lose a life or the game.
      else if (!player.lifeTaken) {
        player.lifeTaken = true;
        if (player.hasLivesLeft()) {
          player.takeLife();
          player.destroy();
          stopAnimating();
          setTimeout(App.reset, PAUSE); // Reset everything (this calls setup())
        }
        else {
          player.takeLife();
          App.gameOver();
        }
      }
    }
  });
}

/**
 * A magic-named function where all drawing should occur.
 */
function draw() {
  hud.draw();
  map.draw();
  dots.draw();
  powerups.draw();
  ghosts.draw();
	player.draw();
}

/**
 * A magic-named function for one-time setup.
 *
 * @param {Boolean} first
 *   true if the app is being set up for the first time; false if the app has
 *   been reset and is starting over.
 */
function setup(first) {
  // Scale the canvas proportionately to fill the window as much as possible.
  UNIT = Math.max(30, (jQuery(window).innerHeight()/22)|0);
  // 19 and 22 are determined by the layout in setupMap().
  canvas.width = UNIT * 19;
  canvas.height = UNIT * 22;
  world.width = canvas.width;
  world.height = canvas.height;

  // Initialize the map (walls and dots/powerups).
  // Make sure not to reset dots/powerups when losing a life.
  if (first || (!dots.length && !powerups.length) || lives === 0) {
    setupMap();
  }

  // Reset lives, score, and level.
  if (first || lives === 0) {
    lives = INITIAL_LIVES;
    score = 0;
    level = 1;
  }
  // Initialize the player.
  player = new Pacman();

  // Initialize ghosts.
  ghostNum = 1; // Increments by 1 when each ghost is initalized
  ghosts = new Collection();
  ghosts.add(new Ghost()); // Starts above the ghost regeneration area
  var startCoords = map.getPixelCoords(8, 9); // left
  ghosts.add(new Ghost(startCoords.x+WIGGLE, startCoords.y+WIGGLE));
  startCoords = map.getPixelCoords(9, 9); // middle
  ghosts.add(new Ghost(startCoords.x+WIGGLE, startCoords.y+WIGGLE));
  startCoords = map.getPixelCoords(10, 9); // right
  ghosts.add(new Ghost(startCoords.x+WIGGLE, startCoords.y+WIGGLE));

  if (first) {
    // Set up the Heads-Up Display layer.
    hud = new Layer({
      relative: 'canvas',
    });
    hud.context.font = '24px Arial';
    hud.context.textAlign = 'right';
    hud.context.textBaseline = 'top';
    hud.context.fillStyle = 'black';
    hud.context.strokeStyle = 'rgba(211, 211, 211, 0.5)';
    hud.context.lineWidth = 3;

    // Add the countdown element.
    jQuery('#countdown').remove();
    jQuery('body').append('<div id="countdown" style="background-color: rgba(255, 255, 255, 0); font-size: ' + (UNIT * 2) + 'px; height: ' + (UNIT * 3) + 'px; left: 0; overflow: hidden; pointer-events: none; text-align: center; z-index: 10;"><span class="countdown" style="background-color: rgba(240, 240, 240, 0.9); border: 1px solid black; box-shadow: 0 0 10px 1px white; display: inline-block; height: ' + ((UNIT - 2) * 3) + 'px; padding: 2px 20px; width: ' + (UNIT * 5 - 42) + 'px;">0</span><span class="instructions" style=" display: block; font-size: ' + (UNIT/3) + 'px; margin-top: -' + (UNIT*0.6) + 'px;">Arrow keys or WASD to move</span></div>');
    // I don't know why, but in combination with $(window).load() below, this
    // fixes $canvas.offset().left being wrong on windows with low height.
    setTimeout(function() {
      var coords = map.getPixelCoords(7, 8);
      // Position the countdown over the ghost regeneration area.
      App.Utils.positionOverCanvas(jQuery('#countdown'), coords.x, coords.y);
    }, 0);
  }
  // Draw the score and lives. We only have to repaint when these change.
  drawHUD();

  // Start the game after the countdown.
  draw();
  countdown(startAnimating);
  return false;
}
// I don't know why, but in combination with the setTimeout above, this fixes
// $canvas.offset().left being wrong on windows with low height.
jQuery(window).load(function() {
  setTimeout(function() {
    var coords = map.getPixelCoords(7, 8);
    App.Utils.positionOverCanvas(jQuery('#countdown'), coords.x, coords.y);
  }, 0);
});

// 3... 2... 1... Go!
function countdown(callback) {
  var $countdown = jQuery('#countdown .countdown').text('3');
  var $container = jQuery('#countdown').css('opacity', '1');
  setTimeout(function() {
    $countdown.text('Go!');
    $container.animate({opacity: 0}, 1000);
    if (typeof callback == 'function') {
      callback();
    }
  }, 3000);
  setTimeout(function() {
    $countdown.text('1');
  }, 2000);
  setTimeout(function() {
    $countdown.text('2');
  }, 1000);
}

// Draw the score and lives.
function drawHUD() {
  hud.context.clear();
  hud.context.drawCheckered(UNIT, 0, 0, world.width, world.height, '#F3F3F3', '#EEEEEE');
  hud.context.fillStyle = 'black';
  hud.context.textAlign = 'left';
  hud.context.strokeText('Lives: ' + lives, 15, 6);
  hud.context.fillText('Lives: ' + lives, 15, 6);
  hud.context.textAlign = 'right';
  hud.context.strokeText('Score: ' + score, canvas.width - 15, 6);
  hud.context.fillText('Score: ' + score, canvas.width - 15, 6);
}

// Initialize the maze, dots, and powerups.
function setupMap() {
  var layout =  "IIIIIIIIIIIIIIIIIII\n" +
                "IDDDDIDDDDDDDIDDDDI\n" +
                "IPIIDIDIIIIIDIDIIPI\n" +
                "IDDDDDDDDDDDDDDDDDI\n" +
                "IIDIDIIIDIDIIIDIDII\n" +
                "  DIDDDDDIDDDDDID  \n" +
                "IIDIII IIIII IIIDII\n" +
                "IID             DII\n" +
                "IIDIII IIWII IIIDII\n" +
                "IIDI   I   I   IDII\n" +
                "IIDI I IIIII I IDII\n" +
                "  D  I       I  D  \n" +
                "IIDIIIII I IIIIIDII\n" +
                "IIDDDDD  I  DDDDDII\n" +
                "IIDIIIDIIIIIDIIIDII\n" +
                "IDDDDDDDD DDDDDDDDI\n" +
                "IDIIDIIIDIDIIIDIIDI\n" +
                "IDIIDIDDDIDDDIDIIDI\n" +
                "IPIIDIDIIIIIDIDIIPI\n" +
                "IDDDDDDDDDDDDDDDDDI\n" +
                "IIIIIIIIIIIIIIIIIII";
  map = new TileMap(layout, {I: Box, D: Dot, P: Powerup, W: OneWayGhostDoor}, {
    cellSize: [UNIT, UNIT],
    startCoords: [0, UNIT],
  });
  dots = new Collection();
  powerups = new Collection();
  // Move dots and powerups to their own collections.
  map.forEach(function(o, i, j) {
    if (o instanceof Dot) {
      map.clearCell(i, j);
      dots.add(o);
    }
    else if (o instanceof Powerup) {
      map.clearCell(i, j);
      powerups.add(o);
    }
  });
}

// Draw dots as circles smaller than their collision box.
var Dot = Box.extend({
  drawDefault: function(ctx, x, y, w, h) {
    ctx.circle(this.xC(), this.yC(), (w+h)/12, 'blue');
  },
});

// Draw powerups as circles smaller than their collision box.
var Powerup = Box.extend({
  drawDefault: function(ctx, x, y, w, h) {
    ctx.circle(this.xC(), this.yC(), (w+h)/6, 'blue');
  },
});

// Pacman is a Player with different movement mechanics.
var Pacman = Player.extend({
  WIGGLE: WIGGLE,
  MOVEAMOUNT: UNIT*6,
  CONTINUOUS_MOVEMENT: true,
  STAY_IN_WORLD: false,
  DEFAULT_WIDTH: UNIT,
  DEFAULT_HEIGHT: UNIT,
  lastPoweredUp: 0, // Timestamp (in ms) of the latest powerup consumption
  init: function() {
    this.DEFAULT_WIDTH = UNIT-2*this.WIGGLE;
    this.DEFAULT_HEIGHT = UNIT-2*this.WIGGLE;
    this._super.apply(this, arguments);
    var startCoords = map.getPixelCoords(9, 15);
    if (!arguments.length) this.x = startCoords.x+this.WIGGLE;
    if (arguments.length < 2) this.y = startCoords.y+this.WIGGLE;
    this.lastLooked = ['left']; // Initial direction
    this.queuedDirs = {v: '', h: ''};
  },
  drawDefault: function(ctx, x, y, w, h) {
    // Make the powered up player draw 50% bigger
    if (this.isPoweredUp()) {
      this._super.call(this, ctx, x-w*0.25, y-h*0.25, w*1.5, h*1.5);
    }
    else {
      this._super.apply(this, arguments);
    }
  },
  isPoweredUp: function() {
    return Math.max(this.lastPoweredUp + POWERUP_LENGTH()*PAUSE - Date.now(), 0);
  },
  // Choose which direction to go. This was surprisingly hard to get right.
  _processDir: function(direction, keys, dirs, lastDir, newDir, testDir) {
    var axis = 'h', otherAxis = 'v';
    var mult = testDir == 'up' || testDir == 'left' ? -1 : 1;
    if (testDir == 'up' || testDir == 'down') {
      axis = 'v';
      otherAxis = 'h';
    }
    // Move in the requested or queued direction if possible.
    // Otherwise, queue the requested direction and try again next time.
    if (App.Utils.anyIn(keys[testDir], direction) || this.queuedDirs[axis] == testDir) {
      if (dirs[testDir]) {
        if (newDir || this.queuedDirs[axis]) {
          this.queuedDirs[otherAxis] = '';
        }
        this.queuedDirs[axis] = '';
        lastDir.push(keys[testDir][0]);
      }
      else if (newDir) {
        this.queuedDirs[axis] = testDir;
      }
    }
  },
  // Override how player input is handled.
  processInput: function(direction) {
    var dirs = getAvailableDirections(this),
        keys = this.keys || window.keys,
        lastDir = [],
        newDir = true;
    // If no input was explicitly provided, use the keyboard input.
    if (typeof direction === 'undefined') {
      direction = jQuery.hotkeys.keysDown;
    }
    // If there is no keyboard input, try to keep going in the same direction.
    if (!direction.length) {
      direction = this.lastLooked;
      newDir = false;
    }
    // See if we can go in each direction.
    this._processDir(direction, keys, dirs, lastDir, newDir, 'up');
    this._processDir(direction, keys, dirs, lastDir, newDir, 'down');
    this._processDir(direction, keys, dirs, lastDir, newDir, 'left');
    this._processDir(direction, keys, dirs, lastDir, newDir, 'right');
    // If we changed direction, remember to keep going that way.
    if (lastDir.length) {
      this.lastLooked = lastDir;
    }
    // Apply velocity in the specified direction.
    Actor.prototype.processInput.call(this, this.lastLooked);
  },
  /**
   * Add an upper bound on the player's movement per frame.
   *
   * Normally, Actors' movement is linearly interpolated, meaning the distance
   * moved is consistent over time. However, this leads to a problem where the
   * player can miss turns due to passing a tunnel without aligning to it
   * closely enough to enter. The most common (naive) alternative approach to
   * movement is to move a specific distance per frame, but this can cause
   * movement speeds to vary wildly over time depending on the frame rate, and
   * to solve the missed-turn problem it also requires choosing a movement
   * speed that evenly divides the unit size of the map. Here we implement a
   * hybrid approach where the Actor's movement is linearly interpolated with
   * an upper bound, so that if the frame rate is too low the Actor will not
   * move more than a specific distance per frame. This solves the missed-turn
   * problem because it keeps the Actor from skipping over a junction and also
   * keeps most of the consistency and flexibility of linear interpolation.
   * However, it has the trade-off that at high movement speeds or low frame
   * rates the Actor will move slower than it would with other techniques. For
   * Pac-man in particular this means that Pac-man can be slower than the
   * ghosts because the ghosts do not have an upper bound on their movement
   * speed.
   */
  move: function() {
    this._super.apply(this, arguments);
    var xd = this.x - this.lastX,
        yd = this.y - this.lastY;
    if (Math.abs(xd) > WIGGLE*2 && Math.abs(xd) < UNIT) {
      this.x = this.lastX + WIGGLE*2*xd.sign();
    }
    if (Math.abs(yd) > WIGGLE*2 && Math.abs(yd) < UNIT) {
      this.y = this.lastY + WIGGLE*2*yd.sign();
    }
  },
  stayInWorld: function() {
    // Teleport to the other side of the map.
    if (!world.isInWorld(this, true)) {
      if (this.x+this.width < 0) {
        this.x = world.width-1;
      }
      else if (this.x > world.width) {
        this.x = 1-this.width;
      }
    }
    // Don't move more than 2px along any axis at a time.
    // This is necessary because Pacman doesn't move the same distance every
    // frame due to linear smoothing. However, Pacman can only turn when within
    // 1px of the center of a tile, so if Pacman moves too fast over a tile
    // the player won't be able to turn when expected. This whole WIGGLE thing
    // is kind of an annoying hack, but Pacman would look jerkier with
    // unit motion instead of linear motion.
    else {
      var d = this.x - this.lastX;
      if (Math.abs(d) > this.WIGGLE*2) {
        this.x = this.lastX + d.sign()*this.WIGGLE*3;
      }
      d = this.y - this.lastY;
      if (Math.abs(d) > this.WIGGLE*2) {
        this.y = this.lastY + d.sign()*this.WIGGLE*3;
      }
    }
  },
  // Track score.
  increaseScore: function(amount) {
    score += amount;
    drawHUD();
  },
  // Track lives.
  takeLife: function() {
    lives--;
    drawHUD();
  },
  hasLivesLeft: function() {
    return lives > 1;
  },
});

// Ghosts are basically the same as Pacman except they are autonomous.
var Ghost = Actor.extend({
  WIGGLE: WIGGLE,
  MOVEAMOUNT: UNIT*6,
  CONTINUOUS_MOVEMENT: true,
  STAY_IN_WORLD: false,
  DEFAULT_WIDTH: UNIT,
  DEFAULT_HEIGHT: UNIT,
  lastPoweredUp: 0,
  init: function() {
    this.DEFAULT_WIDTH = UNIT-2*this.WIGGLE;
    this.DEFAULT_HEIGHT = UNIT-2*this.WIGGLE;
    this._super.apply(this, arguments);
    var startCoords = map.getPixelCoords(9, 7);
    if (!arguments.length) this.x = startCoords.x+this.WIGGLE;
    if (arguments.length < 2) this.y = startCoords.y+this.WIGGLE;
    this.lastLooked = ['left']; // Initial direction
    this.initialized = Date.now();
    this.ghostNum = ghostNum++; // Affects time before leaving regeneration area
  },
  // Draw in different colors depending on whether the player is powered up
  drawDefault: function() {
    var scared = player.isPoweredUp();
    this.fillStyle = scared ? (scared < GHOST_UNSCARED_WARNING ? 'darkGreen' : 'lightGreen') : 'red';
    this._super.apply(this, arguments);
  },
  // Override movement controls.
  processInput: function() {
    // Don't leave the regeneration area for a few seconds.
    if (this.initialized > Date.now() - GHOST_REGEN_TIME*this.ghostNum) return;

    // If the ghost can turn, select available directions.
    var dirs = getAvailableDirections(this);
    if (dirs.turn) {
      delete dirs.turn;
      var availDirs = [], currentDir = this.lastLooked[0];
      for (var dir in dirs) {
        // Try to avoid reversing direction.
        var opposite =
          (dir == 'up' && currentDir == 'down') ||
          (dir == 'down' && currentDir == 'up') ||
          (dir == 'left' && currentDir == 'right') ||
          (dir == 'right' && currentDir == 'left');
        if (dirs.hasOwnProperty(dir) && dirs[dir] && !opposite) {
          availDirs.push(dir);
        }
      }
      this.lastLooked = [this.chooseDirection(availDirs)];
    }
    // Apply velocity in the specified direction.
    Actor.prototype.processInput.call(this, this.lastLooked);
  },
  // Make the AI choose an available direction.
  chooseDirection: function(availDirs) {
    // For brevity, choose an available direction randomly.
    // Good AI algorithms are not the focus of this demo...
    return availDirs[App.Utils.getRandIntBetween(0, availDirs.length-1)];
  },
  // Teleport to the other side of the map.
  stayInWorld: function() {
    if (!world.isInWorld(this, true)) {
      if (this.x+this.width < 0) {
        this.x = world.width-1;
      }
      else if (this.x > world.width) {
        this.x = 1-this.width;
      }
    }
  },
  // Allow leaving the regeneration area.
  _collideSolidBox: function(collideWith) {
    if (collideWith instanceof OneWayGhostDoor && !collideWith.overlaps(this)) {
      return {x: 0, y: 0};
    }
    return this._super.apply(this, arguments);
  },
});

// Exit from the ghost regeneration area.
var OneWayGhostDoor = Box.extend({
  DOOR_THRESHOLD: 0.1,
  overlaps: function(otherBox) {
    if (otherBox instanceof Ghost && otherBox.y+otherBox.height > this.y+this.height*this.DOOR_THRESHOLD) {
      return false;
    }
    return this._super.apply(this, arguments);
  },
  drawDefault: function(ctx, x, y, w, h) {
    ctx.fillRect(x, y, w, 2);
  },
});

// Get the directions in which an actor can move
function getAvailableDirections(actor) {
  // Shortcuts to make it easy to get movement information
  var keys = actor.keys || window.keys,
      anyIn = App.Utils.anyIn,
      ll = actor.lastLooked;
  // Get the TileMap coordinates of the actor.
  var pos = map.getCellCoords(actor.x, actor.y);
  // The directions we're tracking
  var dirs = {up: false, down: false, left: false, right: false, turn: true};
  // We can only move if we're in the center of a tile.
  var cxc = map.options.startCoords[0]+map.options.cellSize[0]*pos.col+map.options.cellSize[0]/2;
  var cyc = map.options.startCoords[1]+map.options.cellSize[1]*pos.row+map.options.cellSize[1]/2;
  var wiggle = (UNIT-actor.width)/2;
  if (!App.Utils.almostEqual(actor.xC(), cxc, wiggle) || !App.Utils.almostEqual(actor.yC(), cyc, wiggle)) {
    dirs.turn = false;
  }
  // Check tiles in the cardinal directions; we can go there if no tile exists
  // and either we can turn or we're already moving along that axis, or if
  // we're not in the middle of a tile on the relevant axis.
  if ((!map.getCell(pos.row-1, pos.col) && (dirs.turn || anyIn(keys.up.concat(keys.down), ll))) || !App.Utils.almostEqual(actor.yC(), cyc, 1)) {
    dirs.up = true;
  }
  if ((!map.getCell(pos.row+1, pos.col) && (dirs.turn || anyIn(keys.up.concat(keys.down), ll))) || !App.Utils.almostEqual(actor.yC(), cyc, 1)) {
    dirs.down = true;
  }
  if ((!map.getCell(pos.row, pos.col-1) && (dirs.turn || anyIn(keys.left.concat(keys.right), ll))) || !App.Utils.almostEqual(actor.xC(), cxc, 1)) {
    dirs.left = true;
  }
  if ((!map.getCell(pos.row, pos.col+1) && (dirs.turn || anyIn(keys.left.concat(keys.right), ll))) || !App.Utils.almostEqual(actor.xC(), cxc, 1)) {
    dirs.right = true;
  }
  // Allow ghosts to exit the regeneration area.
  if (actor instanceof Ghost && pos.row == 9 && pos.col == 9) {
    dirs.up = true;
  }
  return dirs;
}
