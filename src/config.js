const config = {};

config.development = {
  //API_ROOT: 'http://localhost:8000'
  API_ROOT: 'https://api.newdrugtargets.org'
};

config.staging = {
  API_ROOT: 'https://api-staging.newdrugtargets.org'
};

config.production = {
  API_ROOT: 'https://api.newdrugtargets.org'
};

export default config[process.env.NODE_ENV];

