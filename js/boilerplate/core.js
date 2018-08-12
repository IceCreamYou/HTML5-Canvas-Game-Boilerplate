/**
 * Provides helpful utilities for common Canvas operations.
 *
 * This file is the core of the project. It contains all the abstractions that
 * avoid low-level and boilerplate code, namely initializing / manipulating the
 * canvas and running the main animation loop (including physics timing
 * issues) as well as a few utilities.
 *
 * @ignore
 */

/**
 * The App object holds all the miscellaneous things that don't deserve to be
 * global.
 * @static
 */
var App = {};
/**
 * @property
 *   Whether the game is over. Set by calling App#gameOver().
 * @member App
 * @static
 * @readonly
 */
App.isGameOver = false;
/**
 * @property
 *   Whether Debug Mode is on or off (shows or hides debugging information).
 * @member App
 * @static
 */
App.debugMode = false;
/**
 * @property
 *   The minimum number of physics updates each second.
 *
 * If the frame rate goes below this value, the app will appear to slow down;
 * less simulated time will be processed per unit of actual time. Specifically,
 * the simulator will never simulate more than `1 / App.MIN_FPS` seconds of
 * physics during each physics step, even if the time between calculating
 * physics steps is longer than that.
 *
 * Setting this to zero is allowed, but risks entering a "spiral of death"
 * where the system attempts to calculate more and more simulated physics time
 * each frame, which takes longer and longer, which means more simulation must
 * be run...
 *
 * If the frame rate goes below this value, a
 * {@link global#event-low_fps low_fps} event fires, which you can use to
 * reduce display quality in order to improve performance.
 *
 * @member App
 * @static
 */
App.MIN_FPS = 4;
/**
 * @property
 *   The maximum number of physics updates each second.
 *
 * This determines the discrete time-step for physics updates. If the rendering
 * frame rate is faster than the resulting time-step, physics changes are not
 * updated every frame.
 *
 * Higher values cause physics to be updated more times per frame. This
 * increases simulation accuracy, but each physics update takes some time to
 * calculate that is not necessarily proportional to the amount of time being
 * simulated, so ironically having a higher MAX_FPS can actually increase the
 * time required to simulate physics and thereby slow down the frame rate. The
 * recommended value is somewhere between 60 and 100, though if your updates
 * are particularly computationally intensive and your simulation can handle
 * larger time steps, you might consider going as low as 30. Most monitors are
 * capped at 60.
 *
 * @member App
 * @static
 */
App.MAX_FPS = 100;
/**
 * @property
 *   The total amount of time simulated, in seconds.
 *
 * This is the amount of time for which physics has been calculated. Physics
 * updates in discrete chunks of time that are not necessarily synced with the
 * rendering speed, so this is potentially different than the amount of time
 * elapsed since animation started as well as potentially different than the
 * amount of time between when animation started and when the current frame was
 * requested.
 *
 * This is useful for time-based motion like a wave or spring.
 *
 * `App.physicsTimeElapsed` is a useful alternative to `performance.now()` when
 * attempting to measure only time elapsed while animation is running. See also
 * {@link Timer}.
 *
 * @member App
 * @static
 */
App.physicsTimeElapsed = 0;
// Defined later as the amount of simulated physics time since the last update.
App.physicsDelta = 0;
// App.Debug is used for tracking debugging information.
App.Debug = {};
App.Debug.updateTimeElapsed = 0;
App.Debug.clearTimeElapsed = 0;
App.Debug.drawTimeElapsed = 0;

// SETUP ----------------------------------------------------------------------

/**
 * The Canvas DOM element.
 * @member global
 */
var canvas;
/**
 * The jQuery representation of the Canvas element.
 * @member global
 */
var $canvas;
/**
 * The main Canvas graphics context.
 * @member global
 */
var context;
/**
 * The {@link World} object for the current environment.
 * @member global
 */
var world;

/**
 * Set the canvas that the app should use.
 *
 * The canvas will be automatically detected if possible, using the following
 * rules in order:
 *
 * - Look for a canvas with the DOM ID "canvas"
 * - Look for the first canvas on the page without a data-takeover attribute
 *   that has the value "false"
 * - Create a new canvas
 *
 * However, you can force a specific canvas to be used by calling this
 * function. Currently the app can only manage one canvas at a time.
 *
 * @param {Mixed} c
 *   An HTMLCanvasElement (&lt;canvas&gt; object) or a DOM ID belonging to a
 *   canvas. This is the canvas to which the app should switch.
 * @member App
 * @static
 */
App.setCanvas = function(c) {
  // Allow passing a DOM ID
  if (typeof c == 'string') {
    var oc = c;
    c = document.getElementById(c);
    if (!(c instanceof HTMLCanvasElement) && window.console && console.warn) {
      console.warn('No canvas with ID ' + oc + ' found.');
    }
  }
  if (!(c instanceof HTMLCanvasElement)) {
    // If no canvas was specified and we already have one set up, don't switch.
    if (canvas instanceof HTMLCanvasElement && typeof $canvas !== 'undefined') {
      return;
    }
    // Try to use the canvas with the ID "canvas"
    canvas = document.getElementById('canvas');
    // Automatically use the first canvas on the page without data-takeover="false"
    if (!(canvas instanceof HTMLCanvasElement)) {
      for (var i = 0, n = document.getElementsByTagName('canvas'), l = n.length; i < l; i++) {
        if (n[i].getAttribute('data-takeover') != 'false') {
          canvas = n[i];
          break;
        }
      }
    }
    // If there is no available canvas on the page, create one
    if (!(canvas instanceof HTMLCanvasElement)) {
      canvas = document.createElement('canvas');
    }
    $canvas = jQuery(canvas);
    // We've run setup before, we just decided to auto-detect again
    if (App.isSetup) {
      App.beforeSetup();
    }
    // We found the canvas automatically, so run the setup automatically
    else {
      jQuery(window).load(App.beforeSetup);
    }
  }
  else {
    // Reset the existing canvas if there is one.
    if (typeof world !== 'undefined') {
      context.translate(world.xOffset, world.yOffset);
      world.scaleResolution(1);
    }
    canvas = c;
    $canvas = jQuery(canvas);
    // We were passed a specific canvas, so set it up.
    App.beforeSetup();
  }
};

