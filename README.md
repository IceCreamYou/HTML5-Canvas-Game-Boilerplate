This project makes starting an interactive 2D Canvas application fast and easy,
even for developers who have never used Canvas before. The goal is to let you
focus on your application's logic rather than low-level code that's the same
for every project.

The project includes a stripped-down version of
[HTML5 Boilerplate](https://github.com/h5bp/html5-boilerplate) and adds some
Canvas-specific boilerplate and JavaScript APIs that are useful for any game or
interactive application. This framework is particularly useful for
side-scrolling or top-down games.


Getting Started
---------------

Most interactive applications have just a few steps that occur in the inner
game loop:

 1. Move and check collision
 2. Draw

These things happen in the update() and draw() functions in main.js. Fill in
those functions with your application logic. Setup should go in the setup()
function. It's really that simple, and these functions already have comments
and some useful code filled in to demonstrate what you can do.

To learn how to use the different APIs and features available, check out the
[tutorial](http://www.isaacsukin.com/node/188). Or, take a look at the
"examples" folder to see how quickly and easily different games can be built.
The default project (which you can view by visiting index.html) provides a
player that can move around when a user presses the arrow keys on their
keyboard.


API
---

All of the code in this project is heavily documented inline, often including
usage examples and important notes. Rather than reproduce it all here, you
should read the inline documentation to get a better grasp on how to use the
tools this project provides. Below is an outline so you can see what is
available.

### Classes

The objects provided below are useful representations of a wide variety of
entities often found in interactive environments. Box, Actor, and Player use
[John Resig's "simple JavaScript inheritance" library](http://ejohn.org/blog/simple-javascript-inheritance/),
so you can extend them to create new classes with modified functionality. (Read
the link for examples of how to create and extend Classes.)

- Box: A box shape.
  - x, y: The coordinates of the upper-left corner of the Box
  - width, height: The width and height of the Box
  - radians: The angle at which to draw the Box, in radians.
  - src or fillStyle: The image file path or fill style with which to draw the
    Box
  - DEFAULT_WIDTH, DEFAULT_HEIGHT: The default dimensions for a new Box
  - draw(): Draw the Box
  - drawDefault(): Draw what a class should look like by default, when the
    "src" attribute has not been set. This is useful to avoid overriding the
    entire draw() method for new classes.
  - drawBoundingBox(): Draw the bounding box
  - xC(), yC(): Get the coordinates of the center of the Box
  - collides(): Detect whether this box intersects another Box, Collection, or
    TileMap, and return the first item it intersects with.
  - overlaps(), overlapsX(), overlapsY(): Detect whether this box intersects
    another Box
  - isHovered(): Detect whether the mouse is hovered over this Box
  - listen(): Listen for events
  - once(): Listen for events (and only react the first time one is triggered)
  - unlisten(): Stop listening for events
  - destroy(): Trigger a reaction when the Box is destroyed
- Collection: A container to keep track of multiple Boxes.
  - draw(): Draw everything in the Collection
  - overlaps(): Detect whether any item in the Collection intersects a Box
  - execute(): Execute a function on every item in the Collection
  - executeMethod(): Execute a specified method of every item in the Collection
  - add(): Add an item to the Collection
  - concat(): Add every item in an array of items to the Collection
  - combine(): Add the items from another Collection to this one
  - remove(): Remove an item from the Collection
  - removeLast(): Remove and return the last item in the Collection
  - removeAll(): Remove all items in the Collection
  - getAll(): Get an array of all items in the Collection
  - count(): Get the number of items in the Collection
- TileMap: A utility for rapidly initializing and manipulating grids of tiles.
  - draw(): Draw all the tiles.
  - getCell(): Get a specific tile.
  - setCell(): Set a specific tile.
  - clearCell(): Clear a specific tile.
  - getAll(): Get an array of all active tiles.
  - getCellsInRect(): Get an array of all active tiles within a certain area.
    This defaults to getting only the visible tiles, which is great for
    efficency and useful for drawing. Often you may want to just get tiles near
    an Actor, for example for efficient collision checking.
  - clearAll(): Clear all tiles.
  - getRows(): Get the number of rows in the grid.
  - getCols(): Get the number of columns in the grid.
  - execute(): Execute a function on every element in the TileMap.
- Sprite, SpriteMap: Manage sprites. These classes are provided by a library
  maintained separately with its own
  [documentation](https://github.com/IceCreamYou/Canvas-Sprite-Animations).
- World: The complete playable game area.
  - width, height: The width and height of the playable area (in pixels)
  - getOffsets(): Get the difference between the viewport and the World origin
  - resize(): Change the size of the world
  - centerViewportAround(): Center the viewport around a specific location.
  - isInView(): Determines whether a Box descendent is inside the viewport
  - isInWorld(): Determines whether a Box is inside the world's boundaries
- Layer: An intermediate graphics layer (useful for drawing performance).
  - context: The graphics context for this Layer. Draw other objects onto it
  - draw(): Draw this Layer onto the main canvas
  - clear(): Clear this Layer
- Timer: A timer.
  - start(): Start the Timer
  - stop(): Stop the Timer
  - getElapsedTime(): Get the amount of time the Timer has been running (in
    seconds).
  - getDelta(): Get the amount of time since the last update (in seconds)
- Actor: A Box that moves.
  - move(): Move the Actor
  - collideSolid(): Check collision with solids (e.g. walls and floors) and
    adjust the Actor's position as necessary. Note that if the "solid" you are
    checking collision against is a TileMap, it will check all non-empty tiles
    by default. If you have a large map and performance is an issue, often what
    you really want is just to check tiles in a certain area around the Actor,
    which you can do using the TileMap's getCellsInRect() method.
  - moveOutside(), moveOutsideX(), moveOutsideY(): If an Actor is overlapping
    another Box, adjust it away so it stops overlapping. Usually this
    adjustment is taken care of for you, but you may need to use it if you
    implement custom collision.
  - isMoveAllowed(): Checks whether the Actor moved through a solid object and
    optionally corrects this if it happened. This is almost always unnecessary.
    It may be useful if you have very fast moving objects and very thin solids,
    which could create a situation where the distance the moving Actor travels
    during each simulated update may be larger than the size of the solid. This
    method corrects for that issue.
  - startFalling(), stopFalling(): Notify the Actor that it is or is not
    standing on the ground. Usually this is taken care of for you.
  - isInAir(), isJumping(), isFalling(), hasAirMomentum(): Checks various
    conditions related to jumping (when gravity is enabled).
  - updateAnimation(): Change which animation sequence to use if the Actor is
    using a SpriteMap. Override this if you want to implement custom mechanics;
    it is called automatically from update().
  - setDraggable(): Toggle whether the Actor can be dragged around by the
    mouse.
  - release(): Notify the Actor that a direction is no longer being given. This
    is usually not necessary.
  - Actors also have several properties that control their movement. You can
    change these constants globally directly in the Actor class or individually
    for each Actor instance. Of note:
    - MOVEAMOUNT controls the Actor's speed in pixels per second.
    - CONTINUOUS_MOVEMENT controls whether the Actor should always keep moving
      in the last direction specified (like Pac-Man).
    - STAY_IN_WORLD controls whether the Actor is forced to stay within the
      boundaries of the world. (The main reason to disable this is if you want
      to let objects travel off-screen and then destroy them. Use
      world.isInWorld() to detect whether an object is within the world's
      boundaries.)
    - GRAVITY enables downward acceleration (effectively switching between
      top-down and side-scrolling environments). If gravity is enabled, many
      more properties take effect:
      - G_CONST: The "strength" of the gravity (i.e. amount of acceleration)
      - JUMP_VEL: Jump velocity (controls jump height)
      - JUMP_DELAY: The amount of time required between successive jumps. This
        is particularly useful if multi-jumps are enabled.
      - MULTI_JUMP: The number of times a player can jump without touching the
        ground.
      - AIR_CONTROL: Affects players' ability to change direction mid-air
      - JUMP_RELEASE: After jumping, whether Actors must press the Jump button
        again before jumping a second time (as opposed to holding it down).
        When MULTI_JUMPs are disabled, this prevents "bouncing" (jumping
        immediately after touching the ground). This is strongly recommended
        for Players, but if it is enabled for other Actors, be sure to manually
        release() the jump button.
- Player: An Actor that is controlled by the user (via the keyboard by
  default). Players' MOVEWORLD property controls how close to the edge the
  player must be in order for the viewport to scroll, assuming the world is
  bigger than the canvas and mouse scrolling is disabled; it represents a
  fractional percentage [0.0-0.5) of the width of the canvas such that if the
  player is within this percent of the edge of the canvas the viewing area
  attempts to scroll. The default is 0.45 (45%).

### Magic Functions

These functions are called automatically when necessary and your job is simply
to fill in the game logic. Example implementations are provided in main.js.

- update(): Fill out the implementation in main.js to update the objects in
  your world.
- draw(): Fill out the implementation in main.js to draw all the objects and
  layers onto the main canvas.
- setup(): Fill out the implementation in main.js to set up the objects that
  should populate your world. This runs after images have been pre-loaded but
  immediately before animation starts. Return false to start the animation
  manually. Has one parameter, a Boolean which indicates whether this is the
  first time setup() has run or whether the game is starting over (this only
  matters if you use App.gameOver() to end the game).

### Utility Functions

- startAnimating(): Start animating.
- stopAnimating(): Stop animating.
- console.throttle(): Periodically log a message to the JavaScript console.
    This is useful for logging things in loops; it avoids being overwhelmed by
    an unstoppable barrage of similar log messages. If you want more helpers
    like this, check out
    [console-extras.js](https://github.com/unconed/console-extras.js).

### Extended Methods

*CanvasRenderingContext2D.prototype.drawImage()* is enhanced in order to be
able to draw any kind of image while utilizing the image cache for performance.
(CanvasRenderingContext2D is the canvas graphics object type.) Specifically, it
can accept any of the following as its first parameter:

 - The file path of an image to draw
 - A Sprite or SpriteMap object
 - A Layer object
 - An HTMLCanvasElement
 - An HTMLImageElement (same thing as an Image)
 - An HTMLVideoElement

Additionally, some wrapper methods were added to existing JavaScript classes
for simplicity:

- CanvasRenderingContext2D.prototype.clear(): Clear the canvas.
- CanvasRenderingContext2D.prototype.drawPattern(): Draw a pattern using the
  image and pattern caches for performance. This method can accept all the same
  kinds of images that drawImage() can, except Sprites and SpriteMaps, as the
  source for the pattern.
- CanvasRenderingContext2D.prototype.circle(): Draw a circle.
- CanvasRenderingContext2D.prototype.drawCheckered(): Draw a checkerboard
  pattern.
- Array.prototype.remove(): Remove an item from the array by value.
- Number.prototype.round(): Round a number to a specified precision (number of
  digits after the decimal).
- Number.prototype.sign(): Get the sign of a number (returns 1 if the number is
  greater than zero, -1 if it's less than zero, and 0 [zero] if it's equal to
  zero.)

### Events

All custom events are triggered on the document:

- start: Triggered after everything is set up and immediately after animation
  begins. Useful for stopping animation (for example, if the user needs to
  press a "start" button first) or for running some kind of intro graphics. 
- resizeWorld: Triggered when the world object is resized. Useful for allowing
  objects to resize or reposition themselves.
- canvasdragstart, canvasdragstop: Triggered when an Actor begins and ends
  being dragged by the mouse, respectively.
- mousescrollon, mousescrolloff: Triggered when the viewport starts and stops
  scrolling, respectively. Useful for pausing animation or displaing something
  while the viewport is moving.

Objects in a Canvas are not represented in the DOM and so they don't benefit
from the traditional JavaScript event model. A similar replacement event system
is provided so you don't have to worry about this problem. Specifically, the
Box class provides the listen(), once(), and unlisten() methods to bind and
unbind event handlers. The following events are available:

- mousedown/mouseup/click/touchstart/touchend: These events are automatically
  delegated to the Box event listeners.
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
    (The jQuery.hotkeys library automatically converts keys from their textual
    descriptions like "ctrl+a down" to their semantic meaning.)
  - jQuery.hotkeys.keysDown always contains the keys that are currently being
    pressed. If you bind on key events the pressed keys are available in
    event.keyPressed.
  - jQuery.hotkeys.lastKeyPressed(): Get the last key that was pressed.
    Alternatively, examine jQuery.hotkeys.lastKeysPressed for the last 5 keys
    that were pressed.
  - Some keyboard input is automatically handled by default. For example,
    out of the box, the Player moves around using the arrow keys or WASD to
    indicate the direction in which to move. You can change which keys are
    mapped to different directions by changing the "keys" map in main.js.
- Storage: App.storage provides an easier interface to localStorage where you
  don't have to worry about the types of values you're putting in and getting
  out. Has basically the same methods as localStorage: get(), set(), remove(),
  clear(), length(), and key().
- Visibility: By default, animation stops when the tab or window loses focus.
  If you don't want this behavior, just call $(window).off(".animFocus");
  If you want to handle visibility and animation more comprehensively yourself,
  consider using [visibility.js](https://github.com/ai/visibility.js) to help
  detect whether the page is visible.
- Automatic canvas resizing: by default the canvas is resized according to the
  following rules, in order of precedence:
  - If the canvas element has data-resize="false" set on it, it will be sized
    according to the CSS rules and "width" and "height" attributes only. (Note
    that using CSS to resize the canvas causes it to scale everything inside
    rather than just creating a larger canvas.)
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
  - In all cases except when data-resize="false" the data-aspectratio attribute
    takes effect if present. This causes the canvas to resize to the largest
    possible size within the boundaries of the size calculated from the other
    rules, while still maintaining the specified aspect ratio. The value of
    this attribute can be any floating point number or one of the common ratios
    "4:3", "16:9", "16:10", or "8:5".
- Automatic world resizing: Specify the data-worldwidth and data-worldheight
  attributes (in pixels) on the canvas element to automatically resize the
  world to a certain size.

### Global Variables

These variables are provided globally for ease of reference. player, keys, and
preloadables are defined in main.js; everything else is defined in utilities.js

- player: The Player object.
- keys: A map of which keys indicate different directions.
- preloadables: An array of image file paths to pre-load before displaying
  the application.
- canvas: The DOM canvas object.
- $canvas: A jQuery object representing the canvas.
- context: A canvas graphics object for the main canvas.
- world: The environment in which everything on the canvas operates.
- Caches: A set of caches for different resources.
  - images: A map from image paths to the corresponding Image objects.
  - imagePatterns: A map from image paths to corresponding pattern
    objects.
  - preloadImages(): Pre-load a set of images, saving them to the cache. This
    is useful to avoid images popping in after animation starts.
- mouse: An object representing the mouse, with a few helpful properties:
  - coords: An object with "x" and "y" properties representing the current
    coordinates of the mouse relative to the canvas. You should never need to
    worry about this unless you are explicitly tracking the mouse as it moves
    because click, hover, and drag events are handled for you.
  - scroll: An object that controls mouse scrolling. Properties and methods
    include:
    - enable(), disable(): Turn mouse scrolling on and off, respectively. When
      mouse scrolling is on, player scrolling is disabled.
    - isEnabled(): Determine whether mouse scrolling is on or off.
    - isScrolling(): Determine whether the viewport is currently being scrolled
      by the mouse.
    - setThreshold(), getThreshold(): Set and retrieve the threshold that
      determines how close to the edge of the canvas the user's mouse must be
      in order to scroll the viewport. This threshold is a fractional
      percentage [0.0-0.5) of the width of the canvas; if the mouse is within
      this percent of the edge of the canvas, the viewport attempts to scroll.
      The default is 0.2 (20%).
    - setScrollDistance(), getScrollDistance(): Set and retrieve the distance
      the viewport can scroll each second, in pixels. Defaults to 350.
- App: A set of variables and functions that are mostly for internal use, but
  there are a few exceptions. App.Events and App.Utils will be turned into the
  globals Events and Utils, respectively, if those names are not already taken
  when the page finishes loading (but before setup() runs). Events are covered
  in the Events section further down in this document, but other helpful items
  that belong to the App object include:
  - App.Utils.percentToPixels(): Convert a percent to a pixel position.
  - App.Utils.getRandBetween(): Get an arbitrary random number between two
    other numbers.
  - App.Utils.getRandIntBetween(): Get a random integer between two numbers.
  - App.Utils.anyIn(): Check if any of the elements in an array are found in
    another array.
  - App.Utils.almostEqual(): Determine whether two numbers are equal to each
    other with an acceptable amount of error (i.e. if they are within a small
    delta of each other).
  - App.Utils.randomString(): Get a random URL-safe string of arbitrary length.
    Useful for generating unique IDs.
  - App.Utils.positionOverCanvas(): Position a DOM element over the canvas.
    Useful for placing forms, text, menus, and other UI elements that are more
    easily handled in HTML.
  - App.gameOver(): End the game, display "GAME OVER," and allow clicking the
    canvas to restart the game.
  - App.setDefaultCanvasSize(): Resizes the canvas. This is called
    automatically when the canvas is initialized, so you can override it to
    change the sizing behavior.
  - App.preventDefaultKeyEvents(): Prevent key combinations from having their
    usual effect so key presses can be used for other purposes. For example,
    often you might want the up and down keys to be used for directing the
    player rather than scrolling up and down the page. Keys specified using the
    "keys" variable are automatically passed to this function.
  - App.debugMode: Set to true to print debugging information. Specifically,
    performance information will be logged to the console when animation stops
    (this happens by default when the tab or window loses focus).
  - App.timer.lastDelta: The amount of time (in seconds) elapsed since the last
    animation frame. Useful for specifying how far different entities should
    move in order to make movement smooth and consistent over time.

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
 - [Sticky.js](https://github.com/alexmng/sticky/): Provides a more thorough
   alternative to the App.storage localStorage wrapper.
 - [Box2D](https://github.com/kripken/box2d.js/): A physics library ported from
   C++ using Emscripten.
 - [BigScreen](https://github.com/bdougherty/BigScreen): Makes it easy to go
   full-screen.
 - [History.js](https://github.com/balupton/history.js): Handle refreshless URL
   updates. This can allow storing information in the URL, which could allow
   e.g. linking directly to in-game content.


Notes
-----

Before deploying to production, there are a few things you may want to do:

 - Set the title in the title tag.
 - Set the meta description in the document head.
 - Put a favicon.ico and apple-touch-icon.png file in the root directory.
 - Add a [humans.txt file](http://humanstxt.org/) and uncomment the rel=author
   tag in the document head.
 - Modify [robots.txt](http://www.robotstxt.org/) to fit your site's
   requirements.
 - Create custom error pages (404, 500, etc.) and modify .htaccess to use them
   (search for "404 page").
 - Add the rules in .caching.htaccess into .htaccess and delete
   .caching.htaccess. These are separated by default to ease development.

To maximize performance, draw complex collections of things onto different
Layers that do not need to be updated every frame, and then simply draw the
Layer itself onto the main graphics context in the draw() function. You can
group elements onto the same Layer if they change with similar frequency. This
performance tip is especially true for drawing text, because text renders very
slowly (technically, canvas has no glyph cache so the letters have to be
re-kerned on every draw).

Contributions are welcome!


Compatibility
-------------

Officially supported in Firefox 16+, Chrome 22+, IE9+, Safari 5+.

Probably works in Firefox 3.6+, Chrome 9+, IE9+, Safari 5+, Opera 11+,
iOS Safari, Android.


Author
------

Isaac Sukin

 - [Contact](http://www.isaacsukin.com/contact)
 - [Github](https://github.com/IceCreamYou)
 - [Twitter](https://twitter.com/IceCreamYou)

I'd love to hear what you make!
