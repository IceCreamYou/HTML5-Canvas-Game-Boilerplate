/**
 * Defines structures that are useful containers of other entities.
 *
 * Specifically, this file holds the Collection class, which is like a more
 * useful 1D Array, and the TileMap class, which is like a more useful 2D Array
 * that also helps with initializing tile-based maps.
 *
 * @ignore
 */

/**
 * An Array-like container to keep track of multiple Boxes/Box descendants.
 *
 * The main reason to use Collections instead of Arrays is that Collections
 * have utility methods to easily process Box objects without manually
 * iterating over each one. Collection objects can be treated as arrays in
 * many respects; for example, they have a dynamic `length` property, and they
 * can be read and modified using square-bracket notation (e.g. `a[0]`)
 * although new elements should not be added using square brackets (use the
 * `add()` method instead to make sure the `length` is correctly updated).
 *
 * @constructor
 *   Creates a new Collection instance.
 *
 * @param {Arguments} ...
 *   An Array of items that the Collection should hold.
 */
function Collection() {
  this.concat.apply(this, arguments);
}
Collection.prototype = {
  /**
   * The number of items in the Collection.
   */
  length: 0,
  /**
   * Draw every object in the Collection.
   *
   * This calls Box#draw() on every Box in the Collection.
   *
   * @param {CanvasRenderingContext2D} [ctx]
   *   A canvas graphics context onto which to draw. This is useful for drawing
   *   onto {@link Layer}s. If not specified, defaults to the
   *   {@link global#context global context} for the default canvas.
   */
  draw: function(ctx) {
    ctx = ctx || context;
    for (var i = 0; i < this.length; i++) {
      this[i].draw(ctx);
    }
    return this;
  },
  /**
   * Execute a function on every item in the Collection.
   *
   * @param {Function/String} f
   *   The function to execute on each item, or the (string) name of a method
   *   of each object in the Collection that should be invoked. In the first
   *   case, the function should return a truthy value in order to remove the
   *   item being processed from the Collection. In the second case, additional
   *   arguments to the forEach method are also passed on to the items' method.
   */
  forEach: function(f) {
    if (typeof f == 'string') {
      return this._executeMethod.apply(this, arguments);
    }
    for (var i = this.length-1; i >= 0; i--) {
      if (f(this[i])) {
        if (typeof this[i].destroy == 'function') {
          this[i].destroy();
        }
        this.splice(i, 1);
      }
    }
    return this;
  },
  /**
   * Execute an arbitrary method of all items in the Collection.
   *
   * All items in the Collection are assumed to have the specified method.
   *
   * This is used *internally* by Collection#forEach().
   *
   * @param {String} name
   *    The name of the method to invoke on each object in the Collection.
   * @param {Arguments} ...
   *    Additional arguments are passed on to the specified method.
   *
   * @ignore
   */
  _executeMethod: function() {
    var name = Array.prototype.shift.call(arguments);
    for (var i = 0; i < this.length; i++) {
      this[i][name].apply(this[i], arguments);
    }
    return this;
  },
  /**
   * Check each pair of items in this Collection for collision.
   *
   * This method assumes every item in the Collection has an "overlaps"
   * method.
   *
   * To check all items in a Collection against a single Box, use the
   * Box#collides() method. To check all items in a Collection against all
   * items in another Collection, use the following pattern:
   *
   *     collection1.forEach(function(item) {
   *       if (item.collides(collection2)) {
   *         // do something
   *       }
   *     });
   *
   * In the example above, to get the Boxes that collide with each item, simply
   * pass `true` as the second parameter to `item.collides()` and note the
   * return value.
   *
   * @param {Function} [callback]
   *   A function to call for each pair of items in this Collection that
   *   collide.
   * @param {Mixed} [callback.a]
   *   An item in the Collection that overlaps.
   * @param {Mixed} [callback.b]
   *   An item in the Collection that overlaps.
   *
   * @return {Boolean}
   *   Whether items in this Collection collide.
   */
  collideAll: function(callback) {
    var collision = false;
    for (var i = 0, l = this.length; i < l; i++) {
      for (var j = i+1; j < l; j++) {
        if (this[i].overlaps(this[j])) {
          if (typeof callback == 'function') {
            callback.call(this, this[i], this[j]);
            collision = true;
          }
          else {
            return true;
          }
        }
      }
    }
    return collision;
  },
  /**
   * Changes the content of a Collection by adding and/or removing elements.
   *
   * This method works exactly the same way as
   * [Array#splice](https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/splice).
   */
  splice: Array.prototype.splice,
  /**
   * Add an item to the Collection.
   *
   * This method works exactly the same way as
   * [Array#push](https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/push).
   */
  add: Array.prototype.push,
  /**
   * Add the items in an Array or another Collection to this Collection.
   *
   * See Collection#combine() to add the items in another Collection to this
   * Collection.
   *
   * @param {Arguments} ...
   *   Array(s) or Collection(s) of Boxes to add to the Collection.
   */
  concat: function() {
    for (var i = 0, l = arguments.length; i < l; i++) {
      if (arguments[i] instanceof Array || arguments[i] instanceof Collection) {
        for (var j = 0, m = arguments[i].length; j < m; j++) {
          Array.prototype.push.call(this, arguments[i][j]);
        }
      }
      else {
        Array.prototype.push.call(this, arguments[i]);
      }
    }
    return this;
  },
  /**
   * Remove an item from the Collection.
   *
   * See Collection#removeLast() to pop the last item in the collection.
   *
   * @param {Mixed} item
   *   The item to remove from the Collection.
   *
   * @return Array
   *   An Array containing the removed element, if any.
   */
  remove: Array.prototype.remove,
  /**
   * Remove and return the last item in the Collection.
   *
   * This method works exactly the same way as
   * [Array#pop](https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/pop).
   */
  removeLast: Array.prototype.pop,
  /**
   * Remove and return the first item in the Collection.
   *
   * This method works exactly the same way as
   * [Array#shift](https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/shift).
   */
  removeFirst: Array.prototype.shift,
  /**
   * Remove all items in the Collection.
   */
  removeAll: function() {
    Array.prototype.splice.call(this, 0, this.length);
    return this;
  },
  /**
   * Returns index of the specified item in the Collection.
   *
   * This method works exactly the same way as
   * [Array#indexOf](https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/indexOf).
   */
  indexOf: Array.prototype.indexOf,
};

