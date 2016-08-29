// overal globals
var verbose = true;
var finished = false;
var mouseState = "up";
var is_paused = false;

var get_input = [];

var fx_animations = []
function fx(gx,gy,duration,size) {
  this.x = gx;
  this.y = gy;
  this.duration = duration;
  this.ttl = this.duration; //countdown till finished
  this.size = size;
  var self = this;
  this.Draw(context) = function() {
    return;
  }
}

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
    var dx =planets[i].x - hero.galactic_x
    var dy = planets[i].y - hero.galactic_y
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

// accuracy: control spread of theta upon fire
// speed: how fast projectile travels
// damage:
// range: pixels projectile can travel before disappearing
//{accuracy:0.95,speed:4,size:2,damage:3,range:800}

function HardPoint() {
  this.x = 0;
  this.y = 0;
  this.theta = 0;
  this.accuracy=0.95;
  this.speed=4;
  this.size=2;
  this.damage=30;
  this.range=800;
  this.rof=5; //frames per shot
  this.trigger_frame=0; //count frames of trigger depress
}

var enemies = []

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
  this.cartesian_x=0;
  this.cartesian_y=0;
  this.galactic_x=0;
  this.galactic_y=0;
  this.theta=0; // angle of sprite
  this.throttle=0;

  this.engine_power=3;
  this.turn_rate=0.05;
  this.current_turn=0;
  this.acceleration=0.2;
  this.hard_points = []
  this.r = 10;
  this.health = 100;

  //Player properties
  this.min_throttle=0.2; //deadzone low
  this.max_throttle=0.9; //deadzone high
  this.max_dist=0.2;     //max distance can traverse from origin (for a player)

  var self = this;
  //Functions of Ship
  this.Velocity = function() {
     return self.engine_power*self.throttle;
  }
  this.OriginTheta = function() { // Angle offset from center of map
    return Math.atan2(self.cartesian_y,self.cartesian_x);
  }
  this.PressTrigger=function(){
    self.trigger = "down";
  }
  this.ReleaseTrigger=function(){
    self.trigger = "up";
    for(var i = 0; i < self.hard_points.length; i++) {
      self.hard_points[i].trigger_frames = 0;
    }
  }
  // Set a new coordinate here (from center of screen as origin)
  this.SetCartesian=function(x,y){
    self.cartesian_x = x;
    self.cartesian_y = y;
    var gc = galactic_coordinates.ToGalactic(x,y);
    self.galactic_x = gc.x;
    self.galactic_y = gc.y;
  }
  // Set a new coordinate here (from center of galaxy as origin)
  this.SetGalactic=function(x,y){
    self.galactic_x = x;
    self.galactic_y = y;
    var cc = galactic_coordinates.ToCartesian(x,y);
    self.cartesian_x = cc.x;
    self.cartesian_y = cc.y;
  }
  // take a new theta you want to face and a turn rate you can get there
  // this will set a new theta based on the request
  this.MakeHeadingChange = function(new_heading,turn_rate) {
    
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
    var yb = Math.floor(self.y/blocksize);
    return {xblock:xb,yblock:yb};
  }
}

var galactic_coordinates = new GalacticCoordinates();

function GalacticCoordinates() {
  this.x_origin = 0;
  this.y_origin = 0;
  var self = this;
  // convert screen cartesian to galactic
  this.ToGalactic = function(x_car,y_car) {
    return {x:self.x_origin+x_car,y:self.y_origin+y_car};
  }
  this.ToCartesian = function(x_gal,y_gal) {
    return {x:x_gal-self.x_origin,y:y_gal-self.y_origin};
  }
}


