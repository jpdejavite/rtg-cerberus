const { EnvVar } = require('./config/EnvVar');

const { buildGraphqlServer } = require('./graphql/GraphqlServer');
const { Database } = require('./db/Database');

(async () => {
  EnvVar.loadAll();

  const db = new Database();
  db.connectToConfig();
  await db.loadConfigs();

  const server = buildGraphqlServer(db);
  server.listen({ port: process.env.PORT }).then(({ url }) => {
    console.log(`🚀 Server ready at ${url}`);
  });
})();
