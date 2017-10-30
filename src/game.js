import './game.css';

const uuidv4 = require('uuid/v4');
// overal globals
var input_container = null; // set on init (supplied from outside)
var canvas_id = null; // set on init
var input_id = null;
var verbose = true;
var finished = false;
var game_over = false;
var mouseState = "up";
var is_scan = false;
var global_counter = 0;
var previous_container_width = 0;
var previous_container_height = 0;

var player_projectiles = [];


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

function VanduulSpace(element,options) {
  canvas_id = uuidv4();
  input_id = uuidv4();
  input_container = element;
  //game_board
  //user_input
  var opening_text ='<canvas id="'+canvas_id+'" class="vanduul-space-canvas"></canvas><input id="'+input_id+'" type="text" class="vanduul-space-input"></input></div>';
  element.innerHTML = opening_text;
  init();
  stretch_canvas();
  return true;
}

function mainLoop() {
  process.exit();
  global_counter += 1;
  if (previous_container_height !== input_container.style.height || previous_container_width !== input_container.style.width) {
    previous_container_width = input_container.style.width;
    previous_container_height = input_container.style.height;
    console.log('poll catch resize')
    stretch_canvas();
  }
  if(global_counter > 16000) global_counter = 0;
  if(!game_over)  update_canvas();
  if(get_input.length > 0) {
    process_input();
  }
  requestAnimationFrame(mainLoop);
}