var player_projectiles = []
//one player bullet
function PlayerProjectile(xinit,yinit,theta,weapon) {
  this.x = xinit;
  this.y = yinit;
  var weapon_r = Math.sqrt(weapon.x*weapon.x+weapon.y*weapon.y)
  //print(weapon_r);
  this.x += weapon_r*Math.cos(theta+weapon.theta);
  this.y += weapon_r*Math.sin(theta+weapon.theta);
  this.theta = theta+2*(Math.random()-0.5)*(1-weapon.accuracy);
  this.weapon = weapon;
  this.r = this.weapon.size;
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
  max_size = 10
  this.alpha = 0.3 // transparency
  this.size = Math.random()*(max_size-min_size)+min_size
  this.r = this.size //used in collision detection
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
  //canvas.addEventListener('click',function(e) {
  //  //update global
  //  fire_player_weapon(canvas,e);
  //});
  document.onmousedown = function(e) {
    //update global
    mouseState = 'down';
    hero.PressTrigger();
  }
  document.onmouseup = function(e) {
    //update global
    mouseState = 'up';
    // release trigger
    hero.ReleaseTrigger();
  }
  document.body.onkeyup = function(e) {
    if(e.keyCode==32) {
      toggle_pause();
    }
  }

  // Can set up some variables
  var hero_weapon = new HardPoint();
  hero_weapon.x = 15
  hero_weapon.y = 0
  hero.hard_points.push(hero_weapon);

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
  max_particles = 500;
  canvas_multiplier = 1.5;  //how far out to spread particles
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
    if(p.ttl/p.ttl_init <=0.5) {
      alpha_scale = 2*p.ttl/p.ttl_init
    } else {
      alpha_scale = 2*(1-p.ttl/p.ttl_init)
    }
    // adjust 
    r = hero.Velocity()
    r = r-r*p.drag

    theta = Math.atan2(hero.cartesian_y,hero.cartesian_x)
    p.x = p.x-Math.cos(theta)*r
    p.y = p.y-Math.sin(theta)*r
    c = canvas_coord(p.x,p.y)
    context.save();

    context.globalAlpha=alpha_scale*p.alpha;
    context.beginPath();
    //context.strokeStyle = 'gray';
    context.arc(c.x,c.y,p.size,2*Math.PI,false);
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
  // initialize common variables
  context.strokeStyle='black';
  context.globalAlpha = 1;
  context.lineWidth=1;


  //Now draw cooler stuff

  update_hero_position(canvas);
  update_galactic_coordinates();
  update_bodies();
  update_enemies(canvas);
  draw_bodies(canvas,context);
  draw_enemies(canvas,context);
  draw_particles(canvas,context);
  draw_hero(canvas,context);
  draw_hero_projectiles(canvas,context);
  check_scan(canvas,context);
  check_triggers();
  draw_hud(canvas,context);
}

function check_triggers() {
  if(hero.trigger == 'down') {
    // update hero ship
    for(var i = 0;i < hero.hard_points.length;i++) {
      w = hero.hard_points[i]
      //w.rof
      //w.trigger_frame
      if(w.trigger_frame%w.rof==0) { 
        //var context = canvas.getContext("2d")
        //for(var i=0; i < hero.hard_points.length; i++) {
        b = new PlayerProjectile(hero.cartesian_x,hero.cartesian_y,hero.theta,w)
        player_projectiles.push(b)
      }
      w.trigger_frame += 1;
    }
  }     
}

function draw_enemies(canvas,context) {
  for(var i=0;i<enemies.length;i++){
    var e = enemies[i];
    context.save();
    //var cc = galactic_coordinates.ToCartesian(e.x,e.y);
    var c = canvas_coord(e.cartesian_x,e.cartesian_y)
    context.translate(c.x,c.y);
    context.rotate(-e.theta);
    draw_scythe(context,enemies[i]);
    context.restore();
  }
}

