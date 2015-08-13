define([

],function(

){
  return function create_joint_switch( container, joint ) {
      var joint_size = 8;
      var joint_container= container.append('g')
                              .attr('transform','translate(' + joint.join(',') + ')')
                              .style({
                                cursor : 'pointer'
                              });

      joint_container
        .append('circle')
          .attr({
            cx : 20,
            cy : 0,
            r  : joint_size
          })
          .style({
            stroke : '#000',
            fill   : '#fff'
          });

      joint_container
        .append('line')
          .attr({
            x1 : 20 - joint_size/2,
            y1 : 0,
            x2 : 20 + joint_size/2,
            y2 : 0,
          })
          .style({
            stroke : '#000'
          });

      var open_line = joint_container
                        .append('line')
                          .attr({
                            x1 : 20,
                            y1 : - joint_size/2,
                            x2 : 20,
                            y2 : joint_size/2,
                          })
                          .style({
                            stroke : '#000',
                            display: 'none'
                          });
      var state = true;
      var events = [];

      joint_container.on('click', function() {
        ret.toggle();
      });

      var ret = {
        toggle : function(_) {
          var pre = state;
          if(!arguments.length){
            state = !state;
          } else {
            state = !!_;
          }

          open_line.style('display', !state ? 'block' : 'none');
          if( pre != state ){
            events.forEach(function( h ) {
              h(state);
            });
          }
          return state;
        },
        change : function( handle ) {
          events.push(handle);
          return this;
        },
        container : joint_container
      };
      return ret;
    }
});