// Set up things that need to be available before setup()
jQuery(document).ready(App.setCanvas);

// Set up the app itself. This runs after main.js loads.
App.beforeSetup = function() {
  App.isSetup = true;

  // Prevent default behavior of these keys because we'll be using them and
  // they can cause other page behavior (like scrolling).
  if (typeof keys !== 'undefined') {
    for (var dir in keys) {
      if (keys.hasOwnProperty(dir)) {
        App.preventDefaultKeyEvents(keys[dir].join(' '));
      }
    }
  }

  // Resize the canvas and get the graphics context
  App.setDefaultCanvasSize();
  context = canvas.getContext('2d');

  // If we have the Stats widget, set it up.
  if (typeof Stats !== 'undefined' && App.debugMode) {
    App.stats = new Stats();
    App.stats.setMode(0);
    App.stats.domElement.style.position = 'absolute';
    App.stats.domElement.style.left = $canvas.offset().left;
    App.stats.domElement.style.top = $canvas.offset().top;
    document.body.appendChild(App.stats.domElement);
  }

  // Pre-load images and start the animation.
  Caches.preloadImages(typeof preloadables === 'undefined' ? [] : preloadables, {
    finishCallback: function() {
      // Expose utilities globally if they are not already defined.
      if (typeof Events === 'undefined' && typeof App.Events !== 'undefined') {
        Events = App.Events;
      }
      if (typeof Utils === 'undefined' && typeof App.Utils !== 'undefined') {
        Utils = App.Utils;
      }

      // Set up global stuff and start.
      App.reset(true);
    },
  });
};

/**
 * Reset the environment.
 *
 * @param {Boolean} first
 *   Whether this is the first time App.reset() is being called (i.e. whether
 *   the app is being set up for the first time or not).
 * @member App
 * @static
 */
App.reset = function(first) {
  // Don't animate while we're resetting things.
  stopAnimating();

  // Stop dragging something if we were dragging when the game stopped...
  if (App.isSomethingBeingDragged) {
    App.isSomethingBeingDragged = false;
    jQuery(document).trigger('canvasdragstop');
  }

  // If the world already exists, reset it to the origin.
  if (typeof world !== 'undefined') {
    context.translate(world.xOffset, world.yOffset);
    world.scaleResolution(1);
  }

  // Set up the world.
  // Lots of drawing depends on the world size, so set this before anything
  // else and try not to change it.
  world = new World();
  context.__layer = world;

  /**
   * @property {Timer} timer
   *   Tracks time elapsed while the app is running and during each frame.
   *
   * **Warning:** The {@link Timer#getDelta delta} is retrieved each frame and
   * used to smooth animation. Tampering with this by calling Timer#getDelta()
   * or Timer#getElapsedTime() while animation is running will cause the next
   * frame to render less simulated time than expected. With animation stopped,
   * `App.timer.getElapsedTime()` will return how long the app has actually
   * been animating. You can also use `Timer.getTimeSince('app start')` to get
   * the total time since animation began. Normally what you actually want is
   * `App.physicsTimeElapsed`.
   *
   * @member App
   * @static
   * @ignore
   */
  App.timer = new Timer(false);
  App.timer.frames = 0; // The number of frames that have been painted.

  // Reset global flags
  App.isGameOver = false;
  App.physicsTimeElapsed = 0;
  App.Debug.updateTimeElapsed = 0;
  App.Debug.clearTimeElapsed = 0;
  App.Debug.drawTimeElapsed = 0;

  // Run the developer's setup code.
  var start = setup(!!first);

  // Start animating!
  Timer.event('app start');
  if (start !== false) {
    startAnimating();
  }

  /**
   * @event start
   *   Fires on the document when all setup is complete.
   *
   * Unless specified otherwise by the return value of setup(), animation
   * will have started by this point.
   *
   * Useful for running intro graphics.
   *
   * @param {Boolean} again
   *   true if the app has been reset and is starting over; false the first
   *   time it is being set up.
   * @member global
   */
  jQuery(document).trigger('start', [!!first]);
};

/**
 * Set the default size of the canvas as early as possible.
 *
 * The canvas is resized according to the following rules, in order of
 * precedence:
 *
 * - The browser will first automatically set the canvas to the size specified
 *   by its `width` and `height` attributes. If the canvas element has a
 *   `data-resize` attribute set to `false`, processing stops here and no more
 *   resizing rules are applied.
 * - If the canvas element has a `data-resize` attribute set to `full`, it will
 *   be resized to the maximum size that fits within the browser window.
 * - If the canvas element has `data-minwidth` or `data-minheight` attributes
 *   (with numeric values in pixels) it will not be scaled smaller than those
 *   dimensions.
 * - If the canvas element has `data-maxwidth` or `data-maxheight` attributes
 *   (with numeric values in pixels) it will not be scaled larger than those
 *   dimensions.
 * - The canvas will scale to the largest size that fits within both the window
 *   and the max attributes (if they are present).
 * - In all cases except when `data-resize="false"`, the `data-aspectratio`
 *   attribute takes effect if present. This causes the canvas to resize to the
 *   largest possible size within the boundaries of the size calculated from
 *   the other rules, while still maintaining the specified aspect ratio. The
 *   value of this attribute can be any floating point number or one of the
 *   common ratios "4:3", "16:9", "16:10", or "8:5". For example, with an
 *   aspect ratio of 4:3, if the width was calculated to be 1024 and the height
 *   was calculated to be 800, the height would be adjusted to 768.
 *
 * Note that using CSS to resize the canvas causes it to scale the graphics as
 * well; it changes the size of each virtual "pixel" on the canvas rather than
 * changing the number of pixels inside the canvas. Unless you want to stretch
 * the canvas display, using CSS to resize the canvas is not recommended. (If
 * you do want to stretch the canvas display, for example to zoom in or reduce
 * the number of pixels to render, take a look at World#scaleResolution.)
 *
 * @member App
 * @static
 */
