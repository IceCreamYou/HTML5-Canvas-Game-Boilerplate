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
};

/**
 * An array of image file paths to pre-load.
 */
var preloadables = ['images/grass2body.png'];

// Teams
var Team = {BLUE: 'blue', RED: 'red'};
// Whether we're currently drag-selecting
var mousedown = false;

/**
 * A magic-named function where all updates should occur.
 */
function update() {
  base.spawn();
  enemyBase.spawn();
  soldiers.forEach(function(soldier) {
    // Move
    if (soldier.selected) {
      soldier.update(soldier.chooseBestDirection());
    }
    // Get hit by projectiles
    bullets.forEach(function(bullet) {
      if (bullet.team != soldier.team && bullet.overlaps(soldier)) {
        soldier.damage(bullet.DAMAGE);
        return true;
      }
    });
    return soldier.health <= 0;
  });
  // Collide with other soldiers
  soldiers.collideAll(function(s1, s2) {
    s1.collideSolid(s2);
  });
  // Shoot
  base.soldiers.forEach(function(soldier) {
    enemyBase.soldiers.forEach(function(enemy) {
      if (soldier.near(enemy)) {
        soldier.shoot(enemy);
      }
      if (enemy.near(soldier)) {
        enemy.shoot(soldier);
      }
    });
  });
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
  base.draw();
  enemyBase.draw();
  soldiers.draw();
  soldiers.forEach(function(soldier) {
    if (soldier.isHovered()) {
      soldier.drawHovered();
    }
  });
  bullets.draw();
  dragOverlay.draw();
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
    $('#show-instructions').click(function() {
      $('#instructions').show();
    });
    $('#instructions-inner').click(function(e) { e.stopPropagation(); });
    $('#instructions').click(function() {
      $('#instructions').hide();
    });
  }

  world.resize(3200, 3200);

  Mouse.Zoom.enable(true);

  Mouse.Scroll.enable();
  Mouse.Scroll.setThreshold(0.3);
  Mouse.Scroll.setScrollDistance(800);

  dragOverlay = new Layer({relative: 'canvas'});
  dragOverlay.context.fillStyle = 'rgba(255, 240, 40, 0.4)';
  dragOverlay.context.strokeStyle = 'rgba(255, 240, 40, 1.0)';
  dragOverlay.context.lineWidth = 2;

  soldiers = new Collection();
  bullets = new Collection();

  base = new Base(Team.BLUE, 400, 400);
  world.centerViewportAround(440, 440);

  enemyBase = new Base(Team.RED, 800, 800);//2720, 2720);

  bkgd = new Layer();
  bkgd.context.drawPattern('images/grass2body.png', 0, 0, world.width, world.height);

  App.Events.listen(bkgd, 'mousedown.bkgd, touchstart.bkgd', function(e) {
    e.preventDefault();
    // Right click -> Move
    if (e.type == 'mousedown' && e.which === 3) {
      // As a simple movement algorithm we are going to find the center of the
      // selected soldiers and translate them towards the destination. (If we
      // just had every soldier move to the destination, they would collide.)
      // TODO: It would be more efficient to update the min/max values when
      // selecting a soldier instead of when moving them.
      // TODO: As a refinement to this, it would be nice if they moved close
      // together instead of staying the same distance apart.
      var minX = world.width, maxX = 0, minY = world.height, maxY = 0;
      soldiers.forEach(function(soldier) {
        if (soldier.selected) {
          if (soldier.x < minX) minX = soldier.x;
          if (soldier.x + soldier.width > maxX) maxX = soldier.x;
          if (soldier.y < minY) minY = soldier.y;
          if (soldier.y + soldier.height > maxY) maxY = soldier.y;
        }
      });
      var midX = minX + (maxX - minX) * 0.5,
          midY = minY + (maxY - minY) * 0.5;
      soldiers.forEach(function(soldier) {
        if (soldier.selected) {
          var xDiff = soldier.x - midX,
              yDiff = soldier.y - midY;
          soldier.moveTo(Mouse.Coords.x + world.xOffset + xDiff, Mouse.Coords.y + world.yOffset + yDiff);
        }
      });
    }
    // Touch or left click -> Deselect all
    else {
      // Holding down CTRL allows selecting multiple soldiers.
      if (!jQuery.hotkeys.areKeysDown('ctrl')) {
        soldiers.forEach(function(soldier) {
          soldier.selected = false;
        });
      }
      if (e.type == 'mousedown' && e.which !== 1) return; // no middle click
      if (mousedown) return;
      mousedown = true;
      // Start drawing the overlay rect
      dragOverlay.startX = Mouse.Coords.x;
      dragOverlay.startY = Mouse.Coords.y;
    }
  }, 1000); // Set the weight below everything else so we can cancel bubbling
  $canvas.on('mousemove.dragselect touchmove.dragselect', function(e) {
    if (mousedown) {
      // Draw the overlay rect
      dragOverlay.context.clear();
      dragOverlay.context.fillRect(
          dragOverlay.startX, dragOverlay.startY,
          Mouse.Coords.x - dragOverlay.startX,
          Mouse.Coords.y - dragOverlay.startY
      );
      dragOverlay.context.strokeRect(
          dragOverlay.startX, dragOverlay.startY,
          Mouse.Coords.x - dragOverlay.startX,
          Mouse.Coords.y - dragOverlay.startY
      );
    }
  });
  $canvas.on('mouseup.dragselect mouseleave.dragselect touchend.dragselect', function(e) {
    if (e.type == 'mouseup' && e.which !== 1) return; // left click or touch only
    if (mousedown) {
      // Stop drawing the overlay rect
      dragOverlay.context.clear();
      var x = Math.min(dragOverlay.startX, Mouse.Coords.x) + world.xOffset,
          y = Math.min(dragOverlay.startY, Mouse.Coords.y) + world.yOffset,
          w = Math.abs(Mouse.Coords.x - dragOverlay.startX),
          h = Math.abs(Mouse.Coords.y - dragOverlay.startY);
      if (w && h) {
        var selectBox = new Box(x, y, w, h);
        var toSelect = selectBox.collides(soldiers, true);
        if (toSelect) {
          for (var i = 0; i < toSelect.length; i++) {
            if (toSelect[i].team == Team.BLUE) { // Only select own soldiers
              toSelect[i].toggleSelected();
            }
          }
        }
      }
    }
    mousedown = false;
  });
  // Disable the right-click menu
  canvas.oncontextmenu = function() { return false; };
}

