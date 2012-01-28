$(document).ready(function() {
	world.resize(canvas.width*1.2, canvas.height*1.2);
	startAnimating();
});

/**
 * Update everything in the canvas.
 * 
 * This function is magic-named.
 */
function update() {
	
}

/**
 * Draw everything in the canvas.
 * 
 * This function is magic-named.
 * 
 * The canvas is automatically cleared before drawing.
 */
function draw() {
	context.drawBkgdRadialGradient();
	player.draw();
}
