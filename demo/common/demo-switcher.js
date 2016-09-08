// (c) 2015 Mapzen
//
// PROJECTS · DEMO SWITCHER
// For switching between different demos on the project pages
// ----------------------------------------------------------------------------
var DemoSwitcher = (function () {
  'use strict'

  var sources
  var onClickForEach
  var controlEl
  var controlItems
  var controlPrevious
  var controlNext

  var currentDemoIndex = 0

  // DemoSwitcher expects an options object with the following infos.
  // sources:  array of objects with properties, whatever you want
  //           but at minimum, expecting a "title" property to display
  // onClick:  function to execute when viewer clicks this item.
  //           the original source item associated with it is passed
  //           as the first argument.
  var DemoSwitcher = function (options) {
    this.init(options)
  }

  DemoSwitcher.prototype.init = function (options) {
    sources = options.sources || []
    onClickForEach = options.onClick || function () { return }

    controlEl = document.getElementById('demo-controls')
    controlItems = controlEl.getElementsByClassName('demo-control-list')[0]
    controlPrevious = controlEl.getElementsByClassName('demo-control-previous')[0]
    controlNext = controlEl.getElementsByClassName('demo-control-next')[0]

    sources.forEach(createElement)

    controlNext.addEventListener('click', function (e) {
      currentDemoIndex++
      if (currentDemoIndex >= sources.length) {
        currentDemoIndex = 0
      }
      removeActiveClassNames()
      document.getElementById('demo-controls').getElementsByClassName('demo-control')[currentDemoIndex].className += ' active'

      onClickForEach(sources[currentDemoIndex])
    })

    controlPrevious.addEventListener('click', function (e) {
      currentDemoIndex--
      if (currentDemoIndex < 0) {
        currentDemoIndex = sources.length - 1
      }
      removeActiveClassNames()
      document.getElementById('demo-controls').getElementsByClassName('demo-control')[currentDemoIndex].className += ' active'

      onClickForEach(sources[currentDemoIndex])
    })

    controlNext.addEventListener('mouseover', addHoverState, false)
    controlNext.addEventListener('mouseout', removeHoverState, false)
    controlNext.addEventListener('touchstart', addHoverState, false)
    controlNext.addEventListener('touchend', removeHoverState, false)

    controlPrevious.addEventListener('mouseover', addHoverState, false)
    controlPrevious.addEventListener('mouseout', removeHoverState, false)
    controlPrevious.addEventListener('touchstart', addHoverState, false)
    controlPrevious.addEventListener('touchend', removeHoverState, false)
  }

  /**
   * Sets a tab as active. This does not "click" the item, it merely
   * highlights it as active by adding a classname.
   * Does nothing if the index provided is already active or does not exist.
   * @param {number} index - zero-indexed tab position.
   */
  function highlightActiveTab (index) {
    var targetEl = controlEl.querySelectorAll('.demo-control')[index]
    if (!targetEl || targetEl.classList.contains('active')) {
      return
    }

    removeActiveClassNames()
    targetEl.className += ' active'
  }

  // Add this to prototype
  DemoSwitcher.prototype.highlightActiveTab = highlightActiveTab

  function createElement (item, index) {
    var el = document.createElement('li')
    var title = document.createTextNode(item.title)

    el.className = 'demo-control'
    if (index === 0) {
      el.className += ' active'
    }

    el.appendChild(title)
    el.addEventListener('click', function (e) {
      highlightActiveTab(index)
      onClickForEach(item)
    }, false)

    el.addEventListener('mouseover', addHoverState, false)
    el.addEventListener('mouseout', removeHoverState, false)
    el.addEventListener('touchstart', addHoverState, false)
    el.addEventListener('touchend', removeHoverState, false)

    controlItems.appendChild(el)
  }

  function removeActiveClassNames () {
    var el = controlItems.getElementsByClassName('demo-control')
    for (var i = 0; i < sources.length; i++) {
      el[i].className = 'demo-control'
    }
  }

  function addHoverState (event) {
    if (this.classList.contains('touched')) {
      this.classList.remove('touched')
    } else {
      this.classList.add('hover')
    }
  }

  function removeHoverState (event) {
    if (event.touches) {
      this.classList.add('touched')
    }
    this.classList.remove('hover')
  }

  return DemoSwitcher
})()