function update_enemies(canvas) {
  // put enemies into play
  var max_enemies = 10;
  while(enemies.length < max_enemies) {
    var e = new Ship();
    cx = (Math.random()*canvas.width)- canvas.width/2;
    cy = (Math.random()*canvas.height)- canvas.height/2;
    // use galactic coordinates for the enmies
    gc = galactic_coordinates.ToGalactic(cx,cy);
    e.SetGalactic(gc.x,gc.y);
    //e.x = gc.x;
    //e.y = gc.y;
    e.min_throttle = 0;
    e.max_throttle = 1;
    e.throttle = 0.5;
    e.engine_power = 3;
    e.r = 10;
    e.theta = 1;
    e.turn_rate = 0.005;
    e.acceleration = 0.5;
    enemies.push(e);
  }
  // update enemy positions
  for(var i=0; i < enemies.length; i++) {
    var e = enemies[i];
    e.theta+=e.turn_rate;
    //print(e.Velocity())
    newx = e.Velocity()*Math.cos(e.theta);
    newy = e.Velocity()*Math.sin(e.theta);
    newx+=e.galactic_x;
    newy+=e.galactic_y;
    e.SetGalactic(newx,newy);
    //e.x+=newx
    //e.y+=newy
  }
  // check for projectile hits
  //for(var i = 0; i < player_projectiles.length; i++) {
  var enemy_buffer = [];
  for(var i=0; i < enemies.length; i++) {
    var hits = collision_details(canvas,enemies[i],player_projectiles);
    for(var j = 0; j < hits.length; j++) {
      enemies[i].health-=player_projectiles[hits[j]].weapon.damage;
      //print(enemies[i].health);
    }
    if(enemies[i].health > 0) enemy_buffer.push(enemies[i]);
    var buffer = [];
    if(hits.length > 0) {
      for(var j = 0; j < player_projectiles.length; j++) {
        if(!(hits.includes(j))) buffer.push(player_projectiles[j]);
      }
    } else buffer = player_projectiles;
    player_projectiles = buffer;
  }
  enemies = enemy_buffer;
}

function draw_hud(canvas,context) {
  //Draw mouse coordinate for debugging purposes
  //context.font='20pt Calibri';
  //context.fillStyle='white';
  var quad = 'A';
  var rx =Math.round(hero.galactic_x/500);
  var ry =Math.round(hero.galactic_y/500);
  if(rx < 0 && ry >=0) quad = 'B';
  else if(rx < 0 && ry < 0) quad = 'C';
  else if(rx >= 0 && ry < 0) quad = 'D';
  msg = quad+'/'+pad(Math.abs(rx),8)+'/'+pad(Math.abs(ry),8);
  drop_shadow(context,msg,20,-1*canvas.width/2+30,-1*canvas.height/2+30)

  //display throttle
  msg = Math.round(hero.throttle*100)+'%';
  drop_shadow(context,msg,20,-1*canvas.width/2+30,-1*canvas.height/2+60);
  msg = Math.round(hero.Velocity()*60)+'m/s';
  drop_shadow(context,msg,20,-1*canvas.width/2+100,-1*canvas.height/2+60);

  //display help
  msg = 'Press SPACE for PAUSE.  Left click to FIRE.'
  drop_shadow(context,msg,16,-1*canvas.width/2+30,canvas.height/2-30)

}

