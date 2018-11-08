/* eslint-disable no-unused-vars */
const {expect} = require("chai");
const sinon = require("sinon");

const proxyquire = require("proxyquire");

describe("up", () => {
  let run;
  let configFile;
  let migrationsDir;
  let db;

  let idempotentMigration;
  let nonIdempotentMigration;
  let changelogCollection;

  const IDEMPOTENT_MIGRATION_NAME = "20181106183300-idempotent_migration";
  const NON_IDEMPOTENT_MIGRATION_NAME = "20181106183300-non-idempotent_migration";

  function mockMigrationsDir() {
    const mock = {};
    mock.loadMigration = sinon.stub();
    mock.loadMigration
      .withArgs(`${IDEMPOTENT_MIGRATION_NAME}.js`)
      .returns(idempotentMigration);
    mock.loadMigration
      .withArgs(`${NON_IDEMPOTENT_MIGRATION_NAME}.js`)
      .returns(nonIdempotentMigration);

    mock.getFileNames = sinon.stub();
    mock.getFileNames
      .returns([`${IDEMPOTENT_MIGRATION_NAME}.js`, `${NON_IDEMPOTENT_MIGRATION_NAME}.js`]);

    return mock;
  }

  function mockDb() {
    const mock = {};
    mock.collection = sinon.stub();
    mock.collection.withArgs("changelog").returns(changelogCollection);
    return mock;
  }

  function mockMigration(idempotent) {
    const migration = {
      up: sinon.stub(),
      idempotent
    };
    migration.up.returns(Promise.resolve());
    return migration;
  }

  function loadRunWithInjectedMocks() {
    return proxyquire("../lib/actions/run", {
      "../env/configFile": configFile,
      "../env/migrationsDir": migrationsDir
    });
  }

  function mockConfigFile() {
    return {
      shouldExist: sinon.stub().returns(Promise.resolve()),
      get: sinon.stub()
        .withArgs("changelogCollectionName")
        .returns("changelog")
    };
  }

  function mockChangelogCollection() {
    return {
      insertOne: sinon.stub().returns(Promise.resolve())
    };
  }

  beforeEach(() => {
    idempotentMigration = mockMigration(true);
    nonIdempotentMigration = mockMigration(false);

    changelogCollection = mockChangelogCollection();

    configFile = mockConfigFile();
    migrationsDir = mockMigrationsDir();
    db = mockDb();

    run = loadRunWithInjectedMocks();
  });

  it("should run idempotent migration", async () => {
    await run(db, IDEMPOTENT_MIGRATION_NAME);
    expect(idempotentMigration.up.called).to.equal(true);
  });


  it("should save to changelog", async () => {
    const clock = sinon.useFakeTimers(
      new Date("2016-06-09T08:07:00.077Z").getTime()
    );

    try {
      await run(db, IDEMPOTENT_MIGRATION_NAME);

      expect(changelogCollection.insertOne.called).to.equal(true);
      expect(changelogCollection.insertOne.callCount).to.equal(1);
      expect(changelogCollection.insertOne.getCall(0).args[0]).to.deep.equal({
        appliedAt: new Date("2016-06-09T08:07:00.077Z"),
        fileName: "20181106183300-idempotent_migration.js",
        method: "run"
      });
    } finally {
      clock.restore();
    }
  });


  it("should not run idempotent migration", async () => {

    try {
      await run(db, NON_IDEMPOTENT_MIGRATION_NAME);
      expect.fail("Error was not thrown");
    } catch (err) {
      expect(err.message).to.deep.equal(
        "Could not run non-idempotent migration"
      );
    }
  });

  it("should not run unknown migration", async () => {

    try {
      await run(db, "Unknown");
      expect.fail("Error was not thrown");
    } catch (err) {
      expect(err.message).to.deep.equal(
        "Migration Unknown not found"
      );
    }
  });

});