const {MongoClient} = require("mongodb");
const _ = require("lodash");
const configFile = require("./configFile");

module.exports = {
  async connect(configOverride = {}) {
    const config = Object.assign(configOverride, configFile.read());
    const url = configFile.get(config, "mongodb.url");
    const databaseName = configFile.get(config, "mongodb.databaseName");
    const options = _.get(config, "mongodb.options");

    if (!url) {
      throw new Error("No `url` defined in config file!");
    }

    if (!databaseName) {
      throw new Error(
        "No `databaseName` defined in config file! This is required since migrate-mongo v3. " +
        "See https://github.com/seppevs/migrate-mongo#initialize-a-new-project"
      );
    }

    const client = await MongoClient.connect(
      url,
      options
    );

    const db = client.db(databaseName);
    db.close = client.close;
    return db;
  }
};
