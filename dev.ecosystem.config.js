module.exports = {
  apps: [
      {
        "name": "novu-api",
        "cwd": "/home/ec2-user/novu/",
        "script": "npm run start:api:dev"
      },
      {
        "name": "novu-web",
        "cwd": "/home/ec2-user/novu/apps/web/",
        // ":dev"
        "script": "npm run start"
        // "script": "npm run start:static:build"
      },
      {
        "name": "novu-widget",
        "cwd": "/home/ec2-user/novu/apps/widget/",
        "script": "npm run start:dev"
      },
      {
        "name": "novu-worker",
        "cwd": "/home/ec2-user/novu/apps/worker/",
        "script": "npm run start:dev"
      },
      {        
        "name": "novu-ws",
        "cwd": "/home/ec2-user/novu/apps/ws/",
        "script": "npm run start:dev"
      }
  ]
}
