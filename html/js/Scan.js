function check_scan(canvas,context) {
  if(hero.Velocity()<0.01 && mouseState=='up') stop_counter+=1;
  else {
    stop_counter = 0;
    return;
  }
  if(stop_counter < 60*1) return;
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
  scale_counter = Math.floor(stop_counter/60);
  drop_shadow(context,scan_msgs[scale_counter%scan_msgs.length],20,0,-30);
  context.restore();

  // only stay in if you've been scanning a while
  if(stop_counter < 60*6) return;
  // Now look for planet
  var min_range = 100;
  var best_p = null;
  for(var i=0; i < planets.length; i++) {
    var d = planets[i].coord.GetDistance(hero.coord);
    //var dx =planets[i].galactic_x - hero.galactic_x
    //var dy = planets[i].galactic_y - hero.galactic_y
    //var d = Math.sqrt(dx*dx+dy*dy);
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
