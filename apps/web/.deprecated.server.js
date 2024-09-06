// // @ts-check
// const express = require('express')
// const { readdirSync } = require('node:fs')
// const http = require('http')

// const webServLog = (...args) => { console.log('[web server]', args) }

// webServLog('[DEBUG] - app.js, process.cwd()', process.cwd(), 'current dir contents:', readdirSync(process.cwd()))

// const app = express()



// // localhost:4200 - webapp    - https://notifications.lscscout.com/web
// // localhost:3000 - api       - https://notifications.lscscout.com/api
// // localhost:3002 - websocket - https://notifications.lscscout.com/ws


// // We use the `docker` variable to inform how we are locally addressing each of the proxy server's targets.
// // Docker-composed projects can communicate with one another using the container "service" name - i.e, "web" for the web frontend, "ws" for the websocket.
// // Outside of docker, we are addressing the proxy targets at 'localhost'.

// // app.use('/', (req, res, next) => {
// //   console.log("This is a pain.")
// //   console.log(req.ip, 'requested:', req.url)
// //   // res.send({ hello: "hello" })
// //   next();
// // })

// app.use('/', express.static("./build"))

// // app.use('/', express.static("./build"))
// // (req, res) => {
// //   webServLog('Request received at root, /')
// //   return res.sendFile('index.html')
// //   // return res.redirect('/web')
// // // @ts-ignore
// // })

// app.all('*', (req, res) => {
//   console.log('would-be web server - request from', req.ip, 'to ', req.url)
// })

// const httpServer = http.createServer(app)

// const httpServerPort = 4200

// // ! - Add "0.0.0.0" as the hostname, to listen 
// // "0.0.0.0", 
// // '0.0.0.0', 

// httpServer.listen(httpServerPort, () => {
//   webServLog("HTTP web server is up, listening on", httpServerPort)
//   webServLog("HTTP web server is listening on os 'address':", httpServer.address())
// })
