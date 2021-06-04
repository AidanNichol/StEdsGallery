const db = require("./walkDB.js");
const sequelize = require("sequelize");
const { Op } = require("sequelize");

const fs = require("fs");
const util = require("util");
const path = require("path");
const { isOkForRole } = require("./authRoutes.js");
const getenv = require("getenv");

const dateFn = require("date-fns");
const jetpack = require("fs-jetpack");
const { read, exists, write, cwd } = jetpack;
const { format } = dateFn;
// const { Op } = sequelize;

async function eventRoutes(fastify, options) {
  fastify.get("/", async (request, reply) => {
    return "hello world";
  });
  fastify.get("/getTables", async (request) => {
    const [results, metadata] = await db.sequelize.query(
      "SELECT name FROM sqlite_master WHERE type ='table' AND name NOT LIKE 'sqlite_%';"
    );
    fastify.log.warn("tables: " + JSON.stringify(results));
    console.log("getPictures ", results, metadata);

    return results;
  });
  fastify.get("/all", async (request, reply) => {
    return await db.event.findAll({
      include: db.display,
    });
  });
}
module.exports = { eventRoutes };
