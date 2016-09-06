
function spawn_enemies(canvas) {
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
