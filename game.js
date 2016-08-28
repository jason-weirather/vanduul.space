var verbose = true;
var finished = false;
var get_input = [];

var galactic_state = new GalacticState();
//Store persistant variables here
function GalacticState() {
  
}

var stop_counter = 0;
function check_scan(canvas,context) {
  if(hero.Velocity()<0.01) stop_counter+=1;
  else {
    stop_counter = 0;
    return;
  }
  if(stop_counter < 60*3) return;
  context.save()
  context.textAlign="center";
  var msg = "Scanning";
  var scan_msgs = ["......",".  ....  .","..  ..  ..","...    ...","..  ..  ..",".  ....  ."];
  drop_shadow(context,msg,20,0,-50)
  scale_counter = Math.floor(stop_counter/60)
  drop_shadow(context,scan_msgs[scale_counter%scan_msgs.length],20,0,-30)   
  context.restore()
  if(stop_counter < 60*6) return;
  // Now look for planet
  var min_range = 100;
  var best_p = null;
  for(var i=0; i < planets.length; i++) {
    var pc = galactic_coordinates.PlayerCoordinates()
    var dx =planets[i].x - pc.x
    var dy = planets[i].y - pc.y
    var d = Math.sqrt(dx*dx+dy*dy);
    d -=planets[i].r;
    if(d > min_range) continue;
    min_range = d
    best_p = i
  }
  if(best_p) {
    // We have a planet
    if(planets[best_p].name=='') {
      get_input = ['planet name',best_p];
      is_paused = true;
      return;
    }
  }
}


//Hold information about center sprite
//x: current x position
//y: current y position
//theta: current angle
//throttle: thrust [0,1]
//min_throttle: how close to ship before setting throttle to zero
//max_throttle: how far from ship before setting throttle to 1
//max_dist: maximum distance from the origin as fraction of the max_r
//turn_rate: how many radians you are allowed to turn per tick
var hero = new Ship();


function Ship() {
  this.x=0;
  this.y=0;
  this.theta=0;
  this.throttle=0;
  this.min_throttle=0.2;
  this.max_throttle=0.9;
  this.max_dist=0.2;
  this.engine_power=5;
  this.turn_rate=0.05;
  this.acceleration=0.5;
  var self = this;
  this.Velocity = function() {
    return self.engine_power*self.throttle;
  }
  this.Theta = function() {
    return Math.atan2(self.y,self.x);
  }
}

function RandomGenerator(v1,v2) {
  this.seed1 = v1
  this.seed2 = v2
  this.seed3 = 1000;
  var self = this;
  this.random = function() {
    self.seed3 += 1;
    var x = Math.sin(self.seed3)*100;
    x = x - Math.floor(x);
    num2 = Math.floor(10+100*x*self.seed1+self.seed3)

    x = Math.sin(num2)*100;
    x = x - Math.floor(x);

    num3 = Math.floor(10+100*x*self.seed2+self.seed3)

    x = Math.sin(num3)*100;
    x = x - Math.floor(x);

    return x;
  }
}

var planets = []

var proceedural_blocks = {}

function Planet() {
  this.x = 0;
  this.y = 0;
  this.r = 0;
  this.name = '';
  this.id = '';
  var self = this;
  this.GetBlock = function(blocksize) {
    var xb = Math.floor(self.x/blocksize);
    //if(self.x<0) xb+=1;
    var yb = Math.floor(self.y/blocksize);
    return {xblock:xb,yblock:yb};
  }
}

var galactic_coordinates = new GalacticCoordinates();

function GalacticCoordinates() {
  this.x_origin = 0;
  this.y_origin = 0;
  var self = this;
  this.PlayerCoordinates = function() {
    return {x:hero.x+self.x_origin,y:hero.y+self.y_origin};
  }
  this.ToCartesian = function(x_gal,y_gal) {
    return {x:x_gal-self.x_origin,y:y_gal-self.y_origin};
  }
}

// accuracy: control spread of theta upon fire
// speed: how fast projectile travels
// damage:
// range: pixels projectile can travel before disappearing
var hero_weapon = {accuracy:0.95,speed:4,size:2,damage:3,range:800}

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
  this.ttl_init = this.ttl // remember ttl if we want to fade alpha in and out
}

//Global for the mouse position
var mousePos = {xreal:0,yreal:0,x:0,y:0,xcanvas:0,ycanvas:0,theta:0}

