var verbose = true;

//Hold information about center sprite
//x: current x position
//y: current y position
//theta: current angle
//throttle: thrust [0,1]
//min_throttle: how close to ship before setting throttle to zero
//max_throttle: how far from ship before setting throttle to 1
var hero = {x:0,y:0,theta:0,throttle:0,min_throttle:0.2,max_throttle:0.9}

//Global for the mouse position
var mousePos = {xreal:0,yreal:0,x:0,y:0,xcanvas:0,ycanvas:0}

function init() {
  stretch_canvas();
  var canvas = document.getElementById("game_board");
  var context = canvas.getContext("2d");
  canvas.addEventListener('mousemove',function(e) {
    //update global
    mousePos = get_mouse_position(canvas,e);
  });
  mainLoop();
}

function mainLoop() {
  update_canvas();
  requestAnimationFrame(mainLoop);
}

function update_canvas() {
  var canvas = document.getElementById("game_board");
  var context = canvas.getContext("2d");
  //clear the canvas
  context.save();
  context.setTransform(1,0,0,1,0,0);
  context.clearRect(0,0,canvas.width,canvas.height);
  context.restore();

  //Draw mouse coordinate for debugging purposes
  context.font='20pt Calibri';
  context.fillStyle='white';
  context.fillText(mousePos.x+','+mousePos.y,-1*canvas.width/2+30,-1*canvas.height/2+30);
  
  //Now draw cooler stuff

  //set throttle
  r = Math.sqrt(mousePos.x*mousePos.x+mousePos.y*mousePos.y)
  max_r = Math.min(hero.max_throttle*canvas.width/2,hero.max_throttle*canvas.height/2)

  if(r < max_r*hero.min_throttle) r = hero.throttle=0;
  else hero.throttle = Math.min((r-max_r*hero.min_throttle)/(max_r-hero.min_throttle*max_r),1);
  //hero.throttle = (r-max_r*hero.min_throttle)/(max_r-max_r*hero.min_throttle)

  theta = Math.atan(mousePos.x/mousePos.y);
  //xmov = dist*Math.cos(theta)
  //ymov = dist*Math.sin(theta)
  context.save();
  context.rotate(theta);
  context.beginPath();
  context.rect(-4,-2,8,4);
  context.stroke();
  context.restore();
  draw_hero(canvas,context);
}

function draw_hero(canvas,context) {
  // global hero has stores state
  context.save()
  max_r = Math.min(canvas.width/2,canvas.height/2)
  r = hero.throttle
  context.restore()

  //display throttle
  context.font='20pt Calibri';
  context.fillStyle='white';
  context.fillText(Math.round(hero.throttle*100)+'%',-1*canvas.width/2+30,-1*canvas.height/2+60);

}

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

// Debugging print function.
// Pre: any message to print and verbose set to true or false
// Post: if verbose is true then print to console
function print(msg) {
  if(verbose) { 
    console.log(msg);
  }
}  
