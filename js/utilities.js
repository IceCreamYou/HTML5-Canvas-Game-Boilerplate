/**
 * @file
 *   Provides helpful utilities for common Canvas operations.
 */

// The App object holds utilities that are usually unnecessary to use directly.
var App = {};
App.Utils = {};
App.debugMode = false;
App.Debug = {};
App.Debug.updateTimeElapsed = 0;
App.Debug.clearTimeElapsed = 0;
App.Debug.drawTimeElapsed = 0;

// SETUP ----------------------------------------------------------------------

/**
 * Global environment.
 */
var canvas, $canvas, context, world;

/**
 * Current position of the mouse coordinates relative to the canvas.
 */
var mouseCoords = {x: 9999, y: 9999};

// Indicates whether the canvas is animating or focused.
App._animate = false, App._blurred = false;

// Set up important activities.
$(document).ready(function() {
	// Set up the canvas.
	canvas = document.getElementById('canvas');
	$canvas = $(canvas);
	setDefaultCanvasSize();

  // Set up the main graphics context.
  context = canvas.getContext('2d');

  // Set up the world.
  // Lots of drawing depends on the world size, so set this before anything else
  // and try not to change it.
  world = new World();

	// Track the mouse.
	$canvas.hover(function() {
		$(this).mousemove(function(e) {
			mouseCoords = {
					x: e.pageX - $(this).offset().left,
					y: e.pageY - $(this).offset().top,
			};
		});
	}, function() {
		$(this).off('mousemove');
		mouseCoords = {x: -9999, y: -9999};
	});

	// Track and delegate click events.
	$canvas.on('mousedown mouseup click', function(e) {
	  App.Events.trigger(e.type, e);
	});

	// Keep track of time, but don't start the timer until we start animating.
	App.timer = new Timer(false);
	App.timer.frames = 0; // The number of frames that have been painted.
});

/**
 * Sets the default size of the canvas as early as possible.
 *
 * This function is magic-named and can be overridden for alternate behavior.
 */
function setDefaultCanvasSize() {
  // Do not resize if data-resize is false (fall back to CSS).
  if ($canvas.attr('data-resize') == 'false') {
    return;
  }
  // If requested, make the canvas the size of the browser window.
  if ($canvas.attr('data-resize') == 'full') {
    canvas.width = $(window).width();
    canvas.height = $(window).height() -
        ($('header').outerHeight() || 0) -
        ($('footer').outerHeight() || 0);
    return;
  }
  // Use the following properties to determine canvas size automatically:
  // width, height, data-minwidth, data-maxwidth, data-minheight, data-maxheight
  // If the width and height are not explicitly specified, the canvas is
  // resized to the largest size that fits within the max and the window, with
  // a minimum of min.
	var maxWidth = $canvas.attr('data-maxwidth') || canvas.width;
	var minWidth = $canvas.attr('data-minwidth') || canvas.width;
	canvas.width = Math.min(maxWidth, Math.max($(window).width(), minWidth));
	var maxHeight = $canvas.attr('data-maxheight') || canvas.height;
	var minHeight = $canvas.attr('data-minheight') || canvas.height;
	canvas.height = Math.min(maxHeight, Math.max($(window).height(), minHeight));
}

// CACHES ---------------------------------------------------------------------

// The Caches object is a public API; it can be altered manually.
// Removing stale items in particular is encouraged.
var Caches = {};

// A map of image file paths to image objects.
Caches.images = {};

// A map of image file paths to image pattern objects.
Caches.imagePatterns = {};

/**
 * Get an image from the cache.
 *
 * This overrides the caching provided by the Sprite library to unify it with
 * this library.
 *
 * @param src
 *   The file path of the image.
 *
 * @return
 *   The Image object associated with the file or undefined if the image
 *   object has not yet been cached.
 */
function getImageFromCache(src) {
  return Caches.images[src];
}

/**
 * Save an image to the cache.
 *
 * This overrides the caching provided by the Sprite library to unify it with
 * this library.
 * 
 * @param src
 *   The file path of the image.
 * @param image
 *   The Image object to cache.
 */
function saveImageToCache(src, image) {
  Caches.images[src] = image;
}

// EVENTS ---------------------------------------------------------------------

/**
 * An event system for canvas objects.
 */
