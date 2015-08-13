define([
  './util'
],function(
  util
){
  var debug = false;
  return function( g, size ) {
    var optn = {};

    var wrapper = g.append('g').attr({ 'class' : 'minimap' });
    if( debug ){
      var dim_box = g.append('rect')
                      .style({
                        fill : 'none',
                        stroke : '#f00'
                      });
    }

    var wrapper_size = {
      width : 0.2*size.width,
      height: 0.2*size.height
    };

    var rect = wrapper.append('rect').attr({ 'class' : 'minimap-bg' })
                .attr(wrapper_size)
                .style({
                  fill   : 'rgba(255,255,255,0.4)',
                  stroke : '#999'
                });

    var minimap = wrapper.append('g');
    var item = minimap.append('rect').attr({ 'class' : 'minimap-item' })
                .style({
                  fill  : '#cacaca',
                  stroke: 'none'
                });

    var mask = minimap.append('rect').attr({ 'class' : 'minimap-viewport' })
                .style({
                  fill   : 'rgba(108, 180, 239, 0.4)',
                  stroke : 'rgba(180, 180, 180, 0.8)'
                })
                .attr(size);
    // 
    // 1 整个minimap需要展示可视区域和超出可视区域的元素
    // 2 可视区域展示出其相对于整体的位置
    // 3 元素需要计算其bbox经过transform变换后的实际尺寸
    // 4 综上，使用一个浮动窗口来显示缩略图，然后使用浮动窗口在minimap中定位
    // 5 在实际显示的视图中，首先绘制出视图的位置，再绘制相对的元素的位置。
    //    绘制元素时不能使用transform

    wrapper.attr('transform','translate(' + size.width * 0.8 + ',0)');
    minimap.attr('transform','scale(0.2)');

    var ret = {
      update : function() {
        var scale = optn.zoom.scale();
        var real_scale = 1/scale;

        var item_bbox = optn.item[0][0].getBBox();
        var transform = optn.item.attr('transform');
        if( !transform ){
          return;
        }

        transform = util.unwrap_transform(transform);
        var actual_pos = {
          x      : item_bbox.x * transform.scale + transform.translate[0],
          y      : item_bbox.y * transform.scale + transform.translate[1],
          width  : item_bbox.width * transform.scale,
          height : item_bbox.height * transform.scale
        };


        var xs = [ actual_pos.x, 0, size.width,  actual_pos.x + actual_pos.width ];
        var ys = [ actual_pos.y, 0, size.height, actual_pos.y + actual_pos.height ];

        var total_bbox = {
          x : 0,
          y : 0,
          width : Math.max.apply(null,xs) - Math.min.apply(null,xs),
          height : Math.max.apply(null,ys) - Math.min.apply(null,ys)
        };

        var minimap_scale = Math.max( total_bbox.width / wrapper_size.width,
                                      total_bbox.height/ wrapper_size.height);

        if( minimap_scale < 5.5 ){
          wrapper.style('display', 'none');
          return;
        } else {
          wrapper.style('display', 'block');
        }

        var scaled_size = {
          width  : total_bbox.width/minimap_scale,
          height : total_bbox.height/minimap_scale
        };
        var adjust_size = [
          Math.max(wrapper_size.width  - scaled_size.width,  0)/ 2,
          Math.max(wrapper_size.height - scaled_size.height, 0)/ 2,
        ];
        if(debug){
          dim_box.attr(actual_pos);
        }

        item.attr({
          x : Math.max(0, actual_pos.x),
          y : Math.max(0, actual_pos.y),
          width : actual_pos.width,
          height : actual_pos.height
        });
        minimap.attr('transform', ' translate('+ adjust_size +') scale(' + 1/minimap_scale + ')');

        mask.attr({
          x : Math.max(0, -1 * actual_pos.x),
          y : Math.max(0, -1 * actual_pos.y)
        });
      }
    };

    util.add_attr( optn, ret, 'zoom'  );
    util.add_attr( optn, ret, 'scale' );
    util.add_attr( optn, ret, 'item' );

    return ret;
  };

});