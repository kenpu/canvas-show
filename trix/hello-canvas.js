$(function() {
    var canvas = $('canvas:first')[0];
    var ctx = canvas.getContext('2d');

    function dot(x, y, fill) {
        ctx.moveTo(x,y);
        if(fill) ctx.fillStyle=fill;
        ctx.arc(x, y, 5, 0, Math.PI*2);
    }
    ctx.fillStyle = "#faf";
    ctx.beginPath();
    var i=0; 
    // 
    // This proves that ctx.fill() can be called
    // incrementally, but it applies cumulatively to
    // the entire current path.
    //
    setInterval(function() {
        i += 1;
        dot(i*30+10, i*30+10);
        if(i > 5) ctx.fillStyle = "#aaa";
        ctx.fill();
    }, 100);
});

