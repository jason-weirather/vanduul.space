function Particle(coord) {
  this.coord = coord;
  min_frames = 150
  max_frames = 350
  min_drag = 0
  max_drag = 0.3
  min_size = 2
  max_size = 10
  this.alpha = 0.3 // transparency
  this.size = Math.random()*(max_size-min_size)+min_size
  this.r = this.size //used in collision detection
  this.drag = Math.random()*(max_drag-min_drag)+min_drag
  this.ttl = Math.floor(min_frames + Math.random()*(max_frames-min_frames)) // frames left
  this.ttl_init = this.ttl // remember ttl if we want to fade alpha in and out
}


function draw_particles(canvas,context) {
  var max_particles = 500;
  var relative_speed = 0.1;
  canvas_multiplier = 1.5;  //how far out to spread particles
  while(particles.length < max_particles) {
    rx = 2*(Math.random()-0.5)*canvas.width*canvas_multiplier;
    ry = 2*(Math.random()-0.5)*canvas.height*canvas_multiplier;
    //c = canvas_coord(rx,ry);
    c = new Coordinates();
    c.SetCartesian(rx,ry);
    p = new Particle(c);
    particles.push(p);
  }
  buffer = [] // keep track of ones we keep here
  for(i = 0; i < particles.length; i++) {
    p = particles[i];
    if(p.ttl/p.ttl_init <=0.5) {
      alpha_scale = 2*p.ttl/p.ttl_init
    } else {
      alpha_scale = 2*(1-p.ttl/p.ttl_init)
    }
    // adjust 
    r = hero.Velocity()
    r = r-r*p.drag
    var cc = hero.coord.GetCartesian();
    var theta = hero.Theta();
    var newx = p.coord.GetCartesian().x-Math.cos(theta)*r*hero.throttle*relative_speed;
    var newy = p.coord.GetCartesian().y-Math.sin(theta)*r*hero.throttle*relative_speed;
    p.coord.SetCartesian(newx,newy);
    //c = canvas_coord(p.x,p.y)
    context.save();

    context.globalAlpha=alpha_scale*p.alpha;
    context.beginPath();
    //context.strokeStyle = 'gray';
    context.arc(p.coord.GetCanvas().x,p.coord.GetCanvas().y,p.size,2*Math.PI,false);
    //context.fillStyle = 'black';
    context.fill();
    //context.stroke();
    context.restore();
    p.ttl--;
    if(p.ttl<=0) continue;  // get a list of done indecies
    buffer.push(p);
  }
  particles = buffer
}

