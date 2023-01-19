const { O_DSYNC } = require("constants");
const jetpack = require("fs-jetPack");
const { size } = require("lodash");
const _ = require("lodash");
// const { deLetterMapCoords } = require("./Os_Coords");

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
		let { type, klass, stroke, fill, pts, angle, style, text, len } = feature;
		// if (type === "area" && fill && stroke) continue;
		let path = getPath(type, pts, m);
		let width = 0.7;
		if (/W[\d.]+/i.test(style)) width = parseInt(style.match(/W([\d.]+)/i)[1]);

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

		if (text && angle) {
			let match;
			let { x, y } = pts[0];
			let { x2, y2 } = feature;
			let unitWidth = doc.getStringUnitWidth(text);
			let fs = 8;
			if (type === "text") {
				opts.maxWidth = len * m.scale;
			} else {
				fs = ((len / 0.3527777778) * m.scale) / unitWidth;
				fs = Math.min(8, Math.max(6, fs));
				let color = stroke.map((c) => c * 0.7);
				if (/F[\d.]+/i.test(style)) fs = parseInt(style.match(/F([\d.]+)/i)[1]);
				if (/A[\d.-]+/i.test(style))
					angle = parseInt(style.match(/A([\d.-]+)/i)[1]);

				if (/R/i.test(style)) {
					angle = (180 + angle) % 360;
					// let angle = (rad * 180) / Math.PI;
					let rad = (Math.PI * angle) / 180;
					let size = (unitWidth * fs * 0.3527777778) / m.scale;
					let dy = Math.sin(rad) * size;
					let dx = Math.cos(rad) * size;
					y -= Math.sin(rad) * size;
					x -= Math.cos(rad) * size;
				}
				opts.angle = angle;
			}
			if (type === "point") blackDot(doc, m, x, y, color);
			doc
				.setFont("helvetica", "normal")
				.setFontSize(fs)
				.setTextColor(...color);

			doc.text(` ${text}`, m.px(x), m.py(y), opts);
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
