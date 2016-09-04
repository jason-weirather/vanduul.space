function spawn_enemies(canvas) {
  // put enemies into play
  var max_enemies = 16;
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
    for(var i = 0; i < planets.length; i++) {
      var p = planets[i];
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
    e.engine_power = 3;
    e.r = 10;
    e.theta = 1;
    e.turn_rate = 0.1;
    e.acceleration = 0.5;
    e.hard_points = []
    e.freindly = false; // tell ship and projectile is not friendly
    var h1 = new HardPoint();
    h1.x = 25;
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
    if(inrange) {
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
function fly_patrol(canvas,e) {
    e.theta+=e.turn_rate*0.05;
    //print(e.Velocity())
    if(e.throttle < 0.1) {
      e.throttle = 0.6;
    }
    newx = e.Velocity()*Math.cos(e.theta);
    newy = e.Velocity()*Math.sin(e.theta);
    newx+=e.coord.GetGalactic().x;
    newy+=e.coord.GetGalactic().y;
    //e.coord.print();
    var cg = new Coordinates();
    cg.SetGalactic(newx,newy);
    e.MakePositionChange(cg,e.acceleration,canvas,[planets]);
    //e.SetGalactic(newx,newy);
    //e.x+=newx
    //e.y+=newy
}

function fly_alert(canvas,e) {
    //var goal_theta = 0;
    //e.MakeHeadingChange(goal_theta,0.05)
    //e.theta = 
    e.throttle=1;
    newx = e.Velocity()*Math.cos(e.theta);
    newy = e.Velocity()*Math.sin(e.theta);
    newx += e.coord.GetGalactic().x;
    newy += e.coord.GetGalactic().y;
    var gc = new Coordinates();
    gc.SetGalactic(newx,newy);
    e.MakePositionChange(gc,e.acceleration,canvas,[planets]);
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
