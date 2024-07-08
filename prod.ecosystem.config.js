module.exports = {
  apps: [
      {
        "name": "novu-api",
        "cwd": "/usr/novu/apps/api/",
        "script": "npm run start:prod"
      },
      {
        "name": "novu-web",
        "cwd": "/usr/novu/apps/web/",
        // ":dev"
        // "script": "npm run start"
        "script": "npm run start:static:build"
      },
      // {
      //   "name": "novu-widget",
      //   "cwd": "/usr/novu/apps/widget/",
      //   "script": "npm run start:dev"
      // },
      {
        "name": "novu-worker",
        "cwd": "/usr/novu/apps/worker/",
        "script": "npm run start:prod"
      },
      {        
        "name": "novu-ws",
        "cwd": "/usr/novu/apps/ws/",
        "script": "npm run start:prod"
      }
  ]
}
