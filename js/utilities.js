/**
 * Provides helpful utilities for common Canvas operations.
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
App.physicsDelta = 0;
/**
 * @property
 *   Whether an {@link Actor} is being dragged.
 *
 * Drop targets can change how they look when a draggable object is hovered
 * over them by testing `this.isHovered() && App.isSomethingBeingDragged` in
 * their {@link Box#draw draw()} methods.
 *
 * @member App
 * @static
 */
App.isSomethingBeingDragged = false;
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
 * Handles mouse motion and scrolling.
 * @static
 */
var Mouse = {
    /**
     * @property
     *   The coordinates of the mouse relative to the upper-left corner of the
     *   canvas.
     * @static
     */
    coords: {x: 9999, y: 9999},
};

// Indicates whether the canvas is animating or focused.
App._animate = false, App._blurred = false;

// Set up important activities.
jQuery(document).ready(function() {
  // Set up the canvas.
  canvas = document.getElementById('canvas');
  $canvas = jQuery(canvas);
  App.setDefaultCanvasSize();

  // Set up the main graphics context.
  context = canvas.getContext('2d');

  // Set up the world.
  // Lots of drawing depends on the world size, so set this before anything
  // else and try not to change it.
  world = new World();
  context.__layer = world;

  // Track the mouse.
  $canvas.hover(function() {
    var $this = jQuery(this);
    $this.on('mousemove.coords, touchmove.coords', function(e) {
      if (e.type == 'touchmove') {
        // Prevent window scrolling on iPhone and display freeze on Android
        e.preventDefault();
      }
      Mouse.coords = {
          x: e.pageX - $this.offset().left,
          y: e.pageY - $this.offset().top,
      };
    });
  }, function() {
    jQuery(this).off('.coords');
    Mouse.coords = {x: -9999, y: -9999};
  });

  // Track and delegate click events.
  $canvas.on('mousedown mouseup click touchstart touchend', function(e) {
    App.Events.trigger(e.type, e);
  });

  // Track and delegate dragend events.
  $canvas.on('mouseup.drag touchend.drag', function(e) {
    App.Events.trigger('canvasdragstop', e);
    App.isSomethingBeingDragged = false;
    /**
     * @event canvasdragstop
     *   Fired on the document when the player stops dragging an object,
     *   i.e. when the player releases the mouse or stops touching the canvas.
     * @member global
     */
    jQuery(document).trigger('canvasdragstop');
  });

  // Track and delegate drop events.
  jQuery(document).on('canvasdrop', function(e, target) {
    App.Events.trigger('canvasdrop', e, target);
  });

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
});

// Set up the app itself. This runs after main.js loads.
jQuery(window).load(function() {
  // Prevent default behavior of these keys because we'll be using them and
  // they can cause other page behavior (like scrolling).
  for (var dir in keys) {
    if (keys.hasOwnProperty(dir)) {
      App.preventDefaultKeyEvents(keys[dir].join(' '));
    }
  }

  // Pre-load images and start the animation.
  Caches.preloadImages(typeof preloadables === 'undefined' ? [] : preloadables, {
    finishCallback: function() {
      // Expose utilities globally if they are not already defined.
      if (typeof Events === 'undefined') {
        Events = App.Events;
      }
      if (typeof Utils === 'undefined') {
        Utils = App.Utils;
      }

      // Run the developer's setup code.
      var start = setup(false);

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
       * @member global
       */
      jQuery(document).trigger('start');
    },
  });
});

/**
 * Sets the default size of the canvas as early as possible.
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
 * the canvas display, using CSS to resize the canvas is not recommended.
 *
 * @member App
 * @static
 */
