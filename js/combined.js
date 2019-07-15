/**
 * HTML5 Canvas Game Boilerplate 2.2.1-14072019
 * Certain components copyright their respective authors.
 *
 * @author Isaac Sukin (http://www.isaacsukin.com/)
 * @license [object Object] License
 * @ignore
 */

/**
 * jQuery Hotkeys Plugin
 *
 * Dual licensed under the MIT or GPLv2 licenses.
 *
 * The full project and documentation are available at
 * https://github.com/IceCreamYou/jquery.hotkeys
 *
 * Credits:
 * - [Isaac Sukin](https://github.com/IceCreamYou) wrote this revision
 * - [John Resig](https://github.com/jeresig/jquery.hotkeys)
 * - [Tzury Bar Yochay](https://github.com/tzuryby/jquery.hotkeys)
 * - [Binny V A](http://www.openjs.com/scripts/events/keyboard_shortcuts/)
 * - [kwillia](https://github.com/jeresig/jquery.hotkeys/pull/4/files)
 * - [kevingorski](https://github.com/jeresig/jquery.hotkeys/pull/2/files)
 *
 * @ignore
 */
(function(jQuery){
  /**
   * @class jQuery.hotkeys
   *   Provides easy, human-friendly handling for keyboard input.
   *
   * USAGE:
   *
   * - Bind the `keydown`, `keypress`, or `keyup` events to an element:
   *
   *       $(selector).keypress('ctrl+a down', function(event) {});
   *       // OR
   *       $(selector).on('keypress', 'ctrl+a down', function(event) {});
   *
   *   Separate key combinations that should trigger the callback with spaces.
   *   In the examples above, the callback would fire if `ctrl+a` or `down` was
   *   pressed. In the event callback, `event.keyPressed` holds the combination
   *   that actually triggered the callback.
   *
   * - You can specify keys in combination with the control keys: `alt`,
   *   `ctrl`, `meta`, and `shift`. If you use multiple control keys in a
   *   combination, specify them in alphabetical order.
   *
   * - Instead of binding to key events, you can also just call
   *   `jQuery.hotkeys.areKeysDown()` to determine whether a set of keys is
   *   currently being pressed, or examine the list of currently pressed keys
   *   yourself in `jQuery.hotkeys.keysDown`. This is useful if you want to
   *   bind to key events for all keys since `event.keyPressed` does not exist
   *   in this scenario:
   *
   *       $(selector).keypress(function(event) {});
   *
   * - If you only care about keys that were pressed (and released) instead of
   *   which keys are being held down, you can call
   *   `jQuery.hotkeys.lastKeyPressed()` or examine the last 5 keys pressed in
   *   `jQuery.hotkeys.lastKeysPressed`.
   *
   * Hotkeys aren't tracked if you're inside of an input element (unless you
   * explicitly bind the hotkey directly to the input). This helps avoid
   * conflicts with normal user typing.
   *
   * NOTE: Firefox is the only major browser that will reliably let you override
   * all key shortcuts built into the browser. This won't be a problem for most
   * applications, but you should avoid binding to combinations like ctrl+Q and
   * alt+F4 because most browsers will still react to those by closing the
   * window.
   */
  jQuery.hotkeys = {
    version: "0.9",

    // Keys currently held down
    keysDown: [],

    // The last 5 keys pressed and released (most recent key at the end)
    lastKeysPressed: [],

    // HTML elements that support text input
    textTypes: [
      'text', 'search', 'tel', 'url', 'email', 'password', 'number', 'range',
      'date', 'month', 'week', 'time', 'datetime', 'datetime-local', 'color'
    ],

    // Charcodes for when String.fromCharCode() doesn't work
    specialKeys: {
      8: "backspace", 9: "tab", 10: "return", 13: "return", 16: "shift",
      17: "ctrl", 18: "alt", 19: "pause", 20: "capslock", 27: "esc",
      32: "space", 33: "pageup", 34: "pagedown", 35: "end", 36: "home",
      37: "left", 38: "up", 39: "right", 40: "down", 45: "insert", 46: "del",
      59: ";", 96: "0", 97: "1", 98: "2", 99: "3", 100: "4", 101: "5",
      102: "6", 103: "7", 104: "8", 105: "9", 106: "*", 107: "+", 109: "-",
      110: ".", 111 : "/", 112: "f1", 113: "f2", 114: "f3", 115: "f4",
      116: "f5", 117: "f6", 118: "f7", 119: "f8", 120: "f9", 121: "f10",
      122: "f11", 123: "f12", 144: "numlock", 145: "scroll", 186: ";",
      187: "=", 188: ",", 189: "-", 190: ".", 191: "/", 219: "[", 220: "\\",
      221: "]", 222: "'", 224: "meta"
    },

    // Map of characters to the character they upshift to
    shiftNums: {
      "`": "~", "1": "!", "2": "@", "3": "#", "4": "$", "5": "%", "6": "^",
      "7": "&", "8": "*", "9": "(", "0": ")", "-": "_", "=": "+", ";": ":",
      "'": "\"", ",": "<", ".": ">",  "/": "?",  "\\": "|", "[": "{", "]": "}"
    },

    /**
     * Tests whether a set of keys is currently pressed down.
     *
     * If no control key (alt, ctrl, meta, shift) is currently held down,
     * the specified keys will match in any order. Otherwise, they have to
     * match in the given order.
     *
     * @param {Array/String} keyArray
     *   An Array or string of keys to check. If an Array is passed, this
     *   method tests whether *all* the keys in the array are currently held
     *   down *and* whether any keys are held down that are not in the array.
     *   If a String is passed, combinations of characters should be connected
     *   with + signs and separated with spaces. Each combination will be
     *   checked and this function will return true if any of the combinations
     *   matches. For example, the string "up down left+right" will return true
     *   if either the up arrow key, the down arrow key, or both the left and
     *   right arrow keys are currently pressed.
     *
     *   NOTE: Instead of writing shift-key characters like "@", write
     *   "shift+2". This avoids ambiguity and makes it less likely that
     *   invalid character sequences could be specified.
     *
     * @return {Boolean}
     *   true if the given keys match the set of keys currently pressed
     *   down; false otherwise.
     */
    areKeysDown: function(keyArray) {
      var i;
      // If the parameter is a string, split it apart and check each combination.
      if (typeof keyArray == 'string') {
        var choices = keyArray.split(' ');
        for (i = 0; i < choices.length; i++) {
          if (this.areKeysDown(choices[i].split('+'))) {
            return true;
          }
        }
        return false;
      }
      var foundControlKey = false, l = this.keysDown.length;
      // The combinations won't match if they aren't the same length.
      if (l != keyArray.length) {
        return false;
      }
      // Check for control keys so we know whether order matters.
      for (i = 0; i < l; i++) {
        if (jQuery.inArray(this.keysDown[i], ['alt', 'ctrl', 'meta', 'shift']) > -1) {
          foundControlKey = true;
          break;
        }
      }
      if (foundControlKey) {
        // Compare keyArray with $.hotkeys.keysDown, order doesn't matter
        for (i = 0; i < l; i++) {
          if (jQuery.inArray(this.keysDown[i], keyArray) == -1) {
            return false;
          }
        }
      }
      else {
        // Compare keyArray with $.hotkeys.keysDown, order matters
        for (i = 0; i < l; i++) {
          if (this.keysDown[i] != keyArray[i]) {
            return false;
          }
        }
      }
      return true;
    },

    /**
     * Return the last key pressed.
     */
    lastKeyPressed: function() {
      return this.lastKeysPressed[this.lastKeysPressed.length-1];
    }
  };

  // Respond to bound keyboard events.
  function keyHandler(handleObj) {
    // Only care when a possible input has been specified
    if (typeof handleObj.data !== "string") {
      return;
    }

    var origHandler = handleObj.handler,
        keys = handleObj.data.toLowerCase().split(" ");

    handleObj.handler = function(event) {
      // Don't fire in text-accepting inputs that we didn't directly bind to
      if (this !== event.target && (/textarea|select/i.test(event.target.nodeName) ||
          jQuery.inArray(event.target.type, jQuery.hotkeys.textTypes) > -1)) {
        return;
      }

      // Keypress represents characters, not special keys
      var special = event.type !== "keypress" && jQuery.hotkeys.specialKeys[event.which],
          character = String.fromCharCode(event.which).toLowerCase(),
          modif = "", possible = {};

      // Check combinations (alt|ctrl|command|shift+anything)
      if (event.altKey && special !== "alt") {
        modif += "alt+";
      }

      if (event.ctrlKey && special !== "ctrl") {
        modif += "ctrl+";
      }

      if (event.metaKey && !event.ctrlKey && special !== "meta") {
        modif += "meta+";
      }

      if (event.shiftKey && special !== "shift") {
        modif += "shift+";
      }

      if (special) {
        possible[modif + special] = true;
      }
      else {
        possible[modif + character] = true;
        possible[modif + jQuery.hotkeys.shiftNums[character]] = true;

        // "$" can be triggered as "Shift+4" or "Shift+$" or just "$"
        if (modif === "shift+") {
          possible[jQuery.hotkeys.shiftNums[character]] = true;
        }
      }

      // Record which keys are down
      var i, keyPressed;
      if (event.type === "keydown") {
        keyPressed = special || character;
        i = jQuery.inArray(keyPressed, jQuery.hotkeys.keysDown);
        if (i === undefined || i < 0) {
          jQuery.hotkeys.keysDown.push(keyPressed);
        }
      }
      // Release keys
      else if (event.type === "keyup") {
        keyPressed = special || character;
        i = jQuery.inArray(keyPressed, jQuery.hotkeys.keysDown);
        if (i !== undefined && i > -1) {
          jQuery.hotkeys.keysDown.splice(i, 1);
        }
        jQuery.hotkeys.lastKeysPressed.push(keyPressed);
        if (jQuery.hotkeys.lastKeysPressed.length > 5) {
          jQuery.hotkeys.lastKeysPressed.shift();
        }
      }

      for (i = 0, l = keys.length; i < l; i++) {
        if (possible[keys[i]]) {
          event.keyPressed = keys[i]; // note which key combination was actually pressed
          return origHandler.apply(this, arguments);
        }
      }
    };
  }

  // Intercept keyboard events
  jQuery.each(["keydown", "keyup", "keypress"], function() {
    jQuery.event.special[this] = { add: keyHandler };
  });

  // Listen to every keydown/keyup event so we can record them.
  jQuery(document).keydown('na', function() {});
  jQuery(document).keyup('na', function() {});

})(this.jQuery);

/**
 * Simple JavaScript Inheritance
 * By [John Resig](http://ejohn.org/)
 * MIT Licensed.
 * @ignore
 */
