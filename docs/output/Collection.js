Ext.data.JsonP.Collection({"tagname":"class","name":"Collection","extends":null,"mixins":[],"alternateClassNames":[],"aliases":{},"singleton":false,"requires":[],"uses":[],"enum":null,"override":null,"inheritable":null,"inheritdoc":null,"meta":{},"private":null,"id":"class-Collection","members":{"cfg":[],"property":[],"method":[{"name":"constructor","tagname":"method","owner":"Collection","meta":{},"id":"method-constructor"},{"name":"add","tagname":"method","owner":"Collection","meta":{},"id":"method-add"},{"name":"combine","tagname":"method","owner":"Collection","meta":{"chainable":true},"id":"method-combine"},{"name":"concat","tagname":"method","owner":"Collection","meta":{"chainable":true},"id":"method-concat"},{"name":"count","tagname":"method","owner":"Collection","meta":{},"id":"method-count"},{"name":"draw","tagname":"method","owner":"Collection","meta":{"chainable":true},"id":"method-draw"},{"name":"forEach","tagname":"method","owner":"Collection","meta":{},"id":"method-forEach"},{"name":"getAll","tagname":"method","owner":"Collection","meta":{},"id":"method-getAll"},{"name":"overlaps","tagname":"method","owner":"Collection","meta":{},"id":"method-overlaps"},{"name":"remove","tagname":"method","owner":"Collection","meta":{},"id":"method-remove"},{"name":"removeAll","tagname":"method","owner":"Collection","meta":{"chainable":true},"id":"method-removeAll"},{"name":"removeLast","tagname":"method","owner":"Collection","meta":{},"id":"method-removeLast"}],"event":[],"css_var":[],"css_mixin":[]},"linenr":328,"files":[{"filename":"actors.js","href":"actors.html#Collection"}],"html_meta":{},"statics":{"cfg":[],"property":[],"method":[],"event":[],"css_var":[],"css_mixin":[]},"component":false,"superclasses":[],"subclasses":[],"mixedInto":[],"parentMixins":[],"html":"<div><pre class=\"hierarchy\"><h4>Files</h4><div class='dependency'><a href='source/actors.html#Collection' target='_blank'>actors.js</a></div></pre><div class='doc-contents'><p>A container to keep track of multiple Boxes/Box descendants.</p>\n</div><div class='members'><div class='members-section'><div class='definedBy'>Defined By</div><h3 class='members-title icon-method'>Methods</h3><div class='subsection'><div id='method-constructor' class='member first-child not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Collection'>Collection</span><br/><a href='source/actors.html#Collection-method-constructor' target='_blank' class='view-source'>view source</a></div><strong class='new-keyword'>new</strong><a href='#!/api/Collection-method-constructor' class='name expandable'>Collection</a>( <span class='pre'>[items]</span> ) : <a href=\"#!/api/Collection\" rel=\"Collection\" class=\"docClass\">Collection</a></div><div class='description'><div class='short'>Creates a new Collection instance. ...</div><div class='long'><p>Creates a new Collection instance.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>items</span> : <a href=\"#!/api/Array\" rel=\"Array\" class=\"docClass\">Array</a> (optional)<div class='sub-desc'><p>An Array of Boxes that the Collection should hold.</p>\n</div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'><a href=\"#!/api/Collection\" rel=\"Collection\" class=\"docClass\">Collection</a></span><div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-add' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Collection'>Collection</span><br/><a href='source/actors.html#Collection-method-add' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Collection-method-add' class='name expandable'>add</a>( <span class='pre'>item</span> ) : <a href=\"#!/api/Number\" rel=\"Number\" class=\"docClass\">Number</a></div><div class='description'><div class='short'>Add an item to the Collection. ...</div><div class='long'><p>Add an item to the Collection.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>item</span> : <a href=\"#!/api/Box\" rel=\"Box\" class=\"docClass\">Box</a><div class='sub-desc'><p>The Box to add to the Collection.</p>\n</div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'><a href=\"#!/api/Number\" rel=\"Number\" class=\"docClass\">Number</a></span><div class='sub-desc'><p>The number of items in the Collection.</p>\n</div></li></ul></div></div></div><div id='method-combine' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Collection'>Collection</span><br/><a href='source/actors.html#Collection-method-combine' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Collection-method-combine' class='name expandable'>combine</a>( <span class='pre'>otherCollection</span> ) : <a href=\"#!/api/Collection\" rel=\"Collection\" class=\"docClass\">Collection</a><strong class='chainable signature' >chainable</strong></div><div class='description'><div class='short'>Add the items in another Collection to this Collection. ...</div><div class='long'><p>Add the items in another Collection to this Collection.</p>\n\n<p>See <a href=\"#!/api/Collection-method-concat\" rel=\"Collection-method-concat\" class=\"docClass\">Collection.concat</a>() to add the items in an Array to this Collection.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>otherCollection</span> : <a href=\"#!/api/Collection\" rel=\"Collection\" class=\"docClass\">Collection</a><div class='sub-desc'><p>A Collection whose items should be added to this Collection.</p>\n</div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'><a href=\"#!/api/Collection\" rel=\"Collection\" class=\"docClass\">Collection</a></span><div class='sub-desc'><p>this</p>\n</div></li></ul></div></div></div><div id='method-concat' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Collection'>Collection</span><br/><a href='source/actors.html#Collection-method-concat' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Collection-method-concat' class='name expandable'>concat</a>( <span class='pre'>items</span> ) : <a href=\"#!/api/Collection\" rel=\"Collection\" class=\"docClass\">Collection</a><strong class='chainable signature' >chainable</strong></div><div class='description'><div class='short'>Add the items in an Array to the Collection. ...</div><div class='long'><p>Add the items in an Array to the Collection.</p>\n\n<p>See <a href=\"#!/api/Collection-method-combine\" rel=\"Collection-method-combine\" class=\"docClass\">Collection.combine</a>() to add the items in another Collection to this\nCollection.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>items</span> : <a href=\"#!/api/Array\" rel=\"Array\" class=\"docClass\">Array</a><div class='sub-desc'><p>An Array of Boxes to add to the Collection.</p>\n</div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'><a href=\"#!/api/Collection\" rel=\"Collection\" class=\"docClass\">Collection</a></span><div class='sub-desc'><p>this</p>\n</div></li></ul></div></div></div><div id='method-count' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Collection'>Collection</span><br/><a href='source/actors.html#Collection-method-count' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Collection-method-count' class='name expandable'>count</a>( <span class='pre'></span> )</div><div class='description'><div class='short'>Return the number of items in the Collection. ...</div><div class='long'><p>Return the number of items in the Collection.</p>\n</div></div></div><div id='method-draw' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Collection'>Collection</span><br/><a href='source/actors.html#Collection-method-draw' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Collection-method-draw' class='name expandable'>draw</a>( <span class='pre'>[ctx]</span> ) : <a href=\"#!/api/Collection\" rel=\"Collection\" class=\"docClass\">Collection</a><strong class='chainable signature' >chainable</strong></div><div class='description'><div class='short'>Draw every object in the Collection. ...</div><div class='long'><p>Draw every object in the Collection.</p>\n\n<p>This calls <a href=\"#!/api/Box-method-draw\" rel=\"Box-method-draw\" class=\"docClass\">Box.draw</a>() on every Box in the Collection.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>ctx</span> : <a href=\"#!/api/CanvasRenderingContext2D\" rel=\"CanvasRenderingContext2D\" class=\"docClass\">CanvasRenderingContext2D</a> (optional)<div class='sub-desc'><p>A canvas graphics context onto which to draw. This is useful for drawing\n  onto <a href=\"#!/api/Layer\" rel=\"Layer\" class=\"docClass\">Layer</a>s. If not specified, defaults to the\n  <a href=\"#!/api/global-property-context\" rel=\"global-property-context\" class=\"docClass\">global context</a> for the default canvas.</p>\n</div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'><a href=\"#!/api/Collection\" rel=\"Collection\" class=\"docClass\">Collection</a></span><div class='sub-desc'><p>this</p>\n</div></li></ul></div></div></div><div id='method-forEach' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Collection'>Collection</span><br/><a href='source/actors.html#Collection-method-forEach' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Collection-method-forEach' class='name expandable'>forEach</a>( <span class='pre'>f</span> )</div><div class='description'><div class='short'>Execute a function on every item in the Collection. ...</div><div class='long'><p>Execute a function on every item in the Collection.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>f</span> : Function/String<div class='sub-desc'><p>The function to execute on each item, or the (string) name of a method\n  of each object in the Collection that should be invoked. In the first\n  case, the function should return a truthy value in order to remove the\n  item being processed from the Collection. In the second case, additional\n  arguments to the forEach method are also passed on to the items' method.</p>\n</div></li></ul></div></div></div><div id='method-getAll' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Collection'>Collection</span><br/><a href='source/actors.html#Collection-method-getAll' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Collection-method-getAll' class='name expandable'>getAll</a>( <span class='pre'></span> )</div><div class='description'><div class='short'>Return an Array containing all items in the Collection. ...</div><div class='long'><p>Return an Array containing all items in the Collection.</p>\n</div></div></div><div id='method-overlaps' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Collection'>Collection</span><br/><a href='source/actors.html#Collection-method-overlaps' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Collection-method-overlaps' class='name expandable'>overlaps</a>( <span class='pre'>box</span> ) : Boolean</div><div class='description'><div class='short'>Determine whether any object in this Collection intersects with a Box. ...</div><div class='long'><p>Determine whether any object in this Collection intersects with a Box.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>box</span> : <a href=\"#!/api/Box\" rel=\"Box\" class=\"docClass\">Box</a><div class='sub-desc'><p>The Box with which to detect intersection.</p>\n</div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'>Boolean</span><div class='sub-desc'><p>true if intersection is detected; false otherwise.</p>\n</div></li></ul></div></div></div><div id='method-remove' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Collection'>Collection</span><br/><a href='source/actors.html#Collection-method-remove' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Collection-method-remove' class='name expandable'>remove</a>( <span class='pre'>item</span> )</div><div class='description'><div class='short'>Remove an item from the Collection. ...</div><div class='long'><p>Remove an item from the Collection.</p>\n\n<p>See <a href=\"#!/api/Collection-method-removeLast\" rel=\"Collection-method-removeLast\" class=\"docClass\">Collection.removeLast</a>() to pop the last item in the collection.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>item</span> : <a href=\"#!/api/Box\" rel=\"Box\" class=\"docClass\">Box</a><div class='sub-desc'><p>The Box to remove from the Collection.</p>\n</div></li></ul></div></div></div><div id='method-removeAll' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Collection'>Collection</span><br/><a href='source/actors.html#Collection-method-removeAll' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Collection-method-removeAll' class='name expandable'>removeAll</a>( <span class='pre'></span> ) : <a href=\"#!/api/Collection\" rel=\"Collection\" class=\"docClass\">Collection</a><strong class='chainable signature' >chainable</strong></div><div class='description'><div class='short'>Remove all items in the Collection. ...</div><div class='long'><p>Remove all items in the Collection.</p>\n<h3 class='pa'>Returns</h3><ul><li><span class='pre'><a href=\"#!/api/Collection\" rel=\"Collection\" class=\"docClass\">Collection</a></span><div class='sub-desc'><p>this</p>\n</div></li></ul></div></div></div><div id='method-removeLast' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Collection'>Collection</span><br/><a href='source/actors.html#Collection-method-removeLast' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Collection-method-removeLast' class='name expandable'>removeLast</a>( <span class='pre'></span> )</div><div class='description'><div class='short'>Remove and return the last item in the Collection. ...</div><div class='long'><p>Remove and return the last item in the Collection.</p>\n</div></div></div></div></div></div></div>"});