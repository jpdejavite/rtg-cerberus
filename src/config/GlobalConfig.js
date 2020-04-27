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

  static get(key, defaultValue) {
    if (!data) {
      data = {};
    }

    const val = data[key];
    if (val === null || val === undefined) {
      return defaultValue;
    }
    return val;
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