// Inspired by base2 and Prototype
(function() {
  var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;

  /**
   * @class Class
   *   The base Class implementation (does nothing).
   *
   * This is [John Resig's "simple JavaScript inheritance" library](http://ejohn.org/blog/simple-javascript-inheritance/).
   *
   * Define a new class with Class#extend:
   *
   *      var MyClass = Class.extend({
   *        // This is the constructor.
   *        init: function() {
   *          // this._super is the parent object's method.
   *          this._super.apply(this, arguments);
   *        },
   *        // This is a custom method.
   *        myMethod: function() {
   *          alert('hi');
   *        },
   *      });
   *      var myInstance = new MyClass();
   *      alert(myInstance instanceof MyClass); // true
   *      var MyChildClass = MyClass.extend({
   *        // Overrides the parent method.
   *        myMethod: function() {
   *          alert('hi there');
   *        },
   *      });
   *      var myChild = new MyChildClass();
   *      alert(myChild instanceof MyChildClass && myChild instanceof myClass); // true
   *      myChild.myMethod(); // hi there
   */
  this.Class = function() {};
 
  /**
   * Create a new Class that inherits from this class.
   */
  Class.extend = function(prop) {
    var _super = this.prototype;
   
    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    initializing = true;
    var prototype = new this();
    initializing = false;
   
    // Copy the properties over onto the new prototype
    for (var name in prop) {
      // Check if we're overwriting an existing function
      prototype[name] = typeof prop[name] == "function" &&
        typeof _super[name] == "function" && fnTest.test(prop[name]) ?
        (function(name, fn){
          return function() {
            var tmp = this._super;
           
            // Add a new ._super() method that is the same method
            // but on the super-class
            this._super = _super[name];
           
            // The method only need to be bound temporarily, so we
            // remove it when we're done executing
            var ret = fn.apply(this, arguments);       
            this._super = tmp;
           
            return ret;
          };
        })(name, prop[name]) :
        prop[name];
    }
   
    // The dummy class constructor
    function Class() {
      // All construction is actually done in the init method
      if ( !initializing && this.init )
        this.init.apply(this, arguments);
    }
   
    // Populate our constructed prototype object
    Class.prototype = prototype;
   
    // Enforce the constructor to be what we expect
    Class.prototype.constructor = Class;

    // And make this class extendable
    Class.extend = arguments.callee;
   
    return Class;
  };
})();

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

/**
 * Provides utilities to draw onto the canvas.
 *
 * @ignore
 */

// LAYER ----------------------------------------------------------------------

/**
 * The Layer object (basically a new, utility canvas).
 *
 * Layers allow efficient rendering of complex scenes by acting as caches for
 * parts of the scene that are grouped together. For example, it is recommended
 * to create a Layer for your canvas's background so that you can render the
 * background once and then draw the completely rendered background onto the
 * main canvas in each frame instead of re-computing the background for each
 * frame. This can significantly speed up animation.
 *
 * In general you should create a layer for any significant grouping of items
 * if that grouping moves together when animated. It is more memory-efficient
 * to specify a smaller layer size if possible; otherwise the layer will
 * default to the size of the whole canvas.
 *
 * Draw onto a Layer by using its "context" property, which is a
 * {@link CanvasRenderingContext2D canvas graphics context}.
 *
 * @param {Object} [options]
 *   A set of options.
 * @param {Number} [options.x=0]
 *   The x-coordinate of the top-left corner of the Layer.
 * @param {Number} [options.y=0]
 *   The y-coordinate of the top-left corner of the Layer.
 * @param {Number} [options.width]
 *   The width of the Layer.
 * @param {Number} [options.height]
 *   The height of the Layer.
 * @param {"world"/"canvas"} [options.relative="world"]
 *   Indicates what to draw the Layer relative to:
 *
 *   - 'world': Draw the layer relative to the world so that it will appear
 *     to be in one specific place as the player or viewport moves.
 *   - 'canvas': Draw the layer relative to the canvas so that it stays fixed
 *     as the player moves. This is useful for a HUD, for example.
 *
 *   This option is irrelevant if the world is the same size as the canvas.
 * @param {Number} [options.opacity=1]
 *   A fractional percentage [0, 1] indicating the opacity of the Layer.
 *   0 (zero) means fully transparent; 1 means fully opaque. This value is
 *   applied when {@link Layer#draw drawing} the layer.
 * @param {Number} [options.parallax=1]
 *   A fractional percentage indicating how much to {@link Layer#scroll scroll}
 *   the Layer relative to the viewport's movement.
 * @param {Mixed} [options.src]
 *   Anything that can be passed to the `src` parameter of
 *   {@link CanvasRenderingContext2D#drawImage drawImage()}. This will be used
 *   to draw an image stretched over the whole Layer as a convenience.
 * @param {HTMLElement} [options.canvas]
 *   A Canvas element in which to hold the Layer. If not specified, a new,
 *   invisible canvas is created. Careful; if width and height are specified,
 *   the canvas will be resized (and therefore cleared). This is mainly for
 *   internal use.
 */
