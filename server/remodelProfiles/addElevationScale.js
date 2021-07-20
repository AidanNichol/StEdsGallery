const Jimp = require("jimp");
let black = 0x000000ff;
let grey = 0x808080ff;
let blue = 0x000080ff;
let green = 0x00ff00ff;
let cyan = 0x00ffffff;

async function addElevationScale(img, { minElev, maxElev }, pad, pxPerFt, no) {
  let font = await Jimp.loadFont(Jimp.FONT_SANS_8_BLACK);
  let wd = img.bitmap.width;
  let ht = img.bitmap.height;
  const pxPer100Ft = 100 * pxPerFt;

  // add horizontal elevation lines and new elevation scale
  // await img.print(font, x1, y1, i === 0 ? "mi" : i, black);
  let elev1 = 100 - (minElev % 100);
  let start = Math.ceil(minElev / 100);
  let pos = ht - pad.b + (minElev % 100) * pxPerFt - pxPer100Ft;
  let lineInt = 100;
  let ftInt = 2;
  let elev = maxElev - minElev;
  let end = Math.ceil(maxElev / 100);
  for (let i = start; i < end; i += 1) {
    // y = Math.round(base - i * pxPer100Ft);
    let clr = i === 0 ? black : (i - 1) % ftInt === 0 ? grey : green;
    imageLine(img, pad.l - 4, pos, wd - pad.r - pad.l + 6, clr);
    const text = `${i * 100} ft`;
    // const textWd = await Jimp.measureText(Jimp.FONT_SANS_10_BLACK, text);
    // const textHt = await Jimp.measureTextHeight(Jimp.FONT_SANS_32_BLACK, text, 100);
    if (i % ftInt === 1) {
      let font = await Jimp.loadFont(Jimp.FONT_SANS_10_BLACK);

      await img.print(font, 5, pos - 6, text);
    }
    pos -= pxPer100Ft;
    if (pos < 6) break;
  }
  // await img.print(font, 18, ht - 12, "ft", black);
}
const imageLine = (img, x, y, len, color) => {
  for (let j = 0; j < len; j++) {
    if (j % 6 > 2) continue;
    img.setPixelColor(color, x + j, y);
  }
};
module.exports = { addElevationScale };
