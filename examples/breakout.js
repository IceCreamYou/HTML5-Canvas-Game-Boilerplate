/**
 * The Player object; an Actor controlled by user input.
 */
var player;

/**
 * Keys used for various directions.
 */
var keys = {
  up: ['up', 's'],
  down: ['down', 'w'],
  left: ['left', 'a'],
  right: ['right', 'd'],
};

/**
 * An array of image file paths to pre-load.
 */
var preloadables = [];

// Track lives and score.
var lives, score;

// Constants. Tweak these to change the game dynamics.
var PADDLE_WIDTH = 120,
    INITIAL_LIVES = 3,
    BRICK_SCORE = 1, // Points for destroying a single block
    LEVEL_SCORE = 50, // Points for destroying all blocks in a level
    SPIN_FACTOR = 100, // 100 is arbitrary, but it should be above the FPS.
    BALL_RADIUS = 15,
    BALL_SPEED = 400, // In pixels per second
    MAX_BALL_SPEED = 1000,
    BALL_SPEED_LEVEL_INCREASE = 75,
    PAUSE = 1500; // ms to pause after losing a life or winning a level

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
  player.update();

  // Paddle-ball collision
  var o = ball.collideSolid(player);
  ball.bounce(o.x, o.y, true);

  // Bricks-ball collision
  bricks.forEach(function(brick) {
    o = ball.collideSolid(brick);
    ball.bounce(o.x, o.y);
    // Increment score and kill the brick if we hit it.
    if (o.x || o.y) {
      player.increaseScore(BRICK_SCORE);
    }
    return o.x || o.y;
  });

  ball.update();

  // If we're out of bricks, reset the level and speed up the ball.
  if (!bricks.getAll().length && !ball.levelUp) {
    ball.levelUp = true;
    Ball.prototype.MOVEAMOUNT = Math.min(
        Ball.prototype.MOVEAMOUNT+BALL_SPEED_LEVEL_INCREASE, MAX_BALL_SPEED);
    player.increaseScore(LEVEL_SCORE);
    stopAnimating();
    player.destroy();
    setTimeout(App.reset, PAUSE);
  }
}

/**
 * A magic-named function where all drawing should occur.
 */
function draw() {
  context.drawCheckered(100, 0, 0, world.width, world.height);
  hud.draw();
	player.draw();
	bricks.draw();
	ball.draw();
}

/**
 * A magic-named function for one-time setup.
 *
 * @param {Boolean} first
 *   true if the app is being set up for the first time; false if the app has
 *   been reset and is starting over.
 */
function setup(first) {
  // Initialize the paddle.
  player = new Player(world.width/2-PADDLE_WIDTH/2, world.height-60, PADDLE_WIDTH, 20, 'black');
  player.MOVEAMOUNT = 800; // Speed up arrow-key movement.
  player.drawDefault = function(ctx, x, y, w, h) {
    // Draw as a box, not as a smiley face.
    ctx.fillRect(x, y, w, h);
  };
  // Ignore up/down keys.
  player.keys = {
    up: [],
    down: [],
    left: ['left', 'a'],
    right: ['right', 'd'],
  };
  // Track score.
  player.increaseScore = function(amount) {
    score += amount;
    drawHUD();
  };
  // Track lives.
  player.takeLife = function() {
    lives--;
    drawHUD();
  };
  player.hasLivesLeft = function() {
    return lives > 1;
  };
  // Reset lives and score.
  if (first || lives === 0) {
    lives = INITIAL_LIVES;
    score = 0;
    Ball.prototype.MOVEAMOUNT = Actor.prototype.MOVEAMOUNT;
  }

  // Initialize the ball. (We could use a Collection for multiple balls...)
  ball = new Ball(25 + BALL_RADIUS, world.height / 2);
  ball.fillStyle = '#F48D55';

  if (first) {
    // Make the paddle follow the mouse.
    $canvas.off('.setup').on('mousemove.setup touchmove.setup', function(e) {
      player.x = Mouse.Coords.worldX() - player.width/2;
    });

    // Make bricks draw slightly smaller than their hitbox so there's a gutter.
    Box.prototype.drawDefault = function(ctx, x, y, w, h) {
      ctx.fillRect(x+5, y+5, w-10, h-10);
    };

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
    $canvas.after('<div id="countdown" style="background-color: rgba(255, 255, 255, 0); display: none; font-size: 60px; height: 80px; left: 0; overflow: hidden; position: absolute; text-align: center; top: 50%; width: 100%; z-index: 10;">0</div>');
  }
  drawHUD();

  // Initialize the bricks at the beginning of a new level.
  if (typeof bricks === 'undefined' || !bricks.getAll().length || lives === 3) {
    var layout =  "BBBBBBB\n" +
                  "BBBBBBB\n" +
                  "BBBBBBB\n" +
                  "BBBBBBB\n" +
                  "BBBBBBB";
    bricks = new TileMap(layout, {B: Box}, {
      cellSize: [80, 40],
      startCoords: [20, 40],
    });
  }

  // Go after countdown.
  draw();
  countdown(startAnimating);
  return false;
}