/**
 * A wrapper for image tiles so they can be drawn in the right location.
 *
 * Used *internally* by TileMap as a lighter version of a Box.
 *
 * `src` can be any object of type String (e.g. a file path to an image),
 * Image, HTMLImageElement, HTMLCanvasElement, Sprite, or SpriteMap.
 *
 * @ignore
 */
function ImageWrapper(src, x, y, w, h) {
  this.src = src;
  this.x = x;
  this.y = y;
  this.width = w;
  this.height = h;
  /**
   * Draws the image.
   */
  this.draw = function(ctx) {
    (ctx || context).drawImage(this.src, this.x, this.y, this.width, this.height);
  };
}

/**
 * A grid of objects (like a 2D {@link Collection}) for easy manipulation.
 *
 * Useful for rapidly initializing and managing large sets of same-sized
 * "tiles."
 *
 * @constructor
 *   Creates a new TileMap instance.
 *
 * @param {String/String[][]} grid
 *   `grid` represents the initial layout of the TileMap. If it is specified as
 *   a 2D Array of Strings, each inner value is used to construct a tile by
 *   using it as a key for the `map` parameter. If it is specified as a single
 *   String, that String is deconstructed into a 2D Array of Strings by
 *   splitting each row at newlines (`\n`) and assuming each character belongs
 *   in its own column. For example, this String:
 *
 *       "    A    \n
 *           BBB   \n
 *        BBBBBBBBB"
 *
 *   is equivalent to this Array:
 *
 *       [[' ', ' ', ' ', ' ', 'A', ' ', ' ', ' ', ' '],
 *        [' ', ' ', ' ', 'B', 'B', 'B', ' ', ' ', ' '],
 *        ['B', 'B', 'B', 'B', 'B', 'B', 'B', 'B', 'B']]
 *
 *   If `map` was specified as `{'A': Actor, 'B': Box}`, then this layout would
 *   correspond to an Actor standing on top of a small hill of Boxes.
 * @param {Object/Array} map
 *   An Array or object whose keys are found in the `grid` parameter and whose
 *   values are one of the following:
 *
 *   - null: Indicates a blank tile.
 *   - A String object: Assumed to be a path to an image file that should be
 *     used to render the tile.
 *   - An Image, HTMLImageElement, HTMLCanvasElement, {@link Sprite}, or
 *     {@link SpriteMap} object: An image used to render the tile.
 *   - {@link Box}, or a descendant of Box: Passing the literal class
 *     constructor (not an instance) will cause the TileMap to automatically
 *     initialize instances of that class.
 *
 *   This value is irrelevant if `options.gridSize` is specified since the
 *   entire TileMap is then created as a blank grid. In this case,
 *   `undefined`, `null`, or an empty array or object are acceptable values.
 * @param {Object} [options]
 *   A set of configuration settings for the TileMap.
 * @param {Number[]} [options.gridSize=null]
 *   Ignored if null. If this is a two-element Array containing positive
 *   integers, then the TileMap is initialized as a blank grid using these
 *   dimensions (col*row) and the `grid` and `map` parameters become
 *   irrelevant.
 * @param {Number[]} [options.cellSize]
 *   A two-element Array containing positive integers indicating the width and
 *   height in pixels of each tile. Defaults to the default dimensions of a
 *   Box.
 * @param {Number[]} [options.startCoords]
 *   A two-element Array containing positive integers indicating the x- and
 *   y-coordinates of the upper-left corner of the TileMap relative to the
 *   World. Defaults to placing the lower-left corner of the TileMap at the
 *   lower-left corner of the world.
 */
