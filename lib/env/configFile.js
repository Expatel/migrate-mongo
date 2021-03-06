const fs = require("fs-extra");
const path = require("path");
const _ = require("lodash");

const DEFAULT_CONFIG_FILE_NAME = "migrate-mongo-config.js";

function getConfigPath() {
  const fileOptionValue = _.get(global.options, "file");
  if (!fileOptionValue) {
    return path.join(process.cwd(), DEFAULT_CONFIG_FILE_NAME);
  }

  if (path.isAbsolute(fileOptionValue)) {
    return fileOptionValue;
  }
  return path.join(process.cwd(), fileOptionValue);
}

module.exports = {
  DEFAULT_CONFIG_FILE_NAME,

  async shouldExist() {
    const configPath = getConfigPath();
    try {
      await fs.stat(configPath);
    } catch (err) {
      throw new Error(`config file does not exist: ${configPath}`);
    }
  },

  async shouldNotExist() {
    const configPath = getConfigPath();
    const error = new Error(`config file already exists: ${configPath}`);
    try {
      await fs.stat(configPath);
      throw error;
    } catch (err) {
      if (err.code !== "ENOENT") {
        throw error;
      }
    }
  },

  getConfigFilename() {
    return path.basename(getConfigPath());
  },

  readRaw() {
    return require(getConfigPath()); // eslint-disable-line
  },

  get(objPath) {
    const config = _.merge(this.readRaw(), global.configOverrides);

    let value = _.get(config, objPath);
    if (_.isObject(value) && !!value.env) {
      value = process.env[value.env];
    }
    return value;
  }
};
