const jetpack = require("fs-jetPack");
const _ = require("lodash");
const { deLetterMapCoords } = require("./Os_Coords");
const { namedColors } = require("./namedColors");
const { toLower, every } = require("lodash");
const { TEXT } = require("sequelize");
let features = [];
const getStyle = (what, def = 0) => {
	const regex = new RegExp(`${what}([+-]?[\\d.]+)`, "i");
	return (style = "", ovr) => {
		const match = style.match(regex);
		return match?.[1] ? parseFloat(match[1]) : ovr ?? def;
	};
};

const getStyleP = getStyle("P", 1);
const getStyleF = getStyle("F", null);

const featCount = {
	color: () => 1,
	rect: () => 2,
	text: () => 2,
	name: () => 2,
	line: (wp, i) => findEnd(wp, i, (p) => /^end/i.test(p.name)),
	area: (wp, i) => findEnd(wp, i, (p) => p.pos === wp[i].pos),
	fill: (wp, i) => findEnd(wp, i, (p) => p.pos === wp[i].pos),
	point: () => 2,
	circle: () => 2,
};
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
		[
			"color",
			"fill",
			"area",
			"rect",
			"line",
			"text",
			"name",
			"point",
			"circle",
		].forEach((type) => {
			let re = new RegExp(`^${type}`, "i");
			const findType = (from) => _.findIndex(wps, (p) => re.test(p.name), from);
			let used = 0;
			for (let i = findType(0); i > -1; i = findType(i + used)) {
				used = featCount[type](wps, i);
				let pts = wps.slice(i, i + used);
				findFeature(pts, type);
			}
		});
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

let localColors = {};

const getTextBlock = (wp, i, klass, text) => {
	let [, name, namedColor] = wp[i].name.split(" ");
	localColors[name.toLowerCase()] = namedColor;
	return 1;
};
const findFeature = (pts, type) => {
	// name water what every
	// name water p8 a name
	// line water w2
	// area water
	let [, klass, style, text] = pts[0].name.match(
		/^\w+\s+(\w+)(?:\s+([-+RFWASXY\d.]+))?(?:\s+(.*))?$/i,
	);
	console.log("feature", type, klass, style, text);
	klass = klass.toLowerCase();
	let colors;
	if (type === "color") {
		setColors(type, _.toLower(klass), style, text);
		localColors[klass] = text;
	} else {
		colors = getColors(type, _.toLower(klass));
	}
	pts = pts.map((pt) => _.pick(pt, ["x", "y", "name"]));
	let extraData = /^point|circle|name|text/i.test(type)
		? getTextData(...pts)
		: {};
	let feature2;
	if (/^rect/i.test(type)) {
		feature2 = extractRectText(type, klass, pts, colors, text, style);
		pts = getRectPts(...pts);
		type = "area";
		text = undefined;
	}
	// let path = getPath(type, wps, m);
	let feature = { type, klass, pts, ...colors, text, style, ...extraData };
	// let extLine = extractLineFromArea(pts);
	// if (extLine) {
	// 	feature2 = { type: "line", pts: extLine, stroke: colors.stroke };
	// 	feature.stroke = undefined;
	// }
	features.push(feature);

	if (feature2) features.push(feature2);
	return;
};
const getXY = (pt) => {
	let { x, y } = deLetterMapCoords(pt.pos);
	return { x, y, name: pt.name };
};
// const extractLineFromArea = (pts) => {
// 	let i = _.findIndex(pts, (p) => /WP.*!$/i.test(p.name));
// 	if (i < 0) return null;
// 	let start = _.slice(pts, 0, i);
// 	let j = _.findIndex(pts, (p) => !/WP.*!$/i.test(p.name), i + 1);
// 	let end = j >= 0 ? _.slice(pts, j) : [];
// 	return [...end, ...start];
// };
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
const extractRectText = (type, klass, pts, colors, text, style) => {
	if (!text) return null;
	let fs = getStyleF(style, 8);
	let pad = getStyleP(style, 0.5 * fs);
	let [{ x: x1, y: y1 }, { x: x2, y: y2 }] = pts;

	let len = x2 - x1;

	return {
		type: "textR",
		klass,
		pts: [...pts],
		...colors,
		text,
		style,
		len,
		angle: 1,
	};
};
const baseColor = {
	aroad: { stroke: [255, 0, 0] },
	broad: { stroke: [164, 42, 42] },
	hill: { stroke: [206, 132, 64] },
	place: { stroke: [75, 0, 130] },
	town: { stroke: [218, 165, 32] },
	// town:{stroke: [75, 0, 130]},
	water: { stroke: [178, 202, 246] },
};
const calcFill = (clr) => {
	clr.fill = clr.stroke?.map((c) => c + (255 - c) * 0.5);
};
for (const prop in baseColor) {
	calcFill(baseColor[prop]);
}

const setColors = (type, klass, defStyle, text) => {
	let [stroke, fill] = text.toLowerCase().split(/ +/);
	stroke = named2rgb(stroke) || hex2rgb(stroke) || [0, 0, 0];

	fill = fill ? named2rgb(fill) || hex2rgb(fill) : calcFill(stroke);
	baseColor[klass] = { stroke, fill, defStyle };
};
function getColors(type, mode) {
	if (/color/i.test(type)) return {};
	let { stroke, fill, defStyle } = baseColor[mode];
	// if (/^(area|fill|rect)$/i.test(type)) {
	if (type === "fill") stroke = undefined;
	if (type === "line") fill = undefined;
	// }else fill=undefined;
	return { stroke, fill, defStyle };
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
