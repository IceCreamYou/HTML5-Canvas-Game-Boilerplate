This project makes starting an interactive 2D Canvas application fast and easy,
even for developers who have never used Canvas before. The goal is to let you
focus on your application's logic rather than low-level boilerplate code that's
the same for every project.

The project includes a stripped-down version of
[HTML5 Boilerplate](https://github.com/h5bp/html5-boilerplate) and adds some
Canvas-specific boilerplate and JavaScript APIs that are useful for any game or
interactive application. This framework is particularly useful for
side-scrolling or top-down games.


Getting Started
---------------

To get started building, open up
[main.js](https://github.com/IceCreamYou/HTML5-Canvas-Game-Boilerplate/blob/gh-pages/js/main.js).
There are three functions there which are the backbone of your application:

 - **update():** Update the objects in your world -- move them, calculate
   collision, etc.
 - **draw():** Draw all the objects and layers onto the main canvas.
 - **setup():** Set up the objects that should populate your world. This runs
   after images have been pre-loaded but immediately before animation starts.

These functions are called automatically for you. Just fill in the logic! To
see your project, open index.html in your browser.
[By default](http://icecreamyou.github.com/HTML5-Canvas-Game-Boilerplate/), it
has a keyboard-controlled player who can wander around. 

At this point you can dive in and start building right away, explore more
features, or dig deeper into the documentation:

 - **[API Overview (below)](https://github.com/IceCreamYou/HTML5-Canvas-Game-Boilerplate#api-overview)**
 - **[Full API Documentation](http://icecreamyou.github.com/HTML5-Canvas-Game-Boilerplate/docs/)**
 - **Walk-Through Guides** (coming soon!)
 - **Examples** (coming soon!): things you can build easily with this project
     - **Demo Applications:** see what full-scale projects are possible and how
       intuitive it is to make them
     - **Feature Examples:** see specific features in action and learn how to
       implement them


API Overview
------------

Below is an overview of the functionality this project provides. To read the
complete documentation for every function and class, view the
[full API documentation](http://icecreamyou.github.com/HTML5-Canvas-Game-Boilerplate/docs/).

### Classes

The objects provided below are useful representations of a variety of entities
often found in interactive environments. Box, Actor, and Player use
[John Resig's "simple JavaScript inheritance" library](http://ejohn.org/blog/simple-javascript-inheritance/),
so you can extend them to create new classes with modified functionality.

 - **[Class](http://icecreamyou.github.com/HTML5-Canvas-Game-Boilerplate/docs/#!/api/Class):**
   Supports OOP-style inheritance.
 - **[Box](http://icecreamyou.github.com/HTML5-Canvas-Game-Boilerplate/docs/#!/api/Box):**
   A box shape. This is the basic building block for most interactive entities.
   It has a size, position, orientation, and display, and it supports collision
   and various events.
 - **[Collection](http://icecreamyou.github.com/HTML5-Canvas-Game-Boilerplate/docs/#!/api/Collection):**
   A container to keep track of multiple Boxes. It has various helper methods
   to easily work with all the Boxes in the Collection, including batch
   drawing, collision checking, and other operations.
 - **[TileMap](http://icecreamyou.github.com/HTML5-Canvas-Game-Boilerplate/docs/#!/api/TileMap):**
   A utility for rapidly initializing and manipulating grids of tiles. This
   makes it easy to quickly lay out an environment and process the objects in
   it.
 - **[Sprite](http://icecreamyou.github.com/HTML5-Canvas-Game-Boilerplate/docs/#!/api/Sprite),
   [SpriteMap](http://icecreamyou.github.com/HTML5-Canvas-Game-Boilerplate/docs/#!/api/SpriteMap):**
   Manage sprite images for animation and convenient display. These classes are
   provided by a
   [library](https://github.com/IceCreamYou/Canvas-Sprite-Animations) by the
   same author.
 - **[World](http://icecreamyou.github.com/HTML5-Canvas-Game-Boilerplate/docs/#!/api/World):**
   The complete playable game area. Contains information about the environment
   and helpers for controlling the viewport.
 - **[Layer](http://icecreamyou.github.com/HTML5-Canvas-Game-Boilerplate/docs/#!/api/Layer):**
   An intermediate graphics layer (useful for drawing performance). Supports
   parallax scrolling.
 - **[Timer](http://icecreamyou.github.com/HTML5-Canvas-Game-Boilerplate/docs/#!/api/Timer):**
   A timer for all your timing needs.
 - **[Actor](http://icecreamyou.github.com/HTML5-Canvas-Game-Boilerplate/docs/#!/api/Actor):**
   Actors inherit from Boxes and add sophisticated built-in support for various
   kinds of movement. They also support mouse-draggability.
 - **[Player](http://icecreamyou.github.com/HTML5-Canvas-Game-Boilerplate/docs/#!/api/Player):**
   Players inherit from Actors and add support for control via user input
   (using the keyboard by default).

### Drawing

The normal canvas
[drawImage()](http://icecreamyou.github.com/HTML5-Canvas-Game-Boilerplate/docs/#!/api/CanvasRenderingContext2D-method-drawImage)
method is enhanced in order to be able to draw any kind of image while
utilizing the image cache for performance. Use it to draw any of the following:

 - The file path of an image
 - A Sprite or SpriteMap object
 - A Layer object
 - An HTMLCanvasElement
 - An HTMLImageElement (same thing as an Image)
 - An HTMLVideoElement

Or, just assign one of these things to the "src" attribute of a Box, Actor, or
Player instance to have its draw() method display the image.

### Events

A number of events are triggered on the
[document](http://icecreamyou.github.com/HTML5-Canvas-Game-Boilerplate/docs/#!/api/global),
on [Boxes](http://icecreamyou.github.com/HTML5-Canvas-Game-Boilerplate/docs/#!/api/Box),
and on [Actors](http://icecreamyou.github.com/HTML5-Canvas-Game-Boilerplate/docs/#!/api/Actor)
for various mouse, touch, drag-drop, and game events. You can also add your own
custom events.

Objects in a Canvas are not represented in the DOM and so they don't benefit
from the traditional JavaScript event model. A similar replacement event system
is provided so you don't have to worry about this problem. Specifically, the
Box class provides the listen(), once(), and unlisten() methods to
[bind and unbind event handlers](http://icecreamyou.github.com/HTML5-Canvas-Game-Boilerplate/docs/#!/api/Box-method-listen).

### Wrappers and Automatic Handlers

 - **Keyboard Input:** For many use cases, keyboard input is handled
   automatically via the "keys" object defined in main.js. You can also bind
   directly to key event combinations using natural descriptions of the keys:
   ```$(selector).keypress('ctrl+a down', function(event) { });```

   Other ways to handle keyboard input are described in the
   [documentation](http://icecreamyou.github.com/HTML5-Canvas-Game-Boilerplate/docs/#!/api/jQuery.hotkeys).
 - **Mouse Input:** Most mouse input can be handled by listening to mouse
   events on Box objects or by using the isHovered() instance methods. The
   mouse coordinates relative to the canvas are also available in
   [Mouse.coords](http://icecreamyou.github.com/HTML5-Canvas-Game-Boilerplate/docs/#!/api/Mouse-static-property-coords).
 - **Storage:**
   [App.Storage](http://icecreamyou.github.com/HTML5-Canvas-Game-Boilerplate/docs/#!/api/App.Storage)
   provides a wrapper for localStorage that allows storing any kind of object
   (not just strings).
 - **Visibility:** By default, animation stops when the tab or window loses
   focus. This reduces CPU impact when the app is not in view (and preserves
   your sanity if you are developing with the browser open in one window and
   your editor in another). If you don't want this behavior,
   ```$(window).off(".animFocus");``` will disable it.

 - **Automatic Canvas Resizing:** It is easy to make your canvas the size and
   shape you want by setting
   [various attributes](http://icecreamyou.github.com/HTML5-Canvas-Game-Boilerplate/docs/#!/api/App-static-method-setDefaultCanvasSize)
   on the &lt;canvas&gt; tag.
 - **Scrolling:** By default, if the world is bigger than the canvas, the
   viewport will scroll as the player approaches its edge. You can switch to
   scrolling the viewport with the mouse with
   [Mouse.Scroll](http://icecreamyou.github.com/HTML5-Canvas-Game-Boilerplate/docs/#!/api/Mouse.Scroll).
 - **Caching:** Images will be cached on the fly if necessary, or it's easy to
   pre-load them with the "preloadables" array in main.js. Pre-loading is
   recommended to avoid images "popping" into view on the canvas as they load.
   If you need to, you can manipulate the
   [Caches](http://icecreamyou.github.com/HTML5-Canvas-Game-Boilerplate/docs/#!/api/Caches)
   manually.

### Miscellany

 - **[Global Variables](http://icecreamyou.github.com/HTML5-Canvas-Game-Boilerplate/docs/#!/api/global):**
   Some frequently used variables, like player, canvas, context, and world, are
   provided globally for ease of reference.
 - **console.throttle(..., frequency[, logFunction]):** Log a message to the
   JavaScript console no more often than a specified rate. This is useful for
   logging things in loops since it avoids being overwhelmed by an unstoppable
   barrage of similar log messages. If you want more helpers like this, check
   out Steven Wittens'
   [console-extras.js](https://github.com/unconed/console-extras.js).
 - **Other Utilities:** A number of helper methods are available in
   [App](http://icecreamyou.github.com/HTML5-Canvas-Game-Boilerplate/docs/#!/api/App) and
   [App.Utils](http://icecreamyou.github.com/HTML5-Canvas-Game-Boilerplate/docs/#!/api/App.Utils),
   as well as several custom methods added to the default
   [Array](http://icecreamyou.github.com/HTML5-Canvas-Game-Boilerplate/docs/#!/api/Array),
   [Number](http://icecreamyou.github.com/HTML5-Canvas-Game-Boilerplate/docs/#!/api/Number), and
   [CanvasRenderingContext2D](http://icecreamyou.github.com/HTML5-Canvas-Game-Boilerplate/docs/#!/api/CanvasRenderingContext2D)
   classes.

### CSS

Put your application's primary styles in main.css and responsive styles for
different types and sizes of screens in media.css. print.css will kick in
automatically when the page is being printed. reset.css normalizes styles
across browsers to sensible defaults. utilities.css provides some helpful
classes to use in your markup.


Additional Useful Libraries
---------------------------

These libraries have not necessarily been tested with this project, but should
be compatible.

New functionality:

 - [PathFinding.js](https://github.com/qiao/PathFinding.js): Easily compute
   efficient paths from one place to another for your AI.
 - [SoundJS](https://github.com/CreateJS/SoundJS): Manage your audio resources.
 - [BigScreen](https://github.com/bdougherty/BigScreen): Makes it easy to go
   full-screen.
 - [History.js](https://github.com/balupton/history.js): Handle refreshless URL
   updates. This can allow storing information in the URL, which could allow
   e.g. linking directly to in-game content.

Enhanced functionality:

 - [Tween.js](https://github.com/sole/tween.js): Helps create smooth animated
   transitions.
 - [Box2D](https://github.com/kripken/box2d.js/): Provides more comprehensive
   physics support than the mechanics built in to the Actor class.
 - [PreloadJS](https://github.com/CreateJS/PreloadJS): If you need to pre-load
   any resources other than images, PreloadJS is a good bet (the built-in image
   caching is fine otherwise).
 - [Sticky.js](https://github.com/alexmng/sticky/): Provides a more thorough
   alternative to the App.Storage localStorage wrapper.
 - [Visibility.js](https://github.com/ai/visibility.js): Provides more
   comprehensive support for determining whether the page is visible to the
   user than is provided by default. This is useful for controlling how your
   project behaves while it is in the background.


Notes
-----

Before deploying to production, there are a few things you may want to do:

 - Set the title and meta description in the document head.
 - Put a favicon.ico and apple-touch-icon.png file in the root directory.
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
re-kerned on every draw). Additionally, for very large worlds, you may want to
track things in a TileMap because TileMaps have support for retrieving objects
within a certain area. You can use this functionality to quickly process only
objects in or near the viewport e.g. for collision, updating, or drawing.

Contributions are welcome!


Compatibility
-------------

Officially supported in Firefox 16+, Chrome 22+, IE9+, Safari 5+.

Probably works in Firefox 4+, Chrome 9+, Opera 11+. Might work in certain more
advanced mobile browsers.


Credits
-------

Isaac Sukin is the author of this project:

 - [Contact](http://www.isaacsukin.com/contact)
 - [Github](https://github.com/IceCreamYou)
 - [Twitter](https://twitter.com/IceCreamYou)

I'd love to hear what you make!

Many other people wrote jQuery, classes.js, and parts of jQuery.hotkeys; they
are credited in their respective files. Additionally many people contributed to
[H5BP](https://github.com/h5bp/html5-boilerplate), from which most of the
HTML and CSS, .htaccess, and robots.txt rules originated. Thanks also to
[JSDuck](https://github.com/senchalabs/jsduck/) for providing the framework for
the documentation site, and to Atari for the original image used to derive the
centipede example sprite.
