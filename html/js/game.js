// overal globals

var verbose = true;
var finished = false;
var mouseState = "up";
var is_paused = false;
var global_counter = 0;

var destroyed_ships = [];
//animate destruction. holds ships that are currently being destroyed

var stop_counter = 0;
// Used for scanning which is in Scan.js

var get_input = [];
// used for reading in text input

var particles = []
// in Environment.js

var galactic_origin = {galactic_x:0,galactic_y:0};
// galactic position of origin

var fx_animations = []
function fx(coord,duration,size) {
  this.coord = coord;
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


var enemies = []
// Storing all enemies

var hero = new Ship();
// Storing player ship


var planets = []
// Functions defined in ProceduralUniverse

var proceedural_blocks = {}
// These are set in ProceduralUniverse


//Global for the mouse position in cartesian
var mousePos = {x:0,y:0};


// Coordinate good for things other than the player
function Coordinates() {
  // get galactic origin from global
  //this._galactic_origin_x = galactic_origin.galactic_x;
  //this._galactic_origin_y = galactic_origin.galactic_y;
  this._galactic_x = 0;
  this._galactic_y = 0;
  var self = this;
  this.SetGalactic = function(x,y) {
    self._galactic_x = x;
    self._galactic_y = y;
  }
  this.SetCartesian = function(x,y) {
    self._galactic_x = galactic_origin.galactic_x+x;
    self._galactic_y = galactic_origin.galactic_y+y;
  }
  this.GetCartesian  = function() {
    return {x:self._galactic_x-galactic_origin.galactic_x,y:self._galactic_y-galactic_origin.galactic_y};
  }
  this.GetGalactic = function() {
    return {x:self._galactic_x,y:self._galactic_y};
  }
  this.GetCanvas = function() {
    var cart = self.GetCartesian();
    return {x:cart.x,y:-1*cart.y};
  }
  this.copy = function() {
    var c = new Coordinates();
    c.SetGalactic(self.GetGalactic().x,self.GetGalactic().y);
    return c;
  }
  this.GetDistance = function(coord2) {
    var x1 = self.GetCartesian().x;
    var y1 = self.GetCartesian().y;
    var x2 = coord2.GetCartesian().x;
    var y2 = coord2.GetCartesian().y;
    return Math.sqrt((x1-x2)*(x1-x2)+(y1-y2)*(y1-y2));
  }
  this.print = function () {
    console.log('$ C:'+Math.floor(self.GetCartesian().x)+','+Math.floor(self.GetCartesian().y)+' G:'+Math.floor(self.GetGalactic().x)+','+Math.floor(self.GetGalactic().y))
  }
}



// Coordinate type for the player
function PlayerCoordinates() {
  // get galactic origin from global
  //this._galactic_origin_x = galactic_origin.galactic_x;
  //this._galactic_origin_y = galactic_origin.galactic_y;
  var self = this;
  self._cartesian_x = 0;
  self._cartesian_y = 0;
  this.SetCartesian = function(x,y) {
    self._cartesian_x = x;
    self._cartesian_y = y;
  }
  this.GetCartesian  = function() {
    return {x:self._cartesian_x,y:self._cartesian_y};
  }
  this.GetGalactic = function() {
    return {x:self._cartesian_x+galactic_origin.galactic_x,y:self._cartesian_y+galactic_origin.galactic_y};
  }
  this.GetCanvas = function() {
    var cart = self.GetCartesian();
    return {x:self._cartesian_x,y:-1*self._cartesian_y};
  }
  this.copy = function() {
    var c = new Coordinates();
    c.SetGalactic(self.GetGalactic().x,self.GetGalactic().y);
    return c;
  }
  this.GetDistance = function(coord2) {
    var x1 = self.GetCartesian().x;
    var y1 = self.GetCartesian().y;
    var x2 = coord2.GetCartesian().x;
    var y2 = coord2.GetCartesian().y;
    return Math.sqrt((x1-x2)*(x1-x2)+(y1-y2)*(y1-y2));
  }
  this.print = function () {
    console.log('$ C:'+Math.floor(self.GetCartesian().x)+','+Math.floor(self.GetCartesian().y)+' G:'+Math.floor(self.GetGalactic().x)+','+Math.floor(self.GetGalactic().y))
  }
}



var player_projectiles = []
//one player bullet
function PlayerProjectile(ship,weapon) {
  var weapon_r = Math.sqrt(weapon.x*weapon.x+weapon.y*weapon.y)
  //print(weapon_r);
  var x = ship.coord.GetCartesian().x;
  var y = ship.coord.GetCartesian().y;
  x += weapon_r*Math.cos(ship.theta+weapon.theta);
  y += weapon_r*Math.sin(ship.theta+weapon.theta);
  this.coord = new Coordinates();
  this.coord.SetCartesian(x,y);
  this.theta = ship.theta+2*(Math.random()-0.5)*(1-weapon.accuracy);
  this.weapon = weapon;
  this.r = this.weapon.size;
  this.traversed = 0;
  this.friendly = ship.friendly;
}


//{xreal:0,yreal:0,x:0,y:0,xcanvas:0,ycanvas:0,theta:0}

// Start-up functoin
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
    update_mouse_position(canvas,e);
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
    // add extra for unpausing on pause screen
    if(is_paused==true) toggle_pause();
    hero.ReleaseTrigger();
  }
  document.body.onkeyup = function(e) {
    if(e.keyCode==32) {
      toggle_pause();
    }
  }
  document.body.onmouseout = function() {
    if(!is_paused) toggle_pause();
  }

  // Can set up some variables
  var hero_weapon = new HardPoint();
  hero_weapon.x = 15
  hero_weapon.y = 0
  hero.hard_points.push(hero_weapon);
  hero.coord = new PlayerCoordinates();  // give hero the special coordinates

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
    var bc = b.coord.GetCartesian();
    var x = bc.x;
    var y = bc.y;
    x+=Math.cos(b.theta)*b.weapon.speed;
    y+=Math.sin(b.theta)*b.weapon.speed;
    b.coord.SetCartesian(x,y);
    c = b.coord.GetCanvas();
    //c = canvas_coord(b.coord.GetCartesian().x,b.cy)
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

