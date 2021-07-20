const { remodelProfiles } = require("./remodelProfiles/remodelProfiles");
const routes = [
  { no: "1", dist: 13, minElev: 103, maxElev: 504 },
  { no: "2", dist: 12, minElev: 103, maxElev: 347 },
  { no: "3", dist: 10, minElev: 103, maxElev: 361 },
  { no: "4", dist: 9, minElev: 103, maxElev: 326 },
  { no: "5", dist: 4, minElev: 59, maxElev: 188 },
];
const walkNo = "2020-01-04";
remodelProfiles(walkNo, routes);