App.setDefaultCanvasSize = function() {
  // Set the canvas size in CSS. This fixes the size of the canvas on the
  // screen, so from here forward if we change canvas.width or canvas.height
  // (for example, using World#scaleResolution) we will actually be changing
  // the render size; and then CSS will scale the rendered buffer to the
  // display size. (That's right; the width/height attributes mean something
  // different than the width/height CSS properties.) We're also setting the
  // scale3d transform which enables GPU rendering.
  var ensureCanvasSize = function() {
    $canvas.css({
      // Force hardware accelerated rendering
      transform: 'scale3d(1, 1, 1)',
      mozTransform: 'scale3d(1, 1, 1)',
      msTransform: 'scale3d(1, 1, 1)',
      oTransform: 'scale3d(1, 1, 1)',
      webkitTransform: 'scale3d(1, 1, 1)',
    });
  };
  // Do not resize if data-resize is false (fall back to CSS).
  if ($canvas.attr('data-resize') == 'false') {
    ensureCanvasSize();
    return;
  }
  var $window = jQuery(window);
  // If requested, make the canvas the size of the browser window.
  if ($canvas.attr('data-resize') == 'full') {
    canvas.width = $window.innerWidth() -
      parseInt($canvas.css('border-left-width'), 10) -
      parseInt($canvas.css('border-right-width'), 10) - 1;
    canvas.height = $window.innerHeight() -
      parseInt($canvas.css('border-top-width'), 10) -
      parseInt($canvas.css('border-bottom-width'), 10) - 1;
  }
  // Use the following properties to determine canvas size automatically:
  // width, height, data-minwidth, data-maxwidth, data-minheight, data-maxheight
  // If the width and height are not explicitly specified, the canvas is
  // resized to the largest size that fits within the max and the window, with
  // a minimum of min.
  else {
    var maxWidth = $canvas.attr('data-maxwidth') || canvas.width;
    var minWidth = $canvas.attr('data-minwidth') || canvas.width;
    canvas.width = Math.min(maxWidth, Math.max($window.width(), minWidth));
    var maxHeight = $canvas.attr('data-maxheight') || canvas.height;
    var minHeight = $canvas.attr('data-minheight') || canvas.height;
    canvas.height = Math.min(maxHeight, Math.max($window.height(), minHeight));
  }
  var aspectRatio = $canvas.attr('data-aspectratio') || 0;
  if (aspectRatio) {
    if (aspectRatio.indexOf(':') == -1) {
      aspectRatio = parseFloat(aspectRatio);
    }
    else {
      if (aspectRatio == '4:3') aspectRatio = 4/3;
      else if (aspectRatio == '16:9') aspectRatio = 16/9;
      else if (aspectRatio == '16:10' || aspectRatio == '8:5') aspectRatio = 1.6;
    }
    if (canvas.width < canvas.height * aspectRatio) {
      canvas.height = Math.floor(canvas.width / aspectRatio);
    }
    else if (canvas.width > canvas.height * aspectRatio) {
      canvas.width = Math.floor(canvas.height * aspectRatio);
    }
  }
  ensureCanvasSize();
};

// CACHES ---------------------------------------------------------------------

/**
 * Tracks cached items.
 * @static
 */
var Caches = {
    /**
     * A map from image file paths to Image objects.
     * @static
     */
    images: {},
    /**
     * A map from image file paths to CanvasPattern objects.
     * @static
     */
    imagePatterns: {},
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
     *   The number of images that have been loaded so far (including the
     *   current one).
     * @param {Number} [options.itemCallback.numImages]
     *   The total number of images to load.
     *
     * @static
     */
    preloadImages: function(files, options) {
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
        Caches.images[this._src] = this;
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
    },
};

// Override the Sprite caching mechanisms.
if (typeof Sprite !== 'undefined') {
  Sprite.getImageFromCache = function(src) {
    return Caches.images[src];
  };
  Sprite.saveImageToCache = function(src, image) {
    Caches.images[src] = image;
  };
  Sprite.preloadImages = Caches.preloadImages;
}

// ANIMATION ------------------------------------------------------------------

// requestAnimationFrame shim for smooth animation
window.requestAnimFrame = (function() {
    return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function(callback) {
        window.setTimeout(callback, 1000 / 60);
    };
})();

