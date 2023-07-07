const Jimp = require("jimp");
const jetpack = require("fs-jetpack");
// Add a picture to an album
async function add_picture(log, temp, filename, directory) {
  let galleryDir = `${process.env.GALLERY_DATA}/${directory}`;
  let baseImage = `${galleryDir}/${filename}`;
  jetpack.dir(`gallery/${directory}`);
  if (jetpack.exists(temp) !== "file") log("ugh!", temp, jetpack.exists(temp));
  log({ galleryDir, baseImage, temp });
  let image;
  try {
    image = await Jimp.read(temp);

    let { width, height } = image.bitmap;
    if (jetpack.exists(baseImage) !== "file") {
      let ratio = Math.min(1280 / width, 1280 / height);

      // resize picture if it's bigger than the max width or height for uploaded pictures
      if (ratio < 1) {
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
        await image.clone().resize(width, Jimp.AUTO).writeAsync(baseImage);
      } else {
        await image.clone().writeAsync(baseImage);
      }
      log("newSize", { width, height, ratio });
    }
    log(`created ${baseImage}`);
    let srcset = ``;

    let [, file, ext] = filename.toLowerCase().match(/^(.+)\.(.*?)$/);

    for (const sz of [70, 350, 800]) {
      //   [800, 350, 70].forEach(async (sz) => {
      if (width < sz * 1.2) continue;
      // console.log("ext", image.getExtension());
      let picName = `${file}~${sz}.${ext}`;
      let newF = `${galleryDir}/${picName}`;
      if (jetpack.exists(newF) !== "file") {
        await image
          .clone()
          .resize(sz, sz === 70 ? 70 : Jimp.AUTO)
          .writeAsync(newF);

        log(`created ${newF}`);
      }
      console.log("created", newF);
      srcset = `${srcset}${directory}/${picName} ${sz}w, `;
    }
    jetpack.remove(temp);
    log(`removed ${temp}`);
    srcset = `${srcset}${directory}/${filename} ${width}w`;
    return { srcset, width, height };
  } catch (error) {
    log(error);
  }
}
module.exports = { add_picture };
