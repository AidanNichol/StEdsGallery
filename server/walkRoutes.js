const dateFn = require("date-fns");
const db = require("./walkDB");
const { read, exists } = require("fs-jetpack");
const Sequelize = require("sequelize");
const { Op } = require("sequelize");
const { format } = dateFn;

const isDev = (dev = true) => dev;
const WALKDATA = isDev()
  ? "/Users/aidan/Websites/htdocsC"
  : "/home/ajnichol/public_html";
async function walkRoutes(fastify, options) {
  fastify.get("/", async (request, reply) => {
    return { hello: "world" };
  });
  fastify.get("/getYearsData/:year", async (request) => {
    let { year } = request.params;
    const walksDetails = await db.walk.findAll({
      attributes: ["date", "area", "details"],
      where: { year: year },
      order: ["date"],
    });

    let now = format(new Date(), "yyyy-MM-dd");
    const thisYear = now.substr(0, 4);
    if (thisYear === year) {
      year = now;
    }

    const hiWalk = await getNextWalkData(thisYear === year ? now : year);
    const progPDF =
      walksDetails.length !== 0 &&
      `http://walkdata.stedwardsfellwalkers.co.uk/${year}/StEdwardsWalksProgramme${year}.pdf`;

    return { walksDetails, hiWalk, progPDF, year };
  });
  fastify.get("/getWalkData/:walkDate", async (request) => {
    const { walkDate } = request.params;
    return await getNextWalkData(walkDate);
  });
  fastify.get("/getLatestYears", async () => {
    // const [results, metadata] = await db.sequelize.query(
    //   "SELECT name FROM sqlite_master WHERE type ='table' AND name NOT LIKE 'sqlite_%';",
    // );
    // console.log('getTables ', results, metadata);
    const result = await db.walk.findAll({
      attributes: [[Sequelize.fn("DISTINCT", Sequelize.col("year")), "year"]],
      distinct: ["year"],
      order: [["year", "DESC"]],

      limit: 2,
    });
    // $result = $this->db->query('SELECT DISTINCT substr(date,1,4) as year FROM walkday order by year DESC limit 2')->fetchAll(PDO::FETCH_COLUMN);
    return result;
  });

  fastify.get("/getPastWalks", async () => {
    let now = format(new Date(), "yyyy-MM-dd");
    const result = await db.walk.findAll({
      attributes: ["date", "area"],
      where: { date: { [Op.lt]: now } },
      order: [["date", "DESC"]],

      limit: 6,
    });
    return result;
  });
  fastify.get("/getWalkDetails/:dat", async (request) => {
    let { dat } = request.params;

    const details = await getNextWalkData(dat);
    console.log(dat, details);
    let routes = await db.route.findAll({ where: { date: details.date } });

    const base = `walkdata/${dat.substr(0, 4)}/${dat}`;
    //dets['img'] = $this->FindImageFile("$base/map-$dat");
    const img = `${base}/map-${dat}.pdf`;
    const imgConsts = { imgWd: 10, imgHt: 10, imgSize: 10 };
    routes = routes.map((rt) => {
      rt = rt.get({ plain: true });
      delete rt.date;
      rt.distance = Math.round(rt.distance / 1000, 1);
      rt.mmdistance = Math.round(rt.mmdistance / 1000, 1);
      const prfImg = findImageFile(`${base}/profile-${dat}-walk-${rt.no}`);
      let gpxFile = `${base}/data-${dat}-walk-${rt.no}.gpx`;
      console.log("gpxFile", gpxFile);
      return { ...rt, ...imgConsts, prfImg, gpxFile };
    });

    const jFile = `${WALKDATA}/${base}/data-${dat}-walk-gpx.json`;
    let gpxJ = details.details === "Y" ? JSON.parse(read(jFile)) : [];
    return { details, routes, gpxJ };
  });
  fastify.get("/getRoutesGpxJ/:dat", async (request) => {
    let { dat } = request.params;
    const base = `walkdata/${dat.substr(0, 4)}/${dat}`;
    const jFile = `${WALKDATA}/${base}/data-${dat}-walk-gpx.json`;
    let data = JSON.parse(read(jFile));
    console.log(data);
    Object.entries(data).forEach(([no, route]) => {
      if (typeof route !== "object") return;
      route.gpxFile = `${base}/data-${dat}-walk-${no}.gpx`;
    });
    return data;
  });
  fastify.get("/getWalksByDateIndex", async (request) => {
    return await db.walk.findAll({
      attributes: ["date", "area", "details"],
      order: [
        ["year", "DESC"],
        ["date", "ASC"],
      ],
    });
  });
  fastify.get("/getWalksByRegionIndex", async (request) => {
    return await db.walk.findAll({
      attributes: ["date", "area", "details", "finish"],
      include: [db.region],
      order: [
        ["regid", "ASC"],
        ["finish", "ASC"],
        ["date", "ASC"],
      ],
    });
  });
  // fastify.get('GetWalkRawData/:dat', async (request)=>{
  // {
  //     $results = array();
  //     $results['walkDetails'] = $this->db->query('SELECT * FROM walkday WHERE date = "' . $dat . '" ')->fetch(PDO::FETCH_ASSOC);
  //     $results['routes'] = $this->db->query('SELECT * FROM walks WHERE date = "' . $dat . '" ')->fetchAll(PDO::FETCH_ASSOC);
  //     return $results;
  // }
  fastify.get("/getMapData/:dat", async (request) => {
    let { dat } = request.params;

    let r = await getNextWalkData(dat);
    r = await r.get({ plain: true });
    dat = r.date;
    const base = `walkdata/${dat.substr(0, 4)}/${dat}`;
    r.mapimg = findImageFile(`${base}/map-${dat}`);
    r.mapimgR = findImageFile(`${base}/mapR-${dat}`);
    r.heading = findImageFile(`${base}/heading-${dat}`);
    r.headingR = findImageFile(`${base}/headingR-${dat}`);
    r.overlay = read(`${WALKDATA}/${base}/map-${dat}.ovl`);
    r.headPos = r.headingR ? "Side" : "Top";
    r.mapRot = r.mapimgR ? "Yes" : "No";
    console.log("returning", r);
    return r;
  });
}

async function getNextWalkData(dat) {
  const result = await db.walk.findOne({
    include: [db.region],
    where: { date: { [Op.gte]: dat } },
    order: ["date"],
  });
  return result;
}
function findImageFile(nam) {
  for (const ext of ["pdf", "jpg", "png", "bmp"]) {
    const file = `${WALKDATA}/${nam}.${ext}`;
    console.log("testing", file);
    if (exists(file)) return `${nam}.${ext}`;
  }
  return "walkdata/mapnotavailable.pdf";
}
module.exports = { walkRoutes };
