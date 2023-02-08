const dotenv = require("dotenv");
dotenv.config();
const Sequelize = require("sequelize");
const { DataTypes } = require("sequelize");
const getenv = require("getenv");
const jetpack = require("fs-jetpack");

let sequelize = new Sequelize({
	dialect: "mysql",
	dialectOptions: {
		host: "localhost",
		user: getenv("mysql_user"),
		database: getenv("mysql_walks_database"),
		password: getenv("mysql_password"),
	},
	logging: () => {},
	// logging: console.log,
});

const region = sequelize.define(
	"region",
	{
		regid: {
			allowNull: false,
			autoIncrement: true,
			primaryKey: true,
			type: DataTypes.STRING,
		},
		regname: DataTypes.STRING,
	},
	{
		timestamps: false,
	},
);
const route = sequelize.define(
	"route",
	{
		no: { type: DataTypes.STRING, primaryKey: true },
		date: { type: DataTypes.STRING, primaryKey: true },
		distance: DataTypes.FLOAT,
		mmdistance: DataTypes.FLOAT,
		ascent: DataTypes.NUMBER,
		descent: DataTypes.NUMBER,
		leader: DataTypes.STRING,
		dropOff: DataTypes.NUMBER,
		leaving: DataTypes.STRING,
	},
	{
		timestamps: false,
	},
);

const walk = sequelize.define(
	"walk",
	{
		date: {
			allowNull: false,
			autoIncrement: true,
			primaryKey: true,
			type: DataTypes.STRING,
		},
		year: DataTypes.STRING,
		time: { type: DataTypes.STRING, defaultValue: "8:00" },
		area: DataTypes.STRING,
		organizer: DataTypes.STRING,
		regid: { type: DataTypes.STRING, defaultValue: "-" },
		map: DataTypes.STRING,
		finish: DataTypes.STRING,
		coffee: DataTypes.STRING,
		evening: DataTypes.STRING,
		details: { type: DataTypes.STRING, defaultValue: "N" },
		top: { type: DataTypes.NUMBER, defaultValue: 0 },
		bottom: { type: DataTypes.NUMBER, defaultValue: 0 },
		left: { type: DataTypes.NUMBER, defaultValue: 0 },
		right: { type: DataTypes.NUMBER, defaultValue: 0 },
		orientation: DataTypes.STRING,
		scaledPrf: { type: DataTypes.STRING, defaultValue: "N" },
		legendLeft: { type: DataTypes.NUMBER, defaultValue: 0 },
		legendTop: { type: DataTypes.NUMBER, defaultValue: 0 },
		legend: { type: DataTypes.STRING },
		viaTT: { type: DataTypes.NUMBER, defaultValue: 0 },
		pickupGHS: { type: DataTypes.NUMBER, defaultValue: 0 },
		showSegNames: DataTypes.BOOLEAN,
		mapsDue: DataTypes.STRING,
		busLocation: DataTypes.STRING,
		busRoute: DataTypes.STRING,
		special: DataTypes.STRING,
		leaving: DataTypes.STRING,
		byLine: DataTypes.STRING,
		bankHoliday: { type: DataTypes.NUMBER, defaultValue: 0 },
	},
	{
		timestamps: false,
	},
);
region.hasMany(walk, { foreignKey: "regid", sourceKey: "regid" });
walk.belongsTo(region, { foreignKey: "regid", sourceKey: "regid" });
walk.hasMany(route, { foreignKey: "date", sourceKey: "date" });
route.belongsTo(walk, { foreignKey: "date", sourceKey: "date" });

const display = sequelize.define(
	"display",
	{
		eventId: { type: DataTypes.NUMBER, primaryKey: true },
		where: { type: DataTypes.STRING, primaryKey: true },
		start: DataTypes.STRING,
		end: DataTypes.STRING,
		active: DataTypes.BOOLEAN,
	},
	{
		timestamps: false,
	},
);

const event = sequelize.define(
	"event",
	{
		id: {
			allowNull: false,
			autoIncrement: true,
			primaryKey: true,
			type: DataTypes.NUMBER,
		},
		title: DataTypes.STRING,
		start: DataTypes.STRING,
		end: DataTypes.STRING,
		time: DataTypes.STRING,
		description: DataTypes.STRING,
		location: DataTypes.STRING,
	},
	{
		timestamps: false,
	},
);
event.hasMany(display, { foreignKey: "eventId", sourceKey: "id" });
display.belongsTo(event, { foreignKey: "eventId", sourceKey: "id" });
module.exports = { walk, route, region, event, display, sequelize, Sequelize };
// module.exports = { walk, route, region, sequelize, Sequelize };
