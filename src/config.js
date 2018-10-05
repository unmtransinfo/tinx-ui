const config = {};

config.development = {
  API_ROOT: 'http://localhost:8000'
};

config.production = {
  API_ROOT: 'http://api.newdrugtargets.org'
};

export default config[process.env.NODE_ENV];

