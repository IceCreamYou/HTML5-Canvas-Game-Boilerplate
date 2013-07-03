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
  soldiers.forEach(function(soldier) {
    if (soldier.selected) {
      soldier.update(soldier.chooseBestDirection());
    }
  });
}

/**
 * A magic-named function where all drawing should occur.
 */
function draw() {
  bkgd.draw();
  base.draw();
  soldiers.draw();
  soldiers.forEach(function(soldier) {
    if (soldier.isHovered()) {
      soldier.drawHovered();
    }
  });
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
  world.resize(3200, 3200);

  Mouse.Zoom.enable();
  Mouse.Scroll.enable();
  Mouse.Scroll.setThreshold(0.3);
  Mouse.Scroll.setScrollDistance(800);

  dragOverlay = new Layer({relative: 'canvas'});
  dragOverlay.context.fillStyle = 'rgba(255, 240, 40, 0.4)';
  dragOverlay.context.strokeStyle = 'rgba(255, 240, 40, 1.0)';
  dragOverlay.context.lineWidth = 2;

  bkgd = new Layer();
  bkgd.context.drawPattern('images/grass2body.png', 0, 0, world.width, world.height);
  App.Events.listen(bkgd, 'mousedown.bkgd, touchstart.bkgd', function(e) {
    if (typeof e === 'undefined') return;
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
          soldier.moveTo(Mouse.coords.x + world.xOffset + xDiff, Mouse.coords.y + world.yOffset + yDiff);
        }
      });
    }
    // Touch or left click -> Deselect all
    else {
      soldiers.forEach(function(soldier) {
        soldier.selected = false;
      });
      if (e.type == 'mousedown' && e.which !== 1) return; // no middle click
      if (mousedown) return;
      mousedown = true;
      // Start drawing the overlay rect
      dragOverlay.startX = Mouse.coords.x;
      dragOverlay.startY = Mouse.coords.y;
    }
  }, 1000); // Set the weight below everything else so we can cancel bubbling
  $canvas.on('mousemove.dragselect touchmove.dragselect', function(e) {
    if (mousedown) {
      // Draw the overlay rect
      dragOverlay.context.clear();
      dragOverlay.context.fillRect(
          dragOverlay.startX, dragOverlay.startY,
          Mouse.coords.x - dragOverlay.startX,
          Mouse.coords.y - dragOverlay.startY
      );
      dragOverlay.context.strokeRect(
          dragOverlay.startX, dragOverlay.startY,
          Mouse.coords.x - dragOverlay.startX,
          Mouse.coords.y - dragOverlay.startY
      );
    }
  });
  $canvas.on('mouseup.dragselect mouseleave.dragselect touchend.dragselect', function(e) {
    if (e.type == 'mouseup' && e.which !== 1) return; // left click or touch only
    if (mousedown) {
      // Stop drawing the overlay rect
      dragOverlay.context.clear();
      var x = Math.min(dragOverlay.startX, Mouse.coords.x) + world.xOffset,
          y = Math.min(dragOverlay.startY, Mouse.coords.y) + world.yOffset,
          w = Math.abs(Mouse.coords.x - dragOverlay.startX),
          h = Math.abs(Mouse.coords.y - dragOverlay.startY);
      if (w && h) {
        var selectBox = new Box(x, y, w, h);
        var toSelect = selectBox.collides(soldiers, true);
        if (toSelect) {
          for (var i = 0; i < toSelect.length; i++) {
            toSelect[i].toggleSelected();
          }
        }
      }
    }
    mousedown = false;
  });
  // Prevent iOS webkit from scrolling
  $(document).on('touchmove', function(e) { e.preventDefault(); });
  // Disable the right-click menu
  canvas.oncontextmenu = function() { return false; };

  soldiers = new Collection();
  selectedSoldiers = new Collection();

  base = new Base(Team.BLUE, 400, 400);
  world.centerViewportAround(440, 440);
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
  },
  spawn: function(force) {
    if (!force && this.lastSpawned + this.delayBetweenSpawns > App.physicsTimeElapsed) {
      return;
    }
    var s = this.dummySoldier;
    s.team = this.team;
    for (var i = 0; i < spawnLocations.length; i++) {
      for (var j = 0; j < spawnLocations.length; j++) {
        if (i === 1 && j === 1) continue;
        s.x = this.x + spawnLocations[i];
        s.y = this.y + spawnLocations[j];
        if (!s.collides(soldiers)) {
          soldiers.add(s);
          this.dummySoldier = new Soldier(this.x, this.y);
          this.lastSpawned = App.physicsTimeElapsed;
          return;
        }
      }
    }
  },
  drawDefault: function(ctx, x, y, w, h) {
    this._super.apply(this, arguments);
    // TODO Make this aware of the soldiers' location
    if (soldiers.length < 8) {
      ctx.fillStyle = 'gray';
      var percentComplete = (App.physicsTimeElapsed - this.lastSpawned) / this.delayBetweenSpawns;
      ctx.fillRect(x+w*0.1, y+h*0.8, w*0.8*percentComplete, h*0.1);
    }
  },
});

