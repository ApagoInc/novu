module.exports = {
  apps: [
      {
        "name": "novu-api",
        "cwd": "/usr/novu/",
        "script": "npm run start:api:dev"
      },
      {
        "name": "novu-web",
        "cwd": "/usr/novu/apps/web/",
        "script": "npm run start:dev"
      },
      {
        "name": "novu-widget",
        "cwd": "/usr/novu/apps/widget/",
        "script": "npm run start:dev"
      },
      {
        "name": "novu-worker",
        "cwd": "/usr/novu/apps/worker/",
        "script": "npm run start:dev"
      },
      {        
        "name": "novu-ws",
        "cwd": "/usr/novu/apps/ws/",
        "script": "npm run start:dev"
      }
  ]
}
