// Require the framework and instantiate it
const fastifyPkg = require("fastify");
const fastifyCors = require("fastify-cors");
const fastifyCookie = require("fastify-cookie");
const fastifyStatic = require("fastify-static");
const multipart = require("fastify-multipart");

const { cpgRoutes } = require("./cpgRoutes.js");
const { authRoutes } = require("./authRoutes.js");
const { walkRoutes } = require("./walkRoutes.js");
const { eventRoutes } = require("./eventRoutes.js");

const getEnv = require("getenv");
const path = require("path");
const jetpack = require("fs-jetpack");
const getenv = require("getenv");
const http = require("http");
const { cwd, read } = jetpack;
const galleryDataPath = process.env.GALLERY_DATA;
console.log("galleryData", galleryDataPath);
const fs = require("fs");
const walkDataPath = process.env.WALK_DATA;
console.log("walkdata", walkDataPath);
const sitePrefix = getenv("SITE_PREFIX", "");
const serverFactory = (handler, opts) => {
  const server = http.createServer((req, res) => {
    handler(req, res);
  });

  return server;
};

const https = getenv.bool("DEVELOPMENT")
  ? {
      https: {
        key: read("./server.key"),
        cert: read("./server.crt"),
      },
    }
  : {};
const fastify = fastifyPkg({
  serverFactory,
  logger: {
    level: "info",
    file: "logs/fastify.log", // will use pino.destination()
  },
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

// fastify.register(fastifyCors, {
//   credentials: true,
//   origin: [/localhost/, /stedwardsfellwalkers\.co\.uk$/],
// });
fastify.get(`/${sitePrefix}`, async (request, reply) => {
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
    await fastify.listen(5555);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(
    `listening on ${fastify.server.address()}:${fastify.server.address().port}`
  );
};
runit();
