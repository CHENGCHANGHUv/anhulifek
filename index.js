'use strict';

var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var gutil = require('gulp-util');
var through = require('through2');

function sha1(filePath) {
	return crypto.createHash('md5')
		.update(fs.readFileSync(filePath))
		.digest("hex");
}

module.exports = function (options) {
	var contents, mainPath, reg, asset;

	asset = options.asset || process.cwd();

	reg = new RegExp('["\'\\(]\\s*([\\w\\_\/\\.\\-]*\\.('+ (options.exts ? options.exts.join('|') : 'jpg|jpeg|png|gif|cur|js|css') +'))(\\?[\\w\\_\\=\\-]+)?\\s*[\\)"\']', 'gim');

	return through.obj(function (file, enc, callback) {
		if (file.isNull()) {
			this.push(file);
			return callback();
		}

		if (file.isStream()) {
			this.emit('error', new gutil.PluginError('gulp-static-hash', 'Streams are not supported!'));
			return callback();
		}

		mainPath = path.dirname(file.path);

		contents = file.contents.toString().replace(reg, function(content, filePath, ext, version){
			var fullPath

			if(/^\//.test(filePath)){
				fullPath = path.resolve(asset, filePath.slice(1));
			}else{
				fullPath = path.resolve(asset, mainPath, filePath);
			}

			if(fs.existsSync(fullPath)){
				return content.replace(version || '', (/sv/.test(version) ? ('&sv=' + version.split('=')[1]) : '')).replace(filePath, filePath + '?v=' + sha1(fullPath));
			}else{
				return content;
			}
		});

		file.contents = new Buffer(contents);

		this.push(file);
		return callback();
	});
};