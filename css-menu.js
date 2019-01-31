function KeyCodes() {
    this.enter = 13;
    this.space = 32;
    this.left = 37;
    this.right = 39;
    this.up = 38;
    this.down = 40;
}

function buildMenu(menubar, mItems) {
    for (let i = 0; i < mItems.length; i++) {
        let menu = buildMenuItem(mItems[i]);
        menubar.appendChild(menu);
    }
}

function buildMenuItem(mItem) {
    let menu = document.createElement('div');
    menu.classList.add('menu');
    let mi = document.createElement('div');
    mi.classList.add('button');
    mi.id = mItem.id;
    mi.dataFocused = 'false';
    mi.insertAdjacentHTML('afterbegin', '<span>' + mItem.label + '</span>');
    menu.appendChild(mi);

    let content = buildMenuContent(mItem.content);
    menu.appendChild(content);

    return menu;
}

function buildMenuContent(content) {
    let ce = document.createElement('div');
    ce.classList.add('menu-list');
    for (let i = 0; i < content.length; i++) {
        var mi, html;
        let cmi = content[i];
        let type = cmi.type ? cmi.type : 'default';
        switch (type.toUpperCase()) {
            case 'SEPARATOR':
                mi = document.createElement('hr');
                break;
            case 'CHECKBOX':
                mi = document.createElement('label');
                mi.htmlFor = cmi.id;
                mi.insertAdjacentHTML('afterbegin', '<input id=' + cmi.id + ' type="checkbox" checked=false>' +
                    '<img class="checkmark" src="./images/checkmark-solid.png" />' + cmi.label);
                if (cmi.click) mi.querySelector('input[type=checkbox]').addEventListener('click', cmi.click);
                break;

            case 'SUBMENU':
                mi = document.createElement('div');
                mi.classList.add('submenu'); {
                    let btn = document.createElement('div');
                    btn.classList.add('itembtn');
                    btn.insertAdjacentHTML('afterbegin', '<span>' + cmi.label + '</span>');
                    mi.appendChild(btn);
                    mi.appendChild(buildMenuContent(cmi.content));
                }
                break;

            default:
                mi = document.createElement('a');
                mi.id = cmi.id;
                // mi.href = '#';
                html = '<span>' + cmi.label + '</span>';
                if (cmi.shortcut)
                    html += '<span>' + cmi.shortcut + '</span>';
                mi.insertAdjacentHTML('afterbegin', html);
                if (cmi.click) mi.addEventListener('click', cmi.click);
                break;
        }
        ce.appendChild(mi);
    }

    return ce;
}

