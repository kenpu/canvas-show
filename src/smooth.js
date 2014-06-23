// smoothen the points between i and i+5;

function smoothen(points, i) {
	var l = points.length-1;
	var s = [null, null, null, null, null];
	s[0] = points[i];
	s[1] = points[Math.min(i+1, l)];
	s[2] = points[Math.min(i+2, l)];
	s[3] = points[Math.min(i+3, l)];
	s[4] = points[Math.min(i+4, l)];

	var B = [s[0], {}, {}, {}, s[4]];

	["x", "y"].forEach(function(d) {
		var a0 = 6*s[1][d] - s[0][d],
			a1 = 6*s[2][d],
			a2 = 6*s[3][d] - s[4][d];

        B[1][d] = (15*a0 -4 *a1 +   a2)/56;
        B[2][d] = (-4*a0 +16*a1 -4* a2)/56;
        B[3][d] = (   a0 -4 *a1 +15*a2)/56;
	});

	for(var i=0; i < 4; i++) {
		var c0 = {},
			c1 = {};
		["x", "y"].forEach(function(d) {
			var delta = B[i+1][d] - B[i][d];
			c0[d] = B[i][d] + delta/3;
			c1[d] = B[i][d] + delta*2/3;
		});
		s[i+1].cp = [c0, c1];
	}
}

// compute width from velocity
function velocity_to_width(v, w) {
	if(v > 2.5) v = 2.5;
	w = w || 3;
	return Math.ceil((Math.exp(-.5*v)+0.5)*w);
}

// assumes that point has control point field (cp)
function draw_bezier(ctx, p0, p3) {
	var px, py, x, y, t, v;
	var p1 = p3.cp[0],
		p2 = p3.cp[1];

	ctx.save();
	var w = velocity_to_width((p3.v+p0.v)/2);
	ctx.beginPath();
	ctx.lineWidth = w;
	ctx.moveTo(p0.x, p0.y);
	ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
	ctx.stroke();
	ctx.beginPath();
	ctx.arc(p3.x, p3.y, w/2, 0, Math.PI*2);
	ctx.fill();
	ctx.restore();
	return;

	// ctx.save();
	// ctx.lineCap = 'butt';
	// ctx.lineJoin = 'round';
	// px = p0.x;
	// py = p0.y;
	// for(t = 0; t <= 1; t += 0.1) {
	// 	x = (1-t)*(1-t)*(1-t)*p0.x + 3*(1-t)*(1-t)*t*p1.x + 3*(1-t)*t*t*p2.x + t*t*t*p3.x;
	// 	y = (1-t)*(1-t)*(1-t)*p0.y + 3*(1-t)*(1-t)*t*p1.y + 3*(1-t)*t*t*p2.y + t*t*t*p3.y;
	// 	v = (1-t)*p0.v + t*p3.v;
	// 	ctx.beginPath();
	// 	ctx.lineWidth = velocity_to_width(v, 3);
	// 	ctx.moveTo(px, py);
	// 	ctx.lineTo(x, y);
	// 	ctx.arc(x, y, velocity_to_width(v,3), 0, 2*Math.PI);

	// 	ctx.stroke();
	// 	px = x;
	// 	py = y;
	// }
	// ctx.stroke();
	// ctx.restore();
}