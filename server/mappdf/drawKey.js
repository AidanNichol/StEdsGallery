const { walkColor } = require("./drawSegments");
function drawKey(doc, m) {
  let w = 13;
  let keyHt = 12 + 6 * m.walks.length;
  let keyWd = 4 * w + 6;
  doc.advancedAPI((doc) => {
    doc.setLineDashPattern([]);
    const identityMatrix = new doc.Matrix(1, 0, 0, 1, 0, 0);
    console.log(identityMatrix.decompose());
    doc.beginFormObject(0, 0, 200, 3 * keyHt, identityMatrix);
    // doc.setLineWidth(0.5).setDrawColor(255, 0, 0).rect(0.2, 0.2, 70, 16).stroke();
    doc.setFillColor(211);
    doc.setLineWidth(0.5);
    doc.setDrawColor(48);
    doc.roundedRect(0.2, 0.2, keyWd, keyHt, 2, 2, "DF");
    doc.stroke();
    let y = 8;
    doc.setFontSize(8);
    doc.text(" distance    ascent     descent", 16, 4);
    // doc.setFontSize(9);
    for (const i in m.walks) {
      const walk = m.walks[i];
      const fill = walkColor[walk.no];
      const [r, g, b] = fill;
      let yiq = (r * 299 + g * 587 + b * 114) / 1000;
      let color = yiq > 120 ? 0 : 255;
      doc.setFillColor(...fill);
      doc.rect(13, y - 3, 3 * w + 2, 5, "F");

      doc.setTextColor(0);
      doc.text(`Walk ${walk.no}`, 3, y);
      doc.setTextColor(color);
      doc.text(walk.dist, 7 + w, y, { align: "right" });
      doc.text(walk.ascent, 7 + 2 * w, y, { align: "right" });
      doc.text(walk.descent, 7 + 3 * w, y, { align: "right" });
      y += 6;
    }
    y += 1;
    doc.setFontSize(10);
    doc.setTextColor(0);

    doc.setFillColor(255, 255, 0).setDrawColor(128, 0, 128);
    doc.text("Start", 13, y);
    doc.setFillColor(255, 255, 0);
    doc.circle(30, y - 1.5, 1.5, "DF").stroke();
    doc.text("Finish", 35, y);
    //$pdf->Text(2, $y, "Start");
    doc.setFillColor(255, 255, 0);
    doc.rect(50, y - 3, 3, 3, "DF").stroke();
    doc.endFormObject("key");
    let pos = m.legend || "TR";
    let fix = 0.2;
    let top = /T/.test(pos) ? m.y(0) + fix : m.y(m.rangeY) - keyHt - fix;
    let left = /L/.test(pos) ? m.x(0) + fix : m.x(m.rangeX) - keyWd - fix;
    const posMatrix = new doc.Matrix(1, 0, 0, 1, left, top);

    doc.doFormObject("key", posMatrix);
  });
}
module.exports = { drawKey };
