This project includes a minimal set of useful code for a standards-compliant,
interactive 2D Canvas project, with the goal of allowing developers to focus
on their application rather than on Canvas. This means:

 - Starting a Canvas application should be fast and easy, even for developers
   who have never used Canvas before. Many applications should only need small
   modifications to index.html, main.js, and main.css.
 - Additionally, developing a Canvas application should be fast and easy
   through taking advantage of useful APIs. To this end, many helpful tools are
   provided for uses that are especially common in Canvas applications. (Many
   aspects of the code were written with games in mind, but the code should
   be useful for any interactive 2D Canvas project.)


Getting Started
---------------

To see a minimal example of what is available by default, you can visit
index.html by either opening the file or viewing it on a server. By default you
will have a "player" represented by a smiley face that can move around when a
user presses the arrow keys on their keyboard. The default "world" in which the
player can move around will be larger than the canvas itself, so you'll notice
that the viewport will scroll as the player approaches its edges.

To customize your project you should usually start by personalizing index.html:

 - Set the title in the <title> and <h1> tags as well as the copyright notice
   in the footer.
 - Set the meta description in the document head.
 - Put a favicon.ico and apple-touch-icon.png file in the root directory.

Now you can get started developing. Put custom styles in main.css. Most of your
effort will likely be focused on main.js.

Most interactive applications have just a few steps that occur in the inner
game loop:

 1. Move
 2. Check collision
 3. Draw

main.js is set up with this structure in mind, where the first two steps should
go in the magic function update() and the last step should go in the magic
function draw(). Setup should go in setup() at the bottom. It's really that
simple, and these functions already have comments and some useful code filled
in to demonstrate what you can do.


API
---

All of the code in this project is heavily documented inline, often including
usage examples and important notes. Rather than reproduce it all here, you
should read the inline documentation to get a better grasp on how to use the
tools this project provides. Below is an outline so you can see what is
available.

### Global Variables

These variables are provided globally for ease of reference. preloadables and
bgLayer are defined in main.js and player is defined in actors.js; everything
else is defined in utilities.js.

- preloadables: An array of image file paths to pre-load before displaying
  the application.
- bgLayer: A default background Layer (see below for more on Layers).
- App: A set of variables and functions that you mostly shouldn't need to
  touch, but there are a few useful features:
  - App.Utils.percentToPixels(): Convert a percent to a pixel position.
  - App.Utils.getRandBetween(): Get a random integer between two numbers.
  - App.Utils.keys(): Get the keys of an object as an array.
  - App.debugMode: Set to true to print debugging information. Specifically,
    performance information will be logged to the console when animation stops
    (this happens by default when the tab or window loses focus).
  - App.timer.lastDelta: The amount of time (in seconds) elapsed since the last
    animation frame. Useful for specifying how far different entities should
    move in order to make movement smooth and consistent over time.
- canvas: The DOM canvas object.
- $canvas: A jQuery object representing the canvas.
- context: A canvas graphics object for the main canvas.
- world: The environment in which everything on the canvas operates.
- mouseCoords: An object with "x" and "y" properties representing the current
  coordinates of the mouse relative to the canvas. You should never need to
  worry about this unless you are explicitly tracking the mouse as it moves
  because click and hover events are handled for you.
- Caches: A set of caches for different resources.
  - Caches.images: A map from image paths to the corresponding Image objects.
  - Caches.imagePatterns: A map from image paths to corresponding pattern
    objects.
- player: The Player object.

### Classes

