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
