function KeyCodes() {
    this.enter = 13;
    this.space = 32;
    this.left = 37;
    this.right = 39;
    this.up = 38;
    this.down = 40;
}

function Menubar(menuId) {
    let self = this;
    self.id = '#' + menuId;
    self.timer = null;
    // 定义方向键、控制键
    // self.keys = new KeyCodes();
    self.menubar = document.getElementById(menuId);
    /* self.menubar.onmousedown = function(e) {
        e.preventDefault();
        console.log('on-mousedown ' + this.id);
    }; */
    // self.menubar.tabIndex = '0'; // Make menubar keyborad-navigable
    self.btns = Array.from(self.menubar.querySelectorAll('.menu>.button'));
    for (let i = 0; i < self.btns.length; i++) {
        let btn = self.btns[i];
        btn.tabIndex = '-1'; // make it be able to be focused
        // 此处必须用function表述方式，如果用()=>{}方式，在inner函数中的
        // this为outer函数的this，此处就是Menubar
        btn.addEventListener('mousedown', function(e) {
            return self.onMouseDown(this, e);
        });
        btn.addEventListener('mouseover', function(e) {
            return self.hoverMenu(this, e);
        });
        btn.addEventListener('blur', function(e) {
            return self.blurMenu(this, e);
        });
        btn.addEventListener('focus', function(e) {
            return self.focusMenu(this, e);
        });
        btn.addEventListener('keydown', function(e) {
            return self.onKeyDown(this, e);
        });
    }
    // active: 表示menubar当前是否获得focus
    // select: 表示当前活跃的button，如果menubar握有focus，则该button
    //         拥有focus, 如果当前没有，则在下次menubar获得focus时，该button
    //         会被focus
    self.select = self.btns[0];
    self.select.tabIndex = '0';
    self.active = null;

    // only for alt-key
    window.addEventListener('keydown', function(e) { return self.onAltKey(e); });

    // for mouse over menu-list box
    let mlist = self.menubar.querySelectorAll('.menu-list');
    for (let li = 0; li < mlist.length; li++) {
        mlist[li].addEventListener('mouseover', function(e) { return self.onHoverList(this, e); });
    }
}
/*
function meusList(mi) {
    let menuList = mi.parentElement.querySelector('.menu-list');
    if (!menuList)
        console.log('Something has been wrong when search for the menu-list(sibling)');

    return menuList;
}
*/
Menubar.prototype.onAltKey = function(e) {
    if (e.altKey) {
        if (this.active) {
            this.select.blur();
        } else {
            this.select.focus();
        }
    }
};

Menubar.prototype.onMouseDown = function(btn, e) {
    e.preventDefault();
    // e.stopPropagation();
    if (btn.getAttribute('data-focused') === 'false') {
        //if (btn.getAttribute('data-focused') === 'true') {
        //    btn.blur();
        //} else {
        btn.focus();
    }
    if (this.menubar.getAttribute('data-open') === 'true') {
        this.menubar.setAttribute('data-open', 'false');
    } else {
        this.menubar.setAttribute('data-open', 'true');
    }
};

/*---------------------------------------------------------------------------------------
    两种情况:
    1. click menu button: 此时，先获取focus事件，然后获取click事件，此后在click同一个button的话，
       将只获取click事件，而没有focus
    2. hover切换：因为切换时，只有focus事件，所以无法感知切换，但切换后，如果click button的话，将只
       发送click事件，而不会有focus(already focused)
----------------------------------------------------------------------------------------*/

/*
    有两种情况进入focus
    1. click：此时将同时触发focus（前）和click（后）事件，
    2. hover：只是同hover事件主动触发的，所有focus在后，且不会有click事件。
       此事件说明focus发生了迁移，将有系统给前focus单元发送blur事件，当前单元接收
       到focus事件
*/

