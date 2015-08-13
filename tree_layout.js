define([
  './joint_switch'
],function(
  joint_switch
){
  return function( g, data ) {
    var indent = 20;
    var padding= 15;

    var g_zoom;
    var g_scale;
    var g_zoom_require;
    var g_zoom_reset;

    function get_offset ( node ) {
      var offset ={
        top : node.offset.top,
        left: node.offset.left
      };
      var parent = node.parent && data[node.parent];
      while(parent){
        offset.top += parent.offset.top;
        offset.top += parent.offset.top;
        parent = node.parent && data[node.parent];
      }
      return offset;
    }

    function append_archor ( text, node ) {
      text.text( text.text() +' ');
      text.append('a')
        .text('详情')
        .attr({
          'xlink:href' : 'http://123',
          'target'     : '_blank'
        })
        .style({
          fill : 'blue'
        });
    }

    var g_lod = 0;

    function draw_node ( parent, pos, node, hide_children ) {

      node.offset    = {
        top : pos.top,
        left: pos.left
      };

      if( !node.body ) {
        var node_container = parent.append('g');
        var content_container = node_container.append('g');
        var rect = content_container.append('rect')
                      .attr({
                        'rx' : 3,
                        'ry' : 3
                      })
                      .style({
                        fill : '#fff',
                        stroke: '#ccc'
                      });

        var text = content_container.append('text')
                      .attr({
                        x : 20,
                        y : 10
                      });

        var tspans = text.selectAll('tspan')
          .data([
                  node.data.text,
                  '订单数：',
                  '用户数：',
                  '平均加载时长：',
                  '流失率：'
                ])
          .enter()
            .append('tspan')
            .text(function(d) { return d; });

        append_archor(text.select('tspan'));

        var lineheight = tspans[0][0].getBBox().height;
        tspans
          .attr({
              x : 30,
              dy : lineheight
            });

        // 设置背景框的尺寸
        var text_box = text[0][0].getBBox();
        rect.attr({
          x      : text_box.x -10,
          y      : text_box.y -10,
          width  : text_box.width + 20,
          height : text_box.height + 20,
        });

        // 创建 lod1
        var text_lod1= content_container.append('text')
                        .text(node.data.text)
                        .style({
                          'font-size' : 70,
                        })
                        .attr({
                          x : 30
                        });

        append_archor(text_lod1);


        var lod1_bbox = text_lod1[0][0].getBBox();
        text_lod1.attr('y', lod1_bbox.height);
      } else {
        node_container = node.body;
        content_container = node_container.select('g');
      }

      node_container.attr('transform', 'translate(' + pos.left + ',' +  pos.top +')')

      if(pos.joint){
        node.joint_line = node.joint_line || node_container.append("path")
          .style({
            fill : 'none',
            stroke : '#333'
          });
      }


      // 
      // lods
      // 缩放到不同的尺寸时展示不同的细节
      // 
      
      if( g_lod ){
        text_lod1 = (node.text_lod1 || text_lod1).style('display', 'block');
        (node.text      || text).style('display', 'none');
        node.joint_switch && node.joint_switch.container.style('display', 'none');
        var text_lod1_bbox = text_lod1[0][0].getBBox();

        content_container.select('rect')
          .attr({
            x      : text_lod1_bbox.x -10,
            y      : text_lod1_bbox.y -10,
            width  : text_lod1_bbox.width + 20,
            height : text_lod1_bbox.height + 20,
          });

      } else {
        (node.text_lod1 || text_lod1).style('display', 'none');
        text = (node.text      || text).style('display', 'block');
        node.joint_switch && node.joint_switch.container.style('display', 'block');

        text_box = text[0][0].getBBox();

        content_container.select('rect')
          .attr({
            x      : text_box.x -10,
            y      : text_box.y -10,
            width  : text_box.width + 20,
            height : text_box.height + 20,
          });
      }

      // 
      // 切换是否隐藏子元素的时候
      // 需要隐藏：
      //   子元素本身，
      //   子元素的线条，
      //   子元素的子元素
      //   子元素的开关
      // 
      var sub_pos;
      if( hide_children && !node.pin ){

        content_container.style('display', 'none');
        node.joint_switch && node.joint_switch.container.style('display', 'none');
        node.joint_line && node.joint_line.style('display', 'none');
        sub_pos = {
          top  : 0,
          left : 0,
          joint: pos.joint
        };

      } else {

        content_container.style('display', 'block');
        node.joint_switch && node.joint_switch.container.style('display', 'block');

        var c_box = content_container[0][0].getBBox();
        var joint_in =  [c_box.x, c_box.y + c_box.height/2];
        node.joint_line && node.joint_line.style('display', 'block')
          .data([[
            [10, pos.joint[1] - pos.top],
            [10, joint_in[1]],
           joint_in
          ]])
          .attr("d",  d3.svg.line());

        sub_pos = {
          top  : c_box.height + padding,
          left : indent,
          joint: [10, c_box.y + c_box.height] // joint_out
        };
      }




      node.children
        .map(function(idx) {
          return data[idx];
        }).forEach(function (_node) {
          draw_node( node_container,
            sub_pos,
            _node,
            hide_children || node.hide_children);
        });

      if(node.children.length && !node.joint_switch ){
        node.joint_switch = joint_switch( node_container, sub_pos.joint)
                              .change(function( state ) {
                                node.hide_children = !state;

                                redraw();
                              });
      }

      node.body      =  node.body      || node_container;
      node.text_lod1 =  node.text_lod1 || text_lod1;
      node.text      =  node.text      || text;

      pos.top += sub_pos.top;
    }

    function redraw () {
      draw_node(
        g,
        {
          top : 10,
          left: 10,
          joint : null
        },
        data[0],
        null);
    }

    redraw();

    redraw = _.debounce(redraw);
 
    return {
      update : function() {
        setTimeout(function() {
          if( !g_zoom || !g_scale ){
            console.error('no g_zoom or g_scale seted');
            return;
          }

          var zoom_scale = g_zoom.scale();
          g.attr('transform', 'translate('+ g_scale.x(0.5) + ','+ g_scale.y(1) +') scale(' + zoom_scale + ')');
          g_lod = zoom_scale <= 0.8 ? 1 : 0;
          redraw();
        });
      },
      zoom : function( zoom) {
        if( zoom == undefined ){
          return g_zoom;
        }
        g_zoom = zoom;
        return this;
      },
      scale: function( scale) {
        if( scale == undefined ){
          return g_scale;
        }
        g_scale = scale;
        return this;
      },
      zoom_require: function(zoom_require) {
        if( zoom_require == undefined ){
          return g_zoom_require;
        }
        g_zoom_require = zoom_require;
        return this;
      },
      zoom_reset: function(zoom_reset) {
        if( zoom_reset == undefined ){
          return g_zoom_reset;
        }
        g_zoom_reset = zoom_reset;
        return this;
      }
    };
  };

});