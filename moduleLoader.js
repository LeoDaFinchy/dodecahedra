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
    var pre = [];
    for(var i in this.menu[name].prerequisites)
    {
      pre.push(this.loadModule(this.menu[name].prerequisites[i]));
    }
    return $.when(pre, $.getScript(this.menu[name].url))
    .done(callback, function(){
      console.log("loaded "+name+"...");
      this.menu[name].loaded = true;
    })
    .promise();
  }
};