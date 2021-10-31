const jetpack = require("fs-jetPack");
const _ = require("lodash");
const { deLetterMapCoords } = require("./Os_Coords");
let features = [];
function extractFeatures(obj) {
  features = [];
  let ext,
    wps = obj.wp;
  ["name", "line", "area", "point"].forEach((type) => {
    do {
      [ext, wps] = findFeature(wps, type);
    } while (ext);
  });
  // 
  // console.log(features)
  features = _.sortBy(features, 'type')
  return features;
}
const findEnd = (wp, i, fn) => {
  let end = _.findIndex(wp, fn, i + 1);
  if (end >= 0) return end - i + 1;
  let fn2 = (p) => !/^WP\d*/i.test(p.name)
  console.log('End not found', wp[i].name)
  end = _.findIndex(wp, fn2, i + 1);
  if (end >= 0) return end - i;
  return wp.length - i - 1;
}
const getBearing = (wp, i) => {
  wp[i].dist = wp[i + 1].dist;
  wp[i].bear = wp[i + 1].bear;
  return 1;
}
const featCount = {
  name: getBearing,
  line: (wp, i) => findEnd(wp, i, (p) => /^end/i.test(p.name)),
  area: (wp, i) => findEnd(wp, i, (p) => p.pos === wp[i].pos),
  point: getBearing,
};
const findFeature = (wp, type) => {
  let re = new RegExp(`^${type}`, "i");
  let i = _.findIndex(wp, (p) => re.test(p.name));
  if (i < 0) return [null, wp];
  let [, klass, ...rest] = wp[i].name.split(" ");

  let del = featCount[type](wp, i);
  let colors = getColors(type, _.toLower(klass));
  let pts = wp.splice(i, del,);
  // let text = getTextData(pts[0], rest)
  pts = pts.map((pt) => getXY(pt))
  let text2 = /point|name/i.test(type) ? getText(type, rest, pts[0], getXY(wp[i])) : {};
  // let path = getPath(type, wps, m);
  let feature = { type, pts, ...colors, ...text2 }
  let feature2;
  let extLine = extractLineFromArea(pts);
  if (extLine) {
    feature2 = { type: 'line', pts: extLine, stroke: colors.stroke }
    delete feature.stroke;
  }
  features.push(feature);
  if (feature2) features.push(feature2);
  return [pts, wp];
};
const getXY = (pt) => {
  let { x, y } = deLetterMapCoords(pt.pos);
  return { x, y, name: pt.name }
}
const extractLineFromArea = (pts) => {
  let i = _.findIndex(pts, p => /WP.*!$/i.test(p.name))
  if (i < 0) return null;
  let start = _.slice(pts, 0, i)
  let j = _.findIndex(pts, p => !/WP.*!$/i.test(p.name), i + 1);
  let end = j >= 0 ? _.slice(pts, j) : [];
  return [...end, ...start]
}
const getText = (type, rest, { x: x1, y: y1 }, { x: x2, y: y2 }) => {
  if (type !== "name") return {};
  let text = rest.join(" ");

  let dX = x2 - x1;
  let dY = y2 - y1;
  let len = Math.sqrt(dX * dX + dY * dY);
  let rad = Math.atan2(dY, dX);
  let angle = (rad * 180) / Math.PI;
  return { text, len, angle };
};
const strokeColor = {
  aroad: [255, 0, 0],
  broad: [164, 42, 42],
  hill: [206, 132, 64],
  place: [75, 0, 130],
  water: [178, 202, 246],
};
const fillColor = {};

function getColors(type, mode) {
  let fill = null;
  let stroke = /$#/.test(mode) ? [mode] : strokeColor[mode] || [0, 0, 0];
  if (type === `area`) {
    fill = fillColor[mode];
    if (!fill) {
      fill = stroke.map((c) => c + (255 - c) * 0.5);
    }
  }
  return { stroke, fill };
}
module.exports = { extractFeatures };
