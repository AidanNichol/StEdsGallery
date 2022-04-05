const Sequelize = require("sequelize");
const { DataTypes } = require("sequelize");
const getenv = require("getenv");

// const { logKeys } = require('../util/logObj');
// const { logTrace } = require('../util/logTrace');

let sequelize = new Sequelize({
  dialect: "mysql",
  dialectOptions: {
    host: "localhost",
    user: getenv("mysql_user"),
    database: getenv("mysql_gallery_database"),
    password: getenv("mysql_password"),
  },
  logging: console.log,
});
sequelize.addHook("afterDestroy", (record) => {
  // logKeys("destroyed", record);
});

// db.album = require("./albums.js")(sequelize);
const album = sequelize.define(
  "album",
  {
    aid: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.NUMBER,
    },
    title: DataTypes.STRING,
    description: DataTypes.STRING,
    hidden: { type: DataTypes.NUMBER, defaultValue: 0 },
    directory: DataTypes.STRING,
    year: DataTypes.STRING,

    pic_count: { type: DataTypes.NUMBER, defaultValue: 0 },
  },
  {
    timestamps: false,
  }
);
const picture = sequelize.define(
  "picture",
  {
    pid: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.NUMBER,
    },
    aid: DataTypes.NUMBER,
    filename: DataTypes.STRING,
    origFilename: DataTypes.STRING,
    filesize: DataTypes.NUMBER,
    width: DataTypes.NUMBER,
    height: DataTypes.NUMBER,
    title: DataTypes.STRING,
    hidden: { type: DataTypes.NUMBER, defaultValue: 0 },

    caption: DataTypes.STRING,

    photographer: DataTypes.STRING,

    srcset: DataTypes.STRING,
  },
  {
    timestamps: false,
  }
);

album.hasMany(picture, { foreignKey: "aid", sourceKey: "aid" });
picture.belongsTo(album, { foreignKey: "aid", sourceId: "aid" });

module.exports = { album, picture, sequelize, Sequelize };
