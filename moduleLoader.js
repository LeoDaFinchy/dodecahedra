var app = app;
app.moduleLoader = {
  menu:{
    globals:{
      name:'globals',
      url:'./globals.js',
      prerequisites:['lens'],
      loaded:false
    },
    input:{
      name:'input',
      url:'./input.js',
      prerequisites:[],
      loaded:false
    },
    monitor:{
      name:'monitor',
      url:'./monitor.js',
      prerequisites:[],
      loaded:false
    },
    lens:{
      name:'lens',
      url:'./lens.js',
      prerequisites:[],
      loaded:false
    },
    graph:{
      name:'graph',
      url:'./graph.js',
      prerequisites:[],
      loaded:false,
    },
    worlds:{
      name:'worlds',
      url:'./worlds.js',
      prerequisites:['graph'],
      loaded:false,
    },
    default:{
      name:'default',
      prerequisites:[
        'globals',
        'input',
        'monitor',
        'worlds',
      ],
      loaded:false
    }
  },
  loadModule:function(name, callback){
    var loaded = $.when();
    if(this.menu[name].loaded)
    {
      console.log(name+" already loaded");
    }
    else
    {
      if(!this.menu[name].url){console.log("loading module pack "+name);}
      for(var i in this.menu[name].prerequisites)
      {
        loaded = $.when(loaded, this.loadModule(this.menu[name].prerequisites[i]));
      }
      if(this.menu[name].url)
      {
        console.log("loading "+name+"...");
        loaded = $.when(loaded, $.getScript(this.menu[name].url));
      }
    }
    loaded.done(function(){
      console.log(name+" loaded");
      app.moduleLoader.menu[name].loaded = true;
    }, callback)
    .fail(function()
    {
      console.log("failed to load "+name);
    });
    
    return loaded;
  }
};