var Soldier = Actor.extend({
  MOVEAMOUNT: 300,
  DEFAULT_WIDTH: 20,
  DEFAULT_HEIGHT: 20,
  team: Team.BLUE,
  selected: false,
  moveToX: 0,
  moveToY: 0,
  init: function() {
    this._super.apply(this, arguments);
    var t = this;
    this.listen('mousedown.select touchstart.select', function(e) {
      // Left click only
      if (typeof e !== 'undefined' && e.type == 'mousedown' && e.which !== 1) {
        return;
      }
      e.stopPropagation();
      t.toggleSelected.call(t);
    });
  },
  drawDefault: function() {
    if (this.selected) {
      var t = this.fillStyle;
      this.fillStyle = 'yellow';
      this._super.apply(this, arguments);
      this.fillStyle = t;
    }
    else {
      this._super.apply(this, arguments);
    }
  },
  drawHovered: function() {
    if (!this.selected) {
      var t = this.fillStyle;
      this.fillStyle = 'lightGreen';
      this.draw();
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
  destroy: function() {
    this._super.apply(this, arguments);
    this.unlisten('.select');
  },
});

(function() {
var lastZoom = App.physicsTimeElapsed, numScrollEvents = 0;
/**
 * @class Mouse.Zoom
 *   Allows zooming in and out by scrolling the mouse wheel.
 *
 * @static
 */
Mouse.Zoom = {
  /**
   * A value slightly above the minimum zoom factor.
   * @static
   */
  MIN_ZOOM: 0.61,
  /**
   * A value slightly below the maximum zoom factor.
   * @static
   */
  MAX_ZOOM: 1.29,
  /**
   * The amount by which to change the zoom factor when scrolling the wheel.
   * @static
   */
  ZOOM_STEP: 0.05,
  /**
   * The minimum number of seconds between changing zoom factors.
   * @static
   */
  ZOOM_TIMEOUT: 0.125,
  /**
   * The minimum number of wheel events that must fire before zooming.
   * @static
   */
  MIN_SCROLL_EVENTS: 2,
  /**
   * Enable zooming in response to mouse wheel scrolling.
   * @static
   */
  enable: function() {
    // wheel is a standard (IE and FF); mousewheel is legacy (Chrome)
    $canvas.on('wheel.zoom mousewheel.zoom', function(e) {
      // Avoid overzealous scrolling causing unexpected zooming
      if (lastZoom + Mouse.Zoom.ZOOM_TIMEOUT > App.physicsTimeElapsed) return;
      if (++numScrollEvents < Mouse.Zoom.MIN_SCROLL_EVENTS) return;
      lastZoom = App.physicsTimeElapsed;
      numScrollEvents = 0;

      // Get an indication of the direction of the scroll.
      // Depending on the browser, OS, and device settings, the actual value
      // could be in pixels, lines, pages, degrees, or arbitrary units, so all
      // we can consistently deduce from this is the direction.
      var delta = e.originalEvent.deltaY || -e.originalEvent.wheelDelta;
      // We want to scroll in around the mouse coordinates.
      var mx = Mouse.coords.x + world.xOffset,
          my = Mouse.coords.y + world.yOffset;
      // Scroll up; zoom in
      if (delta.sign() < 0) {
        if (world.scale > Mouse.Zoom.MIN_ZOOM) {
          world.scaleResolution(world.scale - Mouse.Zoom.ZOOM_STEP, mx, my);
        }
      }
      // Scroll down; zoom out
      else {
        if (world.scale < Mouse.Zoom.MAX_ZOOM) {
          world.scaleResolution(world.scale + Mouse.Zoom.ZOOM_STEP, mx, my);
        }
      }
    });
  },
  /**
   * Disable zooming in response to mouse wheel scrolling.
   * @static
   */
  disable: function() {
    $canvas.off('.zoom');
  },
};
})();
