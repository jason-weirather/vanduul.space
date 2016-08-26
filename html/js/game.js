var verbose = true;


function update_canvas(canvas,mousePos) {
  var context = canvas.getContext("2d");
  //Draw mouse coordinate for debugging purposes
  context.clearRect(0,0,canvas.width, canvas.height);
  context.font='20pt Calibri';
  context.fillStyle='white';
  console.log(canvas.width+','+canvas.height)
  txpos = mousePos.x -canvas.width/2
  typos = -1*mousePos.y + canvas.height/2
  //context.fillText(mousePos.x+','+mousePos.y,5,15);
  context.fillText(txpos+','+typos,15,20);
  
  //Now draw cooler stuff
  context.save();
  speed = Math.sqrt(txpos*txpos+typos*typos)
  max_speed = Math.min(canvas.width/2,canvas.height/2)
  cur_speed = Math.min(speed,max_speed)
  distance_scale = 0.2
  dist = distance_scale*cur_speed+2
  theta = Math.atan(txpos/typos)
  //console.log(dist)
  xmov = dist*Math.cos(theta)
  ymov = dist*Math.sin(theta)
  context.translate(canvas.width/2,canvas.height/2)
  context.rotate(theta);
  context.beginPath();
  context.moveTo(0,dist);
  context.rect(-4,-2,8,4);
  context.stroke();
  context.restore();
}

function do_mouse() {
  var canvas = document.getElementById("game_board");
  var context = canvas.getContext("2d");

  canvas.addEventListener('mousemove',function(e) {
    var mousePos = get_mouse_position(canvas,e);
    update_canvas(canvas,mousePos);
  });
}

function get_mouse_position(canvas,e) {
  var context = canvas.getContext("2d")
  xpos = e.clientX;
  ypos = e.clientY;
  var rect = canvas.getBoundingClientRect();
  return {x:e.clientX-rect.left,y:e.clientY-rect.top};
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
}

// Debugging print function.
// Pre: any message to print and verbose set to true or false
// Post: if verbose is true then print to console
function print(msg) {
  if(verbose) { 
    console.log(msg);
  }
}  
