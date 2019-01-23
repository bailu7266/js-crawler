/*+-------------------------------------------------------------------------+
    Resizer类的定义：用于为flex view中的element通过鼠标改变大小用，resizer实际
    上是一个<div>，width/height就是resizer的实际宽度，它甚至为0（在屏幕上不可见），
    通过::after（position: absolute）来获得较大的mouse敏感区域。
    将采用ES6规范：使用class和extends
    前提：Resizer必须配合对应css使用，其中已经定义了.resizer, .resizer-horizontal
    和.resizer-vertical.
  +-------------------------------------------------------------------------+*/

let _seq = 0; // ES6不支持static变量，用'全局变量'替代。

class Resizer {
    // prev为该resizer依附的element，resizer改变这个element的大小
    // 按照当前的使用习惯，将只支持位于右边改变水平大小，位于底部改变垂直大小
    // 重新定位为两个element之间定位分割符，只应用在响应式layout中
    constructor(prev, direction) {
        this.prev = prev;
        // 默认使用prev的id（用户已经保证了唯一性）合成，否则生成一个全局唯一的id
        this.id = prev.id ? '_RSID_' + prev.id : Resizer.createId();
        let elt = document.createElement('DIV');
        this.ego = elt;
        this.dragging = false;
        this.normalCursors = { body: null, iframes: [], self: null };
        elt.id = this.id;
        // elt.draggable = true;
        elt.classList.add('resizer');
        if (direction.toLowerCase() === 'horizontal') {
            elt.classList.add('resizer-horizontal');
        } else if (direction.toLowerCase() === 'vertical') {
            elt.classList.add('resizer-vertical');
        }

        prev.insertAdjacentElement('afterend', elt);

        // 记录全部的iframe,以便处理mouse event丢失问题
        this.iframes = document.getElementsByTagName('iframe');
        this.saveCursors();

        console.log('offsetLeft: ' + prev.offsetLeft, 'parent.offsetLeft: ' + prev.parentElement.offsetLeft);
        console.log('parent.parent.offsetLeft: ' + prev.parentElement.parentElement.offsetLeft);
        console.log('offsetTop: ' + prev.offsetTop, 'parent.offsetTop: ' + prev.parentElement.offsetTop);
        console.log('parent.parent.offsetTop: ' + prev.parentElement.parentElement.offsetTop);
        let op = prev.offsetParent;
        while (op) {
            console.log('offsetParent: ' + op.tagName);
            console.log('op offsetLef: ' + op.offsetLeft + 'op offsetTop: ' + op.offsetTop);
            op = op.offsetParent;
        }

        // elt.addEventListener('mousemove', this.onMouseMove, true);
        let onMouseMove = (e) => {
            // 此处this是一个object，没有binding任何自定义的对象，所有不能访问
            // Resizer以及子类的方法。必须先设法通过id bindingResizer对象
            // 如果使用=>定义的话，this将会自动变成上级函数的this，这个问题是不是就解决了？
            e.preventDefault();
            e.stopPropagation();
            this.resizing(e);
        };

        // 把mouseup和mousmove注册到windows可以解决mouse出界导致无法收到up/move事件
        // 但还是无法进入iframe区域的mouse事件（需要想办法）
        let onMouseUp = (e) => {
            if (this.dragging && (e.which === 1)) {
                this.dragging = false;
                // console.log('mousemove released');
                window.removeEventListener('mousemove', onMouseMove);
                // elt.removeEventListener('mouseleave', onMouseLeave);
                window.removeEventListener('mouseup', onMouseUp);
                // remove所有iframe挂上的mouseup/leave handler
                for (let i = 0; i < this.iframes.length; i++) {
                    this.iframes[i].contentWindow.removeEventListener('mousemove', onMouseMove);
                    this.iframes[i].contentWindow.removeEventListener('mouseup', onMouseUp);
                }
                this.restoreCursors();
            }
        };
        /*
                let onMouseLeave = () => {
                    if (this.dragging) {
                        this.dragging = false;
                        elt.removeEventListener('mousemove', onMouseMove);
                        elt.removeEventListener('mouseleave', onMouseLeave);
                        elt.removeEventListener('mouseup', onMouseUp);
                        return this.restoreCursor();
                    }
                };
        */
        elt.addEventListener('mousedown', e => {
            if (e.which === 1) {
                this.dragging = true;
                e.preventDefault();
                window.addEventListener('mousemove', onMouseMove, false);
                window.addEventListener('mouseup', onMouseUp, false);
                // elt.addEventListener('mouseleave', onMouseLeave, false);
                // 给所有iframe挂上mouseup/leave handler
                for (let i = 0; i < this.iframes.length; i++) {
                    this.iframes[i].contentWindow.addEventListener('mousemove', onMouseMove, false);
                    this.iframes[i].contentWindow.addEventListener('mouseup', onMouseUp, false);
                }
                return this.changeCursors();
            }
        });
    }