(function() {
  // Indicates whether the canvas is animating or focused.
  var _animate = false, _blurred = false;

/**
 * Start animating the canvas.
 *
 * See also {@link global#method-stopAnimating stopAnimating()} and
 * {@link global#method-isAnimating isAnimating()}.
 *
 * @member global
 */
window.startAnimating = function() {
  if (!_animate && typeof App.timer !== 'undefined') {
    _animate = true;
    /**
     * @event startAnimating
     *   Fires on the document when the animation loop is about to begin.
     * @member global
     */
    jQuery(document).trigger('startAnimating');
    animate();
  }
};

/**
 * Stop animating the canvas.
 *
 * See also {@link global#method-startAnimating startAnimating()} and
 * {@link global#method-isAnimating isAnimating()}.
 *
 * @member global
 */
window.stopAnimating = function() {
  if (!_animate || typeof App.timer === 'undefined') {
    return;
  }
  _animate = false;
  // Although stopAnimating() can be called asynchronously from the game loop,
  // this is effectively the same as stopping the timer immediately after the
  // last call to App.timer.getDelta() (i.e. when the last frame was rendered)
  // because nothing interesting happens after that, and when animation is
  // started again the timer doesn't start until the first frame is requested
  // so the delta is still correct.
  App.timer.stop();
  /**
   * @event stopAnimating
   *   Fires on the document when the animation loop is ending.
   * @member global
   */
  jQuery(document).trigger('stopAnimating');

  // Output performance statistics.
  // This can be slightly inaccurate because this function can be called in the
  // middle of updating a frame, rather than after the last frame is drawn.
  if (App.debugMode && console && console.log) {
    var elapsed = App.physicsTimeElapsed, frames = App.timer.frames, d = App.Debug;
    var sum = d.updateTimeElapsed + d.clearTimeElapsed + d.drawTimeElapsed;
    console.log({
      'ms/frame': {
        update: d.updateTimeElapsed / frames,
        clear: d.clearTimeElapsed / frames,
        draw: d.drawTimeElapsed / frames,
        animOps: sum / frames,
        other: (elapsed - sum) / frames,
        animate: elapsed / frames,
      },
      percent: {
        update: d.updateTimeElapsed / elapsed * 100,
        clear: d.clearTimeElapsed / elapsed * 100,
        draw: d.drawTimeElapsed / elapsed * 100,
        animOps: sum / elapsed * 100,
        other: (elapsed - sum) / elapsed * 100,
      },
      fps: frames / elapsed,
    });
  }
};

/**
 * Determine whether the canvas is currently animating.
 *
 * See also {@link global#method-startAnimating startAnimating()} and
 * {@link global#method-stopAnimating stopAnimating()}.
 *
 * @member global
 */
window.isAnimating = function() {
  return _animate;
};

/**
 * Animate the canvas. This is intended for private use and should not be
 * called directly. Instead see {@link #startAnimating} and
 * {@link #stopAnimating}.
 *
 * @member App
 * @ignore
 */
function animate() {
  if (typeof App.stats !== 'undefined') {
    App.stats.begin();
  }

  // Record the amount of time since the last tick. Used to smooth animation.
  // This is the only place that App.timer.getDelta() should ever be called
  // because getDelta() returns the time since the last time it was called so
  // calling it elsewhere will skew the result here.
  var frameDelta = App.timer.getDelta();
  // Starts the timer in the first animation frame. Doing this here instead of
  // in startAnimating() lets us get the delta right for the first frame.
  if (!App.timer.running) {
    App.timer.start();
  }
  // Cap the delta in order to avoid the spiral of death.
  if (App.MIN_FPS && frameDelta > 1 / App.MIN_FPS) {
    /**
     * @event low_fps
     *   Fires on the document when the frame rate drops below App.MIN_FPS.
     *
     * @param {Number} fps The frame-per-second rate.
     *
     * @member global
     */
    jQuery(document).trigger('low_fps', [1 / frameDelta]);
    frameDelta = 1 / App.MIN_FPS;
  }
  // Count paints so we can calculate overall FPS
  App.timer.frames++;

  if (App.debugMode) {
    Timer.event('debug timer update', true);
  }

  // update
  if (window.Mouse && Mouse.Scroll) {
    Mouse.Scroll._update();
  }
  while (frameDelta > 0 && !App.isGameOver) {
    // Break the physics updates down into discrete chunks of no more than
    // 1 / App.MAX_FPS in order to keep them as small as possible for accuracy.
    /**
     * @property physicsDelta
     *   The amount of simulated time in seconds since the last physics update.
     *
     * Use this to smooth animation.
     *
     * @member App
     * @static
     */
    App.physicsDelta = Math.min(frameDelta, 1 / App.MAX_FPS);
    if (typeof update == 'function') {
      update(App.physicsDelta, App.physicsTimeElapsed);
    }
    frameDelta -= App.physicsDelta;
    App.physicsTimeElapsed += App.physicsDelta;
  }

  if (App.debugMode) {
    App.Debug.updateTimeElapsed += Timer.getTimeSince('debug timer update');
    Timer.event('debug timer clear', true);
  }

  // clear
  context.clear();

  if (App.debugMode) {
    App.Debug.clearTimeElapsed += Timer.getTimeSince('debug timer clear');
    Timer.event('debug timer draw', true);
  }

  // draw
  draw();

  if (App.debugMode) {
    App.Debug.drawTimeElapsed += Timer.getTimeSince('debug timer draw');
  }

  if (typeof App.stats !== 'undefined') {
    App.stats.end();
  }

  // request new frame
  if (_animate) {
    window.requestAnimFrame(animate);
  }
}

/**
 * Stops animating when the window (tab) goes out of focus.
 *
 * This stops running the CPU when we don't need it, but it can cause
 * unexpected behavior if you expect something to be running in the background
 * while focus is not on the browser. If you don't want this behavior, you can
 * toggle it off with `$(window).off('.animFocus');`
 *
 * @ignore
 */
jQuery(window).on('focus.animFocus', function() {
  if (_blurred && !App.isGameOver) {
    _blurred = false;
    startAnimating();
  }
});
jQuery(window).on('blur.animFocus', function() {
  stopAnimating();
  _blurred = true;
});

})();

// INPUT ----------------------------------------------------------------------

/**
 * Prevent the default behavior from occurring when hitting keys.
 *
 * This won't prevent everything -- for example it won't prevent combinations
 * of multiple non-control-character keys -- and if you want to do something
 * like prevent the default effect of hitting Enter but not Shift+Enter then
 * you need to handle that yourself.
 *
 * Behavior of the keys specified in the `keys` variable are automatically
 * prevented by default.
 *
 * @param {String} combinations
 *   A string containing key combinations to prevent. See
 *   {@link jQuery.hotkeys} for an explanation of what key combinations are
 *   acceptable.
 *
 * @member App
 * @static
 */
App.preventDefaultKeyEvents = function(combinations) {
  if (jQuery.hotkeys) {
    jQuery(document).keydown(combinations, function() { return false; });
  }
  else if (window.console && console.warn) {
    console.warn('Tried to prevent default key events but jQuery.hotkeys does not exist.');
  }
};

// TIMER ----------------------------------------------------------------------