// Start-up functoin
function init() {
  var loc = window.location.href.replace(/\//g,'');
  loc = loc.replace(/http:/g,'');
  //print(loc);
  //if(!(loc=='vanduul.space')) {
  //  finished = true;
  //  return;
  //}
  //.vanduul-space-container {
  //background: url("./anvil-terrapin-background2.jpg") no-repeat 50% 50% fixed;
  //background-size: cover;
 // margin: 0;
  //padding: 0px 0px 0px 0px;
//}
  //input_container.style.background = 'url("./anvil-terrapin-background2.jpg") no-repeat 50% 50% fixed;'
  document.getElementById(input_id).style.visibility = "hidden";
  initMouseOver();
  stretch_canvas();
  var canvas = document.getElementById(canvas_id);
  var context = canvas.getContext("2d");
  canvas.addEventListener('mousemove',function(e) {
    //update global
    update_mouse_position(canvas,e);
  });
  document.onmousedown = function(e) {
    //update global
    mouseState = 'down';
    if(is_scan) return;
    hero.PressTrigger();
  }
  document.onmouseup = function(e) {
    //update global
    mouseState = 'up';
    if(is_scan) return;
    // release trigger
    // add extra for unpausing on pause screen
    hero.ReleaseTrigger();
  }
  document.body.onkeyup = function(e) {
    if (canvas.mouseIsOver === false) return; // Constrain us to our canvas
    if(e.keyCode==32) {
      if(game_over) {
        init_vars();
        init_hero();
        game_over = false;
      } else {
        toggle_scan();
      }
    }
  }
  input_container.onresize = function () {
    stretch_canvas();
  }
  document.getElementById(input_id).onkeyup = function(event) {
    console.log('key registered')
    user_input_keypress(event);
  }
  init_vars();
  init_hero();
  mainLoop();
}

function initMouseOver()   {
   var div = document.getElementById(canvas_id);
   div.mouseIsOver = false;
   div.onmouseover = function()   {
      this.mouseIsOver = true;
   };
   div.onmouseout = function()   {
      mouseState = "up";
      this.mouseIsOver = false;
   }
}

function Fx(coord,duration,size) {
  //Initialize these in Init functions
  this.coord = 0;
  this.duration = 0;
  this.ttl = 0; //countdown till finished
  this.max_particles = 1;
  this.particle_count = 1; // this gets counted
  this.layer = 'top';
  this.fill = '#000000';
  this.outline = '#FFFFFF';
  var self = this;

  this.FinishInit = function() {
    //random starts
    self.particle_count = Math.floor(1+Math.random()*self.max_particles);
    self.sizes = [];
    self.directions = [];
    self.theta_inits = [];
    for(var i= 0; i < self.particle_count; i++) {
      self.sizes.push((self.size-self.size/4)*Math.random()+self.size/4);
      
      var direction = -1;
      if(Math.random() > 0.5) direction = 1;
      self.directions.push(direction);

      self.theta_inits.push(Math.random()*2*Math.PI);
    }
  }
  this.InitBallistic_1 = function(coord) {
    self.coord = coord;
    self.duration = 20;
    self.ttl = self.duration;
    self.size = 5;
    self.max_particles=3;
    self.layer = 'top';
    self.FinishInit();
  }
  this.InitBallistic_2 = function(coord) {
    self.coord = coord;
    self.duration = 40;
    self.ttl = self.duration;
    self.size = 10;
    self.max_particles=5;
    self.layer = 'top';
    self.FinishInit();
  }
  this.InitFlameTrail_1 = function(coord) {
    //self.global_counter % 50==1;
    self.coord = coord.copy();
    self.duration = 30;
    self.ttl = self.duration;
    self.size = 5;
    self.max_particles=1;
    self.layer = 'bottom';
    self.fill = 'rgba(255,125,0,0.7)';
    self.outline = 'rgba(255,125,0,0.7)';
    self.FinishInit();
  } 
  this.InitFlameTrail_2 = function(coord) {
    //self.global_counter % 50==1;
    self.coord = coord.copy();
    self.duration = 60;
    self.ttl = self.duration;
    self.size = 8;
    self.max_particles=1;
    self.layer = 'bottom';
    self.fill = 'rgba(0,0,0,0.3)';
    self.outline = 'rgba(0,0,0,0.3)';
    self.FinishInit();
  } 
  this.Draw = function(context) {
   for(var i = 0; i < this.particle_count; i++) {
    var cc = self.coord.GetCanvas();
    var f = self.duration-self.ttl;
    //print(f);
    var dist = 0.2*(1+self.theta_inits[i])*Math.log(f+1)/Math.log(2);
    context.save();
    context.beginPath();
    context.globalAlpha = 1-(f/self.duration);
    context.translate(cc.x,cc.y);
    context.rotate(f*0.2*self.directions[i]+10*self.theta_inits[i]);
    context.rect(dist,dist,self.sizes[i],self.sizes[i]);
    context.translate(dist,dist);
    context.rotate(f*8+self.theta_inits[i]);
    context.fillStyle = self.fill;
    context.strokeStyle = self.outline;
    context.fill();
    context.stroke();
    context.restore();
   }
  }
} 

function update_fx(context,layer) {
  //print(fx_animations.length); 
  var buffer = []
  for(var i=0; i < fx_animations.length; i++) {
    if(fx_animations[i].layer == layer) {
      fx_animations[i].ttl -=1;
      if(fx_animations[i].ttl<=0) continue;
    }
    buffer.push(fx_animations[i]);
  }
  fx_animations = buffer;
  //print(fx_animations.length);
  for(var i=0; i < fx_animations.length; i++) {
    if(fx_animations[i].layer==layer) {
      fx_animations[i].Draw(context);
    }
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

var bodies = new Bodies();
var planets = []
// Functions defined in ProceduralUniverse

var proceedural_blocks = {}
// These are set in ProceduralUniverse


//Global for the mouse position in cartesian
var mousePos = {x:0,y:0};

function init_vars() {
  player_projectiles = [];
  mousePos = {x:0,y:0};
  proceedural_blocks = {}
  hero = new Ship();
  enemies = []
  destroyed_ships = [];
//animate destruction. holds ships that are currently being destroyed

  stop_counter = 0;
// Used for scanning which is in Scan.js

  get_input = [];
// used for reading in text input

  particles = []
// in Environment.js

  galactic_origin = {galactic_x:0,galactic_y:0};
// galactic position of origin

  fx_animations = []

  bodies = new Bodies();
  planets = [];
}


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

function init_hero() {
  // Can set up some variables
  if(hero.health <= 0) hero = new Ship();
  var hero_weapon = new HardPoint();
  hero_weapon.x = 15
  hero_weapon.y = 0
  hero.hard_points.push(hero_weapon);
  hero.coord = new PlayerCoordinates();  // give hero the special coordinates
}

function process_input() {
  console.log('enter process input');
  var is_paused;
  var canvas = document.getElementById(canvas_id);
  var context = canvas.getContext("2d");
  // We can name planet
  var elm = document.getElementById(input_id)
  //if(elm.style.visibility!="visible") {
    context.save()
    context.textAlign="center";
    var msg = "Please name the planet";
    drop_shadow(context,msg,40,0,-150)
    context.restore()
  //}
  elm.style.visibility = "visible";
  elm.maxLength = "20";
  elm.style.left = Math.floor(canvas.width/2-50 )+"px";
  elm.style.top = Math.floor(canvas.height/2-100)+"px";
  //check for the entry
  if(entry_complete) {
    console.log('entry is complete')
    entry_complete = false;
    elm.style.visibility = "hidden";
    is_paused=false;
    bodies.type['planets'][get_input[1]].name = elm.value;
    //Easter egg
    if(bodies.type['planets'][get_input[1]].name.match(/jumbify/i)) {
      bodies.type['planets'][get_input[1]].text_color="#000000";
      bodies.type['planets'][get_input[1]].color = "#F87217";
    }
    elm.value = '';
    get_input = [];
  }
}

var entry_complete = false;
function user_input_keypress(e) {
  console.log(e);
  var selection = e.which || e.keyCode;
  if(selection ==13) {
    console.log('entry complete')
    entry_complete = true;
  }
  console.log(entry_complete);
}

function draw_hero_projectiles(canvas,context) {
  var buffer = [];
  var i,b,c,j;
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
  var canvas = document.getElementById(canvas_id);
  var context = canvas.getContext("2d");
  //if(mousePos.x <= -canvas.width/2 || mousePos.x >= canvas.width/2) {
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
  if(hero.health > 0) {
    update_hero_position(canvas);
  }
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
  update_fx(context,'bottom');
  draw_bodies(canvas,context);
  draw_destroyed(canvas,context);
  draw_particles(canvas,context);
  draw_enemies(canvas,context);
  if(hero.health > 0) {
    draw_hero(canvas,context);
  } else {
    if(hero.death_timer > 0) hero.death_timer -=1;
    else game_over = true;
  }
  draw_hero_projectiles(canvas,context);
  // fx needs drawn over bodies
  update_fx(context,'top');
  if(hero.health > 0) {
    check_scan(canvas,context);
  }
  check_triggers();
  draw_hud(canvas,context);
  if(hero.health <= 0) {
    draw_game_over(canvas,context);
  }
}

function draw_game_over(canvas,context) {
  if(hero.death_timer > 100) return;
  context.save();
  context.textAlign="center";
  var msg = "Game Over";
  context.translate(5,5);
  context.globalAlpha = (1-Math.max(0,hero.death_timer/100))*0.5;
  context.font ="150px Arial";
  context.fillStyle = '#000000';
  context.fillText(msg,0,0);
  context.restore();
  context.save();
  context.textAlign="center";
  context.globalAlpha = (1-Math.max(0,hero.death_timer/100));
  context.font ="150px Arial";
  context.fillStyle = '#FFFFFF';
  context.fillText(msg,0,0);
  context.restore();
  if(hero.death_timer <= 0) {
    context.save();
    context.textAlign="center";
    msg = "press SPACE to continue"
    drop_shadow(context,msg,30,0,50)
    context.restore();
  }
}

function update_projectiles() {
  // check the projectiles against the planets
  var buffer = [];
  var j;
  for(var i = 0; i < player_projectiles.length; i++) {
    var no_collision = true;
    var gc = player_projectiles[i].coord.GetGalactic();
    for(j = 0; j < bodies.type['planets'].length; j++) {
      var distance = bodies.type['planets'][j].coord.GetDistance(player_projectiles[i].coord);
      if(distance-bodies.type['planets'][j].r-player_projectiles[i].r>0) continue;
      no_collision = false;
      break;
    }
    if(no_collision) buffer.push(player_projectiles[i]);
    else {
      // save the projectile for FX
      var myfx = new Fx();
      myfx.InitBallistic_1(player_projectiles[i].coord);
      //,20,10);
      fx_animations.push(myfx);
    }
  }
  player_projectiles = buffer;
}

function draw_destroyed(canvas,context) {
  var max_time = 180;
  //print(destroyed_ships.length);
  var buffer = [];
  var i, cc;
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
  var i;
  process_trigger(hero);
  for(i = 0; i < enemies.length;i++) {
    process_trigger(enemies[i]);
  }
}

function process_trigger(ship) {
    var w,b;
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
  var msg;
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
  context.save();
  context.textAlign="start";
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
  msg = 'Press SPACE to SCAN.  Left click to FIRE.'
  drop_shadow(context,msg,16,-1*canvas.width/2+30,canvas.height/2-30)

  //display credit
  //context.restore();
  //context.save();
  context.textAlign="end";
  msg = 'This is a free fan-made game by Vacation.';
  drop_shadow(context,msg,16,canvas.width/2-30,canvas.height/2-60)
  msg = 'The background image is a modified Cloud Imperium Games image.';
  drop_shadow(context,msg,16,canvas.width/2-30,canvas.height/2-30)
  
  context.restore();
  //display health
  var health_width = 400;
  var vertical_dist = 15;
  var health_height = 30;
  context.save()
  context.beginPath();
  context.strokeStyle = 'rgba(0,0,0,0.5)';
  context.lineWidth = 5;
  context.rect(canvas.width/2-(health_width+57),-canvas.height/2+(vertical_dist+3),health_width,health_height);
  context.stroke();

  context.beginPath();
  context.fillStyle = 'rgba(82,122,102,0.8)';
  context.lineWidth = 5;
  context.rect(canvas.width/2-(health_width+60),-canvas.height/2+vertical_dist,health_width*(Math.max(hero.health,0)/hero.max_health),health_height);
  context.fill();

  context.beginPath();
  context.strokeStyle = '#FFFFFF';
  context.lineWidth = 5;
  context.rect(canvas.width/2-(health_width+60),-canvas.height/2+vertical_dist,health_width,health_height);
  context.stroke();


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

  //over-ride throttle if we are scanning
  if(is_scan) hero.throttle = 0; 

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
  var x_goal = r_goal*Math.cos(theta_goal);
  var y_goal = r_goal*Math.sin(theta_goal);


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

  if(hero.burn>2000) {
    hero.health-=1;
    if(hero.health <=0) destroyed_ships.push(hero);
  }

  // check stars
  var [no_collision,no_proximity] = check_no_collisions(canvas,hero,bodies.type['stars'])  
  if(!no_collision || !no_proximity) {
    hero.burn+=20;
  }  

  // check planets
  var collision_list = [bodies.type['planets']];
  var collided = false;
  for(var i = 0; i < collision_list.length; i++) {
    [no_collision, no_proximity] = check_no_collisions(canvas,hero,collision_list[i]);
    if(!no_proximity) {
      hero.atmosphere = true;
      if(hero.throttle > 0.7) {
        hero.burn+=1;
      } else hero.burn -=1;
    } else {
      hero.atmosphere = false;
      if(hero.burn > 0) {
        hero.burn-=5;
      } else hero.burn = 0;
    }
    //print(hero.atmosphere);
    if(!no_collision) {
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
  // lets check for projectile hits
  var hits = collision_details(canvas,hero,player_projectiles);
  for(var j = 0; j < hits.length; j++) {
    //print(hits[j].weapon);
    hero.health -= player_projectiles[hits[j]].weapon.damage;
    if(hero.health <=0) destroyed_ships.push(hero);
    //print(hero.health);
  }
  var buffer = []; // buffer the projectiles
  if(hits.length > 0) {
    for(var j = 0; j < player_projectiles.length; j++) {
      if(!(hits.includes(j))) buffer.push(player_projectiles[j]);
      else {
        var myfx = new Fx();
        myfx.InitBallistic_2(player_projectiles[j].coord);
        fx_animations.push(myfx);
      }
    }
  } else  buffer = player_projectiles;
  player_projectiles = buffer;
}

function collision_details(canvas,ship,projectiles) {
  var max_distance = Math.max(canvas.width+1000,canvas.height+1000);
  var collisions = [];
  var i;
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
// return true if there is no collision and true if there is none in proximity
function check_no_collisions(canvas,ship,bodies) {
  var i;
  var max_distance = Math.max(canvas.width+1000,canvas.height+1000);
  //print(bodies.length);
  var no_proximity = true; // if there is a proximity flag set it
  for(i=0;i<bodies.length;i++) {
    var p = bodies[i];
    var d2 = p.coord.GetDistance(ship.coord);


    //var d2 = (p.coord.GetGalactic().x-ship.GetGalactic().x)*(p.galactic_x-ship.galactic_x)+(p.galactic_y-ship.galactic_y)*(p.galactic_y-ship.galactic_y);
    if(d2 > max_distance) continue;
    // might be a planet
    if(bodies[i].proximity) {  //if proximity is set
      if(d2 <= p.r+ship.r+p.proximity) {
        no_proximity = false;
      }
    }
    // check closer for neighboring bodies
    if(d2 <= p.r+ship.r) {
      return [false,no_proximity];
    }
  }
  return [true,no_proximity];
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
  //var width = window.innerWidth;
  //var height = window.innerHeight;
  var width = input_container.clientWidth;
  var height = input_container.clientHeight;
  document.getElementById(canvas_id).style.width=width+"px";
  document.getElementById(canvas_id).style.height=height+"px";
  var canvas = document.getElementById(canvas_id);
  canvas.width = width;
  canvas.height = height;
  var context = canvas.getContext("2d");
  context.translate(canvas.width/2,canvas.height/2)
}


function toggle_scan() {
  var cc;
  //if(hero.heath <= 0) return;
  if(get_input.length > 0) return; // different kind of apuse
  if(is_scan) is_scan = false;
  else is_scan = true;
  if(is_scan) {
    var canvas = document.getElementById(canvas_id);
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



function spawn_enemies(canvas) {
  var rnx,cx,rny,cy;
  // put enemies into play
  var max_enemies = 10;
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
    var cc = new Coordinates();
    cc.SetCartesian(cx,cy);
    //gc = galactic_coordinates.ToGalactic(cx,cy);
    // make sure this is not a planetary position
    var too_close = false;
    for(var i = 0; i < bodies.type['planets'].length; i++) {
      var p = bodies.type['planets'][i];
      if(p.coord.GetDistance(cc)<p.r+100) {
        too_close = true;
        break;
      }
    }
    if(too_close) break;
    var e = new Ship();
    e.coord = cc;
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
    e.trigger = 'up';
    e.engine_power = 5;
    e.r = 10;
    e.theta = 1;
    e.turn_rate = 0.05;
    e.acceleration = 1.2;
    e.hard_points = []
    e.freindly = false; // tell ship and projectile is not friendly
    var h1 = new HardPoint();
    h1.x = 25;
    h1.y = 5;
    h1.size = 5;
    h1.rof = 40;
    h1.damage = 19;
    h1.range = 4050;
    h1.accuracy = 0.8;
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
    e.energy_recharge = 0.03;

    enemies.push(e);
  }
  // remove enemies that are too far away
  var buffer = [];
  for(var i=0; i < enemies.length; i++) {
    var e = enemies[i];
    //var dx = e.coord.GetCartesian().x-hero.coord.GetCartesian().x;
    //var dy = e.coord.GetCartesian().y-hero.coord.GetCartesian().y;
    var d = e.coord.GetDistance(hero.coord);
    if(d > Math.max(canvas.height,canvas.width)*3) {
      //print('removing far');
      continue;
    }
    buffer.push(e)
  }
  enemies = buffer;
}

function update_enemies(canvas,context) {
  // update enemy positions
  for(var i=0; i < enemies.length; i++) {
    var e = enemies[i];
    // make sure theta is positive and isn't growing
    e.theta += 10*Math.PI;
    e.theta %= 2*Math.PI;

    // check sensors
    var theta = 2*Math.PI+Math.atan2(e.coord.GetCartesian().y-hero.coord.GetCartesian().y,e.coord.GetCartesian().x-hero.coord.GetCartesian().x);
    var dist = e.coord.GetDistance(hero.coord);
    //point_distance(e.coord.GetCartesian().x,e.coord.GetCartesian().y,hero.coord.GetCartesian().x,hero.coord.GetCartesian().y);
    var atheta = -1*(theta-e.theta)+Math.PI ;
    atheta += 4*Math.PI;
    atheta %= 2*Math.PI;
    var inrange = false;
    if(dist < e.scan_distance) {
      if(atheta > e.scan_range_start || atheta < e.scan_range_end && e.scan_range_end < e.scan_range_start) {
        inrange = true;
      } else if (atheta > e.scan_range_start && atheta < e.scan_range_end) {
        inrange = true;
      }
    }
    // make range to get away
    if(dist > 1000) {
      e.alerted = false;
      e.trigger = 'up';
    }
    // check our AI_Profile
    e.ai_profile.ttl-=1;
    if(e.ai_profile.ttl<=0) e.ai_profile = new AI_Profile();
    if(e.collided) {
      e.alerted = false;
    } else if(inrange) {
      e.alerted = true;
    }
    if(e.alerted) {
      fly_alert(canvas,e);
    } else {
      fly_patrol(canvas,e);
    }
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
        else {
          var myfx = new Fx();
          myfx.InitBallistic_1(player_projectiles[j].coord);
          fx_animations.push(myfx);
        }
      }
    } else buffer = player_projectiles;
    player_projectiles = buffer;
  }
  enemies = enemy_buffer;

}

function AI_Profile() {
  this.patrol_direction = 1;
  if(Math.random() < 0.5) this.patrol_direction = -1;
  this.target_lead = 0;
  this.x = 100+Math.random()*300;
  if(Math.random() < 0.5) this.x *= -1;
  this.y = 100+Math.random()*300;
  if(Math.random() < 0.5) this.y *= -1;
  this.disengage_distance = 50+Math.random()*200;
  this.ttl = 20+Math.random()*200;
  this.alert_throttle = Math.random()*0.95+0.05;
  this.type = 'persue';
  if(Math.random() < 0.9 && hero) this.type = 'position';
  if(hero) {
    this.position_goal = new Coordinates();
    this.position_goal.SetCartesian(hero.coord.GetCartesian().x,hero.coord.GetCartesian().y);
  }
}

function fly_patrol(canvas,e) {
    var newx, newy;
    e.theta+=e.ai_profile.patrol_direction*e.turn_rate*0.05;
    //print(e.Velocity())
    if(e.throttle < 0.01) {
      e.throttle = 0.06;
      //print('move');
    }
    e.collided = false;
    newx = e.Velocity()*Math.cos(e.theta);
    newy = e.Velocity()*Math.sin(e.theta);
    newx+=e.coord.GetGalactic().x;
    newy+=e.coord.GetGalactic().y;
    //e.coord.print();
    var cg = new Coordinates();
    cg.SetGalactic(newx,newy);
    if(Math.random() < 0.5) {
      e.MakePositionChange(cg,e.acceleration,canvas,[bodies.type['planets']]);
    } else {
      e.MakePositionChange(cg,e.acceleration,canvas,[]);
    }
    //e.SetGalactic(newx,newy);
    //e.x+=newx
    //e.y+=newy
}

function fly_alert(canvas,e) {
    var newx, newy;
    //var goal_theta = 0;
    //e.MakeHeadingChange(goal_theta,0.05)
    //e.theta = 
    e.ai_profile.ttl--;
    e.throttle=e.ai_profile.alert_throttle;
    if(e.coord.GetDistance(hero.coord) > 100) e.throttle = 1;
    newx = e.Velocity()*Math.cos(e.theta);
    newy = e.Velocity()*Math.sin(e.theta);
    newx += e.coord.GetGalactic().x;
    newy += e.coord.GetGalactic().y;
    var gc = new Coordinates();
    //gc.SetGalactic(newx+e.ai_profile.x,newy+e.ai_profile.y);
    if(e.ai_profile.type=='persue') {
      gc.SetCartesian(hero.coord.GetCartesian().x+e.ai_profile.x,hero.coord.GetCartesian().y+e.ai_profile.y);
    } else if(e.ai_profile.type=='position') {
      gc = e.ai_profile.position_goal;
    } 
    e.MakePositionChange(gc,e.acceleration,canvas,[bodies.type['planets']]);
    if(gc.GetDistance(e.coord) < e.acceleration*2) e.ai_profile.ttl=0; // done with this profile if we reach our position
    if(e.coord.GetDistance(hero.coord) < e.ai_profile.disengage_distance) {
      e.ai_profile.ttl=0;
    }

    // handle turns based on our model of choice flee or fighto
    var diff = e.TurnToCoordinate(hero.coord,e.turn_rate);
  
    if(Math.abs(diff) < 0.2 && Math.abs(diff) < Math.PI) {
      e.trigger='down';
    } else {
      e.trigger = 'up';
    }   
    //e.MakeGalacticPositionChange(newx,newy,e.acceleration,canvas,[planets]);
    //e.MakeCartesianPositionChange(hero.cartesian_x,hero.cartesian_y,e.acceleration,canvas,[planets]);
    //e.SetGalactic(newx,newy);
    //e.x+=newx
    //e.y+=newy
}

function draw_enemies(canvas,context) {
  for(var i=0;i<enemies.length;i++){
    var e = enemies[i];
    context.save();
    //var cc = galactic_coordinates.ToCartesian(e.x,e.y);
    var c = e.coord.GetCanvas();
    context.translate(c.x,c.y);
    context.rotate(-e.theta);
    e.Draw(context);
    context.restore();
  }
}

function Particle(coord) {
  var min_frames, min_drag, min_size, max_size, max_frames, min_drag, max_drag;
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
  var canvas_multiplier, rx, ry, c, p, buffer,i, alpha_scale,r;
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

function Bodies() {
  this.types = ['planets','stars'];
  this.type = {};
  for(var i = 0; i < this.types.length; i++) this.type[this.types[i]] = [];
}

function Planet() {
  this.coord = new Coordinates();
  this.color = "#000000";
  this.text_color = "#FFFFFF";
  this.r = 0;
  this.proximity = 0; //thickness of atmosphere 
  this.name = '';
  this.id = '';
  var self = this;
  this.GetBlock = function(blocksize) {
    var xb = Math.floor(self.coord.GetGalactic().x/blocksize);
    var yb = Math.floor(self.coord.GetGalactic().y/blocksize);
    return {xblock:xb,yblock:yb};
  }
  this.Draw = function(context) {
    draw_planet(self,context);
  }
}

function Star() {
  this.coord = new Coordinates();
  this.color = "#FEC11D";
  this.outer_color = "rgba(255,165,0,0.01)";
  this.text_color = "#FFFFFF";
  this.r = 0;
  this.proximity = 0; //
  this.name = '';
  this.id = '';
  this.spoke_count = 20;
  this.spokes = [];
  var self = this;
  this.GetBlock = function(blocksize) {
    var xb = Math.floor(self.coord.GetGalactic().x/blocksize);
    var yb = Math.floor(self.coord.GetGalactic().y/blocksize);
    return {xblock:xb,yblock:yb};
  }
  this.set_spokes = function() {
    for(var i = 0; i < self.spoke_count; i++) {
      var direction = 1;
      if(Math.random() < 0.5) direction = -1;
      var rate = 0.0001+Math.random()*0.0003;
      var slen = self.r-0.3*Math.random();
      //initial, rate, direction, length
      this.spokes.push([i*2*Math.PI/self.spoke_count,rate,direction,slen])
    }
  }
  this.Draw = function(context) {
    draw_star(self,context);
  }
}

function draw_star(s,context) {
  for(var i = 0; i < s.spokes.length; i++) {
    var [theta_init,rate,direction,r] = s.spokes[i];
    var cc = s.coord.GetCanvas();
    context.save();
    context.fillStyle=s.outer_color;
    context.translate(cc.x,cc.y);
    context.beginPath();
    context.arc(0,0,s.r+s.proximity,0,2*Math.PI);
    context.fill();
    context.restore();
    context.save();
    context.beginPath();
    s.spokes[i][0]+=rate*direction;
    var skew = 1/4;
    context.fillStyle=s.color;
    context.translate(cc.x,cc.y);
    context.rotate(s.spokes[i][0])
    triangle(context,-r*skew,-r*skew,-r*skew,r*skew,r,0);
    context.restore();
  }
}


function update_bodies() {
  var xblock, yblock;
  var gc = galactic_origin;
  //print(galactic_origin.galactic_x);
  var blocksize = 5000;
  var curblock_x = Math.floor(gc.galactic_x/blocksize);
  var curblock_y = Math.floor(gc.galactic_y/blocksize);
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
  var z = 0;
  for(xblock in proceedural_blocks) {
    for(yblock in proceedural_blocks[xblock]) {
      z += 1;
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
  //print(z);
}

function clean_unneeded(needed,blocksize) {
  var blk, buffer;
 for(var h=0; h<bodies.types.length; h++) {
  planets = bodies.type[bodies.types[h]];
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
}


function populate_proceedural_block(xblock,yblock,blocksize) {
  var p, s;
  var max_planets=50;
  var min_size = 50;
  var max_size = 300;
  var min_atmosphere = 30;
  var max_atmosphere = 70;
  var rg = new RandomGenerator(xblock,yblock)
  var num_planets = Math.floor(rg.random()*max_planets);
  
  //print(num_planets)
  for(var i = 0; i < num_planets; i++) {
    var x = 0;
    var y = 0;
    var size = Math.floor(rg.random()*(max_size-min_size))+min_size;
    p = new Planet();
    p.coord = rg.get_proceedural_cartesian(blocksize,xblock,yblock);
    //print(p.galactic_x+','+p.galactic_y)
    p.r = size
    p.proximity = Math.floor(rg.random()*(max_atmosphere-min_atmosphere))+min_atmosphere;
    p.id = Math.floor(rg.random()*10000000);
    bodies.type['planets'].push(p);
  }
  // do a star.. sometimes
  if(rg.random() < 0.2) {
    s = new Star();
    s.coord = rg.get_proceedural_cartesian(blocksize,xblock,yblock);
    s.r = 500;
    s.proximity = 50;
    s.id = 1;
    s.set_spokes();
    bodies.type['stars'].push(s);
  }
}

function draw_bodies(canvas,context) {
 for(var h = 0; h < bodies.types.length; h++) {
  planets = bodies.type[bodies.types[h]];
  for(var i = 0; i < planets.length; i++) {
    var p = planets[i];
    p.Draw(context);
  }
 }
}

function draw_planet(p,context) {
    var cc = p.coord.GetCanvas();
    context.save();
    // do atmosphere
    context.beginPath();
    context.arc(cc.x,cc.y,p.r+p.proximity,0,2*Math.PI);
    context.globalAlpha = 0.1;
    context.fillStyle='#000000';
    context.fill()
    context.globalAlpha = 1;

    // do body
    context.beginPath();
    context.arc(cc.x,cc.y,p.r,0,2*Math.PI);
    context.fillStyle=p.color;
    context.fill()
    context.stroke();
    context.fillStyle=p.text_color;
    context.textAlign="center";
    context.font="20px Ariel";
    context.fillText(p.name,cc.x,cc.y)
    context.restore();
}


function RandomGenerator(v1,v2) {
  var num2, num3;
  this.seed1 = v1
  this.seed2 = v2
  this.seed3 = 1000;
  var self = this;
  // return a cartesian coordiante
  this.get_proceedural_cartesian = function(blocksize,xblock,yblock) {
    var x = 0;
    if(xblock >= 0) {
      x = Math.floor(self.random()*blocksize)+xblock*blocksize;
    } else {
      x = -1*Math.floor(self.random()*blocksize)+(xblock+1)*blocksize;
    }
    var y = 0;
    if(yblock >= 0) {
      y = Math.floor(self.random()*blocksize)+yblock*blocksize;
    } else {
      y = -1*Math.floor(self.random()*blocksize)+(yblock+1)*blocksize;
    }
    var c = new Coordinates();
    c.SetCartesian(x,y);
    return c;
  }
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


function check_scan(canvas,context) {
  var use_color, got_click;
  // see if we can skip this whole thing
  if(!is_scan) {
    stop_counter = 0;
    return;
  }


  if(hero.Velocity()<0.01) stop_counter+=1;
  // find enemies using enemies defined in main
  var thetas = []
  for(var i =0; i < enemies.length; i++) {
    var e = enemies[i];
    var ec = e.coord.GetCartesian();
    thetas.push([Math.atan2(ec.y,ec.x),Math.sqrt(ec.y*ec.y+ec.x*ec.x)]);
  }
  // Sweeping scan
  var d = Math.max(canvas.height,canvas.width);
  context.save();
  var scan_theta = stop_counter*0.005;
  var delta = 0.05;
  use_color = check_color(scan_theta,thetas,delta);
  context.fillStyle= use_color;
  context.globalAlpha=0.15;
  context.rotate(-scan_theta-Math.PI/2);

  context.beginPath();
  context.moveTo(0,0);
  var inner_dist = 150;
  var inner_width = 10;
  var scan_scale = 1.2;
  context.arc(0,0,inner_dist,0,2*Math.PI,false);
  context.arc(0,0,inner_dist-inner_width,0,2*Math.PI,true);
  context.fill();
  context.beginPath();
  context.arc(0,0,d,Math.PI/2-scan_scale*delta/2,Math.PI/2+scan_scale*delta/2,false);
  context.arc(0,0,inner_dist,Math.PI/2+scan_scale*delta/2,Math.PI/2-scan_scale*delta/2,true);
  context.fill();
  context.beginPath();
  context.arc(0,0,d,0,2*Math.PI,false);
  context.arc(0,0,inner_dist-inner_width,0,2*Math.PI,true);
  context.fill();
  context.restore();

  context.save();
  context.strokeStyle="#FF0000";
  context.globalAlpha = 0.5;
  context.lineWidth = 4;
  // Scan nearby ships
  for(var i = 0; i < enemies.length; i++) {
    var e = enemies[i];
    var ec = enemies[i].coord.GetCartesian();
    var padding = 50;
    if(ec.x < -canvas.width/2+padding) continue;
    if(ec.x >  canvas.width/2+padding) continue;
    if(ec.y < -canvas.height/2+padding) continue;
    if(ec.y > canvas.height/2+padding) continue;
    // draw on ship
    //context.save();
    var rsize = 60;
    var cc = e.coord.GetCanvas();
    context.beginPath();
    context.rect(cc.x-rsize/2,cc.y-rsize/2,rsize,rsize);
    context.stroke();
    if(Math.random() < 0.005) {
      print('scanned');
      e.scanned = true; // we got a good scan
    }
  }
  context.restore();

  // Print a scanning message
  context.save()
  context.textAlign="center";
  var msg = "Scanning";
  var scan_msgs = ["......",".  ....  .","..  ..  ..","...    ...","..  ..  ..",".  ....  ."];
  drop_shadow(context,msg,20,0,-50);
  var scale_counter = Math.floor(stop_counter/60);
  drop_shadow(context,scan_msgs[scale_counter%scan_msgs.length],20,0,-30);
  context.restore();


  // only stay in if you've been scanning a while
  if(stop_counter < 60*1) return;
  // Now look for planet
  var min_range = 100;
  var best_p = null;
  for(var i=0; i < bodies.type['planets'].length; i++) {
    var d = bodies.type['planets'][i].coord.GetDistance(hero.coord);
    //var dx =planets[i].galactic_x - hero.galactic_x
    //var dy = planets[i].galactic_y - hero.galactic_y
    //var d = Math.sqrt(dx*dx+dy*dy);
    d -=bodies.type['planets'][i].r;
    if(d > min_range) continue;
    min_range = d
    best_p = i
  }
  if(best_p) {
    // We have a planet
    if(bodies.type['planets'][best_p].name=='') {
      context.save();
      context.beginPath();
      context.fillStyle='rgba(255,255,255,0.6)';
      context.rect(-300,-100,200,50);
      context.fill(); 
      context.beginPath();
      context.fillStyle="#000000";
      context.rect(-300,-100,200,50);
      context.lineWidth = 2;
      got_click = false;
      if(mousePos.x > -300 && mousePos.x < 100) {
        if(mousePos.y > 50 && mousePos.y < 100) {
          context.lineWidth = 5;
          if(mouseState=='down') {got_click = true; }
        }
      }
      context.stroke(); 
      msg = 'Name the planet';
      context.font="25px Arial";
      context.fillText(msg,-200,-70);
      context.restore();
      if(got_click) {
        get_input = ['planet name',best_p];
        is_scan = true;
        return;
      }
    }
  }
}

function check_color(scan_theta,thetas,delta) {
  for(var i = 0; i < thetas.length; i++) {
    var theta = thetas[i][0];
    var r = thetas[i][1]; 
    var d = Math.sqrt(2-2*Math.cos(scan_theta-theta));
    var rval = Math.floor(255/Math.log(r/100+1));
    if(d < delta) return 'rgb('+rval+',0,0)';
  }
  return '#000000';
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

function Ship() {
  var direction, no_collision, no_proximity;
  this.type = 'terrapin';
  this.damage_frames = 0; // keep track of the number of frames in the damage state
  this.coord = new Coordinates();
  this.theta=0; // angle of sprite
  this.throttle=0;

  this.engine_power=3;
  this.turn_rate=0.03;
  this.current_turn=0; // State direction -1 left 0 nothing 1 right
  this.acceleration=0.8;
  this.hard_points = []
  this.r = 10;
  this.health = 100;
  this.max_health = 100;
  this.energy = 100;
  this.max_energy = 100;
  this.energy_recharge = 0.05;
  this.trigger = 'up';
  this.friendly = true;

  //scanner gameplay
  this.scanned = false; // whether or not we have a scan
  this.scan_distance = 350;
  this.scan_range_start = 0;
  this.scan_range_end = 2*Math.PI;
  this.atmosphere = false; // are we in atmosphere?
  this.burn = 0;

  //AI properties
  this.alerted = false;
  this.ai_profile = new AI_Profile(); // from enemy
  this.collided = false;

  //Player properties
  this.min_throttle=0.2; //deadzone low
  this.max_throttle=0.9; //deadzone high
  this.max_dist=0.2;     //max distance can traverse from origin (for a player)
  this.death_timer = 300;

  var self = this;
  //Functions of Ship
  this.Velocity = function() {
     return self.engine_power*self.throttle;
  }
  this.Theta = function() { // Angle offset from center of map
    return Math.atan2(self.coord.GetCartesian().y,self.coord.GetCartesian().x);
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
  // Set a new coordinate here
  this.SetCoordinates=function(coord){
    self.coord = coord;
  }

  // given a coordinate, turn a ship to face it
  // return how far the difference is
  this.TurnToCoordinate = function(coord,turn_rate) {
    if(turn_rate > self.turn_rate) { turn_rate = self.turn_rate; }
    var theta1 = self.theta;
    var theta2 = Math.atan2(coord.GetCartesian().y-self.coord.GetCartesian().y,coord.GetCartesian().x-self.coord.GetCartesian().x);
    theta1 += 5*2*Math.PI;
    theta2 += 5*2*Math.PI;
    theta1 = theta1%(2*Math.PI);
    theta2 = theta2%(2*Math.PI);
    var diff = theta2-theta1;
    //self.theta = self.theta + diff;
    //return;
    if(Math.abs(diff) < turn_rate) {
      self.theta = self.theta + diff;
      return diff;
    }
    if(Math.abs(diff) <= Math.PI) {
      if(diff < 0) { direction = -1; }
      else if(diff >= 0) { direction = 1; }
    } else {
      if(diff < 0) { direction = 1; }
      else if(diff >= 0) { direction = -1; }
    }
    if(direction==1) { self.theta += turn_rate; }
    else { self.theta -= turn_rate; }
    return diff;
    //print(direction);
  }

  // take a new theta you want to face and a turn rate you can get there
  // this will set a new theta based on the request
  // will also adjust current_turn
  this.MakeHeadingChange = function(theta_goal,turn_rate) {
    if(turn_rate > self.turn_rate) turn_rate = self.turn_rate; // enforce max turn rate
    // Get theta back in some normal unit circle coordinates

    self.theta = (self.theta+10*2*Math.PI)%(2*Math.PI);

    theta_goal = (theta_goal+10*2*Math.PI)%(2*Math.PI);
    //print(theta_goal);
    //if(self.theta > 2*Math.PI) self.theta -= 2*Math.PI;
    //if(self.theta <= -2*Math.PI) self.theta += 2*Math.PI;
    // can get our turning direction
    hero.current_turn = 0;
    if(Math.abs(self.theta-theta_goal) < turn_rate) {
      self.theta = theta_goal;
      self.current_turn = 0; // we arent turning because we are there
    } else if(self.theta >= Math.PI && theta_goal <= self.theta-Math.PI) {
      self.theta += turn_rate;
      self.current_turn = 1;
    } else if(self.theta <= theta_goal-Math.PI && theta_goal >= Math.PI) {
      self.theta -= turn_rate;
      self.current_turn = -1;
    } else if(hero.theta > theta_goal) {
      self.theta -= turn_rate;
      self.current_turn = -1;
    } else {
      self.theta += turn_rate;
      self.current_turn = 1;
    }
  }
  // Move to this coordinate with acceleration being the maximum movement allowed 
  // collision list is a list of arrayed objects to check for collisions
  this.MakePositionChange=function(coord_goal,acceleration,canvas,collision_list){
    var changed = true;
    var old_coord = self.coord.copy();
    var next_coord = self.coord.copy(); // set to our current coordinate
    if(acceleration > self.acceleration) acceleration = self.acceleration; // enforce limit
    var d = Math.sqrt((coord_goal.GetCartesian().x-self.coord.GetCartesian().x)*(coord_goal.GetCartesian().x-self.coord.GetCartesian().x)+(coord_goal.GetCartesian().y-self.coord.GetCartesian().y)*(coord_goal.GetCartesian().y-self.coord.GetCartesian().y))
    if(d < self.acceleration) {
      // we can update distance to current
      next_coord = coord_goal;
    } else {
      var temp_theta = Math.atan2(self.coord.GetCartesian().y-coord_goal.GetCartesian().y,self.coord.GetCartesian().x-coord_goal.GetCartesian().x)
      var delta_y = Math.sin(temp_theta)*self.acceleration
      var delta_x = Math.cos(temp_theta)*self.acceleration
      var xnext = self.coord.GetCartesian().x-delta_x
      var ynext = self.coord.GetCartesian().y-delta_y
      next_coord.SetCartesian(xnext,ynext);
    }

    // Check the values
    //gc = galactic_coordinates.ToGalactic(xnext,ynext);
    //print(collision_list.length);
    var collided = false;
    for(var i =0; i < collision_list.length; i++) {
      [no_collision,no_proximity] = check_no_collisions(canvas,self,collision_list[i]);
      if(!(no_collision)) {
        collided = true;
        break;
      }
    }
    if(!collided) {
      // safe to update
      self.coord = next_coord
    } else {
      //print('collided')
      self.health-=1;
      self.throttle = -0.3;
      self.theta -=0.3;
      self.coord = old_coord;
      self.collided = true;
      //print('collision')
    }
  }
  // Do a normal draw
  this.Draw=function(context){
    draw_ship(self,context);
  }
}

function draw_ship(ship,context) {
  // check for atmosphere 
  if(ship.burn > 0 && Math.random() < 0.5) {
    var myfx = new Fx();
    myfx.InitFlameTrail_1(ship.coord);
    fx_animations.push(myfx);
  }
  if(ship.health > 0 && ship.health < 50 && Math.random() < 0.5 && ship.throttle > 0.01) {
    //print(ship.health);
    var myfx = new Fx();
    myfx.InitFlameTrail_2(ship.coord);
    fx_animations.push(myfx);
  }
  if(ship.type=='terrapin') {
    draw_terrapin(context,ship);
  } else if  (ship.type=='scythe') {
    draw_scythe(context,ship);
  }
  //var cc = canvas_coord(ship.cartesian_x,ship.cartesian_y);
  var cc = ship.coord.GetCanvas();
  //scan gameplay
  if(ship.scanned) {
    var scanrange=ship.scan_distance;
    var mindist = 80;
    var borderwidth = 10;
    var innerborder = 0.05;
    context.save();
    context.globalAlpha = 0.05;
    context.beginPath();
    //context.arc(cc.x,cc.y,100,ship.scan_range_start,ship.scan_range_end);
    context.arc(0,0,scanrange,ship.scan_range_start,ship.scan_range_end,false);
    context.arc(0,0,mindist,ship.scan_range_end,ship.scan_range_start,true);
    context.fillStyle="#FF0000";
    context.fill();
    context.globalAlpha=0.15;
    context.fillStyle="#000000";
    context.beginPath();
    context.arc(0,0,scanrange+borderwidth,ship.scan_range_start,ship.scan_range_end,false);
    context.arc(0,0,scanrange,ship.scan_range_end,ship.scan_range_start,true);
    context.fill();
    context.beginPath();
    context.arc(0,0,mindist,ship.scan_range_start,ship.scan_range_end,false);
    context.arc(0,0,mindist-borderwidth,ship.scan_range_end,ship.scan_range_start,true);
    context.fill();
    context.beginPath();
    context.arc(0,0,scanrange+borderwidth,ship.scan_range_start-innerborder,ship.scan_range_start,false);
    context.arc(0,0,mindist-borderwidth,ship.scan_range_start,ship.scan_range_start-innerborder,true);
    context.fill();
    context.beginPath();
    context.arc(0,0,scanrange+borderwidth,ship.scan_range_end,ship.scan_range_end+innerborder,false);
    context.arc(0,0,mindist-borderwidth,ship.scan_range_end+innerborder,ship.scan_range_end,true);
    context.fill();
    context.restore();
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
  this.speed=6;
  this.size=2;
  this.damage=30;
  this.energy = 2; // energy cost;
  this.range=400;
  this.rof=5; //frames per shot
  this.trigger_frame=0; //count frames of trigger depress
}


function draw_scythe(context,ship) {
  context.save();  
  open_damage(context,ship);
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
  close_damage(context,ship);

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

function get_burn_gray(base_gray,ship) {
  var burn = ship.burn;
  if(ship.burn > 0) {
    return "rgb("+Math.floor(Math.min(burn+base_gray,255))+","+Math.floor(Math.max(base_gray-burn/4,base_gray))+","+Math.floor(Math.max(base_gray-burn/2,0))+")";
  } else {
    return "rgb("+base_gray+","+base_gray+","+base_gray+")";
  }
}

function draw_terrapin(context,ship) {
  context.save();
  open_damage(context,ship);
  context.fillStyle = get_burn_gray(128,ship);
  ellipse(context,0,0,15,10); // main ship


  context.fillStyle='black'; //canopy
  ellipse(context,9,0,3,2);

  context.fillStyle='#8A0808'; // red dish
  ellipse(context,-3,0,6,6);
  context.fillStyle=get_burn_gray(128,ship);
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
  close_damage(context,ship);
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

function open_damage(context,ship) {
  if(ship.damage_frames==0) return;
  context.save();
  var factor = 1/(1+ship.damage_frames*0.02);
  context.globalAlpha =factor;
  context.scale(factor,1/factor);
  context.rotate(15*(1+ship.damage_frames*0.1)*Math.PI/180);
  //context.translate(factor,);
}
function close_damage(context,ship) {
  if(ship.damage_frames==0) return;
  context.restore();
}

//var exports = module.exports = {};
//exports.init = init;
//exports.stretch_canvas = stretch_canvas;
//exports.user_input_keypress = user_input_keypress;

//var VS = {init:init, stretch_canvas:stretch_canvas,user_input_keypress:user_input_keypress, runVanduulSpace:runVanduulSpace};
export default VanduulSpace;
