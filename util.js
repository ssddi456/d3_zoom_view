define([

],function(

){
  return {
    add_attr : function( private_root, obj, name ) {
      obj[name] = function(_) {
        if( arguments.length == 0 ){
          return private_root[name];
        }
        private_root[name] = _;
        return this;
      };
    },
    unwrap_transform : function( transform ) {
      var attrs = {};
      transform.replace(/([a-z]+)\s*\(([^)]+)\)/g,function( $, $1, $2 ){
        var attr = $2.split(',').map(function(s) { return +s.trim() });
        attrs[$1.trim()] = attr[1] == undefined ? attr[0] : attr;
      });
      return attrs;
    }
  };
});