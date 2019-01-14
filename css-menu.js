function KeyCodes() {
    this.enter = 13;
    this.space = 32;
    this.left = 37;
    this.right = 38;
    this.up = 39;
    this.down = 40;
}

function Menubar(menuId) {
    let self = this;
    // self.id = menuId;
    self.timer = null;
    // 定义方向键、控制键
    self.keys = new KeyCodes();
    self.menubar = document.getElementById(menuId);
    /* self.menubar.onmousedown = function(e) {
        e.preventDefault();
        console.log('on-mousedown ' + this.id);
    }; */
    // self.menubar.tabIndex = '0'; // Make menubar keyborad-navigable
    self.btns = self.menubar.querySelectorAll('.menu>.button');
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
    self.btns[0].tabIndex = '0';
    // active表述menubar当前获得focus的button，如果整个menubar都没有获得focus，则为null
    self.active = null;
}
/*
function meusList(mi) {
    let menuList = mi.parentElement.querySelector('.menu-list');
    if (!menuList)
        console.log('Something has been wrong when search for the menu-list(sibling)');

    return menuList;
}
*/

Menubar.prototype.onMouseDown = function(btn, e) {
    e.preventDefault();
    // e.stopPropagation();
    if (btn.getAttribute('data-focused') === 'false') {
        //if (btn.getAttribute('data-focused') === 'true') {
        //    btn.blur();
        //} else {
        btn.focus();
    }
    if (this.menubar.getAttribute('data-open') === 'open') {
        this.menubar.setAttribute('data-open', 'close');
    } else {
        this.menubar.setAttribute('data-open', 'open');
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
    // this.menubar.setAttribute('data-open', 'open');
    this.active = btn;
    // }, 100);
};

Menubar.prototype.hoverMenu = function(btn) {
    if (this.active) {
        // if (this.menubar.getAttribute('data-open') === 'open') {
        btn.focus();
        // }
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
        self.menubar.setAttribute('data-open', 'close');
        self.active = null;
    }, 100);
};

Menubar.prototype.onKeyDown = (btn, e) => {
    if (e.altKey) {
        // blur，
        // btn.blur();
    }

    switch (e.KeyCode) {
    case this.enter:
    case this.space:
    }
};

module.exports = Menubar;
