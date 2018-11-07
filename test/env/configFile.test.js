/* eslint-disable no-underscore-dangle */
const {expect} = require("chai");
const sinon = require("sinon");
const proxyquire = require("proxyquire");

const path = require("path");

describe("configFile", () => {
  let configFile; // module under test
  let fs; // mocked dependencies

  function mockFs() {
    return {
      stat: sinon.stub()
    };
  }

  beforeEach(() => {
    fs = mockFs();
    configFile = proxyquire("../../lib/env/configFile", {
      "fs-extra": fs
    });
  });

  describe("shouldExist()", () => {
    it("should not yield an error if the config file exists", async () => {
      fs.stat.returns(Promise.resolve());
      await configFile.shouldExist();
    });

    it("should yield an error if the config file does not exist", async () => {
      const configPath = path.join(process.cwd(), "migrate-mongo-config.js");
      fs.stat.returns(Promise.reject(new Error("It does not exist")));
      try {
        await configFile.shouldExist();
        expect.fail("Error was not thrown");
      } catch (err) {
        expect(err.message).to.equal(
          `config file does not exist: ${configPath}`
        );
      }
    });
  });

  describe("shouldNotExist()", () => {
    it("should not yield an error if the config file does not exist", async () => {
      const error = new Error("File does not exist");
      error.code = "ENOENT";
      fs.stat.returns(Promise.reject(error));
      await configFile.shouldNotExist();
    });

    it("should yield an error if the config file exists", async () => {
      const configPath = path.join(process.cwd(), "migrate-mongo-config.js");
      fs.stat.returns(Promise.resolve());
      try {
        await configFile.shouldNotExist();
        expect.fail("Error was not thrown");
      } catch (err) {
        expect(err.message).to.equal(
          `config file already exists: ${configPath}`
        );
      }
    });
  });

  describe("getConfigFilename()", () => {
    it("should return the config file name", () => {
      expect(configFile.getConfigFilename()).to.equal(
        "migrate-mongo-config.js"
      );
    });
  });

  describe("get()", () => {
    it("should attempt to read the config file", done => {
      const configPath = path.join(process.cwd(), "migrate-mongo-config.js");
      try {
        configFile.get("mongodb.databaseName");
        expect.fail("Error was not thrown");
      } catch (err) {
        expect(err.message).to.equal(`Cannot find module '${configPath}'`);
        done();
      }
    });

    it("should be possible to read a custom, absolute config file path", done => {
      global.options = {file: "/some/absoluete/path/to/a-config-file.js"};
      try {
        configFile.get("mongodb.databaseName");
        expect.fail("Error was not thrown");
      } catch (err) {
        expect(err.message).to.equal(
          `Cannot find module '${global.options.file}'`
        );
        done();
      }
    });

    it("should be possible to read a custom, relative config file path", done => {
      global.options = {file: "./a/relative/path/to/a-config-file.js"};
      const configPath = path.join(process.cwd(), global.options.file);
      try {
        configFile.get("mongodb.databaseName");
        expect.fail("Error was not thrown");
      } catch (err) {
        expect(err.message).to.equal(`Cannot find module '${configPath}'`);
        done();
      }
      finally {
        global.options = undefined;
      }
    });

    it("should be possible to override config with global.configOverrides", done => {
      const {readRaw} = configFile;
      configFile.readRaw = () => ({mongodb: {url: "initial url", databaseName: "initial databaseName"}});
      try {
        global.configOverrides = {
          mongodb: {
            url: "overridden url"
          }
        };

        expect(configFile.get("mongodb.url")).to.equal("overridden url");
        expect(configFile.get("mongodb.databaseName")).to.equal("initial databaseName");
        done();
      }
      finally {
        configFile.readRaw = readRaw;
        delete global.configOverrides;
        global.options = undefined;
      }
    });
  });

  it("should resolve env settings on get()", done => {
    const {readRaw} = configFile;
    configFile.readRaw = () => ({test: {"env": "ENV"}});
    try {
      process.env.ENV = "value";

      expect(configFile.get("test")).to.equal("value");
      done();
    }
    finally {
      configFile.readRaw = readRaw;
    }
  });

  it("should return object on get()", done => {
    const {readRaw} = configFile;
    configFile.readRaw = () => ({test: {key: "value"}});
    try {
      process.env.ENV = "value";

      expect(configFile.get("test").key).to.equal("value");
      done();
    }
    finally {
      configFile.readRaw = readRaw;
    }
  });
});
