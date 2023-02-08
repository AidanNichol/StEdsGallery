const blackDot = (doc, m, x, y) =>
	doc.setFillColor(0).circle(m.px(x), m.py(y), 0.5, "F");
// const redDot = (doc, m, x, y, dx = 0, dy = 0) =>
//   doc.setFillColor(255, 0, 0).circle(m.px(x, dx), m.py(y, dy), 0.5, "F");
function decorateRoutes(doc, m) {
	for (const pt of m.segPoints) {
		const s = 1;

		doc
			.setFillColor(180)
			.rect(m.px(pt.x) - 0.5 * s, m.py(pt.y) - 0.5 * s, s, s, "F")
			.stroke();
	}
	doc.setDrawColor(128, 0, 128);
	for (const pt of m.starts) {
		doc
			.setFillColor(255, 255, 0)
			.circle(m.px(pt.x), m.py(pt.y), -1.5, "DF")
			.stroke();
		blackDot(doc, m, pt.x, pt.y);
	}
	for (const pt of m.ends) {
		doc
			.setFillColor(255, 255, 0)
			.rect(m.px(pt.x) - 1.5, m.py(pt.y) - 1.5, 3, 3, "DF")
			.stroke();
		blackDot(doc, m, pt.x, pt.y);
	}
}
// Draw Names
// ! Note we don't use the align option on the doc.text method becuase
// ! when it has a value of other than left the angle option doesn't work properly
// ! instead we adjust the x value to pull the start of text to the right
// ! so that so far as jsPdf is concerned the text is always left aligned from
// ! the x,y value and angle just works.
function drawNames(doc, m) {
	doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(20);
	// doc.setFillColor(0);
	for (const name in m.names) {
		let ftHt = (8 / 72) * 25.6;
		let size = doc.getStringUnitWidth(` ${name} `) * ftHt;
		const pt = m.names[name];
		let angle = 0;
		if (/A/.test(pt.shift)) {
			let match = pt.shift.match(/A([-\d]+)/);
			angle = parseInt(match[1]);
		}
		if (pt.start || pt.end) {
			if (/[RC]/.test(pt.shift)) {
				size += ftHt / 2;
			} else {
				size = ftHt / 2;
			}
			if (/C/.test(pt.shift)) {
				size += sizeftHt / 2;
			}
		} else {
			if (!/[RC]/.test(pt.shift)) {
				size = 0;
			}
		}
		// let angle = (rad * 180) / Math.PI;
		let rad = (angle * Math.PI) / 180;
		let opts = { align: "left", angle };
		let opp = Math.sin(rad) * size;
		let adj = Math.cos(rad) * size;
		let dx = 0;
		let dy = 0;
		let ddy = 0.3;
		if (/T/.test(pt.shift)) {
			ddy = 0.9;
		}
		if (/B/.test(pt.shift)) {
			ddy = -0.1;
		}
		ddy *= ftHt;
		let adj2 = ddy * Math.sin(rad);
		let opp2 = ddy * Math.cos(rad);
		if (/[RC]/.test(pt.shift)) {
			dx = -adj + adj2;
			dy = opp + opp2;
		} else {
			dx = adj + adj2;
			dy = -opp + opp2;
		}
		// if (pt.start||pt.end){
		//   if (  /R/.test(pt.shift)) dx -= ftHt/2;
		//   else if ( ! /C/.test(pt.shift)) dx += ftHt/2;
		// }
		if (/X/.test(pt.shift)) {
			dx += parseFloat(pt.shift.match(/X([+-.\d]+)/)[1]);
		}
		if (/Y/.test(pt.shift)) {
			dy += parseFloat(pt.shift.match(/Y([+-.\d]+)/)[1]);
		}
		// console.log(name, pt.shift, opts, pt, dx, dy);
		// doc.setFillColor(200).rect(m.px(pt.x, dx), m.py(pt.y, -ftHt+dy), adj, ftHt, 'F')
		blackDot(doc, m, pt.x, pt.y);
		doc.text(` ${name} `, m.px(pt.x, dx), m.py(pt.y, dy), opts);
		// redDot(doc, m, pt.x,pt.y, dx,dy);
	}
}
module.exports = { decorateRoutes, drawNames };
