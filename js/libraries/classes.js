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
