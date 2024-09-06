// @ts-check
const express = require('express')
const readFileSync = require('node:fs').readFileSync
// const http = require('http')
const https = require('https')
const { createProxyMiddleware } = require('http-proxy-middleware');
const { readdirSync } = require('node:fs');
const config = require('dotenv').config

// load .env
config()


console.log('[DEBUG] - app.js, process.cwd()', process.cwd(), 'current dir contents:', readdirSync(process.cwd()))

const docker = Boolean(process.env.DOCKER === "true")

if (docker) {
  console.log('[proxy] .env DOCKER="true" -> assuming app is running in docker - using *CONTAINER_PATH values for cert paths')
} else {
  console.log('[proxy] .env did not have DOCKER="true" -> assuming app is running on OS - using *OS_PATH values for cert paths')
}


const webappOutsideOfDocker = Boolean(process.env.NON_DOCKER_WEBAPP === "true")

const webappLocalUrl = `http://${(docker && !webappOutsideOfDocker) ? 'web' : 'localhost'}:4200`

if (webappOutsideOfDocker) {
  console.log('[proxy] webapp is being ran outside of Docker, due to open issues on the Novu webapp\'s local build process.')
}
console.log(`[proxy] the webapp is expected to be running locally at ${webappLocalUrl}.`)


const certVals = {
  HTTPS_CERT_PATH: docker ? process.env.HTTPS_CERT_CONTAINER_PATH : process.env.HTTPS_CERT_OS_PATH,
  HTTPS_KEY_PATH: docker ? process.env.HTTPS_KEY_CONTAINER_PATH : process.env.HTTPS_KEY_OS_PATH
}

console.log("process.env HTTPS path values:",
  JSON.stringify(certVals)
)

if (!(certVals.HTTPS_CERT_PATH && certVals.HTTPS_KEY_PATH)) {
  throw new Error('Please define both of the following in .env: HTTPS_KEY_PATH, HTTPS_CERT_PATH')
}

const creds = {
  key: readFileSync(certVals.HTTPS_KEY_PATH),
  cert: readFileSync(certVals.HTTPS_CERT_PATH)
}

const app = express()

// localhost:4200 - webapp    - https://notifications.lscscout.com/web
// localhost:3000 - api       - https://notifications.lscscout.com/api
// localhost:3002 - websocket - https://notifications.lscscout.com/ws


// Identical proxies to the webapp content, except that one is from the "/web" route and one is from requests to the root "/"
// So, "/web" and "/" will both serve as valid ways to reach the webapp
const webAppAccessors = ['/web', '/'].map(accessedFrom => createProxyMiddleware({
  // localhost
  // --- Can requests get "out" of the docker web container?
  // Requests will work when this is being served outside of Docker on http://localhost:4200
  target: webappLocalUrl,
  on: {
    proxyReq: (proxyReq, req, res) => {
      console.log('[' + accessedFrom + '] - proxy request')
      console.log('[' + accessedFrom + '] - proxy request,', req.url)
    },
    proxyRes: (proxyRes, req, res) => {
      console.log('[' + accessedFrom + '] - proxy response')
      console.log('[' + accessedFrom + '] - proxy response, headers:,', res.getHeaders())
    },
    error: (err, req, res) => {
      console.log('[' + accessedFrom + '] - proxy error:', err)
    },
  },
  // TODO - change origin, or not...?
  changeOrigin: true,
}))

// We use the `docker` variable to inform how we are locally addressing each of the proxy server's targets.
// Docker-composed projects can communicate with one another using the container "service" name - i.e, "web" for the web frontend, "ws" for the websocket.
// Outside of docker, we are addressing the proxy targets at 'localhost'.
app.use(
  '/web',
  webAppAccessors[0]
);

app.use(
  '/api',
  createProxyMiddleware({
    // localhost
    target: `http://${docker ? 'api' : 'localhost'}:3000`,
    on: {
      proxyReq: (proxyReq, req, res) => {
        console.log('[api] - proxy request')
        console.log('[api] - proxy request,', req.url)
      },
      proxyRes: (proxyRes, req, res) => {
        console.log('[api] - proxy response')
        console.log('[api] - proxy response, headers:,', res.getHeaders())
      },
      error: (err, req, res) => {
        console.log('[api] - proxy error:', err)
      },
    },
    changeOrigin: true,
  }),
);

app.use(
  '/ws',
  createProxyMiddleware({
    // localhost
    target: `http://${docker ? 'ws' : 'localhost'}:3002`,
    on: {
      proxyReq: (proxyReq, req, res) => {
        console.log('[ws] - proxy request')
        console.log('[ws] - proxy request,', req.url)
      },
      proxyRes: (proxyRes, req, res) => {
        console.log('[ws] - proxy response')
        console.log('[ws] - proxy response, headers:,', res.getHeaders())
      },
      error: (err, req, res) => {
        console.log('[ws] - proxy error:', err)
      },
    }
    // changeOrigin: true,
  }),
);


app.use('/', webAppAccessors[1])



// app.get('/', (req, res) => {
//   console.log("Request from", req.ip, "to", req.url)
//   res.status(200).send({ "Hello": "This is novu2" })
// })

// const httpServer = http.createServer()
const httpsServer = https.createServer(creds, app)

// TODO - get the redirect from 443 -> 9000 to work...?
const httpsServerPort = 9000
// 8443

// ! - Add "0.0.0.0" as the hostname, to listen 
// "0.0.0.0", 
// '0.0.0.0', 
httpsServer.listen(httpsServerPort, () => {
  console.log("https server is up, listening on", httpsServerPort)
  console.log("httpsServer is listening on os 'address':", httpsServer.address())
})



// app.listen(port, () => {
//     console.log("novu2 certserver is up, listening on port", port)
// })
