;(function(window){
  var document = window.document;
  // 默认配置
  var defOption = {
    el: 'body', // id, default body element
    mode: 'fade',  // fade、slide、carousel
    setting: {
      width: 500, // img width
      height: 300, // img height
      zIndex: 100, // base index
      auto: true, // boolean or seconds（number), default 5s
      dot: true, // boolean or { wrapStyle: {}, wrapClass: '' }, default true
      btn: true, // boolean or { wrapStyle: {}, wrapClass: '' }, default true
      text: false, // boolean or { wrapStyle: {}, wrapClass: '' }, default false
      progress: false, // boolean or { wrapStyle: {}, wrapClass: '' }, default false
      extent: 0.1, // carousel mode setting about scale and opacity
      range: 100 // carousel mode setting about translateX
    },
    data: [] // { img: '', text: '', href: '' }
  };
  // 工具函数
  var tools = {
    isDef: function (obj) {
      return obj !== undefined
    },
    isArray: function (obj) {
      return Array.isArray ? Array.isArray(obj) : Object.prototype.toString.call(obj) === '[object Array]';
    },
    isPlainObject: function (obj) {
      return Object.prototype.toString.call(obj) === '[object Object]';
    },
    isNumber: function (num) {
      return Object.prototype.toString.call(num) === '[object Number]';
    },
    isOdd: function (num) {
      return num % 2 !== 0;
    },
    createEl: function (tag) {
      return document.createElement(tag);
    },
    append: function (el, obj){
      if(this.isArray(obj)){
        for(var i = 0, len = obj.length; i < len; i++){
          el.appendChild(obj[i]);
        }
      } else {
        el.appendChild(obj);
      }
      return this;
    },
    attr: function (el, prop, val) {
      if(this.isDef(val)) {
        el.setAttribute(prop, val);
        return this;
      } else {
        if (this.isPlainObject(prop)) {
          for (var p in prop) {
            el.setAttribute(p, prop[p]);
          }
          return this;
        }
        return el.getAttribute(prop);
      }
    },
    addClass: function (el, obj) {
      if(this.isArray(obj)){
        el.classList.add.apply(el.classList, obj);
      } else {
        el.classList.add(obj);
      }
      return this;
    },
    removeClass: function (el, obj) {
      if(this.isArray(obj)){
        el.classList.remove.apply(el.classList, obj);
      } else {
        el.classList.remove(obj);
      }
      return this;
    },
    css: function(el, prop, value){
      if (this.isDef(value)) {
        el.style[prop] = value;
      } else {
        if(typeof arguments[1] == 'string') { 
          return window.getComputedStyle(el)[prop];
        } else {
          for(var key in prop) {
            el.style[key] = prop[key];
          }
        }
      }
      return this;
    },
    transition: function(el, css){
      this.css(el, {
        transition: css,
        webkitTransition: css,
        oTransition: css,
        mozTransition: css,
      });
      return this;
    },
    removeTransition: function(el){
      this.css(el, {
        transition: 'none',
        webkitTransition: 'none',
        oTransition: 'none',
        mozTransition: 'none',
      });
      return this;
    },
    delay: function (fn, msec) {
      var timer = window.setTimeout(function(){
        typeof fn === 'function' && fn();
        window.clearTimeout(timer);
        timer = null;
      }, msec);
      return timer;
    },
    throttle: function (func, wait, option) {
      var timeout, context, args;
      var previous = 0;
      if (!option) option = {};
      var later = function() {
        previous = option.leading === false ? 0 : new Date().getTime();
        timeout = null;
        func.apply(context, args);
        if (!timeout) context = args = null;
      };
      var throttled = function() {
        var now = new Date().getTime();
        if (!previous && option.leading === false) previous = now;
        var remaining = wait - (now - previous);
        context = this;
        args = arguments;
        if (remaining <= 0 || remaining > wait) {
          if (timeout) {
            clearTimeout(timeout);
            timeout = null;
          }
          previous = now;
          func.apply(context, args);
          if (!timeout) context = args = null;
        } else if (!timeout && option.trailing !== false) {
          timeout = setTimeout(later, remaining);
        }
      };
      throttled.cancel = function() {
        clearTimeout(timeout);
        previous = 0;
        timeout = null;
      };
      return throttled;
    }
  };

  function Slider (opt) {
    if(!(this instanceof Slider)) return new Slider(opt);
    this.el = document.querySelector(opt.el ? '#'+opt.el : defOption.el);
    this.mode = opt.mode || defOption.mode;
    this.setting = this.$genSetting(opt.setting);
    this.data = opt.data || defOption.data;
  }

  Slider.prototype = {
    $state: {
      wrapRef: null,
      bodyRef: null,
      prevRef: null,
      nextRef: null,
      dotRef: null,
      activeIdx: 0,
      itemList: [],
      dotList: [],
      autoTimer: {
        id: null,
        sec: 5
      }
    },

    $valid: function (data) {
      data = data || this.data;
      var len = data.length;
      if(len === 0){
        throw new Error('请配置轮播图数据！')
      }
      if(this.mode==='carousel' && !tools.isOdd(len)){
        throw new Error('“carousel”模式需配置奇数张轮播图！')
      }
    },

    $genSetting: function (setting) {
      if(!tools.isDef(setting)) return defOption.setting;
      for(var prop in defOption.setting){
        if(!tools.isDef(setting[prop])){
          setting[prop] = defOption.setting[prop];
        }
      }
      if(tools.isNumber(setting.auto)){
        this.$state.autoTimer.sec = setting.auto;
      }
      return setting;
    },

    $renderItem: function (ul, i, isActive, fakeIdx) {
      var li = tools.createEl('li');
      var a = tools.createEl('a');
      var img = tools.createEl('img');
      var item = this.data[i];
      var text, textWrap, isFake = tools.isDef(fakeIdx);
      tools.addClass(li, 'slider-item').attr(li,'data-idx',i);
      if(isFake){
        tools.attr(li,'data-idx',fakeIdx);
      }
      if(isActive) {
        tools.addClass(li, 'active');
      }
      if(this.mode === 'slide'){
        li.style.left = +tools.attr(li, 'data-idx') * this.setting.width + 'px';
      }
      tools.addClass(a, 'slider-link')
      .attr(a, 'href', item.href || '#')
      .attr(img, { alt:'img'+i+1, src: item.img })
      .append(a, img);
      var clsArr = ['slider-text'];
      var styleObj = {
        zIndex: this.setting.zIndex*10
      };
      if(item.text && this.setting.text){
        if(tools.isPlainObject(this.setting.text)){
          if(tools.isPlainObject(this.setting.text.wrapStyle)){
            for(var attr in this.setting.text.wrapStyle){
              styleObj[attr] = this.setting.text.wrapStyle[attr];
            }
          }
          this.setting.text.wrapClass && clsArr.push(this.setting.text.wrapClass);
        }
        textWrap = tools.createEl('div');
        text = document.createTextNode(item.text);
        tools.addClass(textWrap, clsArr)
        .append(textWrap, text)
        .append(a, textWrap)
        .css(textWrap, styleObj);
      }
      tools.append(li, a).append(ul, li);
      if(isFake){
        this.$state.itemList[fakeIdx] = li;
      } else {
        this.$state.itemList[i] = li;
      }
    },

    $renderWrap: function () {
      var wrap = tools.createEl('div');
      var styleObj = {
        width: this.setting.width + 'px',
        height: this.setting.height + 'px',
        zIndex: this.setting.zIndex
      };
      if(this.mode !== 'carousel'){
        styleObj.overflow = 'hidden';
      }
      tools.addClass(wrap, 'slider-wrap');
      tools.css(wrap, styleObj);
      return wrap;
    },

    $renderBody: function () {
      var ul = tools.createEl('ul');
      var len = this.data.length;
      tools.addClass(ul, ['slider-ul','slider-body','is-'+this.mode]);
      this.$state.activeIdx = 0;
      if(this.mode === 'slide'){
        this.$renderItem(ul, len-1, false, -1);
      }
      for(var i = 0; i < len; i++) {
        this.$renderItem(ul, i, i===0);
      }
      if(this.mode === 'slide'){
        this.$renderItem(ul, 0, false, len);
      }
      if(this.mode === 'carousel'){
        this.$switchCarouselImg(this.$state.activeIdx);
      }
      return ul;
    },

    $renderPrevBtn: function() {
      return this.$renderBtn('prev');
    },

    $renderNextBtn: function() {
      return this.$renderBtn('next');
    },

    $renderBtn: function(which) {
      var wrap = tools.createEl('div');
      var btn = tools.createEl('div');
      var icon = tools.createEl('i');
      var wrapClsMap = {
        prev: 'slider-prev',
        next: 'slider-next'
      };
      var btnClsMap = {
        prev: 'slider-btn-left',
        next: 'slider-btn-right'
      };
      var iconMap = {
        prev: 'icon-ali-xiangzuojiantou',
        next: 'icon-ali-xiangyoujiantou'
      };
      var clsArr = ['slider-btn-wrap',wrapClsMap[which]];
      var styleObj = {
        zIndex: this.setting.zIndex*10
      };
      if(tools.isPlainObject(this.setting.btn)){
        if(tools.isPlainObject(this.setting.btn.wrapStyle)){
          for(var attr in this.setting.btn.wrapStyle){
            styleObj[attr] = this.setting.btn.wrapStyle[attr];
          }
        }
        this.setting.btn.wrapClass && clsArr.push(this.setting.btn.wrapClass);
      }
      tools.addClass(wrap, clsArr)
      .addClass(btn, ['slider-btn',btnClsMap[which]])
      .addClass(icon, ['iconfont',iconMap[which]])
      .append(btn, icon)
      .append(wrap, btn)
      .css(wrap, styleObj);
      return wrap;
    },

    $renderDots: function () {
      var ul = tools.createEl('ul');
      var li;
      var len = this.data.length;
      var clsArr = ['slider-ul','slider-dots'];
      var styleObj = {
        zIndex: this.setting.zIndex*10
      };
      if(tools.isPlainObject(this.setting.dot)){
        if(tools.isPlainObject(this.setting.dot.wrapStyle)){
          for(var attr in this.setting.dot.wrapStyle){
            styleObj[attr] = this.setting.dot.wrapStyle[attr];
          }
        }
        this.setting.dot.wrapClass && clsArr.push(this.setting.dot.wrapClass);
      }
      tools.addClass(ul, clsArr)
      .css(ul, styleObj);
      for(var i = 0; i < len; i++){
        li = tools.createEl('li');
        tools.addClass(li,'slider-dot')
        .attr(li,'data-idx',i);
        if(i === 0){
          tools.addClass(li,'active')
          .addClass(ul, ['slider-ul','slider-dots']);
        }
        tools.append(ul, li);
        this.$state.dotList.push(li);
      }
      return ul;
    },

    $render: function () {
      this.$valid();
      var fragment = document.createDocumentFragment();
      this.$state.wrapRef = this.$renderWrap();
      this.$state.bodyRef = this.$renderBody();
      var domArr = [this.$state.bodyRef];
      if(this.setting.btn){
        this.$state.prevRef = this.$renderPrevBtn();
        this.$state.nextRef = this.$renderNextBtn();
        domArr = [
          this.$state.bodyRef, 
          this.$state.prevRef, 
          this.$state.nextRef
        ];
      }
      if(this.setting.dot){
        this.$state.dotRef = this.$renderDots();
        domArr = [
          this.$state.bodyRef,
          this.$state.prevRef,
          this.$state.nextRef,
          this.$state.dotRef
        ];
      }
      tools.append(this.$state.wrapRef, domArr)
      .append(fragment, this.$state.wrapRef)
      .append(this.el, fragment);
      this.$bindEvent();
      this.$refreshAutoRun();
    },

    $clear: function () {
      return this.$state.wrapRef && this.$remove(this.$state.wrapRef);
    },

    $remove: function (child) {
      return this.el.removeChilden(child);
    },

    $switchCarousel: function (prevIdx, activeIdx) {
      this.$switchImg(prevIdx, activeIdx);
      this.$switchDot(prevIdx, activeIdx);
    },

    $switchDot: function (prevIdx, activeIdx) {
      if(!this.setting.dot) return;
      tools.removeClass(this.$state.dotList[prevIdx],'active')
      .addClass(this.$state.dotList[activeIdx],'active');
    },

    $switchImg: function (prevIdx, activeIdx) {
      switch(this.mode){
        case 'fade':
          tools.removeClass(this.$state.itemList[prevIdx],'active')
          .addClass(this.$state.itemList[activeIdx],'active');
          break;
        case 'slide':
          this.$switchSlideImg(prevIdx, activeIdx);
          break;
        case 'carousel':
          this.$switchCarouselImg(activeIdx);
          break;
        default:
          break;
      }
    },

    $switchCarouselImg: function (activeIdx) {
      var deta,leftIdx,rightIdx;
      var len = this.data.length;
      var _this = this;
      var times = ~~(len/2);
      var detaX = this.setting.range;
      var detaEx = this.setting.extent;
      var activeStyleObj = {
        translateX: 0,
        scale: 1,
        opacity: 1,
        zIndex: this.setting.zIndex + times
      };
      var walk = function (idx,obj) {
        var styleObj = {
          transform: 'translateX('+obj.translateX+'px) scale('+obj.scale+','+obj.scale+')',
          opacity: obj.opacity,
          filter: 'opacity('+(obj.opacity*100)+'%)',
          zIndex: obj.zIndex
        };
        // console.log(styleObj);
        tools.css(_this.$state.itemList[idx], styleObj);
      };
      var getIdx = function (activeIdx, pos, deta) {
        var num;
        if(pos === 'left') {
          num = activeIdx - deta;
          return num >= 0 ? num : (len + num);
        } else if (pos === 'right') {
          return (activeIdx + deta) % len;
        }
      };
      var handleDeta = function (num) {
        return num > 0 ? num : 0;
      };
      // 设置中间轮播图
      walk(activeIdx,activeStyleObj);
      // 设置周围轮播图
      var scale,opacity,zIndex;
      for(var i = 0;i < times;i++){
        deta = i + 1;
        leftIdx = getIdx(activeIdx, 'left', deta);
        rightIdx = getIdx(activeIdx, 'right', deta);
        scale = handleDeta(activeStyleObj.scale - detaEx*deta);
        opacity = handleDeta(activeStyleObj.opacity - detaEx*deta);
        zIndex = activeStyleObj.zIndex - deta;
        // 左侧
        walk(leftIdx, {
          translateX: activeStyleObj.translateX-detaX*deta,
          scale: scale,
          opacity: opacity,
          zIndex: zIndex
        })
        // 右侧
        walk(rightIdx, {
          translateX: activeStyleObj.translateX+detaX*deta,
          scale: scale,
          opacity: opacity,
          zIndex: zIndex
        })
      }
    },
    
    $switchSlideImg: function (prevIdx, activeIdx) {
      var item;
      var w = this.setting.width;
      var len = this.data.length;
      var first = this.$state.itemList[-1];
      var last = this.$state.itemList[len];
      var prev = this.$state.itemList[prevIdx];
      var active = this.$state.itemList[activeIdx];
      for(var i = -1;i <= len;i++){
        item = this.$state.itemList[i];
        tools.transition(item, 'left 0.4s ease');
      }
      if (prevIdx === len-1 && activeIdx === 0) {
        tools.removeClass(prev,'active')
        .css(prev,{left:-w + 'px'})
        .addClass(last,'active')
        .css(last,{left:'0px'})
        .delay(function(){
          for(var i = -1;i <= len;i++){
            item = this.$state.itemList[i];
            tools.removeTransition(item)
            .css(item,{
              left: w * i + 'px'
            });
          }
          tools.removeClass(last,'active')
          .addClass(this.$state.itemList[0],'active');
        }.bind(this), 500);
      } else if (prevIdx === 0 && activeIdx === len-1) {
        tools.removeClass(prev,'active')
        .css(prev,{left:w + 'px'})
        .addClass(first,'active')
        .css(first,{left:'0px'})
        .delay(function(){
          for(var i = -1;i <= len;i++){
            item = this.$state.itemList[i];
            tools.removeTransition(item)
            .css(item,{
              left: w * (i+1-len) + 'px'
            });
          }
          tools.removeClass(first,'active')
          .addClass(this.$state.itemList[len-1],'active');
        }.bind(this), 500);
      } else if (prevIdx > activeIdx) {
        for(var i = -1;i <= len;i++){
          item = this.$state.itemList[i];
          tools.css(item,{
            left: item.offsetLeft + w + 'px'
          });
        }
        tools.removeClass(prev,'active')
        .addClass(active,'active');
      } else if (prevIdx < activeIdx) {
        for(var i = -1;i <= len;i++){
          item = this.$state.itemList[i];
          tools.css(item,{
            left: item.offsetLeft - w + 'px'
          });
        }
        tools.removeClass(prev,'active')
        .addClass(active,'active');
      }
    },
    
    $changeActiveIdx: function (type) {
      var len = this.data.length;
      if(type === 'next') {
        if(this.$state.activeIdx === len - 1) {
          this.$state.activeIdx = 0;
        } else {
          this.$state.activeIdx++;
        }
      } else {
        if(this.$state.activeIdx === 0) {
          this.$state.activeIdx = len - 1;
        } else {
          this.$state.activeIdx--;
        }
      }
    },
    
    $bindBtnEvt: function(type){
      if(!this.setting.btn) return;
      var prevIdx;
      var btnRef = tools.isDef(type) && type === 'next' ? this.$state.nextRef : this.$state.prevRef;
      btnRef.addEventListener('click', tools.throttle(function (event) {
        // console.log(type);
        prevIdx = this.$state.activeIdx;
        this.$changeActiveIdx(type);
        this.$switchCarousel(prevIdx,this.$state.activeIdx);
        this.$refreshAutoRun();
      }.bind(this), 500));
    },

    $bindDotEvt: function(){
      if(!this.setting.dot) return;
      var prevIdx;
      this.$state.dotRef.addEventListener('click', tools.throttle(function (event) {
        var curIdx = event.target ? +tools.attr(event.target,'data-idx') : 0;
        prevIdx = this.$state.activeIdx;
        if(curIdx === prevIdx) return;
        this.$state.activeIdx = curIdx;
        this.$switchCarousel(prevIdx,this.$state.activeIdx);
        this.$refreshAutoRun();
      }.bind(this),500));
    },

    $bindMouseEvt: function () {
      if(!this.setting.auto) return;
      this.$state.wrapRef.addEventListener('mouseover', this.$stopAutoRun.bind(this));
      this.$state.wrapRef.addEventListener('mouseout', this.$refreshAutoRun.bind(this));
    },

    $bindEvent: function () {
      this.$bindBtnEvt('prev');
      this.$bindBtnEvt('next');
      this.$bindDotEvt();
      this.$bindMouseEvt();
    },

    $refreshAutoRun: function () {
      this.$stopAutoRun();
      this.$autoRun();
    },

    $autoRun: function () {
      var prevIdx;
      if(!this.setting.auto) return;
      this.$state.autoTimer.id = window.setInterval(function () {
        prevIdx = this.$state.activeIdx;
        this.$changeActiveIdx('next');
        this.$switchCarousel(prevIdx, this.$state.activeIdx);
      }.bind(this), this.$state.autoTimer.sec * 1000);
    },

    $stopAutoRun: function () {
      if(!this.setting.auto) return;
      this.$state.autoTimer.id && window.clearInterval(this.$state.autoTimer.id);
      this.$state.autoTimer.id = null;
    },
    /* 提供使用的 API */
    // 设置轮播效果
    setMode: function(mode){
      this.mode = mode;
      return this;
    },
    // 设置配置项
    setOption: function (option) {
      this.setting = this.$genSetting(option);
      return this;
    },
    // 设置数据
    setData: function (data) {
      this.$valid(data);
      this.data = data;
      return this;
    },
    // 添加图
    addItem: function (obj) {
      var data = this.data.concat([obj]);
      this.$valid(data);
      this.data = data;
      return this;
    },
    // 移除图
    removeItem: function (index) {
      var data = this.data.slice(0,index).concat(this.data.slice(index+1));
      this.$valid(data);
      this.data = data;
      return this;
    },
    // 渲染
    render: function () {
      this.$clear();
      this.$render();
    },
    // 清空容器
    clear: function () {
      return this.$clear();
    },
    // 开启自动轮播
    start: function () {
      this.$refreshAutoRun();
    },
    // 暂停自动轮播
    pause: function () {
      this.$stopAutoRun();
    },
    // 设置最初展示的图片
    active: function (index) {
      this.$state.activeIdx = index;
      return this;
    }
  };

  window.Slider = Slider;

})(window);