#!/usr/bin/env node
require('events').EventEmitter.defaultMaxListeners = 0;

///////////////////////////////////////////////////////////////////////
var fs = require("fs");
var path = require("path");
var sharp = require("sharp");
var rimraf = require("rimraf");
var mkdirp = require("mkdirp");

///////////////////////////////////////////////////////////////////////

var argv = require('yargs')
  .usage('Usage: $0 -s <source image> -o <output directory> -ai <android icon name> [-r] [-f]')
  .alias('s', 'source')
  .alias('o', 'output')
  
  .alias('r', 'round')
  .describe('round', 'Create rounded corners.')

  .alias('i', 'android-icon')
  .describe('android-icon', 'Specify Android icon name (default is "icon.png").')
  
  .alias('f', 'force')
  .boolean('f')
  .describe('force', 'Force deleting an existing output directory.')
  
  .alias('t', 'targets')
  .array('targets')
  .default('targets', ['ios', 'android'])
  .describe('targets', 'Specify the platform targets (ios|android)')
  
  .demand(['s', 'o'])
  
  .argv;

var sourceFile = argv.source;
var destDir = argv.output;
var force = argv.force;
var roundCorners = argv.round;
var androidFileName = argv["android-icon"] || "icon";
var targets = argv.targets;


///////////////////////////////////////////////////////////////////////

var imageTargets = [
  ['ios', 'icon-60@3x.png', 180],
  ['ios', 'icon-60.png', 60],
  ['ios', 'icon-60@2x.png', 120],
  ['ios', 'icon-76.png', 76],
  ['ios', 'icon-76@2x.png', 152],
  ['ios', 'icon-40.png', 40],
  ['ios', 'icon-40@2x.png', 80],
  ['ios', 'icon.png', 57],
  ['ios', 'icon@2x.png', 114],
  ['ios', 'icon-72.png', 72],
  ['ios', 'icon-72@2x.png', 144],
  ['ios', 'icon-small.png', 29],
  ['ios', 'icon-small@2x.png', 58],
  ['ios', 'icon-small@3x.png', 87],
  ['ios', 'icon-50.png', 50],
  ['ios', 'icon-50@2x.png', 100],
  ['ios', 'icon-83.5@2x.png', 167],

  ['android', 'mipmap-ldpi/$$ICON$$.png', 36],
  ['android', 'mipmap-mdpi/$$ICON$$.png', 48],
  ['android', 'mipmap-hdpi/$$ICON$$.png', 72],
  ['android', 'mipmap-xhdpi/$$ICON$$.png', 96],
  ['android', 'mipmap-xxhdpi/$$ICON$$.png', 144],
  ['android', 'mipmap-xxxhdpi/$$ICON$$.png', 192]
];

var images = [];

targets.forEach((target) => {
  if (target !== 'ios' && target !== 'android') {
    throw new Error(`Invalid target specified "${target}". Valid targets are (ios|android).`);
  }

  images = images.concat(imageTargets.filter((x) => x[0] === target));

  // Ensure a clean start

  var directory = path.join(destDir, target);

  if (checkDirectory(directory) && !argv.force) {
    console.log(`Error: output folder (${directory}) already exists (and -f option not used).`);
    process.exit(1);
  }
  rimraf.sync(directory);
  mkdirp.sync(directory);
});

///////////////////////////////////////////////////////////////////////

if (!checkFile(sourceFile)) {
  console.log(`Error: source file (${sourceFile}) not found.`);
  return 1;
};

///////////////////////////////////////////////////////////////////////

var pipeline = sharp(sourceFile).metadata((err, meta) => {

  if (err) {
    console.error(`Error while reading \"${sourceFile}\"`, err);
    return 1;
  }

  if (meta.width !== meta.height) {
    console.error('Source file is not square.');
    return 1;
  }

  if (roundCorners) {
    // http://stackoverflow.com/questions/31255291/android-launcher-icon-rounded-corner-edge-radii#
    // https://material.io/guidelines/style/icons.html#icons-system-icons
    // 8.33%
    let radius = meta.width * 0.0833;
    let svgBuffer = new Buffer(
      `<svg><rect x="0" y="0" width="${meta.width}" height="${meta.height}" rx="${radius}" ry="${radius}"/></svg>`
    );
    pipeline = pipeline.overlayWith(svgBuffer, { cutout: true });
  }

  pipeline.toBuffer((err, sourceBuffer) => {

    if (err) {
      console.error(`Error constructing in-memory buffer of \"${sourceFile}\"`, err);
      return 1;
    }

    images.forEach(function (image) {
      var destDirPlatform = path.join(destDir, image[0]);
      if (!checkDirectory(destDirPlatform)) {
        fs.mkdirSync(destDirPlatform);
      };
      
	  image[1] = image[1].replace(/\$\$ICON\$\$/g, androidFileName);
	  
	  if (image[1].indexOf("/")) {
		  var imagePath = image[1].split("/");
		  for (var i=0;i<imagePath.length-1;i++) {
			if (!checkDirectory(path.join(destDirPlatform, imagePath[i]))) {
				fs.mkdirSync(path.join(destDirPlatform, imagePath[i]));
				destDirPlatform = path.join(destDirPlatform, imagePath[i]);
			};
		  }
		  var destFile = path.join(destDirPlatform, imagePath[imagePath.length-1]);
	  }
	  else {
		  if (!checkDirectory(destDirPlatform)) {
			fs.mkdirSync(destDirPlatform);
		  };
		  
		  var destFile = path.join(destDirPlatform, image[1]);
	  }
      var size = image[2];
      console.log(`generating image '${destFile}' with size ${size}x${size}`);

      sharp(sourceBuffer)
        .resize(size)
        .toFile(destFile, function (err, info) {
          if (err) {
            console.log(`Error while processing image: ${err}`, err);
            return 1;
          }
        });
    });
  });
});

///////////////////////////////////////////////////////////////////////

function checkDirectory(dir) {
  try {
    var stat = fs.statSync(dir);
    return stat.isDirectory();
  } catch (error) {
    return false;
  };
};

function checkFile(file) {
  try {
    var stat = fs.statSync(file);
    return stat.isFile();
  } catch (error) {
    return false;
  };
};