Menubar.prototype.focusMenu = function(btn) {
    // menu[this.id].style.visibility = 'visible';
    if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
    }
    // setTimeout(() => {
    btn.setAttribute('data-focused', 'true');
    // this.menubar.setAttribute('data-open', 'true');
    this.selectButton(btn);
    this.active = true;
    // }, 100);
};

Menubar.prototype.selectButton = function(btn) {
    // change select to btn
    /* var idx = 0;
    // indexOf collection
    for (; idx < this.btns.length; idx++) {
        if (btn === this.btns[idx]) {
            break;
        }
    }
    if (idx === this.btns.length) idx = -1; */
    // if (this.btns.find((obj) => { return obj === btn; })) {
    this.select.tabIndex = '-1';
    btn.tabIndex = '0';
    this.select = btn;
    /* } else {
        console.log('错误: ' + btn.id + ' 不是menubar成员');
    } */
};

Menubar.prototype.hoverMenu = function(btn) {
    if (this.active) {
        // if (this.menubar.getAttribute('data-open') === 'true') {
        btn.focus();
        // }
    }
};

Menubar.prototype.onHoverList = function(list) {
    let li = list.querySelector('a[data-select="true"]');
    if (li) {
        li.setAttribute('data-select', 'false');
    }
};

Menubar.prototype.blurMenu = function(btn) {
    /*+------------------------------------------------------------------
      情况分析：
        1. 非menubar所有成员区域获得了foucs，应该关闭dropdown，清空current
        2. 依然在meubar区域，但不是是current所指的dropdown，切换dropdwon，
           但这种情况已经再clickMenu中处理过了，无需动作
        3. 还在current所在dropdown, 这是有clickMenu主动释放的，已经由它处理
           过了， 不需要动作
        x. 想多了，其实很简单，blur后，简单hidden自己的menu-list就行了
      Update:
        blur后，如果立即hidden dropdown的话，将导致无法选中其中的选项，所以需要延迟，
        可以在两个地方设定这个延迟：
        1. blur事件中（如下），这个延时就是确保选项被选中。如果本blur后，本menubar
           又获得了focus，则清空这个timer，这样也可以保证响应速度
        2. 在CSS中设定，transition: visibility 100ms。
      +------------------------------------------------------------------*/
    // menu[this.id].style.visibility = 'hidden';
    // 这将导致blur事件的响应晚于foucus事件，所以应该在focus事件中判断timer
    // 这对于.button来说无所谓，但会导致menubar data-* 被重置，所以menubar
    // timer应该可以被focus清除。
    setTimeout(() => {
        btn.setAttribute('data-focused', 'false');
    }, 100);

    let self = this;
    this.timer = setTimeout(() => {
        self.timer = null;
        self.menubar.setAttribute('data-open', 'false');
        self.active = false;
    }, 100);
};

Menubar.prototype.onKeyDown = function(btn, e) {
    if (e.defaultPrevented) return;
    if (e.altKey) {
        btn.blur();
        return;
    }

    var idx, next;
    switch (e.key) {
        case 'Enter':
        case 'Space':
            break;

        case 'Left':
        case 'ArrowLeft':
            idx = this.btns.indexOf(btn);
            next = idx === 0 ? this.btns.length - 1 : idx - 1;
            this.btns[next].focus();
            break;

        case 'Right':
        case 'ArrowRight':
            idx = this.btns.indexOf(btn);
            next = idx === this.btns.length - 1 ? 0 : idx + 1;
            this.btns[next].focus();
            break;

        case 'Up':
        case 'ArrowUp':
            break;

        case 'Down':
        case 'ArrowDown':
            if (this.menubar.getAttribute('data-open') === 'false') {
                this.menubar.setAttribute('data-open', 'true');
                btn.nextElementSibling.firstElementChild.setAttribute('data-select', 'true');
            }
            break;

        case 'Esc':
        case 'Escape':
            /* if (this.menubar.getAttribute('data-open') === 'true') {
                this.menubar.setAttribute('data-open', 'false');
            } */
            btn.blur();
            break;

        default:
            return;
    }

    e.preventDefault();
};

module.exports = Menubar;