function TileMap(grid, map, options) {
  // Setup and options
  var i, j, l, m;
  this.options = {
      cellSize: [Box.prototype.DEFAULT_WIDTH, Box.prototype.DEFAULT_HEIGHT],
      gridSize: null,
      startCoords: options ? options.startCoords : undefined,
  };
  if (options && options.cellSize instanceof Array && options.cellSize.length > 1) {
    this.options.cellSize = options.cellSize;
  }
  if (options && options.gridSize instanceof Array && options.gridSize.length > 1) {
    this.options.gridSize = options.gridSize;
  }
  if (typeof map === 'undefined' || map === null) {
    map = [];
  }
  // Place the TileMap in the lower-left corner of the world.
  if (typeof this.options.startCoords === 'undefined' ||
      this.options.startCoords.length === 0) {
    this.options.startCoords = [0, world.height - this.options.cellSize[1] *
                                  (typeof grid == 'string' ? grid.split("\n") : grid).length
                                ];
  }
  var gs = this.options.gridSize,
      cw = this.options.cellSize[0],
      ch = this.options.cellSize[1],
      sx = this.options.startCoords[0],
      sy = this.options.startCoords[1];

  // If options.gridSize was specified, build a blank grid.
  if (gs instanceof Array && gs.length > 0) {
    grid = new Array(gs[0]);
    for (i = 0; i < gs[0]; i++) {
      grid[i] = new Array(gs[1]);
      for (j = 0; j < gs[1]; j++) {
        grid[i][j] = null;
      }
    }
  }
  // Allow specifying grid as a string; we'll deconstruct it into an array.
  if (typeof grid == 'string') {
    grid = grid.split("\n");
    for (i = 0, l = grid.length; i < l; i++) {
      grid[i] = grid[i].split('');
    }
  }
  this.grid = grid;
  // Make space mean null (blank) unless otherwise specified.
  if (typeof map !== 'undefined' && typeof map[' '] === 'undefined') {
    map[' '] = null;
  }

  // Initialize all the objects in the grid.
  for (i = 0, l = grid.length; i < l; i++) {
    for (j = 0, m = grid[i].length; j < m; j++) {
      // Avoid errors with map[] and allow writing null directly
      if (grid[i][j] === null) {
        this.grid[i][j] = null;
        continue;
      }
      var o = map ? map[grid[i][j]] : grid[i][j];
      // Blank tile or no match is found in map
      if (o === null || o === undefined) {
        this.grid[i][j] = null;
      }
      else {
        var x = sx + j * cw, y = sy + i * ch; // x- and y-coordinates of tile
        // We can handle any image type that context.drawImage() can draw
        if (typeof o === 'string' ||
            o instanceof Image ||
            o instanceof HTMLImageElement ||
            o instanceof HTMLCanvasElement ||
            o instanceof Sprite ||
            o instanceof SpriteMap ||
            o instanceof Layer) {
          this.grid[i][j] = new ImageWrapper(o, x, y, cw, ch);
        }
        // If we have a Class, initialize a new instance of it
        else if (o instanceof Function) {
          this.grid[i][j] = new (Function.prototype.bind.call(o, null, x, y, cw, ch))();
        }
        else { // fallback
          this.grid[i][j] = null;
        }
      }
    }
  }
  /**
   * Draw all the tiles.
   *
   * @param {CanvasRenderingContext2D} [ctx]
   *   A canvas graphics context onto which to draw the tiles. This is useful
   *   for drawing onto {@link Layer}s. If not specified, defaults to the
   *   {@link global#context global context} for the default canvas.
   * @param {Boolean} [occlude=false]
   *   Indicates whether to only draw tiles that are visible within the
   *   viewport (true) or to draw all tiles (false). Drawing only visible tiles
   *   is performance-friendly for huge TileMaps, but requires re-drawing the
   *   TileMap whenever the viewport scrolls. If you are just drawing the
   *   TileMap once, for example onto a background Layer cache, occluding is
   *   unnecessary.
   * @param {Boolean} [smooth]
   *   Indicates whether to force the Box to be drawn at whole-pixel
   *   coordinates. If you don't already know that your coordinates
   *   will be integers, this option can speed up painting since the browser
   *   does not have to interpolate the image. Defaults to whatever the default
   *   is for each object being drawn (the default for Boxes is true).
   */
  this.draw = function(ctx, occlude, smooth) {
    ctx = ctx || context;
    var i, l;
    if (occlude) {
      var active = this.getCellsInRect();
      for (i = 0, l = active.length; i < l; i++) {
        active[i].draw(ctx, smooth);
      }
      return;
    }
    for (i = 0, l = this.grid.length; i < l; i++) {
      for (var j = 0, m = this.grid[i].length; j < m; j++) {
        var o = this.grid[i][j];
        if (o !== null) {
          o.draw(ctx, smooth);
        }
      }
    }
    return this;
  };
  /**
   * Get the object at a specific tile using the row and column.
   *
   * @param {Number} row The row of the tile being retrieved.
   * @param {Number} col The column of the tile being retrieved.
   * @return {Mixed} The object at the specified tile.
   */
  this.getCell = function(row, col) {
    return this.grid[row] ? this.grid[row][col] : undefined;
  };
  /**
   * Place a specific object into a specific tile using the row and column.
   *
   * If an object is already located there, it will be overwritten.
   *
   * Note that placing an object into a specific cell does not adjust its
   * position, but rather merely stores it in the TileMap. If you want an
   * object to appear at a specific position relative to other tiles, you need
   * to place it there yourself.
   *
   * @param {Number} row The row of the tile being set.
   * @param {Number} col The column of the tile being set.
   * @param {Object} obj The object to place at the specified tile.
   */
  this.setCell = function(row, col, obj) {
    if (this.grid[row] && typeof this.grid[row][col] !== 'undefined') {
      this.grid[row][col] = obj;
    }
    return this;
  };
  /**
   * Clear a specific tile (make it blank).
   *
   * @param {Number} row The row of the tile being cleared.
   * @param {Number} col The column of the tile being cleared.
   */
  this.clearCell = function(row, col) {
    if (this.grid[row]) {
      this.grid[row][col] = null;
    }
    return this;
  };
  /**
   * Return an Array of all non-null objects in the TileMap.
   *
   * For large TileMaps, consider using TileMap#getCellsInRect() for
   * efficiency, since it only returns cells within a certain area (the
   * viewport by default).
   *
   * Note that if you just used a TileMap to easily initialize a bunch of
   * tiles, or if you're not adding or removing tiles frequently but you are
   * calling this function frequently, you can also convert your TileMap to a
   * {@link Collection}:
   *
   *     var myCollection = new Collection(myTileMap.getAll());
   *
   * This is more efficient if you always need to process every item in the
   * TileMap and you don't care about their relative position.
   */
  this.getAll = function() {
    var w = this.grid.length, h = (w > 0 ? this.grid[0].length : 0), r = [], i, j;
    for (i = 0; i < w; i++) {
      for (j = 0; j < h; j++) {
        if (this.grid[i][j] !== null) {
          r.push(this.grid[i][j]);
        }
      }
    }
    return r;
  };
  /**
   * Clear all tiles (make them blank).
   */
  this.clearAll = function() {
    var w = this.grid.length, h = (w > 0 ? this.grid[0].length : 0), i, j;
    this.grid = new Array(w);
    for (i = 0; i < w; i++) {
      this.grid[i] = new Array(h);
      for (j = 0; j < h; j++) {
        grid[i][j] = null;
      }
    }
    return this;
  };
  /**
   * Get the number of rows in the grid.
   *
   * See also TileMap#getCols().
   */
  this.getRows = function() {
    return this.grid.length;
  };
  /**
   * Get the number of columns in the grid.
   *
   * See also TileMap#getRows().
   */
  this.getCols = function() {
    return this.grid.length > 0 ? this.grid[0].length : 0;
  };
  /**
   * Execute a function on every element in the TileMap.
   *
   * @param {Function} f
   *   The function to execute on each tile.
   * @param {Mixed} f.obj
   *   The object being processed.
   * @param {Number} f.row
   *   The row of the tile being processed. This lets the function use
   *   TileMap#getCell() if it needs to check surrounding cells.
   * @param {Number} f.col
   *   The column of the tile being processed. This lets the function use
   *   TileMap#getCell() if it needs to check surrounding cells.
   * @param {Boolean} f.return
   *   If the return value is truthy, the object being processed will be
   *   removed from the TileMap. If it has a destroy() method, that method will
   *   be called.
   * @param {Boolean} [includeNull=false]
   *   Indicates whether to execute the function on null (blank) tiles.
   */
  this.forEach = function(f, includeNull) {
    var w = this.grid.length, h = (w > 0 ? this.grid[0].length : 0), i, j;
    for (i = 0; i < w; i++) {
      for (j = 0; j < h; j++) {
        if (this.grid[i][j] !== null || includeNull) {
          if (f(this.grid[i][j], i, j)) {
            if (typeof this.grid[i][j].destroy == 'function') {
              this.grid[i][j].destroy();
            }
            this.clearCell(i, j);
          }
        }
      }
    }
    return this;
  };
  /**
   * Get the max and min array coordinates of cells that are in a rectangle.
   *
   * wx and wy are the x- and y-coordinates in pixels of the upper-left corner
   * of the rectangle to retrieve, respectively. tw and th are the width and
   * height in pixels of the rectangle, respectively. This function returns an
   * Array containing the starting column, starting row, ending column, and
   * ending row of the TileMap grid that fall within the specified pixel
   * rectangle. These values may be outside of the actual bounds of the TileMap
   * grid. This function is only called *internally* (from
   * TileMap#getCellsInRect(), which restricts the returned values to the
   * bounds of the TileMap grid).
   *
   * @ignore
   */
  this._getCellCoordsInRect = function(wx, wy, tw, th) {
    if (typeof wx === 'undefined') wx = world.xOffset;
    if (typeof wy === 'undefined') wy = world.yOffset;
    if (typeof tw === 'undefined') tw = canvas.width;
    if (typeof th === 'undefined') th = canvas.height;
    var x = this.options.startCoords[0], y = this.options.startCoords[1];
    var cw = this.options.cellSize[0], cy = this.options.cellSize[1];
    var sx = (wx - x) / cw, sy = (wy - y) / cy;
    var sxe = (wx + tw - x) / cw, sye = (y - wy + th) / cy;
    // startCol, startRow, endCol, endRow
    return [Math.floor(sx), Math.floor(sy), Math.ceil(sxe), Math.ceil(sye)];
  };
  /**
   * Return all objects within a given rectangle.
   *
   * This method returns an array of all non-null objects in the TileMap within
   * a rectangle specified in pixels. If no rectangle is specified, this method
   * defaults to retrieving all objects in view (i.e. it uses the viewport as
   * the rectangle).
   *
   * This is an efficient way to process only objects that are in view (or
   * nearly in view) which is useful for efficient processing of only relevant
   * information in a very large map.
   *
   * Use TileMap#getAll() to process every tile in a TileMap.
   *
   * @param {Number} [x]
   *   The x-coordinate in pixels of the upper-left corner of the rectangle
   *   to retrieve. Defaults to the upper-left corner of the viewport.
   * @param {Number} [y]
   *   The y-coordinate in pixels of the upper-left corner of the rectangle
   *   to retrieve. Defaults to the upper-left corner of the viewport.
   * @param {Number} [w]
   *   The width of the rectangle to retrieve. Defaults to the width of the
   *   viewport.
   * @param {Number} [h]
   *   The height of the rectangle to retrieve. Defaults to the height of the
   *   viewport.
   *
   * @return {Array}
   *   All non-null objects in the TileMap within the specified rectangle.
   */
  this.getCellsInRect = function(x, y, w, h) {
    // startCol, startRow, endCol, endRow
    var r = this._getCellCoordsInRect(x, y, w, h), s = [];
    var startRow = Math.min(this.getRows(), Math.max(0, r[1]));
    var endRow = Math.min(this.getRows(), Math.max(0, r[3]));
    var startCol = Math.min(this.getCols(), Math.max(0, r[0]));
    var endCol = Math.min(this.getCols(), Math.max(0, r[2]));
    for (var i = startRow, l = endRow; i < l; i++) {
      for (var j = startCol, m = endCol; j < m; j++) {
        if (this.grid[i][j] !== null) {
          s.push(this.grid[i][j]);
        }
      }
    }
    return s;
  };
  /**
   * Return the cell coordinates of a pixel location.
   *
   * @param {Number} x
   *   The x-coordinate in pixels.
   * @param {Number} y
   *   The y-coordinate in pixels.
   *
   * @return {Object}
   *   An object with `row` and `col` attributes containing the row and column
   *   number of the cell containing the specified coordinates. Rows and
   *   columns are zero-indexed and the returned value can be outside of the
   *   TileMap.
   */
  this.getCellCoords = function(x, y) {
    return {
      row: Math.round((y - this.options.startCoords[1])/this.options.cellSize[1]),
      col: Math.round((x - this.options.startCoords[0])/this.options.cellSize[0]),
    };
  };
  /**
   * Return the pixel coordinates of a cell location.
   *
   * @param {Number} col
   *   The column number (zero-indexed).
   * @param {Number} row
   *   The row number (zero-indexed).
   *
   * @return {Object}
   *   An object with `x` and `y` attributes containing the pixel values of the
   *   upper-left corner of the cell at the specified row and column. The
   *   returned value can be outside of the TileMap.
   */
  this.getPixelCoords = function(col, row) {
    return {
      x: this.options.startCoords[0]+this.options.cellSize[0]*col,
      y: this.options.startCoords[1]+this.options.cellSize[1]*row,
    };
  };
}