App.setDefaultCanvasSize = function() {
  // Do not resize if data-resize is false (fall back to CSS).
  if ($canvas.attr('data-resize') == 'false') {
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
Sprite.getImageFromCache = function(src) {
  return Caches.images[src];
};
Sprite.saveImageToCache = function(src, image) {
  Caches.images[src] = image;
};
Sprite.preloadImages = Caches.preloadImages;

// EVENTS ---------------------------------------------------------------------

App._handlePointerBehavior = function() {
  return App.isHovered(this);
};

/**
 * An event system for canvas objects.
 *
 * The browser has no way to distinguish between different objects being
 * displayed on the canvas; as far as it is concerned, the canvas is just a
 * single image. App.Events provides a way to listen for and trigger events on
 * non-DOM objects.
 *
 * @alternateClassName Events
 * @static
 */
App.Events = {
  _listeners: {},
  /**
   * Listen for a specific event.
   *
   * {@link Box} objects can listen for events by calling Box#listen() rather
   * than calling this method directly.
   *
   * @param {Object} obj
   *   The object which should listen for the event being called on it.
   * @param {String} eventName
   *   The name of the event for which to listen, e.g. "click." The event can
   *   have a namespace using a dot, e.g. "click.custom" will bind to the
   *   "click" event with the "custom" namespace. Namespaces are useful for
   *   unlisten()ing to specific callbacks assigned to that namespace or for
   *   unlisten()ing to callbacks bound to a namespace across multiple events.
   * @param {Function} callback
   *   A function to execute when the relevant event is triggered on the
   *   listening object. The function's `this` object is the listening object
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
   *
   * @static
   */
  listen: function(obj, eventName, callback, weight) {
    var once = arguments[4];
    // Allow specifying multiple space-separated event names.
    var events = eventName.split(' ');
    if (events.length > 1) {
      for (var j = 0, l = events.length; j < l; j++) {
        App.Events.listen(obj, events[j], callback, weight, once);
      }
      return;
    }
    // Separate the event name from the namespace.
    var namespace = '', i = eventName.indexOf('.');
    if (i !== -1) {
      namespace = eventName.substring(i+1);
      eventName = eventName.substring(0, i);
    }
    // Add a listener for the relevant event.
    if (!App.Events._listeners[eventName]) {
      App.Events._listeners[eventName] = [];
    }
    App.Events._listeners[eventName].push({
      object: obj,
      callback: function() {
        callback.apply(obj, arguments);
      },
      namespace: namespace,
      weight: weight || 0,
      once: once || false,
    });
    // Return the listening object so that this function is chainable.
    return obj;
  },
  /**
   * Listen for a specific event and only react the first time it is triggered.
   *
   * {@link Box} objects have a corresponding Box#once() method.
   *
   * @param {Object} obj
   *   The object which should listen for the event being called on it.
   * @param {String} eventName
   *   The name of the event for which to listen, e.g. "click." The event can
   *   have a namespace using a dot, e.g. "click.custom" will bind to the
   *   "click" event with the "custom" namespace. Namespaces are useful for
   *   unlisten()ing to specific callbacks assigned to that namespace or for
   *   unlisten()ing to callbacks bound to a namespace across multiple events.
   * @param {Function} callback
   *   A function to execute when the relevant event is triggered on the
   *   listening object. The function's `this` object is the listening object
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
   *
   * @static
   */
  once: function(obj, eventName, callback, weight) {
    return App.Events.listen(obj, eventName, callback, weight, true);
  },
  /**
   * Stop listening for a specific event.
   *
   * {@link Box} objects have a corresponding Box#unlisten() method.
   *
   * @param {Object} obj
   *   The object which should unlisten for the specified event.
   * @param {String} eventName
   *   The name of the event for which to listen, e.g. "click." The event can
   *   have a namespace using a dot, e.g. "click.custom" will unbind obj's
   *   listeners for the "click" that are using the "custom" namespace. You can
   *   also unlisten to multiple events using the same namespace, e.g.
   *   ".custom" could unlisten to "mousemove.custom" and "touchmove.custom."
   *   If the event specified does not have a namespace, all callbacks will be
   *   unbound regardless of their namespace.
   *
   * @static
   */
  unlisten: function(obj, eventName) {
    // Allow specifying multiple space-separated event names.
    var events = eventName.split(' ');
    if (events.length > 1) {
      for (var j = 0, l = events.length; j < l; j++) {
        App.Events.unlisten(obj, events[j]);
      }
      return;
    }
    // Separate the event name from the namespace.
    var namespace = '', i = eventName.indexOf('.'), e;
    if (i !== -1) {
      namespace = eventName.substring(i+1);
      eventName = eventName.substring(0, i);
    }
    // Remove all relevant listeners.
    if (eventName && App.Events._listeners[eventName]) {
      for (e = App.Events._listeners[eventName], i = e.length-1; i >= 0; i--) {
        if (e[i].object == obj && (!namespace || e[i].namespace == namespace)) {
          App.Events._listeners[eventName].splice(i, 1);
        }
      }
    }
    else if (!eventName && namespace) {
      for (eventName in App.Events._listeners) {
        if (App.Events._listeners.hasOwnProperty(eventName)) {
          for (e = App.Events._listeners[eventName], i = e.length-1; i >= 0; i--) {
            if (e[i].object == obj && e[i].namespace == namespace) {
              App.Events._listeners[eventName].splice(i, 1);
            }
          }
        }
      }
    }
    // Return the listening object so that this function is chainable.
    return obj;
  },
  /**
   * Trigger an event.
   *
   * {@link Box} objects have a corresponding Box#trigger() method.
   *
   * @param {String} eventName
   *   The name of the event to trigger, e.g. "click."
   * @param {Arguments} ...
   *   Additional arguments to pass to the relevant callbacks.
   *
   * @static
   */
  trigger: function(eventName) {
    eventName = Array.prototype.shift.call(arguments);
    var e = App.Events._listeners[eventName]; // All listeners for this event
    if (e) {
      // Sort listeners by weight (lowest last, then we'll iterate in reverse).
      e.sort(function(a, b) {
        return b.weight - a.weight;
      });
      // Execute the callback for each listener for the relevant event.
      for (var i = e.length-1; i >= 0; i--) {
        if (!App.Events.Behaviors[eventName] ||
            App.Events.Behaviors[eventName].apply(e[i].object, arguments)) {
          e[i].callback.apply(e[i].object, arguments);
          // Remove listeners that should only be called once.
          if (e[i].once) {
            App.Events.unlisten(e[i].object, eventName + '.' + e[i].namespace);
          }
          // Stop processing overlapping objects if propagation is stopped.
          var event = Array.prototype.shift.call(arguments);
          if (event && event.isPropagationStopped && event.isPropagationStopped()) {
            break;
          }
        }
      }
    }
  },
  /**
   * Determine whether an object should be triggered for a specific event.
   *
   * The Behaviors object has event names as keys and functions as values. The
   * functions evaluate whether the relevant event has been triggered on a
   * given listening object. The listening object is the functions' `this`
   * object, and the functions receive all the same parameters passed to the
   * App.Events.trigger() method (usually starting with an Event object). Add
   * elements to App.Events.Behaviors if you want to support new event types
   * with conditional filters.
   *
   * @static
   */
  Behaviors: {
    /**
     * @event mousedown
     *   The mousedown event is sent to an object when the mouse pointer is
     *   over the object and the mouse button is pressed.
     * @param {Event} e The event object.
     * @member Box
     */
    mousedown: App._handlePointerBehavior,
    /**
     * @event mouseup
     *   The mouseup event is sent to an object when the mouse pointer is over
     *   the object and the mouse button is released.
     * @param {Event} e The event object.
     * @member Box
     */
    mouseup: App._handlePointerBehavior,
    /**
     * @event click
     *   The mouseup event is sent to an object when the mouse pointer is over
     *   the object and the mouse button is pressed and released.
     * @param {Event} e The event object.
     * @member Box
     */
    click: App._handlePointerBehavior,
    /**
     * @event touchstart
     *   The touchstart event is sent to an object when the object is touched.
     * @param {Event} e The event object.
     * @member Box
     */
    touchstart: App._handlePointerBehavior,
    /**
     * @event touchend
     *   The touchend event is sent to an object when a touch is released over
     *   the object.
     * @param {Event} e The event object.
     * @member Box
     */
    touchend: App._handlePointerBehavior,
    /**
     * @event canvasdragstop
     *   The canvasdragstop event is sent to an object when a click or touch
     *   event ends and that object is being dragged. This should be used
     *   instead of binding to mouseup and touchend because dragged Actors
     *   still follow collision rules, so dragging an Actor into a solid wall
     *   will let the mouse move off the Actor while it is over the wall. (It
     *   is possible to drag an Actor through a wall, but Actors cannot be
     *   dropped inside of something solid they collide with.)
     * @param {Event} e The event object.
     * @member Actor
     */
    canvasdragstop: function() {
      return !!this.isBeingDragged;
    },
    /**
     * @event canvasdrop
     *   The canvasdrop event is sent to a drop target object when a draggable
     *   {@link Actor} is dropped onto it.
     * @param {Event} e The event object.
     * @param {Box} target The drop target object. (You can use `this` instead.)
     * @member Box
     */
    canvasdrop: function(e, target) {
      return this === target;
    },
  },
};

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

/**
 * Start animating the canvas.
 * 
 * See also {@link global#method-stopAnimating stopAnimating()}.
 *
 * @member global
 */
function startAnimating() {
  if (!App._animate) {
    App._animate = true;
    /**
     * @event startAnimating
     *   Fires on the document when the animation loop is about to begin.
     * @member global
     */
    jQuery(document).trigger('startAnimating');
    App.animate();
  }
}

/**
 * Stop animating the canvas.
 * 
 * See also {@link global#method-startAnimating startAnimating()}.
 *
 * @member global
 */
function stopAnimating() {
  App._animate = false;
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
}

/**
 * Animates the canvas. This is intended for private use and should not be
 * called directly. Instead see {@link #startAnimating} and
 * {@link #stopAnimating}.
 *
 * @member App
 * @ignore
 */
App.animate = function() {
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
  Mouse.Scroll._update();
  while (frameDelta > 0) {
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
    update(App.physicsDelta, App.physicsTimeElapsed);
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

  // request new frame
  if (App._animate) {
    window.requestAnimFrame(App.animate);
  }
};

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
  if (App._blurred) {
    App._blurred = false;
    startAnimating();
  }
});
jQuery(window).on('blur.animFocus', function() {
  stopAnimating();
  App._blurred = true;
});

// RENDERING ------------------------------------------------------------------

/**
 * @class CanvasRenderingContext2D
 *   The native JavaScript canvas graphics context class.
 *
 * This class has been extended with custom methods (and one overridden
 * method).
 *
 * The canvas graphics context for the main canvas is stored in the
 * {@link global#context context} global variable.
 */

/**
 * Clear the canvas.
 *
 * If the rendering context is the {@link global#context global context} for
 * the main canvas or if it belongs to a {@link Layer}, the visible area of the
 * relevant canvas will be cleared. Otherwise, the context doesn't know its
 * transformation matrix, so we have to temporarily reset it to clear the
 * canvas. This has the effect of clearing the visible area of the canvas, but
 * if the fillStyle is being used to draw something, it will not scroll with
 * the rest of the canvas.
 *
 * @param {Mixed} [fillStyle]
 *   If this parameter is passed, the visible area of the canvas will be filled
 *   in with the specified style. Otherwise, the canvas is simply wiped.
 *
 * @member CanvasRenderingContext2D
 */
CanvasRenderingContext2D.prototype.clear = function(fillStyle) {
  this.save();
  var x = 0, y = 0;
  if (this.__layer) {
    x = this.__layer.xOffset;
    y = this.__layer.yOffset;
  }
  else {
    this.setTransform(1, 0, 0, 1, 0, 0);
  }
  if (fillStyle) {
    this.fillStyle = fillStyle;
    this.fillRect(x, y, this.canvas.width, this.canvas.height);
  }
  else {
    this.clearRect(x, y, this.canvas.width, this.canvas.height);
  }
  this.restore();
};

// Store the original drawImage function so we can actually use it.
CanvasRenderingContext2D.prototype.__drawImage = CanvasRenderingContext2D.prototype.drawImage;
/**
 * Draws an image onto the canvas.
 *
 * This method is better than the original `drawImage()` for several reasons:
 *
 * - It uses a cache to allow images to be drawn immediately if they were
 *   pre-loaded and to store images that were not pre-loaded so that they can
 *   be drawn immediately later.
 * - It can draw {@link Sprite}, {@link SpriteMap}, and {@link Layer} objects
 *   as well as the usual images, videos, and canvases. (Note that when Layers
 *   are drawn using this method, their "relative" property IS taken into
 *   account.)
 * - It allows drawing an image by passing in the file path instead of an
 *   Image object.
 *
 * Additionally, this method has an optional `finished` parameter which is a
 * callback that runs when the image passed in the `src` parameter is finished
 * loading (or immediately if the image is already loaded or is a video). The
 * callback's context (its `this` object) is the canvas graphics object. Having
 * this callback is useful because if you do not pre-load images, the image
 * will not be loaded (and therefore will not be drawn) for at least the first
 * time that drawing it is attempted. You can use the `finished` callback to
 * draw the image after it has been loaded if you want.
 *
 * Apart from the additions above, this method works the same way as the
 * [original in the spec](http://www.w3.org/TR/2dcontext/#drawing-images-to-the-canvas).
 *
 * As a summary, this method can be invoked three ways:
 *
 * - `drawImage(src, x, y[, finished])`
 * - `drawImage(src, x, y, w, h[, finished])`
 * - `drawImage(src, sx, sy, sw, sh, x, y, w, h[, finished])`
 *
 * In each case, the `src` parameter accepts one of the following:
 *
 *   - The file path of an image to draw
 *   - A {@link Sprite} or {@link SpriteMap} object
 *   - A {@link Layer} object
 *   - An HTMLCanvasElement
 *   - An HTMLImageElement (same thing as an Image)
 *   - An HTMLVideoElement
 *
 * The `x` and `y` parameters indicate the coordinates of the canvas graphics
 * context at which to draw the top-left corner of the image. (Often this is
 * the number of pixels from the top-left corner of the canvas, though the
 * context can be larger than the canvas if the viewport has scrolled, e.g.
 * with context.translate().)
 *
 * The `w` and `h` parameters indicate the width and height of the image,
 * respectively. Defaults to the image width and height, respectively (or, for
 * a Sprite or SpriteMap, defaults to the projectedW and projectedH,
 * respectively).
 *
 * The `sx`, `sy`, `sw`, and `sh` parameters define a rectangle within the
 * image that will be drawn onto the canvas. `sx` and `sy` are the x- and y-
 * coordinates (within the image) of the upper-left corner of the source
 * rectangle, respectively, and `sw` and `sh` are the width and height of the
 * source rectangle, respectively. These parameters are ignored when drawing a
 * Sprite or SpriteMap. The W3C provides a helpful image to understand these
 * parameters:
 *
 * <img src="http://www.w3.org/TR/2dcontext/images/drawImage.png" alt="drawImage" />
 *
 * See also {@link CanvasRenderingContext2D#drawPattern}() and
 * Caches.preloadImages().
 *
 * @param {Mixed} src
 * @param {Number} [sx]
 * @param {Number} [sy]
 * @param {Number} [sw]
 * @param {Number} [sh]
 * @param {Number} x
 * @param {Number} y
 * @param {Number} [w]
 * @param {Number} [h]
 * @param {Function} [finished]
 * @param {Array} [finished.args]
 *   An array containing the arguments passed to the drawImage() invocation.
 * @param {Boolean} [finished.drawn]
 *   Whether the image was actually drawn (it will not be drawn if the image
 *   wasn't loaded before drawImage() attempted to draw it).
 *
 * @member CanvasRenderingContext2D
 */
CanvasRenderingContext2D.prototype.drawImage = function(src, sx, sy, sw, sh, x, y, w, h, finished) {
  // Allow the finished parameter to come last,
  // regardless of how many parameters there are.
  if (arguments.length % 2 === 0) {
    finished = Array.prototype.pop.call(arguments);
    // Don't let finished interfere with other arguments.
    if (sw instanceof Function) sw = undefined;
    else if (x instanceof Function) x = undefined;
    else if (w instanceof Function) w = undefined;
    if (typeof finished != 'function') {
      finished = undefined;
    }
  }
  var t = this, a = arguments;
  // Keep the stupid order of parameters specified by the W3C.
  // It doesn't matter that we're not providing the correct default values;
  // those will be implemented by the original __drawImage() later.
  if (typeof x != 'number' && typeof y === 'undefined' &&
      typeof w != 'number' && typeof h === 'undefined') {
    x = sx, y = sy;
    if (typeof sw == 'number' && typeof sh !== 'undefined') {
      w = sw, h = sh;
    }
    sx = undefined, sy = undefined, sw = undefined, sh = undefined;
  }
  // Wrapper function for doing the actual drawing
  var _drawImage = function(image, x, y, w, h, sx, sy, sw, sh) {
    if (w && h) {
      if (sw && sh) {
        t.__drawImage(image, sx, sy, sw, sh, x, y, w, h);
      }
      else {
        t.__drawImage(image, x, y, w, h);
      }
    }
    else {
      t.__drawImage(image, x, y);
    }
    if (finished instanceof Function) {
      finished.call(t, a, true);
    }
  };
  if (src instanceof Sprite || src instanceof SpriteMap) { // draw a sprite
    src.draw(this, x, y, w, h);
    if (finished instanceof Function) {
      finished.call(t, a, true); // Sprite images are loaded on instantiation
    }
  }
  else if (src instanceof Layer) { // Draw the Layer's canvas
    t.save();
    t.globalAlpha = src.opacity;
    if (src.relative == 'canvas') {
      t.translate(world.xOffset, world.yOffset);
    }
    var f = finished;
    finished = undefined; // Don't call finished() until after translating back
    _drawImage(src.canvas, x, y, w, h, sx, sy, sw, sh);
    t.restore();
    finished = f;
    if (finished instanceof Function) {
      finished.call(t, a, true);
    }
  }
  else if (src instanceof HTMLCanvasElement || // draw a canvas
      src instanceof HTMLVideoElement) { // draw a video
    _drawImage(src, x, y, w, h, sx, sy, sw, sh);
  }
  else if (src instanceof HTMLImageElement || // draw an image directly
      src instanceof Image) { // same thing
    var image = src;
    src = image._src || image.src; // check for preloaded src
    if (!src) { // can't draw an empty image
      if (finished instanceof Function) {
        finished.call(t, a, false);
      }
      return;
    }
    if (!Caches.images[src]) { // cache the image by source
      Caches.images[src] = image;
    }
    if (image.complete || (image.width && image.height)) { // draw loaded images
      _drawImage(image, x, y, w, h, sx, sy, sw, sh);
    }
    else { // if the image is not loaded, don't draw it
      if (image._src) { // We've already tried to draw this one
        // The finished callback will run from the first time it was attempted to be drawn
        return;
      }
      var o = image.onload;
      image.onload = function() {
        if (typeof o == 'function') { // don't overwrite any existing handler
          o();
        }
        if (finished instanceof Function) {
          finished.call(t, a, false);
        }
      };
    }
  }
  else if (typeof src == 'string' && Caches.images[src]) { // cached image path
    var image = Caches.images[src];
    if (image.complete || (image.width && image.height)) { // Cached image is loaded
      _drawImage(image, x, y, w, h, sx, sy, sw, sh);
    }
    // If cached image is not loaded, bail; the finished callback will run
    // from the first time it was attempted to be drawn
  }
  else if (typeof src == 'string') { // uncached image path
    var image = new Image();
    image.onload = function() {
      if (finished instanceof Function) {
        finished.call(t, a, false);
      }
    };
    image._src = src;
    image.src = src;
    Caches.images[src] = image; // prevent loading an unloaded image multiple times
  }
  else {
    throw new TypeMismatchError('Image type not recognized.');
  }
};

/**
 * Draws a pattern onto the canvas.
 *
 * This function is preferred over createPattern() with fillRect() for drawing
 * patterns for several reasons:
 *
 * - It uses a cache to allow images to be drawn immediately if they were
 *   pre-loaded and to store images that were not pre-loaded so that they can
 *   be drawn immediately later.
 * - It can draw {@link Layer} objects as well as the usual images, videos, and
 *   canvases. (Note that when Layers are drawn using this method, their
 *   "relative" property IS taken into account.)
 * - It allows drawing an image by passing in the file path instead of an
 *   Image object.
 *
 * Unlike our modified `drawImage()`, this method cannot draw {@link Sprite}s
 * or {@link SpriteMap}s. If you need to draw a Sprite or SpriteMap as a
 * pattern, draw the part you want onto a Layer or a new canvas and then pass
 * that as the src.
 *
 * See also {@link CanvasRenderingContext2D#drawImage}() and
 * Caches.preloadImages().
 *
 * @param {Mixed} src
 *   The image to draw as a pattern. Accepts one of the following types:
 *
 *   - The file path of an image to draw
 *   - A {@link Layer} object
 *   - An HTMLCanvasElement
 *   - An HTMLImageElement (same thing as an Image)
 *   - An HTMLVideoElement
 *   - A CanvasPattern
 * @param {Number} [x=0]
 *   The x-coordinate at which to draw the top-left corner of the pattern.
 * @param {Number} [y=0]
 *   The y-coordinate at which to draw the top-left corner of the pattern.
 * @param {Number} [w]
 *   The width of the pattern. Defaults to the canvas width.
 * @param {Number} [h]
 *   The height of the pattern. Defaults to the canvas height.
 * @param {"repeat"/"repeat-x"/"repeat-y"/"no-repeat"} [rpt="repeat"]
 *   The repeat pattern type. This parameter can be omitted even if a finished
 *   callback is passed, so the call `drawPattern(src, x, y, w, h, finished)`
 *   is legal.
 * @param {Function} [finished]
 *   A callback that runs when the image passed in the "src" parameter is
 *   finished loading (or immediately if the image is already loaded or is a
 *   video). The callback's context (its `this` object) is the canvas graphics
 *   object. Having this callback is useful because if you do not pre-load
 *   images, the image will not be loaded (and therefore will not be drawn) for
 *   at least the first time that drawing it is attempted. You can use the
 *   finished callback to draw the image after it has been loaded if you want.
 * @param {Array} [finished.args]
 *   An array containing the arguments passed to the drawPattern() invocation.
 * @param {Boolean} [finished.drawn]
 *   Whether the image was actually drawn (it will not be drawn if the image
 *   wasn't loaded before drawPattern() attempted to draw it).
 *
 * @return {CanvasPattern}
 *   The CanvasPattern object for the pattern that was drawn, if possible; or
 *   undefined if a pattern could not be drawn (usually because the image
 *   specified for drawing had not yet been loaded). If your source parameter
 *   is anything other than an image or a file path, the image and pattern
 *   drawn cannot be cached, so it can be helpful for performance to store this
 *   return value and pass it in as the src parameter in the future if you need
 *   to draw the same pattern repeatedly. (Another option is to cache the
 *   drawn pattern in a {@link Layer}.)
 *
 * @member CanvasRenderingContext2D
 */
CanvasRenderingContext2D.prototype.drawPattern = function(src, x, y, w, h, rpt, finished) {
  if (typeof x === 'undefined') x = 0;
  if (typeof y === 'undefined') y = 0;
  if (typeof w === 'undefined') w = this.canvas.width;
  if (typeof h === 'undefined') h = this.canvas.height;
  if (typeof rpt == 'function') {
    finished = rpt;
    rpt = 'repeat';
  }
  else if (!rpt) {
    rpt = 'repeat';
  }
  if (src instanceof Layer) { // Draw the Layer's canvas
    src = src.canvas;
  }
  if (src instanceof CanvasPattern) { // draw an already-created pattern
    this.fillStyle = src;
    this.fillRect(x, y, w, h);
    if (finished instanceof Function) {
      finished.call(this, arguments, true);
    }
  }
  else if (src instanceof Layer) { // Draw the Layer's canvas
    this.save();
    this.globalAlpha = src.opacity;
    if (src.relative == 'canvas') {
      this.translate(world.xOffset, world.yOffset);
    }
    this.fillStyle = this.createPattern(src.canvas, rpt);
    this.fillRect(x, y, w, h);
    this.restore();
    if (finished instanceof Function) {
      finished.call(this, arguments, true);
    }
  }
  else if (src instanceof HTMLCanvasElement || // draw a canvas
      src instanceof HTMLVideoElement) { // draw a video
    this.fillStyle = this.createPattern(src, rpt);
    this.fillRect(x, y, w, h);
    if (finished instanceof Function) {
      finished.call(this, arguments, true);
    }
  }
  else if (src instanceof HTMLImageElement || // draw an image directly
      src instanceof Image) { // same thing
    var image = src;
    src = image._src || image.src; // check for preloaded src
    if (!src) { // can't draw an empty image
      if (finished instanceof Function) {
        finished.call(this, arguments, false);
      }
      return;
    }
    if (Caches.imagePatterns[src]) { // We already have a pattern; just draw it
      this.fillStyle = Caches.imagePatterns[src];
      this.fillRect(x, y, w, h);
      if (finished instanceof Function) {
        finished.call(this, arguments, true);
      }
      return this.fillStyle;
    }
    if (!Caches.images[src]) { // cache the image by source
      Caches.images[src] = image;
    }
    if (image.complete || (image.width && image.height)) { // draw loaded images
      this.fillStyle = this.createPattern(image, rpt);
      this.fillRect(x, y, w, h);
      Caches.imagePatterns[src] = this.fillStyle;
      if (finished instanceof Function) {
        finished.call(this, arguments, true);
      }
    }
    else { // if the image is not loaded, don't draw it
      if (image._src) { // We've already tried to draw this one
        // The finished callback will run from the first time it was attempted to be drawn
        return;
      }
      var t = this, o = image.onload;
      image.onload = function() {
        if (typeof o == 'function') { // don't overwrite any existing handler
          o();
        }
        Caches.imagePatterns[src] = this.createPattern(image, rpt);
        if (finished instanceof Function) {
          finished.call(t, arguments, false);
        }
      };
    }
  }
  else if (typeof src == 'string') { // file path
    if (Caches.imagePatterns[src]) { // We already have a pattern; just draw it
      this.fillStyle = Caches.imagePatterns[src];
      this.fillRect(x, y, w, h);
      if (finished instanceof Function) {
        finished.call(this, arguments, true);
      }
    }
    else if (Caches.images[src]) { // Image is cached, but no pattern
      var image = Caches.images[src];
      if (image.complete || (image.width && image.height)) { // Cached image is loaded
        this.fillStyle = this.createPattern(image, rpt);
        this.fillRect(x, y, w, h);
        Caches.imagePatterns[src] = this.fillStyle;
        if (finished instanceof Function) {
          finished.call(this, arguments, true);
        }
      }
      // If cached image is not loaded, bail; the finished callback will run
      // from the first time it was attempted to be drawn
    }
    else { // Image not loaded yet
      var image = new Image(), t = this;
      image.onload = function() {
        Caches.imagePatterns[src] = this.createPattern(image, rpt);
        if (finished instanceof Function) {
          finished.call(t, arguments, false);
        }
      };
      image._src = src;
      image.src = src;
      Caches.images[src] = image;
    }
  }
  if (Caches.imagePatterns[src]) {
    return Caches.imagePatterns[src];
  }
};

/**
 * Draw a checkerboard pattern.
 *
 * This method can be invoked in two ways:
 *
 * - `drawCheckered(squareSize, x, y, w, h, color1, color2);`
 * - `drawCheckered(color1, color2, squareSize, x, y, w, h);`
 *
 * All parameters are optional either way.
 *
 * @param {Number} [squareSize=80]
 *   The width and height, in pixels, of each square in the checkerboard
 *   pattern.
 * @param {Number} [x=0]
 *   The x-coordinate of where the pattern's upper-left corner should be drawn
 *   on the canvas.
 * @param {Number} [y=0]
 *   The y-coordinate of where the pattern's upper-left corner should be drawn
 *   on the canvas.
 * @param {Number} [w=squareSize*2]
 *   The width of the pattern to draw onto the canvas.
 * @param {Number} [h=squareSize*2]
 *   The height of the pattern to draw onto the canvas.
 * @param {String} [color1="silver"]
 *   The color of one set of squares in the checkerboard.
 * @param {String} [color2="lightGray"]
 *   The color of the other set of squares in the checkerboard.
 *
 * @return {CanvasPattern}
 *   The CanvasPattern object for the pattern that was drawn. It can be helpful
 *   for performance to store this return value and use it to call
 *   {@link CanvasRenderingContext2D#drawPattern}() in the future if you need
 *   to draw this same pattern repeatedly. (Another option is to cache the
 *   drawn pattern in a {@link Layer}.)
 *
 * @member CanvasRenderingContext2D
 */
CanvasRenderingContext2D.prototype.drawCheckered = function(squareSize, x, y, w, h, color1, color2) {
  if (typeof squareSize === 'undefined') squareSize = 80;
  if (typeof squareSize == 'string' && typeof x == 'string') {
    var c1 = squareSize, c2 = x;
    squareSize = y, x = w, y = h, w = color1, h = color2;
    color1 = c1, color2 = c2;
  }
  var pattern = document.createElement('canvas'), pctx = pattern.getContext('2d');
  pattern.width = squareSize*2;
  pattern.height = squareSize*2;
  pctx.fillStyle = color1 || 'silver';
  pctx.fillRect(0, 0, squareSize, squareSize);
  pctx.fillRect(squareSize, squareSize, squareSize, squareSize);
  pctx.fillStyle = color2 || 'lightGray';
  pctx.fillRect(squareSize, 0, squareSize, squareSize);
  pctx.fillRect(0, squareSize, squareSize, squareSize);
  return this.drawPattern(pattern, x || 0, y || 0, w || this.canvas.width, h || this.canvas.height);
};

// DRAW SHAPES ----------------------------------------------------------------

/**
 * Draw a circle.
 *
 * @param {Number} x
 *   The x-coordinate of the center of the circle.
 * @param {Number} y
 *   The y-coordinate of the center of the circle.
 * @param {Number} r
 *   The radius of the circle.
 * @param {Mixed} [fillStyle]
 *   A canvas fillStyle used to fill the circle. If not specified, the circle
 *   uses the current fillStyle. If null, the circle is not filled.
 * @param {Mixed} [strokeStyle]
 *   A canvas strokeStyle used to draw the circle's border. If not specified,
 *   no border is drawn on the circle. If null, the border uses the current
 *   strokeStyle.
 *
 * @member CanvasRenderingContext2D
 */
CanvasRenderingContext2D.prototype.circle = function(x, y, r, fillStyle, strokeStyle) {
  // Circle
  this.beginPath();
  this.arc(x, y, r, 0, 2 * Math.PI, false);
  if (fillStyle !== null) {
    if (fillStyle) {
      this.fillStyle = fillStyle;
    }
    this.fill();
  }
  if (strokeStyle !== undefined) {
    this.lineWidth = Math.max(Math.ceil(r/15), 1);
    if (strokeStyle) {
      this.strokeStyle = strokeStyle;
    }
    this.stroke();
  }
};

/**
 * Draw a smiley face.
 *
 * The {@link Actor} class uses this as a placeholder image.
 *
 * @param {Number} x
 *   The x-coordinate of the center of the smiley face.
 * @param {Number} y
 *   The y-coordinate of the center of the smiley face.
 * @param {Number} r
 *   The radius of the smiley face.
 * @param {Mixed} [fillStyle]
 *   The color of the smiley face.
 *
 * @member CanvasRenderingContext2D
 */
CanvasRenderingContext2D.prototype.drawSmiley = function(x, y, r, fillStyle) {
  var thickness = Math.max(Math.ceil(r/15), 1);
  
  // Circle
  this.circle(x, y, r, fillStyle || 'lightBlue', 'black');
  
  // Smile
  this.beginPath();
  this.arc(x, y, r*0.6, Math.PI*0.1, Math.PI*0.9, false);
  this.lineWidth = thickness;
  this.strokeStyle = 'black';
  this.stroke();
    
  // Eyes
  this.beginPath();
  this.arc(x - r*0.3, y - r*0.25, Math.max(Math.ceil(r/15), 1), 0, 2 * Math.PI, false);
  this.fillStyle = 'black';
  this.fill();
  this.arc(x + r*0.3, y - r*0.25, Math.max(Math.ceil(r/15), 1), 0, 2 * Math.PI, false);
  this.fillStyle = 'black';
  this.fill();
};

/**
 * Draws a blue-and-yellow radial gradient across the entire background of the
 * world. This is mainly useful to demonstrate that scrolling works if the
 * world is bigger than the canvas.
 *
 * @member CanvasRenderingContext2D
 */
CanvasRenderingContext2D.prototype.drawBkgdRadialGradient = function() {
  // Draw a radial gradient on the background.
  var radgrad = context.createRadialGradient(
      world.width/2, world.height/2, 50,
      world.width/2, world.height/2, world.width/2
  );
  radgrad.addColorStop(0, '#A7D30C');
  radgrad.addColorStop(0.6, '#067A9E');
  radgrad.addColorStop(1, 'rgba(1,159,98,0)');
  this.clear(radgrad);
};

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
  jQuery(document).keydown(combinations, function() { return false; });
};