function Layer(options) {
  options = options || {};
  /**
   * @property {HTMLElement} canvas
   *   The canvas backing the Layer.
   * @readonly
   */
  this.canvas = options.canvas || document.createElement('canvas');
  /**
   * @property {CanvasRenderingContext2D} context
   *   The Layer's graphics context. Use this to draw onto the Layer.
   * @readonly
   */
  this.context = this.canvas.getContext('2d');
  this.context.__layer = this;
  /**
   * @property {Number} width
   *   The width of the Layer.
   * @readonly
   */
  this.width = options.width || (options.canvas ? options.canvas.width : 0) || (options.relative == 'canvas' ? canvas.width : world.width);
  /**
   * @property {Number} height
   *   The height of the Layer.
   * @readonly
   */
  this.height = options.height || (options.canvas ? options.canvas.height : 0) || (options.relative == 'canvas' ? canvas.height : world.height);
  /**
   * @property {Number} x
   *   The x-coordinate on the {@link global#canvas global canvas} of the
   *   upper-left corner of the Layer.
   */
  this.x = options.x || 0;
  /**
   * @property {Number} y
   *   The y-coordinate on the {@link global#canvas global canvas} of the
   *   upper-left corner of the Layer.
   */
  this.y = options.y || 0;
  /**
   * @property {"world"/"canvas"} relative
   *   What to draw the Layer relative to.
   */
  this.relative = options.relative || 'world';
  /**
   * @property {Number} opacity
   *   A fractional percentage [0, 1] indicating the opacity of the Layer.
   *   0 (zero) means fully transparent; 1 means fully opaque. This value is
   *   applied when {@link Layer#draw drawing} the layer.
   */
  this.opacity = options.opacity || 1;
  /**
   * @property {Number} parallax
   *   A fractional percentage indicating how much to
   *   {@link Layer#scroll scroll} the Layer relative to the viewport's
   *   movement.
   */
  this.parallax = options.parallax || 1;
  if (this.canvas.width != this.width) {
    this.canvas.width = this.width;
  }
  if (this.canvas.height != this.height) {
    this.canvas.height = this.height;
  }
  /**
   * @property {Number} xOffset
   *   The horizontal distance in pixels that the Layer has
   *   {@link Layer#scroll scrolled}.
   */
  this.xOffset = 0;
  /**
   * @property {Number} yOffset
   *   The vertical distance in pixels that the Layer has
   *   {@link Layer#scroll scrolled}.
   */
  this.yOffset = 0;
  if (options.src) {
    this.context.drawImage(options.src, 0, 0, this.width, this.height);
  }
  /**
   * Draw the Layer.
   *
   * This method can be invoked in two ways:
   *
   * - `draw(x, y)`
   * - `draw(ctx, x, y)`
   *
   * All parameters are optional either way.
   *
   * @param {CanvasRenderingContext2D} [ctx]
   *   A canvas graphics context onto which this Layer should be drawn. This is
   *   useful for drawing onto other Layers. If not specified, defaults to the
   *   {@link global#context global context} for the default canvas.
   * @param {Number} [x]
   *   An x-coordinate on the canvas specifying where to draw the upper-left
   *   corner of the Layer. The actual position that the coordinate equates to
   *   depends on the value of the
   *   {@link Layer#relative Layer's "relative" property}. Defaults to the
   *   {@link Layer#x Layer's "x" property} (which defaults to 0 [zero]).
   * @param {Number} [y]
   *   A y-coordinate on the canvas specifying where to draw the upper-left
   *   corner of the Layer. The actual position that the coordinate equates to
   *   depends on the value of the
   *   {@link Layer#relative Layer's "relative" property}. Defaults to the
   *   {@link Layer#y Layer's "y" property} (which defaults to 0 [zero]).
   */
  this.draw = function(ctx, x, y) {
    if (!(ctx instanceof CanvasRenderingContext2D)) {
      y = x;
      x = ctx;
      ctx = context;
    }
    x = typeof x === 'undefined' ? this.x : x;
    y = typeof y === 'undefined' ? this.y : y;
    ctx.save();
    ctx.globalAlpha = this.opacity;
    if (this.relative == 'canvas') {
      ctx.translate(world.xOffset, world.yOffset);
    }
    if (this.xOffset || this.yOffset) {
      ctx.translate(this.xOffset, this.yOffset);
    }
    ctx.drawImage(this.canvas, x, y);
    ctx.restore();
    return this;
  };
  /**
   * Clear the layer, optionally by filling it with a given style.
   *
   * @param {Mixed} [fillStyle]
   *   A canvas graphics context fill style. If not passed, the Layer will
   *   simply be cleared. If passed, the Layer will be filled with the given
   *   style.
   */
  this.clear = function(fillStyle) {
    this.context.clear(fillStyle);
    return this;
  };
  /**
   * Scroll the Layer.
   *
   * @param {Number} x
   *   The horizontal distance the target has shifted.
   * @param {Number} y
   *   The vertical distance the target has shifted.
   * @param {Number} [p]
   *   The parallax factor. Defaults to {@link Layer#parallax this.parallax}.
   */
  this.scroll = function(x, y, p) {
    p = p || this.parallax;
    this.xOffset += -x*p;
    this.yOffset += -y*p;
    return this;
  };
  /**
   * Position the Layer's canvas over the primary canvas.
   *
   * This is an alternative to drawing the Layer directly onto the primary
   * canvas. It is mostly useful when the `relative` property is `"canvas"`.
   * It is also useful when the primary canvas is scaled with
   * World#scaleResolution but this Layer should stay a consistent size.
   * However, since it is literally in front of the primary canvas, any other
   * Layers that need to be drawn in front of this one must also be positioned
   * over the primary canvas instead of drawn directly onto it.
   *
   * @return {HTMLElement}
   *   A jQuery representation of a div containing the Layer's canvas.
   */
  this.positionOverCanvas = function() {
    var $d = jQuery('<div></div>');
    var o = $canvas.offset();
    $d.css({
      left: o.left,
      pointerEvents: 'none',
      position: 'absolute',
      top: o.top,
    });
    var $c = jQuery(this.canvas);
    $c.css({
      backgroundColor: 'transparent',
      margin: '0 auto',
      overflow: 'hidden',
      pointerEvents: 'none',
      position: 'absolute',
      'z-index': 50,
    });
    $d.append($c);
    jQuery('body').append($d);
    return $d;
  };
  /**
   * Display this Layer's canvas in an overlay (for debugging purposes).
   *
   * Clicking the overlay will remove it.
   *
   * @return {HTMLElement}
   *   A jQuery representation of a div containing the Layer's canvas.
   */
  this.showCanvasOverlay = function() {
    stopAnimating();
    var $d = jQuery('<div></div>');
    $d.css({
      cursor: 'pointer',
      display: 'block',
      height: '100%',
      left: 0,
      position: 'absolute',
      top: 0,
      width: '100%',
    });
    var $c = jQuery(this.canvas);
    $c.css({
      border: '1px solid black',
      display: 'block',
      margin: '0 auto',
      position: 'absolute',
      'z-index': 100,
    }).click(function() {
      $d.remove();
      startAnimating();
    });
    $d.append($c);
    jQuery('body').append($d);
    $d.click(function(e) {
      if (e.which != 3) { // Don't intercept right-click events
        $d.remove();
      }
    });
    return $d;
  };
}

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
 * Draw an image onto the canvas.
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
    x = sx;
    y = sy;
    if (typeof sw == 'number' && typeof sh !== 'undefined') {
      w = sw;
      h = sh;
    }
    sx = undefined;
    sy = undefined;
    sw = undefined;
    sh = undefined;
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
  var image;
  if ((typeof Sprite !== 'undefined' && src instanceof Sprite) ||
      (typeof SpriteMap !== 'undefined' && src instanceof SpriteMap)) { // draw a sprite
    src.draw(this, x, y, w, h);
    if (finished instanceof Function) {
      finished.call(t, a, true); // Sprite images are loaded on instantiation
    }
  }
  else if (typeof Layer !== 'undefined' && src instanceof Layer) { // Draw the Layer's canvas
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
    image = src;
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
    image = Caches.images[src];
    if (image.complete || (image.width && image.height)) { // Cached image is loaded
      _drawImage(image, x, y, w, h, sx, sy, sw, sh);
    }
    // If cached image is not loaded, bail; the finished callback will run
    // from the first time it was attempted to be drawn
  }
  else if (typeof src == 'string') { // uncached image path
    image = new Image();
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
 * Draw a pattern onto the canvas.
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
  if (typeof Layer !== 'undefined' && src instanceof Layer) { // Draw the Layer's canvas
    src = src.canvas;
  }
  var image;
  if (src instanceof CanvasPattern) { // draw an already-created pattern
    this.fillStyle = src;
    this.fillRect(x, y, w, h);
    if (finished instanceof Function) {
      finished.call(this, arguments, true);
    }
  }
  else if (typeof Layer !== 'undefined' && src instanceof Layer) { // Draw the Layer's canvas
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
    image = src;
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
      image = Caches.images[src];
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
      var that = this;
      image = new Image();
      image.onload = function() {
        Caches.imagePatterns[src] = this.createPattern(image, rpt);
        if (finished instanceof Function) {
          finished.call(that, arguments, false);
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
    squareSize = y;
    x = w;
    y = h;
    w = color1;
    h = color2;
    color1 = c1;
    color2 = c2;
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

/**
 * Handles events on canvas objects.
 *
 * Objects in a Canvas are not represented in the DOM, so they don't benefit
 * from the traditional JavaScript event model. This file provides a similar
 * replacement event system modeled on jQuery's DOM event wrappers so that you
 * don't have to worry about this problem.
 *
 * Bindings for the {@link Box} class are available for easier access to this
 * event system.
 *
 * @ignore
 */

(function() {

function _handlePointerBehavior() {
  if (typeof App.isHovered != 'function') {
    if (window.console && console.warn) {
      console.warn('Mouse event triggered, but App.isHovered does not exist.');
    }
    return false;
  }
  return App.isHovered(this);
}

var _listeners = {};

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
    if (!_listeners[eventName]) {
      _listeners[eventName] = [];
    }
    _listeners[eventName].push({
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
    if (eventName && _listeners[eventName]) {
      for (e = _listeners[eventName], i = e.length-1; i >= 0; i--) {
        if (e[i].object == obj && (!namespace || e[i].namespace == namespace)) {
          _listeners[eventName].splice(i, 1);
        }
      }
    }
    else if (!eventName && namespace) {
      for (eventName in _listeners) {
        if (_listeners.hasOwnProperty(eventName)) {
          for (e = _listeners[eventName], i = e.length-1; i >= 0; i--) {
            if (e[i].object == obj && e[i].namespace == namespace) {
              _listeners[eventName].splice(i, 1);
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
   *   Additional arguments to pass to the relevant callbacks. Usually the
   *   first argument is the event object.
   *
   * @static
   */
  trigger: function() {
    var eventName = Array.prototype.shift.call(arguments);
    var event = arguments[0];
    var e = _listeners[eventName]; // All listeners for this event
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
    mousedown: _handlePointerBehavior,
    /**
     * @event mouseup
     *   The mouseup event is sent to an object when the mouse pointer is over
     *   the object and the mouse button is released.
     * @param {Event} e The event object.
     * @member Box
     */
    mouseup: _handlePointerBehavior,
    /**
     * @event click
     *   The mouseup event is sent to an object when the mouse pointer is over
     *   the object and the mouse button is pressed and released.
     * @param {Event} e The event object.
     * @member Box
     */
    click: _handlePointerBehavior,
    /**
     * @event touchstart
     *   The touchstart event is sent to an object when the object is touched.
     * @param {Event} e The event object.
     * @member Box
     */
    touchstart: _handlePointerBehavior,
    /**
     * @event touchend
     *   The touchend event is sent to an object when a touch is released over
     *   the object.
     * @param {Event} e The event object.
     * @member Box
     */
    touchend: _handlePointerBehavior,
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

}).call(this);

/**
 * @class App.Storage
 *   Provides persistent local storage that preserves object type.
 *
 * Behavior is very similar to using localStorage directly except that it
 * supports storing any kind of object rather than just strings.
 *
 * Note that local storage does not work in some browsers on documents accessed
 * via the file:// protocol.
 */
App.Storage = (function(window, undefined) {
  var api = {enabled: true},
      namespace = '__appstore__',
      storage = window.localStorage,
      internal = {},
      fake = false;
  /**
   * Sets the value at key.
   *
   * If value is undefined, removes the value at key.
   *
   * @param {String} key
   *   The identifier for the value to set.
   * @param {Mixed} value
   *   The value to assign at the key.
   */
  api.set = function(key, value) {
    key = namespace + key;
    if (value === undefined) {
      return api.remove(key);
    }
    storage.setItem(key, JSON.stringify(value));
  };
  /**
   * Get the value stored at key.
   *
   * @param {String} key
   *   The identifier for the value to retrieve.
   * @param {Mixed} [defaultValue=undefined]
   *   If there is no value at key, this value is returned instead.
   *
   * @return {Mixed}
   *   The value stored at key if it exists, or defaultValue otherwise.
   */
  api.get = function(key, defaultValue) {
    key = namespace + key;
    try {
      var item = storage.getItem(key);
      // If it's a string, we probably put it there. Un-stringify it.
      if (typeof item === 'string') {
        return JSON.parse(item);
      }
      // Someone put something here.
      else if (item !== null) {
        return item;
      }
    } catch(e) {
      if (console && console.error) {
        console.error(e);
      }
    }
    // There is nothing at key or JSON.parse failed.
    return defaultValue;
  };
  /**
   * Removes the value at key.
   *
   * @param {String} key
   *   The identifier for the value to remove.
   */
  api.remove = function(key) {
    storage.removeItem(namespace + key);
  };
  /**
   * Removes all values from storage.
   */
  api.clear = function() {
    storage.clear();
  };
  /**
   * Returns the number of items in storage.
   *
   * @return {Number}
   *   The number of items in storage.
   */
  api.length = function() {
    if (fake) {
      return internal.length;
    }
    return storage.length;
  };
  /**
   * Returns the value at a numeric index.
   *
   * @param {Number} index
   *   The index at which to retrieve the value.
   *
   * @return {Mixed}
   *   The value at the specified numeric index.
   */
  api.key = function(index) {
    return storage.key(index);
  };
  /**
   * Indicates whether persistent storage is supported in this browser.
   *
   * If it is not supported, storage will only persist for the current session.
   *
   * @return {Boolean}
   *   A Boolean indicating whether persistent storage is supported in this
   *   browser.
   */
  api.isEnabled = function() {
    return api.enabled;
  };
  // Safari Private mode throws an error when localStorage is used.
  // Learned at https://github.com/marcuswestin/store.js
  try {
    api.set(namespace, namespace);
    if (api.get(namespace) != namespace) {
      api.enabled = false;
    }
    api.remove(namespace);
  } catch(e) {
    api.enabled = false;
  }
  // If localStorage is unavailable, fake it. No point falling back to anything
  // else; all we're going for here is avoiding breaking errors. Doing this
  // avoids having to check for App.Storage.enabled every time you want to
  // store something. If you wanted to be really comprehensive with local
  // storage you could use something like
  // [sticky.js](https://github.com/alexmng/sticky/blob/master/sticky-2.8.js).
  // However, localStorage is supported in every browser that supports enough
  // Canvas API operations to be useful, so that is all we need to support.
  if (!api.enabled) {
    storage = {
        setItem: function(key, value) {
          internal[key] = value;
        },
        getItem: function(key) {
          return internal[key];
        },
        removeItem: function(key) {
          delete internal[key];
        },
        clear: function() {
          internal = {};
        },
        key: function(index) {
          var i = 0;
          for (var k in internal) {
            if (internal.hasOwnProperty(k)) {
              if (i == index) {
                return internal[k];
              }
              i++;
            }
          }
        }
    };
  }
  return api;
})(window);

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
   * Returns the items in this Collection as an Array.
   *
   * @return {Array}
   *   The Array of items in this Collection.
   */
  getAll: function() {
    Array.prototype.slice.call(this);
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
    this.grid = grid;
  }
  // Allow specifying grid as a string; we'll deconstruct it into an array.
  else if (typeof grid === 'string') {
    grid = grid.split("\n");
    for (i = 0, l = grid.length; i < l; i++) {
      grid[i] = grid[i].split('');
    }
    this.grid = grid;
  }
  // If the provided grid is a 2D array, copy it before modifying it.
  else {
    l = grid.length;
    this.grid = new Array(l);
    for (i = 0; i < l; i++) {
      m = grid[i].length;
      this.grid[i] = new Array(m);
      for (j = 0; j < m; j++) {
        this.grid[i][j] = grid[i][j];
      }
    }
  }
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

/**
 * Defines useful classes for actors in the world.
 *
 * Specifically, this file holds the Box, Actor, and Player classes. These are
 * useful abstractions for practically any game-style environment.
 *
 * @ignore
 */

/**
 * A Box shape.
 *
 * Boxes have a position, size, and visual representation.
 *
 * @constructor
 *   Creates a new Box instance.
 *
 * @param {Number} [x]
 *   The x-coordinate of the top-left corner of the Box. Defaults to the center
 *   of the world.
 * @param {Number} [y]
 *   The y-coordinate of the top-left corner of the Box. Defaults to the center
 *   of the world.
 * @param {Number} [w]
 *   The width of the Box. Defaults to
 *   {@link Box#DEFAULT_WIDTH Box.prototype.DEFAULT_WIDTH}.
 * @param {Number} [h]
 *   The height of the Box. Defaults to
 *   {@link Box#DEFAULT_HEIGHT Box.prototype.DEFAULT_HEIGHT}.
 * @param {Mixed} [fillStyle="black"]
 *   A default fillStyle to use when drawing the Box. Defaults to black.
 */
var Box = Class.extend({
  init: function(x, y, w, h, fillStyle) {
    /**
     * @property {Number} x
     *   The x-coordinate of the top-left corner of the Box.
     */
    this.x = typeof x !== 'undefined' ? x : Math.floor((world.width-this.DEFAULT_WIDTH)/2);
    /**
     * @property {Number} y
     *   The y-coordinate of the top-left corner of the Box.
     */
    this.y = typeof y !== 'undefined' ? y : Math.floor((world.height-this.DEFAULT_HEIGHT)/2);
    /**
     * @property {Number} width
     *   The width of the Box.
     */
    this.width = w || this.DEFAULT_WIDTH;
    /**
     * @property {Number} height
     *   The height of the Box.
     */
    this.height = h || this.DEFAULT_HEIGHT;
    /**
     * @property {String} fillStyle
     *   A fillStyle to use when drawing the Box if no `src` is specified.
     */
    this.fillStyle = fillStyle || 'black';
  },
  /**
   * The default width of a Box.
   */
  DEFAULT_WIDTH: 80,
  /**
   * The default height of a Box.
   */
  DEFAULT_HEIGHT: 80,
  /**
   * Something that can be drawn by {@link CanvasRenderingContext2D#drawImage}.
   *
   * If not set, a box will be drawn instead using the fillStyle.
   */
  src: null,
  /**
   * The angle (in radians) at which to draw the Box.
   */
  radians: 0,
  /**
   * Draw the Box.
   *
   * Draws the shape in Box#drawDefault() unless the Box#src property is set.
   *
   * Use Box#drawBoundingBox() to draw an outline of the Box.
   *
   * @param {CanvasRenderingContext2D} [ctx]
   *   A canvas graphics context onto which this Box should be drawn. This is
   *   useful for drawing onto {@link Layer}s. If not specified, defaults to
   *   the {@link global#context global context} for the default canvas.
   * @param {Boolean} [smooth=true]
   *   A boolean indicating whether to force the Box to be drawn at whole-pixel
   *   coordinates. If you don't already know that your coordinates will be
   *   integers, this option can speed up painting since the browser does not
   *   have to interpolate the image.
   */
  draw: function(ctx, smooth) {
    ctx = ctx || context;
    if (typeof smooth === 'undefined') {
      smooth = true;
    }
    ctx.save();
    ctx.fillStyle = this.fillStyle;
    var x = this.x, y = this.y, w = this.width, h = this.height;
    if (smooth) {
      x = Math.round(x);
      y = Math.round(y);
    }
    if (this.radians) {
      ctx.translate(x+w/2, y+h/2);
      ctx.rotate(this.radians);
      ctx.translate(-w/2-x, -h/2-y);
    }
    if (this.src) {
      ctx.drawImage(this.src, x, y, w, h);
    }
    else {
      this.drawDefault(ctx, x, y, w, h);
    }
    ctx.restore();
  },
  /**
   * {@link Box#draw Draw} the default shape when no image has been applied.
   *
   * This is useful to override for classes that have different standard
   * appearances, rather than overriding the whole Box#draw() method.
   *
   * @param {CanvasRenderingContext2D} ctx
   *   A canvas graphics context onto which this Box should be drawn.
   * @param {Number} x
   *   The x-coordinate of the upper-left corner of the Box.
   * @param {Number} y
   *   The y-coordinate of the upper-left corner of the Box.
   * @param {Number} w
   *   The width of the Box.
   * @param {Number} h
   *   The height of the Box.
   */
  drawDefault: function(ctx, x, y, w, h) {
    ctx.fillRect(x, y, w, h);
  },
  /**
   * Draw the outline of the Box used to calculate collision.
   *
   * To draw the Box itself, use Box#draw().
   *
   * @param {CanvasRenderingContext2D} [ctx]
   *   A canvas graphics context onto which the outline should be drawn. This
   *   is useful for drawing onto {@link Layer}s. If not specified, defaults to
   *   the {@link global#context global context} for the default canvas.
   * @param {Mixed} [strokeStyle]
   *   A style to use for the box outline.
   */
  drawBoundingBox: function(ctx, strokeStyle) {
    ctx = ctx || context;
    if (strokeStyle) {
      ctx.strokeStyle = strokeStyle;
    }
    ctx.strokeRect(this.x, this.y, this.width, this.height);
  },
  /**
   * Get the x-coordinate of the center of the Box.
   *
   * See also Box#yC()
   */
  xC: function() {
    return this.x + this.width/2;
  },
  /**
   * Get the y-coordinate of the center of the Box.
   *
   * See also Box#xC()
   */
  yC: function() {
    return this.y + this.height/2;
  },
  /**
   * Determine whether this Box overlaps with another Box or set of Boxes.
   *
   * The main difference between Box#collides() and Box#overlaps() is that
   * Box#overlaps() only checks against a single Box and returns a Boolean
   * indicating whether there is overlap, whereas Box#collides() can check
   * against many Boxes and returns the first item to overlap (if any).
   *
   * The collision checking here uses AABB detection, meaning it uses upright
   * rectangles. It is accurate, but not as fast as it could be if there are
   * many objects to check against. If you need faster collision checking
   * against many objects and you're willing to do it manually, consider
   * implementing
   * [spatial partitioning](http://buildnewgames.com/broad-phase-collision-detection/).
   * If you need different collision models (for example with rotated
   * rectangles or different shapes) or if you need more advanced physics
   * simulation (for example to model springs) consider using the
   * [Box2D library](https://github.com/kripken/box2d.js/).
   *
   * @param {Box/Box[]/Collection/TileMap} collideWith
   *   A Box, Collection or Array of Boxes, or TileMap with which to check for
   *   overlap.
   * @param {Boolean} [returnAll=false]
   *   If this method is passed a Collection or TileMap, whether to return all
   *   items in the group that collide (true) or just the first one (false).
   * @param {Boolean} [collideWithSelf=false]
   *   Whether the Box should be considered to collide with itself.
   *
   * @return {Box/Box[]/Boolean}
   *   false if there is no overlap; otherwise, the first item to overlap, or
   *   an array of overlapping items if returnAll is true and collideWith is
   *   a Collection or TileMap.
   */
  collides: function(collideWith, returnAll, collideWithSelf) {
    if (collideWith instanceof Box && (collideWith !== this || !collideWithSelf)) {
      return this.overlaps(collideWith) ? collideWith : false;
    }
    var items = collideWith, found = [];
    if (typeof TileMap !== 'undefined' && collideWith instanceof TileMap) {
      items = collideWith.getAll();
    }
    for (var i = 0, l = items.length; i < l; i++) {
      if (this.overlaps(items[i]) && (items[i] !== this || !collideWithSelf)) {
        if (returnAll) {
          found.push(items[i]);
        }
        else {
          return items[i];
        }
      }
    }
    if (found.length) {
      return found;
    }
    return false;
  },
  /**
   * Determine whether this Box intersects another Box.
   *
   * See Box#collides() for a discussion of the difference.
   *
   * See Box#overlapsX() and Box#overlapsY() for the actual calculations.
   *
   * @param {Box} otherBox The other Box with which to check for collision.
   */
  overlaps: function(otherBox) {
    return this.overlapsX(otherBox) && this.overlapsY(otherBox);
  },
  /**
   * Determine whether this Box intersects another Box on the x-axis.
   *
   * See also Box#overlaps() and Box#overlapsY()
   *
   * @param {Box} otherBox The other Box with which to check for collision.
   */
  overlapsX: function(otherBox) {
    return this.x + this.width > otherBox.x && otherBox.x + otherBox.width > this.x;
  },
  /**
   * Determine whether this Box intersects another Box on the y-axis.
   *
   * See also Box#overlaps() and Box#overlapsX()
   *
   * @param {Box} otherBox The other Box with which to check for collision.
   */
  overlapsY: function(otherBox) {
    return this.y + this.height > otherBox.y && otherBox.y + otherBox.height > this.y;
  },
  /**
   * Determine whether the mouse is hovering over this Box.
   */
  isHovered: function() {
    if (typeof App.isHovered != 'function') {
      if (window.console && console.warn) {
        console.warn('Box#isHovered called, but App.isHovered does not exist.');
      }
      return false;
    }
    return App.isHovered(this);
  },
  /**
   * Listen for a specific event.
   *
   * To only run the callback the first time the event is triggered on this
   * Box, see Box#once(). To remove a callback, see Box#unlisten().
   *
   * @param {String} eventName
   *   The name of the event for which to listen, e.g. "click." The event can
   *   have a namespace using a dot, e.g. "click.custom" will bind to the
   *   "click" event with the "custom" namespace. Namespaces are useful for
   *   unlisten()ing to specific callbacks assigned to that namespace or for
   *   unlisten()ing to callbacks bound to a namespace across multiple events.
   * @param {Function} callback
   *   A function to execute when the relevant event is triggered on the
   *   listening object. The function's `this` object is the listening Box
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
   */
  listen: function(eventName, callback, weight) {
    if (App.Events) {
      App.Events.listen(this, eventName, callback, weight);
    }
    else if (window.console && console.warn) {
      console.warn('Box#listen called, but App.Events does not exist.');
    }
    return this;
  },
  /**
   * Listen for a specific event and only react the first time it is triggered.
   *
   * This method is exactly the same as Box#listen() except that the specified
   * callback is only executed the first time it is triggered. To remove a
   * callback, see Box#unlisten().
   *
   * @param {String} eventName
   *   The name of the event for which to listen, e.g. "click." The event can
   *   have a namespace using a dot, e.g. "click.custom" will bind to the
   *   "click" event with the "custom" namespace. Namespaces are useful for
   *   unlisten()ing to specific callbacks assigned to that namespace or for
   *   unlisten()ing to callbacks bound to a namespace across multiple events.
   * @param {Function} callback
   *   A function to execute when the relevant event is triggered on the
   *   listening object. The function's `this` object is the listening Box
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
   */
  once: function(eventName, callback, weight) {
    if (App.Events) {
      App.Events.once(this, eventName, callback, weight);
    }
    else if (window.console && console.warn) {
      console.warn('Box#once called, but App.Events does not exist.');
    }
    return this;
  },
  /**
   * Stop listening for a specific event.
   *
   * To listen for an event, use Box#listen() or Box#once().
   *
   * @param {String} eventName
   *   The name of the event for which to listen, e.g. "click." The event can
   *   have a namespace using a dot, e.g. "click.custom" will unbind obj's
   *   listeners for the "click" that are using the "custom" namespace. You can
   *   also unlisten to multiple events using the same namespace, e.g.
   *   ".custom" could unlisten to "mousemove.custom" and "touchmove.custom."
   *   If the event specified does not have a namespace, all callbacks will be
   *   unbound regardless of their namespace.
   */
  unlisten: function(eventName) {
    if (App.Events) {
      App.Events.unlisten(this, eventName);
    }
    else if (window.console && console.warn) {
      console.warn('Box#unlisten called, but App.Events does not exist.');
    }
    return this;
  },
  /**
   * Destroy the Box.
   *
   * By default, this method does nothing. Override this method to trigger an
   * event when the object is destroyed. For example, this could allow
   * displaying an explosion when a bullet hits a target.
   *
   * This method can also be used to release memory allocated when the Box is
   * initialized, though by default, only Players need to be destroy()ed to
   * release memory (specifically this releases keyboard control).
   */
  destroy: function() {},

  /**
   * @method stoodOn
   *
   * Invoked on solids every frame when an Actor is standing on them and
   * Actor#GRAVITY is enabled. This is useful for changing Actor behavior
   * depending on the surface. Example applications include making a surface
   * slippery (by changing {@link Actor#DAMPING_FACTOR}), making it bouncy (by
   * adding upward velocity), or changing the Actor's speed. This can also be
   * used for special actions like making the Box move only when a Player is
   * standing on it.
   *
   * @param {Actor} stander
   *   The Actor that is standing on this Box.
   */
  stoodOn: null,
});

/**
 * Actors are {@link Box Boxes} that can move.
 *
 * @extends Box
 */
var Actor = Box.extend({

  /**
   * The velocity the Actor can move in pixels per second.
   */
  MOVEAMOUNT: 400,

  /**
   * Whether gravity (downward acceleration) is enabled.
   *
   * This is effectively a toggle between a top-down and side view.
   */
  GRAVITY: false,

  /**
   * Gravitational acceleration in pixels per second-squared.
   *
   * Has no effect if GRAVITY is false. Setting to 0 (zero) has a similar
   * physical effect to disabling gravity.
   */
  G_CONST: 21,

  /**
   * Jump velocity (impulse) in pixels per second.
   *
   * Has no effect if GRAVITY is false. Set to 0 (zero) to disable jumping.
   */
  JUMP_VEL: 500,

  /**
   * The minimum number of seconds required between jumps.
   *
   * Has no effect if GRAVITY is false or JUMP_VEL is 0 (zero).
   */
  JUMP_DELAY: 0.25,

  /**
   * Percent of normal horizontal velocity Actors can move while in the air.
   *
   * Note that if Actors are moving horizontally before jumping, they keep
   * moving at the same speed in the air; in this case air control only takes
   * effect if they switch direction mid-air. Otherwise, air control only
   * applies if they started moving horizontally after they entered the air.
   */
  AIR_CONTROL: 0.25,

  /**
   * Whether to require that the jump key is released before jumping again.
   *
   * Specifically, this is a boolean which, when true, restricts the Actor from
   * jumping after being in the air until after the Actor is on the ground with
   * the jump key released. This limits the ability to "bounce" by holding down
   * the jump key. This behavior depends on being notified of when keys are
   * released via the release() method, which happens automatically for
   * Players. If you enable this for standard Actors, the meaning of a "key
   * press" is artificial, so you must make sure to call release() before you
   * make the Actor jump again.
   */
  JUMP_RELEASE: false,

  /**
   * The number of times an Actor can jump without touching the ground.
   *
   * -1 allows the Actor to jump in the air an infinite number of times. A
   * value of zero is the same as a value of one (i.e. a value of zero will not
   * stop the Actor from having one jump).
   */
  MULTI_JUMP: 0,

  /**
   * Whether to make the Actor continue moving in the last direction specified.
   */
  CONTINUOUS_MOVEMENT: false,

  /**
   * Whether the Actor will be restricted to not move outside the world.
   */
  STAY_IN_WORLD: true,

  /**
   * The fractional velocity damping factor.
   *
   * If set, this affects whether the Actor can turn on a dime or how much it
   * slides around. Higher means more movement control (less sliding).
   *
   * If you want specific surfaces to feel slippery, set this when the Actor
   * moves onto and off of those surfaces. One way to do this is using the
   * {@link Box#stoodOn stoodOn() method}.
   *
   * Numeric values are interpreted as damping factors. If this is null, full
   * damping is applied (the Actor stops and turns on a dime).
   *
   * Damping does not affect vertical movement when gravity is enabled.
   */
  DAMPING_FACTOR: null,

  /**
   * The last direction (key press) that resulted in looking in a direction.
   *
   * If GRAVITY is enabled, this Array will only contain left or right keys.
   * This is because left/right+up/down is a valid direction but does not
   * result in looking diagonally.
   */
  lastLooked: [],

  /**
   * Whether the Actor is being mouse-dragged.
   * @readonly
   */
  isBeingDragged: false,

  /**
   * An Array of target Boxes onto which this Actor can be dropped.
   *
   * You must call Actor#setDraggable(true) to enable dragging the Actor.
   *
   * Drop targets can change how they look when a draggable object is hovered
   * over them by testing `this.isHovered() && App.isSomethingBeingDragged` in
   * their {@link Box#draw draw()} methods. They can change how they look or
   * perform some action when a draggable object is dropped onto them by
   * listening for the {@link Box#event-canvasdrop canvasdrop event}.
   */
  dropTargets: [],

  /**
   * The horizontal component of the velocity.
   *
   * Use Actor#getVelocityVector() if you want to get velocity as a vector.
   */
  xVelocity: 0,

  /**
   * The vertical component of the velocity.
   *
   * Use Actor#getVelocityVector() if you want to get velocity as a vector.
   */
  yVelocity: 0,

  /**
   * The horizontal component of the acceleration.
   *
   * Use Actor#getAccelerationVector() if you want to get acceleration as a
   * vector.
   */
  xAcceleration: 0,

  /**
   * The vertical component of the acceleration.
   *
   * Use Actor#getAccelerationVector() if you want to get acceleration as a
   * vector.
   */
  yAcceleration: 0,

  /**
   * Keys specific to this actor.
   *
   * Defaults to the global {@link global#keys keys} if not set (and uses the
   * same structure).
   *
   * See also Actor#processInput().
   */
  keys: undefined,

  // Used internally; not publicly documented. Reading is okay, but don't write.
  lastJump: 0, // Time when the last jump occurred in milliseconds since the epoch
  lastDirection: [], // The last direction (i.e. key press) passed to processInput()
  jumpDirection: {right: false, left: false}, // Whether the Actor was moving horizontally before jumping
  jumpKeyDown: false, // Whether the jump key is currently pressed
  numJumps: 0, // Number of jumps since the last time the Actor was touching the ground
  inAir: false, // Whether the Actor is in the air
  fallLeft: null, // The direction the Actor was moving before falling
  isDraggable: false, // Whether the Actor is draggable
  dragStartX: 0, // Last position of the Actor before being dragged
  dragStartY: 0, // Last position of the Actor before being dragged
  animLoop: '', // Current SpriteMap animation sequence

  /**
   * @constructor
   *   Initialize an Actor.
   *
   * Takes the same parameters as the Box constructor.
   * **Inherited documentation:**
   *
   * @inheritdoc Box#constructor
   */
  init: function() {
    this._super.apply(this, arguments);
    this.lastX = this.x;
    this.lastY = this.y;
    this.lastDirection = [];
    this.lastLooked = [];
    this.jumpDirection = {right: false, left: false};
    this.dropTargets = [];
    if (arguments.length < 5) {
      this.fillStyle = 'lightBlue';
    }
  },

  /**
   * @inheritdoc Box#draw
   */
  draw: function() {
    if (this.src instanceof SpriteMap && this.animLoop) {
      this.src.use(this.animLoop); // Switch to the active animation loop
    }
    return this._super.apply(this, arguments);
  },

  /**
   * Actors draw as a smiley face by default.
   *
   * **Inherited documentation:**
   *
   * @inheritdoc Box#drawDefault
   */
  drawDefault: function(ctx, x, y, w, h) {
    x = x + w/2;
    y = y + h/2;
    var r = (w+h)/4;

    // Circle
    ctx.circle(x, y, r, this.fillStyle, 'black');

    // Smile
    ctx.beginPath();
    ctx.arc(x, y, r*0.6, Math.PI*0.1, Math.PI*0.9, false);
    ctx.lineWidth = Math.max(Math.ceil(r/15), 1);
    ctx.strokeStyle = 'black';
    ctx.stroke();

    // Eyes
    ctx.beginPath();
    ctx.arc(x - r*0.3, y - r*0.25, Math.max(Math.ceil(r/15), 1), 0, 2 * Math.PI, false);
    ctx.fillStyle = 'black';
    ctx.fill();
    ctx.arc(x + r*0.3, y - r*0.25, Math.max(Math.ceil(r/15), 1), 0, 2 * Math.PI, false);
    ctx.fill();
  },

  /**
   * Update the Actor for a new frame.
   *
   * @param {String[]} [direction]
   *   An Array of directions in which to move the Actor. Directions are
   *   expected to correspond to keys on the keyboard (as described by
   *   {@link jQuery.hotkeys}).
   */
  update: function(direction) {
    this.lastX = this.x;
    this.lastY = this.y;
    if (this.isBeingDragged && window.Mouse) {
      this.x = Mouse.Coords.worldX() - this.width/2;
      this.y = Mouse.Coords.worldY() - this.height/2;
    }
    else {
      this.processInput(direction);
      this.ambientAcceleration();
      this.move();
      if (App.Utils.almostEqual(this.lastX, this.x, 0.000001)) {
        this.fallLeft = null;
      }
      // If we're not actually falling, collideSolid() will catch us.
      if (this.GRAVITY &&
          (this.y + this.height != world.height || !this.STAY_IN_WORLD)) {
        this.startFalling();
      }
    }
    this.updateAnimation();
    this.dampVelocity();
  },

  /**
   * Process directions and adjust motion accordingly.
   *
   * Called from Actor#update().
   *
   * @param {String[]} direction
   *   An Array of directions in which to move the Actor. Valid directions are
   *   expected to correspond to keys on the keyboard by default (as described
   *   by {@link jQuery.hotkeys}) though for Actors that are not Players the
   *   directions will not normally be sent from actual key presses.
   */
  processInput: function(direction) {
    var left = false,
        right = false,
        looked = false,
        anyIn = App.Utils.anyIn,
        keys = this.keys || window.keys;
    // Bail if someone deleted the keys variable.
    if (typeof keys === 'undefined') {
      return;
    }
    if (typeof direction === 'undefined' || direction.length === 0) {
      // For continuous movement, if no direction is given, use the last one.
      if (this.CONTINUOUS_MOVEMENT) {
        direction = this.lastLooked;
      }
      // No need to keep processing if no directions were given.
      else {
        return;
      }
    }
    this.lastDirection = direction.slice(); // shallow copy

    // Move left.
    if (anyIn(keys.left, direction)) {
      left = true;
      looked = true;
      this.fallLeft = true;
      if (this.GRAVITY && this.isInAir()) {
        if (this.jumpDirection.right || !this.jumpDirection.left) {
          this.xVelocity = -this.MOVEAMOUNT * this.AIR_CONTROL;
          this.jumpDirection.right = false;
          this.jumpDirection.left = false;
        }
      }
      else {
        this.xVelocity = -this.MOVEAMOUNT;
      }
    }
    // Move right.
    else if (anyIn(keys.right, direction)) {
      right = true;
      looked = true;
      this.fallLeft = false;
      if (this.GRAVITY && this.isInAir()) {
        if (this.jumpDirection.left || !this.jumpDirection.right) {
          this.xVelocity = this.MOVEAMOUNT * this.AIR_CONTROL;
          this.jumpDirection.right = false;
          this.jumpDirection.left = false;
        }
      }
      else {
        this.xVelocity = this.MOVEAMOUNT;
      }
    }

    // Move up / jump.
    if (anyIn(keys.up, direction)) {
      if (!this.GRAVITY) {
        this.yVelocity = -this.MOVEAMOUNT;
        looked = true;
      }
      else if (!this.isInAir() ||
          this.MULTI_JUMP > this.numJumps ||
          this.MULTI_JUMP == -1) {
        var now = App.physicsTimeElapsed;
        if (now - this.lastJump > this.JUMP_DELAY && // sufficient delay
            (!this.JUMP_RELEASE || !this.jumpKeyDown)) { // press jump again
          this.yVelocity = -this.JUMP_VEL;
          this.yAcceleration = 0; // Don't aggregate gravity
          this.lastJump = now;
          this.jumpDirection.right = right;
          this.jumpDirection.left = left;
          this.numJumps++;
          this.inAir = true;
        }
      }
      this.jumpKeyDown = true;
    }
    // Move down.
    else if (anyIn(keys.down, direction)) {
      if (!this.isInAir() || !this.GRAVITY) { // don't allow accelerating downward when falling
        this.yVelocity = this.MOVEAMOUNT;
        looked = true;
      }
    }

    if (looked) {
      this.lastLooked = direction.slice(); // shallow copy
      // Avoid looking anywhere but right or left if gravity is enabled.
      // If we didn't have this here, we would be able to look diagonally.
      if (this.GRAVITY) {
        for (var i = this.lastLooked.length-1; i >= 0; i--) {
          if (keys.left.indexOf(this.lastLooked[i]) == -1 &&
              keys.right.indexOf(this.lastLooked[i]) == -1) {
            this.lastLooked.splice(i, 1);
          }
        }
      }
    }
  },

  /**
   * Calculate acceleration from the environment.
   *
   * Acceleration from user input is calculated in Actor#processInput().
   */
  ambientAcceleration: function() {
    // Gravity.
    if (this.GRAVITY) {
      // Air movement (not initiated by user input).
      if (this.isInAir()) {
        this.yAcceleration += this.G_CONST;
        if (this.jumpDirection.left) {
          this.xVelocity = -this.MOVEAMOUNT;
        }
        else if (this.jumpDirection.right) {
          this.xVelocity = this.MOVEAMOUNT;
        }
      }
      else {
        this.stopFalling();
      }
    }
  },

  /**
   * Actually move the Actor.
   */
  move: function() {
    var delta = App.physicsDelta, d2 = delta / 2;
    // Apply half acceleration (first half of midpoint formula)
    this.xVelocity += this.xAcceleration*d2;
    this.yVelocity += this.yAcceleration*d2;
    // Don't let diagonal movement be faster than axial movement
    var xV = this.xVelocity, yV = this.yVelocity;
    if (xV !== 0 && yV !== 0 && !this.GRAVITY) {
      var magnitude = Math.max(Math.abs(xV), Math.abs(yV));
      var origMag = Math.sqrt(xV*xV + yV*yV);
      var scale = magnitude / origMag;
      this.xVelocity *= scale;
      this.yVelocity *= scale;
    }
    // Apply thrust
    this.x += this.xVelocity*delta;
    this.y += this.yVelocity*delta;
    // Apply half acceleration (second half of midpoint formula)
    this.xVelocity += this.xAcceleration*d2;
    this.yVelocity += this.yAcceleration*d2;
    // Clip
    this.stayInWorld();
  },

  /**
   * Force the Actor to stay inside the world.
   */
  stayInWorld: function() {
    if (this.STAY_IN_WORLD) {
      if (this.x < 0) {
        this.x = 0;
      }
      else if (this.x + this.width > world.width) {
        this.x = world.width - this.width;
      }
      if (this.y < 0) {
        this.y = 0;
      }
      else if (this.y + this.height > world.height) {
        this.y = world.height - this.height;
        this.stopFalling();
      }
    }
  },

  /**
   * Damp the Actor's velocity.
   *
   * This affects how much control the Actor has over its movement, i.e.
   * whether the Actor can stop and turn on a dime or whether it slides around
   * with momentum.
   */
  dampVelocity: function() {
    if (this.DAMPING_FACTOR !== null &&
        !App.Utils.almostEqual(this.xVelocity, 0, 0.0001)) {
      this.xVelocity *= 1 - this.DAMPING_FACTOR * App.physicsDelta;
      if (!this.GRAVITY && !App.Utils.almostEqual(this.yVelocity, 0, 0.0001)) {
        this.yVelocity *= 1 - this.DAMPING_FACTOR * App.physicsDelta;
      }
      return;
    }
    this.xVelocity = 0;
    if (!this.GRAVITY) {
      this.yVelocity = 0;
    }
  },

  /**
   * Add velocity as a vector.
   *
   * See also Actor#setVelocityVector() and Actor#getVelocityVector().
   *
   * @param {Number} radialDir The direction of the vector to add, in radians.
   * @param {Number} magnitude The magnitude ot the vector to add, in pixels.
   */
  addVelocityVector: function(radialDir, magnitude) {
    this.xVelocity += magnitude * Math.cos(radialDir);
    this.yVelocity += magnitude * Math.sin(radialDir);
  },

  /**
   * Set velocity as a vector.
   *
   * See also Actor#addVelocityVector() and Actor#getVelocityVector().
   *
   * @param {Number} radialDir The direction of the vector to set, in radians.
   * @param {Number} magnitude The magnitude ot the vector to set, in pixels.
   */
  setVelocityVector: function(radialDir, magnitude) {
    this.xVelocity = magnitude * Math.cos(radialDir);
    this.yVelocity = magnitude * Math.sin(radialDir);
  },

  /**
   * Get the velocity vector.
   *
   * See also Actor#addVelocityVector() and Actor#setVelocityVector().
   *
   * @return {Object}
   *   An object with `magnitude` and `direction` attributes indicating the
   *   velocity of the Actor.
   */
  getVelocityVector: function() {
    return {
      magnitude: Math.sqrt(this.xVelocity*this.xVelocity + this.yVelocity*this.yVelocity),
      direction: Math.atan2(this.yVelocity, this.xVelocity),
    };
  },

  /**
   * Add acceleration as a vector.
   *
   * See also Actor#setAccelerationVector() and Actor#getAccelerationVector().
   *
   * @param {Number} radialDir The direction of the vector to add, in radians.
   * @param {Number} magnitude The magnitude ot the vector to add, in pixels.
   */
  addAccelerationVector: function(radialDir, magnitude) {
    this.xAcceleration += magnitude * Math.cos(radialDir);
    this.yAcceleration += magnitude * Math.sin(radialDir);
  },

  /**
   * Set acceleration as a vector.
   *
   * See also Actor#addAccelerationVector() and Actor#getAccelerationVector().
   *
   * @param {Number} radialDir The direction of the vector to set, in radians.
   * @param {Number} magnitude The magnitude ot the vector to set, in pixels.
   */
  setAccelerationVector: function(radialDir, magnitude) {
    this.xAcceleration = magnitude * Math.cos(radialDir);
    this.yAcceleration = magnitude * Math.sin(radialDir);
  },

  /**
   * Get the acceleration vector.
   *
   * See also Actor#addAccelerationVector() and Actor#setAccelerationVector().
   *
   * @return {Object}
   *   An object with `magnitude` and `direction` attributes indicating the
   *   acceleration of the Actor.
   */
  getAccelerationVector: function() {
    return {
      magnitude: Math.sqrt(this.xVelocity*this.xVelocity + this.yVelocity*this.yVelocity),
      direction: Math.atan2(this.yVelocity, this.xVelocity), // yes, this order is correct
    };
  },

  /**
   * Move this Actor outside of another Box so that it no longer overlaps.
   *
   * This is called as part of Actor#collideSolid().
   *
   * See also Actor#moveOutsideX() and Actor#moveOutsideY().
   *
   * @param {Box} other
   *   The other Box that this Actor should be moved outside of.
   *
   * @return {Object}
   *   An object with `x` and `y` properties indicating how far this Actor
   *   moved in order to be outside of the other Box, in pixels.
   */
  moveOutside: function(other) {
    var overlapsX = Math.min(this.x + this.width - other.x, other.x + other.width - this.x),
        overlapsY = Math.min(this.y + this.height - other.y, other.y + other.height - this.y);

    // It matters which axis we move first.
    if (overlapsX <= overlapsY) {
      return {
        x: this.moveOutsideX(other),
        y: this.moveOutsideY(other),
      };
    }
    return {
      y: this.moveOutsideY(other),
      x: this.moveOutsideX(other),
    };
  },

  /**
   * Move this Actor outside of another Box on the x-axis to avoid overlap.
   *
   * See also Actor#moveOutside().
   *
   * @param {Box} other
   *   The other Box that this Actor should be moved outside of.
   *
   * @return {Number}
   *   The distance in pixels that this Actor moved on the x-axis.
   */
  moveOutsideX: function(other) {
    var moved = 0, movedTo;
    // Only adjust if we're intersecting
    if (this.overlaps(other)) {
      // If our center is left of their center, move to the left side
      if (this.x + this.width / 2 < other.x + other.width / 2) {
        movedTo = other.x - this.width - 0.01;
      }
      // If our center is right of their center, move to the right side
      else {
        movedTo = other.x + other.width + 0.01;
      }
      moved = movedTo - this.x;
      this.x = movedTo;
    }
    return moved;
  },

  /**
   * Move this Actor outside of another Box on the y-axis to avoid overlap.
   *
   * See also Actor#moveOutside().
   *
   * @param {Box} other
   *   The other Box that this Actor should be moved outside of.
   *
   * @return {Number}
   *   The distance in pixels that this Actor moved on the y-axis.
   */
  moveOutsideY: function(other) {
    var moved = 0, movedTo;
    // Only adjust if we're intersecting
    if (this.overlaps(other)) {
      // If our center is above their center, move to the top
      if (this.y + this.height / 2 <= other.y + other.height / 2) {
        movedTo = other.y - this.height - 1;
      }
      // If our center is below their center, move to the bottom
      else {
        movedTo = other.y + other.height + 1;
      }
      moved = movedTo - this.y;
      this.y = movedTo;
    }
    return moved;
  },

  /**
   * Start falling.
   *
   * This method has no meaning if {@link Actor#GRAVITY GRAVITY} is false.
   *
   * Related: Actor#stopFalling(), Actor#isInAir(), Actor#isJumping(),
   * Actor#isFalling(), Actor#hasAirMomentum()
   */
  startFalling: function() {
    // Keep going at the same horizontal speed when walking off a ledge.
    if (!this.inAir && this.fallLeft !== null) {
      this.jumpDirection.left = this.fallLeft;
      this.jumpDirection.right = !this.fallLeft;
    }
    this.inAir = true;
  },

  /**
   * Notify the Actor that it has landed.
   *
   * This method has no meaning if GRAVITY is false.
   *
   * Related: Actor#startFalling(), Actor#isInAir(), Actor#isJumping(),
   * Actor#isFalling(), Actor#hasAirMomentum()
   */
  stopFalling: function() {
    if (this.yAcceleration > 0) {
      this.yAcceleration = 0;
    }
    if (this.yVelocity > 0) {
      this.yVelocity = 0;
    }
    this.numJumps = 0;
    this.inAir = false;
  },

  /**
   * Check whether the Actor is in the air or not.
   *
   * Related: Actor#startFalling(), Actor#stopFalling(), Actor#isJumping(),
   * Actor#isFalling(), Actor#hasAirMomentum()
   */
  isInAir: function() {
    return this.inAir;
  },

  /**
   * Check whether the Actor is jumping or not.
   *
   * Related: Actor#startFalling(), Actor#stopFalling(), Actor#isInAir(),
   * Actor#isFalling(), Actor#hasAirMomentum()
   */
  isJumping: function() {
    return this.numJumps > 0;
  },

  /**
   * Check whether the Actor is in the air from falling (as opposed to jumping).
   *
   * Related: Actor#startFalling(), Actor#stopFalling(), Actor#isInAir(),
   * Actor#isJumping(), Actor#hasAirMomentum()
   */
  isFalling: function() {
    return this.isInAir() && this.numJumps === 0;
  },

  /**
   * Check whether the Actor has air momentum (as opposed to air control).
   *
   * Related: Actor#startFalling(), Actor#stopFalling(), Actor#isInAir(),
   * Actor#isJumping(), Actor#isFalling()
   */
  hasAirMomentum: function() {
    return this.fallLeft !== null ||
      this.jumpDirection.left ||
      this.jumpDirection.right;
  },

  /**
   * Check whether this Actor is standing on top of a Box.
   *
   * @param {Box/Collection/TileMap} box The Box or set of Boxes to check.
   */
  standingOn: function(box) {
    if ((typeof Collection !== 'undefined' && box instanceof Collection) ||
        (typeof TileMap !== 'undefined' && box instanceof TileMap)) {
      var items = box.getAll();
      for (var i = 0, l = items.length; i < l; i++) {
        if (this.standingOn(items[i])) {
          return true;
        }
      }
      return false;
    }
    return this.overlapsX(box) &&
      App.Utils.almostEqual(this.y + this.height, box.y, 1);
  },

  /**
   * Check collision with solids and adjust the Actor's position as necessary.
   *
   * This method has the side-effect that it will stop the Actor from falling
   * if it is standing on a Box.
   *
   * The collision checking here uses AABB detection, meaning it uses upright
   * rectangles. It is accurate, but not as fast as it could be if there are
   * many objects to check against. If you need faster collision checking
   * against many objects and you're willing to do it manually, consider
   * implementing
   * [spatial partitioning](http://buildnewgames.com/broad-phase-collision-detection/).
   * If you need different collision models (for example with rotated
   * rectangles or different shapes) or if you need more advanced physics
   * simulation (for example to model springs) consider using the
   * [Box2D library](https://github.com/kripken/box2d.js/).
   *
   * @param {Box/Collection/TileMap} collideWith
   *   A Box, Collection, or TileMap of objects with which to check collision.
   *
   * @return {Object}
   *   An Object with `x` and `y` properties, both Booleans indicating whether
   *   the Actor collided with something in the respective direction.
   */
  collideSolid: function(collideWith) {
    var collided = {x: 0, y: 0};
    if (collideWith instanceof Box || collideWith instanceof ImageWrapper) {
      collided = this._collideSolidBox(collideWith);
    }
    else if ((typeof Collection !== 'undefined' && collideWith instanceof Collection) ||
        (typeof TileMap !== 'undefined' && collideWith instanceof TileMap)) {
      var items = collideWith.getAll();
      for (var i = 0, l = items.length; i < l; i++) {
        var c = this._collideSolidBox(items[i]);
        if (c.x) {
          collided.x = c.x;
        }
        if (c.y) {
          collided.y = c.y;
        }
      }
    }
    collided.x = !!collided.x;
    collided.y = !!collided.y;
    this.updateAnimation(collided);
    return collided;
  },

  /**
   * Check collision with a single solid and adjust the Actor's position.
   *
   * This method has the side-effect that it will stop the Actor from falling if
   * it is standing on the Box.
   *
   * See also Actor#collideSolid().
   *
   * @param {Box} collideWith
   *   A Box with which to check collision.
   *
   * @return {Object}
   *   An object with `x` and `y` properties indicating how far this Actor
   *   moved in order to be outside of the Box, in pixels. If both properties
   *   are `0` then the Actor and Box do not overlap.
   *
   * @ignore
   */
  _collideSolidBox: function(collideWith) {
    // "Falling" here really just means "not standing on top of this Box."
    var falling = true, collided = {x: 0, y: 0};
    // If we moved a little too far and now intersect a solid, back out.
    if (this.overlaps(collideWith)) {
      collided = this.moveOutside(collideWith);
    }
    // If gravity is on, check standing/falling behavior.
    if (this.GRAVITY) {
      // We actually want to check if the last X-position would have been
      // standing, so move back there, check, and then move back to the current
      // position. This is because if a player jumps while moving towards a
      // wall, they could match the standing condition as they just barely
      // reach the top, which will stop their jump arc. If their x-position
      // from the last frame would have been standing, though, we can assume
      // they were already standing rather than jumping.
      var x = this.x;
      this.x = this.lastX;
      if (this.standingOn(collideWith)) {
        this.stopFalling();
        falling = false;
        if (typeof collideWith.stoodOn == 'function') {
          collideWith.stoodOn(this);
        }
      }
      this.x = x;
      // If we're in the air and we hit something, stop the momentum.
      if (falling && (collided.x || collided.y)) {
        // If we hit the bottom, stop rising.
        if (App.Utils.almostEqual(this.y, collideWith.y + collideWith.height, 1)) {
          if (this.yAcceleration < 0) {
            this.yAcceleration = 0;
          }
          if (this.yVelocity < 0) {
            this.yVelocity = 0;
          }
        }
        // If we hit a side, stop horizontal momentum.
        else {
          this.jumpDirection.left = false;
          this.jumpDirection.right = false;
        }
      }
    }
    return collided;
  },

  /**
   * Change the Actor's animation sequence if it uses a {@link SpriteMap}.
   *
   * All animations fall back to the "stand" animation if they are not
   * available. The "jumpRight" and "jumpLeft" sequences will try to fall back
   * to the "lookRight" and "lookLeft" sequences first, respectively, if they
   * are not available. Animations that will play by default if they are
   * available include:
   *
   * - stand (required)
   * - left
   * - right
   * - up
   * - down
   * - upRight
   * - upLeft
   * - downRight
   * - downLeft
   * - jump
   * - fall
   * - jumpRight
   * - jumpLeft
   * - lookRight
   * - lookLeft
   * - lookUp
   * - lookDown
   * - lookUpRight
   * - lookUpLeft
   * - lookDownRight
   * - lookDownLeft
   * - drag
   *
   * Override this function if you want to modify the custom rules for which
   * animations to play (or what the animations' names are).
   *
   * This function does nothing if the Actor's `src` attribute is not a
   * SpriteMap.
   *
   * See also Actor#useAnimation().
   *
   * @param {Object} [collided]
   *   An Object with `x` and `y` properties, both Booleans indicating whether
   *   the Actor collided with something in the respective direction.
   */
  updateAnimation: function(collided) {
    if (!(this.src instanceof SpriteMap)) {
      return;
    }
    var keys = this.keys || window.keys,
        lastDirection = this.lastDirection,
        anyIn = App.Utils.anyIn,
        keysIsDefined = typeof keys !== 'undefined'; // Don't fail if "keys" was removed
    // Don't let shooting make us change where we're looking.
    if (keysIsDefined &&
        typeof keys.shoot !== 'undefined' &&
        anyIn(keys.shoot, lastDirection)) {
      lastDirection = this.lastLooked;
    }
    if (this.isBeingDragged) {
      this.useAnimation('drag', 'stand');
    }
    else if (this.isInAir()) {
      if (this.x > this.lastX) {
        this.useAnimation('jumpRight', 'lookRight', 'stand');
      }
      else if (this.x < this.lastX) {
        this.useAnimation('jumpLeft', 'lookLeft', 'stand');
      }
      else if (this.isJumping()) {
        this.useAnimation('jump', 'stand');
      }
      else {
        this.useAnimation('fall', 'stand');
      }
    }
    else if (this.y > this.lastY) {
      if (this.x > this.lastX) {
        this.useAnimation('downRight', 'stand');
      }
      else if (this.x < this.lastX) {
        this.useAnimation('downLeft', 'stand');
      }
      else {
        this.useAnimation('down', 'stand');
      }
    }
    else if (this.y < this.lastY) {
      if (this.x > this.lastX) {
        this.useAnimation('upRight', 'stand');
      }
      else if (this.x < this.lastX) {
        this.useAnimation('upLeft', 'stand');
      }
      else {
        this.useAnimation('up', 'stand');
      }
    }
    else if (this.x > this.lastX) {
      this.useAnimation('right', 'stand');
    }
    else if (this.x < this.lastX) {
      this.useAnimation('left', 'stand');
    }
    else if (keysIsDefined && anyIn(keys.up, lastDirection)) {
      if (anyIn(keys.right, lastDirection)) {
        this.useAnimation('lookUpRight', 'stand');
      }
      else if (anyIn(keys.left, lastDirection)) {
        this.useAnimation('lookUpLeft', 'stand');
      }
      else {
        this.useAnimation('lookUp', 'stand');
      }
    }
    else if (keysIsDefined && anyIn(keys.down, lastDirection)) {
      if (anyIn(keys.right, lastDirection)) {
        this.useAnimation('lookDownRight', 'stand');
      }
      else if (anyIn(keys.left, lastDirection)) {
        this.useAnimation('lookDownLeft', 'stand');
      }
      else {
        this.useAnimation('lookDown', 'stand');
      }
    }
    else if (keysIsDefined && anyIn(keys.right, lastDirection)) {
      this.useAnimation(collided && collided.x ? 'right' : 'lookRight', 'stand');
    }
    else if (keysIsDefined && anyIn(keys.left, lastDirection)) {
      this.useAnimation(collided && collided.x ? 'left' : 'lookLeft', 'stand');
    }
    else {
      this.useAnimation('stand');
    }
  },

  /**
   * Try to switch to a different {@link SpriteMap} animation sequence.
   *
   * Takes animation sequence names as arguments as switches to the first named
   * sequence that exists in the SpriteMap. If you already know what animation
   * sequences you have available, you might as well just call `this.src.use()`
   * directly.
   *
   * See also Actor#updateAnimation().
   *
   * @param {Arguments} ...
   *   Animation sequence names. Switches to the first one that the SpriteMap
   *   defines.
   *
   * @return {String/Boolean}
   *   The name of the animation sequence to which the Actor switched, if
   *   successful; false otherwise.
   */
  useAnimation: function() {
    if (typeof this.src.maps === 'undefined') {
      return;
    }
    for (var i = 0; i < arguments.length; i++) {
      var a = arguments[i];
      if (this.src.maps[a]) {
        this.animLoop = a;
        return a;
      }
    }
    return false;
  },

  /**
   * Toggle whether the Actor can be dragged around by the mouse.
   *
   * Note that dragged Actors still follow collision rules. (It is possible to
   * drag an Actor through a wall, but Actors cannot be dropped inside of
   * something solid they collide with.)
   *
   * @param {Boolean} on Whether to enable or disable dragging.
   */
  setDraggable: function(on) {
    if (this.isDraggable && on) {
      return this;
    }
    else if (!on) {
      this.isDraggable = false;
      this.unlisten('.drag');
      return this;
    }
    else if (!App.Events) {
      if (window.console && console.warn) {
        console.warn('Actor#setDraggable called, but App.Events does not exist.');
      }
      return this;
    }
    else if (!window.Mouse) {
      if (window.console && console.warn) {
        console.warn('Actor#setDraggable called, but window.Mouse does not exist.');
      }
      return this;
    }
    this.isDraggable = true;
    this.listen('mousedown.drag touchstart.drag', function() {
      App.isSomethingBeingDragged = true;
      this.isBeingDragged = true;
      this.dragStartX = this.x;
      this.dragStartY = this.y;
      /**
       * @event canvasdragstart
       *   Fires on the document when the user begins dragging an object,
       *   i.e. when the player clicks on or touches an object. Multiple
       *   objects can be dragged at once if they overlap, and this event will
       *   be triggered once for each of them.
       * @param {Actor} obj The object being dragged.
       * @member global
       */
      jQuery(document).trigger('canvasdragstart', [this]);
    });
    this.listen('canvasdragstop.drag', function() {
      this.isBeingDragged = false;
      // If there are no drop targets, the Actor can be dropped anywhere.
      // If there are drop targets and we're not over one, snap back to the
      // starting point.
      var target = this.collides(this.dropTargets);
      if (this.dropTargets.length && !target) {
        this.x = this.dragStartX;
        this.y = this.dragStartY;
      }
      else if (target) {
        /**
         * @event canvasdrop
         *   Fires on the document when a draggable Actor is dropped onto a
         *   target. This is used **internally** to trigger the event on the
         *   target directly.
         * @param {Box} target The drop target.
         * @member global
         * @ignore
         */
        jQuery(document).trigger('canvasdrop', [target]);
      }
    });
    return this;
  },

  /**
   * Determine whether this Actor is draggable.
   */
  getDraggable: function() {
    return this.isDraggable;
  },

  /**
   * Notify the Actor that a direction is no longer being given.
   *
   * This is useful when Actors need to distinguish between directions being
   * given continuously (such as when holding down a key) and those being given
   * intermittently (such as a simple key press).
   *
   * @param {String[]} releasedDirections
   *   An Array containing directions that are no longer being given.
   */
  release: function(releasedDirections) {
    var keys = this.keys || window.keys;
    if (this.GRAVITY && typeof keys !== 'undefined' &&
        App.Utils.anyIn(keys.up, releasedDirections)) {
      this.jumpKeyDown = false;
    }
  },
});

/**
 * The Player object controlled by the user.
 *
 * Multiple Players are supported. If you instantiate multiple Players, you
 * will usually want to set different {@link Actor#keys keys} for them.
 *
 * If the world is bigger than the canvas, the viewport will shift as a Player
 * moves toward an edge of the viewport. Sane viewport shifting is not
 * guaranteed with multiple Players.
 *
 * @extends Actor
 */
var Player = Actor.extend({
  /**
   * The default threshold for how close a Player has to be to an edge before
   * the viewport shifts (in percent of canvas size). To have the viewport move
   * only when the Player is actually at its edge, try a value close to zero.
   * To have the viewport move with the Player, try a value close to 0.5.
   */
  MOVEWORLD: 0.45,

  /**
   * Whether to require that the jump key is released before jumping again.
   *
   * Specifically, this is a boolean which, when true, restricts the Actor from
   * jumping after being in the air until after the Actor is on the ground with
   * the jump key released. This limits the ability to "bounce" by holding down
   * the jump key. This behavior depends on being notified of when keys are
   * released via the release() method, which happens automatically for
   * Players. If you enable this for standard Actors, the meaning of a "key
   * press" is artificial, so you must make sure to call release() before you
   * make the Actor jump again.
   */
  JUMP_RELEASE: true,

  /**
   * @constructor
   *   Initialize a Player.
   *
   * Takes the same parameters as the Box constructor.
   * **Inherited documentation:**
   *
   * @inheritdoc Box#constructor
   */
  init: function() {
    this._super.apply(this, arguments);
    if (arguments.length > 0) {
      world.centerViewportAround(this.x, this.y);
    }
    var t = this;
    this.__keytracker = function() {
      // lastKeyPressed() actually contains all keys that were pressed at the
      // last key event, whereas event.keyPressed just holds the single key
      // that triggered the event.
      if (jQuery.hotkeys) {
        t.release([jQuery.hotkeys.lastKeyPressed()]);
      }
    };
    // Notify the Player object when keys are released.
    jQuery(document).on('keyup.release', this.__keytracker);
  },

  /**
   * Override Actor#processInput() to respond to keyboard input automatically.
   *
   * **Inherited documentation:**
   *
   * @inheritdoc Actor#processInput
   */
  processInput: function(direction) {
    if (typeof direction === 'undefined' && jQuery.hotkeys) {
      direction = jQuery.hotkeys.keysDown;
    }
    return this._super(direction);
  },

  /**
   * Override Actor#update() to move the viewport as the Player nears an edge.
   *
   * **Inherited documentation:**
   *
   * @inheritdoc Actor#update
   */
  update: function(direction) {
    this._super(direction);
    if (!this.isBeingDragged) {
      this.adjustViewport();
    }
  },

  /**
   * Toggle whether the Player can be dragged around by the mouse.
   *
   * **Inherited documentation:**
   *
   * @inheritdoc Actor#setDraggable
   */
  setDraggable: function(on) {
    if (on && !this.isDraggable && App.Events && window.Mouse) {
      this.listen('canvasdragstop.drag', function() {
        if (this.isBeingDragged &&
            (!this.dropTargets.length || this.collides(this.dropTargets))) {
          world.centerViewportAround(this.x, this.y);
        }
      }, -1);
    }
    return this._super.apply(this, arguments);
  },

  /**
   * Move the viewport when the Player gets near the edge.
   *
   * @return {Object}
   *   An object with `x` and `y` properties indicating the number of pixels
   *   this method caused the viewport to shift along each axis.
   */
  adjustViewport: function() {
    var xOffset = world.xOffset,
        yOffset = world.yOffset,
        changed = {x: 0, y: 0};
    // We should only have mouse or player scrolling, but not both.
    if (window.Mouse && Mouse.Scroll.isEnabled()) {
      return changed;
    }
    // left
    if (xOffset > 0 && this.x + this.width/2 - xOffset < canvas.width * this.MOVEWORLD) {
      world.xOffset = Math.max(xOffset + (this.x - this.lastX), 0);
      context.translate(xOffset - world.xOffset, 0);
      changed.x = xOffset - world.xOffset;
    }
    // right
    else if (xOffset < world.width - canvas.width &&
        this.x + this.width/2 - xOffset > canvas.width * (1-this.MOVEWORLD)) {
      world.xOffset = Math.min(xOffset + (this.x - this.lastX), world.width - canvas.width);
      context.translate(xOffset - world.xOffset, 0);
      changed.x = xOffset - world.xOffset;
    }
    // up
    if (yOffset > 0 && this.y + this.height/2 - yOffset < canvas.height * this.MOVEWORLD) {
      world.yOffset = Math.max(yOffset + (this.y - this.lastY), 0);
      context.translate(0, yOffset - world.yOffset);
      changed.y = yOffset - world.yOffset;
    }
    // down
    else if (yOffset < world.height - canvas.height &&
        this.y + this.height/2 - yOffset > canvas.height * (1-this.MOVEWORLD)) {
      world.yOffset = Math.min(yOffset + (this.y - this.lastY), world.height - canvas.height);
      context.translate(0, yOffset - world.yOffset);
      changed.y = yOffset - world.yOffset;
    }
    return changed;
  },

  /**
   * Clean up after ourselves.
   */
  destroy: function() {
    this._super.apply(this, arguments);
    jQuery(document).off('.release', this.__keytracker);
  },
});