function Menubar(menuId, menuItems) {
    let self = this;
    self.id = '#' + menuId;
    self.timer = null;
    // 定义方向键、控制键
    // self.keys = new KeyCodes();
    self.menubar = document.getElementById(menuId);
    buildMenu(self.menubar, menuItems);
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
    window.addEventListener('keydown', function(e) {
        return self.onAltKey(e);
    });

    // for mouse over menu-list box
    let mlist = self.menubar.querySelectorAll('.menu-list');
    for (let li = 0; li < mlist.length; li++) {
        mlist[li].addEventListener('mouseover', function(e) {
            return self.onHoverList(this, e);
        });
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
    collapseMenu(list);
    /* let li = list.querySelector('*[data-select="true"]');
    if (li) {
        li.setAttribute('data-select', 'false');
    } */
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
    // 
    let self = this;
    // fade表示正在失去focus的button，为了解决定时器导致的典型的local变量失效
    self.fade = btn;
    setTimeout(() => {
        btn.setAttribute('data-focused', 'false');
        // 这个地方有一个典型问题，由于btn是由event处理函数的参数this，它的
        // 生存期保证超过定时器的长度，所有导致定时触发时，this已经被释放了，
        // 换成其他local变量也会出同样的问题。
        // 一个可行的方法：弃用this/或者local object，改用实例变量
        closeMenu(self.fade.parentElement);
        self.fade = null;
    }, 100);

    this.timer = setTimeout(() => {
        self.timer = null;
        self.menubar.setAttribute('data-open', 'false');
        self.active = false;
    }, 100);
};

function closeMenu(menu) {
    let mlist = menu.querySelector('.menu-list');
    let select = mlist.querySelector('*[data-select="true"]');

    if (select) {
        select.setAttribute('data-select', 'false');
        // 依据唯一性原装，将只有一个<a><div>被选中
        if (select.classList.contains('submenu')) {
            // 采用递归调用，因为menu结构是一样
            closeMenu(select);
        }
    }
    menu.setAttribute('data-open', 'false');
}

// 同closeMenu从根开始close不同，collapseMenu是中最低级的叶子开始折叠的
// 另外一个不同是：collapseMenu参数是menu-list, 而closeMenu是menu/submenu
function collapseMenu(mlist) {
    let menu = mlist.parentElement;
    menu.setAttribute('data-open', 'false');
    let select = mlist.querySelector('*[data-select="true"]');

    // 依据唯一性原装，将只有一个<a><div><label>被选中
    if (select) {
        select.setAttribute('data-select', 'false');
    }

    // 检查是否顶级menu
    if (menu.classList.contains('submenu')) {
        // 采用递归调用，因为menu结构是一样
        closeMenu(menu.parentElement);
    }
}

Menubar.prototype.onKeyDown = function(btn, e) {
    if (e.defaultPrevented) return;
    if (e.altKey) {
        btn.blur();
        return;
    }

    var next;
    var submenu;
    let idx = this.btns.indexOf(btn);
    let mlist = btn.nextElementSibling;

    // 递归找到当前操作的submenu的menu-list
    for (;;) {
        let selSub = mlist.querySelector('.submenu[data-open="true"]');
        if (!selSub) break;
        mlist = selSub.querySelector('.menu-list');
        submenu = selSub;
    }

    let select = mlist.querySelector('*[data-select="true"]');

    switch (e.key) {
        case 'Enter':
        case 'Space':
        case ' ':
            if (!select) { break; }
            if (select.classList.contains('submenu')) {
                // open submenu and select the first item
                mlist = select.querySelector('.menu-list');
                select.setAttribute('data-open', 'true');
                if (mlist) selectFirst(mlist);
            } else {
                // deactivate menubar
                btn.blur();
                this.active = null;
                // check if it is a checkbox menuitem
                let ck = select.querySelector('input[type="checkbox"]');
                if (ck) ck.click(); // checkbox menu item
                else select.click(); // Normal link
            }
            break;

        case 'Left':
        case 'ArrowLeft':
            // 判断是否处在submenu中
            if (submenu) {
                let cl = mlist.querySelector('*[data-select="true"]');
                if (cl) cl.setAttribute('data-select', 'false');
                submenu.setAttribute('data-open', 'false');
                break;
            }

            // 不在子submenu中
            next = idx === 0 ? this.btns.length - 1 : idx - 1;
            selectFirst(this.btns[next].parentElement.querySelector('.menu-list'));
            this.btns[next].focus();
            break;

        case 'Right':
        case 'ArrowRight':
            // 判断是否处在可以展开的submenu上
            submenu = mlist.querySelector('.submenu[data-select="true"]');
            if (submenu) {
                let cl = submenu.querySelector('.menu-list').querySelector('*:not(hr)');
                if (cl) {
                    cl.setAttribute('data-select', 'true');
                    submenu.setAttribute('data-open', 'true');
                    break;
                }
            }

            // 如果没有可展开的submenu
            next = idx === this.btns.length - 1 ? 0 : idx + 1;
            selectFirst(this.btns[next].parentElement.querySelector('.menu-list'));
            this.btns[next].focus();
            break;

        case 'Up':
        case 'ArrowUp':
            if (this.menubar.getAttribute('data-open') === 'true') {
                let cl = mlist.querySelector('*[data-select="true"]:not(hr)');
                if (!cl) {
                    selectFirst(mlist);
                    break;
                }
                cl.setAttribute('data-select', 'false');
                // 跳过分割线<hr>
                while (
                    cl.previousElementSibling &&
                    cl.previousElementSibling.tagName === 'HR'
                ) {
                    cl = cl.previousElementSibling;
                }
                if (cl.previousElementSibling) {
                    cl.previousElementSibling.setAttribute(
                        'data-select',
                        'true'
                    );
                } else {
                    let last = mlist.lastElementChild;
                    while (last && last.tagName === 'HR') last = last.previousElementSibling;
                    if (last) last.setAttribute('data-select', 'true');
                }
            }
            break;

        case 'Down':
        case 'ArrowDown':
            if (this.menubar.getAttribute('data-open') === 'false') {
                this.menubar.setAttribute('data-open', 'true');
                selectFirst(mlist);
            } else {
                let cl = mlist.querySelector('*[data-select="true"]');
                if (!cl) {
                    selectFirst(mlist);
                    break;
                }
                cl.setAttribute('data-select', 'false');
                // 跳过分割线<hr>
                while (
                    cl.nextElementSibling &&
                    cl.nextElementSibling.tagName === 'HR'
                ) {
                    cl = cl.nextElementSibling;
                }
                if (cl.nextElementSibling) {
                    cl.nextElementSibling.setAttribute('data-select', 'true');
                } else {
                    selectFirst(mlist);
                }
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

function selectFirst(mlist) {
    let first = mlist.firstElementChild;
    while (first && first.tagName === 'HR') first = first.firstElementChild;
    if (first)
        first.setAttribute('data-select', 'true');
}

module.exports = Menubar;