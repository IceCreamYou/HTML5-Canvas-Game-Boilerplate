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
