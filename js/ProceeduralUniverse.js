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
  this.text_color = "#FFFFFF";
  this.r = 0;
  this.proximity = 0; //thickness of atmosphere 
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
    context.save();
    context.beginPath();
    s.spokes[i][0]+=rate*direction;
    var cc = s.coord.GetCanvas();
    var skew = 1/4;
    context.fillStyle=s.color;
    context.translate(cc.x,cc.y);
    context.rotate(s.spokes[i][0])
    triangle(context,-r*skew,-r*skew,-r*skew,r*skew,(1-skew)*r,0);
    context.restore();
  }
}


function update_bodies() {
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

