/**
 * Adds support for zooming with the mouse. Depends on mouse.js.
 *
 * @ignore
 */
(function() {
var lastZoom = App.physicsTimeElapsed, numScrollEvents = 0;
/**
 * @class Mouse.Zoom
 *   Allows zooming in and out by scrolling the mouse wheel.
 *
 * This class is not included in the combined script because it's not as
 * commonly useful. However, it is included in this package because it makes
 * use of functionality that the rest of this package provides, and it doesn't
 * make sense to have to copy-paste boilerplate when this feature is required.
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
   * Whether zooming is enabled or not.
   * @readonly
   * @static
   */
  enabled: false,
  /**
   * The {@link Layer} displaying the zoom level indicator.
   * @static
   * @ignore
   */
  _indicatorLayer: null,
  /**
   * Enable zooming in response to mouse wheel scrolling.
   *
   * @param {Boolean} [showZoomLevel=false]
   *   Whether to show an indicator of the zoom level. If false, you can draw
   *   the zoom indicator yourself with {@link Mouse.Zoom#draw}.
   * @static
   */
  enable: function(showZoomLevel) {
    if (Mouse.Zoom.enabled) {
      return;
    }
    Mouse.Zoom.enabled = true;
    // wheel is a standard (IE and FF); mousewheel is legacy (Chrome)
    $canvas.on('wheel.zoom mousewheel.zoom', function(e) {
      e.preventDefault();
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
      var mx = Mouse.Coords.worldX(),
          my = Mouse.Coords.worldY();
      // Scroll up; zoom in
      if (delta.sign() < 0) {
        if (world.scale > Mouse.Zoom.MIN_ZOOM) {
          world.scaleResolution(world.scale - Mouse.Zoom.ZOOM_STEP, mx, my);
          /**
           * @event zoom
           *   Fires on the document when the user zooms in or out.
           *
           * @param {Boolean} zoomIn
           *   Whether the user zoomed in or out.
           *
           * @member global
           */
          jQuery(document).trigger('zoom', true);
        }
      }
      // Scroll down; zoom out
      else {
        if (world.scale < Mouse.Zoom.MAX_ZOOM) {
          world.scaleResolution(world.scale + Mouse.Zoom.ZOOM_STEP, mx, my);
          jQuery(document).trigger('zoom', false);
        }
      }
    });
    if (showZoomLevel && typeof Layer !== 'undefined') {
      if (!Mouse.Zoom._indicatorLayer) {
        Mouse.Zoom._indicatorLayer = new Layer({relative: 'canvas'});
        Mouse.Zoom._indicatorLayer.positionOverCanvas();
      }
      Mouse.Zoom.draw(Mouse.Zoom._indicatorLayer.context);
      $(document).on('zoom', function() {
        Mouse.Zoom._indicatorLayer.context.clear();
        Mouse.Zoom.draw(Mouse.Zoom._indicatorLayer.context);
      });
    }
  },
  /**
   * Disable zooming in response to mouse wheel scrolling.
   * @static
   */
  disable: function() {
    $canvas.off('.zoom');
    Mouse.Zoom.enabled = false;
    if (Mouse.Zoom._indicatorLayer && typeof Layer !== 'undefined') {
      Mouse.Zoom._indicatorLayer.context.clear();
    }
  },
  /**
   * The current zoom level as a decimal percent of the original zoom level.
   */
  zoomLevel: function() {
    return world.scale;
  },
  /**
   * Draws an indicator of the zoom level.
   *
   * The indicator is a set of vertical bars going from large at the top to
   * small at the bottom to indicate zooming all the way in (large/top) or all
   * the way out (small/bottom).
   *
   * Passing `true` to {@link Mouse.Zoom#enable} will draw the zoom indicator
   * automatically with the default settings. If you want to do it yourself,
   * use this pattern to make sure the zoom indicator itself doesn't get zoomed
   * in:
   *
   *     var zoomLayer = new Layer({relative: 'canvas'});
   *     zoomLayer.positionOverCanvas();
   *     Mouse.Zoom.draw(zoomLayer.context);
   *     $(document).on('zoom', function() {
   *       zoomLayer.context.clear();
   *       Mouse.Zoom.draw(zoomLayer.context);
   *     });
   *
   * @param {CanvasRenderingContext2D} ctx
   *   A canvas graphics context onto which the zoom indicator should be drawn.
   *   This is useful for drawing onto {@link Layer}s. If not specified,
   *   defaults to the {@link global#context global context} for the default
   *   canvas (which is usually not what you want).
   * @param {Object} [options]
   *   A map of options for how to draw the zoom indicator.
   * @param {String} [options.outlineColor='black']
   *   The color to use for the border of the zoom indicator bars.
   * @param {String} [options.defaultBoxColor='#333333']
   *   The color to use for the zoom indicator bars that aren't selected.
   * @param {String} [options.activeBoxColor='#AAAAAA']
   *   The color to use for the active zoom indicator bar.
   * @param {Number} [options.maxWidth=160]
   *   The width of the largest zoom indicator bar.
   * @param {Number} [options.minWidth=40]
   *   The width of the smallest zoom indicator bar.
   * @param {Number} [options.topOffset=20]
   *   The distance from the top of the canvas to draw the zoom indicator. If
   *   drawing onto the main canvas, this is effectively the y-coordinate in
   *   the world, which is probably not what you want; so you should probably
   *   draw this onto a canvas-sized {@link Layer} and then draw that Layer
   *   onto the main canvas.
   * @param {Number} [options.rightOffset=20]
   *   The distance from the right side of the canvas to draw the zoom
   *   indicator. If drawing onto the main canvas, this is effectively
   *   `world.width - x`, which is probably not what you want; so you should
   *   probably draw this onto a canvas-sized {@link Layer} and then draw that
   *   Layer onto the main canvas.
   * @param {Number} [options.totalHeight=160]
   *   The total height of the entire zoom indicator.
   * @param {Number} [options.gapBetweenBars=5]
   *   The number of pixels between the zoom indicator bars.
   * @param {Number} [options.oneBarScale=1.25]
   *   The percent (as a decimal) by which the bar representing a zoom level of
   *   `1.0` should be wider than it otherwise would be.
   * @param {Number} [options.outlineWidth=1]
   *   The width of the outline around the zoom indicator bars.
   * @param {Boolean} [options.verticalLine=false]
   *   Whether to draw a vertical line connecting all the zoom indicator bars.
   * @param {String} [options.verticalLineColor]
   *   If `options.verticalLine` is true, the color of the connecting line.
   *   Defaults to `options.defaultBoxColor`.
   * @param {Number} [options.verticalLineWidth]
   *   If `options.verticalLine` is true, the width of the connecting line.
   *   Defaults to the height of the zoom indicator bars.
   */
  draw: function(ctx, options) {
    ctx = ctx || context;
    if (typeof options === 'undefined') {
      options = {};
    }
    options.outlineColor = options.outlineColor || 'black';
    options.defaultBoxColor = options.defaultBoxColor || '#333333';
    options.activeBoxColor = options.activeBoxColor || '#AAAAAA';
    options.maxWidth = options.maxWidth || 160;
    options.minWidth = options.minWidth || 40;
    options.topOffset = typeof options.topOffset === 'undefined' ? 20 : options.topOffset;
    options.rightOffset = typeof options.rightOffset === 'undefined' ? 20 : options.rightOffset;
    options.totalHeight = options.totalHeight || 160;
    options.gapBetweenBars = typeof options.gapBetweenBars === 'undefined' ? 5 : options.gapBetweenBars;
    options.oneBarScale = options.oneBarScale || 1.25;
    options.outlineWidth = typeof options.outlineWidth === 'undefined' ? 1 : options.outlineWidth;
    options.verticalLineColor = options.verticalLineColor || options.defaultBoxColor;

    // Figure out how many boxes we need to draw.
    // `c` is the current zoom level and `o` is scale=1.0
    var n = 1, c = 0, o = 0, i = Mouse.Zoom.MIN_ZOOM;
    for (; i < Mouse.Zoom.MAX_ZOOM; i += Mouse.Zoom.ZOOM_STEP) {
      n++;
      if (i < world.scale) c = n;
      if (i < 1) o = n;
    }
    c--;
    o--;

    // Draw the non-active zoom levels.
    var stepw = (options.maxWidth - options.minWidth) / n,
        steph = options.totalHeight / n;
    var leftX = ctx.canvas.width - options.rightOffset - options.maxWidth;
    ctx.fillStyle = options.defaultBoxColor;
    ctx.strokeStyle = options.outlineColor;
    ctx.lineWidth = options.outlineWidth;
    for (i = 0; i < n; i++) {
      if (i == c) continue;
      fillAndStrokeRect(
          ctx,
          leftX + stepw * i * 0.5 - (i == o ? (options.oneBarScale-1)*0.5 : 0) * (options.maxWidth - stepw * i),
          options.topOffset + steph * i,
          (options.maxWidth - stepw * i) * (i == o ? options.oneBarScale : 1),
          steph - options.gapBetweenBars
      );
    }
    // Draw the vertical line.
    if (options.verticalLine) {
      ctx.fillStyle = options.verticalLineColor;
      ctx.fillRect(
          leftX * 0.5 - (steph - options.gapBetweenBars) * 0.5,
          options.topOffset + options.outlineWidth,
          options.verticalLineWidth || steph - options.gapBetweenBars,
          options.totalHeight - options.gapBetweenBars - 2*options.outlineWidth
      );
    }
    // Draw the active zoom level.
    ctx.fillStyle = options.activeBoxColor;
    fillAndStrokeRect(
        ctx,
        leftX + stepw * c * 0.5 - (c == o ? (options.oneBarScale-1)*0.5 : 0) * (options.maxWidth - stepw * c),
        options.topOffset + steph * c,
        (options.maxWidth - stepw * c) * (c == o ? options.oneBarScale : 1),
        steph - options.gapBetweenBars
    );
  },
};
function fillAndStrokeRect(ctx, x, y, w, h) {
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);
}
})();
