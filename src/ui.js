"use strict";

$(function() {

	var canvas = $('canvas');
	var ctx = canvas[0].getContext('2d');

	function point_of(e) {
		var offset = canvas.offset();
		var x, y;
		if(e.type == 'touchstart' || e.type == 'touchmove') {
			x = e.originalEvent.touches[0].clientX;
			y = e.originalEvent.touches[0].clientY;
		} else {
			x = e.clientX;
			y = e.clientY;
		}
		return {
			x: x - offset.left,
			y: y - offset.top,
			t: e.timeStamp,
		}
	}


	function Draw(ctx) {
		this.ctx = ctx;
		this.drawers = [];
		this.smooth = false;
		this.config = {
			strokeStyle: '#000',
			fillStyle: '#000',
			lineWidth: 3,
			lineJoin: 'round',
			lineCap: 'butt',
		};
		this.width = function() {
			return 800;
		}
		this.height = function() {
			return 600;
		}
	}
	Draw.prototype.add = function(drawer) {
		this.drawers.push(drawer);
	}
	Draw.prototype.refresh = function() {
		this.ctx.clearRect(0, 0, this.width(), this.height());
		for(var k in this.config) {
			this.ctx[k] = this.config[k];
		}
		this.drawers.forEach(function(drawer) {
			drawer.refresh(this);
		});
	}

	Draw.prototype.curve = function(buf) {
		var c = this.ctx;
		var smooth = this.smooth;
		c.beginPath();
		buf.forEach(function(p, i) {
			if(i == 0) {
				c.moveTo(p.x, p.y);
			} else {
				if(smooth)
					draw_bezier(c, buf[i-1], buf[i]);
				else
					c.lineTo(p.x, p.y);
			}
		});
		c.stroke();
	}

	/* ============ Drawing methods =================== */


	// streams and receivers
	var draw = new Draw(ctx);
	var world = new World(draw);
	var pen_body = window.pen_body = new PenBody(draw, world);
	var pen_tip = window.pen_tip = new PenTip(draw, pen_body, {
		min_len: 0,
		min_t : 0,
	});

	// reactive 
	function cancel(e) {
		e.stopPropagation();
		e.preventDefault();
	}
	var mouse_is_down = false;
	canvas.bind('mousedown', function(e) {
		mouse_is_down = true;
		pen_tip.onDown(point_of(e));
	})
	.bind('mousemove', function(e) {
		if(mouse_is_down)
			pen_tip.onMove(point_of(e));
	})
	.bind('mouseup', function(e) {
		mouse_is_down = false;
		pen_tip.onMove(e);
		pen_tip.onUp();
	})
	.bind('touchstart', function(e) {
		cancel(e);
		pen_tip.onDown(point_of(e));
		console.debug(e);
	})
	.bind('touchmove', function(e) {
		cancel(e);
		pen_tip.onMove(point_of(e));
	})
	.bind('touchend', function(e) {
		pen_tip.onUp();
	});

});