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
      include: { model: db.display, order: ["where"] },
    });
  });
  fastify.get("/:id", async (request, reply) => {
    return await db.event.findByPk(request.params.id, {
      include: { model: db.display, order: ["where"] },
    });
  });
  fastify.post("/save/:id", async (req) => {
    try {
      console.log("events save", req.params);
      // const authSeq = req.cookies.authSeq;
      // console.log("authSeq", req.cookies);
      isOkForRole(req, "admin");

      const id = req.params.id;
      const { unsaved, dirty, ...data } = await req.body;

      let evnt = await db.event.findOne({
        where: { id: id },
      });
      if (!evnt) {
        await db.event.create(data, { include: db.display });
        // await db.display.bulkCreate(displays);
      } else {
        await db.event.update(data, { where: { id } });
        for (const disp of data.displays) {
          await db.display.update(disp, {
            where: { eventId: id, where: disp.where },
          });
        }
      }

      return {};
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  });
  fastify.delete("/:id", async (req, reply) => {
    isOkForRole(req, "admin");
    const id = req.params.id;

    // await db.display.destroy({ where: { eventId: id } });
    await db.event.destroy({ where: { id } });
  });
}
module.exports = { eventRoutes };