// performance.now() shim
window.performance = window.performance || {};
performance.now = (function() {
  return performance.now       ||
         performance.mozNow    ||
         performance.msNow     ||
         performance.oNow      ||
         performance.webkitNow ||
         function() { return Date.now(); };
})();

/**
 * A timer.
 *
 * Adapted from the
 * [three.js clock](https://github.com/mrdoob/three.js/blob/master/src/core/Clock.js).
 *
 * If you only care about how long something takes (e.g. when testing
 * performance) and you don't need to stop the timer, Timer#event() and
 * Timer#getTimeSince() are more efficient than instantiating a new Timer
 * object.
 *
 * @param {Boolean} [autoStart=true]
 *   Whether to start the timer immediately upon instantiation or wait until
 *   the Timer#start() method is called.
 * @param {Boolean} [whileAnimating=false]
 *   Indicates whether the amount of time measured should be the time elapsed
 *   only while animation was running (true) or the total time elapsed (false).
 */
function Timer(autoStart, whileAnimating) {
  this.autoStart = typeof autoStart === 'undefined' ? true : autoStart;
  this.whileAnimating = whileAnimating || false;
  this.lastStartTime = 0;
  this.lastDeltaTime = 0;
  this.elapsedTime = 0;
  this.running = false;
  /**
   * Get the time elapsed in seconds since the last time a delta was measured.
   *
   * Deltas are taken when the timer starts or stops or elapsed time is
   * measured.
   *
   * Note that if the timer is stopped and autoStart is on, calling this method
   * will start the timer again.
   */
  this.getDelta = function() {
    var diff = 0;
    if (this.running) {
      var now = this.whileAnimating ? App.physicsTimeElapsed : performance.now();
      diff = (now - this.lastDeltaTime) / 1000; // ms to s
      this.lastDeltaTime = now;
      this.elapsedTime += diff;
    }
    return diff;
  };
  /**
   * Start the timer.
   */
  this.start = function() {
    if (this.running) {
      return;
    }
    this.lastStartTime = this.lastDeltaTime = this.whileAnimating ?
        App.physicsTimeElapsed :
          performance.now();
    this.running = true;
  };
  /**
   * Stop the timer.
   */
  this.stop = function () {
    this.elapsedTime += this.getDelta();
    this.running = false;
  };
  /**
   * Get the amount of time the timer has been running, in seconds.
   */
  this.getElapsedTime = function() {
    this.getDelta();
    return this.elapsedTime;
  };
  if (this.autoStart) {
    this.start();
  }
}

(function() {
  var events = {}, noID = 0;
  /**
   * Register the time at which an event occurred.
   *
   * If you only care about how long something takes (e.g. when testing
   * performance) and you don't need to stop the timer, Timer#event() and
   * Timer#getTimeSince() are more efficient than instantiating a new Timer
   * object.
   *
   * @param {String} [id]
   *   An identifier for the event.
   * @param {Boolean} [whileAnimating=false]
   *   Indicates whether the amount of time measured between when Timer#event()
   *   is called and when Timer#getTimeSince() is called should be the time
   *   elapsed only while animation was running (true) or the total time
   *   elapsed (false).
   * @static
   */
  Timer.event = function(id, whileAnimating) {
    var result = {
        whileAnimating: whileAnimating,
        startTime: whileAnimating ? App.physicsTimeElapsed : performance.now(),
    };
    if (typeof id === 'undefined') {
      noID = result;
    }
    else {
      events[id] = result;
    }
  };
  /**
   * Return the time since an event occurred.
   *
   * If you only care about how long something takes (e.g. when testing
   * performance) and you don't need to stop the timer, Timer#event() and
   * Timer#getTimeSince() are more efficient than instantiating a new Timer
   * object.
   *
   * @param {String} [id] An identifier for the event.
   * @return {Number} Seconds since the event, or 0 if the event is not found.
   * @static
   */
  Timer.getTimeSince = function(id) {
    var event = typeof events[id] === 'undefined' ? noID : events[id];
    var now = event.whileAnimating ? App.physicsTimeElapsed : performance.now();
    return event.startTime ? (now - event.startTime) / 1000 : 0;
  };
})();

// WORLD ----------------------------------------------------------------------

/**
 * The World object.
 *
 * The World represents the complete playable game area. Its size can be set
 * explicitly or is automatically determined by the "data-worldwidth" and
 * "data-worldheight" attributes set on the HTML canvas element (with a
 * fallback to the canvas width and height). If the size of the world is larger
 * than the canvas then by default the view of the world will scroll when the
 * {@link global#player player} approaches a side of the canvas.
 *
 * @param {Number} [w]
 *   The width of the world. Defaults to the value of the "data-worldwidth"
 *   attribute on the HTML canvas element, or (if that attribute is not
 *   present) the width of the canvas element.
 * @param {Number} [h]
 *   The height of the world. Defaults to the value of the "data-worldheight"
 *   attribute on the HTML canvas element, or (if that attribute is not
 *   present) the height of the canvas element.
 */
