let jetpack = require("fs-jetPack");
let _ = require("lodash");
let { extractFeatures } = require("./extractFeatures");

const walkdataDir = "/Users/aidan/Websites/htdocsC/walkdata";
const walkdata = jetpack.cwd(walkdataDir);
function getFeatures(walkDir, map) {
	if (!walkDir.exists("featuresList.json")) findFeatures(walkDir, map);
	let list = walkDir.read("featuresList.json", "json");
	let features = [];
	for (const { file, active } of list) {
		if (!active) continue;
		// console.log('testing features', file)
		let data = walkdata.read(file, "json");
		if (data.wp) {
			data = extractFeatures(data);
			walkdata.write(file, data);
		}

		features.push(...data.features);
	}
	// features = _.sortBy(features, 'type');
	return features;
}
function findFeatures(walkDir, map) {
	let list = walkdata.find("features", { matching: "*.json" });
	// list=list.map(f=>/^features.*.json/.test(f));
	let featuresList = [];
	for (const jFile of list) {
		// console.log('testing features', jFile)
		if (/featuresList.json/.test(jFile)) continue;
		let data = walkdata.read(jFile, "json");
		if (data.wp) {
			data = extractFeatures(data);
			walkdata.write(jFile, data);
		}
		if (featureIsOnMap(data.area, map)) {
			featuresList.push({
				file: jFile,
				active: map.walk === jFile.substr(-10),
				color: null,
			});
		}
	}
	console.log("including", featuresList);
	walkDir.write("featuresList.json", featuresList);
}
const featureIsOnMap = ({ minX, minY, maxX, maxY }, m) => {
	if (maxX < m.minX || minX > m.maxX) return false;
	if (maxY < m.minY || minY > m.maxY) return false;
	return true;
};
module.exports = { getFeatures };
