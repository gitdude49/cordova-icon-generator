#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var sharp = require("sharp");

var argv = require('yargs')
    .usage('Usage: $0 -s <source image> -o <output directory>')
    .alias('s', 'source')
    .alias('o', 'output')
    .demand(['s', 'o'])
    .argv;

var sourceFile = argv.source;
var destDir = argv.output;

if (!checkFile(sourceFile)) {
    console.log(`Error: source file (${sourceFile}) not found.`);
    return 1;
};

//Check/create dest dir
if (!checkDirectory(destDir)) {
    fs.mkdirSync(destDir);
};

var images = [
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
    ['ios', 'icon-50.png', 50],
    ['ios', 'icon-50@2x.png', 100],
    ['ios', 'icon-83.5@2x.png', 167],

    ['android', 'ldpi.png', 36],
    ['android', 'mdpi.png', 48],
    ['android', 'hdpi.png', 72],
    ['android', 'xhdpi.png', 96],
    ['android', 'xxhdpi.png', 144],
    ['android', 'xxxhdpi.png', 192]
];

images.forEach(function(image) {
    var destDirPlatform = path.join(destDir, image[0]);
    if (!checkDirectory(destDirPlatform)) {
        fs.mkdirSync(destDirPlatform);
    };
    var destFile = path.join(destDirPlatform, image[1]);
    var size = image[2];
    console.log(`generating image '${destFile}' with size ${size}x${size}`);

    //Note: generating the images is async. If we did nice code we would wait...
    sharp(sourceFile)
    .resize(size)
    .toFile(destFile, function (err, info) {
        if (err) {
            console.log(`Error while processing image: ${err}`, err);
            return 1;
        }
    });
});

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
