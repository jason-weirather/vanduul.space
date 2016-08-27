var verbose = true;

//Hold information about center sprite
//x: current x position
//y: current y position
//theta: current angle
//throttle: thrust [0,1]
//min_throttle: how close to ship before setting throttle to zero
//max_throttle: how far from ship before setting throttle to 1
//max_dist: maximum distance from the origin as fraction of the max_r
var hero = {x:0,y:0,theta:0,throttle:0,min_throttle:0.2,max_throttle:0.9,max_dist:0.2,engine_power:5}

var hero_weapon = {accuracy:0.95,speed:2,size:2,damage:3,range:800}

var player_projectiles = []
//one player bullet
function PlayerProjectile(xinit,yinit,theta,weapon) {
  this.x = xinit;
  this.y = yinit;
  this.theta = theta+2*(Math.random()-0.5)*(1-weapon.accuracy);
  this.weapon = weapon;
  this.traversed = 0;
}


var particles = []
function Particle(xinit,yinit) {
  this.x = xinit
  this.y = yinit
  min_frames = 150
  max_frames = 350
  min_drag = 0
  max_drag = 0.3
  min_size = 2
  max_size = 5
  this.alpha = 0.1 // transparency
  this.size = Math.random()*(max_size-min_size)+min_size
  this.drag = Math.random()*(max_drag-min_drag)+min_drag
  this.ttl = Math.floor(min_frames + Math.random()*(max_frames-min_frames)) // frames left
}

//Global for the mouse position
var mousePos = {xreal:0,yreal:0,x:0,y:0,xcanvas:0,ycanvas:0,theta:0}

function init() {
  stretch_canvas();
  var canvas = document.getElementById("game_board");
  var context = canvas.getContext("2d");
  canvas.addEventListener('mousemove',function(e) {
    //update global
    mousePos = get_mouse_position(canvas,e);
  });
  canvas.addEventListener('click',function(e) {
    //update global
    fire_player_weapon(canvas,e);
  });

  mainLoop();
}

function mainLoop() {
  update_canvas();
  requestAnimationFrame(mainLoop);
}

function draw_hero_projectiles(canvas,context) {
  remove = []
  for(i = 0; i < player_projectiles.length; i++) {
    b = player_projectiles[i];
    if(b.traversed > b.weapon.range) {
      remove.push(i);
      continue;
    }
    // still in can keep firing
    b.traversed += b.weapon.speed;
    b.x=b.x+Math.cos(b.theta)*b.weapon.speed;
    b.y=b.y+Math.sin(b.theta)*b.weapon.speed;
    c = canvas_coord(b.x,b.y)
    context.save();
    context.globalAlpha=0.7;
    context.beginPath();
    context.arc(c.x,c.y,b.weapon.size,2*Math.PI,false);
    context.fillStyle = 'black';
    context.fill();
    context.strokeStyle = 'gray';
    context.stroke();
    context.restore();
  }
  // go through and remove ones that are done
  for(i = 0; i < remove.length; i++) {
    player_projectiles.splice(i,1);
  }
}

function draw_particles(canvas,context) {
  max_particles = 500;
  canvas_multiplier = 5;  //how far out to spread particles
  while(particles.length < max_particles) {
    rx = 2*(Math.random()-0.5)*canvas.width*canvas_multiplier;
    ry = 2*(Math.random()-0.5)*canvas.height;
    //c = canvas_coord(rx,ry);
    p = new Particle(rx,ry);
    particles.push(p);
  }
  remove = [] // keep track of done indecies here
  for(i = 0; i < particles.length; i++) {
    p = particles[i];
    p.ttl--;
    // adjust 
    r = hero.engine_power*hero.throttle
    r = r-r*p.drag
    theta = Math.atan2(hero.y,hero.x)
    p.x = p.x-Math.cos(theta)*r
    p.y = p.y-Math.sin(theta)*r
    c = canvas_coord(p.x,p.y)
    context.save();
    context.globalAlpha=p.alpha;
    context.beginPath();
    context.arc(c.x,c.y,p.size,2*Math.PI,false);
    context.fillStyle = 'black';
    context.fill();
    context.strokeStyle = 'gray';
    context.stroke();
    context.restore();
    if(p.ttl==0) remove.push(i);  // get a list of done indecies
  }
  // go through and remove ones that are done
  for(i = 0; i < remove.length; i++) {
    particles.splice(i,1);
  }
}

