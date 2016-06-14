var robotjs = (function(_window) {

    var _script = document.getElementById("robotjs-script");
    var socket = _script ? io(_origin(_script.src)) : io();

    var pos = (function() {

        function node(el, site) {
            var bounding;
            if (el.nodeType === 3) {
                var range = el.ownerDocument.createRange();
                range.setStart(el, 0);
                range.setEnd(el, el.length);
                bounding = range.getBoundingClientRect();
            } else {
                bounding = el.getBoundingClientRect();
            }
            var pos = _pos(bounding, el.ownerDocument.defaultView, site);
            _iframe_pos(el, pos);
            _screen_pos(pos);
            return pos;
        }

        function textNode(el, offset) {
            var range = el.ownerDocument.createRange();
            range.setStart(el, offset);
            range.setEnd(el, offset);
            var pos = _pos(range.getBoundingClientRect(), el.ownerDocument.defaultView, "left-center");
            _iframe_pos(el, pos);
            _screen_pos(pos);
            return pos;
        }

        function _iframe_pos(el, pos) {
            if (el.ownerDocument !== _window.document) {
                var list = _window.document.getElementsByTagName("iframe");
                for (var i = 0; i < list.length; i++) {
                    var doc = list[i].contentDocument || list[i].contentWindow.document;
                    if (el.ownerDocument === doc) {
                        var pos_outside = _pos(list[i].getBoundingClientRect(), _window, "left-top");
                        pos.x += pos_outside.x;
                        pos.y += pos_outside.y;
                        break;
                    }
                }
            }
        }

        function _screen_pos(pos) {
            var border;
            var devicePixelRatio = _getDevicePixelRatio(_window);
            // firefox ignores decorations (title bar) window.outerWidth / window.outerHeight
            // https://bugzilla.mozilla.org/show_bug.cgi?id=581866
            if(_window.hasOwnProperty("mozInnerScreenY") && _window.hasOwnProperty("mozInnerScreenX")) {
              pos.x += Math.round(devicePixelRatio*_window.mozInnerScreenX);
              pos.y += Math.round(devicePixelRatio*_window.mozInnerScreenY);
            } else if(_window.hasOwnProperty("chrome") && _window.hasOwnProperty("screen") && !(_window.screen.systemXDPI)) {
              border = Math.round((_window.outerWidth - Math.round(_window.innerWidth*devicePixelRatio))/2);
              pos.x += _window.screenX + border;
              pos.y += _window.screenY + _window.outerHeight - Math.round(_window.innerHeight*devicePixelRatio)-border;
            } else {
              border = Math.round((_window.outerWidth - _window.innerWidth)*devicePixelRatio/2);
              pos.x += _window.screenX*devicePixelRatio + border;
              pos.y += _window.screenY*devicePixelRatio + Math.round((_window.outerHeight - _window.innerHeight)*devicePixelRatio)-border;
            }
        }

        /*
         * Valid sites: left-top     top      right-top
         *              left        center        right
         *              left-bottom bottom right-bottom
         */
        function _pos(bounding, window, site) {
            var pos = {};
            switch (site) {
                case "left":
                case "left-top":
                case "left-bottom":
                    pos.x = bounding.left;
                    break;
                case "right":
                case "right-top":
                case "right-bottom":
                    pos.x = bounding.right;
                    break;
                default:
                    pos.x = bounding.left + (bounding.right - bounding.left) / 2;
            }
            switch (site) {
                case "top":
                case "left-top":
                case "right-top":
                    pos.y = bounding.top;
                    break;
                case "bottom":
                case "left-bottom":
                case "left-bottom":
                    pos.y = bounding.bottom;
                    break;
                default:
                    pos.y = bounding.top + (bounding.bottom - bounding.top) / 2;
            }
            var devicePixelRatio = _getDevicePixelRatio(window);
            pos.x = Math.round(pos.x*devicePixelRatio);
            pos.y = Math.round(pos.y*devicePixelRatio);
            return pos;
        }

        return {
            node: node,
            textNode: textNode
        };
    }());

    var fullscreen = (function() {
        function is() {
            var devicePixelRatio = _getDevicePixelRatio(_window);
            // firefox changes window.outerHeight / window.outerWidth when zooming (chrome does not)
            // https://bugzilla.mozilla.org/show_bug.cgi?id=1022006
            if(_window.hasOwnProperty("mozInnerScreenY") && _window.hasOwnProperty("mozInnerScreenX")) {
              return(Math.round(devicePixelRatio*_window.mozInnerScreenX)<5 && Math.round(devicePixelRatio*_window.mozInnerScreenY)<5);
            } else {
              // there is always one pixel at the top
              return (_window.screen.height-5 < _window.innerHeight*devicePixelRatio && _window.screen.width-5 < _window.innerWidth*devicePixelRatio);
            }
        }

        function toggle() {
            return new Promise(function(fulfill, reject) {
                wrapper.keyTap("f11").then(delay(4000), reject).then(fulfill);
            });
        }

        function enable() {
            if (is()) {
                return Promise.resolve();
            } else {
                return toggle();
            }
        }

        function disable() {
            if (!is()) {
                return Promise.resolve();
            } else {
                return toggle();
            }
        }

        return {
            is: is,
            toggle: toggle,
            enable: enable,
            disable: disable
        };
    }());

    var wrapper = (function() {

        // transmit the wanted function to the server
        function _wormhole(name, parameter) {
            return new Promise(function(fulfill, reject) {
                socket.emit("robotjs", name, parameter, fulfill);
            });
        }

        function setKeyboardDelay(ms) {
            return _wormhole("setKeyboardDelay", Array.prototype.slice.call(arguments));
        }

        function keyTap(key, modifier) {
            return _wormhole("keyTap", Array.prototype.slice.call(arguments));
        }

        function keyToggle(key, down, modifier) {
            return _wormhole("keyToggle", Array.prototype.slice.call(arguments));
        }

        function typeString(string) {
            return _wormhole("typeString", Array.prototype.slice.call(arguments));
        }

        function typeStringDelayed(string, cpm) {
            return _wormhole("typeStringDelayed", Array.prototype.slice.call(arguments));
        }

        function moveMouse(x, y) {
            return _wormhole("moveMouse", Array.prototype.slice.call(arguments));
        }

        function moveMouseSmooth(x, y) {
            return _wormhole("moveMouseSmooth", Array.prototype.slice.call(arguments));
        }

        function mouseClick(button, double) {
            return _wormhole("mouseClick", Array.prototype.slice.call(arguments));
        }

        function mouseToggle(down, button) {
            return _wormhole("mouseToggle", Array.prototype.slice.call(arguments));
        }

        function getMousePos() {
            return _wormhole("getMousePos", Array.prototype.slice.call(arguments));
        }

        function scrollMouse(magnitude, direction) {
            return _wormhole("scrollMouse", Array.prototype.slice.call(arguments));
        }

        function getPixelColor(x, y) {
            return _wormhole("getPixelColor", Array.prototype.slice.call(arguments));
        }

        function getScreenSize() {
            return _wormhole("getScreenSize", Array.prototype.slice.call(arguments));
        }

        return {
            setKeyboardDelay: setKeyboardDelay,
            keyTap: keyTap,
            keyToggle: keyToggle,
            typeString: typeString,
            typeStringDelayed: typeStringDelayed,
            moveMouse: moveMouse,
            moveMouseSmooth: moveMouseSmooth,
            mouseClick: mouseClick,
            mouseToggle: mouseToggle,
            getMousePos: getMousePos,
            scrollMouse: scrollMouse,
            getPixelColor: getPixelColor,
            getScreenSize: getScreenSize
        };

    }());

    function delay(ms) {
        return function() {
            var args = arguments;
            return new Promise(function(resolve, reject) {
                setTimeout(function() {
                    resolve();
                }, ms);
            });
        };
    }

    window.addEventListener("beforeunload", function(event) {
        socket.close();
    });

    // https://gist.github.com/jlong/2428561
    function _origin(url) {
        var div = document.createElement('div');
        div.innerHTML = "<a></a>";
        div.firstChild.href = url; // Ensures that the href is properly escaped
        div.innerHTML = div.innerHTML; // Run the current innerHTML back through the parser
        return div.firstChild.origin;
    }

    /*! GetDevicePixelRatio | Author: Tyson Matanich, 2012 | License: MIT */
    // https://github.com/tysonmatanich/GetDevicePixelRatio/blob/master/getDevicePixelRatio.js
    function _getDevicePixelRatio(window) {
        var ratio = 1;
        // To account for zoom, change to use deviceXDPI instead of systemXDPI
        if (window.screen.systemXDPI !== undefined && window.screen.logicalXDPI !== undefined && window.screen.systemXDPI > window.screen.logicalXDPI) {
            // Only allow for values > 1
            ratio = window.screen.systemXDPI / window.screen.logicalXDPI;
        } else if (window.devicePixelRatio !== undefined) {
            ratio = window.devicePixelRatio;
        }
        return ratio;
    }

    function setWindow(window) {
      _window = window;
    }

    var started = new Promise(function(fulfill, reject) {
      socket.on('connect_error', function(){
        reject();
      });
      socket.on('connect', function(){
        fulfill();
      });
    });

    return {
        pos: pos,
        fullscreen: fullscreen,
        wrapper: wrapper,
        delay: delay,
        socket: socket,
        setWindow : setWindow,
        started : started
    };

}(window));
