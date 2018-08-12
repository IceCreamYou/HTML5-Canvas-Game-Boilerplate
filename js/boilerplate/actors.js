/**
 * Defines useful classes for actors in the world.
 *
 * Specifically, this file holds the Box, Actor, and Player classes. These are
 * useful abstractions for practically any game-style environment.
 *
 * @ignore
 */

/**
 * A Box shape.
 *
 * Boxes have a position, size, and visual representation.
 *
 * @constructor
 *   Creates a new Box instance.
 *
 * @param {Number} [x]
 *   The x-coordinate of the top-left corner of the Box. Defaults to the center
 *   of the world.
 * @param {Number} [y]
 *   The y-coordinate of the top-left corner of the Box. Defaults to the center
 *   of the world.
 * @param {Number} [w]
 *   The width of the Box. Defaults to
 *   {@link Box#DEFAULT_WIDTH Box.prototype.DEFAULT_WIDTH}.
 * @param {Number} [h]
 *   The height of the Box. Defaults to
 *   {@link Box#DEFAULT_HEIGHT Box.prototype.DEFAULT_HEIGHT}.
 * @param {Mixed} [fillStyle="black"]
 *   A default fillStyle to use when drawing the Box. Defaults to black.
 */
var Box = Class.extend({
  init: function(x, y, w, h, fillStyle) {
    /**
     * @property {Number} x
     *   The x-coordinate of the top-left corner of the Box.
     */
    this.x = typeof x !== 'undefined' ? x : Math.floor((world.width-this.DEFAULT_WIDTH)/2);
    /**
     * @property {Number} y
     *   The y-coordinate of the top-left corner of the Box.
     */
    this.y = typeof y !== 'undefined' ? y : Math.floor((world.height-this.DEFAULT_HEIGHT)/2);
    /**
     * @property {Number} width
     *   The width of the Box.
     */
    this.width = w || this.DEFAULT_WIDTH;
    /**
     * @property {Number} height
     *   The height of the Box.
     */
    this.height = h || this.DEFAULT_HEIGHT;
    /**
     * @property {String} fillStyle
     *   A fillStyle to use when drawing the Box if no `src` is specified.
     */
    this.fillStyle = fillStyle || 'black';
  },
  /**
   * The default width of a Box.
   */
  DEFAULT_WIDTH: 80,
  /**
   * The default height of a Box.
   */
  DEFAULT_HEIGHT: 80,
  /**
   * Something that can be drawn by {@link CanvasRenderingContext2D#drawImage}.
   *
   * If not set, a box will be drawn instead using the fillStyle.
   */
  src: null,
  /**
   * The angle (in radians) at which to draw the Box.
   */
  radians: 0,
  /**
   * Draw the Box.
   *
   * Draws the shape in Box#drawDefault() unless the Box#src property is set.
   *
   * Use Box#drawBoundingBox() to draw an outline of the Box.
   *
   * @param {CanvasRenderingContext2D} [ctx]
   *   A canvas graphics context onto which this Box should be drawn. This is
   *   useful for drawing onto {@link Layer}s. If not specified, defaults to
   *   the {@link global#context global context} for the default canvas.
   * @param {Boolean} [smooth=true]
   *   A boolean indicating whether to force the Box to be drawn at whole-pixel
   *   coordinates. If you don't already know that your coordinates will be
   *   integers, this option can speed up painting since the browser does not
   *   have to interpolate the image.
   */
  draw: function(ctx, smooth) {
    ctx = ctx || context;
    if (typeof smooth === 'undefined') {
      smooth = true;
    }
    ctx.save();
    ctx.fillStyle = this.fillStyle;
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
    ctx.restore();
  },
  /**
   * {@link Box#draw Draw} the default shape when no image has been applied.
   *
   * This is useful to override for classes that have different standard
   * appearances, rather than overriding the whole Box#draw() method.
   *
   * @param {CanvasRenderingContext2D} ctx
   *   A canvas graphics context onto which this Box should be drawn.
   * @param {Number} x
   *   The x-coordinate of the upper-left corner of the Box.
   * @param {Number} y
   *   The y-coordinate of the upper-left corner of the Box.
   * @param {Number} w
   *   The width of the Box.
   * @param {Number} h
   *   The height of the Box.
   */
  drawDefault: function(ctx, x, y, w, h) {
    ctx.fillRect(x, y, w, h);
  },
  /**
   * Draw the outline of the Box used to calculate collision.
   *
   * To draw the Box itself, use Box#draw().
   *
   * @param {CanvasRenderingContext2D} [ctx]
   *   A canvas graphics context onto which the outline should be drawn. This
   *   is useful for drawing onto {@link Layer}s. If not specified, defaults to
   *   the {@link global#context global context} for the default canvas.
   * @param {Mixed} [strokeStyle]
   *   A style to use for the box outline.
   */
  drawBoundingBox: function(ctx, strokeStyle) {
    ctx = ctx || context;
    if (strokeStyle) {
      ctx.strokeStyle = strokeStyle;
    }
    ctx.strokeRect(this.x, this.y, this.width, this.height);
  },
  /**
   * Get the x-coordinate of the center of the Box.
   *
   * See also Box#yC()
   */
  xC: function() {
    return this.x + this.width/2;
  },
  /**
   * Get the y-coordinate of the center of the Box.
   *
   * See also Box#xC()
   */
  yC: function() {
    return this.y + this.height/2;
  },
  /**
   * Determine whether this Box overlaps with another Box or set of Boxes.
   *
   * The main difference between Box#collides() and Box#overlaps() is that
   * Box#overlaps() only checks against a single Box and returns a Boolean
   * indicating whether there is overlap, whereas Box#collides() can check
   * against many Boxes and returns the first item to overlap (if any).
   *
   * The collision checking here uses AABB detection, meaning it uses upright
   * rectangles. It is accurate, but not as fast as it could be if there are
   * many objects to check against. If you need faster collision checking
   * against many objects and you're willing to do it manually, consider
   * implementing
   * [spatial partitioning](http://buildnewgames.com/broad-phase-collision-detection/).
   * If you need different collision models (for example with rotated
   * rectangles or different shapes) or if you need more advanced physics
   * simulation (for example to model springs) consider using the
   * [Box2D library](https://github.com/kripken/box2d.js/).
   *
   * @param {Box/Box[]/Collection/TileMap} collideWith
   *   A Box, Collection or Array of Boxes, or TileMap with which to check for
   *   overlap.
   * @param {Boolean} [returnAll=false]
   *   If this method is passed a Collection or TileMap, whether to return all
   *   items in the group that collide (true) or just the first one (false).
   * @param {Boolean} [collideWithSelf=false]
   *   Whether the Box should be considered to collide with itself.
   *
   * @return {Box/Box[]/Boolean}
   *   false if there is no overlap; otherwise, the first item to overlap, or
   *   an array of overlapping items if returnAll is true and collideWith is
   *   a Collection or TileMap.
   */
  collides: function(collideWith, returnAll, collideWithSelf) {
    if (collideWith instanceof Box && (collideWith !== this || !collideWithSelf)) {
      return this.overlaps(collideWith) ? collideWith : false;
    }
    var items = collideWith, found = [];
    if (typeof TileMap !== 'undefined' && collideWith instanceof TileMap) {
      items = collideWith.getAll();
    }
    for (var i = 0, l = items.length; i < l; i++) {
      if (this.overlaps(items[i]) && (items[i] !== this || !collideWithSelf)) {
        if (returnAll) {
          found.push(items[i]);
        }
        else {
          return items[i];
        }
      }
    }
    if (found.length) {
      return found;
    }
    return false;
  },
  /**
   * Determine whether this Box intersects another Box.
   *
   * See Box#collides() for a discussion of the difference.
   *
   * See Box#overlapsX() and Box#overlapsY() for the actual calculations.
   *
   * @param {Box} otherBox The other Box with which to check for collision.
   */
  overlaps: function(otherBox) {
    return this.overlapsX(otherBox) && this.overlapsY(otherBox);
  },
  /**
   * Determine whether this Box intersects another Box on the x-axis.
   *
   * See also Box#overlaps() and Box#overlapsY()
   *
   * @param {Box} otherBox The other Box with which to check for collision.
   */
  overlapsX: function(otherBox) {
    return this.x + this.width > otherBox.x && otherBox.x + otherBox.width > this.x;
  },
  /**
   * Determine whether this Box intersects another Box on the y-axis.
   *
   * See also Box#overlaps() and Box#overlapsX()
   *
   * @param {Box} otherBox The other Box with which to check for collision.
   */
  overlapsY: function(otherBox) {
    return this.y + this.height > otherBox.y && otherBox.y + otherBox.height > this.y;
  },
  /**
   * Determine whether the mouse is hovering over this Box.
   */
  isHovered: function() {
    if (typeof App.isHovered != 'function') {
      if (window.console && console.warn) {
        console.warn('Box#isHovered called, but App.isHovered does not exist.');
      }
      return false;
    }
    return App.isHovered(this);
  },
  /**
   * Listen for a specific event.
   *
   * To only run the callback the first time the event is triggered on this
   * Box, see Box#once(). To remove a callback, see Box#unlisten().
   *
   * @param {String} eventName
   *   The name of the event for which to listen, e.g. "click." The event can
   *   have a namespace using a dot, e.g. "click.custom" will bind to the
   *   "click" event with the "custom" namespace. Namespaces are useful for
   *   unlisten()ing to specific callbacks assigned to that namespace or for
   *   unlisten()ing to callbacks bound to a namespace across multiple events.
   * @param {Function} callback
   *   A function to execute when the relevant event is triggered on the
   *   listening object. The function's `this` object is the listening Box
   *   and it receives any other parameters passed by the trigger call. Usually
   *   an event object is the first parameter, and propagation can be stopped
   *   by calling the event's stopPropagation() method.
   * @param {Number} [weight=0]
   *   An integer indicating the order in which callbacks for the relevant
   *   event should be triggered. Lower numbers cause the callback to get
   *   triggered earlier than higher numbers. This can be useful for getting
   *   around the fact that the canvas doesn't track display order so event
   *   callbacks can't distinguish which object should be triggered first if
   *   multiple listening objects are overlapping.
   */
  listen: function(eventName, callback, weight) {
    if (App.Events) {
      App.Events.listen(this, eventName, callback, weight);
    }
    else if (window.console && console.warn) {
      console.warn('Box#listen called, but App.Events does not exist.');
    }
    return this;
  },
  /**
   * Listen for a specific event and only react the first time it is triggered.
   *
   * This method is exactly the same as Box#listen() except that the specified
   * callback is only executed the first time it is triggered. To remove a
   * callback, see Box#unlisten().
   *
   * @param {String} eventName
   *   The name of the event for which to listen, e.g. "click." The event can
   *   have a namespace using a dot, e.g. "click.custom" will bind to the
   *   "click" event with the "custom" namespace. Namespaces are useful for
   *   unlisten()ing to specific callbacks assigned to that namespace or for
   *   unlisten()ing to callbacks bound to a namespace across multiple events.
   * @param {Function} callback
   *   A function to execute when the relevant event is triggered on the
   *   listening object. The function's `this` object is the listening Box
   *   and it receives any other parameters passed by the trigger call. Usually
   *   an event object is the first parameter, and propagation can be stopped
   *   by calling the event's stopPropagation() method.
   * @param {Number} [weight=0]
   *   An integer indicating the order in which callbacks for the relevant
   *   event should be triggered. Lower numbers cause the callback to get
   *   triggered earlier than higher numbers. This can be useful for getting
   *   around the fact that the canvas doesn't track display order so event
   *   callbacks can't distinguish which object should be triggered first if
   *   multiple listening objects are overlapping.
   */
  once: function(eventName, callback, weight) {
    if (App.Events) {
      App.Events.once(this, eventName, callback, weight);
    }
    else if (window.console && console.warn) {
      console.warn('Box#once called, but App.Events does not exist.');
    }
    return this;
  },
  /**
   * Stop listening for a specific event.
   *
   * To listen for an event, use Box#listen() or Box#once().
   *
   * @param {String} eventName
   *   The name of the event for which to listen, e.g. "click." The event can
   *   have a namespace using a dot, e.g. "click.custom" will unbind obj's
   *   listeners for the "click" that are using the "custom" namespace. You can
   *   also unlisten to multiple events using the same namespace, e.g.
   *   ".custom" could unlisten to "mousemove.custom" and "touchmove.custom."
   *   If the event specified does not have a namespace, all callbacks will be
   *   unbound regardless of their namespace.
   */
  unlisten: function(eventName) {
    if (App.Events) {
      App.Events.unlisten(this, eventName);
    }
    else if (window.console && console.warn) {
      console.warn('Box#unlisten called, but App.Events does not exist.');
    }
    return this;
  },
  /**
   * Destroy the Box.
   *
   * By default, this method does nothing. Override this method to trigger an
   * event when the object is destroyed. For example, this could allow
   * displaying an explosion when a bullet hits a target.
   *
   * This method can also be used to release memory allocated when the Box is
   * initialized, though by default, only Players need to be destroy()ed to
   * release memory (specifically this releases keyboard control).
   */
  destroy: function() {},

  /**
   * @method stoodOn
   *
   * Invoked on solids every frame when an Actor is standing on them and
   * Actor#GRAVITY is enabled. This is useful for changing Actor behavior
   * depending on the surface. Example applications include making a surface
   * slippery (by changing {@link Actor#DAMPING_FACTOR}), making it bouncy (by
   * adding upward velocity), or changing the Actor's speed. This can also be
   * used for special actions like making the Box move only when a Player is
   * standing on it.
   *
   * @param {Actor} stander
   *   The Actor that is standing on this Box.
   */
  stoodOn: null,
});

