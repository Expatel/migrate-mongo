const fnArgs = require("fn-args");
const {promisify} = require("util");

const migrationsDir = require("../env/migrationsDir");

module.exports = async (db, migrationName) => {


  const migrateFile = await migrationsDir.getFile(migrationName);
  if (!migrateFile) {
    throw new Error(`Migration ${migrationName} not found`);
  }

  const migration = migrationsDir.loadMigration(migrateFile);
  if (!migration.idempotent) {
    throw new Error(`Could not run non-idempotent migration`);
  }
  try {
    const args = fnArgs(migration.up);
    const up = args.length > 1 ? promisify(migration.up) : migration.up;
    await up(db);
  }
  catch (err) {
    throw new Error(
      `Could not migrate up ${migrationName}: ${err.message}`
    );
  }
};