let data = null;

const ConfigKeys = {
  PRIVATE_KEY: 'privateKey',
  SERVICE_LIST: 'serviceList',
};

class Config {
  static set(key, value) {
    if (!data) {
      data = {};
    }
    data[key] = value;
  }

  static get(key) {
    if (!data) {
      data = {};
    }
    return data[key];
  }

  static loadAll(configs) {
    Object.keys(configs).forEach((key) => {
      Config.set(key, configs[key]);
    });

    Object.values(ConfigKeys).forEach((key) => {
      if (data[key] === null || data[key] === undefined) {
        throw new Error(`missing config ${key}`);
      }
    });
  }
}

module.exports = { Config, ConfigKeys };
