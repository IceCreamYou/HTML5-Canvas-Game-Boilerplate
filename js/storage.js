/**
 * Provides persistent local storage that preserves object type.
 *
 * If you wanted to be really comprehensive with local storage you could use
 * something like https://github.com/alexmng/sticky/blob/master/sticky-2.8.js.
 * However, localStorage is supported in every browser that supports enough
 * Canvas API operations to be useful, so that is all we need to support.
 *
 * The methods of App.storage do basically the same thing as their localStorage
 * equivalents:
 * - .get(key, defaultValue) gets the value stored at the key. If there is no
 *   value, returns defaultValue (undefined by default).
 * - .set(key, value) sets the value at key. If value is undefined, removes the
 *   value at key.
 * - .remove(key) removes the value at key.
 * - .clear() removes all values from storage.
 * - .length() returns the number of items in storage.
 * - .key(index) returns the value at the relevant numeric index.
 * - .enabled is a boolean indicating whether or not local storage is supported
 *   in this browser. If false, a fake storage system is substituted that does
 *   not persist between sessions.
 *
 * Note that local storage does not work in some browsers on documents accessed
 * via the file:// protocol.
 */
App.storage = (function(window, undefined) {
  var api = {}, namespace = '__jqstore__', storage = window.localStorage;
  api.enabled = true;
  // Provide equivalents to the localStorage interface.
  api.set = function(key, value) {
    if (value === undefined) {
      return api.remove(key);
    }
    storage.setItem(key, JSON.stringify(value));
  };
  api.get = function(key, defaultValue) {
    return JSON.parse(storage.getItem(key)) || defaultValue;
  };
  api.remove = function(key) {
    storage.removeItem(key);
  };
  api.clear = function() {
    storage.clear();
  };
  api.length = function() {
    if (storage.__fake) {
      return storage.internal.length;
    }
    return storage.length;
  };
  api.key = function(index) {
    return storage.key(index);
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
  // If localStorage is unavailable, fake it.
  // No point falling back to anything else; all we're going for here is
  // avoiding breaking errors. Doing this avoids having to check for
  // App.storage.enabled every time you want to store something.
  if (!api.enabled) {
    storage = {
        __fake: true,
        __internal: {},
        setItem: function(key, value) {
          this.__internal[key] = value;
        },
        getItem: function(key) {
          return this.__internal[key];
        },
        removeItem: function(key) {
          delete this.__internal[key];
        },
        clear: function() {
          this.__internal = {};
        },
        key: function(index) {
          var i = 0;
          for (var k in this.__internal) {
            if (i == index) {
              return this.__internal[k];
            }
            i++;
          }
        },
    };
  }
  return api;
})(window);
