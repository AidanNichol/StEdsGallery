const { jsPDF } = require("jspdf"); // will automatically load the node version
const jetpack = require("fs-jetPack");
const _ = require("lodash");
const { deLetterMapCoords } = require("./Os_Coords");
const db = require("../walkDB");

function extractMapData(walkNo, walkData) {
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

  const { legend = "TL", top, bottom, left, right, area, region } = walkData;
  map.legend = legend;
  map.top = top;
  map.bottom = bottom;
  map.left = left;
  map.right = right;
  map.area = area;
  map.regName = region.regname;
  let walk = map.walk;
  let year = walk.substr(0, 4);
  for (let walkNo = 1; walkNo <= 5; walkNo++) {
    console.log(
      "route path",
      `${walkdata}/${year}/${walk}/data-${walk}-walk-${walkNo}.json`
    );
    const rt = jetpack.read(
      `${walkdata}/${year}/${walk}/data-${walk}-walk-${walkNo}.json`,
      "json"
    );
    let lastPt = 0,
      minElev = 99999,
      maxElev = 0;
    map.walks.push(rt.wData);
    let dist = parseInt(rt.wData.dist.match(/(\d+)+ /)[1]);

    for (let i = 0; i < rt.wp.length; i++) {
      const wp = rt.wp[i];
      const { x, y } = deLetterMapCoords(wp.pos);
      const start = i === 0;
      const end = i === rt.wp.length - 1;
      let elev = parseInt(wp.elev.match(/(\d+)+ /)[1]);
      minElev = Math.min(minElev, elev);
      maxElev = Math.max(maxElev, elev);

      wp.x = x;
      wp.y = y;
      map.setMapMinMax(wp);
      if (start) map.starts.add({ x, y });
      if (end) map.ends.add({ x, y });
      const [, name, endPt, , shift = ""] = wp.name.match(
        /([^*]+?)([*]?)(\-(.*))?$/
      );
      wp.name = name;
      if (!/WP\d+/i.test(name)) map.names[name] = { x, y, shift, start, end };
      if (endPt) map.segPoints.add({ x, y });
      if ((endPt || i === rt.wp.length - 1) && i !== lastPt) {
        let segName = _.sortBy([rt.wp[lastPt].name, wp.name]).join("-");
        let seg = map.segments[segName];
        if (!seg) {
          map.segments[segName] = {
            wps: rt.wp.slice(lastPt, i + 1),
            walks: [walkNo],
          };
        } else {
          seg.walks.push(walkNo);
        }
        lastPt = i;
      }
    }
    map.routes.push({ no: rt.wData.no, dist, minElev, maxElev });
  }
  return map;
}
module.exports = { extractMapData };
