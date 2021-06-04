const _ = require('lodash');
const { logger } = require('./logger');

const chalkX = require('chalk');
const chalk = new chalkX.Instance({ level: 2 });

function fmtObj(obj) {
  return Object.entries(obj).reduce((log, [key, value]) => {
    return log + chalk` {blue ${key}: }{green ${value}}`;
  }, '');
}
function fmtRet(what, obj) {
  let tag = chalk.white.bgGrey(what);
  if (what === 'failed') tag = chalk.white.bgRed(what);
  return tag + '  ' + fmtObj(obj);
}
function logObj(what, obj, ...rest) {
  logger.info(chalk.white.bgGrey(what), fmtObj(obj), ...rest);
}
function logKeys(what, obj, ...rest) {
  const obj2 = _.pickBy(obj, ([key, value]) => key.match(/id$/i) || key === 'tableName');
  logger.info(chalk.white.bgGrey(what), fmtObj(obj2), ...rest);
}
function logCountObj(what, obj) {
  const log = Object.entries(obj).reduce((log, [key, value]) => {
    // if (value.length && typeof value === 'object') {
    if (_.isArray(value)) {
      return log + chalk` {hsl(21,74,25) ${key}: }{hsl(61,63,60) ${value.length}}`;
    } else return log;
  }, '');
  let name = obj.name ? chalk.hsl(351, 38, 50)(obj.name) : '';
  logger.info(chalk.grey('      ===>'), name, log);
}
module.exports = { logCountObj, logObj, fmtObj, fmtRet };
