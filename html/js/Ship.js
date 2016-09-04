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

  //AI properties
  this.alerted = false;

  //Player properties
  this.min_throttle=0.2; //deadzone low
  this.max_throttle=0.9; //deadzone high
  this.max_dist=0.2;     //max distance can traverse from origin (for a player)

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
      if(!(check_no_collisions(canvas,self,collision_list[i]))) {
        collided = true;
        break;
      }
    }
    if(!collided) {
      // safe to update
      self.coord = next_coord
    } else {
      //print('collided')
      self.throttle = -0.3;
      self.theta -=0.2;
      self.coord = old_coord
      //print('collision')
    }
  }
  // Do a normal draw
  this.Draw=function(context){
    draw_ship(self,context);
  }
}

function draw_ship(ship,context) {
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


