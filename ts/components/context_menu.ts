import * as d3 from "d3";

export interface MenuItem<T> {
    name: string;
    click(itemContext: T): void;
    visible?(itemContext: T): boolean;
    elem?: d3.Selection<any, any, any, any>
}


export enum MenuDirection {
    horizontal,
    vertical,
}

export function buildBtns(
    btnContainer: d3.Selection<SVGGElement, any, any, any>,
    _btns: MenuItem<any>[],
    isContextmenu: boolean = false,
    direction: MenuDirection = MenuDirection.horizontal,
    getContext?: () => any
) {
    _btns.reduce(function (left, item) {
        const btn = btnContainer.append('g').attr('transform',
            direction == MenuDirection.horizontal
                ? 'translate(' + left + ',' + 0 + ')'
                : 'translate(' + 0 + ',' + left + ')'
        );
        item.elem = btn;
        const bg = btn.append('rect')
            .attr('y', -5)
            .style('fill', '#e2edef');
        const text = btn.append('text')
            .attr('dx', '10')
            .attr('dy', '10');

        setTimeout(() => {
            const bbox = text.node()!.getBBox();
            console.log(bbox);
            bg
                .attr('width', bbox.width + 10 * 2)
                .attr('height', bbox.height + 10)
        }, 10);

        text.text(item.name);
        btn
            .on('mousedown', function () {
                d3.event.stopPropagation();
            })
            .on('click', function (...args: any[]) {
                if (getContext) {
                    item.click(getContext());
                } else {
                    item.click(null);
                }

                if (isContextmenu) {
                    btnContainer.style('display', 'none');
                }
            });

        return left + 10 * 2 + (direction == MenuDirection.horizontal ? item.name.length * 7 : 15);
    }, 0);
}

export function layoutBtns(
    _btns: MenuItem<any>[],
    direction: MenuDirection = MenuDirection.horizontal,
    getContext?: () => any
) {
    const context = getContext ? getContext() : null;
    _btns.reduce(function (left, item) {
        const btn = item.elem!;

        if (item.visible && item.visible(context) == false) {
            btn.style('display', 'none');
            return left;
        }

        btn.style('display', null).attr('transform',
            direction == MenuDirection.horizontal
                ? 'translate(' + left + ',' + 0 + ')'
                : 'translate(' + 0 + ',' + left + ')'
        );

        return left + 10 * 2 + (direction == MenuDirection.horizontal ? item.name.length * 7 : 15);
    }, 0);
}

export function makeContextMenu<T>(
    container: d3.Selection<any, any, any, any>,
    wrapper: d3.Selection<any, any, any, any>,
    buttons: MenuItem<T>[],
    direction: MenuDirection = MenuDirection.horizontal,
    autoDismiss?: boolean
) {
    let itemContext: T;
    wrapper
        .style('display', 'none')
        .on('contextmenu', function () { d3.event.preventDefault(); })

    if (autoDismiss !== false) {
        container
            .on('mousedown', function () {
                wrapper.style('display', 'none');
            });
    }

    buildBtns(wrapper, buttons, true, direction, () => itemContext);

    const ret = {
        showWithContext(item: T, position?: { x: number, y: number }) {
            itemContext = item;
            layoutBtns(buttons, direction, () => itemContext);
            wrapper.style('display', null);

            if (position != undefined) {
                wrapper.attr('transform', 'translate(' + position.x + ',' + position.y + ')');
            } else {
                const mouseInfo = d3.mouse(container.node() as any);
                wrapper.attr('transform', 'translate(' + mouseInfo[0] + ',' + mouseInfo[1] + ')');
            }
        },
        hide() {
            wrapper.style('display', 'none');
        }
    };

    return ret;
}
