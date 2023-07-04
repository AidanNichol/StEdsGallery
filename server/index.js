// Require the framework and instantiate it
const dotenv = require("dotenv");
dotenv.config();
const fastifyPkg = require("fastify");
const fastifyCors = require("@fastify/cors");
const fastifyCookie = require("@fastify/cookie");
const fastifyStatic = require("@fastify/static");
const multipart = require("@fastify/multipart");
const { stdTimeFunctions } = require("pino");

// const path = require("path");
const jetpack = require("fs-jetpack");
const getenv = require("getenv");
const http = require("http");
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
let server;
const serverFactory = (handler) => {
  server = http.createServer((req, res) => {
    handler(req, res);
  });
  return server;
};

// const https = getenv.bool("DEVELOPMENT")
//   ? {
//       https: {
//         key: read("./server.key"),
//         cert: read("./server.crt"),
//       },
//     }
//   : {};
jetpack.dir("../logs");
const fastify = fastifyPkg({
  serverFactory,
  bodyLimit: 10048576,
  ignoreTrailingSlash: true,
  logger: {
    level: "info",
    file: "../logs/stEdsGallery.log", // will use pino.destination()
    timestamp: stdTimeFunctions.isoTime,
  },
});
// fastify.addHook('onRequest', (request, reply, done) => {
//   let msg=`method: ${request.method}, url: ${request.url}`;
// 	console.log(msg);
// 	fastify.log.info(msg)
//   done()
// })
fastify.register(fastifyCookie, {
  secret: getenv("COOKIE_SECRET"), // for cookies signature
  parseOptions: {}, // options for parsing cookies
});
fastify.register(multipart, { attachFieldsToBody: true });
fastify.register(fastifyCors, {
  credentials: true,
  origin: [/localhost/, /stedwardsfellwalkers\.co\.uk$/, /.*/],
});

fastify.log.info(`server: ${sitePrefix} version: ${version}`);
fastify.register(fastifyStatic, {
  root: galleryDataPath,
  prefix: `/${sitePrefix}galleryData`, // optional: default '/'
});
fastify.log.info(
  `static ${`/${sitePrefix}galleryData`} ==> ${galleryDataPath}`
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
  `static ${`/${sitePrefix}downloads`} ==> ${downloadsDataPath}`
);
console.log(`static ${`/${sitePrefix}downloads`} ==> ${downloadsDataPath}`);

// fastify.register(fastifyCors, {
//   credentials: true,
//   origin: [/localhost/, /stedwardsfellwalkers\.co\.uk$/],
// });
fastify.get(`/${sitePrefix}`, async () => {
  return {
    hello: "world",
    version: process.versions.node,
    server: fastify.server.address(),
  };
});
fastify.register(walkRoutes, { prefix: `${sitePrefix}walks` });
fastify.register(cpgRoutes, { prefix: `${sitePrefix}cpg` });
fastify.register(eventRoutes, { prefix: `${sitePrefix}events` });
fastify.register(authRoutes, { prefix: `${sitePrefix}auth` });

// Run the server!
const runit = async () => {
  try {
    await fastify.listen({ port: 5555 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(fastify.printRoutes({ commonPrefix: false }));
  console.log(
    `Server (v${version}) listening on ${fastify.server.address().port}`
  );
};
const node_env = getenv("NODE_ENV", "developement");
console.error("node_env", node_env, version);
console.warn("node_warn", new Date(), node_env, node_env, version);
fastify.ready(() => {
  if (node_env === "production") server.listen();
  else server.listen({ port: 5555 });
  console.log(fastify.printRoutes({ commonPrefix: false }));
  console.log(
    `Server (v${version}) listening on  ${JSON.stringify(
      fastify.server.address()
    )} ${fastify.server.address().port}`
  );
});
module.exports = fastify;
