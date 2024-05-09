const config = {};

console.log('API_ROOT', process.env.API_ROOT);

config.development = {
  //API_ROOT: 'localhost:8000'
  API_ROOT: process.env.API_ROOT ? process.env.API_ROOT : 'https://api-staging.newdrugtargets.org'
};

config.staging = {
  API_ROOT: process.env.API_ROOT ? process.env.API_ROOT : 'https://api-staging.newdrugtargets.org'
};

config.production = {
  API_ROOT: process.env.API_ROOT ? process.env.API_ROOT : 'https://api.newdrugtargets.org'
};

export default config[process.env.NODE_ENV];

