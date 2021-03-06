// In this file you can configure migrate-mongo

module.exports = {
  mongodb: {
    // TODO Change (or review) the url to your MongoDB
    // Could be in form {"env":"ENVIRONMENT_VARIABLE"}
    url: "mongodb://localhost:27017",

    // TODO Change this to your database name:
    // Could be in form {"env":"ENVIRONMENT_VARIABLE"}
    databaseName: "YOURDATABASENAME",

    options: {
      useNewUrlParser: true // removes a deprecation warning when connecting
      //   connectTimeoutMS: 3600000, // increase connection timeout to 1 hour
      //   socketTimeoutMS: 3600000, // increase socket timeout to 1 hour
    }
  },

  // The migrations dir, can be an relative or absolute path. Only edit this when really necessary.
  migrationsDir: "migrations",

  // The mongodb collection where the applied changes are stored. Only edit this when really necessary.
  changelogCollectionName: "changelog"
};