function pad(num,size) {
  var s= "00000000000"+num;
  return s.substr(s.length-size);
}

function update_canvas() {
  var canvas = document.getElementById("game_board");
  var context = canvas.getContext("2d");
  //if(mousePos.x <= -canvas.width/2 || mousePos.x >= canvas.width/2) {
  //  toggle_pause();
  //  return;
  //}


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
  update_galactic_origin();
  if(global_counter%3==0) {
    spawn_enemies(canvas);
  }
  if(global_counter%3==1) {
    update_bodies();
  }
  if(global_counter%3==2) {
    update_projectiles();
  }
  update_enemies(canvas,context);
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
    var gc = player_projectiles[i].coord.GetGalactic();
    for(j = 0; j < planets.length; j++) {
      var distance = planets[j].coord.GetDistance(player_projectiles[i].coord);
      //var dx = planets[j].galactic_x-gc.x
      //var dy = planets[j].galactic_y-gc.y
      //point_distance(planets[j].galactic_x,planets[j].galactic_y,gc.x,gc.y)
      if(distance-planets[j].r-player_projectiles[i].r>0) continue;
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
    cc = e.coord.GetCanvas();
    // do set thier throttle to zero
    e.throttle = 0;
    // increment the destroyed frame
    e.damage_frames += 1;
    // set hitbox to 0
    e.r = 0;
    //e.SetCartesian(cc.x,cc.y);
    context.save();
    //var cc = galactic_coordinates.ToCartesian(e.x,e.y);
    context.translate(cc.x,cc.y);
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
          var gc = new Coordinates();
          gc.SetCartesian(ship.coord.GetCartesian().x,ship.coord.GetCartesian().y);
          b = new PlayerProjectile(ship,w)
          player_projectiles.push(b)
        }
        w.trigger_frame += 1;
      }
    }
}

function draw_hud(canvas,context) {
  //Draw mouse coordinate for debugging purposes
  //context.font='20pt Calibri';
  //context.fillStyle='white';
  var quad = 'A';
  var gc = hero.coord.GetGalactic();
  var rx =Math.round(gc.x/500);
  var ry =Math.round(gc.y/500);
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

  //display credit
  context.save();
  context.textAlign="end";
  msg = 'This is a free fan-made game by Vacation.';
  drop_shadow(context,msg,16,canvas.width/2-30,canvas.height/2-60)
  msg = 'The background image is a modified Cloud Imperium Games image.';
  drop_shadow(context,msg,16,canvas.width/2-30,canvas.height/2-30)
  
  context.restore();

}

function update_galactic_origin() {
  var r = hero.Velocity();
  var theta = hero.Theta();
  var x = r*Math.cos(theta);
  var y = r*Math.sin(theta);
  //  //var galactic_origin = {galactic_x:0,galactic_y:0};
  galactic_origin.galactic_x +=x;
  galactic_origin.galactic_y +=y;
}


