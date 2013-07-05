// The main logic for your project goes in this file.

var layers = []; // Our drawings. One layer per mouse action
var redo = []; // Drawings that have been undone
var activeLayer; // The "current" layer where we preview the current draw action
var mousedown = false; // Whether we're currently drawing
var activeColor = 'black'; // The color to draw in
var activeBrush = 'pencil'; // The brush to draw with
var brush; // The active brush instance

/**
 * Defines brushes.
 *
 * Each brush has a mousedown, mousemove, and mouseup method. These methods are
 * called automatically on the corresponding events, and passed the active
 * layer's graphics context as the only parameter. Use `Mouse.Coords` to detect
 * the mouse position.
 */
var brushes = {
  // Draw a line that follows the mouse.
  pencil: function() {
    this.mousedown = function(ctx) {
      this.x = Mouse.Coords.x;
      this.y = Mouse.Coords.y;
      ctx.beginPath();
      ctx.moveTo(Mouse.Coords.x, Mouse.Coords.y);
    };
    this.mousemove = function(ctx) {
      ctx.lineTo(Mouse.Coords.x, Mouse.Coords.y);
      ctx.stroke();
      ctx.moveTo(Mouse.Coords.x, Mouse.Coords.y);
    };
    this.mouseup = function(ctx) {
      // If the mouse never moved, just draw a dot.
      if (Mouse.Coords.x == this.x && Mouse.Coords.y == this.y) {
        ctx.circle(this.x, this.y, 1);
      }
    };
  },
  // Draw a circle.
  circle: function() {
    this.mousedown = function() {
      this.x = Mouse.Coords.x;
      this.y = Mouse.Coords.y;
    };
    this.mousemove = function(ctx) {
      ctx.clear();
      var w = Mouse.Coords.x - this.x;
      var h = Mouse.Coords.y - this.y;
      var r = Math.sqrt(w*w + h*h) / 2;
      ctx.circle(this.x + w/2, this.y + h/2, r);
    };
    this.mouseup = function(ctx) {
      // If the mouse never moved, just draw a dot.
      if (Mouse.Coords.x == this.x && Mouse.Coords.y == this.y) {
        ctx.circle(this.x, this.y, 1);
      }
    };
  },
  // Draw a box.
  rectangle: function() {
    this.mousedown = function() {
      this.x = Mouse.Coords.x;
      this.y = Mouse.Coords.y;
    };
    this.mousemove = function(ctx) {
      ctx.clear();
      ctx.fillRect(this.x, this.y, Mouse.Coords.x - this.x, Mouse.Coords.y - this.y);
    };
    this.mouseup = function(ctx) {
      // If the mouse never moved, just draw a dot.
      if (Mouse.Coords.x == this.x && Mouse.Coords.y == this.y) {
        ctx.circle(this.x, this.y, 1);
      }
    };
  },
};

/**
 * A magic-named function where all drawing should occur.
 */
function draw() {
  // Draw each existing layer
  for (var i = 0; i < layers.length; i++) {
    layers[i].draw();
  }
  // Draw the preview layer
  if (activeLayer && mousedown) {
    activeLayer.draw();
  }
}

/**
 * A magic-named function for one-time setup.
 */
function setup() {
  // Make sure we have a brush to start with
  brush = new brushes[activeBrush]();

  // Select color/brush
  $('#colors li').click(function() {
    $('#colors .selected').removeClass('selected');
    $(this).addClass('selected');
    activeColor = $(this).css('background-color');
  });
  $('#brushes li').click(function() {
    $('#brushes .selected').removeClass('selected');
    $(this).addClass('selected');
    activeBrush = $(this).attr('id');
    brush = new brushes[activeBrush]();
  });

  // Undo/redo
  $('#undo').click(function() {
    if (layers.length) {
      redo.push(layers.pop());
      $('#redo').addClass('active');
    }
    if (!layers.length) {
      $(this).removeClass('active');
    }
  });
  $('#redo').click(function() {
    if (redo.length) {
      layers.push(redo.pop());
      $('#undo').addClass('active');
    }
    if (!redo.length) {
      $(this).removeClass('active');
    }
  });

  // Draw
  $canvas.on('mousedown touchstart', function(e) {
    if (e.type == 'mousedown' && e.which !== 1) return; // left click only
    if (mousedown) return;
    mousedown = true;
    // Clear the redo stack since we're taking a new drawing action
    if (redo.length) {
      redo = [];
      $('#redo').removeClass('active');
    }
    // Set up the preview layer
    activeLayer = new Layer();
    activeLayer.context.fillStyle = activeColor;
    activeLayer.context.strokeStyle = activeColor;
    brush.mousedown(activeLayer.context);
  });
  $canvas.on('mousemove touchmove', function(e) {
    if (mousedown) {
      brush.mousemove(activeLayer.context);
    }
  });
  $canvas.on('mouseup mouseleave touchend', function(e) {
    if (e.type == 'mouseup' && e.which !== 1) return; // left click only
    if (mousedown && activeLayer) {
      brush.mouseup(activeLayer.context);
      layers.push(activeLayer); // Save the preview
      $('#undo').addClass('active');
      activeLayer = null;
    }
    mousedown = false;
  });
  // Prevent iOS webkit from scrolling
  $(document).on('touchmove', function(e) {
    e.preventDefault();
  });
}