/**
 * Determines whether the mouse is hovering over an object.
 *
 * The object in question must have these properties: `x`, `y`, `width`,
 * `height`. (All {@link Box}es have these properties.)
 *
 * @param {Box} obj
 *   The object to check.
 *
 * @return {Boolean}
 *   Whether the mouse is hovering over the object.
 *
 * @member App
 * @static
 */
App.isHovered = function(obj) {
  var offsets = world.getOffsets(),
      xPos = obj.x - offsets.x,
      yPos = obj.y - offsets.y;
  return Mouse.coords.x > xPos && Mouse.coords.x < xPos + obj.width &&
      Mouse.coords.y > yPos && Mouse.coords.y < yPos + obj.height;
};

/**
 * @class Mouse.Scroll
 *   Encapsulates mouse position scrolling.
 *
 * @static
 */
Mouse.Scroll = (function() {
  var THRESHOLD = 0.2, MOVEAMOUNT = 350;
  var translating = false, scrolled = {x: 0, y: 0}, enabled = false;
  function translate(doOffset) {
    var t = false, ma;
    if (doOffset === undefined) doOffset = true;

    // Left
    if (Mouse.coords.x < canvas.width * THRESHOLD) {
      if (doOffset) {
        ma = Math.round(Math.min(world.xOffset, MOVEAMOUNT * App.physicsDelta));
        world.xOffset -= ma;
        scrolled.x -= ma;
        context.translate(ma, 0);
      }
      t = true;
    }
    // Right
    else if (Mouse.coords.x > canvas.width * (1-THRESHOLD)) {
      if (doOffset) {
        ma = Math.round(Math.min(world.width - canvas.width - world.xOffset, MOVEAMOUNT * App.physicsDelta));
        world.xOffset += ma;
        scrolled.x += ma;
        context.translate(-ma, 0);
      }
      t = true;
    }

    // Up
    if (Mouse.coords.y < canvas.height * THRESHOLD) {
      if (doOffset) {
        ma = Math.round(Math.min(world.yOffset, MOVEAMOUNT * App.physicsDelta));
        world.yOffset -= ma;
        scrolled.y -= ma;
        context.translate(0, ma);
      }
      t = true;
    }
    // Down
    else if (Mouse.coords.y > canvas.height * (1-THRESHOLD)) {
      if (doOffset) {
        ma = Math.round(Math.min(world.height - canvas.height - world.yOffset, MOVEAMOUNT * App.physicsDelta));
        world.yOffset += ma;
        scrolled.y += ma;
        context.translate(0, -ma);
      }
      t = true;
    }

    // We're not translating if we're not moving.
    if (doOffset && scrolled.x === 0 && scrolled.y === 0) {
      t = false;
    }

    if (doOffset && translating != t) {
      if (translating) { // We were scrolling. Now we're not.
        /**
         * @event mousescrollon
         *   Fires on the document when the viewport starts scrolling. Binding
         *   to this event may be useful if you want to pause animation or
         *   display something while the viewport is moving.
         */
        jQuery(document).trigger('mousescrollon');
      }
      else { // We weren't scrolling. Now we are.
        /**
         * @event mousescrolloff
         *   Fires on the document when the viewport stops scrolling. Binding
         *   to this event may be useful if you want to pause animation or
         *   display something while the viewport is moving.
         */
        jQuery(document).trigger('mousescrolloff');
      }
    }
    translating = t;
    return scrolled;
  }
  return {
    /**
     * Enable mouse position scrolling.
     * @static
     */
    enable: function() {
      if (enabled) {
        return;
      }
      enabled = true;
      $canvas.on('mouseenter.translate touchstart.translate', function() {
        jQuery(this).on('mousemove.translate', function() {
          translate(false);
        });
      });
      $canvas.on('mouseleave.translate touchleave.translate', function() {
        translating = false;
        jQuery(this).off('.translate');
      });
    },
    /**
     * Disable mouse position scrolling.
     * @static
     */
    disable: function() {
      $canvas.off('.translate');
      translating = false;
      enabled = false;
    },
    /**
     * Test whether mouse position scrolling is enabled.
     * @static
     */
    isEnabled: function() {
      return enabled;
    },
    /**
     * Test whether the viewport is currently mouse-scrolling.
     * @static
     */
    isScrolling: function() {
      return translating;
    },
    _update: function() {
      if (translating) {
        return translate();
      }
    },
    /**
     * Sets how close to the edge of the canvas the mouse triggers scrolling.
     *
     * The threshold is a fractional percentage [0.0-0.5) of the width of the
     * canvas. If the mouse is within this percent of the edge of the canvas,
     * the viewport attempts to scroll. The default threshold is 0.2 (20%).
     *
     * See also Mouse.Scroll.getThreshold().
     *
     * @static
     */
    setThreshold: function(t) {
      THRESHOLD = t;
    },
    /**
     * Gets how close to the edge of the canvas the mouse triggers scrolling.
     *
     * See also Mouse.Scroll.getThreshold().
     *
     * @return {Number}
     *   The mouse-scrolling threshold. The threshold is a fractional
     *   percentage [0.0-0.5) of the width of the canvas. If the mouse is
     *   within this percent of the edge of the canvas, the viewport attempts
     *   to scroll. The default threshold is 0.2 (20%).
     *
     * @static
     */
    getThreshold: function() {
      return THRESHOLD;
    },
    /**
     * Sets how fast the mouse will cause the viewport to scroll.
     *
     * @param {Number} a
     *   The maximum distance in pixels that the viewport will move each second
     *   while scrolling (the movement can be less when the viewport is very
     *   close to an edge of the world). Defaults to 350.
     *
     * @static
     */
    setScrollDistance: function(a) {
      MOVEAMOUNT = a;
    },
    /**
     * Gets how fast the mouse will cause the viewport to scroll.
     *
     * @return {Number}
     *   The maximum distance in pixels that the viewport will move each second
     *   while scrolling (the movement can be less when the viewport is very
     *   close to an edge of the world). Defaults to 350.
     *
     * @static
     */
    getScrollDistance: function() {
      return MOVEAMOUNT;
    },
  };
})();

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
 * Adapted from the [three.js clock](https://github.com/mrdoob/three.js/blob/master/src/core/Clock.js).
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
    this.lastStartTime = this.lastDeltaTime = this.whileAnimating
      ? App.physicsTimeElapsed
      : performance.now();
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
   * Registers the time at which an event occurred.
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
   * Returns the time since an event occurred.
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

// UTILITIES ------------------------------------------------------------------

/**
 * @class App.Utils
 *   A miscellaneous collection of utilities.
 * @alternateClassName Utils
 * @static
 */
App.Utils = {};

/**
 * Convert a percent to the corresponding pixel position in the world.
 *
 * This is useful for specifying the size of objects relative to the size of
 * the canvas or world.
 *
 * @param {Number} percent
 *   A percent (out of 100%) across the canvas or world from the upper-left
 *   corner.
 * @param {Boolean} [relativeToCanvas=true]
 *   Whether the result is relative to the canvas (true) or to the world
 *   (false).
 *
 * @return {Object}
 *   An object with `x` and `y` properties denoting a pixel position at the
 *   given percent. For example, in a 100x100px canvas, calling
 *   `App.Utils.percentToPixels(25)` would return `{x: 25, y: 25}`.
 *
 * @static
 */
App.Utils.percentToPixels = function(percent, relativeToCanvas) {
  if (typeof relativeToCanvas === 'undefined') {
    relativeToCanvas = true;
  }
  return {
    x: Math.floor((relativeToCanvas ? canvas : world).width  * percent / 100),
    y: Math.floor((relativeToCanvas ? canvas : world).height * percent / 100),
  };
};

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
 * equally likely to be returned. Negative numbers work as well.
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
 * To place the DOM element at a specific location in the world, first subtract
 * the {@link World#getOffsets world offsets} from the `x` and `y` positions.
 * For example, to place an item at the player's x-position, you would use
 * `player.x-world.getOffsets().x` to get the canvas position.
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
 * @static
 */
App.Utils.positionOverCanvas = function(elem, x, y) {
  var o = $canvas.offset();
  jQuery(elem).css({
    left: (o.left + parseInt($canvas.css('border-left-width'), 10) + x) + 'px',
    position: 'absolute',
    top: (o.top + parseInt($canvas.css('border-top-width'), 10) + y) + 'px',
    'z-index': 100,
  });
};

/**
 * Ends the game, displays "GAME OVER," and allows clicking to restart.
 *
 * To disable clicking to restart, run `$canvas.off('.gameover');`
 *
 * @member App
 * @static
 */
App.gameOver = function() {
  stopAnimating();
  player.destroy();
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
    context.strokeText("GAME OVER", x, y);
    context.fillText("GAME OVER", x, y);
    context.restore();
  }, 100);
  $canvas.css('cursor', 'pointer');
  $canvas.one('click.gameover', function(e) {
    e.preventDefault();
    $canvas.css('cursor', 'auto');
    var start = setup(true);
    if (start !== false) {
      startAnimating();
    }
    jQuery(document).trigger('start');
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
  var m = Math.pow(10,a|0);
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

(function(console) {
  /**
   * Get a string with the function, filename, and line number of the call.
   *
   * This provides a unique ID to identify where each call originated.
   *
   * This function was written by Steven Wittens (unconed). MIT Licensed.
   * More at [console-extras.js](https://github.com/unconed/console-extras.js).
   *
   * @ignore
   */
  function getCallID() {
    var stack = new Error().stack;
    if (stack) {
      var lines = stack.split(/\n/g), skip = 2;
      var found = false, offset = 0;
      for (var i in lines) {
        if (offset == skip) {
          return lines[i];
        }
        if (!found && lines[i].match(/getCallID/)) {
          found = true;
        }
        if (found) {
          offset++;
        }
      }
    }
    return 'exception';
  }
  /**
   * Periodically log a message to the JavaScript console.
   *
   * This is useful for logging things in loops; it avoids being overwhelmed by
   * an unstoppable barrage of similar log messages. Example calls:
   *
   *     # Log "message" to the console no more than every 500ms.
   *     console.throttle('message', 500);
   *     # Log "message 1" and "message 2" as errors no more than every 500ms.
   *     console.throttle('message 1', 'message 2', 500, console.error);
   *
   * @param {Arguments} ...
   *   An arbitrary number of arguments to pass to the loggging function.
   * @param {Number} freq
   *   The minimum amount of time in milliseconds that must pass between the
   *   same call before logging the next one. To only log something once, pass
   *   `Infinity` to this parameter.
   * @param {Function} [func=console.log]
   *   The logging function to use.
   *
   * @return
   *   The console object (this method is chainable).
   *
   * @member console
   * @chainable
   * @ignore
   */
  console.throttle = function() {
    if (arguments.length < 2) {
      return console;
    }
    var freq = 0, id = getCallID(), func = Array.prototype.pop.call(arguments);
    if (typeof func == 'number') {
      freq = func;
      func = console.log || function() {};
    }
    else if (typeof func == 'function') {
      freq = Array.prototype.pop.call(arguments);
    }
    if (typeof this.lastLogged === 'undefined') {
      this.lastLogged = {};
    }
    if (typeof this.lastLogged[id] === 'undefined') {
      this.lastLogged[id] = 0;
    }
    var now = performance.now();
    if (now > this.lastLogged[id] + freq) {
      this.lastLogged[id] = now;
      func.apply(func, arguments);
    }
    return console;
  };
})(console);
