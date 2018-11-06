const init = require("./actions/init");
const create = require("./actions/create");
const up = require("./actions/up");
const run = require("./actions/run");
const down = require("./actions/down");
const status = require("./actions/status");
const database = require("./env/database");
const config = require("./env/configFile");

module.exports = {
  init,
  create,
  up,
  down,
  run,
  status,
  database,
  config
};