function World(w, h) {
  /**
   * @property {Number} scale
   *   The percent amount (as a fraction) the canvas resolution is linearly
   *   scaled relative to its original size. For example, if the canvas started
   *   at 1024x768 and it is now rendering at 512x384, then the scale will be
   *   0.5. Notice that the number of virtual pixels rendered on the canvas
   *   changes with the square of the scale.
   */
  this.scale = 1;
  /**
   * @property {Number} _actualXscale
   *   The actual amount the width of the canvas is scaled relative to the
   *   display size.
   *
   * This can be different than `this.scale` due to rounding error. This
   * matters when converting document coordinates to canvas coordinates, for
   * example when tracking mouse coordinates.
   * @ignore
   */
  this._actualXscale = 1;
  /**
   * @property {Number} _actualYscale
   *   The actual amount the height of the canvas is scaled relative to the
   *   display size.
   *
   * This can be different than `this.scale` due to rounding error. This
   * matters when converting document coordinates to canvas coordinates, for
   * example when tracking mouse coordinates.
   * @ignore
   */
  this._actualYscale = 1;

  /**
   * @property {Number} width
   *   The width of the world.
   */
  this.width = w || parseInt($canvas.attr('data-worldwidth'), 10) || canvas.width;
  /**
   * @property {Number} height
   *   The height of the world.
   */
  this.height = h || parseInt($canvas.attr('data-worldheight'), 10) || canvas.height;

  /**
   * @property {Number} originalCanvasWidth
   *   The width of the canvas when the world was initialized.
   *
   * This is used to keep the canvas size consistent when scaling resolution.
   * @ignore
   */
  this.originalCanvasWidth = canvas.width;
  /**
   * @property {Number} originalCanvasHeight
   *   The height of the canvas when the world was initialized.
   *
   * This is used to keep the canvas size consistent when scaling resolution.
   * @ignore
   */
  this.originalCanvasHeight = canvas.height;

  /**
   * @property {Number} xOffset
   *   The pixel-offset of what's being displayed in the canvas compared to the
   *   world origin.
   */
  this.xOffset = (this.width - canvas.width)/2;
  /**
   * @property {Number} yOffset
   *   The pixel-offset of what's being displayed in the canvas compared to the
   *   world origin.
   */
  this.yOffset = (this.height - canvas.height)/2;
  context.translate(-this.xOffset, -this.yOffset);

  /**
   * Resize the world to new dimensions.
   *
   * Careful! This will shift the viewport regardless of where the player is.
   * Objects already in the world will retain their coordinates and so may
   * appear in unexpected locations on the screen.
   *
   * @param {Number} newWidth The new width to which to resize the world.
   * @param {Number} newHeight The new height to which to resize the world.
   */
  this.resize = function(newWidth, newHeight) {
    // Try to re-center the offset of the part of the world in the canvas
    // so we're still looking at approximately the same thing.
    var deltaX = (newWidth - this.width) / 2, deltaY = (newHeight - this.height) / 2;
    this.xOffset += deltaX;
    this.yOffset += deltaY;
    context.translate(-deltaX, -deltaY);

    // Change the world dimensions.
    this.width = newWidth;
    this.height = newHeight;

    /**
     * @event resizeWorld
     *   Broadcast that the world size changed so that objects already in the
     *   world or other things that depend on the world size can update their
     *   position or size accordingly.
     * @param {Number} x How far in pixels the viewport shifted horizontally.
     * @param {Number} y How far in pixels the viewport shifted vertically.
     * @param {World} resizedWorld The world that changed size.
     */
    jQuery(document).trigger('resizeWorld', [deltaX, deltaY, this]);
  };

  /**
   * Scale the resolution of the primary canvas.
   *
   * Passing a factor smaller than 1 allows reducing the resolution of the
   * canvas, which should improve performance (since there is less to render in
   * each frame). It does not actually change the size of the canvas on the
   * page; it just scales how big each "pixel" is drawn on the canvas, much
   * like changing the resolution of your monitor does not change its physical
   * size. It is your responsibility to change the size of any fixed-size
   * entities in the world after resizing, if applicable; if you don't do this,
   * calling this function works much like zooming in or out.
   *
   * Note that this method only scales the primary canvas, not any
   * {@link Layer}s that may be drawn onto it. Drawing non-scaled Layers onto a
   * scaled primary canvas will make the result appear scaled, but the spacing
   * may be off depending on how you are positioning the items you are drawing
   * onto the relevant Layers. Of course, you can manually resize your Layers
   * after scaling, or only scale the primary canvas during initalization and
   * then create all Layers subsequently at appropriate sizes, or make Layers
   * be positioned over the canvas using {@link Layer#positionOverCanvas}().
   *
   * You may want to call this in a listener for the
   * {@link global#low_fps Low FPS event}.
   *
   * @param {Number} factor
   *   The percent amount to scale the resolution on each dimension as a
   *   fraction of the <em>original</em> resolution (typically between zero and
   *   one). In other words, if the original resolution is 1024x768, scaling
   *   the resolution by a factor of 0.5 will result in a resolution of 512x384
   *   (showing 25% as many pixels on the screen). If scaled again by a factor
   *   of 2, the result will be 2048x1536. Use the `scale` property to detect
   *   the factor by which the resolution is currently scaled.
   * @param {Number} [x]
   *   The x-coordinate of a location to center the viewport around after
   *   resizing the canvas. A common use is `player.x`. Defaults to centering
   *   around the current view.
   * @param {Number} [y]
   *   The y-coordinate of a location to center the viewport around after
   *   resizing the canvas. A common use is `player.y`. Defaults to centering
   *   around the current view.
   */
  this.scaleResolution = function(factor, x, y) {
    // Define the display size so we can rescale the rendering size
    if (!$canvas.hasClass('canvas-rescaled')) {
      $canvas.css({
        width: canvas.width + 'px',
        height: canvas.height + 'px',
      });
      $canvas.addClass('canvas-rescaled');
    }
    // Default to centering around the current center of the viewport.
    x = x || this.xOffset + canvas.width / 2;
    y = y || this.yOffset + canvas.height / 2;
    // The original canvas size is pre-set using App.setDefaultCanvasSize() so
    // changing the value of the attributes just changes the number of pixels
    // to render. CSS then scales that buffer to the original canvas size.
    canvas.width = Math.round(this.originalCanvasWidth*factor);
    canvas.height = Math.round(this.originalCanvasHeight*factor);
    this._actualXscale = canvas.width / this.originalCanvasWidth;
    this._actualYscale = canvas.height / this.originalCanvasHeight;
    this.xOffset = Math.round(Math.min(this.width - canvas.width, Math.max(0, x - canvas.width / 2)));
    this.yOffset = Math.round(Math.min(this.height - canvas.height, Math.max(0, y - canvas.height / 2)));
    context.translate(-this.xOffset, -this.yOffset);
    this.scale = factor;
    if (!isAnimating()) {
      draw();
    }
  };

  /**
   * Convert a position over the canvas to a position in the world.
   *
   * The canvas position being converted should be in displayed pixels from the
   * upper-left corner of the canvas.
   *
   * This could be useful when placing objects at a given location in the
   * canvas if you need the object to align with something outside of the
   * canvas. (Note that {@link Mouse.Coords} already has worldX() and worldY()
   * methods for representing the mouse position in the world.)
   *
   * @param {Number} x The x-position over the canvas to convert.
   * @param {Number} y The y-position over the canvas to convert.
   *
   * @return {Object}
   *   An object with `x` and `y` properties representing x- and y-coordinates
   *   in the world.
   */
  this.canvasToWorldPosition = function(x, y) {
    return {
      x: x * this._actualXscale + this.xOffset,
      y: y * this._actualYscale + this.yOffset,
    };
  };
  /**
   * Convert a position in the world to a position over the canvas.
   *
   * The returned canvas position will be in displayed pixels from the
   * upper-left corner of the canvas. This is useful when positioning DOM
   * elements over the canvas, for example with
   * {@link App.Utils#positionOverCanvas}.
   *
   * If you instead want the position relative to the rendered canvas, which
   * may be useful for example if you want to transition something from
   * scrolling to fixed position, you should instead use `x - world.xOffset`
   * and `y - world.yOffset`. The difference between displayed and rendered
   * position is only relevant when the canvas has been scaled with
   * {@link World#scaleResolution}, causing the canvas to be rendered at one
   * size and then scaled to another for display using CSS.
   *
   * @param {Number} x The x-position over the canvas to convert.
   * @param {Number} y The y-position over the canvas to convert.
   *
   * @return {Object}
   *   An object with `x` and `y` properties representing x- and y-coordinates
   *   over the canvas.
   */
  this.worldToCanvasPosition = function(x, y) {
    return {
      x: (x - this.xOffset) / this._actualXscale,
      y: (y - this.yOffset) / this._actualYscale,
    };
  };

  /**
   * Center the viewport around a specific location in the world.
   *
   * @param {Number} x The x-coordinate around which to center the viewport.
   * @param {Number} y The y-coordinate around which to center the viewport.
   */
  this.centerViewportAround = function(x, y) {
    var newXOffset = Math.min(this.width - canvas.width, Math.max(0, x - canvas.width / 2)) | 0,
        newYOffset = Math.min(this.height - canvas.height, Math.max(0, y - canvas.height / 2)) | 0,
        deltaX = this.xOffset - newXOffset,
        deltaY = this.yOffset - newYOffset;
    this.xOffset = newXOffset;
    this.yOffset = newYOffset;
    context.translate(deltaX, deltaY);
  };

  /**
   * Determine whether a Box is inside the viewport.
   *
   * To test whether a Box is inside the World, see World#isInWorld().
   *
   * @param {Box} box
   *   The Box object to check for visibility.
   * @param {Boolean} [partial=false]
   *   Indicates whether to consider the Box inside the viewport if it is only
   *   partially inside (true) or fully inside (false).
   *
   * @return {Boolean}
   *   true if the Box is inside the viewport; false otherwise.
   */
  this.isInView = function(box, partial) {
    if (partial) {
      return box.x + box.width > this.xOffset &&
        box.x < this.xOffset + canvas.width &&
        box.y + box.height > this.yOffset &&
        box.y < this.yOffset + canvas.height;
    }
    return box.x > this.xOffset &&
      box.x + box.width < this.xOffset + canvas.width &&
      box.y > this.yOffset &&
      box.y + box.height < this.yOffset + canvas.height;
  };

  /**
   * Determine whether a Box is inside the world.
   *
   * To test whether a Box is inside the viewport, see World#isInView().
   *
   * @param {Box} box
   *   The Box object to check.
   * @param {Boolean} [partial=false]
   *   Indicates whether to consider the box inside the world if it is only
   *   partially inside (true) or fully inside (false).
   *
   * @return {Boolean}
   *   true if the Box is inside the world; false otherwise.
   */
  this.isInWorld = function(box, partial) {
    if (partial) {
      return box.x + box.width >= 0 && box.x <= world.width &&
        box.y + box.height >= 0 && box.y <= world.height;
    }
    return box.x >= 0 && box.x + box.width <= world.width &&
      box.y >= 0 && box.y + box.height <= world.height;
  };
}

