const { jsPDF } = require("jspdf"); // will automatically load the node version
const jetpack = require("fs-jetPack");
const _ = require("lodash");
const { deLetterMapCoords } = require("./Os_Coords");
const { extractMapData } = require("./extractMapData");
const { drawGrid } = require("./drawGrid");
const { drawSegments } = require("./drawSegments");
const { drawHeader } = require("./drawHeader");
const { drawKey } = require("./drawKey");
const { remodelProfiles } = require("../remodelProfiles/remodelProfiles");
const { decorateRoutes, drawNames } = require("./decorateRoutes");

const walkdata = "/Users/aidan/Websites/htdocsC/walkdata";

function createMapPdf(walkNo, walkData) {
  console.log("createMap", walkNo);
  const map = extractMapData(walkNo, walkData);

  map.minY -= walkData.bottom;
  map.maxY += walkData.top;
  map.minX -= walkData.left;
  map.maxX += walkData.right;
  GetPageLayout(map);
  const doc = new jsPDF({ orientation: map.orientation });
  // console.log(doc.getFontList());

  drawGrid(doc, map);
  decorateRoutes(doc, map);
  drawSegments(doc, map);
  drawNames(doc, map);
  drawHeader(doc, map);
  drawKey(doc, map);
  let pdf = `${walkdata}/${walkNo.substr(0, 4)}/${walkNo}/map-${walkNo}.pdf`;
  doc.save(pdf); // will save the file in the current working directory
  remodelProfiles(walkNo, map.routes);
  return { img: pdf, map };
}
function GetPageLayout(map) {
  const headSz = 20;
  ["portrait", "landscape"].forEach((O) => {
    wdth = O === "portrait" ? 210 : 297;
    hght = O === "portrait" ? 297 : 210;
    width = wdth - 2 * map.margin;
    height = hght - 2 * map.margin;
    ["T", "S"].forEach((P) => {
      dW = P === "T" ? 0 : headSz; // headSz is the height of the header
      dH = P === "T" ? headSz : 0;
      scl = Math.min((width - dW) / map.rangeX, (height - dH) / map.rangeY);
      if (scl > map.scale) {
        map.scale = scl;
        map.orientation = O;
        map.header = P;
        map.topZero = map.margin + dH;
        map.leftZero = map.margin;
        map.width = wdth;
        map.height = hght;
      }
    });
  });

  return;
}
module.exports = { createMapPdf };
