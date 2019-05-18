;(function(window, document, undefined) {
  // requestAnimationFrame, cancelAnimationFrame
  ;(function() {
    var lastTime = 0
    var vendors = ['ms', 'moz', 'webkit', 'o']
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
      window.requestAnimationFrame =
        window[vendors[x] + 'RequestAnimationFrame']
      window.cancelAnimationFrame =
        window[vendors[x] + 'CancelAnimationFrame'] ||
        window[vendors[x] + 'CancelRequestAnimationFrame']
    }

    if (!window.requestAnimationFrame)
      window.requestAnimationFrame = function(callback, element) {
        var currTime = new Date().getTime()
        var timeToCall = Math.max(0, 16 - (currTime - lastTime))
        var id = window.setTimeout(function() {
          callback(currTime + timeToCall)
        }, timeToCall)
        lastTime = currTime + timeToCall
        return id
      }

    if (!window.cancelAnimationFrame)
      window.cancelAnimationFrame = function(id) {
        clearTimeout(id)
      }
  })()
  // 默认配置
  var defOption = {
    el: 'body', // id, default body element
    mode: 'fade', // fade、slide、carousel
    setting: {
      width: 500, // img width
      height: 300, // img height
      zIndex: 100, // base index
      auto: true, // boolean or seconds（number), default 5s
      dot: true, // boolean or { wrapStyle: {}, wrapClass: '' }, default true
      btn: true, // boolean or { wrapStyle: {}, wrapClass: '' }, default true
      text: false, // boolean or { wrapStyle: {}, wrapClass: '' }, default false
      progress: true, // boolean or { wrapStyle: {}, wrapClass: '' }, default false
      extent: 0.1, // carousel mode setting about scale and opacity
      range: 100 // carousel mode setting about translateX
    },
    data: [] // { img: '', text: '', href: '' }
  }
  // 工具函数
  var tools = {
    isDef: function(obj) {
      return obj !== undefined
    },
    isArray: function(obj) {
      return Array.isArray
        ? Array.isArray(obj)
        : Object.prototype.toString.call(obj) === '[object Array]'
    },
    isPlainObject: function(obj) {
      return Object.prototype.toString.call(obj) === '[object Object]'
    },
    isNumber: function(num) {
      return Object.prototype.toString.call(num) === '[object Number]'
    },
    isOdd: function(num) {
      return num % 2 !== 0
    },
    createEl: function(tag) {
      return document.createElement(tag)
    },
    append: function(el, obj) {
      if (this.isArray(obj)) {
        for (var i = 0, len = obj.length; i < len; i++) {
          el.appendChild(obj[i])
        }
      } else {
        el.appendChild(obj)
      }
      return this
    },
    attr: function(el, prop, val) {
      if (this.isDef(val)) {
        el.setAttribute(prop, val)
        return this
      } else {
        if (this.isPlainObject(prop)) {
          for (var p in prop) {
            el.setAttribute(p, prop[p])
          }
          return this
        }
        return el.getAttribute(prop)
      }
    },
    addClass: function(el, obj) {
      if (this.isArray(obj)) {
        el.classList.add.apply(el.classList, obj)
      } else {
        el.classList.add(obj)
      }
      return this
    },
    removeClass: function(el, obj) {
      if (this.isArray(obj)) {
        el.classList.remove.apply(el.classList, obj)
      } else {
        el.classList.remove(obj)
      }
      return this
    },
    width: function(el) {
      return el.clientWidth
    },
    height: function(el) {
      return el.clientHeight
    },
    css: function(el, prop, value) {
      if (this.isDef(value)) {
        el.style[prop] = value
      } else {
        if (typeof arguments[1] == 'string') {
          return window.getComputedStyle(el)[prop]
        } else {
          for (var key in prop) {
            el.style[key] = prop[key]
          }
        }
      }
      return this
    },
    transition: function(el, css) {
      this.css(el, {
        transition: css,
        webkitTransition: css,
        oTransition: css,
        mozTransition: css
      })
      return this
    },
    removeTransition: function(el) {
      this.css(el, {
        transition: 'none',
        webkitTransition: 'none',
        oTransition: 'none',
        mozTransition: 'none'
      })
      return this
    },
    delay: function(fn, msec) {
      var timer = window.setTimeout(function() {
        typeof fn === 'function' && fn()
        window.clearTimeout(timer)
        timer = null
      }, msec)
      return timer
    },
    throttle: function(func, wait, option) {
      var timeout, context, args
      var previous = 0
      if (!option) option = {}
      var later = function() {
        previous = option.leading === false ? 0 : new Date().getTime()
        timeout = null
        func.apply(context, args)
        if (!timeout) context = args = null
      }
      var throttled = function() {
        var now = new Date().getTime()
        if (!previous && option.leading === false) previous = now
        var remaining = wait - (now - previous)
        context = this
        args = arguments
        if (remaining <= 0 || remaining > wait) {
          if (timeout) {
            clearTimeout(timeout)
            timeout = null
          }
          previous = now
          func.apply(context, args)
          if (!timeout) context = args = null
        } else if (!timeout && option.trailing !== false) {
          timeout = setTimeout(later, remaining)
        }
      }
      throttled.cancel = function() {
        clearTimeout(timeout)
        previous = 0
        timeout = null
      }
      return throttled
    }
  }

  function Slider(opt) {
    if (!(this instanceof Slider)) return new Slider(opt)
    this.el = document.querySelector(opt.el ? '#' + opt.el : defOption.el)
    this.mode = opt.mode || defOption.mode
    this.setting = this.$genSetting(opt.setting)
    this.data = opt.data || defOption.data
    this.$initState()
    this.$createApi()
  }

  Slider.prototype = {
    $initState: function() {
      this.$state = {
        wrapRef: null,
        bodyRef: null,
        prevRef: null,
        nextRef: null,
        dotRef: null,
        progressRef: null,
        activeIdx: 0,
        itemList: [],
        dotList: [],
        autoTimer: {
          id: null,
          rid: null,
          isfire: false,
          sec: 5
        }
      }
    },

    $createApi: function() {
      // 设置轮播效果
      this.setMode = function(mode) {
        console.log(this)
        this.mode = mode
        return this
      }
      // 设置配置项
      this.setOption = function(option) {
        this.setting = this.$genSetting(option)
        return this
      }
      // 设置数据
      this.setData = function(data) {
        this.$valid(data)
        this.data = data
        return this
      }
      // 添加图
      this.addItem = function(obj) {
        var data = this.data.concat([obj])
        this.$valid(data)
        this.data = data
        return this
      }
      // 移除图
      this.removeItem = function(index) {
        var data = this.data.slice(0, index).concat(this.data.slice(index + 1))
        this.$valid(data)
        this.data = data
        return this
      }
      // 渲染
      this.render = function() {
        this.$clear()
        this.$render()
      }
      // 清空容器
      this.clear = function() {
        return this.$clear()
      }
      // 开启自动轮播
      this.start = function() {
        this.$refreshAutoRun()
      }
      // 暂停自动轮播
      this.pause = function() {
        this.$stopAutoRun()
      }
      // 设置最初展示的图片
      this.active = function(index) {
        this.$state.activeIdx = index
        return this
      }
    },

    $valid: function(data) {
      data = data || this.data
      var len = data.length
      if (len === 0) {
        throw new Error('请配置轮播图数据！')
      }
      if (this.mode === 'carousel' && !tools.isOdd(len)) {
        throw new Error('“carousel”模式需配置奇数张轮播图！')
      }
    },

    $genSetting: function(setting) {
      if (!tools.isDef(setting)) return defOption.setting
      for (var prop in defOption.setting) {
        if (!tools.isDef(setting[prop])) {
          setting[prop] = defOption.setting[prop]
        }
      }
      if (tools.isNumber(setting.auto)) {
        this.$state.autoTimer.sec = setting.auto
      }
      return setting
    },

    $setWrapStyle: function(wrapStyle, styleObj) {
      if (tools.isPlainObject(wrapStyle)) {
        for (var attr in wrapStyle) {
          styleObj[attr] = wrapStyle[attr]
        }
      }
      return styleObj
    },

    $setWrapClass: function(wrapClass, clsArr) {
      if (wrapClass) {
        // 支持数组和字符串
        if (tools.isArray(wrapClass)) {
          clsArr = clsArr.concat(wrapClass)
        } else {
          clsArr.push(wrapClass)
        }
      }
      return clsArr
    },

    $renderItem: function(ul, i, isActive, fakeIdx) {
      var li = tools.createEl('li')
      var a = tools.createEl('a')
      var img = tools.createEl('img')
      var item = this.data[i]
      var text, textWrap
      var isFake = tools.isDef(fakeIdx)
      tools.addClass(li, 'slider-item').attr(li, 'data-idx', i)
      if (isFake) {
        tools.attr(li, 'data-idx', fakeIdx)
      }
      if (isActive) {
        tools.addClass(li, 'active')
      }
      if (this.mode === 'slide') {
        li.style.left = +tools.attr(li, 'data-idx') * this.setting.width + 'px'
      }
      tools
        .addClass(a, 'slider-link')
        .attr(a, 'href', item.href || '#')
        .attr(img, { alt: 'img' + i + 1, src: item.img })
        .append(a, img)
      var clsArr = ['slider-text']
      var styleObj = {
        zIndex: this.setting.zIndex * 10
      }
      if (item.text && this.setting.text) {
        if (tools.isPlainObject(this.setting.text)) {
          styleObj = this.$setWrapStyle(this.setting.text.wrapStyle, styleObj)
          clsArr = this.$setWrapClass(this.setting.text.wrapClass, clsArr)
        }
        textWrap = tools.createEl('div')
        text = document.createTextNode(item.text)
        tools
          .addClass(textWrap, clsArr)
          .append(textWrap, text)
          .append(a, textWrap)
          .css(textWrap, styleObj)
      }
      tools.append(li, a).append(ul, li)
      if (isFake) {
        this.$state.itemList[fakeIdx] = li
      } else {
        this.$state.itemList[i] = li
      }
    },

    $renderWrap: function() {
      var wrap = tools.createEl('div')
      var styleObj = {
        width: this.setting.width + 'px',
        height: this.setting.height + 'px',
        zIndex: this.setting.zIndex
      }
      if (this.mode !== 'carousel') {
        styleObj.overflow = 'hidden'
      }
      tools.addClass(wrap, 'slider-wrap')
      tools.css(wrap, styleObj)
      return wrap
    },

    $renderBody: function() {
      var ul = tools.createEl('ul')
      var len = this.data.length
      tools.addClass(ul, ['slider-ul', 'slider-body', 'is-' + this.mode])
      this.$state.activeIdx = 0
      if (this.mode === 'slide') {
        this.$renderItem(ul, len - 1, false, -1)
      }
      for (var i = 0; i < len; i++) {
        this.$renderItem(ul, i, i === 0)
      }
      if (this.mode === 'slide') {
        this.$renderItem(ul, 0, false, len)
      }
      if (this.mode === 'carousel') {
        this.$switchCarouselImg(this.$state.activeIdx)
      }
      return ul
    },

    $renderPrevBtn: function() {
      return this.$renderBtn('prev')
    },

    $renderNextBtn: function() {
      return this.$renderBtn('next')
    },

    $renderBtn: function(which) {
      var wrap = tools.createEl('div')
      var btn = tools.createEl('div')
      var icon = tools.createEl('i')
      var wrapClsMap = {
        prev: 'slider-prev',
        next: 'slider-next'
      }
      var btnClsMap = {
        prev: 'slider-btn-left',
        next: 'slider-btn-right'
      }
      var iconMap = {
        prev: 'icon-ali-xiangzuojiantou',
        next: 'icon-ali-xiangyoujiantou'
      }
      var clsArr = ['slider-btn-wrap', wrapClsMap[which]]
      var styleObj = {
        zIndex: this.setting.zIndex * 10
      }
      if (tools.isPlainObject(this.setting.btn)) {
        styleObj = this.$setWrapStyle(this.setting.btn.wrapStyle, styleObj)
        clsArr = this.$setWrapClass(this.setting.btn.wrapClass, clsArr)
      }
      tools
        .addClass(wrap, clsArr)
        .addClass(btn, ['slider-btn', btnClsMap[which]])
        .addClass(icon, ['iconfont', iconMap[which]])
        .append(btn, icon)
        .append(wrap, btn)
        .css(wrap, styleObj)
      return wrap
    },

    $renderDots: function() {
      var ul = tools.createEl('ul')
      var li
      var len = this.data.length
      var clsArr = ['slider-ul', 'slider-dots']
      var styleObj = {
        zIndex: this.setting.zIndex * 10
      }
      if (tools.isPlainObject(this.setting.dot)) {
        styleObj = this.$setWrapStyle(this.setting.dot.wrapStyle, styleObj)
        clsArr = this.$setWrapClass(this.setting.dot.wrapClass, clsArr)
      }
      tools.addClass(ul, clsArr).css(ul, styleObj)
      for (var i = 0; i < len; i++) {
        li = tools.createEl('li')
        tools.addClass(li, 'slider-dot').attr(li, 'data-idx', i)
        if (i === 0) {
          tools
            .addClass(li, 'active')
            .addClass(ul, ['slider-ul', 'slider-dots'])
        }
        tools.append(ul, li)
        this.$state.dotList[i] = li
      }
      return ul
    },

    $renderProgress: function() {
      var wrap = tools.createEl('div')
      var inner = tools.createEl('div')
      var clsArr = ['slider-progress-bar']
      var innerClsArr = ['slider-progress-inner']
      var innerStyleObj = {
        width: '0%'
      }
      var styleObj = {
        height: '6px',
        zIndex: this.setting.zIndex * 10
      }
      if (tools.isPlainObject(this.setting.progress)) {
        styleObj = this.$setWrapStyle(this.setting.progress.wrapStyle, styleObj)
        clsArr = this.$setWrapClass(this.setting.progress.wrapClass, clsArr)
      }
      tools
        .addClass(wrap, clsArr)
        .css(wrap, styleObj)
        .addClass(inner, innerClsArr)
        .css(inner, innerStyleObj)
        .append(wrap, inner)
      return wrap
    },

    $render: function() {
      this.$valid()
      var fragment = document.createDocumentFragment()
      this.$state.wrapRef = this.$renderWrap()
      this.$state.bodyRef = this.$renderBody()
      var domArr = [this.$state.bodyRef]
      if (this.setting.btn) {
        this.$state.prevRef = this.$renderPrevBtn()
        this.$state.nextRef = this.$renderNextBtn()
        domArr = domArr.concat([this.$state.prevRef, this.$state.nextRef])
      }
      if (this.setting.dot) {
        this.$state.dotRef = this.$renderDots()
        domArr = domArr.concat([this.$state.dotRef])
      }
      if (this.setting.auto && this.setting.progress) {
        this.$state.progressRef = this.$renderProgress()
        domArr = domArr.concat([this.$state.progressRef])
      }
      tools
        .append(this.$state.wrapRef, domArr)
        .append(fragment, this.$state.wrapRef)
        .append(this.el, fragment)
      this.$bindEvent()
      this.$refreshAutoRun()
    },

    $clear: function() {
      return this.$state.wrapRef && this.$remove(this.$state.wrapRef)
    },

    $remove: function(child) {
      return this.el.removeChild(child)
    },

    $switchCarousel: function(prevIdx, activeIdx) {
      this.$switchImg(prevIdx, activeIdx)
      this.$switchDot(prevIdx, activeIdx)
    },

    $switchDot: function(prevIdx, activeIdx) {
      if (!this.setting.dot) return
      tools
        .removeClass(this.$state.dotList[prevIdx], 'active')
        .addClass(this.$state.dotList[activeIdx], 'active')
    },

    $switchImg: function(prevIdx, activeIdx) {
      switch (this.mode) {
        case 'fade':
          tools
            .removeClass(this.$state.itemList[prevIdx], 'active')
            .addClass(this.$state.itemList[activeIdx], 'active')
          break
        case 'slide':
          this.$switchSlideImg(prevIdx, activeIdx)
          break
        case 'carousel':
          this.$switchCarouselImg(activeIdx, prevIdx)
          break
        default:
          break
      }
    },

    $switchCarouselImg: function(activeIdx, prevIdx) {
      var deta, leftIdx, rightIdx
      var len = this.data.length
      var _this = this
      var times = ~~(len / 2)
      var detaX = this.setting.range
      var detaEx = this.setting.extent
      var activeStyleObj = {
        translateX: 0,
        scale: 1,
        opacity: 1,
        zIndex: this.setting.zIndex + times
      }
      var walk = function(idx, obj) {
        var styleObj = {
          transform:
            'translateX(' +
            obj.translateX +
            'px) scale(' +
            obj.scale +
            ',' +
            obj.scale +
            ')',
          opacity: obj.opacity,
          filter: 'opacity(' + obj.opacity * 100 + '%)',
          zIndex: obj.zIndex
        }
        tools.css(_this.$state.itemList[idx], styleObj)
      }
      var getIdx = function(activeIdx, pos, deta) {
        var num
        if (pos === 'left') {
          num = activeIdx - deta
          return num >= 0 ? num : len + num
        } else if (pos === 'right') {
          return (activeIdx + deta) % len
        }
      }
      var handleDeta = function(num) {
        return num > 0 ? num : 0
      }
      // 设置中间轮播图
      walk(activeIdx, activeStyleObj)
      // 设置active
      if (tools.isDef(prevIdx)) {
        tools.removeClass(this.$state.itemList[prevIdx], 'active')
      }
      tools.addClass(this.$state.itemList[activeIdx], 'active')
      // 设置周围轮播图
      var scale, opacity, zIndex
      for (var i = 0; i < times; i++) {
        deta = i + 1
        leftIdx = getIdx(activeIdx, 'left', deta)
        rightIdx = getIdx(activeIdx, 'right', deta)
        scale = handleDeta(activeStyleObj.scale - detaEx * deta)
        opacity = handleDeta(activeStyleObj.opacity - detaEx * deta)
        zIndex = activeStyleObj.zIndex - deta
        // 左侧
        walk(leftIdx, {
          translateX: activeStyleObj.translateX - detaX * deta,
          scale: scale,
          opacity: opacity,
          zIndex: zIndex
        })
        // 右侧
        walk(rightIdx, {
          translateX: activeStyleObj.translateX + detaX * deta,
          scale: scale,
          opacity: opacity,
          zIndex: zIndex
        })
      }
    },

    $switchSlideImg: function(prevIdx, activeIdx) {
      var item
      var w = this.setting.width
      var len = this.data.length
      var first = this.$state.itemList[-1]
      var last = this.$state.itemList[len]
      var prev = this.$state.itemList[prevIdx]
      var active = this.$state.itemList[activeIdx]
      for (var i = -1; i <= len; i++) {
        item = this.$state.itemList[i]
        tools.transition(item, 'left 0.4s ease')
      }
      if (prevIdx === len - 1 && activeIdx === 0) {
        tools
          .removeClass(prev, 'active')
          .css(prev, { left: -w + 'px' })
          .addClass(last, 'active')
          .css(last, { left: '0px' })
          .delay(
            function() {
              for (var i = -1; i <= len; i++) {
                item = this.$state.itemList[i]
                tools.removeTransition(item).css(item, {
                  left: w * i + 'px'
                })
              }
              tools
                .removeClass(last, 'active')
                .addClass(this.$state.itemList[0], 'active')
            }.bind(this),
            500
          )
      } else if (prevIdx === 0 && activeIdx === len - 1) {
        tools
          .removeClass(prev, 'active')
          .css(prev, { left: w + 'px' })
          .addClass(first, 'active')
          .css(first, { left: '0px' })
          .delay(
            function() {
              for (var i = -1; i <= len; i++) {
                item = this.$state.itemList[i]
                tools.removeTransition(item).css(item, {
                  left: w * (i + 1 - len) + 'px'
                })
              }
              tools
                .removeClass(first, 'active')
                .addClass(this.$state.itemList[len - 1], 'active')
            }.bind(this),
            500
          )
      } else if (prevIdx > activeIdx) {
        for (var i = -1; i <= len; i++) {
          item = this.$state.itemList[i]
          tools.css(item, {
            left: item.offsetLeft + w + 'px'
          })
        }
        tools.removeClass(prev, 'active').addClass(active, 'active')
      } else if (prevIdx < activeIdx) {
        for (var i = -1; i <= len; i++) {
          item = this.$state.itemList[i]
          tools.css(item, {
            left: item.offsetLeft - w + 'px'
          })
        }
        tools.removeClass(prev, 'active').addClass(active, 'active')
      }
    },

    $changeActiveIdx: function(type) {
      var len = this.data.length
      if (type === 'next') {
        if (this.$state.activeIdx === len - 1) {
          this.$state.activeIdx = 0
        } else {
          this.$state.activeIdx++
        }
      } else {
        if (this.$state.activeIdx === 0) {
          this.$state.activeIdx = len - 1
        } else {
          this.$state.activeIdx--
        }
      }
    },

    $bindBtnEvt: function(type) {
      if (!this.setting.btn) return
      var prevIdx
      var btnRef =
        tools.isDef(type) && type === 'next'
          ? this.$state.nextRef
          : this.$state.prevRef
      btnRef.addEventListener(
        'click',
        tools.throttle(
          function(event) {
            // console.log(type);
            prevIdx = this.$state.activeIdx
            this.$changeActiveIdx(type)
            this.$switchCarousel(prevIdx, this.$state.activeIdx)
            this.$refreshAutoRun()
          }.bind(this),
          500
        )
      )
    },

    $bindDotEvt: function() {
      if (!this.setting.dot) return
      var prevIdx
      this.$state.dotRef.addEventListener(
        'click',
        tools.throttle(
          function(event) {
            var curIdx = event.target
              ? +tools.attr(event.target, 'data-idx')
              : 0
            prevIdx = this.$state.activeIdx
            if (curIdx === prevIdx) return
            this.$state.activeIdx = curIdx
            this.$switchCarousel(prevIdx, this.$state.activeIdx)
            this.$refreshAutoRun()
          }.bind(this),
          500
        )
      )
    },

    $bindMouseEvt: function() {
      if (!this.setting.auto) return
      this.$state.wrapRef.addEventListener(
        'mouseover',
        this.$stopAutoRun.bind(this)
      )
      this.$state.wrapRef.addEventListener(
        'mouseout',
        this.$refreshAutoRun.bind(this)
      )
    },

    $bindEvent: function() {
      this.$bindBtnEvt('prev')
      this.$bindBtnEvt('next')
      this.$bindDotEvt()
      this.$bindMouseEvt()
    },

    $refreshAutoRun: function() {
      this.$stopAutoRun()
      this.$autoRun()
    },

    $autoRun: function() {
      if (!this.setting.auto) return
      if (this.setting.progress) {
        this.$resetProgress()
      } else {
        this.$state.autoTimer.id = window.setInterval(
          this.$run,
          this.$state.autoTimer.sec * 1000
        )
      }
    },

    $stopAutoRun: function() {
      if (!this.setting.auto) return
      if (this.setting.progress) {
        this.$progressStop()
      } else {
        this.$state.autoTimer.id &&
          window.clearInterval(this.$state.autoTimer.id)
        this.$state.autoTimer.id = null
      }
    },

    $run: function() {
      var prevIdx = this.$state.activeIdx
      this.$changeActiveIdx('next')
      this.$switchCarousel(prevIdx, this.$state.activeIdx)
    },

    $resetProgress: function() {
      var wrap = this.$state.progressRef
      var maxWidth = tools.width(wrap)
      var inner = wrap.childNodes[0]
      var step = maxWidth / (this.$state.autoTimer.sec * 60)
      tools.css(inner, {
        width: '0px'
      })
      this.$state.autoTimer.isfire = false
      this.$progressStop()
      this.$progressGo(this.$run.bind(this), step, maxWidth)
    },

    $progressGo: function(fn, step, max) {
      var inner = this.$state.progressRef.childNodes[0]
      var width = tools.width(inner) + step
      this.$progressStop()
      this.$state.autoTimer.rid = window.requestAnimationFrame(
        this.$progressGo.bind(this, fn, step, max)
      )
      tools.css(inner, {
        width: width + 'px'
      })
      if (max <= width && !this.$state.autoTimer.isfire) {
        this.$state.autoTimer.isfire = true
        fn()
        tools.delay(this.$resetProgress.bind(this), 500)
      }
    },

    $progressStop: function() {
      window.cancelAnimationFrame(this.$state.autoTimer.rid)
    }
  }

  window.Slider = Slider
})(window, window.document)