/**
 * Actors are {@link Box Boxes} that can move.
 *
 * @extends Box
 */
var Actor = Box.extend({

  /**
   * The velocity the Actor can move in pixels per second.
   */
  MOVEAMOUNT: 400,

  /**
   * Whether gravity (downward acceleration) is enabled.
   *
   * This is effectively a toggle between a top-down and side view.
   */
  GRAVITY: false,

  /**
   * Gravitational acceleration in pixels per second-squared.
   *
   * Has no effect if GRAVITY is false. Setting to 0 (zero) has a similar
   * physical effect to disabling gravity.
   */
  G_CONST: 21,

  /**
   * Jump velocity (impulse) in pixels per second.
   *
   * Has no effect if GRAVITY is false. Set to 0 (zero) to disable jumping.
   */
  JUMP_VEL: 500,

  /**
   * The minimum number of seconds required between jumps.
   *
   * Has no effect if GRAVITY is false or JUMP_VEL is 0 (zero).
   */
  JUMP_DELAY: 0.25,

  /**
   * Percent of normal horizontal velocity Actors can move while in the air.
   *
   * Note that if Actors are moving horizontally before jumping, they keep
   * moving at the same speed in the air; in this case air control only takes
   * effect if they switch direction mid-air. Otherwise, air control only
   * applies if they started moving horizontally after they entered the air.
   */
  AIR_CONTROL: 0.25,

  /**
   * Whether to require that the jump key is released before jumping again.
   *
   * Specifically, this is a boolean which, when true, restricts the Actor from
   * jumping after being in the air until after the Actor is on the ground with
   * the jump key released. This limits the ability to "bounce" by holding down
   * the jump key. This behavior depends on being notified of when keys are
   * released via the release() method, which happens automatically for
   * Players. If you enable this for standard Actors, the meaning of a "key
   * press" is artificial, so you must make sure to call release() before you
   * make the Actor jump again.
   */
  JUMP_RELEASE: false,

  /**
   * The number of times an Actor can jump without touching the ground.
   *
   * -1 allows the Actor to jump in the air an infinite number of times. A
   * value of zero is the same as a value of one (i.e. a value of zero will not
   * stop the Actor from having one jump).
   */
  MULTI_JUMP: 0,

  /**
   * Whether to make the Actor continue moving in the last direction specified.
   */
  CONTINUOUS_MOVEMENT: false,

  /**
   * Whether the Actor will be restricted to not move outside the world.
   */
  STAY_IN_WORLD: true,

  /**
   * The fractional velocity damping factor.
   *
   * If set, this affects whether the Actor can turn on a dime or how much it
   * slides around. Higher means more movement control (less sliding).
   *
   * If you want specific surfaces to feel slippery, set this when the Actor
   * moves onto and off of those surfaces. One way to do this is using the
   * {@link Box#stoodOn stoodOn() method}.
   *
   * Numeric values are interpreted as damping factors. If this is null, full
   * damping is applied (the Actor stops and turns on a dime).
   *
   * Damping does not affect vertical movement when gravity is enabled.
   */
  DAMPING_FACTOR: null,

  /**
   * The last direction (key press) that resulted in looking in a direction.
   *
   * If GRAVITY is enabled, this Array will only contain left or right keys.
   * This is because left/right+up/down is a valid direction but does not
   * result in looking diagonally.
   */
  lastLooked: [],

  /**
   * Whether the Actor is being mouse-dragged.
   * @readonly
   */
  isBeingDragged: false,

  /**
   * An Array of target Boxes onto which this Actor can be dropped.
   *
   * You must call Actor#setDraggable(true) to enable dragging the Actor.
   *
   * Drop targets can change how they look when a draggable object is hovered
   * over them by testing `this.isHovered() && App.isSomethingBeingDragged` in
   * their {@link Box#draw draw()} methods. They can change how they look or
   * perform some action when a draggable object is dropped onto them by
   * listening for the {@link Box#event-canvasdrop canvasdrop event}.
   */
  dropTargets: [],

  /**
   * The horizontal component of the velocity.
   *
   * Use Actor#getVelocityVector() if you want to get velocity as a vector.
   */
  xVelocity: 0,

  /**
   * The vertical component of the velocity.
   *
   * Use Actor#getVelocityVector() if you want to get velocity as a vector.
   */
  yVelocity: 0,

  /**
   * The horizontal component of the acceleration.
   *
   * Use Actor#getAccelerationVector() if you want to get acceleration as a
   * vector.
   */
  xAcceleration: 0,

  /**
   * The vertical component of the acceleration.
   *
   * Use Actor#getAccelerationVector() if you want to get acceleration as a
   * vector.
   */
  yAcceleration: 0,

  /**
   * Keys specific to this actor.
   *
   * Defaults to the global {@link global#keys keys} if not set (and uses the
   * same structure).
   *
   * See also Actor#processInput().
   */
  keys: undefined,

  // Used internally; not publicly documented. Reading is okay, but don't write.
  lastJump: 0, // Time when the last jump occurred in milliseconds since the epoch
  lastDirection: [], // The last direction (i.e. key press) passed to processInput()
  jumpDirection: {right: false, left: false}, // Whether the Actor was moving horizontally before jumping
  jumpKeyDown: false, // Whether the jump key is currently pressed
  numJumps: 0, // Number of jumps since the last time the Actor was touching the ground
  inAir: false, // Whether the Actor is in the air
  fallLeft: null, // The direction the Actor was moving before falling
  isDraggable: false, // Whether the Actor is draggable
  dragStartX: 0, // Last position of the Actor before being dragged
  dragStartY: 0, // Last position of the Actor before being dragged
  animLoop: '', // Current SpriteMap animation sequence

  /**
   * @constructor
   *   Initialize an Actor.
   *
   * Takes the same parameters as the Box constructor.
   * **Inherited documentation:**
   *
   * @inheritdoc Box#constructor
   */
  init: function() {
    this._super.apply(this, arguments);
    this.lastX = this.x;
    this.lastY = this.y;
    this.lastDirection = [];
    this.lastLooked = [];
    this.jumpDirection = {right: false, left: false};
    this.dropTargets = [];
    if (arguments.length < 5) {
      this.fillStyle = 'lightBlue';
    }
  },

  /**
   * @inheritdoc Box#draw
   */
  draw: function() {
    if (this.src instanceof SpriteMap && this.animLoop) {
      this.src.use(this.animLoop); // Switch to the active animation loop
    }
    return this._super.apply(this, arguments);
  },

  /**
   * Actors draw as a smiley face by default.
   *
   * **Inherited documentation:**
   *
   * @inheritdoc Box#drawDefault
   */
  drawDefault: function(ctx, x, y, w, h) {
    x = x + w/2;
    y = y + h/2;
    var r = (w+h)/4;

    // Circle
    ctx.circle(x, y, r, this.fillStyle, 'black');

    // Smile
    ctx.beginPath();
    ctx.arc(x, y, r*0.6, Math.PI*0.1, Math.PI*0.9, false);
    ctx.lineWidth = Math.max(Math.ceil(r/15), 1);
    ctx.strokeStyle = 'black';
    ctx.stroke();

    // Eyes
    ctx.beginPath();
    ctx.arc(x - r*0.3, y - r*0.25, Math.max(Math.ceil(r/15), 1), 0, 2 * Math.PI, false);
    ctx.fillStyle = 'black';
    ctx.fill();
    ctx.arc(x + r*0.3, y - r*0.25, Math.max(Math.ceil(r/15), 1), 0, 2 * Math.PI, false);
    ctx.fill();
  },

  /**
   * Update the Actor for a new frame.
   *
   * @param {String[]} [direction]
   *   An Array of directions in which to move the Actor. Directions are
   *   expected to correspond to keys on the keyboard (as described by
   *   {@link jQuery.hotkeys}).
   */
  update: function(direction) {
    this.lastX = this.x;
    this.lastY = this.y;
    if (this.isBeingDragged && window.Mouse) {
      this.x = Mouse.Coords.worldX() - this.width/2;
      this.y = Mouse.Coords.worldY() - this.height/2;
    }
    else {
      this.processInput(direction);
      this.ambientAcceleration();
      this.move();
      if (App.Utils.almostEqual(this.lastX, this.x, 0.000001)) {
        this.fallLeft = null;
      }
      // If we're not actually falling, collideSolid() will catch us.
      if (this.GRAVITY &&
          (this.y + this.height != world.height || !this.STAY_IN_WORLD)) {
        this.startFalling();
      }
    }
    this.updateAnimation();
    this.dampVelocity();
  },

  /**
   * Process directions and adjust motion accordingly.
   *
   * Called from Actor#update().
   *
   * @param {String[]} direction
   *   An Array of directions in which to move the Actor. Valid directions are
   *   expected to correspond to keys on the keyboard by default (as described
   *   by {@link jQuery.hotkeys}) though for Actors that are not Players the
   *   directions will not normally be sent from actual key presses.
   */
  processInput: function(direction) {
    var left = false,
        right = false,
        looked = false,
        anyIn = App.Utils.anyIn,
        keys = this.keys || window.keys;
    // Bail if someone deleted the keys variable.
    if (typeof keys === 'undefined') {
      return;
    }
    if (typeof direction === 'undefined' || direction.length === 0) {
      // For continuous movement, if no direction is given, use the last one.
      if (this.CONTINUOUS_MOVEMENT) {
        direction = this.lastLooked;
      }
      // No need to keep processing if no directions were given.
      else {
        return;
      }
    }
    this.lastDirection = direction.slice(); // shallow copy

    // Move left.
    if (anyIn(keys.left, direction)) {
      left = true;
      looked = true;
      this.fallLeft = true;
      if (this.GRAVITY && this.isInAir()) {
        if (this.jumpDirection.right || !this.jumpDirection.left) {
          this.xVelocity = -this.MOVEAMOUNT * this.AIR_CONTROL;
          this.jumpDirection.right = false;
          this.jumpDirection.left = false;
        }
      }
      else {
        this.xVelocity = -this.MOVEAMOUNT;
      }
    }
    // Move right.
    else if (anyIn(keys.right, direction)) {
      right = true;
      looked = true;
      this.fallLeft = false;
      if (this.GRAVITY && this.isInAir()) {
        if (this.jumpDirection.left || !this.jumpDirection.right) {
          this.xVelocity = this.MOVEAMOUNT * this.AIR_CONTROL;
          this.jumpDirection.right = false;
          this.jumpDirection.left = false;
        }
      }
      else {
        this.xVelocity = this.MOVEAMOUNT;
      }
    }

    // Move up / jump.
    if (anyIn(keys.up, direction)) {
      if (!this.GRAVITY) {
        this.yVelocity = -this.MOVEAMOUNT;
        looked = true;
      }
      else if (!this.isInAir() ||
          this.MULTI_JUMP > this.numJumps ||
          this.MULTI_JUMP == -1) {
        var now = App.physicsTimeElapsed;
        if (now - this.lastJump > this.JUMP_DELAY && // sufficient delay
            (!this.JUMP_RELEASE || !this.jumpKeyDown)) { // press jump again
          this.yVelocity = -this.JUMP_VEL;
          this.yAcceleration = 0; // Don't aggregate gravity
          this.lastJump = now;
          this.jumpDirection.right = right;
          this.jumpDirection.left = left;
          this.numJumps++;
          this.inAir = true;
        }
      }
      this.jumpKeyDown = true;
    }
    // Move down.
    else if (anyIn(keys.down, direction)) {
      if (!this.isInAir() || !this.GRAVITY) { // don't allow accelerating downward when falling
        this.yVelocity = this.MOVEAMOUNT;
        looked = true;
      }
    }

    if (looked) {
      this.lastLooked = direction.slice(); // shallow copy
      // Avoid looking anywhere but right or left if gravity is enabled.
      // If we didn't have this here, we would be able to look diagonally.
      if (this.GRAVITY) {
        for (var i = this.lastLooked.length-1; i >= 0; i--) {
          if (keys.left.indexOf(this.lastLooked[i]) == -1 &&
              keys.right.indexOf(this.lastLooked[i]) == -1) {
            this.lastLooked.splice(i, 1);
          }
        }
      }
    }
  },

  /**
   * Calculate acceleration from the environment.
   *
   * Acceleration from user input is calculated in Actor#processInput().
   */
  ambientAcceleration: function() {
    // Gravity.
    if (this.GRAVITY) {
      // Air movement (not initiated by user input).
      if (this.isInAir()) {
        this.yAcceleration += this.G_CONST;
        if (this.jumpDirection.left) {
          this.xVelocity = -this.MOVEAMOUNT;
        }
        else if (this.jumpDirection.right) {
          this.xVelocity = this.MOVEAMOUNT;
        }
      }
      else {
        this.stopFalling();
      }
    }
  },

  /**
   * Actually move the Actor.
   */
  move: function() {
    var delta = App.physicsDelta, d2 = delta / 2;
    // Apply half acceleration (first half of midpoint formula)
    this.xVelocity += this.xAcceleration*d2;
    this.yVelocity += this.yAcceleration*d2;
    // Don't let diagonal movement be faster than axial movement
    var xV = this.xVelocity, yV = this.yVelocity;
    if (xV !== 0 && yV !== 0 && !this.GRAVITY) {
      var magnitude = Math.max(Math.abs(xV), Math.abs(yV));
      var origMag = Math.sqrt(xV*xV + yV*yV);
      var scale = magnitude / origMag;
      this.xVelocity *= scale;
      this.yVelocity *= scale;
    }
    // Apply thrust
    this.x += this.xVelocity*delta;
    this.y += this.yVelocity*delta;
    // Apply half acceleration (second half of midpoint formula)
    this.xVelocity += this.xAcceleration*d2;
    this.yVelocity += this.yAcceleration*d2;
    // Clip
    this.stayInWorld();
  },

  /**
   * Force the Actor to stay inside the world.
   */
  stayInWorld: function() {
    if (this.STAY_IN_WORLD) {
      if (this.x < 0) {
        this.x = 0;
      }
      else if (this.x + this.width > world.width) {
        this.x = world.width - this.width;
      }
      if (this.y < 0) {
        this.y = 0;
      }
      else if (this.y + this.height > world.height) {
        this.y = world.height - this.height;
        this.stopFalling();
      }
    }
  },

  /**
   * Damp the Actor's velocity.
   *
   * This affects how much control the Actor has over its movement, i.e.
   * whether the Actor can stop and turn on a dime or whether it slides around
   * with momentum.
   */
  dampVelocity: function() {
    if (this.DAMPING_FACTOR !== null &&
        !App.Utils.almostEqual(this.xVelocity, 0, 0.0001)) {
      this.xVelocity *= 1 - this.DAMPING_FACTOR * App.physicsDelta;
      if (!this.GRAVITY && !App.Utils.almostEqual(this.yVelocity, 0, 0.0001)) {
        this.yVelocity *= 1 - this.DAMPING_FACTOR * App.physicsDelta;
      }
      return;
    }
    this.xVelocity = 0;
    if (!this.GRAVITY) {
      this.yVelocity = 0;
    }
  },

  /**
   * Add velocity as a vector.
   *
   * See also Actor#setVelocityVector() and Actor#getVelocityVector().
   *
   * @param {Number} radialDir The direction of the vector to add, in radians.
   * @param {Number} magnitude The magnitude ot the vector to add, in pixels.
   */
  addVelocityVector: function(radialDir, magnitude) {
    this.xVelocity += magnitude * Math.cos(radialDir);
    this.yVelocity += magnitude * Math.sin(radialDir);
  },

  /**
   * Set velocity as a vector.
   *
   * See also Actor#addVelocityVector() and Actor#getVelocityVector().
   *
   * @param {Number} radialDir The direction of the vector to set, in radians.
   * @param {Number} magnitude The magnitude ot the vector to set, in pixels.
   */
  setVelocityVector: function(radialDir, magnitude) {
    this.xVelocity = magnitude * Math.cos(radialDir);
    this.yVelocity = magnitude * Math.sin(radialDir);
  },

  /**
   * Get the velocity vector.
   *
   * See also Actor#addVelocityVector() and Actor#setVelocityVector().
   *
   * @return {Object}
   *   An object with `magnitude` and `direction` attributes indicating the
   *   velocity of the Actor.
   */
  getVelocityVector: function() {
    return {
      magnitude: Math.sqrt(this.xVelocity*this.xVelocity + this.yVelocity*this.yVelocity),
      direction: Math.atan2(this.yVelocity, this.xVelocity),
    };
  },

  /**
   * Add acceleration as a vector.
   *
   * See also Actor#setAccelerationVector() and Actor#getAccelerationVector().
   *
   * @param {Number} radialDir The direction of the vector to add, in radians.
   * @param {Number} magnitude The magnitude ot the vector to add, in pixels.
   */
  addAccelerationVector: function(radialDir, magnitude) {
    this.xAcceleration += magnitude * Math.cos(radialDir);
    this.yAcceleration += magnitude * Math.sin(radialDir);
  },

  /**
   * Set acceleration as a vector.
   *
   * See also Actor#addAccelerationVector() and Actor#getAccelerationVector().
   *
   * @param {Number} radialDir The direction of the vector to set, in radians.
   * @param {Number} magnitude The magnitude ot the vector to set, in pixels.
   */
  setAccelerationVector: function(radialDir, magnitude) {
    this.xAcceleration = magnitude * Math.cos(radialDir);
    this.yAcceleration = magnitude * Math.sin(radialDir);
  },

  /**
   * Get the acceleration vector.
   *
   * See also Actor#addAccelerationVector() and Actor#setAccelerationVector().
   *
   * @return {Object}
   *   An object with `magnitude` and `direction` attributes indicating the
   *   acceleration of the Actor.
   */
  getAccelerationVector: function() {
    return {
      magnitude: Math.sqrt(this.xVelocity*this.xVelocity + this.yVelocity*this.yVelocity),
      direction: Math.atan2(this.yVelocity, this.xVelocity), // yes, this order is correct
    };
  },

  /**
   * Move this Actor outside of another Box so that it no longer overlaps.
   *
   * This is called as part of Actor#collideSolid().
   *
   * See also Actor#moveOutsideX() and Actor#moveOutsideY().
   *
   * @param {Box} other
   *   The other Box that this Actor should be moved outside of.
   *
   * @return {Object}
   *   An object with `x` and `y` properties indicating how far this Actor
   *   moved in order to be outside of the other Box, in pixels.
   */
  moveOutside: function(other) {
    var overlapsX = Math.min(this.x + this.width - other.x, other.x + other.width - this.x),
        overlapsY = Math.min(this.y + this.height - other.y, other.y + other.height - this.y);

    // It matters which axis we move first.
    if (overlapsX <= overlapsY) {
      return {
        x: this.moveOutsideX(other),
        y: this.moveOutsideY(other),
      };
    }
    return {
      y: this.moveOutsideY(other),
      x: this.moveOutsideX(other),
    };
  },

  /**
   * Move this Actor outside of another Box on the x-axis to avoid overlap.
   *
   * See also Actor#moveOutside().
   *
   * @param {Box} other
   *   The other Box that this Actor should be moved outside of.
   *
   * @return {Number}
   *   The distance in pixels that this Actor moved on the x-axis.
   */
  moveOutsideX: function(other) {
    var moved = 0, movedTo;
    // Only adjust if we're intersecting
    if (this.overlaps(other)) {
      // If our center is left of their center, move to the left side
      if (this.x + this.width / 2 < other.x + other.width / 2) {
        movedTo = other.x - this.width - 0.01;
      }
      // If our center is right of their center, move to the right side
      else {
        movedTo = other.x + other.width + 0.01;
      }
      moved = movedTo - this.x;
      this.x = movedTo;
    }
    return moved;
  },

  /**
   * Move this Actor outside of another Box on the y-axis to avoid overlap.
   *
   * See also Actor#moveOutside().
   *
   * @param {Box} other
   *   The other Box that this Actor should be moved outside of.
   *
   * @return {Number}
   *   The distance in pixels that this Actor moved on the y-axis.
   */
  moveOutsideY: function(other) {
    var moved = 0, movedTo;
    // Only adjust if we're intersecting
    if (this.overlaps(other)) {
      // If our center is above their center, move to the top
      if (this.y + this.height / 2 <= other.y + other.height / 2) {
        movedTo = other.y - this.height - 1;
      }
      // If our center is below their center, move to the bottom
      else {
        movedTo = other.y + other.height + 1;
      }
      moved = movedTo - this.y;
      this.y = movedTo;
    }
    return moved;
  },

  /**
   * Start falling.
   *
   * This method has no meaning if {@link Actor#GRAVITY GRAVITY} is false.
   *
   * Related: Actor#stopFalling(), Actor#isInAir(), Actor#isJumping(),
   * Actor#isFalling(), Actor#hasAirMomentum()
   */
  startFalling: function() {
    // Keep going at the same horizontal speed when walking off a ledge.
    if (!this.inAir && this.fallLeft !== null) {
      this.jumpDirection.left = this.fallLeft;
      this.jumpDirection.right = !this.fallLeft;
    }
    this.inAir = true;
  },

  /**
   * Notify the Actor that it has landed.
   *
   * This method has no meaning if GRAVITY is false.
   *
   * Related: Actor#startFalling(), Actor#isInAir(), Actor#isJumping(),
   * Actor#isFalling(), Actor#hasAirMomentum()
   */
  stopFalling: function() {
    if (this.yAcceleration > 0) {
      this.yAcceleration = 0;
    }
    if (this.yVelocity > 0) {
      this.yVelocity = 0;
    }
    this.numJumps = 0;
    this.inAir = false;
  },

  /**
   * Check whether the Actor is in the air or not.
   *
   * Related: Actor#startFalling(), Actor#stopFalling(), Actor#isJumping(),
   * Actor#isFalling(), Actor#hasAirMomentum()
   */
  isInAir: function() {
    return this.inAir;
  },

  /**
   * Check whether the Actor is jumping or not.
   *
   * Related: Actor#startFalling(), Actor#stopFalling(), Actor#isInAir(),
   * Actor#isFalling(), Actor#hasAirMomentum()
   */
  isJumping: function() {
    return this.numJumps > 0;
  },

  /**
   * Check whether the Actor is in the air from falling (as opposed to jumping).
   *
   * Related: Actor#startFalling(), Actor#stopFalling(), Actor#isInAir(),
   * Actor#isJumping(), Actor#hasAirMomentum()
   */
  isFalling: function() {
    return this.isInAir() && this.numJumps === 0;
  },

  /**
   * Check whether the Actor has air momentum (as opposed to air control).
   *
   * Related: Actor#startFalling(), Actor#stopFalling(), Actor#isInAir(),
   * Actor#isJumping(), Actor#isFalling()
   */
  hasAirMomentum: function() {
    return this.fallLeft !== null ||
      this.jumpDirection.left ||
      this.jumpDirection.right;
  },

  /**
   * Check whether this Actor is standing on top of a Box.
   *
   * @param {Box/Collection/TileMap} box The Box or set of Boxes to check.
   */
  standingOn: function(box) {
    if ((typeof Collection !== 'undefined' && box instanceof Collection) ||
        (typeof TileMap !== 'undefined' && box instanceof TileMap)) {
      var items = box.getAll();
      for (var i = 0, l = items.length; i < l; i++) {
        if (this.standingOn(items[i])) {
          return true;
        }
      }
      return false;
    }
    return this.overlapsX(box) &&
      App.Utils.almostEqual(this.y + this.height, box.y, 1);
  },

  /**
   * Check collision with solids and adjust the Actor's position as necessary.
   *
   * This method has the side-effect that it will stop the Actor from falling
   * if it is standing on a Box.
   *
   * The collision checking here uses AABB detection, meaning it uses upright
   * rectangles. It is accurate, but not as fast as it could be if there are
   * many objects to check against. If you need faster collision checking
   * against many objects and you're willing to do it manually, consider
   * implementing
   * [spatial partitioning](http://buildnewgames.com/broad-phase-collision-detection/).
   * If you need different collision models (for example with rotated
   * rectangles or different shapes) or if you need more advanced physics
   * simulation (for example to model springs) consider using the
   * [Box2D library](https://github.com/kripken/box2d.js/).
   *
   * @param {Box/Collection/TileMap} collideWith
   *   A Box, Collection, or TileMap of objects with which to check collision.
   *
   * @return {Object}
   *   An Object with `x` and `y` properties, both Booleans indicating whether
   *   the Actor collided with something in the respective direction.
   */
  collideSolid: function(collideWith) {
    var collided = {x: 0, y: 0};
    if (collideWith instanceof Box || collideWith instanceof ImageWrapper) {
      collided = this._collideSolidBox(collideWith);
    }
    else if ((typeof Collection !== 'undefined' && collideWith instanceof Collection) ||
        (typeof TileMap !== 'undefined' && collideWith instanceof TileMap)) {
      var items = collideWith.getAll();
      for (var i = 0, l = items.length; i < l; i++) {
        var c = this._collideSolidBox(items[i]);
        if (c.x) {
          collided.x = c.x;
        }
        if (c.y) {
          collided.y = c.y;
        }
      }
    }
    collided.x = !!collided.x;
    collided.y = !!collided.y;
    this.updateAnimation(collided);
    return collided;
  },

  /**
   * Check collision with a single solid and adjust the Actor's position.
   *
   * This method has the side-effect that it will stop the Actor from falling if
   * it is standing on the Box.
   *
   * See also Actor#collideSolid().
   *
   * @param {Box} collideWith
   *   A Box with which to check collision.
   *
   * @return {Object}
   *   An object with `x` and `y` properties indicating how far this Actor
   *   moved in order to be outside of the Box, in pixels. If both properties
   *   are `0` then the Actor and Box do not overlap.
   *
   * @ignore
   */
  _collideSolidBox: function(collideWith) {
    // "Falling" here really just means "not standing on top of this Box."
    var falling = true, collided = {x: 0, y: 0};
    // If we moved a little too far and now intersect a solid, back out.
    if (this.overlaps(collideWith)) {
      collided = this.moveOutside(collideWith);
    }
    // If gravity is on, check standing/falling behavior.
    if (this.GRAVITY) {
      // We actually want to check if the last X-position would have been
      // standing, so move back there, check, and then move back to the current
      // position. This is because if a player jumps while moving towards a
      // wall, they could match the standing condition as they just barely
      // reach the top, which will stop their jump arc. If their x-position
      // from the last frame would have been standing, though, we can assume
      // they were already standing rather than jumping.
      var x = this.x;
      this.x = this.lastX;
      if (this.standingOn(collideWith)) {
        this.stopFalling();
        falling = false;
        if (typeof collideWith.stoodOn == 'function') {
          collideWith.stoodOn(this);
        }
      }
      this.x = x;
      // If we're in the air and we hit something, stop the momentum.
      if (falling && (collided.x || collided.y)) {
        // If we hit the bottom, stop rising.
        if (App.Utils.almostEqual(this.y, collideWith.y + collideWith.height, 1)) {
          if (this.yAcceleration < 0) {
            this.yAcceleration = 0;
          }
          if (this.yVelocity < 0) {
            this.yVelocity = 0;
          }
        }
        // If we hit a side, stop horizontal momentum.
        else {
          this.jumpDirection.left = false;
          this.jumpDirection.right = false;
        }
      }
    }
    return collided;
  },

  /**
   * Change the Actor's animation sequence if it uses a {@link SpriteMap}.
   *
   * All animations fall back to the "stand" animation if they are not
   * available. The "jumpRight" and "jumpLeft" sequences will try to fall back
   * to the "lookRight" and "lookLeft" sequences first, respectively, if they
   * are not available. Animations that will play by default if they are
   * available include:
   *
   * - stand (required)
   * - left
   * - right
   * - up
   * - down
   * - upRight
   * - upLeft
   * - downRight
   * - downLeft
   * - jump
   * - fall
   * - jumpRight
   * - jumpLeft
   * - lookRight
   * - lookLeft
   * - lookUp
   * - lookDown
   * - lookUpRight
   * - lookUpLeft
   * - lookDownRight
   * - lookDownLeft
   * - drag
   *
   * Override this function if you want to modify the custom rules for which
   * animations to play (or what the animations' names are).
   *
   * This function does nothing if the Actor's `src` attribute is not a
   * SpriteMap.
   *
   * See also Actor#useAnimation().
   *
   * @param {Object} [collided]
   *   An Object with `x` and `y` properties, both Booleans indicating whether
   *   the Actor collided with something in the respective direction.
   */
  updateAnimation: function(collided) {
    if (!(this.src instanceof SpriteMap)) {
      return;
    }
    var keys = this.keys || window.keys,
        lastDirection = this.lastDirection,
        anyIn = App.Utils.anyIn,
        keysIsDefined = typeof keys !== 'undefined'; // Don't fail if "keys" was removed
    // Don't let shooting make us change where we're looking.
    if (keysIsDefined &&
        typeof keys.shoot !== 'undefined' &&
        anyIn(keys.shoot, lastDirection)) {
      lastDirection = this.lastLooked;
    }
    if (this.isBeingDragged) {
      this.useAnimation('drag', 'stand');
    }
    else if (this.isInAir()) {
      if (this.x > this.lastX) {
        this.useAnimation('jumpRight', 'lookRight', 'stand');
      }
      else if (this.x < this.lastX) {
        this.useAnimation('jumpLeft', 'lookLeft', 'stand');
      }
      else if (this.isJumping()) {
        this.useAnimation('jump', 'stand');
      }
      else {
        this.useAnimation('fall', 'stand');
      }
    }
    else if (this.y > this.lastY) {
      if (this.x > this.lastX) {
        this.useAnimation('downRight', 'stand');
      }
      else if (this.x < this.lastX) {
        this.useAnimation('downLeft', 'stand');
      }
      else {
        this.useAnimation('down', 'stand');
      }
    }
    else if (this.y < this.lastY) {
      if (this.x > this.lastX) {
        this.useAnimation('upRight', 'stand');
      }
      else if (this.x < this.lastX) {
        this.useAnimation('upLeft', 'stand');
      }
      else {
        this.useAnimation('up', 'stand');
      }
    }
    else if (this.x > this.lastX) {
      this.useAnimation('right', 'stand');
    }
    else if (this.x < this.lastX) {
      this.useAnimation('left', 'stand');
    }
    else if (keysIsDefined && anyIn(keys.up, lastDirection)) {
      if (anyIn(keys.right, lastDirection)) {
        this.useAnimation('lookUpRight', 'stand');
      }
      else if (anyIn(keys.left, lastDirection)) {
        this.useAnimation('lookUpLeft', 'stand');
      }
      else {
        this.useAnimation('lookUp', 'stand');
      }
    }
    else if (keysIsDefined && anyIn(keys.down, lastDirection)) {
      if (anyIn(keys.right, lastDirection)) {
        this.useAnimation('lookDownRight', 'stand');
      }
      else if (anyIn(keys.left, lastDirection)) {
        this.useAnimation('lookDownLeft', 'stand');
      }
      else {
        this.useAnimation('lookDown', 'stand');
      }
    }
    else if (keysIsDefined && anyIn(keys.right, lastDirection)) {
      this.useAnimation(collided && collided.x ? 'right' : 'lookRight', 'stand');
    }
    else if (keysIsDefined && anyIn(keys.left, lastDirection)) {
      this.useAnimation(collided && collided.x ? 'left' : 'lookLeft', 'stand');
    }
    else {
      this.useAnimation('stand');
    }
  },

  /**
   * Try to switch to a different {@link SpriteMap} animation sequence.
   *
   * Takes animation sequence names as arguments as switches to the first named
   * sequence that exists in the SpriteMap. If you already know what animation
   * sequences you have available, you might as well just call `this.src.use()`
   * directly.
   *
   * See also Actor#updateAnimation().
   *
   * @param {Arguments} ...
   *   Animation sequence names. Switches to the first one that the SpriteMap
   *   defines.
   *
   * @return {String/Boolean}
   *   The name of the animation sequence to which the Actor switched, if
   *   successful; false otherwise.
   */
  useAnimation: function() {
    if (typeof this.src.maps === 'undefined') {
      return;
    }
    for (var i = 0; i < arguments.length; i++) {
      var a = arguments[i];
      if (this.src.maps[a]) {
        this.animLoop = a;
        return a;
      }
    }
    return false;
  },

  /**
   * Toggle whether the Actor can be dragged around by the mouse.
   *
   * Note that dragged Actors still follow collision rules. (It is possible to
   * drag an Actor through a wall, but Actors cannot be dropped inside of
   * something solid they collide with.)
   *
   * @param {Boolean} on Whether to enable or disable dragging.
   */
  setDraggable: function(on) {
    if (this.isDraggable && on) {
      return this;
    }
    else if (!on) {
      this.isDraggable = false;
      this.unlisten('.drag');
      return this;
    }
    else if (!App.Events) {
      if (window.console && console.warn) {
        console.warn('Actor#setDraggable called, but App.Events does not exist.');
      }
      return this;
    }
    else if (!window.Mouse) {
      if (window.console && console.warn) {
        console.warn('Actor#setDraggable called, but window.Mouse does not exist.');
      }
      return this;
    }
    this.isDraggable = true;
    this.listen('mousedown.drag touchstart.drag', function() {
      App.isSomethingBeingDragged = true;
      this.isBeingDragged = true;
      this.dragStartX = this.x;
      this.dragStartY = this.y;
      /**
       * @event canvasdragstart
       *   Fires on the document when the user begins dragging an object,
       *   i.e. when the player clicks on or touches an object. Multiple
       *   objects can be dragged at once if they overlap, and this event will
       *   be triggered once for each of them.
       * @param {Actor} obj The object being dragged.
       * @member global
       */
      jQuery(document).trigger('canvasdragstart', [this]);
    });
    this.listen('canvasdragstop.drag', function() {
      this.isBeingDragged = false;
      // If there are no drop targets, the Actor can be dropped anywhere.
      // If there are drop targets and we're not over one, snap back to the
      // starting point.
      var target = this.collides(this.dropTargets);
      if (this.dropTargets.length && !target) {
        this.x = this.dragStartX;
        this.y = this.dragStartY;
      }
      else if (target) {
        /**
         * @event canvasdrop
         *   Fires on the document when a draggable Actor is dropped onto a
         *   target. This is used **internally** to trigger the event on the
         *   target directly.
         * @param {Box} target The drop target.
         * @member global
         * @ignore
         */
        jQuery(document).trigger('canvasdrop', [target]);
      }
    });
    return this;
  },

  /**
   * Determine whether this Actor is draggable.
   */
  getDraggable: function() {
    return this.isDraggable;
  },

  /**
   * Notify the Actor that a direction is no longer being given.
   *
   * This is useful when Actors need to distinguish between directions being
   * given continuously (such as when holding down a key) and those being given
   * intermittently (such as a simple key press).
   *
   * @param {String[]} releasedDirections
   *   An Array containing directions that are no longer being given.
   */
  release: function(releasedDirections) {
    var keys = this.keys || window.keys;
    if (this.GRAVITY && typeof keys !== 'undefined' &&
        App.Utils.anyIn(keys.up, releasedDirections)) {
      this.jumpKeyDown = false;
    }
  },
});

