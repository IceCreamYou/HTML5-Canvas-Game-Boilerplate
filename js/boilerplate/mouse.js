/**
 * Handles mouse motion/tracking, scrolling, and dragging.
 *
 * @ignore
 */

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

/**
 * Handles mouse motion and scrolling.
 * @static
 * @ignore
 */
var Mouse = {
    /**
     * @class Mouse.Coords
     *   Handles mouse coordinates.
     * @static
     */
    Coords: {
      /**
       * The mouse x-coordinate relative to the upper-left corner of the canvas.
       *
       * This value is actually relative to `canvas.width` and `canvas.height`,
       * which is an important distinction when the canvas is scaled using
       * {@link World#scaleResolution}. It represents the horizontal location
       * of the mouse on the rendered buffer before it is scaled by CSS. When
       * you want the x-coordinate of the mouse relative to the canvas, this is
       * usually what you want to use.
       */
      x: -9999,
      /**
       * The mouse y-coordinate relative to the upper-left corner of the canvas.
       *
       * This value is actually relative to `canvas.width` and `canvas.height`,
       * which is an important distinction when the canvas is scaled using
       * {@link World#scaleResolution}. It represents the vertical location of
       * the mouse on the rendered buffer before it is scaled by CSS. When you
       * want the y-coordinate of the mouse relative to the canvas, this is
       * usually what you want to use.
       */
      y: -9999,
      /**
       * The mouse x-coordinate over the canvas DOM element.
       *
       * This value is actually relative to `$canvas.css('width')` and
       * `$canvas.css('height')`, or the display size of the canvas. This can
       * be different than the size at which the canvas is rendered if the
       * canvas is scaled with {@link World#scaleResolution}. You may want to
       * use this if you are positioning DOM elements over the canvas.
       */
      physicalX: -9999,
      /**
       * The mouse y-coordinate over the canvas DOM element.
       *
       * This value is actually relative to `$canvas.css('width')` and
       * `$canvas.css('height')`, or the display size of the canvas. This can
       * be different than the size at which the canvas is rendered if the
       * canvas is scaled with {@link World#scaleResolution}. You may want to
       * use this if you are positioning DOM elements over the canvas.
       */
      physicalY: -9999,
      /**
       * The mouse x-coordinate relative to the world.
       *
       * Use this if you want the pointer to interact with the world.
       */
      worldX: function() {
        return this.x >= 0 ? this.x + world.xOffset : -9999;
      },
      /**
       * The mouse y-coordinate relative to the world.
       *
       * Use this if you want the pointer to interact with the world.
       */
      worldY: function() {
        return this.y >= 0 ? this.y + world.yOffset : -9999;
      },
    },
};

// Track mouse events
jQuery(document).ready(function() {
  // Callback for mouse/touch-move event to track cursor location
  var trackmove = function(e) {
    try {
      // Get the cursor location
      var x = e.pageX || e.originalEvent.touches[0].pageX;
      var y = e.pageY || e.originalEvent.touches[0].pageY;
      // Prevent window scrolling on iPhone and display freeze on Android
      if (e.type == 'touchmove') {
        e.preventDefault();
      }
      // The position we want is relative to the canvas
      Mouse.Coords.physicalX = x - $canvas.offset().left;
      Mouse.Coords.physicalY = y - $canvas.offset().top;
      // Adjust for scaled resolution
      Mouse.Coords.x = Math.round(Mouse.Coords.physicalX * world._actualXscale);
      Mouse.Coords.y = Math.round(Mouse.Coords.physicalY * world._actualYscale);
    }
    catch(ex) {
      // Don't report anything. Probably the reason we had an error is because
      // the mouse moved off the document so neither the pageX/Y nor the
      // touches properties have meaningful values.
    }
  };

  // Track cursor for touches
  $canvas.on('touchmove.coords', trackmove);
  // For mice, only track the cursor when it's over the canvas
  $canvas.hover(function() {
    jQuery(this).on('mousemove.coords', trackmove);
  }, function() {
    jQuery(this).off('mousemove.coords');
    Mouse.Coords.physicalX = -9999;
    Mouse.Coords.physicalY = -9999;
    Mouse.Coords.x = -9999;
    Mouse.Coords.y = -9999;
  });

  // Track and delegate click events
  $canvas.on('mousedown mouseup click touchstart touchend', function(e) {
    if (e.type == 'touchstart') {
      trackmove(e);
    }
    if (isAnimating() && typeof App.Events !== 'undefined') {
      App.Events.trigger(e.type, e);
    }
  });

  // Track and delegate dragend events
  $canvas.on('mouseup.drag touchend.drag', function(e) {
    if (typeof App.Events !== 'undefined') {
      App.Events.trigger('canvasdragstop', e);
    }
    App.isSomethingBeingDragged = false;
    /**
     * @event canvasdragstop
     *   Fires on the document when the player stops dragging an object,
     *   i.e. when the player releases the mouse or stops touching the canvas.
     * @member global
     */
    jQuery(document).trigger('canvasdragstop');
  });

  // Track and delegate drop events
  jQuery(document).on('canvasdrop', function(e, target) {
    if (typeof App.Events !== 'undefined') {
      App.Events.trigger('canvasdrop', e, target);
    }
  });
});

