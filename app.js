require([
    './mini_map',
    './toolbar',
    './tree_layout',
    './mock_data',
    'ko'
], function (
    mini_map,
    toolbar,
    tree_layout,
    mock_data,
    ko
) {

        var $wrapper = $('.wrapper');

        var size = {
            height: $wrapper.height() - 5,
            width: $wrapper.width() - 5
        };

        var scale = {
            x: d3.scale.linear().range([0, size.width]).domain([0, 1]),
            y: d3.scale.linear().range([size.height, 0]).domain([0, 1])
        };

        var svg = d3.select($wrapper[0]).append('svg')
            .attr(size);

        content = svg.append('g');

        content.append('rect')
            .attr({
                class: 'overlay',
                x: 0,
                y: 0,
            })
            .attr(size);

        var zoom = d3.behavior.zoom()
            .x(scale.x)
            .y(scale.y)
            .scaleExtent([0.2, 5])
            .on('zoom', zooming);

        function zooming() {
            // a new zoom here
            grid.x.selectAll('.x.grid').call(grid_x);
            grid.y.selectAll('.y.grid').call(grid_y);

            tree_view.update();
            setTimeout(function () {
                _mini_map.update();
            }, 10);

            toolbar.label('scale', '缩放: ' + (zoom.scale() * 100).toFixed(2) + '%');
        }

        content.call(zoom);

        var grid_size = 100;
        var grid = {
            x: content.append('g'),
            y: content.append('g')
        };

        var n_x = size.height / grid_size;
        var d_x = d3.range(n_x)
            .map(function (d) {
                return d / n_x;
            });

        var n_y = size.width / grid_size;
        var d_y = d3.range(n_y)
            .map(function (d) {
                return d / n_y;
            });


        grid.x.selectAll('.x.grid').data(d_x).enter()
            .append('line')
            .attr({
                'class': 'x grid',
                x1: 0,
                x2: size.width
            });

        grid.y.selectAll('.x.grid').data(d_y).enter()
            .append('line')
            .attr({
                'class': 'y grid',
                y1: 0,
                y2: size.height
            });

        var tree_view_root = svg.append('g');
        var tree_view = tree_layout(tree_view_root, mock_data)
            .zoom(zoom)
            .scale(scale)
            .zoom_require(zooming)
            .zoom_reset(reset_zoom)


        var _mini_map = mini_map(svg, size)
            .zoom(zoom)
            .scale(scale)
            .item(tree_view_root);

        zooming();

        function grid_x(g) {
            g.each(function () {
                var el = d3.select(this);
                el
                    .attr({
                        y1: scale.y,
                        y2: scale.y,
                    });
            });
        }

        function grid_y(g) {
            g.each(function () {
                var el = d3.select(this);
                el
                    .attr({
                        x1: scale.x,
                        x2: scale.x,
                    });
            });
        }


        function reset_zoom() {
            zoom
                .x(scale.x.domain([0, 1]))
                .y(scale.y.domain([0, 1]));

            zooming();
        }
        toolbar.regist('重置缩放', reset_zoom);

        function fit_in_screen() {
            reset_zoom();
            var tree_view_root_bbox = tree_view_root[0][0].getBBox();
            var rate = size.height / (tree_view_root_bbox.height + tree_view_root_bbox.y + 60);

            zoom.scale(rate);
            zooming();
        }

        toolbar.regist('适应屏幕', fit_in_screen);

        function fold_all() {
            mock_data.forEach(function (node) {
                node.joint_switch && node.joint_switch.toggle(false);
            });
        }
        toolbar.regist('折叠所有', fold_all);

        function unfold_all() {
            mock_data.forEach(function (node) {
                node.joint_switch && node.joint_switch.toggle(true);
            });
        }
        toolbar.regist('展开所有', unfold_all);


        function horizontal_layout(pos, cbox, idx, lod) {

            var v_mid = cbox.y + cbox.height / 2;
            var joint_in = [cbox.x, v_mid];
            var left = lod ? 600 : 300;

            var ret = {
                joint_in: joint_in,
                joint_out: [cbox.width, v_mid],
                cbox: cbox,
                sub_pos: {
                    top: 0,
                    left: left
                },
                joint_line_data: null
            };

            if (pos.joint) {
                var x_start = joint_in[0];
                var x_end = pos.joint[0] - left + 20;
                var x_mid = (x_start + x_end) / 2;

                ret.joint_line_data = [
                    [x_end, pos.joint[1] - pos.top],
                    [x_mid, pos.joint[1] - pos.top],
                    [x_mid, joint_in[1]],
                    joint_in
                ];
            }

            return ret;
        }

        function toggle_layout() {
            tree_view.layout(tree_view.layout() ? null : horizontal_layout);
            zooming();
        }

        toolbar.regist('切换布局', toggle_layout);

    });
