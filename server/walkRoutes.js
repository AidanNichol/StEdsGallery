const dateFn = require("date-fns");
const db = require("./walkDB");
const { read, exists, remove } = require("fs-jetpack");
const Sequelize = require("sequelize");
const { Op } = require("sequelize");
const jetpack = require("fs-jetpack");
const getenv = require("getenv");
// const Jimp = require("jimp");
const _ = require("lodash");

const { uploadWalk, updateWalkWithRemoteData } = require("./uploadWalk");
const { default: fastify } = require("fastify");
const sitePrefix = getenv("SITE_PREFIX", "");
const packageJson = require("../package.json");
const version = packageJson.version;
const { format } = dateFn;

// const isDev = (dev = true) => dev;
// const WALKDATA = isDev()
//   ? "/Users/aidan/Websites/htdocsC"
//   : "/home/ajnichol/public_html";
const WALKDATA = process.env.WALK_DATA;
async function walkRoutes(fastify) {
	fastify.get("/", async () => {
		return {
			sitePrefix,
			node: process.versions.node,
			version,
		};
	});

	fastify.get("/createMapPdf/:walkNo", async (request) => {
		const { createMapPdf } = require("./mappdf/createMapPdf");
		let { walkNo } = request.params;
		let walkData = await db.walk.findByPk(walkNo, { include: [db.region] });
		walkData = walkData.get({ plain: true });
		console.log(
			"createMap =============> data",
			walkNo,
			_.pick(walkData, ["showSegNames", "legend"]),
		);
		const [map, orientation, mapData] = await createMapPdf(walkNo, walkData);
		console.log("Map", { map, orientation });
		const changes = { orientation, scaledPrf: "Y" };
		await db.walk.update(changes, { where: { date: walkNo } });
		walkData = { ...walkData, ...changes };
		return { img: map, map: mapData, walkData };
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
		return result;
	});

	fastify.get("/getYears", async () => {
		const result = await db.walk.findAll({
			attributes: [[Sequelize.fn("DISTINCT", Sequelize.col("year")), "year"]],
			order: [["year", "DESC"]],
		});
		return result;
	});

	fastify.get("/getYearsWalks/:year", async (req) => {
		const { year } = req.params;
		const result = await db.walk.findAll({
			where: { year: year },
			order: [["date", "ASC"]],
		});
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
		let details = await db.walk.findOne({
			include: [db.region],
			where: { date: { [Op.gte]: dat } },
			order: ["date"],
		});
		details = await details.get({ plain: true });
		// let details = await getNextWalkData(dat);
		console.log(dat, details);
		let routes = await db.route.findAll({ where: { date: details.date } });

		const base = `${dat.substr(0, 4)}/${dat}`;
		//dets['img'] = $this->FindImageFile("$base/map-$dat");
		let img = `${base}/map-${dat}.pdf`;
		if (jetpack.exists(`${WALKDATA}/${img}`) === "file") {
			img = `walkdata/${img}`;
		} else {
			console.log("not found", `${WALKDATA}/${img}`);
			img = "walkdata/mapnotavailable.pdf";
		}
		let features = [];
		let featuresFile = `${WALKDATA}/${base}/featuresList.json`;
		// if (jetpack.exists(featuresFile) === "file") {
		features = jetpack.read(featuresFile, "json") || [];
		// }
		// details = { ...details, img };
		routes = routes.map((rt) => {
			rt = rt.get({ plain: true });
			rt.date = undefined;
			if (rt.distance > 1000) {
				rt.distance = Math.round(rt.distance / 1000, 1);
				rt.mmdistance = Math.round(rt.mmdistance / 1000, 1);
			}
			const prfImg = findImageFile(`${base}/profile-${dat}-walk-${rt.no}`);
			const imgConsts = { imgWd: 10, imgHt: 10, imgSize: 10 };
			// const imgConsts = getImageSize(prfImg);
			let gpxFile = `/walkdata/${base}/data-${dat}-walk-${rt.no}.gpx`;
			// console.log("gpxFile", gpxFile);
			return { ...rt, ...imgConsts, prfImg: `walkdata/${prfImg}`, gpxFile };
		});

		const jFile = `${WALKDATA}/${base}/data-${dat}-walk-gpx.json`;
		let gpxJ = [];
		if (details.details === "Y") {
			const data = read(jFile);
			gpxJ = data ? JSON.parse(data) : [];
		}
		details.img = img;
		return { details, routes, gpxJ, img, features };
	});

	fastify.get("/resetFeatures/:dat", async (request) => {
		const { dat } = request.params;
		const base = `${dat.substr(0, 4)}/${dat}`;

		let featuresFile = `${WALKDATA}/${base}/featuresList.json`;
		jetpack.remove(featuresFile);
		if (!walkDir.exists("featuresList.json")) findFeatures(walkDir, map);
		let list = walkDir.read("featuresList.json", "json");
		return { res: "ok" };
	});
	fastify.post("/updateFeatures/:dat", async (request) => {
		const { dat } = request.params;
		const body = JSON.parse(request.body);
		const base = `${dat.substr(0, 4)}/${dat}`;

		let featuresFile = `${WALKDATA}/${base}/featuresList.json`;
		jetpack.write(featuresFile, body);
		return { res: "ok" };
	});
	fastify.post("/updateWalkDetails/:walkNo", async (request) => {
		const { walkNo } = request.params;
		const body = JSON.parse(request.body);
		await db.walk.update(body, { where: { date: walkNo } });
		console.log("updatedWalk =============> ", walkNo, body);
		let data = await db.walk.findByPk(walkNo);
		data = data.get({ plain: true });
		console.log(
			"updatedWalk =============> data",
			walkNo,
			_.pick(data, ["showSegNames", "legend"]),
		);
		return { res: "ok" };
	});
	fastify.post("/addRoute/:walkNo/:no", async (request) => {
		const { walkNo, no } = request.params;
		const body = JSON.parse(request.body);
		await db.route.update(body, { where: { date: walkNo, no } });
		return { res: "ok" };
	});
	fastify.post("/createRoute/:walkNo/:no", async (request) => {
		// const { walkNo, no } = request.params;
		const body = JSON.parse(request.body);
		await db.route.create(body);
		return { res: "ok" };
	});

	fastify.get("/uploadWalk/:walkNo", async (request) => {
		const { walkNo } = request.params;
		// const body = JSON.parse(request.body);

		return await uploadWalk(walkNo);
	});
	fastify.get("/createWalk/:walkNo", async (request) => {
		const { walkNo } = request.params;
		// const body = JSON.parse(request.body);

		return await uploadWalk(walkNo, true);
	});

	fastify.get("/updateWalkWithRemoteData/:walkNo", async (request) => {
		const { walkNo } = request.params;

		return { res: "ok", walkNo };
	});
	fastify.post("/updateWalkWithRemoteData/:walkNo", async (request) => {
		const { walkNo } = request.params;
		console.log("body=====>", request.body);
		const body = JSON.parse(request.body);
		const res = await updateWalkWithRemoteData(walkNo, body, fastify.log);
		return res;
	});

	fastify.get("/getRoutesGpxJ/:dat", async (request) => {
		let { dat } = request.params;
		const base = `${dat.substr(0, 4)}/${dat}`;
		const jFile = `${WALKDATA}/${base}/data-${dat}-walk-gpx.json`;
		let data = JSON.parse(read(jFile));
		console.log(data);
		Object.entries(data).forEach(([no, route]) => {
			if (typeof route !== "object") {
				return;
			}
			route.gpxFile = `walkdata/${base}/data-${dat}-walk-${no}.gpx`;
		});
		return data;
	});
	fastify.get("/getWalksByDateIndex", async () => {
		return await db.walk.findAll({
			attributes: ["date", "area", "details"],
			order: [
				["year", "DESC"],
				["date", "ASC"],
			],
		});
	});
	fastify.get("/getWalksByRegionIndex", async () => {
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

	fastify.get("/getMapData/:dat", async (request) => {
		let { dat } = request.params;

		let r = await getNextWalkData(dat);
		// r = await r.get({ plain: true });
		dat = r.date;
		const base = `${dat.substr(0, 4)}/${dat}`;
		r.mapimg = `walkdata/${findImageFile(`${base}/map-${dat}`)}`;
		console.log("returning", r);
		return r;
	});
}
// const getImageSize = async (prfImg) => {
//   let prf = await Jimp.read(prfImg);
//   return { imgWd: prf.bitmap.width, imgHt: prf.bitmap.height };
// };
async function getNextWalkData(dat) {
	try {
		let result = await db.walk.findOne({
			include: [db.region],
			where: { date: { [Op.gte]: dat } },
			order: ["date"],
		});
		result = result.get({ plain: true });
		return result;
	} catch (error) {
		console.error(error);
		fastify.log.error(error);
	}
}
function findImageFile(nam) {
	for (const ext of ["pdf", "jpg", "png", "bmp"]) {
		const file = `${WALKDATA}/${nam}.${ext}`;
		// console.log("testing", file);
		if (exists(file)) {
			return `${nam}.${ext}`;
		}
	}
	return "walkdata/mapnotavailable.pdf";
}
module.exports = { walkRoutes };