function update_canvas() {
  var canvas = document.getElementById("game_board");
  var context = canvas.getContext("2d");
  //clear the canvas
  context.save();
  context.setTransform(1,0,0,1,0,0);
  context.clearRect(0,0,canvas.width,canvas.height);
  context.restore();

  //Draw mouse coordinate for debugging purposes
  context.font='20pt Calibri';
  context.fillStyle='white';
  context.fillText(mousePos.x+','+mousePos.y,-1*canvas.width/2+30,-1*canvas.height/2+30);
  
  //Now draw cooler stuff

  //set throttle
  r = Math.sqrt(mousePos.x*mousePos.x+mousePos.y*mousePos.y)
  max_r = Math.min(hero.max_throttle*canvas.width/2,hero.max_throttle*canvas.height/2)

  if(r < max_r*hero.min_throttle) r = hero.throttle=0;
  else hero.throttle = Math.min((r-max_r*hero.min_throttle)/(max_r-hero.min_throttle*max_r),1);

  draw_particles(canvas,context);
  draw_hero(canvas,context);
  draw_hero_projectiles(canvas,context);
}
function canvas_coord(x,y) {
  return {x:x,y:-y};
}

function draw_hero(canvas,context) {
  // global hero has stores state
  context.save();
  max_r = Math.min(canvas.width/2,canvas.height/2);
  r = hero.throttle;
  dist = hero.max_dist*max_r*r;
  //context.rotate(theta);
  context.beginPath();

  theta = Math.atan2(mousePos.y,mousePos.x)
  xmov = dist*Math.cos(theta);
  ymov = dist*Math.sin(theta);
  hero.theta = theta
  hero.x = xmov
  hero.y = ymov
  c = canvas_coord(xmov,ymov)
  context.translate(c.x,c.y);
  context.rotate(-theta+Math.PI/2);
  context.rect(-4,-2,8,4);
  context.stroke(); 
  context.restore()

  //display throttle
  context.font='20pt Calibri';
  context.fillStyle='white';
  context.fillText(Math.round(hero.throttle*100)+'%',-1*canvas.width/2+30,-1*canvas.height/2+60);

}

// Listener callback for mouse click
function fire_player_weapon(canvas,e) {
  var context = canvas.getContext("2d")
  b = new PlayerProjectile(hero.x,hero.y,hero.theta,hero_weapon)
  player_projectiles.push(b)
}

// Listener for mouse move
function get_mouse_position(canvas,e) {
  var context = canvas.getContext("2d")
  xpos = e.clientX;
  ypos = e.clientY;
  var rect = canvas.getBoundingClientRect();
  txpos = mousePos.x -canvas.width/2
  typos = mousePos.y - canvas.height/2
  xorig = e.clientX-rect.left  // true x
  yorig = e.clientY-rect.top   // true y
  // get coordinates relative to the center as origin and call them x and y
  txpos = xorig -canvas.width/2      //centered x
  typos = -1*yorig + canvas.height/2 //centered y
  return {xreal:xorig,yreal:yorig,x:txpos,y:typos,xcanvas:xpos,ycanvas:-1*ypos};
}

// Set the canvas to be the full window
function stretch_canvas() {
  print("Stretch canvas")
  var width = window.innerWidth;
  var height = window.innerHeight;
  print(width)
  print(height)
  print("new width: "+width+"px")
  document.getElementById("game_board").style.width=width+"px";
  print("new width: "+height+"px")
  document.getElementById("game_board").style.height=height+"px";
  var canvas = document.getElementById("game_board");
  canvas.width = width
  canvas.height = height  
  var context = canvas.getContext("2d");
  context.translate(canvas.width/2,canvas.height/2)
}

// Debugging print function.
// Pre: any message to print and verbose set to true or false
// Post: if verbose is true then print to console
function print(msg) {
  if(verbose) { 
    console.log(msg);
  }
}  