/**
 * The Player object controlled by the user.
 *
 * Multiple Players are supported. If you instantiate multiple Players, you
 * will usually want to set different {@link Actor#keys keys} for them.
 *
 * If the world is bigger than the canvas, the viewport will shift as a Player
 * moves toward an edge of the viewport. Sane viewport shifting is not
 * guaranteed with multiple Players.
 *
 * @extends Actor
 */
var Player = Actor.extend({
  /**
   * The default threshold for how close a Player has to be to an edge before
   * the viewport shifts (in percent of canvas size). To have the viewport move
   * only when the Player is actually at its edge, try a value close to zero.
   * To have the viewport move with the Player, try a value close to 0.5.
   */
  MOVEWORLD: 0.45,

  /**
   * Whether to require that the jump key is released before jumping again.
   *
   * Specifically, this is a boolean which, when true, restricts the Actor from
   * jumping after being in the air until after the Actor is on the ground with
   * the jump key released. This limits the ability to "bounce" by holding down
   * the jump key. This behavior depends on being notified of when keys are
   * released via the release() method, which happens automatically for
   * Players. If you enable this for standard Actors, the meaning of a "key
   * press" is artificial, so you must make sure to call release() before you
   * make the Actor jump again.
   */
  JUMP_RELEASE: true,

  /**
   * @constructor
   *   Initialize a Player.
   *
   * Takes the same parameters as the Box constructor.
   * **Inherited documentation:**
   *
   * @inheritdoc Box#constructor
   */
  init: function() {
    this._super.apply(this, arguments);
    if (arguments.length > 0) {
      world.centerViewportAround(this.x, this.y);
    }
    var t = this;
    this.__keytracker = function() {
      // lastKeyPressed() actually contains all keys that were pressed at the
      // last key event, whereas event.keyPressed just holds the single key
      // that triggered the event.
      if (jQuery.hotkeys) {
        t.release([jQuery.hotkeys.lastKeyPressed()]);
      }
    };
    // Notify the Player object when keys are released.
    jQuery(document).on('keyup.release', this.__keytracker);
  },

  /**
   * Override Actor#processInput() to respond to keyboard input automatically.
   *
   * **Inherited documentation:**
   *
   * @inheritdoc Actor#processInput
   */
  processInput: function(direction) {
    if (typeof direction === 'undefined' && jQuery.hotkeys) {
      direction = jQuery.hotkeys.keysDown;
    }
    return this._super(direction);
  },

  /**
   * Override Actor#update() to move the viewport as the Player nears an edge.
   *
   * **Inherited documentation:**
   *
   * @inheritdoc Actor#update
   */
  update: function(direction) {
    this._super(direction);
    if (!this.isBeingDragged) {
      this.adjustViewport();
    }
  },

  /**
   * Toggle whether the Player can be dragged around by the mouse.
   *
   * **Inherited documentation:**
   *
   * @inheritdoc Actor#setDraggable
   */
  setDraggable: function(on) {
    if (on && !this.isDraggable && App.Events && window.Mouse) {
      this.listen('canvasdragstop.drag', function() {
        if (this.isBeingDragged &&
            (!this.dropTargets.length || this.collides(this.dropTargets))) {
          world.centerViewportAround(this.x, this.y);
        }
      }, -1);
    }
    return this._super.apply(this, arguments);
  },

  /**
   * Move the viewport when the Player gets near the edge.
   *
   * @return {Object}
   *   An object with `x` and `y` properties indicating the number of pixels
   *   this method caused the viewport to shift along each axis.
   */
  adjustViewport: function() {
    var xOffset = world.xOffset,
        yOffset = world.yOffset,
        changed = {x: 0, y: 0};
    // We should only have mouse or player scrolling, but not both.
    if (window.Mouse && Mouse.Scroll.isEnabled()) {
      return changed;
    }
    // left
    if (xOffset > 0 && this.x + this.width/2 - xOffset < canvas.width * this.MOVEWORLD) {
      world.xOffset = Math.max(xOffset + (this.x - this.lastX), 0);
      context.translate(xOffset - world.xOffset, 0);
      changed.x = xOffset - world.xOffset;
    }
    // right
    else if (xOffset < world.width - canvas.width &&
        this.x + this.width/2 - xOffset > canvas.width * (1-this.MOVEWORLD)) {
      world.xOffset = Math.min(xOffset + (this.x - this.lastX), world.width - canvas.width);
      context.translate(xOffset - world.xOffset, 0);
      changed.x = xOffset - world.xOffset;
    }
    // up
    if (yOffset > 0 && this.y + this.height/2 - yOffset < canvas.height * this.MOVEWORLD) {
      world.yOffset = Math.max(yOffset + (this.y - this.lastY), 0);
      context.translate(0, yOffset - world.yOffset);
      changed.y = yOffset - world.yOffset;
    }
    // down
    else if (yOffset < world.height - canvas.height &&
        this.y + this.height/2 - yOffset > canvas.height * (1-this.MOVEWORLD)) {
      world.yOffset = Math.min(yOffset + (this.y - this.lastY), world.height - canvas.height);
      context.translate(0, yOffset - world.yOffset);
      changed.y = yOffset - world.yOffset;
    }
    return changed;
  },

  /**
   * Clean up after ourselves.
   */
  destroy: function() {
    this._super.apply(this, arguments);
    jQuery(document).off('.release', this.__keytracker);
  },
});
