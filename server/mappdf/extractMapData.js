const { jsPDF } = require("jspdf"); // will automatically load the node version
const jetpack = require("fs-jetPack");
const _ = require("lodash");
const { deLetterMapCoords } = require("./Os_Coords");
const { generateGpxRouteFile } = require("./generateGpxRouteFile");
const db = require("../walkDB");
const parseName = /([^*]+?)([*]?)(\-([LRTBC]+))?$/;
const match = "West Witton -R".match(parseName);
console.log(match);
async function extractMapData(walkNo, walkData) {
  const walkdata = "/Users/aidan/Websites/htdocsC/walkdata";
  let map = {
    walk: walkNo,
    walks: [],
    minX: 999999,
    minY: 999999,
    maxX: 0,
    maxY: 0,
    get rangeX() {
      return this.maxX - this.minX;
    },
    get rangeY() {
      return this.maxY - this.minY;
    },
    margin: 10,
    scale: 0,
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    topZero: 0,
    leftZero: 0,
    starts: new Set(),
    ends: new Set(),
    segPoints: new Set(),
    segments: {},
    routes: [],
    names: {},
    orientation: "P",
    showSegNames: 0,
    header: "T",
    legend: "TL",
    x(cx, dx = 0) {
      return this.leftZero + cx * this.scale + dx;
    },
    y(cy, dy = 0) {
      return this.topZero + cy * this.scale + dy;
    },
    px(cx, dx = 0) {
      return this.x(cx - this.minX, dx);
    },
    py(cy, dy = 0) {
      return this.y(this.maxY - cy, dy);
    },
    setMapMinMax(wp) {
      this.minX = Math.min(this.minX, Math.floor(wp.x));
      this.maxX = Math.max(this.maxX, Math.ceil(wp.x));
      this.minY = Math.min(this.minY, Math.floor(wp.y));
      this.maxY = Math.max(this.maxY, Math.ceil(wp.y));
    },
  };
  const {
    legend = "TL",
    top,
    bottom,
    left,
    right,
    area,
    region,
    showSegNames,
  } = walkData;
  map.legend = legend;
  map.top = top;
  map.bottom = bottom;
  map.left = left;
  map.right = right;
  map.area = area;
  map.regName = region.regname;
  map.showSegNames = showSegNames;
  let walk = map.walk;
  let year = walk.substr(0, 4);
  gpxSumm = {};
  for (let no = 1; no <= 5; no++) {
    // console.log(
    //   "route path",
    //   `${walkdata}/${year}/${walk}/data-${walk}-walk-${no}.json`
    // );
    const rt = jetpack.read(
      `${walkdata}/${year}/${walk}/data-${walk}-walk-${no}.json`,
      "json"
    );
    let lastPt = 0,
      minElev = 99999,
      maxElev = 0;
    let minLat = 9999999,
      maxLat = 0,
      minLng = 9999999,
      maxLng = 0;
    let start, end;
    map.walks.push(rt.wData);
    let distance = parseInt(rt.wData.dist.match(/(\d+)+ /)[1]);
    let mdistance = parseInt(rt.wData.mdist.match(/(\d+)+ /)[1]);
    let ascent = parseInt(rt.wData.ascent.match(/(\d+)+ /)[1]);
    let descent = parseInt(rt.wData.descent.match(/(\d+)+ /)[1]);
    let segPts = [];
    for (let i = 0; i < rt.wp.length; i++) {
      const wp = rt.wp[i];
      let { x, y, lat, lon, eastings, northings } = deLetterMapCoords(wp.pos);
      const isStart = i === 0;
      const isEnd = i === rt.wp.length - 1;
      let elev = parseInt(wp.elev.match(/(\d+)+ /)[1]);
      minElev = Math.min(minElev, elev);
      maxElev = Math.max(maxElev, elev);
      minLat = Math.min(minLat, eastings);
      maxLat = Math.max(maxLat, eastings);
      minLng = Math.min(minLng, northings);
      maxLng = Math.max(maxLng, northings);
      wp.northings = northings;
      wp.eastings = eastings;
      x = x / 1000;
      y = y / 1000;
      wp.x = x;
      wp.y = y;
      wp.lat = lat;
      wp.lon = lon;
      map.setMapMinMax(wp);
      if (isStart) {
        map.starts.add({ x, y });
        start = [wp.eastings, wp.northings];
      }
      if (isEnd) {
        map.ends.add({ x, y });
        end = [wp.eastings, wp.northings];
      }
      const [, name, segPt, , shift = ""] = wp.name.match(parseName);
      if (isStart || isEnd || segPt) segPts.push(name);
      if (wp.name.includes("Witton")) {
        let name2 = name;
      }
      wp.name = name;
      if (!/WP\d+/i.test(name) || (segPt && map.showSegNames))
        map.names[name] = { x, y, shift, start: isStart, end: isEnd };

      if (segPt) map.segPoints.add({ x, y });
      if ((segPt || i === rt.wp.length - 1) && i !== lastPt) {
        let segName = _.sortBy([rt.wp[lastPt].name, wp.name]).join("-");
        let seg = map.segments[segName];
        if (!seg) {
          map.segments[segName] = {
            wps: rt.wp.slice(lastPt, i + 1),
            walks: [no],
          };
        } else {
          if (!seg.walks.includes(no)) seg.walks.push(no);
        }
        lastPt = i;
      }
    }
    let gpxFile = `${walkdata}/${year}/${walk}/data-${walk}-walk-${no}.gpx`;
    let gpxData = generateGpxRouteFile(walkNo, no, map.area, rt.wp);
    await jetpack.write(gpxFile, gpxData);
    let rSumm = {
      minLat,
      maxLat,
      minLng,
      maxLng,
      start,
      end,
      cent: [(minLat + maxLat) / 2, (minLng + maxLng) / 2],
    };
    gpxSumm[no] = rSumm;
    map.routes.push({
      no: rt.wData.no,
      dist: distance,
      minElev,
      maxElev,
      segPts,
    });
    const currR = await db.route.findOne({ where: { date: walk, no } });
    let route = { date: walk, no, distance, mdistance, ascent, descent };
    if (currR) {
      const rChanges = _.pickBy(route, (value, key) => value !== currR[key]);
      if (_.keys(rChanges.length > 0))
        await db.route.update(route, { where: { date: walkNo, no: route.no } });
    } else await db.route.create(route);
  }
  const rt = jetpack.write(
    `${walkdata}/${year}/${walk}/data-${walk}-walk-gpx.json`,
    gpxSumm
  );
  return map;
}
module.exports = { extractMapData };