function update_bodies() {
  var gc = galactic_coordinates;
  var blocksize = 5000;
  var curblock_x = Math.floor(gc.x_origin/blocksize);
  var curblock_y = Math.floor(gc.y_origin/blocksize);
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
  var max_planets=50;
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
    var size = Math.floor(rg.random()*(max_size-min_size))+min_size;
    p = new Planet()
    p.x = x
    p.y = y
    p.r = size
    p.id = Math.floor(rg.random()*10000000)
    planets.push(p)
  }
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
  var theta = hero.OriginTheta()
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
  if(hero.theta > Math.PI) hero.theta -= 2*Math.PI;
  if(hero.theta <= -Math.PI) hero.theta += 2*Math.PI;
  // can get our turning direction
  hero.current_turn = 0;
  if(Math.abs(hero.theta-theta_goal) < hero.turn_rate) {
    hero.theta = theta_goal;
  } else if(hero.theta >= Math.PI/2 && theta_goal <= -Math.PI/2) {
    hero.theta += hero.turn_rate;
    hero.current_turn = 1;
  } else if(hero.theta <= -Math.PI/2 && theta_goal >= Math.PI/2) {
    hero.theta -= hero.turn_rate;
    hero.current_turn = -1;
  } else if(hero.theta > theta_goal) {
    hero.theta -= hero.turn_rate;
    hero.current_turn = -1;
  } else {
    hero.theta += hero.turn_rate;
    hero.current_turn = 1;
  }

  // catesian coordinates of where we want to go
  var x_goal = r_goal*Math.cos(theta_goal)
  var y_goal = r_goal*Math.sin(theta_goal)
  var xnext = hero.cartesian_x  //our current value
  var ynext = hero.cartesian_y  //our current value
  var d = Math.sqrt((x_goal-hero.cartesian_x)*(x_goal-hero.cartesian_x)+(y_goal-hero.cartesian_y)*(y_goal-hero.cartesian_y))
  if(d < hero.acceleration) {
    // we can update distance to current
    xnext = x_goal
    ynext = y_goal
  } else {
    var temp_theta = Math.atan2(hero.cartesian_y-y_goal,hero.cartesian_x-x_goal)
    delta_y = Math.sin(temp_theta)*hero.acceleration
    delta_x = Math.cos(temp_theta)*hero.acceleration
    xnext = hero.cartesian_x-delta_x
    ynext = hero.cartesian_y-delta_y
  }
  // Check the values
  //gc = galactic_coordinates.ToGalactic(xnext,ynext);
  if(check_no_collisions(canvas,hero,planets) && check_no_collisions(canvas,hero,enemies)) {
    // safe to update
    hero.SetCartesian(xnext,ynext);
  } else {
    hero.throttle = -3;
    hero.theta -=0.5
    //print('collision')
  }
}

function collision_details(canvas,ship,projectiles) {
  var max_distance = Math.max(canvas.width+1000,canvas.height+1000);
  collisions = []
  for(i=0;i<projectiles.length;i++) {
    var p = projectiles[i];
    var gc = galactic_coordinates.ToGalactic(p.x,p.y);
    var d2 = (gc.x-ship.galactic_x)*(gc.x-ship.galactic_x)+(gc.y-ship.galactic_y)*(gc.y-ship.galactic_y);
    if(d2 > max_distance*max_distance) continue;
    // check closer for neighboring planets
    if(Math.sqrt(d2) <= p.r+ship.r) {
      collisions.push(i);
      //print('colission')
    }
  }
  return collisions;
}

function check_no_collisions(canvas,ship,planets) {
  var gc = galactic_coordinates.ToGalactic(ship.x,ship.y);
  var max_distance = Math.max(canvas.width+1000,canvas.height+1000);
  for(i=0;i<planets.length;i++) {
    var p = planets[i];
    var d2 = (p.x-gc.x)*(p.x-gc.x)+(p.y-gc.y)*(p.y-gc.y);
    if(d2 > max_distance*max_distance) continue;
    // check closer for neighboring planets
    if(Math.sqrt(d2) <= p.r+ship.r) return false;
  }
  return true;
}


function draw_hero(canvas,context) {
  // global hero has stores state
  context.save();
  c = canvas_coord(hero.cartesian_x,hero.cartesian_y)
  context.translate(c.x,c.y);
  context.rotate(-hero.theta);
  draw_terrapin(context,hero);
  context.restore();
}


