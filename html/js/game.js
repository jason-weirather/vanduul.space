// overal globals

var verbose = true;
var finished = false;
var mouseState = "up";
var is_paused = false;
var global_counter = 0;

//animate destruction
//holds ships that are currently being destroyed
var destroyed_ships = [];

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
// Used for scanning which is in Scan.js


var enemies = []
// Storing all enemies

var hero = new Ship();
// Storing player ship


var planets = []
// Functions defined in ProceduralUniverse

var proceedural_blocks = {}
// These are set in ProceduralUniverse


// Important class/global used to go in between universe and on-screen cartesian coordinates.
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
function PlayerProjectile(xinit,yinit,theta,weapon,is_friendly) {
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
  this.friendly = is_friendly;
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
  global_counter += 1;
  if(global_counter > 16000) global_counter = 0;
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
    //Easter egg
    if(planets[get_input[1]].name.match(/jumbify/i)) {
      planets[get_input[1]].text_color="#000000";
      planets[get_input[1]].color = "#F87217";
    }
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
  if(global_counter%3==0) {
    spawn_enemies(canvas);
  }
  if(global_counter%3==1) {
    update_bodies();
  }
  if(global_counter%3==2) {
    update_projectiles();
  }
  update_enemies(canvas);
  draw_bodies(canvas,context);
  draw_destroyed(canvas,context);
  draw_particles(canvas,context);
  draw_enemies(canvas,context);
  draw_hero(canvas,context);
  draw_hero_projectiles(canvas,context);
  check_scan(canvas,context);
  check_triggers();
  draw_hud(canvas,context);
}

function update_projectiles() {
  // check the projectiles against the planets
  var buffer = []
  for(var i = 0; i < player_projectiles.length; i++) {
    var no_collision = true;
    var gc = galactic_coordinates.ToGalactic(player_projectiles[i].x,player_projectiles[i].y);
    for(j = 0; j < planets.length; j++) {
      var dx = planets[j].galactic_x-gc.x
      var dy = planets[j].galactic_y-gc.y
      if(point_distance(planets[j].galactic_x,planets[j].galactic_y,gc.x,gc.y)-planets[j].r-player_projectiles[i].r>0) continue;
      no_collision = false;
      break;
    }
    if(no_collision) buffer.push(player_projectiles[i]);
  }
  player_projectiles = buffer;
}

function draw_destroyed(canvas,context) {
  max_time = 180;
  //print(destroyed_ships.length);
  buffer = []
  for(i=0;i<destroyed_ships.length;i++) {
    var e = destroyed_ships[i];
    // turn off the scan output
    e.scanned = false;
    // do update their galactic coordinates
    cc = galactic_coordinates.ToCartesian(e.galactic_x,e.galactic_y);
    // do set thier throttle to zero
    e.throttle = 0;
    // increment the destroyed frame
    e.damage_frames += 1;
    // set hitbox to 0
    e.r = 0;
    e.SetCartesian(cc.x,cc.y);
    context.save();
    //var cc = galactic_coordinates.ToCartesian(e.x,e.y);
    var c = canvas_coord(e.cartesian_x,e.cartesian_y)
    context.translate(c.x,c.y);
    context.rotate(-e.theta);
    e.Draw(context);
    context.restore();    
    if(e.damage_frames < max_time) buffer.push(e);
  }
  destroyed_ships = buffer; // ones that still have time
}

function check_triggers() {
  process_trigger(hero);
  for(i = 0; i < enemies.length;i++) {
    process_trigger(enemies[i]);
  }
}

