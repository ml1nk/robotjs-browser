## Installation
```
npm install -g robotjs-browser
```
## Start
```
robotjs-browser
```
## Usage
```
<script id="robotjs-script" type="text/javascript" src="http://127.0.0.1:7569/robotjs-iframe-polyfill.js">
```
## API
window.robotjs
 - pos
	 - node(element, site) : {x,y}
	 - textNode(element, offset) : {x,y}
 - wrapper → https://github.com/octalmage/robotjs/wiki/Syntax
 - fullscreen
	 - enable() : promise
	 - disable() : promise
	 - toggle() : promise
	 - is() : promise
 - started - promise
