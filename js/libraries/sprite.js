/**
 * A powerful, easy-to-use Sprite animation library for HTML5 Canvas.
 *
 * MIT License: http://opensource.org/licenses/mit-license.php
 *
 * @author Isaac Sukin (IceCreamYou)
 * @ignore
 */

// BEGIN SPRITE MAP LIBRARY ===================================================

(function() {

/**
 * Manage multiple sprite animations in the same sprite sheet.
 *
 * All methods except SpriteMap#clone are chainable (they return the SpriteMap
 * instance).
 *
 * @constructor
 *   Creates a new SpriteMap instance.
 *
 * @param {String} src
 *   The image to draw, in the form of one of the following:
 *
 *   - The file path of the base image
 *   - An Image
 *   - A Canvas
 * @param {Object} animations
 *   A map (Object) where the keys are the names of animation sequences and the
 *   values are maps (Objects) specifying the starting and ending frames of the
 *   relevant animation sequence. All properties are optional:
 *
 *   - startRow: The row at which to start the animation sequence. Defaults to
 *     0 (zero) - the first row.
 *   - startCol: The column at which to start the animation sequence. Defaults
 *     to 0 (zero) - the first column.
 *   - endRow: The row at which to end the animation sequence. Defaults to the
 *     last row.
 *   - endCol: The column at which to end the animation sequence. Defaults to
 *     the last column.
 *   - squeeze: Determines which frames are included in the animation loop. If
 *     set to true, frames are constrained within startCol and endCol,
 *     regardless of the row. If set to false (the default), frames will run to
 *     the last column in the Sprite and then loop back to the first column on
 *     the next row in the Sprite until reaching the last frame in the loop.
 *     More details on how this work are documented in the {@link Sprite}
 *     constructor.
 *   - flipped: An object with "horizontal" and "vertical" properties
 *     (both Booleans) indicating whether the Sprite should be drawn flipped
 *     along the horizontal or vertical axes.
 *
 *   Alternatively, instead of the inner values being Objects with the
 *   properties specified above, they can be Arrays that hold the same values
 *   (in the same order). This is less clear to read, but more concise to
 *   write.
 * @param {Object} options
 *   This parameter is the same as the options parameter for the {@link Sprite}
 *   class.
 */
function SpriteMap(src, animations, options) {
  var origPIC = typeof options.postInitCallback == 'function' ? options.postInitCallback : null;
  var t = this;
  options.postInitCallback = function(sprite) {
    t.sprite = sprite;
    t.baseImage = sprite.image;
    t.cachedImages = {'00': t.baseImage};
    t.maps = {};
    for (var name in animations) {
      if (animations.hasOwnProperty(name)) {
        t.set(name, animations[name]);
      }
    }
    if (origPIC) {
      origPIC.apply(this, arguments);
    }
  };
  this.sprite = new Sprite(src, options);
  this.sprite.spriteMap = this;
}
SpriteMap.prototype = {
  /**
   * Add or modify an animation sequence.
   *
   * @param {String} name
   *   The name of the sequence.
   * @param {Object/Array} [options]
   *   Specifies the frames of the animation sequence. If an Array is passed,
   *   the values should be included in the order below.
   * @param {Number} [options.startRow=0]
   *   The index of the sequence's starting row.
   * @param {Number} [options.startCol=0]
   *   The index of the sequence's starting column.
   * @param {Number} [options.endRow]
   *   The index of the sequence's ending row. Defaults to the Sprite's last
   *   row.
   * @param {Number} [options.endCol]
   *   The index of the sequence's ending column. Defaults to the Sprite's last
   *   column.
   * @param {Boolean} [options.squeeze=false]
   *   Determines which frames are included in the animation loop. If set to
   *   true, frames are constrained within startCol and endCol, regardless of
   *   the row. If set to false (the default), frames will run to the last
   *   column in the Sprite and then loop back to the first column on the next
   *   row in the Sprite until reaching the last frame in the loop. More
   *   details on how this work are documented in the {@link Sprite}
   *   constructor.
   * @param {Object} [options.flipped={horizontal: false, vertical: false}]
   *   An object with "horizontal" and "vertical" properties (both Booleans)
   *   indicating whether the Sprite should be drawn flipped along the
   *   horizontal or vertical axes.
   * @param {Boolean} [options.flipped.horizontal=false]
   * @param {Boolean} [options.flipped.vertical=false]
   */
  set: function(name, options) {
    if (options instanceof Array) {
      options = {
          startRow: options[0],
          startCol: options[1],
          endRow: options[2],
          endCol: options[3],
          squeeze: options[4],
          flipped: options[5]
      };
    }
    this.maps[name] = {
        startRow: typeof options.startRow !== 'undefined' ? options.startRow : 0,
        startCol: typeof options.startCol !== 'undefined' ? options.startCol : 0,
        endRow:   typeof options.endRow   !== 'undefined' ? options.endRow   : this.sprite.rows-1,
        endCol:   typeof options.endCol   !== 'undefined' ? options.endCol   : this.sprite.cols-1,
        squeeze:  typeof options.squeeze  !== 'undefined' ? options.squeeze  : false,
        flipped:  typeof options.flipped  !== 'undefined' ? options.flipped  : {horizontal: false, vertical: false}
    };
    // Pre-render the flipped versions of the image we know we'll need to use.
    var f = this.maps[name].flipped,
        key = (f.horizontal ? '1' : '0') + (f.vertical ? '1' : '0');
    if (typeof this.sprite.cachedImages[key] === 'undefined') {
      this.sprite.cachedImages[key] = this.sprite._prerender(this.baseImage, f);
    }
    return this;
  },
  /**
   * Remove an animation sequence.
   *
   * @param {String} name
   *   The animation sequence to remove.
   */
  unset: function(name) {
    if (this.maps.hasOwnProperty(name)) {
      delete this.maps[name];
    }
    return this;
  },
  /**
   * Switch the active animation sequence.
   *
   * @param {String} name
   *   The name of the animation sequence to switch to.
   * @param {Boolean} [restartIfInUse=false]
   *   A Boolean indicating whether to restart the animation sequence if the
   *   specified sequence is already in use.
   */
  use: function(name, restartIfInUse) {
    if (this.activeLoop == name && !restartIfInUse) {
      return this;
    }
    /**
     * @property {String} activeLoop
     *   The name of the active animation sequence.
     */
    this.activeLoop = name;
    var m = this.maps[name];
    this.sprite.setLoop(m.startRow, m.startCol, m.endRow, m.endCol, m.squeeze, m.flipped);
    return this;
  },
  /**
   * Start the animation sequence.
   *
   * @param {String} [name]
   *   The name of the animation sequence to start. If not given, defaults to
   *   the active animation sequence. If no animation sequence is active, the
   *   default sequence is to show the whole sprite sheet.
   */
  start: function(name) {
    if (name) {
      this.use(name);
    }
    this.sprite.startLoop();
    return this;
  },
  /**
   * Stop the currently running animation sequence.
   */
  stop: function() {
    this.sprite.stopLoop();
    return this;
  },
  /**
   * Reset the active animation sequence to the first frame.
   *
   * If the sequence is running when SpriteMap#reset() is called, it will still
   * be running afterwards, so usually SpriteMap#stop() is called first.
   */
  reset: function() {
    this.sprite.reset();
    return this;
  },
  /**
   * Run an animation sequence once.
   *
   * @param {Function} [callback]
   *   A function to call after the animation sequence is done running.
   * @param {Sprite} [callback.sprite]
   *   The Sprite that was animated. Its "spriteMap" property holds the parent
   *   SpriteMap.
   * @param {String} [name]
   *   The name of the animation sequence to start. If not given, defaults to
   *   the active animation sequence. If no animation sequence is active, the
   *   default sequence is to show the whole sprite sheet.
   */
  runOnce: function(callback, name) {
    if (name) {
      this.use(name);
    }
    this.sprite.runLoop(callback);
    return this;
  },
  /**
   * Draw the sprite's current frame.
   *
   * @param {CanvasRenderingContext2D} ctx
   *   The canvas graphics context onto which the sprite should be drawn.
   * @param {Number} x
   *   The x-coordinate of the canvas graphics context at which the upper-left
   *   corner of the Sprite should be drawn. This is usually (but not always)
   *   the horizontal distance in pixels from the left side of the canvas.
   * @param {Number} y
   *   The y-coordinate of the canvas graphics context at which the upper-left
   *   corner of the Sprite should be drawn. This is usually (but not always)
   *   the vertical distance in pixels from the top of the canvas.
   * @param {Number} [w]
   *   The width of the image when drawn onto the canvas. Defaults to the
   *   Sprite's projected width, which in turn defaults to the frame width.
   * @param {Number} [h]
   *   The height of the image when drawn onto the canvas. Defaults to the
   *   Sprite's projected height, which in turn defaults to the frame height.
   */
  draw: function(ctx, x, y, w, h) {
    this.sprite.draw(ctx, x, y, w, h);
    return this;
  },
  /**
   * Clone the SpriteMap.
   *
   * @return {SpriteMap}
   *   A SpriteMap instance that is identical to the current instance.
   */
  clone: function() {
    return new SpriteMap(this.sprite.sourceFile, this.maps, this.sprite);
  }
};

this.SpriteMap = SpriteMap;

}).call(this);

