/**
 * Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 */
// Inspired by base2 and Prototype
(function(){
  var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;

  // The base Class implementation (does nothing)
  this.Class = function(){};
 
  // Create a new Class that inherits from this class
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


// ----------------------------------------------------------------------------

var player;
$(canvas).ready(function() {
	player = new Player(world.width/2, world.height/2);
	
	// TODO: get rid of dependency on hotkeys
	$(document).bind('keydown', 'left', function(e) { player.move(e);  });
	$(document).bind('keydown', 'right', function(e) { player.move(e); });
	$(document).bind('keydown', 'up', function(e) { player.move(e); });
	$(document).bind('keydown', 'down', function(e) { player.move(e); });
});
$(document).on('resizeWorld', function(e, delta) {
	player.x += delta.x;
	player.y += delta.y;
});

/**
 * The Actor object.
 */
var Actor = Class.extend({
	MOVEAMOUNT: 5,
	RADIUS: 40,
	MOVEWORLD: 0.25,

	init: function(xx, yy) {
		this.x = xx;
		this.y = yy;
		
		this.draw();
	},
	
	draw: function() {
		context.drawSmiley(this.x, this.y, this.RADIUS);
	},
	
	move: function(e) {
		if (e.preventDefault)
			e.preventDefault();
		var direction = e.data || e;
		this.lastDirection = direction;
		
		// Move.
		if (direction == 'left' && this.x - this.RADIUS - this.MOVEAMOUNT >= 0) {
			this.x -= this.MOVEAMOUNT;
		}
		else if (direction == 'right' && this.x + this.RADIUS + this.MOVEAMOUNT <= world.width) {
			this.x += this.MOVEAMOUNT;
		}
		else if (direction == 'up' && this.y - this.RADIUS - this.MOVEAMOUNT >= 0) {
			this.y -= this.MOVEAMOUNT;
		}
		else if (direction == 'down' && this.y + this.RADIUS + this.MOVEAMOUNT <= world.height) {
			this.y += this.MOVEAMOUNT;
		}
	},
});

var Player = Actor.extend({
	init: function(xx, yy) {
		this._super(xx, yy);
	},
	move: function(e) {
		this._super(e);
		
		// Move the viewport.
		var offsets = world.getOffsets();
		if (offsets.x > 0 && this.x - offsets.x < canvas.width * this.MOVEWORLD) {
			world.xOffset = Math.max(offsets.x - this.MOVEAMOUNT, 0);
			context.translate(offsets.x - world.xOffset, 0);
		}
		else if (offsets.x < world.width - canvas.width && this.x - offsets.x > canvas.width * (1-this.MOVEWORLD)) {
			world.xOffset = Math.min(offsets.x + this.MOVEAMOUNT, world.width - canvas.width);
			context.translate(offsets.x - world.xOffset, 0);
		}
		if (offsets.y > 0 && this.y - offsets.y < canvas.height * this.MOVEWORLD) {
			world.yOffset = Math.max(offsets.y - this.MOVEAMOUNT, 0);
			context.translate(0, offsets.y - world.yOffset);
		}
		else if (offsets.y < world.height - canvas.height && this.y - offsets.y > canvas.height * (1-this.MOVEWORLD)) {
			world.yOffset = Math.min(offsets.y + this.MOVEAMOUNT, world.height - canvas.height);
			context.translate(0, offsets.y - world.yOffset);
		}
		
		if (debugMode) {
			console.log('Moving '+ direction +'; ('+ this.x +', '+ this.y +')');
		}
	},
});
