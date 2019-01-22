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
        this.next = prev.nextElementSibling;
        if (!this.next) {
            console.log('Resizer不能应用于此场景！');
            return;
        }
        // 默认使用prev的id（用户已经保证了唯一性）合成，否则生成一个全局唯一的id
        this.id = prev.id ? '_RSID_' + prev.id : Resizer.createId();
        let elt = document.createElement('DIV');
        this.ego = elt;
        elt.id = this.id;
        // elt.draggable = true;
        elt.classList.add('resizer');
        if (direction.toLowerCase() === 'horizontal') {
            elt.classList.add('resizer-horizontal');
        } else if (direction.toLowerCase() === 'vertical') {
            elt.classList.add('resizer-vertical');
        }

        prev.insertAdjacentElement('afterend', elt);

        // 记录mouse的位置（offsetX, offsetY)
        this.x = 0;
        this.y = 0;
        elt.addEventListener('mousemove', (e) => {
            // 此处this是一个object，没有binding任何自定义的对象，所有不能访问
            // Resizer以及子类的方法。必须先设法通过id bindingResizer对象
            // 如果使用=>定义的话，this将会自动变成上级函数的this，这个问题是不是就解决了？
            if (elt.getAttribute('data-grap') === 'true') {
                e.preventDefault();
                this.resizing(e);

                this.x = e.screenX;
                this.y = e.screenY;
            }
        });
        elt.addEventListener('mousedown', (e) => {
            if (e.which === 1) {
                e.preventDefault();
                elt.setAttribute('data-grap', 'true');
                this.x = e.screenX;
                this.y = e.screenY;
                return this.changeCursor();
            }
        });
        elt.addEventListener('mouseup', (e) => {
            if (e.which === 1) {
                elt.setAttribute('data-grap', 'false');
                return this.restoreCursor();
            }
        });
        elt.addEventListener('mouseleave', () => {
            elt.setAttribute('data-grap', 'false');
            return this.restoreCursor();
        });
    }

    static createId() {
        return '__RID_' + (_seq++).toString();
    }
}

class HResizer extends Resizer {
    constructor(prev) {
        super(prev, 'Horizontal');
    }
}

HResizer.prototype.changeCursor = function() {
    this.ego.style.cursor = 'col-resize';
};

HResizer.prototype.restoreCursor = function() {
    this.ego.style.cursor = 'normal';
};

HResizer.prototype.resizing = function(event) {
    // set prev's new position
    let dx = event.screenX - this.x;
    console.log(dx);
    // 直接px数值是无效的（好像只对absolute/fixed的管用），对应flex的item
    // 最有效的办法应该是calc(n%)了，另外好像应该取消flex中的份额设置
    // 由于采用flex布局，应该只需要调整prev的参数就可以了。
    let percent = 100 * (dx + this.prev.offsetWidth) / this.ego.parentElement.offsetWidth;
    // console.log('Item ' + this.prev.id + ' 占据整个列空间的 ' + percent);
    this.prev.style.width = percent + '%';
    // width = this.next.offsetWidth;
    // this.next.style.width = (dx - width).toString() + 'px';
};

class VResizer extends Resizer {
    constructor(prev) {
        super(prev, 'Vertical');
    }
}

VResizer.prototype.changeCursor = function() {
    this.ego.style.cursor = 'row-resize';
};

VResizer.prototype.restoreCursor = function() {
    this.ego.style.cursor = 'normal';
};

VResizer.prototype.resizing = function(event) {
    // set prev's new position
    let dy = event.screenY - this.y;
    console.log(dy);
    let height = this.prev.offsetHeight;
    this.prev.style.height = (dy + height).toString() + 'px';
    // height = this.next.offsetHeight;
    // this.next.style.height = (dy - height).toString() + 'px';
};

module.exports = { HResizer, VResizer };