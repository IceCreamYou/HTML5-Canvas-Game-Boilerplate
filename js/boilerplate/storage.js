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