/**
 * Determine whether the mouse is hovering over an object.
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
  return Mouse.Coords.worldX() > obj.x && Mouse.Coords.worldX() < obj.x + obj.width &&
      Mouse.Coords.worldY() > obj.y && Mouse.Coords.worldY() < obj.y + obj.height;
};

/**
 * @class Mouse.Scroll
 *   Encapsulates mouse position scrolling.
 *
 * Note that mouse scrolling will be temporarily paused while the mouse is down
 * to avoid scrolling while the user is trying to select something.
 *
 * @static
 */
Mouse.Scroll = (function() {
  var THRESHOLD = 0.2, MOVEAMOUNT = 350;
  // Whether we're allowed to mouse scroll
  var enabled = false;
  // If enabled is true, then whether the mouse is over the canvas
  var hovered = false;
  // Whether the mouse is pressed down over the canvas
  var mousedown = false;
  // Whether we're currently scrolling
  var translating = false;
  // How far we scrolled last time
  var scrolled = {x: 0, y: 0};
  // Available easing functions
  var easings = {
      THRESHOLD: function() { return 1; },
      LINEAR: function(val) { return 1-val; },
      SMOOTH: function(val) { return 0.5 - Math.cos( (1-val)*Math.PI ) / 2; },
      EXPONENTIAL: function(val) { return Math.sqrt(1-val); },
  };
  // The currently active easing function
  var easing = easings.SMOOTH;

  function translate() {
    var ma, gradient, initialTranslationState = translating;

    // Left
    if (Mouse.Coords.x < canvas.width * THRESHOLD) {
      gradient = easing(Mouse.Coords.x / (canvas.width * THRESHOLD));
      ma = Math.round(gradient*Math.min(world.xOffset, MOVEAMOUNT * App.physicsDelta));
      world.xOffset -= ma;
      scrolled.x -= ma;
      context.translate(ma, 0);
    }
    // Right
    else if (Mouse.Coords.x > canvas.width * (1-THRESHOLD)) {
      gradient = easing((canvas.width - Mouse.Coords.x) / (canvas.width * THRESHOLD));
      ma = Math.round(gradient*Math.min(world.width - canvas.width - world.xOffset, MOVEAMOUNT * App.physicsDelta));
      world.xOffset += ma;
      scrolled.x += ma;
      context.translate(-ma, 0);
    }

    // Up
    if (Mouse.Coords.y < canvas.height * THRESHOLD) {
      gradient = easing(Mouse.Coords.y / (canvas.height * THRESHOLD));
      ma = Math.round(gradient*Math.min(world.yOffset, MOVEAMOUNT * App.physicsDelta));
      world.yOffset -= ma;
      scrolled.y -= ma;
      context.translate(0, ma);
    }
    // Down
    else if (Mouse.Coords.y > canvas.height * (1-THRESHOLD)) {
      gradient = easing((canvas.height - Mouse.Coords.y) / (canvas.height * THRESHOLD));
      ma = Math.round(gradient*Math.min(world.height - canvas.height - world.yOffset, MOVEAMOUNT * App.physicsDelta));
      world.yOffset += ma;
      scrolled.y += ma;
      context.translate(0, -ma);
    }

    // We're not translating if we're not moving.
    translating = scrolled.x !== 0 && scrolled.y !== 0;

    // We weren't scrolling. Now we are. Fire the relevant event.
    if (!initialTranslationState && translating) {
      /**
       * @event mousescrollon
       *   Fires on the document when the viewport starts scrolling. Binding
       *   to this event may be useful if you want to pause animation or
       *   display something while the viewport is moving.
       */
      jQuery(document).trigger('mousescrollon');
    }
    // We were scrolling. Now we're not. Fire the relevant event.
    else if (initialTranslationState && !translating) {
      /**
       * @event mousescrolloff
       *   Fires on the document when the viewport stops scrolling. Binding
       *   to this event may be useful if you want to pause animation or
       *   display something while the viewport is moving.
       */
      jQuery(document).trigger('mousescrolloff');
    }
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
      $canvas.one('mousemove.translate', function() {
        // Enable translating if we're over the canvas
        if (Mouse.Coords.x >= 0 && Mouse.Coords.y >= 0) {
          hovered = true;
          translate();
        }
      });
      $canvas.on('mouseenter.translate touchstart.translate', function() {
        hovered = true;
        translate();
      });
      $canvas.on('mouseleave.translate touchleave.translate', function() {
        hovered = false;
        if (translating) {
          translating = false;
          jQuery(document).trigger('mousescrolloff');
        }
      });
      $canvas.on('mousedown.translate touchstart.translate', function() {
        mousedown = true;
      });
      $canvas.on('mouseup.translate touchend.translate', function() {
        mousedown = false;
      });
    },
    /**
     * Disable mouse position scrolling.
     * @static
     */
    disable: function() {
      $canvas.off('.translate');
      hovered = false;
      enabled = false;
      translating = false;
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
     *
     * There is one weird edge case: this will return true if the user is in
     * the middle of a click-and-drag action that was started while the
     * viewport was scrolling.
     *
     * @static
     */
    isScrolling: function() {
      return translating;
    },
    // Called in the core animation loop.
    _update: function() {
      // Don't scroll while dragging.
      if (hovered && !mousedown) {
        return translate();
      }
    },
    /**
     * Available easing modes for scroll movement speed.
     *
     * Modes include:
     *
     * - THRESHOLD: Scroll at max speed when the mouse is past the threshold
     * - LINEAR: Increase scroll speed linearly as the mouse approaches an edge
     * - SMOOTH: S-curve "swing" easing (default)
     * - EXPONENTIAL: Increase scroll speed inverse-exponentially as the mouse
     *   approaches an edge (increase quickly at first, then plateau)
     *
     * @static
     */
    easings: easings,
    /**
     * Set the easing function used to determine scroll speed.
     *
     * The `easings` property contains the possible easing functions, or you
     * can define your own.
     *
     * @static
     */
    setEasingFunction: function(e) {
      easing = e;
    },
    /**
     * Get the easing function used to determine scroll speed.
     *
     * The `easings` property contains the possible easing functions.
     *
     * @static
     */
    getEasingFunction: function() {
      return easing;
    },
    /**
     * Set how close to the edge of the canvas the mouse triggers scrolling.
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
     * Get how close to the edge of the canvas the mouse triggers scrolling.
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
     * Set how fast the mouse will cause the viewport to scroll.
     *
     * The actual scrolling speed also depends on the easing function. The
     * scroll speed set here is actually the maximum scroll speed.
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
     * Get how fast the mouse will cause the viewport to scroll.
     *
     * The actual scrolling speed also depends on the easing function. The
     * scroll speed retrieved here is actually the maximum scroll speed.
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
