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

