// auxiliary functions
function point_distance(p1, p2) {
	var x = p2.x - p1.x,
		y = p2.y - p1.y;
	return Math.sqrt(x*x + y*y);
}


// Streams
function PenTip(draw, downstream) {
	this.draw       = draw;
	this.downstream = downstream;
	this.min_len    = draw.T.sample_length;
	this.min_t      = draw.T.sample_interval;
	this.cum_len    = 0;
	this.last_t     = 0;
	this.buf        = [];

	draw.add(this);
}
PenTip.prototype.reset = function() {
	this.cum_len = 0;
	this.last_t = 0;
	if(this.buf.length > 0) {
		this.last_t = this.last_point().t;
	}
	this.buf = [];
}
PenTip.prototype.last_point = function() {
	return this.buf[this.buf.length-1];
}
PenTip.prototype.velocity = function(point) {
	var last_point = this.last_point();
	if(! last_point) {
		point.v = 0;
	} else {
		var d = point_distance(last_point, point);
		var t = point.t - last_point.t;
		if(! t) {
			point.v = last_point.v;
		} else {
			point.v = d/t;
		}
	}
	console.debug("v = ", point.v);
	return point;
}
PenTip.prototype.onDown = function(point) {
	this.reset();
	console.debug("onDown", point);
	point = this.velocity(point);
	this.buf.push(point);
	
	this.downstream.onStart(point);
	this.draw.refresh();
}
PenTip.prototype.onMove = function(point) {
	var last_point = this.last_point();
	point = this.velocity(point);
	this.buf.push(point);

	this.cum_len += Math.abs(point_distance(last_point, point));

	var emit = false;
	if(this.min_t > 0 || this.min_len > 0) {
		if(this.min_t > 0 && point.t - this.last_t >= this.min_t) emit = true;
		if(this.min_len > 0 && this.cum_len >= this.min_len) emit = true;
	} else 
		emit = true;

	if(emit) {
		this.downstream.onSample(point);
		this.reset();
		this.buf.push(point);
	}

	this.draw.refresh();
}
PenTip.prototype.onUp = function() {
	this.downstream.onEnd();
	this.reset();
	this.draw.refresh();
}
PenTip.prototype.refresh = function() {
	var draw = this.draw;
	draw.ctx.save();
	draw.ctx.beginPath();
	var v;
	this.buf.forEach(function(p, i, buf) {
		if(i == 0) {
			draw.ctx.moveTo(p.x, p.y);
		} else {
			draw.ctx.lineTo(p.x, p.y);
		}
		v = p.v;
	});
	if(v) draw.ctx.lineWidth = velocity_to_width(v); // what is the default width though??
	draw.ctx.stroke();
	draw.ctx.restore();
}


/*===================================================*/
function PenBody(draw, world) {
	this.draw = draw;
	this.world = world;
	this.buf = [];
	draw.add(this);
}
PenBody.prototype.onStart = function(point) {
	this.buf = [point];
}
PenBody.prototype.onEnd = function() {
	this.world.onCurve(this.buf.slice());
	this.buf = [];
}
PenBody.prototype.onSample = function(point) {
	this.buf.push(point);
	if(this.draw.T.smooth)
		smoothen(this.buf, Math.max(0,this.buf.length-4));
}

PenBody.prototype.refresh = function() {
	this.draw.curve(this.buf);
}


/* =============================================== */
function World(draw, T) {
	this.draw = draw;
	this.curves = [];
	draw.add(this);
}
World.prototype.to_world = function(p) {
	var w = this.draw.width(),
		h = this.draw.height(),
		T = this.draw.T;

	// move coord to the center
	p.x -= w/2;
	p.y -= h/2;
	// rescale p by zoom factor
	p.x /= T.zoom;
	p.y /= T.zoom;
	// move coord back to the corner
	p.x += w/2;
	p.y += h/2;
	// apply translation
	p.x = (p.x + T.translate.x);
	p.y = (p.y + T.translate.y);
}
World.prototype.onCurve = function(buf) {
	var world = this;
	buf.forEach(function(p) {
		world.to_world(p);
	});

	this.curves.push(buf);
}
World.prototype.refresh = function() {
	var draw = this.draw;
	var ctx = this.draw.ctx;
	ctx.save();
	
	var w = draw.width(),
		h = draw.height(),
		T = draw.T;

	ctx.translate(w/2, h/2);
	ctx.scale(T.zoom, T.zoom);
	ctx.translate(-w/2, -h/2);
	ctx.translate(-T.translate.x, -T.translate.y);

	this.curves.forEach(function(c) {
		draw.curve(c);
	});
	ctx.restore();
}