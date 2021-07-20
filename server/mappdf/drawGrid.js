const { getGridLetters } = require("./Os_Coords");

function drawGrid(doc, m) {
  // draw the border
  doc.setDrawColor(0, 128, 128);

  // draw grid lines
  doc.setLineWidth(0.25);

  for (y = 0; y < m.rangeY; y += 1) {
    doc.line(m.x(0), m.y(y), m.x(m.rangeX), m.y(y));
  }
  for (x = 0; x < m.rangeX; x += 1) {
    doc.line(m.x(x), m.y(0), m.x(x), m.y(m.rangeY));
    // doc.line(left + x * scale, top, left + x * scale, top + rangeY * scale);
  }
  // add letters in the corners
  doc.setFont("helvetica", "bold").setFontSize(6).setTextColor(0, 0, 255); //Blue
  doc.text(getGridLetters(m.minX, m.maxY), m.x(0, -5), m.y(0, -1));
  doc.text(getGridLetters(m.minX, m.minY), m.x(0, -5), m.y(m.rangeY, +3));
  doc.text(getGridLetters(m.maxX, m.maxY), m.x(m.rangeX, +2), m.y(0, -1));
  doc.text(
    getGridLetters(m.maxX, m.minY),
    m.x(m.rangeX, +2),
    m.y(m.rangeY, +3)
  );
  doc.setTextColor(0, 0, 0); //black
  //Add Grid reference to both ends of each line
  doc.setFontSize(7);
  // add the Eastings
  for (x = 0; x <= m.rangeX; x += 1) {
    doc.text((x + m.minX + "").substr(-2), m.x(x, -1.5), m.y(0, -0.5));
    doc.text((x + m.minX + "").substr(-2), m.x(x, -1.5), m.y(m.rangeY, 2.5));
  }

  // add the Northings
  for (y = 0; y <= m.rangeY; y += 1) {
    doc.text((m.maxY - y + "").substr(-2), m.x(0, -3.7), m.y(y, 1));
    doc.text((m.maxY - y + "").substr(-2), m.x(m.rangeX, 0.5), m.y(y, 1));
  }

  doc.setLineWidth(0.5);
  doc.rect(m.x(0), m.y(0), m.rangeX * m.scale, m.rangeY * m.scale);
}
module.exports = { drawGrid };
