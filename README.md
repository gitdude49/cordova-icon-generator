# cordova-icon-generator
Node.js script to generate icons (iOS &amp; Android) for Cordova.

The images sizes & filenames to be generated are hardcoded in this script.

Reference: [Cordova documentation: Customize Icons](https://cordova.apache.org/docs/en/latest/config_ref/images.html)

Feed this script an image (preferably high-resolution and rectangular) and it will generate the Icon images
Cordova recommends for iOS and Android platform.

Required parameters:
- -s (or --source): the source image
- -o (or --output): the destination folder

Optional parameters:
- -t (or --targets): filter the platform targets (ios|android)
- -r (or --round): create rounded corners