var spawnLocations = [-40, 30, 100];
var Base = Box.extend({
  team: Team.BLUE,
  lastSpawned: 0,
  delayBetweenSpawns: 5,
  dummySoldier: null,
  init: function(team, x, y) {
    this._super(x, y, 80, 80);
    this.team = this.fillStyle = team;
    this.lastSpawned = App.physicsTimeElapsed-2;
    this.dummySoldier = new Soldier(this.x, this.y);
    this.soldiers = new Collection();
    this.canSpawn = true;
  },
  spawn: function(force) {
    if (!force && this.lastSpawned + this.delayBetweenSpawns > App.physicsTimeElapsed) {
      return;
    }
    var s = this.dummySoldier;
    s.team = this.team;
    s.base = this;
    for (var i = 0; i < spawnLocations.length; i++) {
      for (var j = 0; j < spawnLocations.length; j++) {
        if (i === 1 && j === 1) continue;
        s.x = this.x + spawnLocations[i];
        s.y = this.y + spawnLocations[j];
        if (!s.collides(soldiers)) {
          soldiers.add(s);
          this.soldiers.add(s);
          this.dummySoldier = new Soldier(this.x, this.y);
          this.lastSpawned = App.physicsTimeElapsed;
          this.canSpawn = true;
          return;
        }
      }
    }
    this.canSpawn = false;
  },
  drawDefault: function(ctx, x, y, w, h) {
    this._super.apply(this, arguments);
    // TODO Make this aware of the soldiers' location
    ctx.fillStyle = 'gray';
    var percentComplete = this.canSpawn ?
        (App.physicsTimeElapsed - this.lastSpawned) / this.delayBetweenSpawns :
          1;
    ctx.fillRect(x+w*0.1, y+h*0.8, w*0.8*percentComplete, h*0.1);
  },
});

