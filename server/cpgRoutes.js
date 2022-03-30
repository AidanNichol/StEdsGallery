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
const { format } = dateFn;
// const { Op } = sequelize;

const isDev = (dev = true) => dev;
const WALKDATA = isDev()
  ? "/Users/aidan/Websites/htdocsC"
  : "/home/ajnichol/public_html";

async function cpgRoutes(fastify, options) {
  fastify.get("/", async (request, reply) => {
    return { hello: "world" };
  });

  fastify.get("/getTables", async (request) => {
    const [results, metadata] = await db.sequelize.query(
      "SELECT name FROM sqlite_master WHERE type ='table' AND name NOT LIKE 'sqlite_%';"
    );
    console.log("getPictures ", results, metadata);

    return results;
  });
  fastify.get("/getPictures", async (request) => {
    // const [results, metadata] = await db.sequelize.query(
    //   "SELECT name FROM sqlite_master WHERE type ='table' AND name NOT LIKE 'sqlite_%';"
    // );
    // console.log("getPictures ", results, metadata);
    const pictures = await db.picture.findAll({
      order: [["aid", "DESC"]],
      limit: 30,
      // where: { album: { title: { startsWith: "20" } } },

      include: { model: db.album, attributes: ["title", "directory"] },
    });
    // console.log("getPictures pictures", pictures);
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
      },
      group: "album.aid",
      where: { year: year },
      order: [["title", "DESC"]],
    });
    return aggregations;
  });

  fastify.get("/getAlbum/:aid", async (request) => {
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
      limit: 25,
    });
    return albums;
  });
  fastify.get("/testRole", async (req) => {
    const authSeq = req.cookies.authSeq;
    console.log("authSeq", req.cookies);
    if (!isOkForRole(req, "uploader")) {
      throw Error("not authorized for uploading");
    }
    return "OK";
  });

  fastify.post("/upload", async (req) => {
    try {
      const authSeq = req.cookies.authSeq;
      console.log("authSeq", req.cookies);
      if (!isOkForRole(req, "uploader")) {
        throw Error("not authorized for uploading");
      }
      const buff = await req.body.photos[1].toBuffer();
      const filename = await req.body.photos[1].filename;
      const title = await req.body.albumTitle.value;
      const photographer = await req.body.photographer.value;
      const temp = `temp/_${filename}`;
      write(temp, buff);
      const year = title.substr(0, 4);
      const directory = `${year}/${title.substr(0, 10)}`;

      let album = await db.album.findOne({
        where: { title: title },
      });
      if (!album) {
        album = await db.album.create({
          title,
          year,
          directory,
        });
      }

      console.log(album);

      const { pid } = await db.picture.create({
        aid: album.aid,
        origFilename: filename,
        filename: "",
        photographer,
      });

      let [, file, ext] = filename.match(/^(.+)\.(.*?)$/);
      let newF = `pic${pid}.${ext}`;
      console.log(pid, temp, newF, directory);
      let { srcset, width, height } = await add_picture(
        fastify.log,
        temp,
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
      return {};
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  });
}
module.exports = { cpgRoutes };
