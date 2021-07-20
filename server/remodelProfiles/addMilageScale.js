const Jimp = require("jimp");
async function addMilageScale(img2, dist, pad, pxPerMile, no) {
  let wd = img2.bitmap.width;
  let ht = img2.bitmap.height;
  let black = 0x000000ff;
  let font = await Jimp.loadFont(Jimp.FONT_SANS_10_BLACK);

  // add new mileage scale
  for (let i = 0; i <= dist; i += 1) {
    let x = wd - pad.r - i * pxPerMile;
    let x2 = i > 9 ? 5 : i === 0 ? 5 : 3;
    let x1 = x - x2;
    let y1 = ht - pad.b + 0;
    // y1a = 100;
    await img2.print(font, x1, y1, i === 0 ? "mi" : i);
    for (let j = 0; j < 3; j++) {
      img2.setPixelColor(black, x, ht - pad.b + j);
    }
    // imageline(im2, x1, y1a, x1, y1a + 3, black);
  }
}
module.exports = { addMilageScale };
