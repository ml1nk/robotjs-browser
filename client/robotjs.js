var robotjs = (function() {
    var origin = _origin(document.getElementById("robotjs").src);
    var socket = io(origin);

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
            if (el.ownerDocument !== document) {
                var list = document.getElementsByTagName("iframe");
                for (var i = 0; i < list.length; i++) {
                    var doc = list[i].contentDocument || list[i].contentWindow.document;
                    if (el.ownerDocument === doc) {
                        var pos_outside = _pos(list[i].getBoundingClientRect(), window, "left-top");
                        pos.x += pos_outside.x;
                        pos.y += pos_outside.y;
                        break;
                    }
                }
            }
        }

        function _screen_pos(pos) {
            var border;
            var devicePixelRatio = _getDevicePixelRatio(window);
            // firefox ignores decorations (title bar) window.outerWidth / window.outerHeight
            // https://bugzilla.mozilla.org/show_bug.cgi?id=581866
            if(window.hasOwnProperty("mozInnerScreenY") && window.hasOwnProperty("mozInnerScreenX")) {
              pos.x += Math.round(devicePixelRatio*window.mozInnerScreenX);
              pos.y += Math.round(devicePixelRatio*window.mozInnerScreenY);
            } else if(window.hasOwnProperty("chrome") && window.hasOwnProperty("screen") && !window.screen.hasOwnProperty("systemXDPI")) {
              border = Math.round((window.outerWidth - Math.round(window.innerWidth*devicePixelRatio))/2);
              pos.x += window.screenX + border;
              pos.y += window.screenY + window.outerHeight - Math.round(window.innerHeight*devicePixelRatio)-border;
            } else {
              border = Math.round((window.outerWidth - window.innerWidth)*devicePixelRatio/2);
              pos.x += window.screenX*devicePixelRatio + border;
              pos.y += window.screenY*devicePixelRatio + Math.round((window.outerHeight - window.innerHeight)*devicePixelRatio)-border;
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
            var devicePixelRatio = _getDevicePixelRatio(window);
            // firefox changes window.outerHeight / window.outerWidth when zooming (chrome does not)
            // https://bugzilla.mozilla.org/show_bug.cgi?id=1022006
            if(window.hasOwnProperty("mozInnerScreenY") && window.hasOwnProperty("mozInnerScreenX")) {
              return(Math.round(devicePixelRatio*window.mozInnerScreenX)<5 && Math.round(devicePixelRatio*window.mozInnerScreenY)<5);
            } else {
              // there is always one pixel at the top
              return (screen.height-5 > window.innerHeight*devicePixelRatio && screen.width-5 > window.innerWidth*devicePixelRatio);
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

    return {
        pos: pos,
        fullscreen: fullscreen,
        wrapper: wrapper,
        delay: delay,
        socket: socket,
        origin: origin
    };

}());