    static createId() {
        return '__RID_' + (_seq++).toString();
    }

}

// 来自网络（https://esdiscuss.org/topic/better-way-to-maintain-this-reference-on-event-listener-functions）
// 这个定义太高深了，还没有看懂, 好像也不适合这种针对具体事件handler的add/remove处理
/* function handlerEvent(e) {
    this['on' + e.type](e);
} */

class HResizer extends Resizer {
    constructor(prev) {
        super(prev, 'Horizontal');
        // 目前只支持一个cursor（dragging），应该定义多个
        this.cursor = 'col-resize';
    }
}

Resizer.prototype.saveCursors = function() {
    this.normalCursors.self = this.ego.style.cursor;
    this.normalCursors.body = document.body.style.cursor;
    for (let i = 0; i < this.iframes.length; i++) {
        this.normalCursors.iframes[i] = this.iframes[i].contentWindow.document.body.style.cursor;
    }
};

Resizer.prototype.changeCursors = function() {
    this.ego.style.cursor = this.cursor;
    document.body.style.cursor = this.cursor;
    for (let i = 0; i < this.iframes.length; i++) {
        this.iframes[i].contentWindow.document.body.style.cursor = this.cursor;
    }
};

Resizer.prototype.restoreCursors = function() {
    this.ego.style.cursor = this.normalCursors.self;
    document.body.style.cursor = this.normalCursors.body;
    for (let i = 0; i < this.iframes.length; i++) {
        this.iframes[i].contentWindow.document.body.style.cursor = this.normalCursors.iframes[i];
    }
};

function getScreenLeft(elt) {
    let left = 0;
    while (elt) {
        /* 来自网络，感觉是错的，有点莫名其妙
        if (elt.tagName == 'BODY') {
            left += elt.offsetLeft + elt.clientLeft - (elt.scrollLeft || document.documentElement.scrollLeft);
        } else {
            left += elt.offsetLeft + elt.clientLeft - elt.scrollLeft;
        } */
        left += elt.offsetLeft;
        elt = elt.offsetParent;
    }
    return window.screenX + left;
}

// 用%比定义的width，在window resize的时候，可以按比例分配空间
HResizer.prototype.resizing = function(event) {
    // set prev's new position
    // 由于采用flex布局，应该只需要调整prev的参数就可以了。
    /*let percent =
        (100 * (event.movementX + this.prev.offsetWidth)) /
        this.ego.parentElement.offsetWidth;
    // console.log('Item ' + this.prev.id + ' 占据整个列空间的 ' + percent);
    this.prev.style.width = percent + '%';*/
    // console.log('offsetLet: ' + this.prev.offsetLeft + ' pageX: ' + event.pageX);
    // 使用screenX vs pageX：pageX是相对于document的，如果包含由iframe，pageX将在发生变化
    // 导致无法准确定位，用screenX就没有这个问题
    this.prev.style.width = (event.screenX - getScreenLeft(this.prev)) + 'px';
};

class VResizer extends Resizer {
    constructor(prev) {
        super(prev, 'Vertical');
        this.cursor = 'row-resize';
    }
}

// 这是用固定数值赋值的height，在window resize后，可以保证固定height
VResizer.prototype.resizing = function(event) {
    // set prev's new position
    let dy = event.movementY; // event.screenY - this.y;
    // console.log(dy);
    let height = this.prev.offsetHeight;
    this.prev.style.height = (dy + height).toString() + 'px';
};

module.exports = {
    HResizer,
    VResizer
};