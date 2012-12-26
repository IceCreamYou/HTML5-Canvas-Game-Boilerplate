/**
 * @file
 *   A powerful, easy-to-use Sprite animation library for HTML5 Canvas.
 *
 * @author Isaac Sukin (IceCreamYou)
 *
 * MIT Licensed: http://opensource.org/licenses/mit-license.php
 */

// BEGIN SPRITE MAP LIBRARY ===================================================

(function(undefined) {

/**
 * Manage multiple sprite animations in the same sprite sheet.
 *
 * All methods except set(), unset(), and draw() are chainable.
 *
 * @param src
 *   The file path of the base image.
 * @param animations
 *   A map (object) where the keys are the names of animation sequences and the
 *   values are maps (objects) specifying the starting and ending frames of the
 *   relevant animation sequence. All properties are optional:
 *   - startRow: The row at which to start the animation sequence. Defaults to
 *     0 (zero) - the first row.
 *   - startCol: The column at which to start the animation sequence. Defaults
 *     to 0 (zero) - the first column.
 *   - endRow: The row at which to end the animation sequence. Defaults to the
 *     last row.
 *   - endCol: The column at which to end the animation sequence. Defaults to
 *     the last column.
 *   - squeeze: Changes the way frames are grouped together. See the
 *     explanation of the options for the Sprite constructor for more details.
 *   Alternatively, instead of the inner values being objects with the
 *   properties specified above, they can be arrays that hold the same values
 *   (in the same order). This is less clear to read, but more concise to
 *   write.
 * @param options
 *   This parameter is the same as the options parameter for the Sprite class.
 */
function SpriteMap(src, animations, options) {
  this.sprite = new Sprite(src, options);
  this.maps = {};
  var name;
  for (name in animations) {
    if (animations.hasOwnProperty(name)) {
      this.set(name, animations[name]);
    }
  }
}
SpriteMap.prototype = {
  /**
   * Add or modify an animation sequence.
   *
   * @param name
   *   The name of the sequence.
   * @param options
   *   (Optional) An object with startRow, startCol, endRow, endCol, squeeze,
   *   and/or flipped properties, or an array with those values (in that order,
   *   but all optional).
   */
  set: function(name, options) {
    if (options instanceof Array) {
      options = {
          startRow: options[0],
          startCol: options[1],
          endRow: options[2],
          endCol: options[3],
          squeeze: options[4],
          flipped: options[5],
      };
    }
    this.maps[name] = {
        startRow: typeof options.startRow != 'undefined' ? options.startRow : 0,
        startCol: typeof options.startCol != 'undefined' ? options.startCol : 0,
        endRow:   typeof options.endRow   != 'undefined' ? options.endRow   : this.sprite.rows-1,
        endCol:   typeof options.endCol   != 'undefined' ? options.endCol   : this.sprite.cols-1,
        squeeze:  typeof options.squeeze  != 'undefined' ? options.squeeze  : false,
        flipped:  typeof options.flipped  != 'undefined' ? options.flipped  : [false, false],
    };
  },
  /**
   * Remove an animation sequence.
   *
   * @param name
   *   The animation sequence to remove.
   */
  unset: function(name) {
    if (this.maps.hasOwnProperty(name)) {
      delete this.maps[name];
    }
  },
  /**
   * Switch the active animation sequence.
   *
   * @param name
   *   The name of the animation sequence to switch to.
   * @param restartIfInUse
   *   (Optional) A boolean indicating whether to restart the animation
   *   sequence if the specified sequence is already in use. Defaults to false.
   */
  use: function(name, restartIfInUse) {
    if (this.activeLoop == name && !restartIfInUse) {
      return this;
    }
    this.activeLoop = name;
    var m = this.maps[name];
    this.sprite.setLoop(m.startRow, m.startCol, m.endRow, m.endCol, m.squeeze, m.flipped);
    return this;
  },
  /**
   * Start the animation sequence.
   *
   * @param name
   *   (Optional) The name of the animation sequence to start. If not given,
   *   defaults to the active animation sequence. If no animation sequence is
   *   active, the default sequence is to show the whole sprite sheet.
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
    this.sprite.stop();
    return this;
  },
  /**
   * Reset the active animation sequence to the first frame.
   *
   * If the sequence is running when reset() is called, it will still be
   * running afterwards, so usually stop() is called first.
   */
  reset: function() {
    this.sprite.reset();
    return this;
  },
  /**
   * Run an animation sequence once.
   *
   * @param callback
   *   (Optional) A function to call after the animation sequence is done
   *   running.
   * @param name
   *   (Optional) The name of the animation sequence to start. If not given,
   *   defaults to the active animation sequence. If no animation sequence is
   *   active, the default sequence is to show the whole sprite sheet.
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
   */
  draw: function(ctx, x, y, w, h) {
    this.sprite.draw(ctx, x, y, w, h);
  },
  /**
   * Clone the SpriteMap (return an identical copy).
   */
  clone: function() {
    return new SpriteMap(this.sprite.sourceFile, this.maps, this.sprite);
  },
};

this.SpriteMap = SpriteMap;

}).call(this);

