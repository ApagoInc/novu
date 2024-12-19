// @ts-check
const express = require('express')
const { readdirSync } = require('node:fs')
const http = require('http')
const dotenv = require('dotenv')

const webServLog = (...args) => { console.log('[web server]', args) }

dotenv.config()

// webServLog('[DEBUG] - app.js, process.cwd()', process.cwd(), 'current dir contents:', readdirSync(process.cwd()))

const app = express()

// Docker-composed projects can communicate with one another in their default network using the container "service" name - i.e, "web" for the web frontend, "ws" for the websocket.
// Outside of docker, we would be addressing the proxy targets at 'localhost'.

console.log('value for process.env.FRONT_BASE_URL:', process.env.FRONT_BASE_URL)
const redirectTarget = process.env.FRONT_BASE_URL


console.log('value for process.env.FRONT_BASE_CONTEXT_PATH:', process.env.FRONT_BASE_CONTEXT_PATH)
const webappCtxPath = process.env.FRONT_BASE_CONTEXT_PATH || 'web'

console.log('using the following for webapp context path:', webappCtxPath)

app.use(`/${webappCtxPath}`, express.static("./build"))

app.use('*', (req, res, next) => {
  if (redirectTarget) {
    console.log("Received request to url", req.url, 'from IP', req.ip, '- redirecting to redirect target of', redirectTarget, '-')
    res.redirect(redirectTarget)
  } else {
    console.log("Received request to url", req.url, 'from IP', req.ip, '- returning 404, since no redirect target defined')
    res.send(404)
  }
})
const httpServer = http.createServer(app)

const httpServerPort = 4200

httpServer.listen(httpServerPort, () => {
  webServLog("HTTP web server is up, listening on", httpServerPort)
  webServLog("HTTP web server is listening on os 'address':", httpServer.address())
})
