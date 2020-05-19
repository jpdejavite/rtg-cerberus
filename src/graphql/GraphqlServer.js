const { ApolloServer, ApolloError } = require('apollo-server');
const { ApolloGateway, RemoteGraphQLDataSource } = require('@apollo/gateway');
const jwt = require('jsonwebtoken');

const { GlobalConfig, GlobalConfigKeys } = require('../config/GlobalConfig');
const { Config, ConfigKeys } = require('../config/Config');

const { Constant } = require('../constant/Constant');


const isUserToken = (payload) => payload.iss === Constant.USER_APP_NAME;

class AuthenticatedDataSource extends RemoteGraphQLDataSource {
  // eslint-disable-next-line class-methods-use-this
  willSendRequest({ request, context }) {
    let tokenPayload = { iss: Constant.APP_NAME };
    if (context.authorizationPayload) {
      tokenPayload = context.authorizationPayload;
    }
    try {
      const privateKey = Config.get(ConfigKeys.PRIVATE_KEY).replace(/\\n/gi, '\n');
      request.http.headers.set('gateway-token', jwt.sign(tokenPayload, privateKey, { algorithm: 'ES512' }));
    } catch (e) {
      console.log(e);
    }
  }
}

const buildGraphqlServer = (db) => {
  const services = {};
  const serviceList = Config.get(ConfigKeys.SERVICE_LIST);
  const gateway = new ApolloGateway({
    serviceList: JSON.parse(serviceList),
    buildService: ({ url }) => new AuthenticatedDataSource({ url }),
    // Experimental: Enabling this enables the query plan view in Playground.
    __exposeQueryPlanExperimental: false,
  });

  const GraphqlServer = new ApolloServer({
    playground: Config.get(ConfigKeys.ENABLE_PLAYGROUND),
    gateway,
    context: async (context) => {
      const { req } = context;
      if (req && req.headers && req.headers.authorization) {
        const authorization = req.headers.authorization.replace('Bearer ', '');
        if (authorization) {
          let payload = jwt.decode(authorization);
          if (!payload || !payload.iss) {
            throw new ApolloError('Invalid jwt payload', 'invalid_jwt_payload');
          }

          let service = services[payload.iss];
          if (!service) {
            const configDb = db.getConfigDb().firestore();
            const serviceDoc = await configDb.collection('services').doc(payload.iss).get();
            if (!serviceDoc || !serviceDoc.data()) {
              throw new ApolloError('Iss not recognized', 'iss_not_recognized');
            }
            service = serviceDoc.data();
            services[payload.iss] = service;
          }
          if (!service.secret || !service.roles) {
            throw new ApolloError('Iss invalid data', 'iss_invalid_data');
          }

          try {
            payload = jwt.verify(authorization, service.secret);
          } catch (e) {
            throw new ApolloError('Token not authorized', 'token_not_authorized');
          }

          const expirationInMinutesKey = isUserToken(payload)
            ? GlobalConfigKeys.USER_TOKEN_EXPIRATION_IN_MINUTES : GlobalConfigKeys.TOKEN_EXPIRATION_IN_MINUTES;
          if (new Date().getTime() - (payload.iat || 0) * 1000 > (GlobalConfig.get(expirationInMinutesKey, 5) * 60 * 1000)) {
            throw new ApolloError('Token expired', 'token_expired');
          }

          const authorizationPayload = {};
          authorizationPayload.service = payload.iss;
          authorizationPayload.roles = service.roles;
          if (isUserToken(payload)) {
            if (payload.uid) {
              authorizationPayload.uid = payload.uid;
            }
            if (payload.roles) {
              authorizationPayload.roles = payload.roles;
            }
          }
          authorizationPayload.iss = Constant.APP_NAME;
          return Object.assign(context, { authorizationPayload });
        }
      }

      throw new ApolloError('User not authenticated', 'user_not_authenticated');
    },
    engine: false,
    subscriptions: false,
  });
  return GraphqlServer;
};

module.exports = { buildGraphqlServer };