// UTILITIES ------------------------------------------------------------------

/**
 * @class App.Utils
 *   A miscellaneous collection of utilities.
 * @alternateClassName Utils
 * @static
 */
App.Utils = {};

/**
 * Get a random number between two numbers.
 *
 * @param {Number} lo The first number.
 * @param {Number} hi The second number.
 * @return {Number} A random number between lo and hi.
 * @static
 */
App.Utils.getRandBetween = function(lo, hi) {
  if (lo > hi) {
    var t = lo;
    lo = hi;
    hi = t;
  }
  return Math.random() * (hi - lo) + lo;
};

/**
 * Get a random integer between two numbers, inclusive.
 *
 * This function makes no assumptions; despite the parameters being called lo
 * and hi, either one can be higher, and either or both can be integers or
 * floats. If either of the numbers is a float, the random distribution remains
 * equal among eligible integers; that is, if lo==3.3 and hi==5, 4 and 5 are
 * equally likely to be returned. Behavior is undefined if there is no integer
 * between lo and hi. Negative numbers work as well.
 *
 * @param {Number} lo The first number.
 * @param {Number} hi The second number.
 * @return {Number} A random integer between lo and hi.
 * @static
 */
App.Utils.getRandIntBetween = function(lo, hi) {
  if (lo > hi) {
    var t = lo;
    lo = hi;
    hi = t;
  }
  lo = Math.ceil(lo);
  hi = Math.floor(hi);
  return Math.floor(Math.random()*(hi-lo+1)+lo);
};

/**
 * Check if any of the elements in an Array are found in another Array.
 *
 * @param {Array} search
 *   An Array of elements to search for in the target.
 * @param {Array} target
 *   An Array in which to search for matching elements.
 *
 * @return {Boolean}
 *   true if at least one match was found; false otherwise.
 *
 * @static
 */
