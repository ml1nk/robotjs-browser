var robotjs = (function() {
    var origin = _origin(document.getElementById("robotjs-browser").src);
    var socket = io(_origin());

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
            var pos = _site(bounding, site);
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
                        var outside = list[i].getBoundingClientRect();
                        pos.x += outside.left;
                        pos.y += outside.top;
                        break;
                    }
                }
            }
        }

        function _screen_pos(pos) {
          pos.x += window.screenX + (window.outerWidth-window.innerWidth);
          pos.y += window.screenY + (window.outerHeight-window.innerHeight);
        }

        /*
         * Valid sites: left-top     top      right-top
         *              left        center        right
         *              left-bottom bottom right-bottom
         */
        function _site(bounding, site) {
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
                    pos.x = bounding.left + Math.round((bounding.right-bounding.left) / 2);
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
                    pos.y = bounding.top + Math.round((bounding.bottom-bounding.top) / 2);
            }
            return pos;
        }

        function textNode(el, offset) {
            var range = el.ownerDocument.createRange();
            range.setStart(el, offset);
            range.setEnd(el, offset);
            var bounding = range.getBoundingClientRect();
            var pos = {
                x: bounding.left,
                y: bounding.top+Math.round((bounding.bottom-bounding.top)/2),
            };
            _iframe_pos(el, pos);
            _screen_pos(pos);
            return pos;
        }

        return {
            node: node,
            textNode: textNode
        };
    }());

    var fullscreen = (function() {
        function is() {
            return (screen.height === window.outerHeight && screen.width === window.outerWidth && window.outerWidth - window.innerWidth <= 5 && window.outerHeight - window.innerHeight <= 5);
        }

        function toggle() {
            return new Promise(function(fulfill, reject) {
              wrapper.keyTap("f11").then(delay(4000),reject).then(fulfill);
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
        var _id = 0;

        // Übertragung des Funktionsaufrufs und der Rückgabe über socket.io
        function _wormhole(name, parameter) {
            return new Promise(function(fulfill, reject) {
                socket.once("robotjs." + _id, function(result) {
                    fulfill(result);
                });
                socket.emit("robotjs", _id, name, parameter);
                _id++;
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
            getScreenSize: getScreenSize,
            _id: _id
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

    return {
        pos : pos,
        fullscreen : fullscreen,
        wrapper : wrapper,
        delay : delay,
        socket : socket,
        origin : origin
    };

}());
