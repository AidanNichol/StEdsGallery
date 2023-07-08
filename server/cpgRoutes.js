const db = require("./galleryDB.js");
const sequelize = require("sequelize");
const { Op } = require("sequelize");

const fs = require("fs");
const util = require("util");
const path = require("path");
const Jimp = require("jimp");
const { add_picture } = require("./picmgmt.inc.js");
const { isOkForRole } = require("./authRoutes.js");

const dateFn = require("date-fns");
const jetpack = require("fs-jetpack");

const { read, exists, write, cwd } = jetpack;
const { format, parseISO } = dateFn;
// const { Op } = sequelize;

const isDev = (dev = true) => dev;
const galleryDataPath = process.env.GALLERY_DATA;

async function cpgRoutes(fastify, options) {
  const logMe = function () {
    let result = ""; // initialize list
    // iterate through arguments
    console.warn("logme", ...arguments);
    for (let i = 0; i < arguments.length; i++) {
      let a = arguments[i];
      result += `${typeof a === "object" ? JSON.stringify(a) : String(a)} `;
    }
    fastify.log.info(result);
    return result;
  };
  logMe("test", 2002, { a: 1, b: 2 });
  sequelize.options.logging = logMe;
  fastify.get("/", async (request, reply) => {
    return { hello: "world", post: false };
  });
  fastify.post("/", async (request, reply) => {
    return { hello: "world", post: true };
  });

  fastify.get("/getTables", async (request) => {
    const [results, metadata] = await db.sequelize.query(
      "SELECT name FROM sqlite_master WHERE type ='table' AND name NOT LIKE 'sqlite_%';"
    );
    logMe("getPictures ", results, metadata);

    return results;
  });
  fastify.get("/getPictures", async (request) => {
    // const [results, metadata] = await db.sequelize.query(
    //   "SELECT name FROM sqlite_master WHERE type ='table' AND name NOT LIKE 'sqlite_%';"
    // );
    // logMe("getPictures ", results, metadata);
    const pictures = await db.picture.findAll({
      order: [["aid", "DESC"]],
      where: { hidden: 0 },
      limit: 30,
      // where: { album: { title: { startsWith: "20" } } },

      include: {
        model: db.album,
        where: { hidden: 0 },
        required: true,
        attributes: ["title", "directory", "hidden"],
      },
    });
    // logMe("getPictures pictures", pictures);
    return pictures;
  });

  fastify.get("/getYears", async (request) => {
    const aggregations = await db.album.findAll({
      group: "year",
      attributes: ["year", [sequelize.fn("COUNT", "year"), "count"]],
      count: {
        year: true,
      },
      order: [["year", "DESC"]],
    });
    return aggregations;
  });

  fastify.get("/getAlbumList/:year", async (request) => {
    const { year } = request.params;
    const aggregations = await db.album.findAll({
      attributes: [
        "aid",
        "title",
        [sequelize.fn("COUNT", sequelize.col("pictures.aid")), "count"],
      ],
      include: {
        model: db.picture,
        attributes: [],
        where: { hidden: 0 },
      },
      group: "album.aid",
      where: { year: year, hidden: 0 },
      order: [["title", "DESC"]],
    });
    return aggregations;
  });

  fastify.get("/getAllAlbums", async (request) => {
    const { year } = request.params;
    const aggregations = await db.album.findAll({
      attributes: [
        "aid",
        "title",
        "year",
        "hidden",
        [sequelize.fn("COUNT", sequelize.col("pictures.aid")), "count"],
      ],
      include: {
        model: db.picture,
        attributes: [],
      },
      group: "album.aid",
      order: [["title", "DESC"]],
    });
    logMe("aggregations", aggregations);
    return aggregations;
  });

  fastify.get("/getAlbum/:aid", async (request) => {
    const { aid } = request.params;

    const album = db.album.findByPk(parseInt(aid), {
      include: { model: db.picture, where: { hidden: 0 } },
    });

    return album;
  });
  fastify.get("/getAlbumAll/:aid", async (request) => {
    const { aid } = request.params;

    const album = db.album.findByPk(parseInt(aid), {
      include: { model: db.picture },
    });

    return album;
  });

  fastify.get("/getLatestAlbums", async () => {
    const albums = await db.album.findAll({
      attributes: ["aid", "title"],
      order: [["title", "DESC"]],
      where: { hidden: 0 },
      limit: 25,
    });
    return albums;
  });
  fastify.get("/testRole", async (req) => {
    const authSeq = req.cookies.authSeq;
    logMe("authSeq", req.cookies);
    if (!isOkForRole(req, "uploader")) {
      throw Error("not authorized for uploading");
    }
    return "OK";
  });

  fastify.get("/renameAlbum", async (req) => {
    const { aid, title } = await req.query;
    logMe({ aid, title });
    const count = await db.album.update({ title }, { where: { aid } });
    return { count };
  });
  fastify.get("/hideAlbum", async (req) => {
    const body = await req.query;

    const { aid, hidden } = body;
    logMe("Hidding", aid, hidden);
    const count = await db.album.update({ hidden }, { where: { aid } });
    return { count };
  });

  fastify.get("/changePhotographer", async (req, reply) => {
    const body = await req.query;
    const { ids, photographer } = body;
    if (!ids || !photographer) {
      reply
        .code(208)
        .send({ count: -1, msg: "no ids or photographer specified" });
      return;
    }
    const count = await db.picture.update(
      { photographer },
      { where: { pid: ids } }
    );
    return { count };
  });
  fastify.get("/changePhotographer2", async (req, reply) => {
    const { ids, photographer } = (await req.query) ?? {};
    if (!ids || !photographer) {
      reply
        .code(208)
        .send({ count: -1, msg: "no ids or photographer specified" });
      return;
    }
    const count = await db.picture.update(
      { photographer },
      { where: { pid: ids } }
    );
    return { count };
  });
  fastify.get("/changeCaption", async (req) => {
    const body = await req.query;
    const { ids, caption } = body;
    const count = await db.picture.update({ caption }, { where: { pid: ids } });
    return { count };
  });
  fastify.get("/changeHidden", async (req) => {
    const body = await req.query;
    const { ids, hidden } = body;
    const count = await db.picture.update(
      { hidden: hidden ? 1 : 0 },
      { where: { pid: ids } }
    );
    return { count };
  });
  fastify.get("/deleteAlbum", async (req) => {
    const body = await req.query;
    const { aid } = body;
    const album = await db.album.findByPk(aid);

    const folder = `${galleryDataPath}/${album.directory}`;
    const pics = jetpack.cwd(folder); // new jetpack context
    const pictures = await db.picture.findAll({ where: { aid } });
    const filter = pictures.map((p) => p.filename.replace(".", "*."));
    logMe(folder, { filter });
    const files = pics.find(".", { matching: filter });
    logMe({ files });
    files.forEach(pics.remove);
    const count = await db.album.destroy({ where: { aid } });
    return { count };
  });
  fastify.get("/deletePictures", async (req) => {
    const body = await req.query;
    const { ids, aid } = body;
    const album = await db.album.findByPk(aid);

    const folder = `${galleryDataPath}/${album.directory}`;
    const pics = jetpack.cwd(folder); // new jetpack context
    const pictures = await db.picture.findAll({ where: { pid: ids } });
    const filter = pictures.map((p) => p.filename.replace(".", "*."));
    logMe(folder, { filter });
    const files = pics.find(".", { matching: filter });
    logMe({ files });
    files.forEach(pics.remove);
    const count = await db.picture.destroy({ where: { pid: ids } });
    return { count };
  });
  fastify.get("/processUpload", async (req, reply) => {
    const { filename, albumTitle, photographer, tempFile } = req.query;
    console.warn("from query", new Date(), {
      filename,
      albumTitle,
      photographer,
      tempFile,
    });
    if (!isOkForRole(req, "uploader")) {
      throw Error("not authorized for uploading");
    }
    return processUpload(filename, albumTitle, photographer, tempFile);
  });
  fastify.post("/processUpload", async (req, reply) => {
    logMe("processUpload", req.headers);
    const body = await req.body;
    const { filename, albumTitle, photographer, tempFile } = body;
    console.warn("from body", new Date(), {
      filename,
      albumTitle,
      photographer,
      tempFile,
    });
    if (!isOkForRole(req, "uploader")) {
      throw Error("not authorized for uploading");
    }
    return processUpload(filename, albumTitle, photographer, tempFile);
  });

  async function processUpload(filename, albumTitle, photographer, tempFile) {
    try {
      const badDate =
        parseISO(albumTitle.substr(0, 10)).toString() === "Invalid Date";
      if (badDate) {
        throw Error("Invalid Album Title - must start with a valid date.");
      }

      const year = albumTitle.substr(0, 4);
      const directory = `${year}/${albumTitle.substr(0, 10)}`;
      console.warn({ year, directory });
      let album = await db.album.findOne({
        where: { title: albumTitle },
      });
      if (!album) {
        [album, created] = await db.album.upsert({
          title: albumTitle,
          year,
          directory,
        });
      }

      logMe(album);

      const { pid } = await db.picture.create({
        aid: album.aid,
        origFilename: filename,
        filename: "",
        photographer,
      });
      logMe({ pid, filename });
      logMe(filename.match(/^(.+)\.(.*?)$/));
      let [, file, ext] = filename.match(/^(.+)\.(.*?)$/);
      let newF = `pic${pid}.${ext}`;
      logMe(pid, tempFile, newF, directory);
      let { srcset, width, height } = await add_picture(
        logMe,
        tempFile,
        newF,
        directory
      );
      const update = await db.picture.update(
        {
          filename: newF,
          width,
          height,
          srcset,
        },
        { where: { pid: pid } }
      );
      logMe("Completed", pid, new Date());
      return { aid: album.aid, pid };
    } catch (error) {
      logMe(error);
      throw new Error(error);
    }
  }
}
module.exports = { cpgRoutes };
