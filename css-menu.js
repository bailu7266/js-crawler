var menu = {};
var menubar = null;

function initMenubar(menuId) {
    menubar = document.getElementById(menuId);
    let btns = menubar.querySelectorAll('.menu>.button');
    for (let i = 0; i < btns.length; i++) {
        btns[i].tabIndex = '-1'; // make it be able to be focused
        menu[btns[i].id] = meusList(btns[i]);

        // mi.addEventListener('click', clickMenu, false);
        btns[i].addEventListener('mousedown', onMousedown, false);
        btns[i].addEventListener('mouseover', hoverMenu, false);
        btns[i].addEventListener('blur', blurMenu, false);
        btns[i].addEventListener('focus', focusMenu);
        // mi.addEventListener('mouseout', leaveMenu, false);
    }
}

function meusList(mi) {
    let menuList = mi.parentElement.querySelector('.menu-list');
    if (!menuList)
        console.log('Something has been wrong when search for the menu-list(sibling)');

    return menuList;
}

function onMousedown(event) {
    event.preventDefault();
    if (this.getAttribute('data-focused') === 'true') {
        this.blur();
    } else {
        this.focus();
    }
}

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

function focusMenu() {
    // menu[this.id].style.visibility = 'visible';
    this.setAttribute('data-focused', 'true');
    menubar.setAttribute('data-open', 'open');
}

function hoverMenu() {
    if (menubar.getAttribute('data-open') === 'open') {
        this.focus();
    }
}

function blurMenu() {
    /*+------------------------------------------------------------------
      情况分析：
        1. 非menubar所有成员区域获得了foucs，应该关闭dropdown，清空current
        2. 依然在meubar区域，但不是是current所指的dropdown，切换dropdwon，
           但这种情况已经再clickMenu中处理过了，无需动作
        3. 还在current所在dropdown, 这是有clickMenu主动释放的，已经由它处理
           过了， 不需要动作
        x. 想多了，其实很简单，blur后，简单hidden自己的menu-list就行了   
      +------------------------------------------------------------------*/
    // menu[this.id].style.visibility = 'hidden';
    this.setAttribute('data-focused', 'false');
    menubar.setAttribute('data-open', 'close');
}

module.exports = initMenubar;