App.Events = {
  _listeners: {},
  /**
   * Listen for a specific event.
   *
   * @see Box.listen()
   */
  listen: function(obj, eventName, callback, weight, once) {
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
   * @see Box.once()
   */
  once: function(obj, eventName, callback, weight) {
    return App.Events.listen(obj, eventName, callback, weight, true);
  },
  /**
   * Stop listening for a specific event.
   *
   * @see Box.unlisten()
   */
  unlisten: function(obj, eventName) {
    // Separate the event name from the namespace.
    var namespace = '', i = eventName.indexOf('.');
    if (i !== -1) {
      namespace = eventName.substring(i+1);
      eventName = eventName.substring(0, i);
    }
    // Remove all relevant listeners.
    if (App.Events._listeners[eventName]) {
      for (var e = App.Events._listeners[eventName], i = e.length-1; i >= 0; i--) {
        if (e[i].object == obj && (!namespace || e[i].namespace == namespace)) {
          App.Events._listeners[eventName].splice(i, 1);
        }
      }
    }
    // Return the listening object so that this function is chainable.
    return obj;
  },
  /**
   * Trigger an event.
   *
   * @param eventName
   *   The name of the event to trigger, e.g. "click."
   * @param event
   *   An event object.
   * @param args
   *   An array of additional arguments to pass to the relevant callbacks.
   */
  trigger: function(eventName, event, args) {
    var e = App.Events._listeners[eventName]; // All listeners for this event
    if (e) {
      // Sort listeners by weight (lowest first).
      e.sort(function(a, b) {
        return a.weight - b.weight;
      });
      // Execute the callback for each listener for the relevant event.
      for (var i = e.length-1; i >= 0; i--) {
        if (!App.Events.Behaviors[eventName] ||
            App.Events.Behaviors[eventName](e[i].object, event, args)) {
          e[i].callback(e[i].object, event, args);
          // Remove listeners that should only be called once.
          if (e[i].once) {
            App.Events.unlisten(e[i].object, eventName + '.' + e[i].namespace);
          }
          // Stop processing overlapping objects if propagation is stopped.
          if (event.isPropagationStopped()) {
            break;
          }
        }
      }
    }
  },
  /**
   * Determine whether an object should be triggered for a specific event.
   */
  Behaviors: {
    mousedown: function(obj, event, args) {
      return App.isHovered(obj);
    },
    mouseup: function(obj, event, args) {
      return App.isHovered(obj);
    },
    click: function(obj, event, args) {
      return App.isHovered(obj);
    },
  },
};

// ANIMATION ------------------------------------------------------------------

// requestAnimFrame shim for smooth animation
window.requestAnimFrame = (function(callback){
    return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function(callback){
        window.setTimeout(callback, 1000 / 60);
    };
})();

/**
 * Start animating the canvas.
 * 
 * @see stopAnimating()
 */
function startAnimating() {
	if (!App._animate) {
		App._animate = true;
		App.timer.start();
		App.animate();
	}
}

/**
 * Stop animating the canvas.
 * 
 * @see startAnimating()
 */
function stopAnimating() {
	App._animate = false;
	App.timer.stop();

	// Output performance statistics.
	if (App.debugMode && console && console.log) {
    var elapsed = App.timer.getElapsedTime(), frames = App.timer.frames, d = App.Debug;
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
 * called directly. Instead see startAnimating() and stopAnimating().
 * 
 * @see startAnimating()
 * @see stopAnimating()
 */
App.animate = function() {
  // Record the amount of time since the last tick. Used to smooth animation.
  // This is the only place that App.timer.getDelta() should ever be called
  // because getDelta() returns the time since the last time it was called so
  // calling it elsewhere will skew the result here.
  App.timer.lastDelta = App.timer.getDelta();
  App.timer.frames++; // Count paints so we can calculate FPS

  var t = new Timer();

	// update
	update($.hotkeys.lastKeysPressed);

	if (App.debugMode) {
	  App.Debug.updateTimeElapsed += t.getDelta();
	}

	// clear
	context.clear();

  if (App.debugMode) {
    App.Debug.clearTimeElapsed += t.getDelta();
  }

	// draw
	draw();

  if (App.debugMode) {
    App.Debug.drawTimeElapsed += t.getDelta();
  }

	// request new frame
	if (App._animate) {
		window.requestAnimFrame(App.animate);
	}
};

/**
 * Stops animating when the window (tab) goes out of focus.
 *
 * This is great because it stops running the CPU when we don't need it,
 * although it can lead to some weird behavior if you expect something to be
 * running in the background or if you have the browser still visible when you
 * switch to another program. If you don't want this behavior, you can toggle
 * it off like this:
 *
 * $(window).off('.animFocus');
 *
 * For much more comprehensive support for detecting and acting on page
 * visibility, use https://github.com/ai/visibility.js
 */
$(window).on('focus.animFocus', function() {
	if (App._blurred) {
		App._blurred = false;
		startAnimating();
	}
});
$(window).on('blur.animFocus', function() {
	stopAnimating();
	App._blurred = true;
});

// OBJECTS --------------------------------------------------------------------

/**
 * A Box shape.
 * 
 * @param x
 *   The x-coordinate of the top-left corner of the box.
 * @param y
 *   The y-coordinate of the top-left corner of the box.
 * @param w
 *   The width of the box.
 * @param h
 *   The height of the box.
 * @param fillStyle
 *   (Optional) A default fillStyle to use when drawing the box. Defaults to
 *   black.
 */
var Box = Class.extend({
	init: function(x, y, w, h, fillStyle) {
		this.x = x || 0;
		this.y = y || 0;
		this.width = w || 80;
		this.height = h || 80;
		this.fillStyle = fillStyle || 'black';
		
		this.draw();
	},
	/**
	 * Something that can be drawn by context.drawLoadedImage() (usually an image file path).
	 *
	 * If not set, a box will be drawn instead.
	 */
	src: null,
	/**
	 * Draw the Box.
	 *
	 * @param ctx
	 *   (Optional) A canvas graphics context onto which this Box should be drawn.
	 *   This is useful for drawing onto Layers. If not specified, defaults to
	 *   the global context for the default canvas.
	 */
	draw: function(ctx) {
		ctx = ctx || context;
		ctx.fillStyle = this.fillStyle;
		if (this.src) {
			ctx.drawLoadedImage(this.src, this.x, this.y, this.width, this.height);
		}
		else {
			ctx.fillRect(this.x, this.y, this.width, this.height);
		}
	},
	/**
	 * Draw the outline of the box used to calculate collision.
	 *
	 * @param ctx
   *   (Optional) A canvas graphics context onto which the outline should be
   *   drawn. This is useful for drawing onto Layers. If not specified,
   *   defaults to the global context for the default canvas.
	 * @param fillStyle
	 *   (Optional) A fillStyle to use for the box outline.
	 */
	drawBoundingBox: function(ctx, fillStyle) {
		ctx = ctx || context;
		ctx.fillStyle = fillStyle || this.fillStyle;
		ctx.strokeRect(this.x, this.y, this.width, this.height);
	},
	/**
	 * Get the x-coordinate of the center of the Box.
	 */
	xC: function() {
		return this.x + this.width/2;
	},
	/**
	 * Get the y-coordinate of the center of the Box.
	 */
	yC: function() {
		return this.y + this.height/2;
	},
	/**
	 * Determines whether this Box intersects another Box.
	 */
	overlaps: function(otherBox) {
		return this._overlapsX(otherBox) && this._overlapsY(otherBox);
	},
	_overlapsX: function(otherBox) {
		return this.x + this.width >= otherBox.x && otherBox.x + otherBox.width >= this.x;
	},
	_overlapsY: function(otherBox) {
		return this.y + this.height >= otherBox.y && otherBox.y + otherBox.height >= this.y;
	},
	/**
	 * Determine whether the mouse is hovering over this Box.
	 */
	isHovered: function() {
		return App.isHovered(this);
	},
  /**
   * Listen for a specific event.
   *
   * @param eventName
   *   The name of the event for which to listen, e.g. "click." The event can
   *   have a namespace using a dot, e.g. "click.custom" will bind to the
   *   "click" event with the "custom" namespace. Namespaces are useful for
   *   specifying a certain callback to un-listen. Each object should only have
   *   one function bound to each event-namespace pair, including the global
   *   namespace. That is, you can bind one callback to "click.custom1" and
   *   another callback to "click.custom2," but avoid binding two callbacks to
   *   "click" or "click.custom."
   * @param callback
   *   A function to execute when the relevant event is triggered on the
   *   specified object.
   * @param weight
   *   (Optional) An integer indicating the order in which callbacks for the
   *   relevant event should be triggered. Lower numbers cause the callback to
   *   get triggered earlier than higher numbers. Generally this is irrelevant.
   *   Defaults to zero.
   *
   * @return
   *   The Box object (this method is chainable).
   */
	listen: function(eventName, callback, weight) {
	  return App.Events.listen(this, eventName, callback, weight);
	},
  /**
   * Listen for a specific event and only react the first time it is triggered.
   *
   * This method is exactly the same as Box.listen() except that the specified
   * callback is only executed the first time it is triggered.
   */
	once: function(eventName, callback, weight) {
	  return App.Events.once(this, eventName, callback, weight);
	},
  /**
   * Stop listening for a specific event.
   *
   * @param eventName
   *   The name of the event to which to stop listening. Can be namespaced with
   *   a dot, e.g. "click.custom" removes a listener for the "click" event
   *   that has the "custom" namespace. If the event specified does not have a
   *   namespace, all callbacks will be unbound regardless of their namespace.
   *
   * @return
   *   The Box object (this method is chainable).
   */
	unlisten: function(eventName) {
	  return App.Events.unlisten(this, eventName);
	},
});

/**
 * A container to keep track of multiple Boxes/Box descendants.
 * 
 * @param items
 *   (Optional) An Array of Boxes that the Collection should hold.
 */
var Collection = Class.extend({
	init: function(items) {
		this.items = items || [];
	},
  /**
   * Draw every object in the Collection.
   *
   * @param ctx
   *   (Optional) A canvas graphics context onto which to draw. This is useful
   *   for drawing onto Layers. If not specified, defaults to the global
   *   context for the default canvas.
   */
	draw: function(ctx) {
		ctx = ctx || context;
		for (var i = 0; i < this.items.length; i++) {
			this.items[i].draw(ctx);
		}
	},
	/**
	 * Determine whether any object in this collection intersects with the specified Box.
	 *
	 * @param box
	 *   The Box with which to detect intersection.
	 *
	 * @return
	 *   true if intersection is detected; false otherwise.
	 */
	overlaps: function(box) {
		for (var i = 0; i < this.items.length; i++) {
			if (this.items[i].overlaps(box)) {
				return true;
			}
		}
		return false;
	},
	/**
	 * Execute an arbitrary method of all items in the Collection.
	 *
	 * All items in the Collection are assumed to have the specified method.
	 *
	 * @param name
	 *   The name of the method to invoke on each object in the Collection.
	 * @param ...
	 *   Additional arguments are passed on to the specified method.
	 */
	execute: function(name) {
		var args = [], i;
		for (i = 1; i < arguments.length; i++) {
			args.push(arguments[i]);
		}
		for (i = 0; i < this.items.length; i++) {
			this.items[i][name].apply(this.items[i], args);
		}
	},
	/**
	 * Add an item to the Collection.
	 *
	 * @param item
	 *   The Box to add to the Collection.
	 *
	 * @return
	 *   The number of items in the Collection.
	 */
	add: function(item) {
		return this.items.push(item);
	},
	/**
	 * Add the items in an Array to the Collection.
	 *
	 * @param items
	 *   An Array of Boxes to add to the Collection.
	 *
	 * @return
	 *   The Collection object (this method is chainable).
	 */
	concat: function(items) {
		this.items = this.items.concat(items);
		return this;
	},
	/**
	 * Add the items in another Collection to this Collection.
	 *
	 * @param otherCollection
	 *   A Collection whose items should be added to this Collection.
   *
   * @return
   *   The Collection object (this method is chainable).
	 */
	combine: function(otherCollection) {
		this.items = this.items.concat(otherCollection.items);
		return this;
	},
	/**
	 * Remove an item from the Collection.
	 *
	 * @param item
	 *   The Box to remove from the Collection.
	 *
	 * @return
	 *   An array containing the removed element, if any.
	 */
	remove: function(item) {
		return this.items.remove(item);
	},
	/**
	 * Remove and return the last item in the Collection.
	 */
	removeLast: function() {
		return this.items.pop();
	},
	/**
	 * Return the number of items in the Collection.
	 */
	count: function() {
		return this.items.length;
	},
	/**
	 * Remove all items in the Collection.
   *
   * @return
   *   The Collection object (this method is chainable).
	 */
	removeAll: function() {
		this.items = [];
		return this;
	},
});

/**
 * The World object.
 * 
 * The World represents the complete playable game area. Its size can be set
 * explicitly or is automatically determined by the "data-worldwidth" and
 * "data-worldheight" attributes set on the HTML canvas element (with a
 * fallback to the canvas width and height). If the size of the world is larger
 * than the canvas then the view of the world will scroll when the player
 * approaches a side of the canvas (this behavior occurs in Player.move()).
 * 
 * @param w
 *   (optional) The width of the world. Defaults to the value of the
 *   "data-worldwidth" attribute on the HTML canvas element, or (if that
 *   attribute is not present) the width of the canvas element.
 * @param h
 *   (optional) The height of the world. Defaults to the value of the
 *   "data-worldheight" attribute on the HTML canvas element, or (if that
 *   attribute is not present) the height of the canvas element.
 */
function World(w, h) {
	// The dimensions of the world.
	this.width = w || parseInt($canvas.attr('data-worldwidth'), 10) || canvas.width;
	this.height = h || parseInt($canvas.attr('data-worldheight'), 10) || canvas.height;
	
	// The pixel-offsets of what's being displayed in the canvas compared to the world origin.
	this.xOffset = (this.width - canvas.width)/2;
	this.yOffset = (this.height - canvas.height)/2;
	context.translate(-this.xOffset, -this.yOffset);
	/**
	 * Returns an object with 'x' and 'y' properties indicating how far offset
	 * the viewport is from the world origin.
	 */
	this.getOffsets = function() {
		return {
			'x': this.xOffset,
			'y': this.yOffset,
		};
	};

	/**
	 * Resize the world to new dimensions.
	 *
	 * Careful! This will shift the viewport regardless of where the player is.
	 * Objects already in the world will retain their coordinates and so may
	 * appear in unexpected locations on the screen.
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
		 * Broadcast that the world size changed so that objects already in the
		 * world or other things that depend on the world size can update their
		 * position or size accordingly.
		 */
		$(document).trigger('resizeWorld', { 'x': deltaX, 'y': deltaY, 'world': this });
	};
}

/**
 * The Layer object.
 * 
 * Layers allow efficient rendering of complex scenes by acting as caches for
 * parts of the scene that are grouped together. For example, it is recommended
 * to create a layer for your canvas's background so that you can render the
 * background once and then draw the completely rendered background onto the
 * main canvas in each frame instead of re-computing the background for each
 * frame. This can significantly speed up animation.
 * 
 * In general you should create a layer for any significant grouping of items
 * that must be drawn on the canvas, if that grouping moves together when
 * animated. It is more memory-efficient to specify a smaller layer size if
 * possible; otherwise the layer will default to the size of the whole canvas.
 *
 * Draw onto a Layer by using its "context" property, which is a canvas
 * graphics context.
 * 
 * @param x
 *   (optional) The x-coordinate of the top-left corner of the layer. Defaults
 *   to 0 (zero).
 * @param y
 *   (optional) The y-coordinate of the top-left corner of the layer. Defaults
 *   to 0 (zero).
 * @param w
 *   (optional) The width of the layer. Defaults to the canvas width.
 * @param h
 *   (optional) The height of the layer. Defaults to the canvas height.
 * @param relative
 *   (optional) One of the following strings, indicating what to draw the layer
 *   relative to:
 *   - 'world': Draw the layer relative to the world so that it will appear to
 *     be in one specific place to the player as the player moves.
 *   - 'canvas': Draw the layer relative to the canvas so that it stays fixed
 *     as the player moves.
 *   - 'view': Draw the layer relative to the world, but offset with the canvas.
 *   This option is irrelevant if the world is the same size as the canvas.
 * @param c
 *   (optional) A Canvas element in which to hold the layer. If not specified,
 *   a new, invisible canvas is created. Careful; if width and height are
 *   specified, the canvas will be resized. This is mainly for internal use.
 */
function Layer(options) {
  var options = options || {};
	this.canvas = options.canvas || document.createElement('canvas');
	this.context = this.canvas.getContext('2d'); // Use this to draw onto the Layer
	this.width = options.width || world.width || canvas.width;
	this.height = options.height || world.height || canvas.height;
	this.x = options.x || 0;
	this.y = options.y || 0;
	this.relative = options.relative || 'world';
	this.canvas.width = this.width;
	this.canvas.height = this.height;
	/**
	 * Draw the Layer onto the main canvas.
	 *
	 * You can position the Layer at a given location using the x and y
	 * parameters (how this actually works depends on the value of this.relative)
	 * -- otherwise the Layer is drawn at the location specified when it was
	 * instantiated (defaults to (0, 0)).
	 */
	this.draw = function(x, y) {
		x = x === null || x === undefined ? this.x : x;
		y = y === null || y === undefined ? this.y : y;
		if (this.relative == 'canvas') {
		  context.save();
		  context.translate(world.xOffset, world.yOffset);
		}
		context.drawImage(this.canvas, x, y);
		if (this.relative == 'canvas') {
		  context.restore();
		}
	};
	/**
	 * Clear the layer, optionally by filling it with a given style.
	 */
	this.clear = function(fillStyle) {
		this.context.clear(fillStyle);
	};
}

// RENDERING ------------------------------------------------------------------

/**
 * Clear the canvas.
 * 
 * Passing the optional fillStyle parameter will cause the entire canvas to be
 * filled in with that style. Otherwise the canvas is simply wiped.
 */
CanvasRenderingContext2D.prototype.clear = function(fillStyle) {
	if (fillStyle) {
		this.fillStyle = fillStyle;
		this.fillRect(0, 0, world.width, world.height);
	}
	else {
		this.clearRect(world.xOffset, world.yOffset, this.canvas.width, this.canvas.height);
	}
};

/**
 * Draws an image onto the canvas.
 *
 * This function is preferred over the standard context.drawImage() for drawing
 * images from files because it offers significant performance advantages when
 * drawing the same image repeatedly, e.g. during animation or canvas
 * refreshing. The performance gain comes from caching images so that they do
 * not have to be loaded from the disk each time.
 *
 * Additionally, this function can draw Sprite and SpriteMap objects as well as
 * the usual standard images, videos, and canvases. Using this function instead
 * of Sprite.draw() or SpriteMap.draw() is recommended for consistency (since
 * this function is also used for images). It also allows drawing an image by
 * passing in the file path, whereas using context.drawImage() requires that
 * you manually load the image.
 * 
 * This image is helpful to understand the sx/sy/sw/sh parameters:
 * http://images.whatwg.org/drawImage.png
 *
 * This function falls back to the default handling for videos rather than
 * attempting to manage loading and caching them. Note that usually if you want
 * to display a video in a canvas being animated, you should draw it to a
 * separate canvas and draw that canvas instead (or overlay it).
 *
 * Other than as described above, this function has the same behavior as
 * context.drawImage(), including errors thrown. More details are available at
 * http://j.mp/whatwg-canvas-drawing
 * 
 * @param src
 *   One of the following, indicating what to draw:
 *   - The file path of an image to draw
 *   - A Sprite or SpriteMap object
 *   - An HTMLCanvasElement
 *   - An HTMLImageElement
 *   - An HTMLVideoElement
 *   If something else is passed in, this function throws a TypeMismatchError.
 * @param x
 *   The x-coordinate of the canvas graphics context at which to draw the
 *   top-left corner of the image. (Often this is the number of pixels from the
 *   left side of the canvas.)
 * @param y
 *   The y-coordinate of the canvas graphics context at which to draw the
 *   top-left corner of the image. (Often this is the number of pixels from the
 *   top of the canvas.)
 * @param w
 *   (Optional) The width of the image. Defaults to the image width (or, for a
 *   Sprite or SpriteMap, defaults to the projectedW).
 * @param h
 *   (Optional) The height of the image. Defaults to the image height (or, for
 *   a Sprite or SpriteMap, defaults to the projectedH).
 * @param sx, sy, sw, sh
 *   (Optional) If any of these parameters are specified, each of the others
 *   must also be specified, and together they define a rectangle within the
 *   image that will be drawn onto the canvas. sx and sy are the x- and y-
 *   coordinates (within the image) of the upper-left corner of the source
 *   rectangle, respectively, and sw and sh are the width and height of the
 *   source rectangle, respectively. These parameters are ignored when drawing
 *   a Sprite or SpriteMap.
 * @param finished
 *   (Optional) The first time an image is drawn, it will be drawn
 *   asynchronously and could appear out of order (e.g. "above" an image that
 *   was supposed to be drawn later) because the image needs to be loaded
 *   before it can be rendered. You can get around this by passing a function
 *   to this parameter, in which case it will always be run after the image is
 *   painted. Alternatively this delay can be eliminated by pre-loading the
 *   image in question with preloadImages().
 */
CanvasRenderingContext2D.prototype.drawLoadedImage = function(src, x, y, w, h, sx, sy, sw, sh, finished) {
  var _drawImage = function(t, image, x, y, w, h, sx, sy, sw, sh) {
    if (w && h) {
      if (sw && sh) {
        t.drawImage(image, sx, sy, sw, sh, x, y, w, h);
      }
      else {
        t.drawImage(image, x, y, w, h);
      }
    }
    else {
      t.drawImage(image, x, y);
    }
    if (typeof finished == 'function') {
      finished();
    }
  };
  if (src instanceof Sprite || src instanceof SpriteMap) { // draw a sprite
    src.draw(this, x, y, w, h);
    if (typeof finished == 'function') {
      finished();
    }
  }
  else if (src instanceof HTMLCanvasElement || // draw a canvas
      src instanceof HTMLVideoElement) { // draw a video
    _drawImage(this, src, x, y, w, h, sx, sy, sw, sh);
  }
  else if (src instanceof HTMLImageElement) { // draw an image directly
    var image = src, src = image.src, t = this;
    if (!src) { // can't draw an empty image
      return;
    }
    if (!Caches.images[src]) { // cache the image by source
      Caches.images[src] = image;
    }
    if (image.complete) { // if the image is loaded, draw it
      _drawImage(this, image, x, y, w, h, sx, sy, sw, sh);
    }
    else { // if the image is not loaded, wait to draw it until it's loaded
      if (typeof image.onload == 'function') {
        var o = image.onload;
        image.onload = function() {
          o();
          _drawImage(t, image, x, y, w, h, sx, sy, sw, sh);
        };
      }
      else {
        image.onload = function() {
          _drawImage(t, image, x, y, w, h, sx, sy, sw, sh);
        };
      }
    }
  }
  else if (typeof src == 'string' && Caches.images[src]) { // cached image path
    _drawImage(this, Caches.images[src], x, y, w, h, sx, sy, sw, sh);
  }
  else if (typeof src == 'string') { // uncached image path
    var image = new Image();
    var t = this;
    image.onload = function() {
      Caches.images[src] = image;
      _drawImage(t, image, x, y, w, h, sx, sy, sw, sh);
    };
    image.src = src;
  }
  else {
    throw new TypeMismatchError('drawLoadedImage(): Could not draw; type not recognized.');
  }
};

/**
 * Draws a pattern onto the canvas.
 *
 * This function is always preferred over createPattern() with fillRect() for
 * drawing patterns using images from files because it offers significant
 * performance advantages when drawing the same pattern repeatedly, e.g. during
 * animation or canvas refreshing. The performance gain comes from caching
 * images so that they do not have to be loaded from the disk each time.
 *
 * If you would like to draw an image not in a pattern, see drawLoadedImage()
 * instead. Unlike drawLoadedImage(), this function does not work with Sprite
 * objects.
 * 
 * @param src
 *   The file path of the image to load.
 * @param x
 *   The x-coordinate at which to draw the top-left corner of the pattern.
 * @param y
 *   The y-coordinate at which to draw the top-left corner of the pattern.
 * @param w
 *   The width of the pattern.
 * @param h
 *   The height of the pattern.
 * @param rpt
 *   (Optional) The repeat pattern type. One of repeat, repeat-x, repeat-y,
 *   no-repeat. Defaults to repeat.
 * @param finished
 *   (Optional) The first time a pattern is drawn, it will be drawn
 *   asynchronously and could appear out of order (e.g. "above" an image that
 *   was supposed to be drawn later) if the base image has not yet been loaded.
 *   You can get around this by passing a function to this parameter, in which
 *   case it will always be run after the image is painted. Alternatively this
 *   delay can be eliminated by pre-loading the image in question with
 *   preloadImages().
 */
CanvasRenderingContext2D.prototype.drawLoadedPattern = function(src, x, y, w, h, rpt, finished) {
	if (!rpt) {
		rpt = 'repeat';
	}
	if (Caches.imagePatterns[src]) {
		this.fillStyle = Caches.imagePatterns[src];
		this.fillRect(x, y, w, h);
	}
	else if (Caches.images[src]) {
	  var pattern = this.createPattern(Caches.images[src], rpt);
		Caches.imagePatterns[src] = pattern;
		this.fillStyle = pattern;
		this.fillRect(x, y, w, h);
	}
	else {
		var image = new Image();
		var t = this;
		image.onload = function() {
	    t.fillStyle = t.createPattern(image, rpt);
			t.fillRect(x, y, w, h);
			Caches.imagePatterns[src] = t.fillStyle;
			Caches.images[src] = image;
			if (finished) {
			  finished();
			}
		};
		image.src = src;
	}
};

/**
 * Preload a list of images asynchronously.
 * 
 * @param files
 *   An array of paths to images to preload.
 * @param options
 *   An object of options for this function.
 *   - finishCallback: A function to run when all images have finished loading.
 *     Receives the number of images loaded as a parameter.
 *   - itemCallback: A function to run when an image has finished loading.
 *     Receives the file path of the loaded image, how many images have been
 *     loaded so far (including the current one), and the total number of
 *     images to load.
 */
function preloadImages(files, options) {
  var l = files.length, m = -1;
  var notifyLoaded = function(itemCallback, src) {
    m++;
    if (itemCallback) {
      itemCallback(src, m, l);
    }
    if (m == l && options.finishCallback) {
      options.finishCallback(l);
    }
  };
  notifyLoaded();
  while (files.length) {
    var src = files.pop();
    var image = new Image();
    image.num = l-files.length;
    image.onload = function() {
      Caches.images[this.src] = this;
      notifyLoaded(options.itemCallback, this.src);
    }
    image.src = src;
  }
}

// DRAW SHAPES ----------------------------------------------------------------

/**
 * Draw a circle.
 * 
 * @param x
 *   The x-coordinate of the center of the circle.
 * @param y
 *   The y-coordinate of the center of the circle.
 * @param r
 *   The radius of the circle.
 * @param fillStyle
 *   A canvas fillStyle used to fill the circle. If not specified, the circle uses the current
 *   fillStyle. If null, the circle is not filled.
 * @param strokeStyle
 *   A canvas strokeStyle used to draw the circle's border. If not specified,
 *   no border is drawn on the circle. If null, the border uses the current
 *   strokeStyle.
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
 * The Actor class uses this as a placeholder.
 * 
 * @param x
 *   The x-coordinate of the center of the smiley face.
 * @param y
 *   The y-coordinate of the center of the smiley face.
 * @param r
 *   The radius of the smiley face.
 * @param fillStyle
 *   (optional) The color / fill-style of the smiley face.
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
 */
function preventDefaultKeyEvents(combinations) {
	$(document).keydown(combinations, function() { return false; });
}

/**
 * Determines whether the mouse is hovering over an object.
 * 
 * The object in question must have these properties: x, y, width, height.
 * 
 * @param obj
 *   The object to check.
 */
App.isHovered = function(obj) {
	var offsets = world.getOffsets(), xPos = obj.x - offsets.x, yPos = obj.y - offsets.y;
	return mouseCoords.x > xPos && mouseCoords.x < xPos + obj.width &&
			mouseCoords.y > yPos && mouseCoords.y < yPos + obj.height;
};

// TIMER ----------------------------------------------------------------------

/**
 * A timer.
 *
 * Adapted from https://github.com/mrdoob/three.js/blob/master/src/core/Clock.js
 *
 * @param autoStart
 *   Whether to start the timer immediately upon instantiation or wait until
 *   the start() method is called.
 */
function Timer(autoStart) {
  this.autoStart = autoStart === undefined ? true : autoStart;
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
    if (this.autoStart && !this.running) {
      this.start();
    }
    if (this.running) {
      var now = Date.now();
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
    this.lastStartTime = this.lastDeltaTime = Date.now();
    this.running = true;
  };
  /**
   * Stop the timer.
   */
  this.stop = function () {
    this.running = false;
    this.elapsedTime += this.getDelta();
  };
  /**
   * Get the amount of time the timer has been running.
   */
  this.getElapsedTime = function() {
    this.elapsedTime += this.getDelta();
    return this.elapsedTime;
  };
  if (this.autoStart) {
    this.start();
  }
}

// UTILITIES ------------------------------------------------------------------

/**
 * Convert a percent (out of 100%) to the corresponding pixel position in the world.
 */
App.Utils.percentToPixels = function(percent) {
	return {
		x: Math.floor(world.width * percent / 100),
		y: Math.floor(world.height * percent / 100),
	};
};

/**
 * Get a random integer between lo and hi, inclusive.
 *
 * Assumes lo and hi are integers and lo is lower than hi.
 */
App.Utils.getRandBetween = function(lo, hi) {
  return parseInt(Math.floor(Math.random()*(hi-lo+1))+lo, 10);
};

/**
 * Get the keys (property names) of an object.
 *
 * This would be useful as an extension of Object, but extending Object can
 * break quite a lot of external code (including jQuery).
 */
App.Utils.keys = function(obj) {
  var ks = [];
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      ks.push(key);
    }
  }
  return ks;
};

/**
 * Remove an item from an array by value.
 */
Array.prototype.remove = function(item) {
	var i = $.inArray(item, this);
	if (i === undefined || i < 0) {
		return undefined;
	}
	return this.splice(i, 1);
};

/**
 * Get a random element out of an array.
 */
Array.prototype.getRandomElement = function() {
  if (this.length === 0) {
    return undefined;
  }
  var i = getRandBetween(0, this.length-1);
  return this[i];
};
