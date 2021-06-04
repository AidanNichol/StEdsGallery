const Sequelize = require("sequelize");
const { DataTypes } = require("sequelize");
const getenv = require("getenv");

// const { logKeys } = require('../util/logObj');
// const { logTrace } = require('../util/logTrace');

// const
//  = process.env.NODE_ENV || 'development';
// const config = require("./config.json")[env];
// config.logging = console.log;
// const db = {};
const dbLocation = getenv("DB_LOCATION", ".");

let sequelize = new Sequelize(
  `${dbLocation}/gallery${dbLocation}sqlite`,
  "aidan",
  null,
  {
    dialect: "sqlite",
    storage: `${dbLocation}/gallery.sqlite`,
    logging: false,
  }
);

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
    hidden: { type: DataTypes.BOOLEAN, defaultValue: false },
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
