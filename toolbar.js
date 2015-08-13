define([
  'ko',
  'jquery'
],function(
  ko,
  $
){
  var buttons  = $('.toolbar .btn-group');
  var labels   = $('.toolbar .form-group');
  var label_map = {};

  return {
    regist : function( name, handle ) {
      buttons.append( $('<div class="btn btn-default">'+name+'</div>').click(handle) );
    },
    label  : function( name, value ) {
      if( value == undefined ){
        return label_map[name];
      }

      if(!label_map[name]){
        label_map[name] = $('<label></label>').prependTo(labels);
      }

      label_map[name].text(value);
    }
  };
});