This project uses [John Resig's "simple JavaScript inheritance" library](http://ejohn.org/blog/simple-javascript-inheritance/)
to provide standard, extendable classes with constructors and inheritance. Read
the link for examples of how to take advantage of it. The classes provided
below are useful representations of a wide variety of entities often found in
interactive environments.

- Box: A box shape.
  - x, y: The coordinates of the upper-left corner of the box
  - width, height: The width and height of the box
  - src or fillStyle: The image file path or fill style with which to draw the
    box
  - draw(): Draw the box
  - drawBoundingBox(): Draw the bounding box
  - xC(), yC(): Get the coordinates of the center of the box
  - overlaps(): Detect whether this box intersects another box
  - isHovered(): Detect whether the mouse is hovered over this box
  - listen(): Listen for events
  - once(): Listen for events (and only react the first time one is triggered)
  - unlisten(): Stop listening for events
- Collection: A container to keep track of multiple Boxes.
  - draw(): Draw everything in the collection
  - overlaps(): Detect whether any item in the collection intersects a box
  - execute(): Execute a specified method on every item in the collection
  - add(): Add an item to the collection
  - concat(): Add an array of items to the collection
  - combine(): Add the items from another collection to this one
  - remove(): Remove an item from the collection
  - removeLast(): Remove and return the last item in the collection
  - removeAll(): Remove all items in the collection
  - count(): Get the number of items in the collection
- World: The complete playable game area.
  - width, height: The width and height of the playable area (in pixels)
  - getOffsets(): Get the difference between the viewport and the world origin
  - resize(): Change the size of the world
- Layer: An intermediate graphics layer (useful for drawing performance).
  - context: The graphics context for this layer. Draw other objects onto it
  - draw(): Draw this layer onto the main canvas
  - clear(): Clear this layer
- Timer: A timer.
  - start(): Start the timer
  - stop(): Stop the timer
  - getElapsedTime(): Get the amount of time the timer has been running (in
    seconds)
  - getDelta(): Get the amount of time since the last update (in seconds)
- Actor: A Box that moves.
  - move(): Move the actor
- Player: An Actor that is controlled by the user (via the keyboard by default).
- Sprite, SpriteMap: Manage sprites. These classes are provided by a library
  maintained separately with its own
  [documentation](https://github.com/IceCreamYou/Canvas-Sprite-Animations).

### Magic Functions

These functions are called automatically when necessary and your job is simply
to fill in the game logic. Example implementations are provided in main.js.

- update(): Fill out the implementation in main.js to update the objects in
  your world.
- draw(): Fill out the implementation in main.js to draw all the objects and
  layers onto the main canvas.
- setup(): Fill out the implementation in main.js to set up the objects that
  should populate your world.

There are a few more optional (and usually irrelevant) magic functions that you
can implement if you need to do so:

- setDefaultCanvasSize(): Create your own rules for automatic canvas resizing.
- getImageFromCache(): Override this to use an alternate image cache for
  sprites.
- saveImageToCache(): Override this to use an alternate image cache for
  sprites.

### Utility Functions

- startAnimating(): Start animating.
- stopAnimating(): Stop animating.
- preloadImages(): Pre-load an array of images.
- preventDefaultKeyEvents(): Prevent key combinations from having their usual
  effect so key presses can be used for other purposes. For example, often you
  might want the up and down keys to be used for directing the player rather
  than scrolling up and down the page.

### Extended Methods

Some wrapper methods were added to existing JavaScript classes for simplicity.
(CanvasRenderingContext2D is the canvas graphics object type.)

- CanvasRenderingContext2D.prototype.clear: Clear the canvas.
- CanvasRenderingContext2D.prototype.drawLoadedImage: Draw any kind of image --
  an Image object, a file path, a Sprite or Spritemap, etc. -- utilizing the
  image cache for performance. Most applications will use this heavily.
- CanvasRenderingContext2D.prototype.drawLoadedPattern: Draw a pattern using
  the pattern cache for performance.
- CanvasRenderingContext2D.prototype.circle: Draw a circle.
- Array.prototype.remove: Remove an item from the array by value.
- Array.prototype.getRandomElement: Get a random element from the array.

### Events

One custom event is provided:

- resizeWorld: Triggered on the document when the world object is resized in
  order to allow other objects to resize or reposition themselves.

Objects in a Canvas are not represented in the DOM and so they don't benefit
from the traditional JavaScript event model. A similar replacement event system
is provided so you don't have to worry about this problem. Specifically, the
Box class provides the listen(), once(), and unlisten() methods to bind and
unbind event handlers.

- mousedown/mouseup/click: These events are automatically delegated to the Box
  event listeners.
- mouseover/mouseout/hover: Explicit notification of these events is not
  provided, but detecting them is easy: use the isHovered() method of the Box
  class to determine whether the mouse is hovering over the current Box.
- Custom events: If you want to add your own events for Boxes, you can trigger
  them using App.Events.trigger(). You should add a method to
  App.Events.Behaviors for each custom event you create in order to determine
  for which objects the event is applicable.

### Wrappers and Automatic Handlers

- There are several easy ways to handle **keyboard input**:
  - jQuery.hotkeys.areKeysDown(): Check if certain keys are currently being
    held down. You can also just bind directly to key event combinations by
    using e.g. $(selector).keypress('ctrl+a down', function(event) { });
  - jQuery.hotkeys.keysDown always contains the keys that are currently being
    pressed. If you bind on key events the pressed keys are available in
    event.keyPressed.
  - jQuery.hotkeys.lastKeyPressed(): Get the last key that was pressed.
    Alternatively, examine jQuery.hotkeys.lastKeysPressed for the last 5 keys
    that were pressed.
- jQuery.store: An easier interface to localStorage where you don't have to
  worry about the types of values you're putting in and getting out. Has
  basically the same methods as localStorage: get(), set(), remove(), clear(),
  length(), and key().
- Visibility: By default, animation stops when the tab or window loses focus.
  If you don't want this behavior, just call $(window).off(".animFocus");
- Automatic canvas resizing: by default the canvas is resized according to the
  following rules, in order of precedence:
  - If the canvas element has data-resize="false" set on it, it will be sized
    according to the CSS rules only.
  - If the canvas element has data-resize="full" set on it, it will be resized
    to the maximum size that fits within the browser window.
  - If the "width" and "height" attributes are set on the canvas element, it
    is set to that size.
  - If the canvas element has data-minwidth and data-minheight attributes (with
    values in pixels) it will not be scaled smaller than those dimensions.
  - If the canvas element has data-maxwidth and data-maxheight attributes (with
    values in pixels) it will not be scaled larger than those dimensions.
  - The canvas will scale to the largest size that fits within both the window
    and the max attributes.
- Automatic world resizing: Specify the data-worldwidth and data-worldheight
  attributes (in pixels) on the canvas element to automatically resize the
  world to a certain size.

### CSS

Put your application's primary styles in main.css and responsive styles for
different types and sizes of screens in media.css. print.css will kick in
automatically when the page is being printed. reset.css normalizes styles
across browsers to sensible defaults. utilities.css provides some helpful
classes to use in your markup, courtesy of H5BP:

- ir: For image replacement
- hidden: Hide from screen readers and browsers
- visuallyhidden: Hide visually, but leave accessible to screen readers
- invisible: Hide from screen readers and browsers, but maintain layout
- clearfix: Contain floats


Additional Useful Libraries
---------------------------

These libraries have not necessarily been tested with this project.

 - [Visibility.js](https://github.com/ai/visibility.js): Makes it easy to
   determine whether the page is visible to the user, which is useful for
   controlling how your project behaves while it is in the background.
 - [PathFinding.js](https://github.com/qiao/PathFinding.js): Easily compute
   efficient paths from one place to another for your AI.
 - [SoundJS](https://github.com/CreateJS/SoundJS): Manage your audio resources.
 - [PreloadJS](https://github.com/CreateJS/PreloadJS): If you need to pre-load
   any resources other than images, PreloadJS is a good bet (the built-in image
   caching is fine otherwise).


Notes
-----

Before deploying to production, there are a few things you may want to do:

 - Add a [humans.txt file](http://humanstxt.org/) and uncomment the rel=author
   tag in the document head.
 - Modify [robots.txt](http://www.robotstxt.org/) to fit your site's
   requirements.
 - Create custom error pages (404, 500, etc.) and modify .htaccess to use them
   (search for "404 page").
 - Add the rules in .caching.htaccess into .htaccess and delete
   .caching.htaccess. These are separated by default to ease development.

There are also a few pitfalls you should be aware of:

 - If you want to draw text directly onto the canvas, you should first draw it
   onto its own Layer and then draw that Layer onto the canvas in the main.js
   draw() function. This is because text renders very slowly (technically,
   canvas has no glyph cache so the letters have to be re-kerned on every draw)
   so it is effectively faster to draw an image with text on it than to draw
   the text itself. This project does not provide a wrapper function for doing
   this because there are a very large variety of factors that can affect text
   placement (shadows, fill and stroke styles, font sizes and families,
   baselines, etc.) so it usually makes more sense to work with text directly.

Contributions via pull request are welcome. Contributions will be held to the
same standard of code style and documentation as existing code.


Author
------

Isaac Sukin
http://www.isaacsukin.com/contact
https://github.com/IceCreamYou
https://twitter.com/IceCreamYou

I'd love to hear what you make!
