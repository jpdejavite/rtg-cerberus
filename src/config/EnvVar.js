let envVars = null;

const EnvVarKeys = {
  FIREBASE_CREDENTIAL: 'FIREBASE_CREDENTIAL',
  PORT: 'PORT',
};

class EnvVar {
  static set(key, value) {
    if (!envVars) {
      envVars = {};
    }
    envVars[key] = value;
  }

  static get(key) {
    if (!envVars) {
      envVars = {};
    }
    return envVars[key];
  }

  static loadAll() {
    Object.keys(process.env).forEach((key) => {
      EnvVar.set(key, process.env[key]);
    });

    Object.values(EnvVarKeys).forEach((key) => {
      if (envVars[key] === null || envVars[key] === undefined) {
        throw new Error(`missing env var ${key}`);
      }
    });
  }
}

module.exports = { EnvVar, EnvVarKeys };
