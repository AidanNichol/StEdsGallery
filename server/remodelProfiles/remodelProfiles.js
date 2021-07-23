const _ = require("lodash");
const jetpack = require("fs-jetpack");
const Jimp = require("jimp");
const { profile } = require("console");
const { cleanupImage } = require("./cleanupImage");
const { rebaseProfile } = require("./rebaseProfile");
const { addMilageScale } = require("./addMilageScale");
const { addElevationScale } = require("./addElevationScale");
const walkdata = "/Users/aidan/Websites/htdocsC/walkdata";

async function remodelProfiles(walkNo, routes) {
  // let dist=0;
  try {
    let maxDist = 0;
    let maxElev = 0;
    let minElev = 99999;
    let trace = [];
    // await jetpack.write("profileData.json", JSON.stringify(routes));
    const libdir = `${walkdata}/${walkNo.substr(0, 4)}/${walkNo}`;
    for (const route of routes) {
      // route.minElev = FindProfileBase(walkNo, $no, route.minElev, route.maxElev);

      maxDist = Math.max(maxDist, route.dist);
      maxElev = Math.max(route.maxElev, maxElev);
      minElev = Math.min(route.minElev, minElev);
      let elev = route.maxElev - route.minElev;
      // if ($elev > maxElev) {
      //     maxElev = $elev;
      // }

      trace.push(
        `no:${route.no} ${elev} ${route.minElev}ft    ${route.maxElev}ft`
      );
    }
    // let pxPerFt = 200 / (maxElev - minElev);
    // let pxPerMile = 1000 / maxDist;
    // let pxPerFt = Math.min(0.05, 200 / (maxElev - minElev));
    let pxPerFt = 12 / 100;
    let pxPerMile = Math.min(45, 720 / (maxDist / 1000));
    //$pxPerFt = 0.30;
    //$pxPerMile = 45;
    trace.push(
      `Dist: ${maxDist}mi ${pxPerMile}px/mi Elevation:${maxElev}ft ${pxPerFt}px/ft`
    );
    //$walkdate="2009-10-17";
    for (const route of routes) {
      let no = route.no;
      //   let fil3P = `${libdir}/profile-${walkNo}-walk-${no}`;
      let fil = `${libdir}/profile-${walkNo}-walk-${no}.bmp`;
      let img = await Jimp.read(fil);

      let fil2 = `${libdir}/profile-${walkNo}-walk-${no}.jpg`;
      await cleanupImage(img);
      //   await img.writeAsync("./testimg2.png");
      route.minElev = rebaseProfile(img, route.minElev, route.maxElev);
      // calculate the scale and resize the profile
      let elev = route.maxElev - route.minElev;
      trace.push(`${no}: ${elev} ${route.maxElev} ${route.minElev}`);
      let pxHt = Math.round(elev * pxPerFt);
      let pxWd = Math.round(route.dist * pxPerMile);
      await img.resize(pxWd, pxHt);
      //   await img.writeAsync("./testimg3.png");
      let pad = { t: 8, b: 20, l: 45, r: 14 };
      let img2 = await new Jimp(
        pxWd + pad.l + pad.r,
        pxHt + pad.t + pad.b,
        0xffffffff
      );
      //   await img2.writeAsync("./testimg4.png");
      await img2.composite(img, pad.l, pad.t);
      //   await img2.writeAsync("./testimg4.png");
      await addMilageScale(img2, route.dist, pad, pxPerMile, no);
      await addElevationScale(img2, route, pad, pxPerFt, no);
      // await img2.writeAsync(`./testimg4-${no}.png`);

      // add the border back on to give room for the scales
      img2.write(fil2);
      // imagedestroy($im2);
    }
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
}
module.exports = { remodelProfiles };
