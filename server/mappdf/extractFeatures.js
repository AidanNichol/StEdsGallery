const jetpack = require("fs-jetPack");
const _ = require("lodash");
const { deLetterMapCoords } = require("./Os_Coords");
const { namedColors } = require("./namedColors");
const { toLower, every } = require("lodash");
let features = [];
function extractFeatures(obj) {
	try {
		features = [];
		let ext;
		let wps = obj.wp;
		wps = wps.map((pt) => ({ ...pt, ...deLetterMapCoords(pt.pos) }));
		let Xs = wps.map((pt) => pt.x);
		let Ys = wps.map((pt) => pt.y);
		let minX = _.min(Xs);
		let minY = _.min(Ys);
		let maxX = _.max(Xs);
		let maxY = _.max(Ys);
		["color", "fill", "area", "rect", "line", "text", "name", "point"].forEach(
			(type) => {
				do {
					[ext, wps] = findFeature(wps, type);
				} while (ext);
			},
		);
		//
		// console.log(features)
		// features = _.sortBy(features, 'type')
		return { area: { minX, minY, maxX, maxY }, features };
	} catch (error) {
		console.log(error);
	}
}
const findEnd = (wp, i, fn) => {
	let end = _.findIndex(wp, fn, i + 1);
	if (end >= 0) return end - i + 1;
	let fn2 = (p) => !/^WP\d*/i.test(p.name);
	console.log("End not found", wp[i].name);
	end = _.findIndex(wp, fn2, i + 1);
	if (end >= 0) return end - i;
	return wp.length - i - 1;
};
const getBearing = (wp, i) => {
	wp[i].dist = wp[i + 1].dist;
	wp[i].bear = wp[i + 1].bear;
	return 1;
};
let localColors = {};
const getRect = (wp, i) => {
	wp[i].wd = wd[i + 1].x - wd[i].x;
	wp[i].ht = wd[i + 1].y - wd[i].y;
	return 1;
};
const getColor = (wp, i, klass, text) => {
	let [, name, namedColor] = wp[i].name.split(" ");
	localColors[name.toLowerCase()] = namedColor;
	return 1;
};
const getTextBlock = (wp, i, klass, text) => {
	let [, name, namedColor] = wp[i].name.split(" ");
	localColors[name.toLowerCase()] = namedColor;
	return 1;
};
const featCount = {
	// color: getColor,
	color: (wp, i, klass, text) => {
		localColors[klass] = text;
		return 1;
	},
	rect: () => 2,
	text: () => 1,
	name: getBearing,
	line: (wp, i) => findEnd(wp, i, (p) => /^end/i.test(p.name)),
	area: (wp, i) => findEnd(wp, i, (p) => p.pos === wp[i].pos),
	fill: (wp, i) => findEnd(wp, i, (p) => p.pos === wp[i].pos),
	point: getBearing,
};
const findFeature = (wps, type) => {
	let re = new RegExp(`^${type}`, "i");
	let i = _.findIndex(wps, (p) => re.test(p.name));
	if (i < 0) return [null, wps];
	// let parts=wp[i].name.split(/ +/);
	// if (parts[2] && /^[RFWAS\d.]+/.test(parts[2]))

	// name water what every
	// name water p8 a name
	// line water w2
	// area water
	let [, klass, style, text] = wps[i].name.match(
		/^\w+\s+(\w+)(?:\s+([RFWAS\d.]+))?(?:\s+(.*))?$/i,
	);
	console.log("feature", type, klass, style, text);
	klass = klass.toLowerCase();
	let del = featCount[type](wps, i, klass, text);
	let colors = getColors(type, _.toLower(klass));
	let pts = wps.splice(i, del);
	pts = pts.map((pt) => _.pick(pt, ["x", "y", "name"]));
	// pts = pts.map((pt) => getXY(pt))
	let extraData = /^point|name|text/i.test(type)
		? getTextData(pts[0], wps[i])
		: {};
	if (/^rect/i.test(type)) {
		pts = getRectPts(...pts);
		type = "area";
	}
	// let path = getPath(type, wps, m);
	let feature = { type, klass, pts, ...colors, text, style, ...extraData };
	let feature2;
	let extLine = extractLineFromArea(pts);
	if (extLine) {
		feature2 = { type: "line", pts: extLine, stroke: colors.stroke };
		feature.stroke = undefined;
	}
	features.push(feature);
	if (feature2) features.push(feature2);
	return [pts, wps];
};
const getXY = (pt) => {
	let { x, y } = deLetterMapCoords(pt.pos);
	return { x, y, name: pt.name };
};
const extractLineFromArea = (pts) => {
	let i = _.findIndex(pts, (p) => /WP.*!$/i.test(p.name));
	if (i < 0) return null;
	let start = _.slice(pts, 0, i);
	let j = _.findIndex(pts, (p) => !/WP.*!$/i.test(p.name), i + 1);
	let end = j >= 0 ? _.slice(pts, j) : [];
	return [...end, ...start];
};
const getRectPts = ({ x, y }, { x: x2, y: y2 }) => {
	return [
		{ x, y },
		{ x: x, y: y2 },
		{ x: x2, y: y2 },
		{ x: x2, y: y },
		{ x, y },
	];
};
const getTextData = ({ x: x1, y: y1 }, { x: x2, y: y2 }) => {
	let dX = x2 - x1;
	let dY = y2 - y1;
	let len = Math.sqrt(dX * dX + dY * dY);
	let rad = Math.atan2(dY, dX);
	let angle = (rad * 180) / Math.PI;
	return { len, angle, x2, y2 };
};
const strokeColor = {
	aroad: [255, 0, 0],
	broad: [164, 42, 42],
	hill: [206, 132, 64],
	place: [75, 0, 130],
	town: [218, 165, 32],
	// town: [75, 0, 130],
	water: [178, 202, 246],
};
const fillColor = {};

function getColors(type, mode) {
	if (/color/i.test(type)) return {};
	let fill = null;
	let stroke = named2rgb(localColors[mode]) ||
		hex2rgb(mode) ||
		strokeColor[mode] ||
		named2rgb(mode) || [0, 0, 0];
	if (/^(area|fill|rect)$/i.test(type)) {
		fill = fillColor[mode];
		if (!fill) {
			fill = stroke.map((c) => c + (255 - c) * 0.5);
		}
		if (type === "fill") stroke = undefined;
	}
	return { stroke, fill };
}
function named2rgb(name) {
	let hex = namedColors[name];
	if (!hex) {
		console.log("unknown color name", name);
		return null;
	}
	return hex2rgb(hex);
}
function hex2rgb(h) {
	let match = h.match(/^#([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})$/i);
	if (!match) return undefined;
	let [, r, g, b] = match;

	return [parseInt(r, 16), parseInt(g, 16), parseInt(b, 16)];
}
module.exports = { extractFeatures };
