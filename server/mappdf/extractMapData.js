const { jsPDF } = require("jspdf"); // will automatically load the node version
const jetpack = require("fs-jetPack");
const _ = require("lodash");
const { deLetterMapCoords } = require("./Os_Coords");
const { generateGpxRouteFile } = require("./generateGpxRouteFile");
const { getFeatures } = require("./findFeatures");

const db = require("../walkDB");
const parseName = /([^*]+?)([*]?)(\-([LRTBCAXY.+\-\d]+))?$/;
const match = "West Witton -RA45".match(parseName);
let convDist = { ft: 1, yds: 3, Mi: 3 * 1760 };
console.log(match);

const fract = ["", "¼", "½", "¾"];
const showDist = (dist) => {
	let d = Math.round(dist * 4);
	return `${Math.floor(d / 4)}${fract[d % 4]} Mi`;
};

const walkdataDir = "/Users/aidan/Websites/htdocsC/walkdata";
async function extractMapData(walkNo, walkData) {
	let year = walkNo.substr(0, 4);
	const walkDir = jetpack.cwd(`${walkdataDir}/${year}/${walkNo}`);
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
		features: [],
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

	gpxSumm = {};
	for (let no = 1; no <= 5; no++) {
		// console.log(
		//   "route path",
		//   `${walkdata}/${year}/${walk}/data-${walk}-walk-${no}.json`
		// );
		const rt = walkDir.read(`data-${walk}-walk-${no}.json`, "json");
		let lastPt = 0;
		let minElev = 99999;
		let maxElev = 0;
		let minLat = 9999999;
		let maxLat = 0;
		let minLng = 9999999;
		let maxLng = 0;
		let start;
		let end;

		let distance = parseInt(rt.wData.dist.match(/(\d+)+ /)[1]);
		let mdistance = parseInt(rt.wData.mdist.match(/(\d+)+ /)[1]);
		let ascent = parseInt(rt.wData.ascent.match(/(\d+)+ /)[1]);
		let descent = parseInt(rt.wData.descent.match(/(\d+)+ /)[1]);
		let segPts = [];
		let x0;
		let y0;
		let distFt = 0;
		let distM = 0;
		let segDist = 0;
		for (let i = 0; i < rt.wp.length; i++) {
			const wp = rt.wp[i];
			let { x, y, lat, lon, eastings, northings } = deLetterMapCoords(wp.pos);

			if (i > 0) {
				let legDist = Math.sqrt((x - x0) * (x - x0) + (y - y0) * (y - y0));
				distM += legDist;
				segDist += legDist;
			}
			[x0, y0] = [x, y];
			let match = wp.dist.match(/(\d+)+ (.*)/);
			let [, dist, unit] = wp.dist.match(/(\d+)+ (.*)/);
			if (!/yds|ft|Mi/.test(unit)) {
				console.log(dist, unit);
			}
			distFt += parseFloat(dist) * convDist[unit];
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
			// console.log("wpname", wp.name);
			let [, name, segPt, , shift = ""] = wp.name.match(parseName);
			segPt = /WP99/i.test(wp.name) ? "*" : segPt;
			// console.log({ name, segPt, shift });
			if (isStart || isEnd || segPt) segPts.push(name);
			if (wp.name.includes("Witton")) {
				let name2 = name;
			}
			wp.name = name;
			if (!/WP\d+/i.test(name) || (segPt && map.showSegNames)) {
				map.names[name] = { x, y, shift, start: isStart, end: isEnd };
			}

			if (segPt) map.segPoints.add({ x, y });
			if ((segPt || i === rt.wp.length - 1) && i !== lastPt) {
				let segName = _.sortBy([rt.wp[lastPt].name, wp.name]).join("-");
				let seg = map.segments[segName];
				if (!seg) {
					map.segments[segName] = {
						wps: rt.wp.slice(lastPt, i + 1),
						walks: [no],
						segDist: { [no]: segDist },
					};
				} else {
					if (!seg.walks.includes(no)) {
						seg.walks.push(no);
						seg.segDist[no] = segDist;
					}
				}
				segDist = 0;
				lastPt = i;
			}
		}
		let newDistance = distFt / (3 * 1760);
		distance = distM * 0.621371;
		rt.wData.dist = showDist(distance);
		map.walks.push(rt.wData);
		let gpxFile = `data-${walk}-walk-${no}.gpx`;
		let gpxData = generateGpxRouteFile(walkNo, no, map.area, rt.wp);
		await walkDir.write(gpxFile, gpxData);
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
			if (_.keys(rChanges.length > 0)) {
				await db.route.update(route, { where: { date: walkNo, no: route.no } });
			}
		} else await db.route.create(route);
	}
	const rt = walkDir.write(`data-${walk}-walk-gpx.json`, gpxSumm);
	map.features = await getFeatures(walkDir, map);

	return map;
}
module.exports = { extractMapData };