// 3... 2... 1... Go!
function countdown(callback) {
  var $countdown = jQuery('#countdown').text('3').show();
  setTimeout(function() {
    $countdown.text('Go!').fadeOut(1000);
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
  hud.context.textAlign = 'left';
  hud.context.strokeText('Lives: ' + lives, 15, 15);
  hud.context.fillText('Lives: ' + lives, 15, 15);
  hud.context.textAlign = 'right';
  hud.context.strokeText('Score: ' + score, canvas.width - 15, 15);
  hud.context.fillText('Score: ' + score, canvas.width - 15, 15);
}

// Ball type
var Ball = Actor.extend({
  MOVEAMOUNT: BALL_SPEED,
  CONTINUOUS_MOVEMENT: true,
  DEFAULT_WIDTH: BALL_RADIUS*2,
  DEFAULT_HEIGHT: BALL_RADIUS*2,
  init: function() {
   this._super.apply(this, arguments);
   this.lastLooked = ['right', 'down']; // Initially go in this direction.
   this.lifeTaken = false; // Flag whether we hit the bottom
   this.levelUp = false; // Flag whether we leveled up
  },
  // Draw as a smiley face normally, but a frowny face after hitting the bottom.
  drawDefault: function() {
   if (this.lifeTaken) {
     x = this.x + this.width/2;
     y = this.y + this.height/2;
     r = (this.width + this.height)/4;

     // Circle
     context.circle(x, y, r, 'lightBlue', 'black');

     // Smile
     context.beginPath();
     context.arc(x, y+this.height*0.4, r*0.6, -Math.PI*0.85, -Math.PI*0.15, false);
     context.lineWidth = Math.max(Math.ceil(r/15), 1);
     context.strokeStyle = 'black';
     context.stroke();

     // Eyes
     context.beginPath();
     context.arc(x - r*0.3, y - r*0.25, Math.max(Math.ceil(r/15), 1), 0, 2 * Math.PI, false);
     context.fillStyle = 'black';
     context.fill();
     context.arc(x + r*0.3, y - r*0.25, Math.max(Math.ceil(r/15), 1), 0, 2 * Math.PI, false);
     context.fill();
   }
   else {
     Actor.prototype.drawDefault.apply(this, arguments);
   }
  },
  // Bounce off the sides of the world.
  stayInWorld: function() {
   if (this.x < 0 || this.x + this.width > world.width) {
     this.bounce(true, false);
   }
   if (this.y < 0) {
     this.bounce(false, true);
   }
   // When hitting the bottom, take a life or end the game.
   else if (this.y + this.height > world.height && !this.lifeTaken) {
     this.lifeTaken = true;
     if (player.hasLivesLeft()) {
       player.takeLife();
       player.destroy();
       stopAnimating();
       setTimeout(App.reset, PAUSE);
     }
     else {
       player.takeLife();
       App.gameOver();
     }
   }
   this._super.apply(this, arguments);
  },
  // Switch directions.
  bounce: function(x, y, hitPlayer) {
   // X axis (wall, side of brick, or side of paddle)
   if (x) {
     this.lastLooked[0] = this.lastLooked[0] == 'right' ? 'left' : 'right';
     this.xAcceleration = -this.xAcceleration;
   }
   // Y axis (ceiling, top or bottom of brick, top of paddle)
   if (y) {
     this.lastLooked[1] = this.lastLooked[1] == 'down' ? 'up' : 'down';
     // Spin the ball based on where the player's paddle was hit.
     if (hitPlayer) {
       var m2 = 2*this.MOVEAMOUNT*SPIN_FACTOR;
       this.xAcceleration += (this.xC() - player.xC()) / player.width * m2;
       // Clamp; don't get too fast.
       this.xAcceleration = Math.max(Math.min(this.xAcceleration, m2), -m2);
     }
   }
  },
});