// END SPRITE MAP LIBRARY =====================================================
// BEGIN SPRITE ANIMATION LIBRARY =============================================

(function(undefined) {

/**
 * Support sprite animation.
 *
 * - Animations are always run left-to-right, top-to-bottom.
 * - All frames in the loop are assumed to be the same size.
 * - Rows and columns are zero-indexed (row, col, startRow, startCol, endRow,
 *   endCol) while frame number starts at 1. Usually frame 1 will have
 *   row and column values (0, 0).
 * - You can have multiple loops in the same image (as long as the frames are
 *   the same size) by either creating different Sprite objects for each loop
 *   or by using the setLoop() method (or the startLoop() shortcut).
 * - This class assumes that the properties passed in make sense (i.e. the
 *   starting cell occurs before the ending cell, the image has nonzero
 *   dimensions, etc.). Otherwise behavior is undefined.
 * - All public methods that do not exist to get specific values return "this"
 *   (and therefore are chainable).
 *
 * @param src
 *   The file path of the base image.
 * @param options
 *   (Optional) An object whose properties affect how the sprite is animated:
 *   - frameW: The width of each frame of the sprite. Defaults to the image
 *     width.
 *   - frameH: The height of each frame of the sprite. Defaults to the image
 *     height.
 *   - projectedW: The width of each frame when it is displayed on the canvas
 *     (allowing you to scale the frame). Defaults to the frame width.
 *   - projectedH: The height of each frame when it is displayed on the canvas
 *     (allowing you to scale the frame). Defaults to the frame height.
 *   - startRow: The row at which the animation loop should start. Defaults to
 *     0 (zero).
 *   - startCol: The column at which the animation loop should start. Defaults
 *     to 0 (zero).
 *   - endRow: The row at which the animation loop should stop. Defaults to
 *     the last row in the image. Animations will run from (startRow, startCol)
 *     to (endRow, endCol), inclusive.
 *   - endCol: The column at which the animation loop should stop. Defaults to
 *     the last column in the image. Animations will run from (startRow,
 *     startCol) to (endRow, endCol), inclusive.
 *   - squeeze: By default, animation loops are assumed to run all the way to
 *     the end of each row before continuing at the start of the next row. For
 *     example, a valid arrangement of loops in an image might look like this:
 *     
 *       AAAA
 *       AABB
 *       BBBC
 *       CCDD
 *       DDDD
 *     
 *     In this example, the "C" loop starts at (2, 2) and ends at (3, 1).
 *     However, if the squeeze option is set to true, loops will be contained
 *     inside startCol and endCol. For example, a valid arrangement of loops in
 *     an image might look like this:
 *     
 *       AABB
 *       AABB
 *       AACC
 *       DDCC
 *     
 *     Now the "C" loop starts at (2, 2) and ends at (3, 3) and all its frames
 *     occur within the box formed by those coordinates.
 *   - interval: The delay in milliseconds before switching frames when running
 *     the animation loop. Defaults to 125 (8 updates per second).
 *   - useTimer: If true, Sprite animation loops rely on setInterval() to
 *     update their frames regularly (this is the default). If false, the
 *     Sprite will rely on being drawn as the "tick" that lets it update its
 *     frames. This can be slightly less accurate than using a timer (assuming
 *     the sprite gets drawn on every canvas repaint; otherwise it can be a lot
 *     less accurate, and in any case it can be up to 15ms off on Windows) but
 *     it is more performance-friendly and also ensures that frames will never
 *     skip if the sprite is not drawn.
 *   - flipped: An array with two boolean values indicating whether to draw
 *     each frame flipped right-to-left and top-to-bottom, respectively.
 *     Defaults to [false, false] (not flipped along either axis).
 *   - postInitCallback: A function that will run at the end of the
 *     initialization process (if the source image has not been loaded before,
 *     this will be after the image has been fully loaded asynchronously).
 *     If the source image was not pre-loaded and you draw() the Sprite before
 *     this callback is invoked, nothing will be drawn because the image won't
 *     be loaded yet. This function receives the Sprite object as its only
 *     parameter.
 *
 * Each of the properties in the options parameter will be attached to the
 * Sprite object directly, along with other calculated properties. It is best
 * to call the getFrame() method if you need information about the currently
 * displayed frame. You can read other properties if you need to, but it is
 * strongly recommended not to set properties directly because doing so will
 * likely have unexpected consequences. 
 */
function Sprite(src, options) {
  this.sourceFile = src;
  var cachedImage = Sprite.getImageFromCache(src);
  if (cachedImage) {
    this._init(cachedImage, options);
  }
  else {
    var image = new Image(), t = this;
    image.onload = function() {
      t._init(this, options);
    };
    image._src = src;
    image.src = src;
    Sprite.saveImageToCache(src, image);
  }
}
Sprite.prototype = {
  // Calculates and stores initial values based on a loaded image.
  _init: function(img, options) {
    this.image = img;
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
    this.endRow = (options.endRow === undefined ? this.rows-1 : options.endRow);
    this.endCol = (options.endCol === undefined ? this.cols-1 : options.endCol);
    this.row = this.startRow;
    this.col = this.startCol;
    this.frame = 1;
    this.squeeze = options.squeeze || false;
    this.interval = (options.interval === undefined ? 125 : options.interval);
    this.useTimer = (options.useTimer === undefined ? true : options.useTimer);
    this.flipped = options.flipped || [false, false];
    this.lastFrameUpdateTime = 0;
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
   * Draws the sprite.
   *
   * @param ctx
   *   The canvas graphics context onto which the sprite should be drawn.
   * @param x
   *   The x-coordinate of the canvas graphics context at which the upper-left
   *   corner of the sprite should be drawn. This is usually (but not always)
   *   the horizontal distance in pixels from the left side of the canvas.
   * @param y
   *   The y-coordinate of the canvas graphics context at which the upper-left
   *   corner of the sprite should be drawn. This is usually (but not always)
   *   the vertical distance in pixels from the top of the canvas.
   * @param w
   *   (Optional) The width of the image when drawn onto the canvas. Defaults to
   *   the sprite's projected width, which in turn defaults to the frame width.
   * @param h
   *   (Optional) The height of the image when drawn onto the canvas. Defaults
   *   to the sprite's projected height, which in turn defaults to the frame
   *   height.
   */
  draw: function(ctx, x, y, w, h) {
    try {
      ctx.save();
      w = w || this.projectedW;
      h = h || this.projectedH;
      if (this.flipped[0] || this.flipped[1]) {
        ctx.scale(this.flipped[0] ? -1 : 1, this.flipped[1] ? -1 : 1);
        if (this.flipped[0]) x = -x - w;
        if (this.flipped[1]) y = -y - h;
      }
      ctx.drawImage(
          this.image,             // image
          this.col * this.frameW, // image x-offset
          this.row * this.frameH, // image y-offset
          this.frameW,            // image slice width
          this.frameH,            // image slice height
          x,                      // canvas x-position
          y,                      // canvas y-position
          w,                      // slice width on canvas
          h                       // slice height on canvas
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
    if (!this.useTimer && Date.now() - this.lastFrameUpdateTime > this.interval) {
      this.nextFrame();
    }
  },
  /**
   * Reset the animation to its first frame.
   *
   * Usually you will want to call stopLoop() immediately before reset();
   * otherwise the animation will keep running (if it was running already).
   */
  reset: function() {
    this.row = this.startRow, this.col = this.startCol, this.frame = 1;
    this.lastFrameUpdateTime = 0;
    return this;
  },
  /**
   * Move forward or backward a specified number of frames.
   *
   * @param delta
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
   * This function supports passing either a frame number or row+column
   * coordinates as parameters. Frames outside of the accepted range will
   * overflow/underflow.
   *
   * Usually you will want to call stopLoop() immediately before setFrame();
   * otherwise the animation will keep running (if it was running already).
   */
  setFrame: function(row, col) {
    if (col != undefined) {
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
   * @param startRow
   *   The row of the frame at which animation should start.
   * @param startCol
   *   The column of the frame at which animation should start.
   * @param endRow
   *   (Optional) The row of the frame at which animation should end.
   *   Defaults to the last row in the image.
   * @param endCol
   *   (Optional) The column of the frame at which animation should end.
   *   Defaults to the last column in the image.
   * @param squeeze
   *   (Optional) A boolean determining whether startCol and endCol define
   *   a box within which to find frames for this animation, or whether
   *   frames from any column can be used (after startCol in startRow and
   *   before endCol in endRow). Defaults to false. For more information on
   *   how this works, see the documentation on instantiating a new Sprite.
   * @param flipped
   *   (Optional) An array with two boolean values indicating whether to draw
 *     each frame flipped right-to-left and top-to-bottom, respectively.
 *     Defaults to [false, false] (not flipped along either axis).
   */
  setLoop: function(startRow, startCol, endRow, endCol, squeeze, flipped) {
    this.stopLoop();
    if (endRow === null || endRow === undefined) {
      endRow = this.rows-1;
    }
    if (endCol === null || endCol === undefined) {
      endCol = this.cols-1;
    }
    if (squeeze != undefined) {
      this.squeeze = squeeze;
    }
    if (flipped != undefined) {
      this.flipped = flipped;
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
   * takes the same parameters as setLoop() for convenience; using these
   * parameters is equivalent to calling sprite.setLoop(params).startLoop().
   */
  startLoop: function(startRow, startCol, endRow, endCol, squeeze, flipped) {
    if (startRow != undefined && startCol != undefined) {
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
   * @param callback
   *   (Optional) A callback function to run after the loop has completed.
   *   Receives the sprite object as its only parameter.
   *
   * Usually this function will be called without parameters since it defaults
   * to using the sprite's settings defined at instantiation time. In cases
   * where the frames that should be used in an animation change, this function
   * takes the same parameters as setLoop() for convenience; using these
   * parameters is equivalent to calling sprite.setLoop(params).startLoop().
   */
  runLoop: function(callback, startRow, startCol, endRow, endCol, squeeze, flipped) {
    this.runLoopCallback = callback || function() {};
    this._runOnce = true;
    Array.prototype.shift.call(arguments);
    this.startLoop.apply(this, arguments);
  },
  /**
   * Goes back one frame in the animation loop.
   *
   * This is equivalent to changeFrame(-1). It is provided as a convenience
   * and to complement nextFrame().
   */
  prevFrame: function() {
    return changeFrame(-1);
  },
  /**
   * Advances one frame in the animation loop.
   *
   * This is equivalent to (but more efficient than) changeFrame(1).
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
   * @param frame
   *   The frame number to convert.
   *
   * @return
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
  },
};

this.Sprite = Sprite;

}).call(this);

// END SPRITE ANIMATION LIBRARY ===============================================
// BEGIN IMAGE CACHE HELPERS ==================================================

/**
 * Override these functions to provide alternative cache implementations.
 */
(function() {
  var images = {}; // Image cache

  /**
   * Get an image from the cache.
   *
   * @param src
   *   The file path of the image.
   *
   * @return
   *   The Image object associated with the file or null if the image object
   *   has not yet been cached.
   */
  Sprite.getImageFromCache = function(src) {
    return images[src] ? images[src] : null;
  };

  /**
   * Save an image to the cache.
   * 
   * @param src
   *   The file path of the image.
   * @param image
   *   The Image object to cache.
   */
  Sprite.saveImageToCache = function(src, image) {
    images[src] = image;
  };

  /**
   * Preload a list of images asynchronously.
   * 
   * @param files
   *   An array of paths to images to preload.
   * @param options
   *   A map of options for this function.
   *   - finishCallback: A function to run when all images have finished
   *     loading. Receives the number of images loaded as a parameter.
   *   - itemCallback: A function to run when an image has finished loading.
   *     Receives the file path of the loaded image, how many images have been
   *     loaded so far (including the current one), and the total number of
   *     images to load.
   */
  Sprite.preloadImages = function(files, options) {
    var l = files.length, m = -1;
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
    while (files.length) {
      var src = files.pop();
      var image = new Image();
      image.num = l-files.length;
      image._src = src;
      image.onload = function() {
        Sprite.saveImageToCache(this._src, this);
        notifyLoaded(options.itemCallback, this.src);
      }
      image.src = src;
    }
  };

}).call(this);

// END IMAGE CACHE HELPERS ====================================================