function update_hero_position(canvas) {
  //set throttle
  var r = Math.sqrt(mousePos.x*mousePos.x+mousePos.y*mousePos.y)
  var max_r = Math.min(hero.max_throttle*canvas.width/2,hero.max_throttle*canvas.height/2)

  //set throttle between [0,1]
  if(hero.throttle < 0) hero.throttle+=hero.acceleration;
  else if(r < max_r*hero.min_throttle) hero.throttle=0;
  else hero.throttle = Math.min((r-max_r*hero.min_throttle)/(max_r-hero.min_throttle*max_r),1);
  // the farthest from origin we can have ship
  var max_r = Math.min(canvas.width/2,canvas.height/2);

  // how from origin ship should be
  var r_goal = hero.max_dist*r;

  // move ship to origin on zero throttle
  if(hero.throttle==0) { r_goal=0; }
  //print(r_goal);

  //Turn ship appropriately
  var theta_goal = Math.atan2(mousePos.y,mousePos.x);
  hero.MakeHeadingChange(theta_goal,hero.turn_rate);

  // catesian coordinates of where we want to go
  var x_goal = r_goal*Math.cos(theta_goal)
  var y_goal = r_goal*Math.sin(theta_goal)
  

  // we can move by delta_r
  var newx = hero.coord.GetCartesian().x;
  var newy = hero.coord.GetCartesian().y;
  var theta = Math.atan2(y_goal-newy,x_goal-newx);
  // amount of cartesian movement for proper distance from origin
  var deltax = hero.acceleration*Math.cos(theta);
  var deltay = hero.acceleration*Math.sin(theta);
  // how much to move
  var nextx = newx+deltax;
  var nexty = newy+deltay;
  //var npos = new PlayerCoordinates();
  //npos.SetCartesian(newx+deltax,newy+deltay);
  //hero.coord = npos;
  //.SetCartesian(newx+deltax,newy+deltay);

  var collision_list = [planets];
  var collided = false;
  for(var i = 0; i < collision_list.length; i++) {
    if(!(check_no_collisions(canvas,hero,collision_list[i]))) {
      collided = true;
      break;
    }
  }
  if(!collided) {
    // safe to update
    hero.coord.SetCartesian(nextx,nexty);
  } else {
    hero.throttle = -hero.acceleration;
    hero.theta -= 0.2;
  }
}

function collision_details(canvas,ship,projectiles) {
  var max_distance = Math.max(canvas.width+1000,canvas.height+1000);
  collisions = []
  for(i=0;i<projectiles.length;i++) {
    var p = projectiles[i];
    //var gc = galactic_coordinates.ToGalactic(p.x,p.y);
    var distance = p.coord.GetDistance(ship.coord);
    //var d2 = (gc.x-ship.galactic_x)*(gc.x-ship.galactic_x)+(gc.y-ship.galactic_y)*(gc.y-ship.galactic_y);
    if(distance > max_distance) continue;
    // check closer for neighboring planets
    if(distance <= p.r+ship.r) {
      collisions.push(i);
      //print('colission')
    }
  }
  return collisions;
}

function check_no_collisions(canvas,ship,bodies) {
  var max_distance = Math.max(canvas.width+1000,canvas.height+1000);
  //print(bodies.length);
  for(i=0;i<bodies.length;i++) {
    var p = bodies[i];
    var d2 = p.coord.GetDistance(ship.coord);
    //var d2 = (p.coord.GetGalactic().x-ship.GetGalactic().x)*(p.galactic_x-ship.galactic_x)+(p.galactic_y-ship.galactic_y)*(p.galactic_y-ship.galactic_y);
    if(d2 > max_distance) continue;
    // check closer for neighboring bodies
    if(d2 <= p.r+ship.r) return false;
  }
  return true;
}


function draw_hero(canvas,context) {
  // global hero has stores state
  context.save();
  //c = canvas_coord(hero.cartesian_x,hero.cartesian_y)
  var c = hero.coord.GetCanvas();
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
function update_mouse_position(canvas,e) {
  var context = canvas.getContext("2d")
  var xpos = e.clientX;
  var ypos = e.clientY;
  var rect = canvas.getBoundingClientRect();
  var txpos = mousePos.x -canvas.width/2
  var typos = mousePos.y - canvas.height/2
  var xorig = e.clientX-rect.left  // true x
  var yorig = e.clientY-rect.top   // true y
  // get coordinates relative to the center as origin and call them x and y
  txpos = xorig -canvas.width/2      //centered x
  typos = -1*yorig + canvas.height/2 //centered y
  mousePos.x=txpos;
  mousePos.y=typos;
  //var c = new Coordinates();
  //return {xreal:xorig,yreal:yorig,x:txpos,y:typos,xcanvas:xpos,ycanvas:-1*ypos};
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
    var c = new Coordinates();
    c.SetCartesian(0,0);
    cc = c.GetCanvas();
    //cc = canvas_coord(0,0);
    drop_shadow(context,"PAUSED",90,cc.x,cc.y)
    context.restore();
  } else {
    stretch_canvas();
  }
}

//function point_distance(x1,y1,x2,y2) {
//  return Math.sqrt((x1-x2)*(x1-x2)+(y1-y2)*(y1-y2));
//}

// Debugging print function.
// Pre: any message to print and verbose set to true or false
// Post: if verbose is true then print to console
function print(msg) {
  if(verbose) { 
    console.log('$ '+msg);
  }
}  