function process_trigger(ship) {
    // do hero energy
    ship.energy += ship.energy_recharge;
    ship.energy = Math.min(ship.energy,ship.max_energy);
    if(ship.trigger == 'down') {
      // update hero ship
      for(var i = 0;i < ship.hard_points.length;i++) {
        w = ship.hard_points[i]
        //w.rof
        //w.trigger_frame
        if(w.trigger_frame%w.rof==0 && ship.energy >= w.energy) { 
          ship.energy-=w.energy;
          //var context = canvas.getContext("2d")
          //for(var i=0; i < hero.hard_points.length; i++) {
          b = new PlayerProjectile(ship.cartesian_x,ship.cartesian_y,ship.theta,w,ship.friendly)
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
    e.Draw(context);
    context.restore();
  }
}

function spawn_enemies(canvas) {
  // put enemies into play
  var max_enemies = 30;
  while(enemies.length < max_enemies) {
    rnx = Math.random();
    cx = (rnx*canvas.width)- canvas.width/2;
    if(rnx > 0.5) cx+=canvas.width/2+100;
    else cx-=canvas.width/2-100;
    rny = Math.random();
    cy = (rny*canvas.height)- canvas.height/2;
    if(rny > 0.5) cy+=canvas.width/2+100;
    else cy-=canvas.width/2-100;
    // use galactic coordinates for the enmies
    gc = galactic_coordinates.ToGalactic(cx,cy);
    // make sure this is not a planetary position
    var too_close = false;
    for(var i = 0; i < planets.length; i++) {
      var p = planets[i];
      if(point_distance(p.galactic_x,p.galactic_y,gc.x,gc.y)<p.r+100) {
        too_close = true;
        break;
      }
    }
    if(too_close) break;
    var e = new Ship();
    e.SetGalactic(gc.x,gc.y);
    //e.x = gc.x;
    //e.y = gc.y;

    //scanner gameplay
    var min_degrees = 200;
    var max_degrees = 300;
    var rangle =(Math.random()*(max_degrees-min_degrees)+min_degrees)*Math.PI/180;
    var rnum = Math.random()*2*Math.PI;
    e.scan_distance = 250;
    e.scan_range_start=0+rnum;
    e.scan_range_end=rangle+rnum;
    e.scan_range_start %= 2*Math.PI;
    e.scan_range_end %= 2*Math.PI;


    e.min_throttle = 0;
    e.max_throttle = 1;
    e.type = 'scythe'
    e.throttle = 0.5;
    e.trigger = 'down';
    e.engine_power = 3;
    e.r = 10;
    e.theta = 1;
    e.turn_rate = 0.005;
    e.acceleration = 0.5;
    e.hard_points = []
    e.freindly = false; // tell ship and projectile is not friendly
    var h1 = new HardPoint();
    h1.x = 20;
    h1.y = 5;
    h1.size = 5;
    h1.rof = 140;
    h1.damage = 200;
    h1.range = 4050;
    //var h2 = new HardPoint();
    //h1.x = 40;
     //h1.y = 30;
    //var h3 = new HardPoint();
    //h1.x = 20;
    //h1.y = 30;
    e.hard_points.push(h1);
    //e.hard_points.push(h2);
    //e.hard_points.push(h3);
    e.energy = 100;
    e.max_energy = 100;
    e.energy_recharge = 0.01;

    enemies.push(e);
  }
  // remove enemies that are too far away
  var buffer = [];
  for(var i=0; i < enemies.length; i++) {
    var e = enemies[i];
    var dx = e.cartesian_x-hero.cartesian_x;
    var dy = e.cartesian_y-hero.cartesian_y;
    d = Math.sqrt(dx*dx+dy*dy);
    if(d > Math.max(canvas.height,canvas.width)*3) continue;
    buffer.push(e)
  }
  enemies = buffer;
}

function update_enemies(canvas) {
  // update enemy positions
  for(var i=0; i < enemies.length; i++) {
    var e = enemies[i];
    e.theta+=e.turn_rate;
    //print(e.Velocity())
    if(e.throttle < 0.1) {
      e.throttle = 0.6;
    }
    newx = e.Velocity()*Math.cos(e.theta);
    newy = e.Velocity()*Math.sin(e.theta);
    newx+=e.galactic_x;
    newy+=e.galactic_y;
    e.MakeGalacticPositionChange(newx,newy,e.acceleration,canvas,[planets]);
    e.SetGalactic(newx,newy);
    e.x+=newx
    e.y+=newy
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
    else destroyed_ships.push(enemies[i]);
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

  //display throttle
  msg = Math.round(hero.energy/hero.max_energy*100)+'%';
  drop_shadow(context,msg,20,-1*canvas.width/2+30,-1*canvas.height/2+90);

  //display help
  msg = 'Press SPACE for PAUSE.  Left click to FIRE.'
  drop_shadow(context,msg,16,-1*canvas.width/2+30,canvas.height/2-30)

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
  var r = Math.sqrt(mousePos.x*mousePos.x+mousePos.y*mousePos.y)
  var max_r = Math.min(hero.max_throttle*canvas.width/2,hero.max_throttle*canvas.height/2)
  //print(hero.throttle);
  if(hero.throttle < 0) hero.throttle+=hero.acceleration;
  else if(r < max_r*hero.min_throttle) hero.throttle=0;
  else hero.throttle = Math.min((r-max_r*hero.min_throttle)/(max_r-hero.min_throttle*max_r),1);
  max_r = Math.min(canvas.width/2,canvas.height/2);
  r = hero.throttle;
  var r_goal = hero.max_dist*max_r*r;

  var theta_goal = Math.atan2(mousePos.y,mousePos.x);
  hero.MakeHeadingChange(theta_goal,hero.turn_rate);
  // catesian coordinates of where we want to go
  var x_goal = r_goal*Math.cos(theta_goal)
  var y_goal = r_goal*Math.sin(theta_goal)
  hero.MakeCartesianPositionChange(x_goal,y_goal,hero.acceleration,canvas,[enemies,planets]);
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

function check_no_collisions(canvas,ship,bodies) {
  var max_distance = Math.max(canvas.width+1000,canvas.height+1000);
  for(i=0;i<bodies.length;i++) {
    var p = bodies[i];
    var d2 = (p.galactic_x-ship.galactic_x)*(p.galactic_x-ship.galactic_x)+(p.galactic_y-ship.galactic_y)*(p.galactic_y-ship.galactic_y);
    if(d2 > max_distance*max_distance) continue;
    // check closer for neighboring bodies
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
  hero.Draw(context);
  context.restore();
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

function point_distance(x1,y1,x2,y2) {
  return Math.sqrt((x1-x2)*(x1-x2)+(y1-y2)*(y1-y2));
}

// Debugging print function.
// Pre: any message to print and verbose set to true or false
// Post: if verbose is true then print to console
function print(msg) {
  if(verbose) { 
    console.log('$ '+msg);
  }
}  

