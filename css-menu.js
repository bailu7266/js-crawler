var menu = {};
var current = null;
var open = false;
var focused = false;

function addCSSMenu(mi, tabIndex = -1) {
    mi.tabIndex = tabIndex.toString(); // make it be able to be focused
    menu[mi.id] = meusList(mi);

    mi.addEventListener('click', clickMenu, false);
    mi.addEventListener('mouseover', hoverMenu, false);
    mi.addEventListener('blur', blurMenu, false);
    mi.addEventListener('focus', focusMenu);
    // mi.addEventListener('mouseout', leaveMenu, false);
}

function meusList(mi) {
    let menuList = mi.parentElement.querySelector('.menu-list');
    if (!menuList)
        console.log('Something has been wrong when search for the menu-list(sibling)');

    return menuList;
}

/*
    两种情况
*/

function clickMenu() {
    console.log('click on menu ' + this.id);
    // if (this === document.activeElement) { //因为focus事件在前，变成了废话
    if (focused) {
        this.blur();
    } else {
        focused = true;
    }
}

function xclickMenu() {
    console.log('click on menu ', this.id);
    if (current) {
        // menu[current].style.visibility = 'hidden';
        if (this.id === current) {
            current = null;
            this.blur(); // toggle focus status
        }
        /*else {
            current = this.id;
            menu[current].style.visibility = 'visible';
        } 
    } else {
        current = this.id;
        menu[current].style.visibility = 'visible';*/
        // this.focus(); //get focus automatically
    }
}

function leaveMenu() {
    // this.blur();
    console.log('Mouse out of ' + this.id);
}

/*
    有两种情况进入focus
    1. click：此时将同时触发focus（前）和click（后）事件，
    2. hover：只是同hover事件主动触发的，所有focus在后，且不会有click事件。
       此事件说明focus发生了迁移，将有系统给前focus单元发送blur事件，当前单元接收
       到focus事件
*/

function focusMenu() {
    console.log('Menu ' + this.id + ' got focused, while open is ' + open);
    // open = !open;
    // menu[this.id].style.visibility = open ? 'visible' : 'hidden';
    menu[this.id].style.visibility = 'visible';

    /*
    if (this.id === current) {
        current = null;
        this.blur();
    } else {
        current = this.id;
        menu[this.id].style.visibility = 'visible';
    } */
}

function hoverMenu() {
    if (focused && (this !== document.activeElement)) {
        this.focus();
    }
    /* if (current) {
        if (this.id !== current) {
            menu[current].style.visibility = 'hidden';
            this.focus();
            current = this.id;
            menu[current].style.visibility = 'visible';
        }
    }*/
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
    console.log('Menu ' + this.id + ' lost focus, While current is ' + current);

    menu[this.id].style.visibility = 'hidden';
    open = false;
    focused = false; // 发送focus迁移时，因为有blur事件，导致focused被置false。看来blur前的状态必须要判断。

    /* if (current) {
        if (this.id !== current) {
            let idx = Object.keys(menu).indexOf(this.id);
            if (idx < 0) { // should be -1
                menu[current].style.visibility = 'hidden';
                current = null;
            }
        }
    } */
}

module.exports = addCSSMenu;