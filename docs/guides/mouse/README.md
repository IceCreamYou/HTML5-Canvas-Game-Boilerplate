# H5CGB Mouse Interaction Tutorial - Build an RTS game

This guide introduces the mouse interaction tools for JavaScript canvas
applications provided by
[HTML5 Canvas Game Boilerplate](https://github.com/IceCreamYou/HTML5-Canvas-Game-Boilerplate)
by using them to write a
[C&C](https://en.wikipedia.org/wiki/Command_and_conquer)-style RTS game.

![Finished game](https://github.com/IceCreamYou/HTML5-Canvas-Game-Boilerplate/raw/gh-pages/guides/mouse/screen02.png)

## Prerequisites

You should already be familiar with the concepts introduced in the
[basics walkthrough](http://icecreamyou.github.io/HTML5-Canvas-Game-Boilerplate/docs/#!/guide/walkthrough).
To avoid rehashing those lessons, we're going to start with most of the game
built out already; in fact, we'll skip everything that could be built with the
tools introduced in that tutorial. Since that's too much code to copy-paste
here, you can
[read through it](https://github.com/IceCreamYou/HTML5-Canvas-Game-Boilerplate/blob/gh-pages/guides/mouse/rts00-prereqs.js)
separately.

Specifically, here's what we'll assume we're starting with:

- A large world with a background layer
- Multiple teams, each with a base in the world that generates soldiers
- Soldiers have the ability to move if properly instructed
- Soldiers can shoot at enemy soldiers, and lose health if hit
- Soldiers have a health bar, and bases have a progress bar for spawning
  soldiers
- Soldiers can collide with each other

And here's what all that looks like:

![Starting point](https://github.com/IceCreamYou/HTML5-Canvas-Game-Boilerplate/raw/gh-pages/guides/mouse/screen00.png)

As a reminder, all the code we'll be writing in this tutorial goes in `main.js`.

## Mouse Scrolling and Zooming

The world we've created is bigger than what we can fit in view, so we need a
way to navigate around it. In the basics walkthrough we saw that the viewport
will automatically scroll around a Player object, but we don't have a Player
here. Instead, we'll scroll the viewport when the mouse gets near an edge.
Doing this is just one line of code that we have to place at the end of
`setup()`:

    Mouse.Scroll.enable();

There are three factors that affect how mouse scrolling behaves. The first is
the "scroll threshold," which is how close to an edge the mouse needs to be in
order to trigger scrolling. The second is the "scroll distance," which is how
far the viewport should scroll. The third is the "easing function," which
defines how fast scrolling reaches maximum speed. Here's how to set them:

    Mouse.Scroll.setThreshold(0.3);
    Mouse.Scroll.setScrollDistance(800);
    Mouse.Scroll.setEasingFunction(Mouse.Scroll.easings.SMOOTH);

You can read more in the
[Mouse.Scroll](http://icecreamyou.github.io/HTML5-Canvas-Game-Boilerplate/docs/#!/api/Mouse.Scroll)
documentation.

Sometimes when your world is really big, scrolling doesn't let you move around
quickly enough or see everything you want in view. This isn't an especially
common requirement, so it's not included in `combined.js`, but you can add
support for this functionality by including `zoom.js` in your `index.html`:

    <script src="js/boilerplate/zoom.js"></script>

Once you've done that, you can allow the player to zoom in and out like this:

    Mouse.Zoom.enable(true);

(We'll also put this at the end of `setup()`.) The `true` parameter indicates
that we want to display an indicator of our zoom level so we know how far in or
out we've zoomed. You can configure what that indicator looks like, but here's
the default:

![Zooming](https://github.com/IceCreamYou/HTML5-Canvas-Game-Boilerplate/raw/gh-pages/guides/mouse/screen01.png)

You can also configure how fast and how far in and out you can zoom by changing
values on the
[Mouse.Zoom](http://icecreamyou.github.io/HTML5-Canvas-Game-Boilerplate/docs/#!/api/Mouse.Zoom)
object.

*[Review the code for this section](https://github.com/IceCreamYou/HTML5-Canvas-Game-Boilerplate/blob/gh-pages/guides/mouse/rts01-scrollzoom.js)*

## Hovering

Any instance of `Box` or any of its descendants have an
[`isHovered()`](http://icecreamyou.github.io/HTML5-Canvas-Game-Boilerplate/docs/#!/api/Box-method-isHovered)
method that returns `true` or `false` depending on whether the mouse is
currently hovered over it, respectively. For non-Box objects there is the
[`App.isHovered()`](http://icecreamyou.github.io/HTML5-Canvas-Game-Boilerplate/docs/#!/api/App-static-method-isHovered)
function which accepts anything with `x`, `y`, `width`, and `height` properties.

In our case, it would be nice to have soldiers change color when hovering over
them in order to make it clear when they can be selected. In
`Soldier#drawDefault()`, change this:

    this.fillStyle = this.selected ? this.team.soldierSelectedColor :
      this.team.soldierColor;

to this:

    this.fillStyle = this.selected ? this.team.soldierSelectedColor :
      (this.isHovered() ? this.team.soldierHoverColor : this.team.soldierColor);

*[Review the code for this section](https://github.com/IceCreamYou/HTML5-Canvas-Game-Boilerplate/blob/gh-pages/guides/mouse/rts02-hover.js)*

## Mouse Clicking and Coordinates

At this point we have lots of behavior defined for soldiers, but we don't have
a way to instruct them to move. Let's do this by selecting soldiers by clicking
on them and then telling them where to go by right-clicking on the map.

First, at the end of `Soldier#init()`, we'll need to tell the soldiers to be
selected when we click on them:

    if (team != myTeam) return; // Only allow selecting the player's team
    var t = this;
    // Allow selecting soldiers by clicking on them
    this.listen('mousedown.select touchstart.select', function(e) {
      // Left click or touch only
      if (typeof e !== 'undefined' && e.type == 'mousedown' && e.which !== 1) {
        return;
      }
      // Holding down CTRL allows selecting multiple soldiers.
      if (!jQuery.hotkeys.areKeysDown('ctrl')) {
        t.team.soldiers.forEach(function(soldier) {
          soldier.selected = false;
        });
      }
      t.toggleSelected.call(t);
      // Don't bubble the event
      e.stopPropagation();
    });

And in `Soldier#destroy()`:

    this.unlisten('.select');

We added a listener to the soldier object that listens for the "mousedown" or
"touchstart" events (i.e. clicks) and toggles the `selected` property
appropriately. This is a utility provided by H5CGB; there is no native way to
interact with objects drawn onto canvases because unlike DOM elements, the
canvas is viewed as an entire image without sub-components. To get around this,
H5CGB provides a jQuery-style
[event system](http://icecreamyou.github.io/HTML5-Canvas-Game-Boilerplate/docs/#!/api/App.Events)
for canvas objects.

Note the call to `e.stopPropagation()`. This prevents the event from bubbling
so that it's not called on other objects occupying the same space. In this
case, this is important because we'll also want the background to listen to
click events for our right-click-to-move behavior. While we're at it, let's
also unselect all soldiers if we left-click on the background. At the end of
`setup()`:

    // Respond to clicks on the background
    App.Events.listen(bkgd, 'mousedown.bkgd, touchstart.bkgd', function(e) {
      // Right click -> Move
      if (e.type == 'mousedown' && e.which === 3) {
        moveSelectedSoldiersToMouse();
      }
      // Touch or left click -> Deselect all
      else {
        // Holding down CTRL allows selecting multiple soldiers.
        if (!jQuery.hotkeys.areKeysDown('ctrl')) {
          myTeam.soldiers.forEach(function(soldier) {
            soldier.selected = false;
          });
        }
      }
    }, 1000); // Set the weight below everything else so we can cancel bubbling
    // Disable the right-click menu
    canvas.oncontextmenu = function() { return false; };

We used a `listen()` method above provided by the `Box` class, but `Layer`s
don't have that, so we used `App.Events.listen()` instead. We also disabled the
right-click menu by canceling the `oncontextmenu` event.

We still haven't implemented the `moveSelectedSoldiersToMouse()` method,
without which we're still not doing anything interesting. The actual
implementation is not especially important for our purposes; you could make
this as sophisticated as you want. Since this is an example, we'll opt for
clarity over sophistication. At the end of the file:

    function moveSelectedSoldiersToMouse() {
      myTeam.soldiers.forEach(function(soldier) {
        if (soldier.selected) {
          soldier.moveTo(Mouse.Coords.worldX(), Mouse.Coords.worldY());
        }
      });
    }

The key here is the
[`Mouse.Coords`](http://icecreamyou.github.io/HTML5-Canvas-Game-Boilerplate/docs/#!/api/Mouse.Coords)
calls. The `worldX()` and `worldY()` methods return the position of the mouse
coordinates relative to the world origin, which is what we want in order to
interact with the world. `Mouse.Coords` also has `x` and `y` properties, which
hold the mouse coordinates relative to the upper-left corner of the canvas.

Now we've got something interesting going! We can move our soldiers around the
world and watch them fight.

![Fighting](https://github.com/IceCreamYou/HTML5-Canvas-Game-Boilerplate/raw/gh-pages/guides/mouse/screen02.png)

*[Review the code for this section](https://github.com/IceCreamYou/HTML5-Canvas-Game-Boilerplate/blob/gh-pages/guides/mouse/rts03-click.js)*

## Mouse Dragging

Moving around a few soldiers at a time is well and good, but it's a pain to
select a lot of them. Let's add rubber-band selection &mdash; the ability to
select many soldiers at once by clicking-and-dragging. We'll want to display
the region that will be selected as we're dragging.

First, add this code in `setup()` before `Mouse.Zoom.enable()` but after
`if (!first) return`:

    // Set up the drag-to-select rectangle.
    setupDragOverlay(bkgd, function(x, y, w, h) {
      // Position a box where the drag rectangle was
      var selectBox = new Box(x, y, w, h);
      // See which soldiers are inside the box, and then select the ones that are
      var toSelect = selectBox.collides(myTeam.soldiers, true);
      if (toSelect) {
        for (var i = 0; i < toSelect.length; i++) {
          toSelect[i].toggleSelected();
        }
      }
    });

`setupDragOverlay()` will add the appropriate mouse listeners and invoke our
callback when the dragging is released and we're ready to actually select
soldiers. We'll be passed the coordinates and size of the selection box, and
we then check the intersection of that box with selectable soldiers.

Here's the implementation of `setupDragOverlay()`. Put it at the end of the
file:

    /**
     * Create an overlay to track mouse-drag selection.
     *
     * @param bkgd The object which should listen for click-and-dragging.
     * @param stopDraggingCallback A function to call when dragging stops.
     * @return The drag-overlay Layer.
     */
    function setupDragOverlay(bkgd, stopDraggingCallback) {
      // Set up a layer to hold the drag-and-drop rectangle.
      var dragOverlay = new Layer({relative: 'canvas'});
      dragOverlay.context.fillStyle = 'rgba(255, 240, 40, 0.4)';
      dragOverlay.context.strokeStyle = 'rgba(255, 240, 40, 1.0)';
      dragOverlay.context.lineWidth = 2;
      dragOverlay.positionOverCanvas();
    
      // Whether we're currently drag-selecting
      var mousedown = false;
    
      // Respond to pointer events
      App.Events.listen(bkgd, 'mousedown.bkgd, touchstart.bkgd', function(e) {
        // Left click only
        if (e.type == 'mousedown' && e.which !== 1) return;
        // Single-touch only so we don't interfere with gestures
        if (e.type == 'touchstart' && (e.touches || e.originalEvent.touches).length > 1) return;
        // Only listen to the first mousedown in a gesture
        if (mousedown) return;
        mousedown = true;
        // Start drawing the overlay rect
        dragOverlay.startX = Mouse.Coords.physicalX;
        dragOverlay.startY = Mouse.Coords.physicalY;
      }, 1000); // Set the weight below everything else so we can cancel bubbling
      $canvas.on('mousemove.dragselect touchmove.dragselect', function(e) {
        if (mousedown) {
          // Draw the overlay rect
          dragOverlay.context.clear();
          dragOverlay.context.fillRect(
              dragOverlay.startX, dragOverlay.startY,
              Mouse.Coords.physicalX - dragOverlay.startX,
              Mouse.Coords.physicalY - dragOverlay.startY
          );
          dragOverlay.context.strokeRect(
              dragOverlay.startX, dragOverlay.startY,
              Mouse.Coords.physicalX - dragOverlay.startX,
              Mouse.Coords.physicalY - dragOverlay.startY
          );
        }
      });
      $canvas.on('mouseup.dragselect mouseleave.dragselect touchend.dragselect', function(e) {
        if (e.type == 'mouseup' && e.which !== 1) return; // left click or touch only
        if (mousedown) {
          // Stop drawing the overlay rect
          dragOverlay.context.clear();
          var x = Math.round(Math.min(dragOverlay.startX, Mouse.Coords.physicalX) * world._actualXscale) + world.xOffset,
              y = Math.round(Math.min(dragOverlay.startY, Mouse.Coords.physicalY) * world._actualYscale) + world.yOffset,
              w = Math.round(Math.abs(Mouse.Coords.physicalX - dragOverlay.startX) * world._actualXscale),
              h = Math.round(Math.abs(Mouse.Coords.physicalY - dragOverlay.startY) * world._actualYscale);
          if (w && h) {
            // Do something with the selection
            stopDraggingCallback(x, y, w, h);
          }
        }
        mousedown = false;
      });
    
      return dragOverlay;
    }

Other than the fact that this is a lot of code, there are really only two
things to note here. First, we are displaying the selection box in a `Layer`
that is positioned over the canvas; we could also have just created a `Box`
inside the world, set its coordinates to `Mouse.Coords.worldX()` /
`Mouse.Coords.worldY()`, and changed its `width` and `height` as we dragged.
Second, there are some complicated calculations happening at the end to
determine the parameters to pass to the `stopDraggingCallback`. This is a
conversion from on-screen pixels to in-world coordinates, taking into account
zooming. This is usually not necessary, and there are usually alternatives to
doing this, but here's how you do it if you need to.

Other than that, there's nothing new here: we're mixing `App.Events.listen` and
`$canvas.on` for no good reason other than illustration, really, and we're
still just using `Mouse.Coords` to get the mouse's location.

![Dragging](https://github.com/IceCreamYou/HTML5-Canvas-Game-Boilerplate/raw/gh-pages/guides/mouse/screen03.png)

While we're on the topic of dragging, you should know that drag-&-drop
functionality is also supported. We don't have a good use for it in this
game so far, but you enable it on specific `Actor`s by calling
[Actor#setDraggable](http://icecreamyou.github.io/HTML5-Canvas-Game-Boilerplate/docs/#!/api/Actor-method-setDraggable).
For an amusing example, try executing this code in your browser's JavaScript
console:

    soldiers.forEach(function(soldier) {
      soldier.setDraggable(true);
    });

This will make all soldiers that have been spawned so far draggable (try it;
click on one and drag it around.) You'll notice that it kind of interferes with
our drag-to-select functionality.

*[Review the code for this section](https://github.com/IceCreamYou/HTML5-Canvas-Game-Boilerplate/blob/gh-pages/guides/mouse/rts04-drag.js)*

## Exercises for the Reader

We've now encountered all the mouse interaction tools this project provides,
and in combination with the basics walkthrough, all the rapid prototyping tools
available (though not every feature of each tool &mdash; for that, see the
full documentation for each class). There are still some features that are
missing from the game we've built compared to full RTS games. These can be
written with the tools we've already encountered, so they're not covered here
for brevity. It's a good exercise to implement these features yourself. If you
get stuck or want to see the end product, you can
[play with](http://icecreamyou.github.com/HTML5-Canvas-Game-Boilerplate/examples/cnc.html) or
[read the code](https://github.com/IceCreamYou/HTML5-Canvas-Game-Boilerplate/blob/gh-pages/examples/cnc.js)
of a more complete example.

## Recap

We've implemented quite a lot of powerful features with little code. Your game
is already fun to play with, and with some polish, it will be ready to show off
to your friends!

These tools are quite flexible and are useful in many different scenarios
beyond an RTS game. You can
[read the complete API reference](http://icecreamyou.github.io/HTML5-Canvas-Game-Boilerplate/docs/) or
[view a comprehensive feature list](https://github.com/IceCreamYou/HTML5-Canvas-Game-Boilerplate/wiki/What%27s-Included-&-API-Overview)
to get more familiar with them. Also feel free to dig through the code; it's
well-documented. If you'd like a recap of the basics, check out the
[first tutorial](http://icecreamyou.github.io/HTML5-Canvas-Game-Boilerplate/docs/#!/guide/walkthrough).

Congratulations! Go
[get the code](https://github.com/IceCreamYou/HTML5-Canvas-Game-Boilerplate) if
you haven't already, and build something awesome!
