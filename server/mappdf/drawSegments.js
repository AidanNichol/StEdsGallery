const px = (x, dx = 0) => left + x * scale + dx;
const py = (y, dy = 0) => left + y * scale + dy;
const walkColor = [
  [0, 0, 0],
  [255, 0, 0],
  [0, 102, 255],
  [0, 255, 0],
  [255, 165, 0],
  [128, 0, 128],
  [165, 162, 162],
];

function drawSegments(doc, m) {
  const dash = 3;
  doc.setDrawColor(255, 0, 0);

  Object.values(m.segments).forEach((seg) => {
    seg.walks.forEach((w, i) => {
      const color = walkColor[w];
      doc.setDrawColor(...color).setLineWidth(0.7);
      if (seg.walks.length > 1)
        doc.setLineDashPattern([dash, dash * (seg.walks.length - 1)], i * dash);
      else doc.setLineDashPattern([]);
      let path = seg.wps.reduce(
        (pth, wp) => (pth = [...pth, { op: "l", c: [m.px(wp.x), m.py(wp.y)] }]),
        []
      );
      path[0].op = "m";
      doc.path(path).stroke();
    });
  });
}
module.exports = { drawSegments, walkColor };
