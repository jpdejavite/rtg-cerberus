let data = null;

const GlobalConfigKeys = {
  GATEWAY_PUBLIC_KEY: 'gatewayPublicKey',
  TOKEN_EXPIRATION_IN_MINUTES: 'tokenExpirationInMinutes',
  USER_TOKEN_EXPIRATION_IN_MINUTES: 'userTokenExpirationInMinutes',
};

class GlobalConfig {
  static set(key, value) {
    if (!data) {
      data = {};
    }
    data[key] = value;
  }

  static get(key) {
    if (process.env[key]) {
      console.log(`config ${key} overrided by env var`);
      return process.env[key];
    }

    if (!data) {
      data = {};
    }

    return data[key];
  }

  static loadAll(configs) {
    Object.keys(configs).forEach((key) => {
      GlobalConfig.set(key, configs[key]);
    });

    Object.values(GlobalConfigKeys).forEach((key) => {
      if (data[key] === null || data[key] === undefined) {
        throw new Error(`missing config ${key}`);
      }
    });
  }
}

module.exports = { GlobalConfig, GlobalConfigKeys };
