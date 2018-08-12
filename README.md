[![Build Status](https://travis-ci.org/IceCreamYou/HTML5-Canvas-Game-Boilerplate.svg?branch=gh-pages)](https://travis-ci.org/IceCreamYou/HTML5-Canvas-Game-Boilerplate) [![npm version](https://badge.fury.io/js/canvasboilerplate.svg)](https://www.npmjs.com/package/canvasboilerplate)

**This project makes starting an interactive 2D Canvas application fast and easy**,
even for developers who have never used Canvas before.

The project includes a stripped-down version of
[HTML5 Boilerplate](https://github.com/h5bp/html5-boilerplate) and adds some
Canvas-specific **boilerplate** and a couple of useful JavaScript abstractions.
In other words, it includes the code you were going to write for every canvas
project anyway, plus a few tools for **rapid prototyping** of common features.

Thorough **documentation** is an explicit goal of this project. It should be
easy to learn, use, and get started.


Getting Started
---------------

First, fork and `git clone` this repository, or install from NPM with
`npm i canvasboilerplate`.

To get started building, open up
[main.js](https://github.com/IceCreamYou/HTML5-Canvas-Game-Boilerplate/blob/gh-pages/js/app/main.js).
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

 - **[What's Included & API Overview](https://github.com/IceCreamYou/HTML5-Canvas-Game-Boilerplate/wiki/What%27s-Included-&-API-Overview)**
 - **[Full API Documentation](http://icecreamyou.github.com/HTML5-Canvas-Game-Boilerplate/docs/)**
 - **[Walk-Through Guide/Tutorial](http://icecreamyou.github.io/HTML5-Canvas-Game-Boilerplate/docs/#!/guide/walkthrough)** -
   Build a Mario-style platformer game in part 1 and a C&C-style RTS game in part 2
 - **[Examples](https://github.com/IceCreamYou/HTML5-Canvas-Game-Boilerplate/tree/gh-pages/examples)**
   in the examples folder &mdash;
   [Mario-style platformer](http://icecreamyou.github.com/HTML5-Canvas-Game-Boilerplate/examples/mario.html)
   ([code](https://github.com/IceCreamYou/HTML5-Canvas-Game-Boilerplate/blob/gh-pages/examples/mario.js));
   [Command & Conquer-style RTS](http://icecreamyou.github.com/HTML5-Canvas-Game-Boilerplate/examples/cnc.html)
   ([code](https://github.com/IceCreamYou/HTML5-Canvas-Game-Boilerplate/blob/gh-pages/examples/cnc.js));
   [Paint](http://icecreamyou.github.com/HTML5-Canvas-Game-Boilerplate/examples/paint.html)
   ([code](https://github.com/IceCreamYou/HTML5-Canvas-Game-Boilerplate/blob/gh-pages/examples/paint.js));
   and more!


Features
--------

 - **Boilerplate HTML and CSS:** Based on the venerable
   [HTML5 Boilerplate](https://github.com/h5bp/html5-boilerplate), you get
   cross-browser-compatibility and standards-compliance for free.
 - **Easy to learn:** You do not have to learn any new APIs to start developing;
   just open up main.js and go. Extra features provided should be intuitive,
   and documentation is thorough both online and in the code itself.
 - **Rapid prototyping:** Standard, extendable classes are provided with
   support for collision, physics, bulk initialization, and more.
 - **Boilerplate JS:** Avoid low-level Canvas APIs and boilerplate setup. Focus
   on your business logic, and don't worry about setting up the canvas,
   animation loop, physics timing, image caching, etc. Sprite animation is also
   supported out of the box.
 - **Simple interaction:** Interacting with the mouse and keyboard is easy, and
   a simple event model allows the entities on your canvas to be treated as
   first-class citizens. The canvas even automatically scrolls if your virtual
   world is too large to fit in view. Positioning HTML over the canvas (e.g.
   for menus) is straightforward as well.

You can also read a
[complete overview of everything this project provides](https://github.com/IceCreamYou/HTML5-Canvas-Game-Boilerplate/wiki/What%27s-Included-&-API-Overview).

### Why use H5CGB instead of a game engine?

H5CGB is not a game engine -- it provides boilerplate HTML, CSS, and JavaScript,
as well as some lightweight, easy-to-learn, rapid prototyping tools for any 2D
canvas-based project. Because it's a boilerplate, you can edit all the files
and use this project as a base rather than include a monolithic magic library.
Or, if you want, you can also drop in a game engine on top of this project.
It's also standards-compliant, modular, and thoroughly documented.

H5CGB is a good choice if you just want to get going quickly without learning a
bunch of opinioniated, engine-specific APIs, or if you are mainly interested in
avoiding setup but want control over the details. Sometimes game engines are
just overkill, or too overwhelming to learn, or try to do too much for you.

### Why use H5CGB instead of starting from scratch?

H5CGB takes care of a lot of code you'd be writing yourself, and doesn't add
much that you wouldn't need to write yourself. This includes standards-compliant
HTML, CSS, and other web files in addition to the JavaScript code that sets up
the canvas, animation loop, image caching, etc. In any case, the JavaScript is
quite modular, so you can always edit or delete anything you don't want.


Notes
-----

This project is [MIT-licensed](https://github.com/IceCreamYou/HTML5-Canvas-Game-Boilerplate/blob/gh-pages/LICENSE.md).

Compatible with all modern browsers, meaning not IE8. Also works in modern
mobile browsers as long as you accommodate mobile input methods. The
[Paint demo](http://icecreamyou.github.com/HTML5-Canvas-Game-Boilerplate/examples/paint.html)
is a good example of this.

**Contributions are welcome!**


Credits
-------

[Isaac Sukin](http://www.isaacsukin.com/contact)
([@IceCreamYou](https://twitter.com/IceCreamYou)) is the author of this project.

I'd love to hear what you make!

Many other people wrote jQuery, classes.js, console-extras.js, stats.js, and
parts of jQuery.hotkeys; they are credited in their respective files.
Additionally, many people contributed to
[H5BP](https://github.com/h5bp/html5-boilerplate), from which most of the
HTML and CSS, .htaccess, and robots.txt rules originated. Thanks also to
[JSDuck](https://github.com/senchalabs/jsduck/) for providing the framework for
the documentation site, and to Atari for the original image used to derive the
centipede example sprite.