var Soldier = Actor.extend({
  MOVEAMOUNT: 300,
  DEFAULT_WIDTH: 20,
  DEFAULT_HEIGHT: 20,
  NEAR_THRESHOLD: 150,
  SHOOT_DELAY: 1,
  team: Team.BLUE,
  selected: false,
  moveToX: 0,
  moveToY: 0,
  health: 100,
  lastShot: 0,
  init: function() {
    this._super.apply(this, arguments);
    this.lastShot = App.physicsTimeElapsed;
    var t = this;
    this.listen('mousedown.select touchstart.select', function(e) {
      // Left click only
      if (typeof e !== 'undefined' && e.type == 'mousedown' && e.which !== 1) {
        return;
      }
      if (t.team != Team.BLUE) { // Only select own team
        return;
      }
      // Holding down CTRL allows selecting multiple soldiers.
      if (!jQuery.hotkeys.areKeysDown('ctrl')) {
        soldiers.forEach(function(soldier) {
          soldier.selected = false;
        });
      }
      e.stopPropagation();
      t.toggleSelected.call(t);
    });
  },
  drawDefault: function(ctx, x, y, w, h) {
    this.fillStyle = this.selected ? '#47AD98' : (this.team == Team.BLUE ? 'lightBlue' : '#F48D55');
    this._super.call(this, ctx, x, y, w, h);

    ctx.lineWidth = 1;
    var healthPct = this.health/100;
    ctx.fillStyle = '#00DA00';
    ctx.fillRect(x, y - 10, w*healthPct, 6);
    ctx.fillStyle = '#EA3311';
    ctx.fillRect(x+w*healthPct, y - 10, w*(1-healthPct), 6);
    ctx.strokeStyle = 'black';
    ctx.strokeRect(x, y - 10, w, 6);
  },
  drawHovered: function() {
    if (!this.selected) {
      var t = this.fillStyle;
      this.fillStyle = this.team == Team.BLUE ? '#82D8D4' : '#F4AC30';
      Actor.prototype.drawDefault.call(this, context, Math.round(this.x), Math.round(this.y), this.width, this.height);
      this.fillStyle = t;
    }
  },
  toggleSelected: function() {
    this.selected = !this.selected;
    this.moveToX = this.xC();
    this.moveToY = this.yC();
  },
  moveTo: function(x, y) {
    this.moveToX = x;
    this.moveToY = y;
  },
  chooseBestDirection: function() {
    var dir = [];
    if (this.xC() < this.moveToX - 1) dir.push(keys.right[0]);
    else if (this.xC() > this.moveToX + 1) dir.push(keys.left[0]);
    if (this.yC() < this.moveToY - 1) dir.push(keys.down[0]);
    else if (this.yC() > this.moveToY + 1) dir.push(keys.up[0]);
    return dir;
  },
  damage: function(dmg) {
    this.health -= dmg;
  },
  near: function(other) {
    return (this.x-other.x)*(this.x-other.x) +
           (this.y-other.y)*(this.y-other.y) <
           this.NEAR_THRESHOLD*this.NEAR_THRESHOLD;
  },
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
    this.unlisten('.select');
    this.base.soldiers.remove(this);
  },
});

var Projectile = Actor.extend({
  DEFAULT_WIDTH: 5,
  DEFAULT_HEIGHT: 5,
  STAY_IN_WORLD: false,
  MOVEAMOUNT: Soldier.prototype.MOVEAMOUNT*1.5,
  MAX_DISTANCE: 200,
  DAMAGE: 20,
  init: function(x, y, team, target) {
    this._super.call(this, x, y);
    this.fillStyle = 'lightGray';
    this.x -= this.DEFAULT_WIDTH*0.5;
    this.y -= this.DEFAULT_HEIGHT*0.5;
    this.startX = this.x;
    this.startY = this.y;
    this.team = team;
    this.target = target;
    var xDist = this.target.x+this.target.width*0.5 - this.x+this.width*0.5,
        yDist = this.target.y+this.target.height*0.5 - this.y+this.height*0.5,
        ratio = Math.abs(xDist/(xDist+yDist));
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
  dampVelocity: function() {},
});
