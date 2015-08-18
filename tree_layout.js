define([
  './joint_switch'
],function(
  joint_switch
){

  return function( g, data ) {


    var g_zoom;
    var g_scale;
    var g_zoom_require;
    var g_zoom_reset;
    var g_layout;

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

    // 
    // 切换是否隐藏子元素的时候
    // 需要隐藏：
    //   子元素本身，
    //   子元素的线条，
    //   子元素的子元素
    //   子元素的开关
    // 
    // 切换lod时
    //
    // 需要修改
    //   lod
    //   lod容器
    //   开关
    //   开关连线
    // 
    // 计算布局时，需要先决定元素的内容
    //   首先绘制文字+文字边框
    //   绘制子元素
    //   最后绘制开关
    //

    function draw_node ( parent, pos, node, hide_children, node_idx ) {
      //
      // 确定所有组件的显示状态
      //

      function check_show_elements( hide_children, pin, lod ) {
        var ret = {
          content : true,
          joint_line : true,
          joint_switch : true,
          lods : 'lod0'
        };
        if(hide_children && !pin){
          ret.content = false;
          ret.joint_line = false;
          ret.joint_switch = false;
        }
        switch(lod){
          case 0 :
            break;
          case 1 :
            ret.joint_switch = false;
        }
        ret.lods = lod;
        return ret;
      }
      var display_stats = check_show_elements(hide_children, node.pin, g_lod);

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

        // 
        // lods
        // 缩放到不同的尺寸时展示不同的细节
        // 

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

        // 创建 lod1
        var text_lod1= content_container.append('text')
                        .text(node.data.text)
                        .style({
                          'font-size' : 70,
                          'display'   : 'none',
                        })
                        .attr({
                          x : 30
                        });

        append_archor(text_lod1);


        var lod1_bbox = text_lod1[0][0].getBBox();
        text_lod1.attr('y', lod1_bbox.height);

      }

      node_container = node_container       || node.body;
      content_container = content_container || node_container.select('g');

      node_container.attr('transform', 'translate(' + pos.left + ',' +  pos.top +')');


      if(pos.joint && !node.joint_line){
        node.joint_line = node_container.append("path")
          .style({
            fill : 'none',
            stroke : '#333'
          });
      }



      text_lod1 = (node.text_lod1 || text_lod1);
      text      = (node.text      || text);

      [text,text_lod1].forEach(function(node,idx) {
        node.style('display', idx == display_stats.lods ? 'block' : 'none');
        if( idx == display_stats.lods ){
          var lod_bbox = node[0][0].getBBox();
          content_container.select('rect')
            .attr({
              x      : lod_bbox.x -10,
              y      : lod_bbox.y -10,
              width  : lod_bbox.width + 20,
              height : lod_bbox.height + 20,
            });
        }
      });

      var sub_pos;
      if( hide_children && !node.pin ){
        sub_pos = {
          top  : 0,
          left : 0,
          joint: pos.joint
        };
        c_box = { height : 0 };
      } else {
        var c_box = content_container[0][0].getBBox();

        if( g_layout ){
          var child_layout = g_layout( pos, c_box, node_idx, g_lod );

          var joint_in  = child_layout.joint_in;
          var joint_out = child_layout.joint_out;
          var sub_pos   = child_layout.sub_pos;
          
          sub_pos.joint = joint_out;
          var joint_line_data = child_layout.joint_line_data;

        } else {

          var indent = 20;
          var padding= 15;

          var joint_in  = [c_box.x, c_box.y + c_box.height/2];
          var joint_out = [10, c_box.y + c_box.height];

          sub_pos = {
            top  : c_box.height + padding,
            left : indent,
            joint: joint_out // joint_out
          };

          var joint_line_data = pos.joint ? [
            [pos.joint[0] - pos.left + 20, pos.joint[1] - pos.top],
            [pos.joint[0] - pos.left + 20, joint_in[1]],
            joint_in
          ] : null;
        }

        node.joint_line && node.joint_line
                            .data([joint_line_data])
                            .attr("d",  d3.svg.line());
      }

      content_container && content_container.style('display', display_stats.content ? 'block' : 'none');
      node.joint_line && node.joint_line.style( 'display', display_stats.joint_line ? 'block' : 'none' );

      node.children
        .map(function(idx) {
          return data[idx];
        }).forEach(function (_node, idx) {
          draw_node( node_container,
            sub_pos,
            _node,
            hide_children || node.hide_children,
            idx);
        });

      if(node.children.length && !node.joint_switch ){
        node.joint_switch = joint_switch( node_container, sub_pos.joint)
                              .change(function( state ) {
                                node.hide_children = !state;
                                redraw();
                              });
      }

      if( node.joint_switch ){
        joint_out && node.joint_switch.translate(joint_out);
        node.joint_switch.container.style( 'display', display_stats.joint_switch ? 'block' : 'none' );
      }

      node.body      =  node.body      || node_container;
      node.text_lod1 =  node.text_lod1 || text_lod1;
      node.text      =  node.text      || text;

      pos.top += Math.max( c_box.height + 30, sub_pos.top);
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

    // redraw();

    redraw = _.debounce(redraw);
 
    return {
      update : function() {
        setTimeout(function() {
          if( !g_zoom || !g_scale ){
            console.error('no g_zoom or g_scale seted');
            return;
          }

          var zoom_scale = g_zoom.scale();
          g.attr('transform', 'translate('+ g_scale.x(0) + ','+ g_scale.y(1) +') scale(' + zoom_scale + ')');
          g_lod = zoom_scale <= 0.8 ? 1 : 0;
          redraw();
        });
      },
      zoom : function( zoom) {
        if( arguments.length == 0 ){
          return g_zoom;
        }
        g_zoom = zoom;
        return this;
      },
      scale: function( scale) {
        if( arguments.length == 0 ){
          return g_scale;
        }
        g_scale = scale;
        return this;
      },
      zoom_require: function(zoom_require) {
        if( arguments.length == 0 ){
          return g_zoom_require;
        }
        g_zoom_require = zoom_require;
        return this;
      },
      zoom_reset: function(zoom_reset) {
        if( arguments.length == 0 ){
          return g_zoom_reset;
        }
        g_zoom_reset = zoom_reset;
        return this;
      },
      layout: function( layout ) {
        if( arguments.length == 0 ){
          return g_layout;
        }
        g_layout = layout;
        return this;
      }
    };
  };

});