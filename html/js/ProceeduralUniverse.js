function Planet() {
  this.galactic_x = 0;
  this.galactic_y = 0;
  this.color = "#000000";
  this.text_color = "#FFFFFF";
  this.r = 0;
  this.name = '';
  this.id = '';
  var self = this;
  this.GetBlock = function(blocksize) {
    var xb = Math.floor(self.galactic_x/blocksize);
    var yb = Math.floor(self.galactic_y/blocksize);
    return {xblock:xb,yblock:yb};
  }
}


function update_bodies() {
  var gc = galactic_coordinates;
  var blocksize = 5000;
  var curblock_x = Math.floor(gc.x_origin/blocksize);
  var curblock_y = Math.floor(gc.y_origin/blocksize);
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
  for(xblock in proceedural_blocks) {
    for(yblock in proceedural_blocks[xblock]) {
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
}

function clean_unneeded(needed,blocksize) {
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

function populate_proceedural_block(xblock,yblock,blocksize) {
  var max_planets=50;
  var min_size = 50;
  var max_size = 300;
  var rg = new RandomGenerator(xblock,yblock)
  var num_planets = Math.floor(rg.random()*max_planets);
  
  //print(num_planets)
  for(var i = 0; i < num_planets; i++) {
    var x = 0;
    if(xblock >= 0) {
      x = Math.floor(rg.random()*blocksize)+xblock*blocksize;
    } else {
      x = -1*Math.floor(rg.random()*blocksize)+(xblock+1)*blocksize;
    }
    var y = 0;
    if(yblock >= 0) {
      y = Math.floor(rg.random()*blocksize)+yblock*blocksize;
    } else {
      y = -1*Math.floor(rg.random()*blocksize)+(yblock+1)*blocksize;
    }
    var size = Math.floor(rg.random()*(max_size-min_size))+min_size;
    p = new Planet()
    p.galactic_x = x
    p.galactic_y = y
    //print(p.galactic_x+','+p.galactic_y)
    p.r = size
    p.id = Math.floor(rg.random()*10000000)
    planets.push(p)
    //print(p.galactic_x+','+p.galactic_y)
   }
}

function draw_bodies(canvas,context) {
  for(var i = 0; i < planets.length; i++) {
    var p = planets[i];
    var mapcoord = galactic_coordinates.ToCartesian(p.galactic_x,p.galactic_y)
    var cc = canvas_coord(mapcoord.x,mapcoord.y)
    context.save();
    context.beginPath();
    context.arc(cc.x,cc.y,p.r,0,2*Math.PI);
    context.fillStyle=p.color;
    context.fill()
    context.stroke();
    context.fillStyle=p.text_color;
    context.textAlign="center";
    context.font="20px Ariel";
    context.fillText(planets[i].name,cc.x,cc.y)
    context.restore();
  }
  var mapcoord = galactic_coordinates.ToCartesian(1000,1000)
  var cc = canvas_coord(mapcoord.x,mapcoord.y)
  context.save();
  context.beginPath();
  context.arc(cc.x,cc.y,100,0,2*Math.PI);
  context.fillStyle='black';
  context.fill()
  context.stroke();
  context.fillStyle='white';
  context.textAlign="center";
  context.font="20px Ariel";
  context.fillText("Middlehorndog",cc.x,cc.y)
  context.restore();
}


function RandomGenerator(v1,v2) {
  this.seed1 = v1
  this.seed2 = v2
  this.seed3 = 1000;
  var self = this;
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