App.Utils.anyIn = function(search, target) {
  for (var i = 0, l = search.length; i < l; i++) {
    if (target.indexOf(search[i]) != -1) {
      return true;
    }
  }
  return false;
};

/**
 * Determine whether a is within e of b, inclusive.
 *
 * @param {Number} a
 * @param {Number} b
 * @param {Number} e
 * @static
 */
App.Utils.almostEqual = function(a, b, e) {
  // Another (slower) way to express this is Math.abs(a - b) < e
  return a >= b - e && a <= b + e;
};

/**
 * Generate a random URL-safe string of arbitrary length.
 *
 * Useful for generating unique IDs.
 *
 * @param {Number} [n=32]
 *   The number of characters in the generated string.
 *
 * @return {String}
 *   A random string n characters long.
 *
 * @static
 */
App.Utils.randomString = function(n) {
  var c = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_',
      s = '';
  n = n || 32;
  for (var i = 0; i < n; i++) {
    s += c.charAt(Math.floor(Math.random() * c.length));
  }
  return s;
};

/**
 * Position a DOM element at a specific location over the canvas.
 *
 * Useful for placing forms, text, menus, and other UI elements that are more
 * easily handled in HTML.
 *
 * To place the DOM element at a specific location in the world, convert the
 * position in the world to a position over the canvas using
 * {@link World#worldToCanvasPosition}.
 *
 * @param {HTMLElement} elem
 *   A DOM element or jQuery representation of a DOM element to position over
 *   the canvas.
 * @param {Number} x
 *   The number of pixels to the right of the upper-left corner of the canvas
 *   at which to locate the DOM element.
 * @param {Number} y
 *   The number of pixels below the upper-left corner of the canvas at which to
 *   locate the DOM element.
 *
 * @return {Object}
 *   The jQuery representation of the positioned DOM element.
 *
 * @static
 */
App.Utils.positionOverCanvas = function(elem, x, y) {
  var o = $canvas.offset();
  return jQuery(elem).detach().appendTo('body').css({
    left: (o.left + parseInt($canvas.css('border-left-width'), 10) + x) + 'px',
    position: 'absolute',
    top: (o.top + parseInt($canvas.css('border-top-width'), 10) + y) + 'px',
    'z-index': 100,
  });
};

/**
 * End the game, display a message, and allow clicking to restart.
 *
 * To disable clicking to restart, run `$canvas.off('.gameover');`
 *
 * @param {String} [text="GAME OVER"]
 *   Text to overlay on the screen.
 *
 * @member App
 * @static
 */
App.gameOver = function(text) {
  if (App.isGameOver) {
    return;
  }
  App.isGameOver = true;
  stopAnimating();
  if (player) {
    player.destroy();
  }
  if (typeof text != 'string') {
    text = "GAME OVER";
  }
  // This runs during update() before the final draw(), so we have to delay it.
  setTimeout(function() {
    context.save();
    context.font = '100px Arial';
    context.fillStyle = 'black';
    context.strokeStyle = 'lightGray';
    context.textBaseline = 'middle';
    context.textAlign = 'center';
    context.shadowColor = 'black';
    context.shadowBlur = 8;
    context.lineWidth = 5;
    var x = Math.round(world.xOffset+canvas.width/2);
    var y = Math.round(world.yOffset+canvas.height/2);
    context.strokeText(text, x, y);
    context.fillText(text, x, y);
    context.restore();
  }, 100);
  $canvas.css('cursor', 'pointer');
  $canvas.one('click.gameover', function(e) {
    e.preventDefault();
    $canvas.css('cursor', 'auto');
    App.reset();
  });
};

/** @class Array The built-in JavaScript Array class. */

/**
 * Remove an item from an array by value.
 *
 * @param {Mixed} item
 *   The item to remove from the array, if it exists.
 *
 * @return {Array}
 *   An array containing the removed elements, if any.
 *
 * @member Array
 */
Array.prototype.remove = function(item) {
  var i = this.indexOf(item);
  if (i === undefined || i < 0) {
    return undefined;
  }
  return this.splice(i, 1);
};

/** @class Number The built-in JavaScript Number class. */

/**
 * Round a number to a specified precision.
 *
 * Usage:
 *
 *     3.5.round(0) // 4
 *     Math.random().round(4) // 0.8179
 *     var a = 5532; a.round(-2) // 5500
 *     Number.prototype.round(12345.6, -1) // 12350
 *     32..round(-1) // 30 (two dots required since the first one is a decimal)
 *
 * @param {Number} v
 *   The number to round. (This parameter only applies if this function is
 *   called directly. If it is invoked on a Number instance, then that number
 *   is used instead, and only the precision parameter needs to be passed.)
 * @param {Number} a
 *   The precision, i.e. the number of digits after the decimal point
 *   (including trailing zeroes, even though they're truncated in the returned
 *   result). If negative, precision indicates the number of zeroes before the
 *   decimal point, e.g. round(1234, -2) yields 1200. If non-integral, the
 *   floor of the precision is used.
 *
 * @return {Number}
 *   `v` rounded to `a` precision.
 *
 * @member Number
 */
Number.prototype.round = function(v, a) {
  if (typeof a === 'undefined') {
    a = v;
    v = this;
  }
  if (!a) a = 0;
  var m = Math.pow(10, a|0);
  return Math.round(v*m)/m;
};

/**
 * Return the sign of a number.
 *
 * @param {Number} v
 *   The number whose sign should be retrieved.
 *
 * @return {Number}
 *   Returns 1 if the number is greater than zero, -1 if it is less than zero,
 *   and 0 if it is equal to zero.
 *
 * @member Number
 */
Number.prototype.sign = function(v) {
  if (typeof v === 'undefined') {
    v = this;
  }
  return v > 0 ? 1 : (v < 0 ? -1 : 0);
};