function draw_scythe(context,ship) {
  context.save();
  context.fillStyle="#424242";
  rectangle(context,-15,-4,13,8);
  rectangle(context,-3,-2,8,4);
  context.fillStyle="#A4A4A4";
  triangle(context,-10,3,-13,20,25,20);
  triangle(context,-10,23,-5,30,25,23);
  context.fillStyle="#D8D8D8";
  rectangle(context,-10,19,35,5);
  context.fillStyle="#A4A4A4";
  triangle(context,-10,-3,-13,-10,10,-10);
  context.fillStyle="#424242 ";
  rectangle(context,-13,-13,25,4);
  rectangle(context,6,-1,2,2);
  context.fillStyle="#D8D8D8";
  rectangle(context,-18,-5,10,4);
  rectangle(context,-18,1 ,10,4);

  //add engines
  var trail_size = 4;
  var trail_color = "254,100,46";
  var min_alpha = 0.1;
  var max_alpha = 0.9;
  var t = Math.round(ship.throttle*trail_size);

  var t_right = t;
  //engine 1
  if(ship.current_turn==1) t_right=Math.floor(t_right/2);
  for(var i=0; i < t_right; i++) {
    var alpha = (1-i/t_right)*(max_alpha-min_alpha)+min_alpha
    context.strokeStyle="rgba("+trail_color+","+alpha+")";
    rectangle(context,-22-(trail_size*i),-6,1,3);
  }

  var t_left = t;
  // engine 2
  if(ship.current_turn==-1) t_left=Math.floor(t_left/2);
  for(var i=0; i < t_left; i++) {
    var alpha = (1-i/t_left)*(max_alpha-min_alpha)+min_alpha
    context.strokeStyle="rgba("+trail_color+","+alpha+")";
    rectangle(context,-22-(trail_size*i),1,1,3);
  }

  context.restore();
}

function triangle(context,x1,y1,x2,y2,x3,y3) {
  context.save();
  context.beginPath();
  context.moveTo(x1,y1);
  context.lineTo(x2,y2);
  context.lineTo(x3,y3);
  context.closePath();
  context.fill();
  context.stroke();
  context.restore();
}

function draw_terrapin(context,ship) {
  context.save();
  context.fillStyle='gray';
  ellipse(context,0,0,15,10);
  context.fillStyle='black'; //canopy
  ellipse(context,9,0,3,2);

  context.fillStyle='#8A0808'; // red dish
  ellipse(context,-3,0,6,6);
  context.fillStyle='gray';
  ellipse(context,-3,0,4,4);

  context.fillStyle='black';
  rectangle(context,15,-1.5,3,3);

  context.fillStyle='#424242'; // engin colors
  rectangle(context,6,-12,4,4);
  rectangle(context,6,8,4,4);

  rectangle(context,-13,-12,5,5);
  rectangle(context,-13,7,5,5);

  // Do engin trails
  var trail_size = 4;
  var trail_color = "0,51,102";
  var min_alpha = 0.1;
  var max_alpha = 0.5;
  var t = Math.round(ship.throttle*trail_size);

  var t_right = t;
  //engine 1
  if(ship.current_turn==1) t_right=Math.floor(t_right/2);
  for(var i=0; i < t_right; i++) {
    var alpha = (1-i/t_right)*(max_alpha-min_alpha)+min_alpha
    context.strokeStyle="rgba("+trail_color+","+alpha+")";
    rectangle(context,-17-(trail_size*i),-12,1,4);
  }

  // thurster 1
  context.strokeStyle="rgba("+trail_color+","+max_alpha+")";
  if(ship.current_turn==1) rectangle(context,6,14,3,1);

  var t_left = t;
  // engine 2
  if(ship.current_turn==-1) t_left=Math.floor(t_left/2);
  for(var i=0; i < t_left; i++) {
    var alpha = (1-i/t_left)*(max_alpha-min_alpha)+min_alpha
    context.strokeStyle="rgba("+trail_color+","+alpha+")";
    rectangle(context,-17-(trail_size*i),7,1,4);
  }
  //thruster 2
  context.strokeStyle="rgba("+trail_color+","+max_alpha+")";
  if(ship.current_turn==-1) rectangle(context,6,-16,3,1);
  context.restore();
}

function ellipse(context,cx,cy,rx,ry) {
  context.beginPath();
  context.save();
  context.translate(cx-rx,cy-ry);
  context.scale(rx,ry);
  context.arc(1,1,1,0,2*Math.PI,false);
  context.restore();
  context.fill();
  context.stroke();
}

function rectangle(context,cx,cy,wd,ht) {
  context.beginPath();
  context.rect(cx,cy,wd,ht);
  context.fill();
  context.stroke();
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

