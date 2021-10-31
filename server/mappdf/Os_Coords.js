const _ = require("lodash");
const OSPoint = require("ospoint");

const gridLetters = {
  SH: [2, 3],
  SJ: [3, 3],
  SK: [4, 3],
  TF: [5, 3],
  TG: [6, 3],
  SD: [3, 4],
  SE: [4, 4],
  TA: [5, 4],
  NW: [1, 5],
  NX: [2, 5],
  NY: [3, 5],
  NZ: [4, 5],
  NR: [1, 6],
  NS: [2, 6],
  NT: [3, 6],
  NU: [4, 6],
};

const getMapCoords = (gridpos, minX, maxY) => {
  let [letters, west, north] = gridpos.split(" ");
  let x = gridLetters[letters][0] * 100000 + west;
  let y = gridLetters[letters][1] * 100000 + north;
  x = (x - minX) / 100;
  y = (maxY - y) / 100;
  return { x, y };
};
const deLetterMapCoords = (gridpos) => {
  let [letters, west, north] = gridpos.split(" ");
  let eastings = gridLetters[letters][0] * 100000 + parseInt(west);
  let northings = gridLetters[letters][1] * 100000 + parseInt(north);
  const point = new OSPoint(northings, eastings);
  let { latitude: lat, longitude: lon } = point.toWGS84();

  return { x: eastings / 1000, y: northings / 1000, lat, lon, eastings, northings };
};
const getGridLetters = (x1, y1) => {
  x = Math.floor(x1 / 100);
  y = Math.floor(y1 / 100);
  //print "x1:x1 y1:y1 x:x y:y \n";
  const [key] = _.find(
    _.toPairs(gridLetters),
    ([key, val]) => x === val[0] && y === val[1]
  ) || ["??"];

  return key || "??";
};

module.exports = { getMapCoords, deLetterMapCoords, getGridLetters };
