let jetpack = require("fs-jetPack");
let { extractFeatures } = require('../server/mappdf/extractFeatures')
const _ = require("lodash");
const features = [];


function convertToJson(tFile) {
  console.log("converting", tFile);
  let parts=tFile.match(/\/([\d-]+)\/features ([^.\/]+)\.txt$/i)
  // let jFile = tFile.replace(/\.txt$/, ".json");
  let jFile=`features/${parts[1]} ${parts[2]}.json`
  // if (jetpack.exists(`${subdir}/${jFile}`)) continue;
  let data = jetpack.read(tFile, "utf8");
  data = data
    .replace(/ => /g, ":")
    .replace(/\n/g, "")
  let wData = data.match(/[$]wData=array \(([^;]*)\);/);
  wData = (wData || [, ''])[1]
  let wp = data.match(/[$]wp=array \(([^;]*)\);/);
  wp = (wp || [, ''])[1];

  wp = wp

    .replace(/array \(/g, "{")
    .replace(/\)/g, "}")
    .replace(/\d+\s*:/g, '');

  let obj = Function(`"use strict";return ({wData:{${wData}}, wp:[${wp}]})`)();
  obj.wp = obj.wp.map((wp) => _.pick(wp, ["name", "pos", "dist", "bear"]));
  let features = extractFeatures(obj);
  jetpack.write(jFile, features);
}
console.log("started");
try {
  jetpack = jetpack.cwd("/Users/aidan/Websites/htdocsC/walkdata");
  console.log("cwd", jetpack.cwd());
  let featFiles = jetpack.find('.', { matching: './**/features*.txt' })
  for (let file of featFiles) {
    convertToJson(file);
  }

} catch (error) {
  console.log(error);
}
