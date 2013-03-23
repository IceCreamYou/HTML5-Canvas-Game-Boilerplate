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
      Mouse.coords = {
          x: x - $canvas.offset().left,
          y: y - $canvas.offset().top,
      };
    }
    catch(ex) {
      if (window.console && console.error) {
        console.error('Unable to track cursor location. You are probably using an unusual touch-capable device.');
      }
    }
  };

  // Track cursor for touches
  $canvas.on('touchmove.coords', trackmove);
  // For mice, only track the cursor when it's over the canvas
  $canvas.hover(function() {
    jQuery(this).on('mousemove.coords', trackmove);
  }, function() {
    jQuery(this).off('mousemove.coords');
    Mouse.coords = {x: -9999, y: -9999};
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
