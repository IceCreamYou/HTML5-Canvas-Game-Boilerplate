This library is written by Isaac Sukin (http://www.isaacsukin.com/). It is
available at https://github.com/IceCreamYou/HTML5-Canvas-Game-Boilerplate.

This library is licensed under the GPLv2:
https://www.gnu.org/licenses/gpl-2.0.html
However, I'd appreciate it if you didn't use it for commercial purposes without
contacting me at http://www.isaacsukin.com/contact. Even if you're not using it
for commercial purposes, I'd still love to hear what you made with it.


=======
 ABOUT
=======

This project has two goals:

 - Speed up the process of beginning a new HTML5 Canvas application, even for
   people who have never written a Canvas application before
 - Provide useful APIs that makes writing typical animated Canvas applications
   faster and easier

To this end, most of the low-level setup is performed automatically. Helpful
objects and wrapper functions are available for uses that are particularly
common especially in games.


=================
 GETTING STARTED
=================

Typically the first step of a new project will be to change the title of the
HTML page itself. As noted in the comments in index.html, the template provided
is intended to be minimal, and you may want to add more to the page; see
https://github.com/h5bp/html5-boilerplate for suggestions. All you need for
this library to work is the JavaScript files and a <canvas> element, and that
is pretty much all the default index.html gives you.

Most of your application logic should go in main.js. The comments there should
help you figure out what to do, but basically you should simply adjust the
update(), draw(), and setup() functions to move, draw, and set up actors in
your application environment, respectively. Documentation on setting up objects
is below.

In most cases you should not need to change the code in the other JavaScript
files. However, I recommend reading the code so that you have a better sense of
how it all works. It should be fairly straightforward to understand, and the
code is well-documented. Important functionality this library provides is also
documented below.

===========
 UTILITIES
===========

utilities.js sets up everything needed for animation to work and provides a
number of useful extensions to the Canvas API as well as container objects for
manipulating the canvas world.

-- MAGIC VARIABLES

 - canvas: The "canvas" variable holds the actual <canvas> DOM element.
 - context: The "context" variable holds the graphics context for the canvas.
   At the lowest level, this is used to draw everything onto the canvas.
 - $canvas: The jQuery object holding the <canvas> element.
 - mouseCoords: The "x" and "y" properties correspond to the x- and y-
   coordinates of the mouse relative to the upper-left corner of the canvas.
 - world: An instance of the World class representing the total playable game
   area. This class is explained more below.

-- FUNCTIONS

 - startAnimating(): Starts animating the canvas. main.js calls this by default
 - stopAnimating(): Stops animating the canvas.
 - preventDefaultKeyEvents(keys): Pass a string like "up down ctrl+a" to ignore
   the default browser actions for these key combinations canceled.
 - percentToPixels(percent): Pass a percent (usually 0-100) and get back an
   object whose "x" and "y" properties correspond to the pixel at that percent
   in the world. For example, if the world is 100x100 pixels, calling
   percentToPixels(10) will return { x: 10, y: 10 }.
 - getRandBetween(lo, hi): Returns a random number between lo and hi, inclusive
 - Array.remove(item): Removes an item from an array by value.
 - Array.getRandomElement(): Returns a random element in an array.

-- CANVAS API EXTENSIONS

 - context.clear(fillStyle): Clears the canvas. If fillStyle is passed, fills
   the canvas with that style (fillStyle is typically a color like 'black' or
   '#333333'). This library calls this function automatically before drawing
   a new frame.
 - context.drawLoadedImage(src, x, y, w, h): Draws an image onto the canvas.
   Always use this instead of drawImage() to draw images from files. This
   function makes sure the image file is loaded before displaying it and then
   caches the image so it can be displayed again quickly.
 - context.fillGlyphs(text, x, y, options): Draws cached text. This function is
   useful if you need to display text in a layer that needs to be refreshed
   frequently, for example if you need the text to move. However, the Canvas
   API doesn't offer sufficient tools to get the measurement and positioning of
   the hidden helper canvas perfectly correct with reasonable performance. For
   this reason, you may be better off using fillText() instead and drawing your
   text onto a custom layer for maximum control.
 - context.circle(x, y, r, fillStyle, strokeStyle): Draws a circle onto the
   canvas.

-- CLASSES

  A short explanation of each class is given here, but you should look at each
  class in utilities.js to learn their methods. They are all either
  well-documented or self-documenting. An explanation of what "class" really
  means in this context is given below in the CLASSES section.

 - Box: A rectangular shape. Many other classes inherit from this.
 - Collection: A convenient container to keep track of multiple Box-like items.
 - World: Represents the complete playable game area.
 - Layer: A section of a scene. Layers are like having multiple canvases
   stacked on top of each other. This allows for efficient rendering of complex
   scenes by essentially caching parts of the scene that are grouped together.
   For example, a background layer is provided in main.js by default, where all
   the static background entities are drawn. This means the background only
   needs to be renered once and can then be drawn completely onto the main
   canvas in each frame. This can significantly speed up animation.
 - Zone: A Zone is a Box with an update() function. Use the update() function
   to detect when relevant events have occurred (such as the player or mouse
   entering the zone) and take appropriate action.


========
 ACTORS
========

actors.js provides 3 classes that will be particularly useful in game-style
environments.

 - Actor: Any distinct entity that can move in the canvas world. Actors have
   two methods:
   - draw(ctx): Draws the actor using the specified context. If the ctx
     parameter is omitted, draws the actor onto the main canvas. Set the
     src property to an image file path to draw the actor as an image;
     otherwise actors are rendered as smiley faces.
   - move(direction): Moves the actor in the specified direction. Supported
     directions are up, down, left, right, up+left, up+right, down+left,
     and down+right. Change the MOVEAMOUNT property to set how many pixels
     the actor will move each time this function is invoked. Actors cannot
     move outside of the World.
 
 - Player: An Actor controlled by the player. If a Player approaches the edge
   of the canvas and the World is larger than the canvas, the viewing area will
   scroll. Set MOVEWORLD to a decimal from 0 to 0.5 representing how close to
   the edge a player can get before the world will scroll.
 
 - Wall: A Box that supports "soft" collision, meaning other Boxes can
   partially overlap with those edges without being considered intersecting by
   the overlaps() method.

Most of the useful methods of these classes are inherited from the Box class.


=========
 CLASSES
=========

JavaScript uses a Prototype model instead of an Object-Oriented model, but
in many applications having inheritance is very useful. This library uses a
script written by John Resig (creator of jQuery) to support OOP. Documentation
on how to use it can be found at
http://ejohn.org/blog/simple-javascript-inheritance/ but here is an example
that should show the basics:

    var Animal = Class.extend({
      init: function(x, y) { // runs automatically when instantiated
        this.x = x;
        this.y = y;
      },
      walk: function() {
        x++;
        y++;
      },
    });
    var Dog = Animal.extend({
      init: function(x, y, color) {
        this._super(x, y);
        this.color = color;
      },
      say: function() {
        alert('Woof!');
      },
    });
    var lucky = new Dog(0, 0, 'brown');
    lucky.walk(); // lucky is now at (1, 1)
    lucky.say(); // Woof!


================
 KEYBOARD INPUT
================

This library provides a heavily modified version of the Hotkeys jQuery plugin
to support keyboard input. See the USAGE notes at the top of the
jquery.hotkeys.js file for information on how to use it.
