const http = require('http')
const { stdTimeFunctions } = require("pino");
const dotenv = require("dotenv");
dotenv.config();
const fastifyPkg = require("fastify");
const fastifyCors = require("@fastify/cors");
const fastifyCookie = require("@fastify/cookie");
const fastifyStatic = require("@fastify/static");
const multipart = require("@fastify/multipart");

// const path = require("path");
const jetpack = require("fs-jetpack");
const getenv = require("getenv");
const packageJson = require("../package.json");
const version = packageJson.version;
// const { cwd, read } = jetpack;

const { cpgRoutes } = require("./cpgRoutes.js");
const { authRoutes } = require("./authRoutes.js");
const { walkRoutes } = require("./walkRoutes.js");
const { eventRoutes } = require("./eventRoutes.js");
const galleryDataPath = process.env.GALLERY_DATA;
console.log("galleryData", galleryDataPath);
// const fs = require("fs");
const walkDataPath = process.env.WALK_DATA;
console.log("walkdata", walkDataPath);
const downloadsDataPath = process.env.DOWNLOADS_DATA;
console.log("downloadsdata", downloadsDataPath);
const sitePrefix = getenv("SITE_PREFIX", "apiServer/");
console.log("sitePrefix", sitePrefix);
console.log("cwd", jetpack.cwd());


let server
let port

const serverFactory = (handler, opts) => {
  server = http.createServer((req, res) => {
    handler(req, res)
  })

  return server
}

const fastify = require('fastify')({ serverFactory ,	logger: {
		level: "info",
		file: "./logs/empty.log", // will use pino.destination()
		timestamp: stdTimeFunctions.isoTime,
	}})
fastify.get(`/${sitePrefix}`, async () => {
	return {
		hello: "world",
		version: process.versions.node,
    when: new Date(),
	};
});
fastify.register(fastifyCookie, {
	secret: getenv("COOKIE_SECRET"), // for cookies signature
	parseOptions: {}, // options for parsing cookies
});
fastify.register(multipart, { attachFieldsToBody: true });
fastify.register(fastifyCors, {
	credentials: true,
	origin: [/localhost/, /stedwardsfellwalkers\.co\.uk$/],
});

fastify.log.info(`server: ${sitePrefix} version: ${version}`);
fastify.register(fastifyStatic, {
	root: galleryDataPath,
	prefix: `/${sitePrefix}galleryData`, // optional: default '/'
});
fastify.log.info(
	`static ${`/${sitePrefix}galleryData`} ==> ${galleryDataPath}`,
);
fastify.register(fastifyStatic, {
	root: walkDataPath,
	prefix: `/${sitePrefix}walkdata`, // optional: default '/'
	decorateReply: false,
});
fastify.log.info(`static ${`/${sitePrefix}walkData`} ==> ${walkDataPath}`);
fastify.register(fastifyStatic, {
	root: downloadsDataPath,
	prefix: `/${sitePrefix}downloads`,
	decorateReply: false,
});
fastify.log.info(
	`static ${`/${sitePrefix}downloads`} ==> ${downloadsDataPath}`,
);
console.log(`static ${`/${sitePrefix}downloads`} ==> ${downloadsDataPath}`);

fastify.register(walkRoutes, { prefix: `${sitePrefix}walks` });
fastify.register(cpgRoutes, { prefix: `${sitePrefix}cpg` });
fastify.register(eventRoutes, { prefix: `${sitePrefix}events` });
fastify.register(authRoutes, { prefix: `${sitePrefix}auth` });

const node_env = getenv("NODE_ENV", "developement");
console.error("node_env", node_env, version);
console.warn("node_warn", new Date(), node_env, node_env, version);
// fastify.get('/apiServer/', (req, reply) => {
//   reply.send({ hello: 'world' , version: 3})
// })
fastify.ready(() => {
  server.listen();
  port =server.address()?.port??'unknown';
  console.warn('apiTestEmpty listening on', port)
})