const jetpack = require("fs-jetpack");
const { parse, format } = require("date-fns");
function drawHeader(doc, m) {
  const fs = require("fs");

  // var logo = fs.readFileSync("./St.Edwards.col4a.png", {
  //   encoding: "latin1",
  // });

  doc.advancedAPI((doc) => {
    const identityMatrix = new doc.Matrix(1, 0, 0, 1, 0, 0);
    console.log(m);
    doc.beginFormObject(0, 0, 900, 50, identityMatrix);
    // doc.setLineWidth(0.5).setDrawColor(255, 0, 0).rect(0.2, 0.2, 70, 16).stroke();
    // doc.addImage(logo, "test2", 0, 0, 15, 15, undefined, "SLOW");
    doc.setFont("helvetica", "bold").setTextColor(105);
    doc.setFontSize(20).text(m.area, 19, 9);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5).text("St. Edwards ABC Fellwalkers", 19, 2);
    doc.setFontSize(8).text(m.regName, 19, 12);
    doc
      .setFontSize(8)
      .text(format(new Date(m.walk), "EEEE, do MMM, yyyy"), 19, 15);
    const createdDate = format(new Date(), " d MMM yyyy, HH:mm:ss");
    let headerWidth = 210;
    let sideHeaderStart = 297;
    if (m.orientation === "P") {
      headerWidth = m.header === "T" ? 210 : 297;
      sideHeaderStart = 210;
    } else {
      headerWidth = m.header === "T" ? 297 : 210;
    }
    doc.text(createdDate, headerWidth - 40 - m.margin, m.margin);
    doc.endFormObject("head");
    const mrg = m.margin;
    const sideMatrix = new doc.Matrix(0, 1, -1, 0, sideHeaderStart - mrg, mrg);
    const topMatrix = new doc.Matrix(1, 0, 0, 1, mrg, mrg);
    // const matrix =
    //   m.header === "T"
    //     ? new doc.Matrix(1, 0, 0, 1, mrg, mrg)
    //     : new doc.Matrix(0, 1, -1, 0, sideHeaderStart - mrg, mrg);

    doc.doFormObject("head", m.header === "T" ? topMatrix : sideMatrix);
  });
}
module.exports = { drawHeader };
