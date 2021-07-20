const _ = require("lodash");
const jetpack = require("fs-jetpack");
const Jimp = require("jimp");
const { profile } = require("console");
const walkdata = "/Users/aidan/Websites/htdocsC/walkdata";

async function cleanupImage(img) {
  let white = 0xffffffff;
  let black = 0x000000ff;
  let blue = 0x0000ffff;
  let green = 0xbdffb8ff;
  let grey = 0x808080ff;
  const showColor = (x, y) => Jimp.intToRGBA(img.getPixelColor(x, y));

  // crop the existing white space borders and labling
  let wd = img.bitmap.width - 1 - 61;
  let ht = img.bitmap.height - 29 - 8;
  img = await img.crop(61, 8, wd, ht);

  wd = img.bitmap.width;
  ht = img.bitmap.height;

  // fix bottom border
  await img.scan(0, ht - 1, wd, 1, function (x, y, idx) {
    img.setPixelColor(black, x, y);
  });
  // await img.writeAsync("./testimg1.png");
  // fix left side
  await img.scan(0, 0, 1, ht, function (x, y, idx) {
    if (img.getPixelColor(x, y) === blue) img.setPixelColor(black, x, y);
  });
  // fix right side
  await img.scan(wd - 1, 0, 1, ht, function (x, y, idx) {
    if (img.getPixelColor(x, y) === blue) img.setPixelColor(black, x, y);
  });
  // remove the blue lines at waypoints
  await img.scan(0, 0, wd, ht, function (x, y, idx) {
    let clr2 = img.getPixelColor(x, y);
    if (img.getPixelColor(x, y) === blue) img.setPixelColor(green, x, y);
  });

  // await img.writeAsync("./testimg2.png");
  // remove the grey horizontal lines at height markers
  await img.scan(0, 0, wd, ht, function (x, y, idx) {
    if (img.getPixelColor(x, y) === grey) {
      if (img.getPixelColor(x, y - 1) === img.getPixelColor(x, y + 1))
        img.setPixelColor(img.getPixelColor(x, y - 1), x, y);
      else if (img.getPixelColor(x, y - 1) === white) {
        if (img.getPixelColor(x, y + 1) === black)
          img.setPixelColor(white, x, y);
        if (img.getPixelColor(x, y + 1) === green)
          img.setPixelColor(black, x, y);
      } else if (img.getPixelColor(x, y - 1) === black) {
        img.setPixelColor(green, x, y);
      }
    }
  });
  // await img.writAsync("./testimg2.png");
  return;
}
module.exports = { cleanupImage };
