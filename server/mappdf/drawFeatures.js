const { O_DSYNC } = require("constants");
const jetpack = require("fs-jetPack");
const _ = require("lodash");
// const { deLetterMapCoords } = require("./Os_Coords");

function drawFeatures(doc, m) {
  doc.saveGraphicsState(); // pdf.internal.write('q');
  const blackDot = (doc, m, x, y) => {
    if (m.px(x) > 1000) {

      console.log('feat dot', m.px(x), m.py(y))
    }
    doc.setFillColor(0).circle(m.px(x), m.py(y), 0.5, 'F');
  }


  // draw clipping objects
  doc.rect(m.x(0), m.y(0), m.rangeX * m.scale, m.rangeY * m.scale, null); // important: style parameter is null!
  doc.clip();
  doc.discardPath();
  doc.setGState(new doc.GState());
  for (const feature of m.features) {
    let { type, stroke, fill, pts, angle, text } = feature;
    // if (type === "area" && fill && stroke) continue;
    let path = getPath(type, pts, m)
    doc.setDrawColor(...(stroke || [0, 0, 0])).setLineWidth(0.7);
    // pts.forEach(p => blackDot(doc, m, p.x, p.y))
    if (path) {
      doc.path(path);
      if (fill && stroke) doc.setFillColor(...fill).fillStrokeEvenOdd();
      if (fill) doc.setFillColor(...fill).fillEvenOdd();
      else doc.stroke();
    }
    if (text) {
      let color = stroke.map(c => c * 0.7)
      doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(...color);

      let { x, y } = pts[0];
      if (type === 'point') blackDot(doc, m, x, y)
      doc.text(text, m.px(x), m.py(y), { align: 'left', angle });
    }
  }
  // draw objects that need to be clipped

  // restores the state to where there was no clipping
  doc.restoreGraphicsState(); // pdf.internal.write('Q');
}
const getPath = (type, wps, m) => {
  if (!/area|line/i.test(type)) return null;
  let path = wps.reduce(
    (pth, wp) => (pth = [...pth, { op: "l", c: [m.px(wp.x), m.py(wp.y)] }]),
    []
  );
  path[0].op = "m";
  return path;
};
module.exports = { drawFeatures };
