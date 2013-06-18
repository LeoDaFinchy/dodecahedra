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
      prerequisites:['globals'],
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
    loaded = $.when(loaded, $.getScript(this.menu[name].url))
    .done(callback, function(){
      console.log("loaded "+name+"...");
      app.moduleLoader.menu[name].loaded = true;
    })
    .fail(function()
    {
      console.log("failed to load "+name);
    });
    
    return loaded;
  }
};