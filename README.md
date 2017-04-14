## Installation
```
npm install -g robotjs-browser
```
## Usage: 

robotjs-browser [options]

  Options:

    -h, --help             output usage information
    -V, --version          output the version number
    -p, --port [num]       server port - defaults to 7569
    -h, --host [hostname]  host name - defaults to 127.0.0.1
    -m, --minify           serve minified scripts (.min.js)

Insert
```
<script id="robotjs-script" type="text/javascript" src="http://127.0.0.1:7569/robotjs-iframe-polyfill.js">
```
in the head section of your page to include the API.

## Example
Open http://localhost:7569 when robotjs-browser is running.

## API
window.robotjs
 - pos
	 - node(element, site) : {x,y}
	 - textNode(element, offset) : {x,y}
 - wrapper → http://robotjs.io/docs/syntax
 - fullscreen
	 - enable() : promise
	 - disable() : promise
	 - toggle() : promise
	 - is() : promise
 - started - promise
