module.exports = function(app, serve,minify) {
	var fs = require('fs');
	var uglify = require('uglify-js');
	var name;

	for (name in serve.files) {
		var file = serve.files[name];
		app.get('/'+name+".js", _load(file));
		console.log("server:","serve", '/'+name+".js");
		if(minify) {
			console.log("server:","minify",name);
			app.get('/'+name+".min.js", _min(file));
			console.log("server:","serve", '/'+name+".min.js");
		}
	}

	for (name in serve.multis) {
		var multi = serve.multis[name];
		multi.content = "";
		for (var i = 0; i < multi.files.length; i++) {
			multi.content += serve.files[multi.files[i]].content;
			if(minify) {
				multi.min_content += serve.files[multi.files[i]].min_content;
			}
		}
		app.get('/'+name+".js",  _answer(multi.content));
		console.log("server:","serve", '/'+name+".js");
		if(minify) {
			app.get('/'+name+".min.js",  _answer(multi.min_content));
			console.log("server:","serve", '/'+name+".min.js");
		}
	}

	function _load(file) {
			file.content = fs.readFileSync(file.path, 'utf8').toString();
			return _answer(file.content);
	}

	function _min(file) {
		file.min_content = uglify.minify(file.content, {fromString: true}).code;
		return _answer(file.min_content);
	}

	function _answer(content) {
		return function(req, res) {
			res.setHeader('Content-Type', 'application/javascript');
			res.writeHead(200);
			res.end(content);
		};
	}
};
