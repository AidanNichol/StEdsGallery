const blackDot = (doc, m, x, y) => doc.setFillColor(0).circle(m.px(x), m.py(y), 0.5, 'F');
function decorateRoutes(doc, m) {
  doc.setDrawColor(128, 0, 128);

  for (const pt of m.starts) {
    doc.setFillColor(255, 255, 0).circle(m.px(pt.x), m.py(pt.y), -1.5, 'DF').stroke();
    blackDot(doc, m, pt.x, pt.y);
  }
  for (const pt of m.ends) {
    doc
      .setFillColor(255, 255, 0)
      .rect(m.px(pt.x) - 1.5, m.py(pt.y) - 1.5, 3, 3, 'DF')
      .stroke();
    blackDot(doc, m, pt.x, pt.y);
  }
  for (const pt of m.segPoints) {
    const s = 2;
    doc
      .setFillColor(180)
      .rect(m.px(pt.x) - 0.5 * s, m.py(pt.y) - 0.5 * s, s, s, 'F')
      .stroke();
  }
  // Draw Names
}
function drawNames(doc, m) {
  doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(20);
  // doc.setFillColor(0);
  for (const name in m.names) {
    const pt = m.names[name];
    let dx = 0;
    let opts = { align: 'left', baseline: 'middle' };
    if (/R/.test(pt.shift)) opts.align = 'right';
    if (/C/.test(pt.shift)) opts.align = 'center';
    if (/T/.test(pt.shift)) opts.baseline = 'top';
    if (/B/.test(pt.shift)) opts.baseline = 'bottom';
    if (pt.start && opts.align === 'left') dx = 1.3;
    if (pt.end && opts.align === 'right') dx = -1.3;
    console.log(name, pt.shift, opts, dx);
    blackDot(doc, m, pt.x, pt.y);
    doc.text(` ${name} `, m.px(pt.x) + dx, m.py(pt.y), opts);
  }
}
module.exports = { decorateRoutes, drawNames };
