window._env_ = {
  // TODO - update hardcoded values to be dynamic, or localhost(?) -
  // OR, remove altogether if the prior env issues in the webapp have been resolved.
  SKIP_PREFLIGHT_CHECK: 'true',
  REACT_APP_ENVIRONMENT: 'production',
  // REACT_APP_ENVIRONMENT: 'dev',
  REACT_APP_API_URL: 'https://notifications.lscscout.com:9000/api',
  // 'https://novu.apagocloud.net:3000',
  REACT_APP_WS_URL: 'https://notifications.lscscout.com:9000',
  // 'https://notifications.lscscout.com:9000/events', 
  // as opposed to '/ws'
  // 'https://novu.apagocloud.net:3002',
  REACT_APP_DOCKER_HOSTED_ENV: 'false' // I couldn't find a convincing reason to set this to true. 
  // 'true',
};