// END SPRITE MAP LIBRARY =====================================================
// BEGIN SPRITE ANIMATION LIBRARY =============================================

(function() {

/**
 * Support sprite animation.
 *
 * - Animations are always run left-to-right, top-to-bottom.
 * - All frames in the loop are assumed to be the same size.
 * - Rows and columns (the row, col, startRow, startCol, endRow, and endCol
 *   properties) are zero-indexed, while frame number starts at 1. Usually
 *   frame 1 will have row and column values (0, 0).
 * - Use {@link SpriteMap}s to maintain multiple loops in the same image.
 * - This class assumes that the properties passed in make sense (i.e. the
 *   starting cell occurs before the ending cell, the image has nonzero
 *   dimensions, etc.). Otherwise behavior is undefined.
 * - All public methods that do not exist to get specific values return `this`
 *   (and therefore are chainable).
 *
 * @constructor
 *   Creates a new Sprite instance.
 *
 * @param {String} src
 *   The image to draw, in the form of one of the following:
 *
 *   - The file path of the base image
 *   - An Image
 *   - A Canvas
 * @param {Object} [options]
 *   An object whose properties affect how the sprite is animated. Each of the
 *   properties will be attached to the Sprite object directly, along with
 *   other calculated properties. It is best to call Sprite#getFrame() if you
 *   need information about the currently displayed frame. You can read other
 *   properties if you need to, but it is strongly recommended not to set
 *   properties directly because the resulting behavior is undefined.
 * @param {Number} [options.frameW]
 *   The width of each frame of the sprite. Defaults to the image width.
 * @param {Number} [options.frameH]
 *   The height of each frame of the sprite. Defaults to the image height.
 * @param {Number} [options.projectedW]
 *   The width of each frame when it is displayed on the canvas (allowing you
 *   to scale the frame). Defaults to the frame width.
 * @param {Number} [options.projectedH]
 *   The height of each frame when it is displayed on the canvas (allowing you
 *   to scale the frame). Defaults to the frame height.
 * @param {Number} [options.startRow=0]
 *   The row at which the animation loop should start.
 * @param {Number} [options.startCol=0]
 *   The column at which the animation loop should start.
 * @param {Number} [options.endRow]
 *   The row at which the animation loop should stop. Animations will run from
 *   (startRow, startCol) to (endRow, endCol), inclusive. Defaults to the last
 *   row in the image.
 * @param {Number} [options.endCol]
 *   The column at which the animation loop should stop. Animations will run
 *   from (startRow, startCol) to (endRow, endCol), inclusive. Defaults to the
 *   last column in the image.
 * @param {Boolean} [options.squeeze=false]
 *   By default, animation loops are assumed to run all the way to the end of
 *   each row before continuing at the start of the next row. For example, a
 *   valid arrangement of loops in an image might look like this:
 *
 *       AAAA
 *       AABB
 *       BBBC
 *       CCDD
 *       DDDD
 *
 *   In this example, the "C" loop starts at (2, 2) and ends at (3, 1).
 *   However, if the squeeze option is set to true, loops will be contained
 *   inside startCol and endCol. For example, a valid arrangement of loops in
 *   an image might look like this:
 *
 *       AABB
 *       AABB
 *       AACC
 *       DDCC
 *
 *   Now the "C" loop starts at (2, 2) and ends at (3, 3) and all its frames
 *   occur within the box formed by those coordinates.
 * @param {Number} [options.interval=125]
 *   The delay in milliseconds before switching frames when running the
 *   animation loop.
 * @param {Boolean} [options.useTimer=true]
 *   If true, Sprite animation loops rely on setInterval() to update their
 *   frames regularly (this is the default). If false, the Sprite will rely on
 *   being drawn as the "tick" that lets it update its frames. This can be
 *   slightly less accurate than using a timer (assuming the sprite gets drawn
 *   on every canvas repaint; otherwise it can be a lot less accurate, and in
 *   any case it can be up to 15ms off on Windows) but it is more
 *   performance-friendly and also ensures that frames will never skip if the
 *   sprite is not drawn.
 * @param {Boolean} [options.advanceFramesManually=false]
 *   If options.useTimer is false and this setting is true, frames will not be
 *   advanced automatically and must be advanced manually instead (i.e. using
 *   Sprite#nextFrame() or Sprite#changeFrame()).
 * @param {Object} [options.flipped={horizontal: false, vertical: false}]
 *   An object with "horizontal" and "vertical" properties (both Booleans)
 *   indicating whether the Sprite should be drawn flipped along the horizontal
 *   or vertical axes.
 * @param {Function} [options.postInitCallback]
 *   A function that will run at the end of the initialization process (if the
 *   source image has not been loaded before, this will be after the image has
 *   been fully loaded asynchronously). If the source image was not pre-loaded
 *   and you draw() the Sprite before this callback is invoked, nothing will be
 *   drawn because the image won't be loaded yet.
 * @param {Sprite} [options.postInitCallback.sprite]
 *   The Sprite that was loaded.
 */
function Sprite(src, options) {
  // String image file path
  if (typeof src == 'string') {
    this.sourceFile = src;
    var cachedImage = Sprite.getImageFromCache(src);
    if (cachedImage) { // cached
      this._init(cachedImage, options);
    }
    else { // not cached
      var image = new Image(), t = this;
      image.onload = function() {
        t._init(this, options);
      };
      image._src = src;
      image.src = src;
      Sprite.saveImageToCache(src, image);
    }
  }
  // Image
  else if (src instanceof HTMLImageElement || src instanceof Image) {
    if (!src.src) {
      return;
    }
    this.sourceFile = src._src || src.src;
    if (src.complete || (src.width && src.height)) { // loaded
      Sprite.saveImageToCache(this.sourceFile, src);
      this._init(src, options);
    }
    else { // not loaded
      if (src._src) { // We've already tried to draw this one
        return; // The onload callback will initialize the sprite when it runs
      }
      var o = src.onload, t = this;
      src.onload = function() {
        if (typeof o == 'function') { // don't overwrite any existing handler
          o();
        }
        Sprite.saveImageToCache(t.sourceFile, src);
        t._init(this, options);
      };
    }
  }
  // Canvas
  else if (src instanceof HTMLCanvasElement) {
    this._init(src, options);
  }
}
Sprite.prototype = {
  // Calculates and stores initial values based on a loaded image.
  _init: function(img, options) {
    this.width = img.width;
    this.height = img.height;
    this.frameW = options.frameW || img.width;
    this.frameH = options.frameH || img.height;
    this.projectedW = options.projectedW || this.frameW;
    this.projectedH = options.projectedH || this.frameH;
    this.rows = Math.floor(this.height / this.frameH);
    this.cols = Math.floor(this.width / this.frameW);
    this.startRow = options.startRow || 0;
    this.startCol = options.startCol || 0;
    this.endRow = (typeof options.endRow === 'undefined' ? this.rows-1 : options.endRow);
    this.endCol = (typeof options.endCol === 'undefined' ? this.cols-1 : options.endCol);
    this.row = this.startRow;
    this.col = this.startCol;
    this.frame = 1;
    this.squeeze = options.squeeze || false;
    this.interval = (typeof options.interval === 'undefined' ? 125 : options.interval);
    this.useTimer = (typeof options.useTimer === 'undefined' ? true : options.useTimer);
    this.advanceFramesManually = options.advanceFramesManually || false;
    this.lastFrameUpdateTime = 0;
    this.flipped = options.flipped || {horizontal: false, vertical: false};
    this.flipped.horizontal = this.flipped.horizontal || false;
    this.flipped.vertical = this.flipped.vertical || false;
    this.cachedImages = {'00': img};
    var f = this.flipped,
        key = (f.horizontal ? '1' : '0') + (f.vertical ? '1' : '0');
    if (typeof this.cachedImages[key] === 'undefined') {
      this.cachedImages[key] = this._prerender(img, f);
    }
    this.image = this.cachedImages[key];
    this._runOnce = false;
    if (this.squeeze) {
      this.cols = this.endCol - this.startCol + 1;
    }
    this.numFrames = this.getNumFrames();
    if (options.postInitCallback) {
      options.postInitCallback(this);
    }
  },
  /**
   * Pre-render the image onto a canvas.
   *
   * Canvases typically draw faster than images, especially when flipped.
   *
   * @return {HTMLCanvasElement} The prerendered flipped image.
   * @ignore
   */
  _prerender: function(image, flipped) {
    var tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.width;
    tempCanvas.height = this.height;
    var tempContext = tempCanvas.getContext('2d');
    if (flipped.horizontal || flipped.vertical) {
      tempContext.translate(flipped.horizontal ? tempCanvas.width : 0,
          flipped.vertical ? tempCanvas.height : 0);
      tempContext.scale(flipped.horizontal ? -1 : 1,
          flipped.vertical ? -1 : 1);
    }
    tempContext.drawImage(image, 0, 0);
    return tempCanvas;
  },
  /**
   * Draws the sprite.
   *
   * @param {CanvasRenderingContext2D} ctx
   *   The canvas graphics context onto which the sprite should be drawn.
   * @param {Number} x
   *   The x-coordinate of the canvas graphics context at which the upper-left
   *   corner of the Sprite should be drawn. This is usually (but not always)
   *   the horizontal distance in pixels from the left side of the canvas.
   * @param {Number} y
   *   The y-coordinate of the canvas graphics context at which the upper-left
   *   corner of the Sprite should be drawn. This is usually (but not always)
   *   the vertical distance in pixels from the top of the canvas.
   * @param {Number} [w]
   *   The width of the image when drawn onto the canvas. Defaults to the
   *   Sprite's projected width, which in turn defaults to the frame width.
   * @param {Number} [h]
   *   The height of the image when drawn onto the canvas. Defaults to the
   *   Sprite's projected height, which in turn defaults to the frame height.
   */
  draw: function(ctx, x, y, w, h) {
    try {
      ctx.save();
      w = w || this.projectedW;
      h = h || this.projectedH;
      var xOffset = this.col * this.frameW,
          yOffset = this.row * this.frameH;
      if (this.flipped.horizontal) {
        xOffset = this.width - xOffset - this.frameW;
      }
      if (this.flipped.vertical) {
        yOffset = this.height - yOffset - this.frameH;
      }
      ctx.drawImage(
          this.image,  // image
          xOffset,     // image x-offset
          yOffset,     // image y-offset
          this.frameW, // image slice width
          this.frameH, // image slice height
          x,           // canvas x-position
          y,           // canvas y-position
          w,           // slice width on canvas
          h            // slice height on canvas
      );
      ctx.restore();
    } catch(e) {
      if (console && console.error) {
        // Usually the reason you would get an error here is if you tried to
        // draw() an image before it was fully loaded. That's an ignore-able
        // error, because if you're animating, the image will just pop in when
        // it loads.
        console.error(e);
      }
    }
    if (!this.useTimer && !this.advanceFramesManually &&
        Date.now() - this.lastFrameUpdateTime > this.interval) {
      this.nextFrame();
    }
    return this;
  },
  /**
   * Reset the animation to its first frame.
   *
   * Usually you will want to call Sprite#stopLoop() immediately before
   * Sprite#reset(); otherwise the animation will keep running (if it was
   * running already).
   */
  reset: function() {
    this.row = this.startRow, this.col = this.startCol, this.frame = 1;
    this.lastFrameUpdateTime = 0;
    return this;
  },
  /**
   * Move forward or backward a specified number of frames.
   *
   * @param {Number} delta
   *   The number of frames by which to move forward or backward (negative
   *   values move backward).
   */
  changeFrame: function(delta) {
    this.frame += delta;
    this.setFrame(this.frame);
    return this;
  },
  /**
   * Moves to a specific frame in the animation loop.
   *
   * This function supports passing either a frame number or row and column
   * coordinates as parameters. Frames outside of the accepted range will
   * overflow/underflow.
   *
   * You may want to call Sprite#stopLoop() immediately before
   * Sprite#setFrame(); otherwise the animation will keep running (if it was
   * running already).
   *
   * @param {Number} row
   *   The row of the frame to which to switch.
   * @param {Number} col
   *   The column of the frame to which to switch.
   */
  setFrame: function(row, col) {
    if (typeof col !== 'undefined') {
      this.row = row, this.col = col;
      if (this.squeeze) {
        this.frame = this.cols * (this.row - this.startRow + 1) -
          (this.endCol - this.col);
      }
      else {
        this.frame = this.cols * (this.row - this.startRow + 1) -
          (this.cols - (this.col + 1)) - (this.startCol);
      }
    }
    else {
      var props = this.frameNumberToRowCol(row);
      this.frame = props.frame, this.row = props.row, this.col = props.col;
    }
    this.lastFrameUpdateTime = Date.now();
    return this;
  },
  /**
   * Sets the range of frames over which the sprite should loop.
   *
   * @param {Number} startRow
   *   The row of the frame at which animation should start.
   * @param {Number} startCol
   *   The column of the frame at which animation should start.
   * @param {Number} [endRow]
   *   The row of the frame at which animation should end. Defaults to the last
   *   row in the image.
   * @param {Number} [endCol]
   *   The column of the frame at which animation should end. Defaults to the
   *   last column in the image.
   * @param {Boolean} [squeeze=false]
   *   A Boolean determining whether startCol and endCol define a box within
   *   which to find frames for this animation, or whether frames from any
   *   column can be used (after startCol in startRow and before endCol in
   *   endRow). For more information on how this works, see the documentation
   *   for the {@link Sprite} constructor.
   * @param {Object} [flipped]
   *   An object with "horizontal" and "vertical" properties (both Booleans)
   *   indicating whether the Sprite should be drawn flipped along the
   *   horizontal or vertical axes. Defaults to the flipped setting for the
   *   current animation sequence.
   */
  setLoop: function(startRow, startCol, endRow, endCol, squeeze, flipped) {
    this.stopLoop();
    if (endRow === null || typeof endRow === 'undefined') {
      endRow = this.rows-1;
    }
    if (endCol === null || typeof endCol === 'undefined') {
      endCol = this.cols-1;
    }
    if (typeof squeeze !== 'undefined') {
      this.squeeze = squeeze;
    }
    if (typeof flipped !== 'undefined') {
      this.flipped = flipped;
      var f = this.flipped,
          key = (f.horizontal ? '1' : '0') + (f.vertical ? '1' : '0');
      if (typeof this.cachedImages[key] === 'undefined') {
        this.cachedImages[key] = this._prerender(this.image, f);
      }
      this.image = this.cachedImages[key];
    }
    this.startRow = startRow, this.startCol = startCol,
    this.endRow = endRow, this.endCol = endCol;
    this.reset();
    this.numFrames = this.getNumFrames();
    return this;
  },
  /**
   * Starts running a new animation loop.
   *
   * Usually this function will be called without parameters since it defaults
   * to using the sprite's settings defined at instantiation time. In cases
   * where the frames that should be used in an animation change, this function
   * takes the same parameters as Sprite#setLoop() for convenience; using these
   * parameters is equivalent to calling sprite.setLoop(params).startLoop().
   *
   * @param {Number} [startRow]
   *   The row of the frame at which animation should start. Defaults to the
   *   starting row of the current animation sequence.
   * @param {Number} [startCol]
   *   The column of the frame at which animation should start. Defaults to the
   *   starting column of the current animation sequence.
   * @param {Number} [endRow]
   *   The row of the frame at which animation should end. Defaults to the
   *   ending row of the current animation sequence unless startRow and
   *   startCol are specified, in which case it defaults to the last row in the
   *   image.
   * @param {Number} [endCol]
   *   The column of the frame at which animation should end. Defaults to the
   *   ending column of the current animation sequence unless startRow and
   *   startCol are specified, in which case it defaults to the last column in
   *   the image.
   * @param {Boolean} [squeeze]
   *   A Boolean determining whether startCol and endCol define a box within
   *   which to find frames for this animation, or whether frames from any
   *   column can be used (after startCol in startRow and before endCol in
   *   endRow). For more information on how this works, see the documentation
   *   for the {@link Sprite} constructor. Defaults to the squeeze setting for
   *   the current animation sequence unless startRow and startCol are
   *   specified, in which case it defaults to false.
   * @param {Object} [flipped]
   *   An object with "horizontal" and "vertical" properties (both Booleans)
   *   indicating whether the Sprite should be drawn flipped along the
   *   horizontal or vertical axes. Defaults to the flipped setting for the
   *   current animation sequence.
   */
  startLoop: function(startRow, startCol, endRow, endCol, squeeze, flipped) {
    if (typeof startRow !== 'undefined' && typeof startCol !== 'undefined') {
      this.setLoop(startRow, startCol, endRow, endCol, squeeze, flipped);
    }
    this.lastFrameUpdateTime = Date.now();
    if (this.interval && this.useTimer) {
      var t = this;
      this.intervalID = setInterval(function() { t.nextFrame(); }, this.interval);
    }
    return this;
  },
  /**
   * Stops running the animation loop.
   */
  stopLoop: function() {
    this.lastFrameUpdateTime = 0;
    if (this.intervalID) {
      clearInterval(this.intervalID);
    }
    return this;
  },
  /**
   * Runs the animation loop once.
   *
   * The loop concludes at the final frame and does not reset to the first
   * frame. Use the callback function to reset it if you need that behavior.
   *
   * Usually this function will be called without parameters since it defaults
   * to using the sprite's settings defined at instantiation time. In cases
   * where the frames that should be used in an animation change, this function
   * takes the same parameters as Sprite#setLoop() for convenience; using these
   * parameters is equivalent to calling sprite.setLoop(params).startLoop().
   *
   * @param {Function} [callback]
   *   A callback function to run after the loop has completed, or a falsey
   *   value to skip this argument.
   * @param {Sprite} [callback.sprite]
   *   The Sprite that was animated.
   * @param {Number} [startRow]
   *   The row of the frame at which animation should start. Defaults to the
   *   starting row of the current animation sequence.
   * @param {Number} [startCol]
   *   The column of the frame at which animation should start. Defaults to the
   *   starting column of the current animation sequence.
   * @param {Number} [endRow]
   *   The row of the frame at which animation should end. Defaults to the
   *   ending row of the current animation sequence unless startRow and
   *   startCol are specified, in which case it defaults to the last row in the
   *   image.
   * @param {Number} [endCol]
   *   The column of the frame at which animation should end. Defaults to the
   *   ending column of the current animation sequence unless startRow and
   *   startCol are specified, in which case it defaults to the last column in
   *   the image.
   * @param {Boolean} [squeeze]
   *   A Boolean determining whether startCol and endCol define a box within
   *   which to find frames for this animation, or whether frames from any
   *   column can be used (after startCol in startRow and before endCol in
   *   endRow). For more information on how this works, see the documentation
   *   for the {@link Sprite} constructor. Defaults to the squeeze setting for
   *   the current animation sequence unless startRow and startCol are
   *   specified, in which case it defaults to false.
   * @param {Object} [flipped]
   *   An object with "horizontal" and "vertical" properties (both Booleans)
   *   indicating whether the Sprite should be drawn flipped along the
   *   horizontal or vertical axes. Defaults to the flipped setting for the
   *   current animation sequence unless startRow and startCol are specified,
   *   in which case it defaults to {horizontal: false, vertical: false}.
   */
  runLoop: function(callback, startRow, startCol, endRow, endCol, squeeze, flipped) {
    this.runLoopCallback = callback || function() {};
    this._runOnce = true;
    Array.prototype.shift.call(arguments);
    this.startLoop.apply(this, arguments);
    return this;
  },
  /**
   * Goes back one frame in the animation loop.
   *
   * This is equivalent to Sprite#changeFrame(-1). It is provided as a
   * convenience and to complement Sprite#nextFrame().
   */
  prevFrame: function() {
    changeFrame(-1);
    return this;
  },
  /**
   * Advances one frame in the animation loop.
   *
   * This is equivalent to (but more efficient than) Sprite#changeFrame(1).
   */
  nextFrame: function() {
    this.col++;
    this.frame++;
    if (this.row == this.endRow && this.col > this.endCol) {
      if (this._runOnce) {
        this.stopLoop();
        this._runOnce = false;
        this.runLoopCallback(this);
      }
      else {
        this.reset();
      }
    }
    else if (this.squeeze && this.col > this.endCol) {
      this.col = this.startCol;
      this.row++;
    }
    else if (!this.squeeze && this.col >= this.cols) {
      this.col = 0;
      this.row++;
    }
    this.lastFrameUpdateTime = Date.now();
    return this;
  },
  /**
   * Returns an object containing the current "row," "col," and "frame" number.
   *
   * Row and Col are zero-indexed; frame is 1-indexed.
   */
  getFrame: function() {
    return {row: this.row, col: this.col, frame: this.frame};
  },
  /**
   * Returns the total number of frames in the current animation loop.
   */
  getNumFrames: function() {
    if (this.squeeze) {
      return (this.endRow - this.startRow + 1) * (this.endCol - this.startCol + 1);
    }
    return (this.endRow - this.startRow) * this.cols - this.startCol + this.endCol + 1;
  },
  /**
   * Converts a frame number to row and column numbers.
   *
   * @param {Number} frame
   *   The frame number to convert.
   *
   * @return {Object}
   *   An object containing the 'frame' number and the corresponding 'row' and
   *   'col' properties.
   */
  frameNumberToRowCol: function(frame) {
    var row, col;
    frame = ((frame + this.numFrames) % this.numFrames) || this.numFrames; // over-/under-flow
    if (this.squeeze) {
      row = this.startRow + Math.floor((frame - 1) / this.cols);
      col = (frame - 1) % this.cols + this.startCol;
    }
    else {
      row = this.startRow + Math.floor((frame + this.startCol - 1) / this.cols);
      col = (frame + this.startCol - 1) % this.cols;
    }
    return {frame: frame, row: row, col: col};
  },
  /**
   * Clone the Sprite (return an identical copy).
   */
  clone: function() {
    return new Sprite(this.sourceFile, this);
  }
};

this.Sprite = Sprite;

}).call(this);

