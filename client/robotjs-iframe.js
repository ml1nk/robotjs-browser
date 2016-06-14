var robotjs = (function() {

    var _fulfill;
    var _reject;
    var started = new Promise(function(fulfill, reject) {
      _fulfill=fulfill;
      _reject=_reject;
    });

    document.addEventListener("DOMContentLoaded", function(event) {
      var _script = document.getElementById("robotjs-script");
      var origin = _script ? _origin(_script.src)+"/" : "";

      var i = document.createElement('iframe');

      var html = '<body>Foo</body>';
      i.style.display = 'none';
      document.body.appendChild(i);
      i.onload = function() {
        window.robotjs = (i.contentWindow || i.contentDocument.defaultView).robotjs;
        window.robotjs.setWindow(window);
        window.robotjs.started.then(_fulfill,_reject);
      };
      (i.contentWindow.document || i.contentDocument).open();
      (i.contentWindow.document || i.contentDocument).write('<!DOCTYPE html><html><head><script type="text/javascript" id="robotjs-script" src="'+origin+'robotjs-polyfill.js"></script></head><body></body></html>');
      (i.contentWindow.document || i.contentDocument).close();
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
      started : started
    };

}());
