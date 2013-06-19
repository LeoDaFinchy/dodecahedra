var app = app;
app.moduleLoader = {
  menu:{
    globals:{
      name:'globals',
      url:'./globals.js',
      prerequisites:[],
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
    }
  },
  loadModule:function(name, callback){
    console.log("loading "+name+"...");
    var loaded = $.when();
    for(var i in this.menu[name].prerequisites)
    {
      loaded = $.when(loaded, this.loadModule(this.menu[name].prerequisites[i]));
    }
    if(this.menu[name].loaded)
    {
      console.log(name+" already loaded");
    }
    else
    {
      loaded = $.when(loaded, $.getScript(this.menu[name].url))
      .done(function(){
        console.log(name+" loaded");
        app.moduleLoader.menu[name].loaded = true;
      }, callback)
      .fail(function()
      {
        console.log("failed to load "+name);
      });
    }
    
    return loaded;
  }
};