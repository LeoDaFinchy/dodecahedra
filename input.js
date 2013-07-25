var app = app;

app.input = {
  keys:{
    left:{code:37,state:0},
    up:{code:38,state:0},
    right:{code:39,state:0},
    down:{code:40,state:0},
    w:{code:87,state:0},
    a:{code:65,state:0},
    s:{code:83,state:0},
    d:{code:68,state:0},
    e:{code:69,state:0},
    q:{code:81,state:0},
  },
  axes:{
    X1:0,
    X2:0,
    Y1:0,
    Y2:0,
    Z1:0
  },
  onKeyDown:function(event){
    var downKey = event.which;
    for(var i in app.input.keys){
      var key = app.input.keys[i];
      if(downKey == key.code){
        //We only want to trigger "down" when the state changes, not on system repetition
        if(key.state != 1){
          key.state = 1;
          if(key.down){
            key.down();
          }
        }
      }
    }
    event.stopImmediatePropagation();
  },
  onKeyUp:function(event){
    var upKey = event.which;
    for(var i in app.input.keys){
      var key = app.input.keys[i];
      if(upKey == key.code){
        key.state = 0;
        if(key.up){
          key.up();
        }
      }
    }
    event.stopImmediatePropagation();
  }
};