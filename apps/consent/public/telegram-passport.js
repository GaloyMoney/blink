;(function (window) {
  if (!Array.isArray) {
    Array.isArray = function (arg) {
      return Object.prototype.toString.call(arg) === "[object Array]"
    }
  }
  if (!Object.isSimpleObject) {
    Object.isSimpleObject = function (arg) {
      return arg != null && typeof arg === "object"
    }
  }
  function isFunction(func) {
    return func && {}.toString.call(func) === "[object Function]"
  }
  function getEl(elOrId) {
    if (elOrId.nodeType) return elOrId
    return document.getElementById(elOrId)
  }
  function preventDefault(event) {
    if (window.event) {
      window.event.returnValue = false
    } else if (event.preventDefault) {
      event.preventDefault()
    } else {
      event.returnValue = false
    }
  }
  function addEvent(el, event, handler) {
    var events = event.split(/\s+/)
    for (var i = 0; i < events.length; i++) {
      if (el.addEventListener) {
        el.addEventListener(events[i], handler, false)
      } else {
        el.attachEvent("on" + events[i], handler)
      }
    }
  }

  var UA = window.navigator.userAgent || ""
  var ScopeAliases = {
    personal_details: "pd",
    passport: "pp",
    driver_license: "dl",
    identity_card: "ic",
    internal_passport: "ip",
    id_document: "idd",
    address: "ad",
    utility_bill: "ub",
    bank_statement: "bs",
    rental_agreement: "ra",
    passport_registration: "pr",
    temporary_registration: "tr",
    address_document: "add",
    phone_number: "pn",
    email: "em",
  }

  function openDeepLink(url, tooltipToggle) {
    var is_ios = /ios|iphone os|iphone|ipod|ipad/i.test(UA)
    var is_firefox = /firefox/i.test(UA)
    var use_iframe = is_ios || is_firefox
    var use_once = !is_ios && is_firefox
    var timeOpen
    var ttNeedHide = false
    var pageShown = true
    var onPageHide = function () {
      pageShown = false
    }
    tooltipToggle = tooltipToggle || function () {}
    var onPageShow = function () {
      pageShown = true
      if (ttNeedHide && +new Date() - timeOpen > 5000) {
        tooltipToggle(false)
      }
    }
    addEvent(window, "pagehide", onPageHide)
    addEvent(window, "pageshow", onPageShow)
    addEvent(window, "blur", onPageHide)
    addEvent(window, "focus", onPageShow)
    var showTooltip = function () {
      tooltipToggle(true)
      if (!pageShown) {
        ttNeedHide = true
      }
    }
    if (use_iframe) {
      var iframeEl = document.createElement("iframe")
      iframeEl.style.position = "absolute"
      iframeEl.style.left = "-10000px"
      iframeEl.style.top = "-10000px"
      document.body.appendChild(iframeEl)
      if (iframeEl !== null) {
        timeOpen = +new Date()
        iframeEl.src = url
        setTimeout(showTooltip, 2500)
      }
      if (!use_once) {
        setTimeout(function () {
          if (pageShown) {
            timeOpen = +new Date()
            window.location = url
          }
        }, 2000)
      }
    } else {
      setTimeout(function () {
        timeOpen = +new Date()
        window.location = url
      }, 100)
      setTimeout(showTooltip, 1500)
    }
  }

  function packScope(scope) {
    if (scope.data) {
      scope.d = scope.data
      delete scope.data
    }
    if (!scope.d) {
      throw new TypeError("scope data is required")
    }
    if (!scope.v) {
      throw new TypeError("scope version is required")
    }
    for (var i = 0; i < scope.d.length; i++) {
      scope.d[i] = packScopeField(scope.d[i])
    }
    return JSON.stringify(scope)
  }
  function packScopeField(field) {
    if (field.one_of) {
      field._ = field.one_of
      delete field.one_of
    } else if (field.type) {
      field._ = field.type
      delete field.type
    }
    if (Array.isArray(field._)) {
      for (var j = 0; j < field._.length; j++) {
        field._[j] = packScopeField(field._[j])
      }
      field = packScopeOpts(field)
    } else if (field._) {
      if (ScopeAliases[field._]) {
        field._ = ScopeAliases[field._]
      }
      field = packScopeOpts(field)
    } else if (ScopeAliases[field]) {
      field = ScopeAliases[field]
    }
    return field
  }
  function packScopeOpts(scope) {
    if (scope.selfie) {
      scope.s = 1
      delete scope.selfie
    }
    if (scope.translation) {
      scope.t = 1
      delete scope.translation
    }
    if (scope.native_names) {
      scope.n = 1
      delete scope.native_names
    }
    return scope
  }

  function passportAuth(options, tooltipToggle) {
    if (!options.bot_id) {
      throw new Error("bot_id is required")
    }
    if (!options.scope) {
      throw new Error("scope is required")
    }
    if (!Object.isSimpleObject(options.scope)) {
      throw new TypeError("scope should be an object")
    }
    if (!options.public_key) {
      throw new Error("public_key is required")
    }
    if (!options.nonce) {
      throw new Error("nonce is required")
    }
    if (options.payload) {
      throw new Error("payload is deprecated, use nonce instead")
    }
    var is_android = /android/i.test(UA)
    var url =
      (is_android ? "tg:" : "tg://") +
      "resolve?domain=telegrampassport" +
      "&bot_id=" +
      encodeURIComponent(options.bot_id) +
      "&scope=" +
      encodeURIComponent(packScope(options.scope)) +
      "&public_key=" +
      encodeURIComponent(options.public_key) +
      "&nonce=" +
      encodeURIComponent(options.nonce)
    if (options.callback_url) {
      url += "&callback_url=" + encodeURIComponent(options.callback_url)
    }
    url += "&payload=nonce" // legacy for outdated apps
    openDeepLink(url, tooltipToggle)
  }

  function createAuthButton(contEl, authDataOrFunc, options) {
    contEl = getEl(contEl)
    if (!contEl) {
      return false
    }
    options = options || {}
    var btnText = options.text || "Log In With Telegram"
    var btnRadius = parseInt(options.radius, 10) || 23
    var tooltipText =
      options.tooltip_text || "Please <u>install Telegram</u> to use this option."
    var tooltipForce = options.tooltip_force || false
    var tooltipPos = options.tooltip_position
    if (tooltipPos == "top") {
      var tooltipWrapClass = "tooltip-top"
    } else if (tooltipPos == "left") {
      var tooltipWrapClass = "tooltip-left"
    } else if (tooltipPos == "right") {
      var tooltipWrapClass = "tooltip-right"
    } else {
      var tooltipWrapClass = "tooltip-bottom"
    }
    var btnStyle =
      "" +
      ".telegram-passport {" +
      "display: inline-block;" +
      "position: relative;" +
      "max-width: 100%;" +
      "}" +
      "button.telegram-passport-button {" +
      "display: inline-block;" +
      "vertical-align: top;" +
      'font-family: "Lucida Grande", Arial, Helvetica, sans-serif;' +
      "font-size: 16px;" +
      "font-weight: 500;" +
      "line-height: 20px;" +
      "text-align: left;" +
      "border-radius: " +
      btnRadius +
      "px;" +
      "background-color: #54a9eb;" +
      "text-decoration: none;" +
      "padding: 12px 21px 14px;" +
      "margin: 0;" +
      "white-space: nowrap;" +
      "text-overflow: ellipsis;" +
      "overflow: hidden;" +
      "border: none;" +
      "color: #fff;" +
      "cursor: pointer;" +
      "max-width: 100%;" +
      "}" +
      "button.telegram-passport-button:focus {" +
      "outline: none;" +
      "}" +
      ".telegram-passport-tooltip-wrap {" +
      "position: absolute;" +
      "pointer-events: none;" +
      "text-align: center;" +
      "z-index: 100;" +
      "}" +
      ".telegram-passport-tooltip-wrap.tooltip-bottom {" +
      "left: -500px;" +
      "right: -500px;" +
      "top: 100%;" +
      "}" +
      ".telegram-passport-tooltip-wrap.tooltip-top {" +
      "left: -500px;" +
      "right: -500px;" +
      "bottom: 100%;" +
      "}" +
      ".telegram-passport-tooltip-wrap.tooltip-left {" +
      "right: 100%;" +
      "top: 7px;" +
      "bottom: 7px;" +
      "}" +
      ".telegram-passport-tooltip-wrap.tooltip-right {" +
      "left: 100%;" +
      "top: 7px;" +
      "bottom: 7px;" +
      "}" +
      ".telegram-passport-tooltip {" +
      "position: relative;" +
      'font-family: "Lucida Grande", Arial, Helvetica, sans-serif;' +
      "background: #949494;" +
      "color: #fff;" +
      "white-space: nowrap;" +
      "border-radius: " +
      btnRadius +
      "px;" +
      "padding: 7px 16px;" +
      "display: inline-block;" +
      "font-size: 14px;" +
      "line-height: 18px;" +
      "text-decoration: none;" +
      "pointer-events: none;" +
      "visibility: hidden;" +
      "opacity: 0;" +
      "}" +
      ".telegram-passport-tooltip-wrap.tooltip-bottom .telegram-passport-tooltip {" +
      "margin-top: 32px;" +
      "}" +
      ".telegram-passport-tooltip-wrap.tooltip-top .telegram-passport-tooltip {" +
      "margin-bottom: 32px;" +
      "}" +
      ".telegram-passport-tooltip-wrap.tooltip-left .telegram-passport-tooltip {" +
      "margin-right: 32px;" +
      "}" +
      ".telegram-passport-tooltip-wrap.tooltip-right .telegram-passport-tooltip {" +
      "margin-left: 32px;" +
      "}" +
      ".telegram-passport-tooltip:hover {" +
      "color: #fff;" +
      "text-decoration: none;" +
      "}" +
      ".telegram-passport-tooltip-shown {" +
      "transition: all .2s ease;" +
      "pointer-events: auto;" +
      "visibility: visible;" +
      "opacity: 1;" +
      "}" +
      ".telegram-passport-tooltip-wrap.tooltip-bottom .telegram-passport-tooltip-shown {" +
      "margin-top: 16px;" +
      "}" +
      ".telegram-passport-tooltip-wrap.tooltip-top .telegram-passport-tooltip-shown {" +
      "margin-bottom: 16px;" +
      "}" +
      ".telegram-passport-tooltip-wrap.tooltip-left .telegram-passport-tooltip-shown {" +
      "margin-right: 16px;" +
      "}" +
      ".telegram-passport-tooltip-wrap.tooltip-right .telegram-passport-tooltip-shown {" +
      "margin-left: 16px;" +
      "}" +
      ".telegram-passport-button-icon {" +
      "display: inline-block;" +
      "vertical-align: top;" +
      "background: url('data:image/png;base64,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') no-repeat;" +
      "background-size: 27px 22px;" +
      "width: 27px;" +
      "height: 22px;" +
      "margin: 0 15px -2px -5px;" +
      "}" +
      ".telegram-passport-tooltip:before {" +
      "content: '';" +
      "display: inline-block;" +
      "position: absolute;" +
      "}" +
      ".telegram-passport-tooltip-wrap.tooltip-bottom .telegram-passport-tooltip:before {" +
      "left: 50%;" +
      "top: 0;" +
      "border: 10px solid;" +
      "border-radius: 4px 0 0;" +
      "border-color: #949494 transparent transparent #949494;" +
      "transform: rotateZ(45deg) translate3d(-3px,5px,0);" +
      "transform-origin: 100% 0;" +
      "}" +
      ".telegram-passport-tooltip-wrap.tooltip-top .telegram-passport-tooltip:before {" +
      "left: 50%;" +
      "bottom: 0;" +
      "border: 10px solid;" +
      "border-radius: 0 0 4px;" +
      "border-color: transparent #949494 #949494 transparent;" +
      "transform: rotateZ(45deg) translate3d(-11px,9px,0);" +
      "transform-origin: 0 100%;" +
      "}" +
      ".telegram-passport-tooltip-wrap.tooltip-left .telegram-passport-tooltip:before {" +
      "top: 50%;" +
      "right: 0;" +
      "border: 8px solid;" +
      "border-radius: 0 2px 0 0;" +
      "border-color: #949494 #949494 transparent transparent;" +
      "transform: rotateZ(45deg) translate3d(4px,-3.5px,0);" +
      "transform-origin: 100% 0;" +
      "}" +
      ".telegram-passport-tooltip-wrap.tooltip-right .telegram-passport-tooltip:before {" +
      "top: 50%;" +
      "left: 0;" +
      "border: 8px solid;" +
      "border-radius: 0 0 0 2px;" +
      "border-color: transparent transparent #949494 #949494;" +
      "transform: rotateZ(45deg) translate3d(-15px,-7.5px,0);" +
      "transform-origin: 0 100%;" +
      "}"
    var tooltipClass = tooltipForce
      ? "telegram-passport-tooltip telegram-passport-tooltip-shown"
      : "telegram-passport-tooltip"
    var btnHtml =
      "" +
      "<style>" +
      btnStyle +
      "</style>" +
      '<div class="telegram-passport-tooltip-wrap ' +
      tooltipWrapClass +
      '"><a class="' +
      tooltipClass +
      '" href="https://telegram.org/dl/" target="_blank">' +
      tooltipText +
      "</a></div>" +
      '<button class="telegram-passport-button"><i class="telegram-passport-button-icon"></i>' +
      btnText +
      "</button>"
    var btnContEl = document.createElement("div")
    btnContEl.className = "telegram-passport"
    btnContEl.innerHTML = btnHtml
    contEl.appendChild(btnContEl)
    var buttonEl = btnContEl.getElementsByTagName("button")[0]
    var tooltipEl = btnContEl.getElementsByTagName("a")[0]
    addEvent(buttonEl, "click", function (e) {
      preventDefault(e)
      var options = isFunction(authDataOrFunc) ? authDataOrFunc() : authDataOrFunc
      options = options || {}
      var tooltipToggle = function (show) {
        if (show) {
          tooltipEl.classList.add("telegram-passport-tooltip-shown")
        } else {
          tooltipEl.classList.remove("telegram-passport-tooltip-shown")
        }
      }
      passportAuth(options, !tooltipForce ? tooltipToggle : null)
    })
  }

  if (!window.Telegram) {
    window.Telegram = {}
  }
  window.Telegram.Passport = {
    auth: passportAuth,
    createAuthButton: createAuthButton,
  }
})(window)
