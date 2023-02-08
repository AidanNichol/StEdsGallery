const { jsPDF } = require("jspdf"); // will automatically load the node version
const jetpack = require("fs-jetPack");
const _ = require("lodash");
const { deLetterMapCoords } = require("./Os_Coords");
const { extractMapData } = require("./extractMapData");
const { drawGrid } = require("./drawGrid");
const { drawSegments } = require("./drawSegments");
const { drawHeader } = require("./drawHeader");
const { drawKey } = require("./drawKey");
const { drawFeatures } = require("./drawFeatures");
const { remodelProfiles } = require("../remodelProfiles/remodelProfiles");
const { decorateRoutes, drawNames } = require("./decorateRoutes");

const walkdata = "/Users/aidan/Websites/htdocsC";
// let ver = 100;

async function createMapPdf(walkNo, walkData) {
	try {
		console.log("createMap", walkNo);
		const map = await extractMapData(walkNo, walkData);

		map.minY -= walkData.bottom;
		map.maxY += walkData.top;
		map.minX -= walkData.left;
		map.maxX += walkData.right;
		GetPageLayout(map);
		const doc = new jsPDF({ orientation: map.orientation });
		// console.log(doc.getFontList());

		drawFeatures(doc, map);
		drawGrid(doc, map);
		decorateRoutes(doc, map);
		drawSegments(doc, map);
		drawNames(doc, map);
		drawHeader(doc, map);
		drawKey(doc, map);
		let pdf = `walkdata/${walkNo.substr(0, 4)}/${walkNo}/map-${walkNo}.pdf`;
		doc.save(`${walkdata}/${pdf}`); // will save the file in the current working directory
		await remodelProfiles(walkNo, map.routes);
		// pdf = `${pdf}?v=${++ver}}`;
		return [pdf, map.orientation, map];
		// return { img: pdf, map };
	} catch (error) {
		console.error(error);
	}
}
function GetPageLayout(map) {
	const headSz = 20;
	["P", "L"].forEach((O) => {
		wdth = O === "P" ? 210 : 297;
		hght = O === "P" ? 297 : 210;
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