// END SPRITE ANIMATION LIBRARY ===============================================
// BEGIN IMAGE CACHE HELPERS ==================================================

/**
 * Override these functions to provide alternative cache implementations.
 * @ignore
 */
(function() {
  var images = {}; // Image cache

  /**
   * Get an image from the cache.
   *
   * @param {String} src
   *   The file path of the image.
   *
   * @return {Image}
   *   The Image object associated with the file or null if the Image object
   *   has not yet been cached.
   *
   * @static
   */
  Sprite.getImageFromCache = function(src) {
    return images[src] ? images[src] : null;
  };

  /**
   * Save an image to the cache.
   *
   * @param {String} src
   *   The file path of the image.
   * @param {Image} image
   *   The Image object to cache.
   *
   * @static
   */
  Sprite.saveImageToCache = function(src, image) {
    images[src] = image;
  };

  /**
   * Preload a list of images asynchronously.
   *
   * @param {String[]} files
   *   An Array of paths to images to preload.
   * @param {Object} [options]
   *   A map of options for this function.
   * @param {Function} [options.finishCallback]
   *   A function to run when all images have finished loading.
   * @param {Number} [options.finishCallback.numLoaded]
   *   The number of images that were preloaded.
   * @param {Function} [options.itemCallback]
   *   A function to run when an image has finished loading.
   * @param {String} [options.itemCallback.filepath]
   *   The file path of the loaded image.
   * @param {Number} [options.itemCallback.numLoaded]
   *   The number of images that have been loaded so far (including the current
   *   one).
   * @param {Number} [options.itemCallback.numImages]
   *   The total number of images to load.
   *
   * @static
   */
  Sprite.preloadImages = function(files, options) {
    var l = files.length, m = -1, src, image;
    var notifyLoaded = function(itemCallback, src) {
      m++;
      if (typeof itemCallback == 'function') {
        itemCallback(src, m, l);
      }
      if (m == l && typeof options.finishCallback == 'function') {
        options.finishCallback(l);
      }
    };
    notifyLoaded();
    var onload = function() {
      Sprite.saveImageToCache(this._src, this);
      notifyLoaded(options.itemCallback, this._src);
    };
    while (files.length) {
      src = files.pop();
      image = new Image();
      image._num = l-files.length;
      image._src = src;
      image.onload = onload;
      image.src = src;
    }
  };

}).call(this);

// END IMAGE CACHE HELPERS ====================================================
