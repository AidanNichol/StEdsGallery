const { O_DSYNC } = require("constants");
const jetpack = require("fs-jetPack");
const { size } = require("lodash");
const _ = require("lodash");
// const { deLetterMapCoords } = require("./Os_Coords");
const getStyle = (what, def = 0) => {
	const regex = new RegExp(`${what}([+-]?[\\d.]+)`, "i");
	return (style, ovr) => {
		const match = style.match(regex);
		return match?.[1] ? parseFloat(match[1]) : ovr ?? def;
	};
};
const getStyleX = getStyle("X", 0);
const getStyleY = getStyle("Y", 0);
const getStyleS = getStyle("S", 1);
const getStyleF = getStyle("F", null);
const getStyleA = getStyle("A", 0);
const getStyleW = getStyle("W", 0.7);
const getStyleR = getStyle("R", null);
const getStyleP = getStyle("P", null);
function drawFeatures(doc, m) {
	doc.saveGraphicsState(); // pdf.internal.write('q');
	const blackDot = (doc, m, x, y, fill, r = 1) => {
		if (m.px(x) > 1000) {
			console.log("feat dot", m.px(x), m.py(y));
		}
		doc.setFillColor(...fill).circle(m.px(x), m.py(y), r, "F");
	};

	// draw clipping objects
	doc.rect(m.x(0), m.y(0), m.rangeX * m.scale, m.rangeY * m.scale, null); // important: style parameter is null!
	doc.clip();
	doc.discardPath();
	doc.setGState(new doc.GState());
	for (const feature of m.features) {
		let { type, klass, stroke, fill, defStyle, pts, angle, style, text, len } =
			feature;
		// if (type === "area" && fill && stroke) continue;
		style = `${style ?? ""}${defStyle ?? ""}`;
		console.log("feature", type, klass, stroke, fill, style, defStyle);
		let path = getPath(type, pts, m);
		let width = getStyleW(style);

		doc.setDrawColor(...(stroke || [0, 0, 0])).setLineWidth(width);
		// pts.forEach(p => blackDot(doc, m, p.x, p.y))
		if (path) {
			doc.path(path);
			if (fill && stroke) doc.setFillColor(...fill).fillStrokeEvenOdd();
			if (fill) doc.setFillColor(...fill).fillEvenOdd();
			else doc.stroke();
		}
		// if (type === "rect") {
		// 	let { x, y } = pts[0];
		// 	let { wd, ht } = feature;
		// 	doc.rect(x, y, wd, ht);
		// 	if (fill && stroke) doc.setFillColor(...fill).fillStrokeEvenOdd();
		// 	if (fill) doc.setFillColor(...fill).fillEvenOdd();
		// 	// else doc.stroke();
		// 	doc.rect(m.px(x), m.py(y), wd, ht, "DF");
		// }
		const opts = { align: "left" };
		// if (type === "text") {
		// 	const sz = len * m.scale;

		// 	let color = stroke.map((c) => c * 0.7);
		// 	let { x, y } = pts[0];
		// 	let fs = 8;
		// 	if (/F[\d.]+/i.test(style)) fs = parseInt(style.match(/F([\d.]+)/i)[1]);
		// 	doc
		// 		.setFont("helvetica", "normal")
		// 		.setFontSize(fs)
		// 		.setTextColor(...color);
		// 	doc.text(text, m.px(x), m.py(y), { align: "left", maxWidth: sz });
		// 	text = undefined;
		// }
		if (type === "circle") {
			let { x, y } = pts[0];
			let radius = getStyleS(style, 1);

			doc.setFillColor(...fill).circle(m.px(x), m.py(y), radius, "DF");
		}

		if (text && angle) {
			let match;
			let { x, y } = pts[0];
			let { x2, y2 } = feature;
			let unitWidth = doc.getStringUnitWidth(text);
			let fs = 8;
			if (/text[R]?/.test(type)) {
				opts.maxWidth = len * m.scale;
			} else {
				fs = ((len / 0.3527777778) * m.scale) / unitWidth;
				fs = Math.min(8, Math.max(6, fs));
				stroke = stroke.map((c) => c * 0.7);

				angle = getStyleA(style, angle);

				if (/R/i.test(style)) {
					opts.align = "right";
					// angle = (180 + angle) % 360;
					// // let angle = (rad * 180) / Math.PI;
					// let rad = (Math.PI * angle) / 180;
					// let size = (unitWidth * fs * 0.3527777778) / m.scale;
					// let dy = Math.sin(rad) * size;
					// let dx = Math.cos(rad) * size;
					// y -= Math.sin(rad) * size;
					// x -= Math.cos(rad) * size;
				}
				opts.angle = angle;
			}
			fs = getStyleF(style, fs);
			let dx = getStyleX(style);
			let dy = getStyleY(style);
			if (type === "textR") {
				let pad = getStyleP(style, fs * 0.5);
				const factor = 0.3;
				dx = dx + pad * factor;
				dy = dy + (pad + fs) * factor;
				opts.maxWidth -= 2 * pad * factor;
			}
			if (type === "point") blackDot(doc, m, x, y, color);
			doc
				.setFont("helvetica", "normal")
				.setFontSize(fs)
				.setTextColor(...stroke);
			console.log(m.px(x), dx, m.py(y), dy, x, y, opts, text);
			doc.text(` ${text}`, m.px(x) + dx, m.py(y) + dy, opts);
		}
	}

	// draw objects that need to be clipped

	// restores the state to where there was no clipping
	doc.restoreGraphicsState(); // pdf.internal.write('Q');
}
const getPath = (type, wps, m) => {
	if (!/area|line|fill|rect/i.test(type)) return null;
	let path = wps.reduce(
		(pth, wp) => (pth = [...pth, { op: "l", c: [m.px(wp.x), m.py(wp.y)] }]),
		[],
	);
	path[0].op = "m";
	return path;
};
module.exports = { drawFeatures };
