module.exports = {
  apps: [
    {
      "name": "novu-api",
      "cwd": "/home/ec2-user/novu/apps/api/",
      "script": "npm run start:prod"
    },
    // {
    //   "name": "novu-web",
    //   "cwd": "/home/ec2-user/novu/apps/web/",
    //   // ":dev"
    //   // "script": "npm run start"
    //   // "script": "npm run start:static:build"
    //   "script": "npm run start:static:build:http-only"
    // },
    {
      "name": "novu-widget",
      "cwd": "/home/ec2-user/novu/apps/widget/",
      "script": "npm run start:dev"
    },
    {
      "name": "novu-worker",
      "cwd": "/home/ec2-user/novu/apps/worker/",
      "script": "npm run start:prod"
    },
    {        
      "name": "novu-ws",
      "cwd": "/home/ec2-user/novu/apps/ws/",
      "script": "npm run start:prod"
    }
  ]
}
