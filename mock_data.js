define([

],function(

){
  var datas  = [];

  function node ( parent, data) {
    this.parent = parent;
    this.idx    = datas.length;
    this.data   = data;
    this.children = [];
    datas.push(this);
  };

  node.prototype.add_child = function( data ) {
    var self = this;
    if(Array.isArray(data)){
      return data.map(this.add_child.bind(this));
    }
    var child = new node(this.idx, data);
    this.children.push( child.idx );
    return child;
  };

  var root = new node(null,{
    text : 'root'
  });

  root.add_child({
    text : 'child 1'
  });

  var child2 = root.add_child({
    text : 'child 2'
  });

  child2
    .add_child({
      text : 'child2.1'
    });

  var child3 = root.add_child({
    text : 'child 3'
  });

  child3
    .add_child([{
      text : 'child 3.1'
    },
    {
      text : 'child 3.2'
    }]);

  return datas;
});