function init() {
  loc = window.location.href.replace(/\//g,'');
  loc = loc.replace(/http:/g,'');
  print(loc);
  if(!(loc=='vanduul.space')) {
    finished = true;
    return;
  }
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
  document.body.onkeyup = function(e) {
    if(e.keyCode==32) {
      toggle_pause();
    }
  }
  mainLoop();
}

function mainLoop() {
  if(!is_paused && !finished)  update_canvas();
  if(is_paused && get_input.length > 0) {
    process_input();
  }
  requestAnimationFrame(mainLoop);
}

function process_input() {
  var canvas = document.getElementById("game_board");
  var context = canvas.getContext("2d");
  // We can name planet
  var elm = document.getElementById("user_input")
  if(elm.style.visibility!="visible") {
    context.save()
    context.textAlign="center";
    var msg = "Please name the planet";
    drop_shadow(context,msg,40,0,-150)
    context.restore()
  }
  elm.style.visibility = "visible";
  elm.maxLength = "20";
  elm.style.left = Math.floor(canvas.width/2-50 )+"px";
  elm.style.top = Math.floor(canvas.height/2-100)+"px";
  //check for the entry
  if(entry_complete) {
    entry_complete = false;
    elm.style.visibility = "hidden";
    is_paused=false;
    planets[get_input[1]].name = elm.value;
    elm.value = '';
    get_input = [];
  }
}

var entry_complete = false
function user_input_keypress(e) {
  e.which = e.which || e.keyCode;
  if(e.which==13) {
    entry_complete = true
  }
}

function draw_hero_projectiles(canvas,context) {
  buffer = []
  for(i = 0; i < player_projectiles.length; i++) {
    b = player_projectiles[i];
    if(b.traversed > b.weapon.range) {
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
    buffer.push(b)
  }
  player_projectiles = buffer;
}

function draw_particles(canvas,context) {
  max_particles = 1000;
  canvas_multiplier = 5;  //how far out to spread particles
  while(particles.length < max_particles) {
    rx = 2*(Math.random()-0.5)*canvas.width*canvas_multiplier;
    ry = 2*(Math.random()-0.5)*canvas.height;
    //c = canvas_coord(rx,ry);
    p = new Particle(rx,ry);
    particles.push(p);
  }
  buffer = [] // keep track of ones we keep here
  for(i = 0; i < particles.length; i++) {
    p = particles[i];
    if(p.ttl/p.ttl_init <0.5) {
      alpha_scale = 2*p.ttl/p.ttl_init
    } else {
      alpha_scale = 2*(1-p.ttl/p.ttl_init)
    }
    // adjust 
    r = hero.Velocity()
    r = r-r*p.drag

    theta = Math.atan2(hero.y,hero.x)
    p.x = p.x-Math.cos(theta)*r
    p.y = p.y-Math.sin(theta)*r
    c = canvas_coord(p.x,p.y)
    context.save();

    context.globalAlpha=alpha_scale*p.alpha;

    context.beginPath();
    context.arc(c.x,c.y,p.size,2*Math.PI,false);
    context.fillStyle = 'black';
    context.fill();
    context.strokeStyle = 'gray';
    context.stroke();
    context.restore();
    p.ttl--;
    if(p.ttl<=0) continue;  // get a list of done indecies
    buffer.push(p);
  }
  particles = buffer
}

function pad(num,size) {
  var s= "00000000000"+num;
  return s.substr(s.length-size);
}

function update_canvas() {
  var canvas = document.getElementById("game_board");
  var context = canvas.getContext("2d");
  //clear the canvas
  context.save();
  context.setTransform(1,0,0,1,0,0);
  context.clearRect(0,0,canvas.width,canvas.height);
  context.restore();

  //Now draw cooler stuff

  update_hero_position(canvas);
  update_galactic_coordinates();
  update_bodies();
  draw_bodies(canvas,context);
  draw_particles(canvas,context);
  draw_hero(canvas,context);
  draw_hero_projectiles(canvas,context);
  check_scan(canvas,context);
  draw_hud(canvas,context);
}

function draw_hud(canvas,context) {
  //Draw mouse coordinate for debugging purposes
  //context.font='20pt Calibri';
  //context.fillStyle='white';
  pv = galactic_coordinates.PlayerCoordinates()
  var quad = 'A';
  var rx =Math.round(pv.x/500);
  var ry =Math.round(pv.y/500);
  if(rx < 0 && ry >=0) quad = 'B';
  else if(rx < 0 && ry < 0) quad = 'C';
  else if(rx >= 0 && ry < 0) quad = 'D';
  msg = quad+'/'+pad(Math.abs(rx),8)+'/'+pad(Math.abs(ry),8);
  drop_shadow(context,msg,20,-1*canvas.width/2+30,-1*canvas.height/2+30)
  //context.fillText(Math.round(pv.x)+','+Math.round(pv.y),-1*canvas.width/2+30,-1*canvas.height/2+30);

  //display throttle
  msg = Math.round(hero.throttle*100)+'%';
  drop_shadow(context,msg,20,-1*canvas.width/2+30,-1*canvas.height/2+60);
  msg = Math.round(hero.Velocity()*60)+'m/s';
  drop_shadow(context,msg,20,-1*canvas.width/2+100,-1*canvas.height/2+60);
  //context.fillText(Math.round(hero.throttle*100)+'%',-1*canvas.width/2+30,-1*canvas.height/2+60);
  // context.fillText(Math.round(hero.Velocity()*60)+'m/s',-1*canvas.width/2+100,-1*canvas.height/2+60);

  //display help
  msg = 'Press SPACE for PAUSE.  Left click to FIRE.'
  drop_shadow(context,msg,16,-1*canvas.width/2+30,canvas.height/2-30)

}

function update_bodies() {
  var gc = galactic_coordinates;
  var blocksize = 10000;
  var curblock_x = Math.floor(gc.x_origin/blocksize);
  //if(gc.x_origin < 0) curblock_x-=1;
  var curblock_y = Math.floor(gc.y_origin/blocksize);
  //if(gc.y_origin < 0) curblock_y-=1;
  //print('cur '+curblock_x+','+curblock_y)
  var xblocks = [curblock_x-1,curblock_x,curblock_x+1];
  var yblocks = [curblock_y-1,curblock_y,curblock_y+1];
  var needed = {};
  for(var i=0; i < xblocks.length;i++) {
    needed[xblocks[i]] = {}
    for(var j=0; j < yblocks.length;j++) {
      needed[xblocks[i]][yblocks[j]] = 1;
    }
  }
  for(var i=0; i < xblocks.length;i++) {
    for(var j=0; j < yblocks.length;j++) {
      if(xblocks[i] in proceedural_blocks) {
        if(yblocks[j] in proceedural_blocks[xblocks[i]]) {
          continue;
        }
      }
      // if we are still here we need to populate the proceedural block
      if(!(xblocks[i] in proceedural_blocks)) {
        proceedural_blocks[xblocks[i]] = {};
      } 
      proceedural_blocks[xblocks[i]][yblocks[j]] = populate_proceedural_block(xblocks[i],yblocks[j],blocksize);
      // if we add a block lets also cleen uncessary blocks
      clean_unneeded(needed,blocksize);
    }
  }
  // now remove blocks that are not needed
  for(xblock in proceedural_blocks) {
    for(yblock in proceedural_blocks[xblock]) {
      if(xblock in needed) {
        if(!(yblock in needed[xblock])) {
          delete proceedural_blocks[xblock][yblock];
        }
      }
    }
    if(!(xblock in needed)) {
      delete proceedural_blocks[xblock];
    }
  }
}

function clean_unneeded(needed,blocksize) {
  buffer = [];
  for(var i=0; i < planets.length; i++) {
    blk = planets[i].GetBlock(blocksize);
    //print('try clean '+blk.xblock+','+blk.yblock)
    if(!(blk.xblock in needed)) {
      //print('do x clean '+blk.xblock+','+blk.yblock)
      continue;
    }
    if(!(blk.yblock in needed[blk.xblock])) {
      //print('do y clean '+blk.xblock+','+blk.yblock)
      continue;
    }
    buffer.push(planets[i]);
  }
  planets = buffer;
}

function populate_proceedural_block(xblock,yblock,blocksize) {
  var max_planets=100;
  var min_size = 50;
  var max_size = 300;
  var rg = new RandomGenerator(xblock,yblock)
  var num_planets = Math.floor(rg.random()*max_planets);
  //print(num_planets)
  for(var i = 0; i < num_planets; i++) {
    var x = 0;
    if(xblock >= 0) {
      x = Math.floor(rg.random()*blocksize)+xblock*blocksize;
    } else {
      x = -1*Math.floor(rg.random()*blocksize)+(xblock+1)*blocksize;
    }
    var y = 0;
    if(yblock >= 0) {
      y = Math.floor(rg.random()*blocksize)+yblock*blocksize;
    } else {
      y = -1*Math.floor(rg.random()*blocksize)+(yblock+1)*blocksize;
    }
    //if(xblock==-1 &&yblock==-1) {
    //  print(x)
    //  print(y)
    //  print(x+','+y)
    //}
    var size = Math.floor(rg.random()*(max_size-min_size))+min_size;
    p = new Planet()
    p.x = x
    p.y = y
    p.r = size
    p.id = Math.floor(rg.random()*10000000)
    planets.push(p)
  }
  //print(rg.random()) 
  //return 1;
}



function draw_bodies(canvas,context) {
  for(var i = 0; i < planets.length; i++) {
    var p = planets[i];
    var mapcoord = galactic_coordinates.ToCartesian(p.x,p.y)
    var cc = canvas_coord(mapcoord.x,mapcoord.y)
    context.save();
    context.beginPath();
    context.arc(cc.x,cc.y,p.r,0,2*Math.PI);
    context.fillStyle='black';
    context.fill()
    context.stroke();
    context.fillStyle='white';
    context.textAlign="center";
    context.font="20px Ariel";
    context.fillText(planets[i].name,cc.x,cc.y)
    context.restore();
  }
  //context.save()
  //context.translate(1000,1000)
  var mapcoord = galactic_coordinates.ToCartesian(1000,1000)
  var cc = canvas_coord(mapcoord.x,mapcoord.y)
  context.save();
  context.beginPath();
  context.arc(cc.x,cc.y,100,0,2*Math.PI);
  context.fillStyle='black';
  context.fill()
  context.stroke();
  context.fillStyle='white';
  context.textAlign="center";
  context.font="20px Ariel";
  context.fillText("Middlehorndog",cc.x,cc.y)
  context.restore();
}

function update_galactic_coordinates() {
  var r = hero.Velocity()
  var theta = hero.Theta()
  var x = r*Math.cos(theta)
  var y = r*Math.sin(theta)
  galactic_coordinates.x_origin += x
  galactic_coordinates.y_origin += y
  //print(galactic_coordinates.x_origin+','+galactic_coordinates.y_origin)
}

function canvas_coord(x,y) {
  return {x:x,y:-y};
}

function update_hero_position(canvas) {

  //set throttle
  r = Math.sqrt(mousePos.x*mousePos.x+mousePos.y*mousePos.y)
  max_r = Math.min(hero.max_throttle*canvas.width/2,hero.max_throttle*canvas.height/2)
  if(r < max_r*hero.min_throttle) r = hero.throttle=0;
  else hero.throttle = Math.min((r-max_r*hero.min_throttle)/(max_r-hero.min_throttle*max_r),1);

  max_r = Math.min(canvas.width/2,canvas.height/2);
  r = hero.throttle;
  r_goal = hero.max_dist*max_r*r;
  theta_goal = Math.atan2(mousePos.y,mousePos.x)
  // catesian coordinates of where we want to go
  x_goal = r_goal*Math.cos(theta_goal)
  y_goal = r_goal*Math.sin(theta_goal)
  d = Math.sqrt((x_goal-hero.x)*(x_goal-hero.x)+(y_goal-hero.y)*(y_goal-hero.y))
  if(d < hero.acceleration) {
    // we can update distance to current
    hero.x = x_goal
    hero.y = y_goal
  } else {
    temp_theta = Math.atan2(hero.y-y_goal,hero.x-x_goal)
    delta_y = Math.sin(temp_theta)*hero.acceleration
    delta_x = Math.cos(temp_theta)*hero.acceleration
    hero.x = hero.x-delta_x
    hero.y = hero.y-delta_y
  }
  if(hero.theta > Math.PI) hero.theta -= 2*Math.PI;
  if(hero.theta <= -Math.PI) hero.theta += 2*Math.PI;
  if(Math.abs(hero.theta-theta_goal) < hero.turn_rate) {
    hero.theta = theta_goal;
  } else if(hero.theta >= Math.PI/2 && theta_goal <= -Math.PI/2) {
    hero.theta += hero.turn_rate;
  } else if(hero.theta <= -Math.PI/2 && theta_goal >= Math.PI/2) {
    hero.theta -= hero.turn_rate;
  } else if(hero.theta > theta_goal) {
    hero.theta -= hero.turn_rate;
  } else {
    hero.theta += hero.turn_rate;
  }
  //hero.x = xmov
  //hero.y = ymov
}

function draw_hero(canvas,context) {
  // global hero has stores state
  context.save();
  //context.rotate(theta);
  context.beginPath();

  c = canvas_coord(hero.x,hero.y)
  context.translate(c.x,c.y);
  context.rotate(-hero.theta+Math.PI/2);
  context.rect(-4,-2,8,4);
  context.stroke(); 
  context.restore()

}

function drop_shadow(context,msg,font_size,x,y) {
  context.save();
  context.font='bold '+font_size+'pt Calibri';
  context.globalAlpha=0.6;
  context.fillStyle='black';
  context.fillText(msg,x+Math.min(font_size/8,5),y+Math.min(font_size/8,5));
  context.globalAlpha=0.9;
  context.fillStyle='white';
  context.fillText(msg,x,y);
  context.restore();
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


var is_paused = false;

function toggle_pause() {
  if(get_input.length > 0) return; // different kind of apuse
  if(is_paused) is_paused = false;
  else is_paused = true;
  if(is_paused) {
    var canvas = document.getElementById("game_board");
    var context = canvas.getContext("2d");
    context.textAlign="center";
    cc = canvas_coord(0,0)
    drop_shadow(context,"PAUSED",90,cc.x,cc.y)
    context.restore();
  } else {
    stretch_canvas();
  }
}

// Debugging print function.
// Pre: any message to print and verbose set to true or false
// Post: if verbose is true then print to console
function print(msg) {
  if(verbose) { 
    console.log('$ '+msg);
  }
}  
