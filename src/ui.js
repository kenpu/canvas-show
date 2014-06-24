"use strict";

$(function() {
	var canvas = $('canvas');

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


	function Draw(canvas) {
		this.ctx = canvas[0].getContext('2d');
		this.drawers = [];
		this.config = {
			strokeStyle: '#000',
			fillStyle: '#000',
			lineWidth: 3,
			lineJoin: 'round',
			lineCap: 'butt',
		};
		this.T = {
			translate: {
				x: 0,
				y: 0,
			},
			zoom: 1,
			smooth: false,
			sample_length: 0,
			sample_interval: 0,
		}
		this.w = parseInt(canvas.attr('width'));
		this.h = parseInt(canvas.attr('height'));
		this.width = function() {
			return this.w;
		}
		this.height = function() {
			return this.h;
		}
	}
	Draw.prototype.add = function(drawer) {
		this.drawers.push(drawer);
	}
	Draw.prototype.refresh = function() {
		this.ctx.save();
		this.ctx.clearRect(0, 0, this.width(), this.height());

		// perform translation
		for(var k in this.config) {
			this.ctx[k] = this.config[k];
		}
		this.drawers.forEach(function(drawer) {
			drawer.refresh(this);
		});
		this.ctx.restore();
	}

	Draw.prototype.curve = function(buf) {
		var c = this.ctx;
		var smooth = this.T.smooth;
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
	var draw = new Draw(canvas);
	var world = window.world = new World(draw);
	var pen_body = window.pen_body = new PenBody(draw, world);
	var pen_tip = window.pen_tip = new PenTip(draw, pen_body);

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

	$("#panLeft").click(function() {
		draw.T.translate.x -= 10;
		draw.refresh();
	});
	$("#panRight").click(function() {
		draw.T.translate.x += 10;
		draw.refresh();
	});
	$("#panUp").click(function() {
		draw.T.translate.y += 10;
		draw.refresh();
	});
	$("#panDown").click(function() {
		draw.T.translate.y -= 10;
		draw.refresh();
	});
	$("#zoomIn").click(function() {
		draw.T.zoom *= 1.2;
		draw.refresh();
	});
	$("#zoomOut").click(function() {
		draw.T.zoom *= 1 / 1.2;
		draw.refresh();
	});


});