// @ts-check
const express = require('express')
const readFileSync = require('node:fs').readFileSync
// const http = require('http')
const https = require('https')
const { createProxyMiddleware } = require('http-proxy-middleware');
const { readdirSync } = require('node:fs');
const config = require('dotenv').config
const cors = require('cors')

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


// Determine where the websocket should be hosted, and proxy ws requests to that.
const webSocketPath = 'events'
// 'events' as opposed to 'ws'
const wsTarget = `http://${docker ? 'ws' : 'localhost'}:3002`

const socketProxyPrefix = `["/" proxy, filtering path "/socket.io"]`
// Will a top-level proxy like this work, and allow others through?
// (Adapted from https://github.com/chimurai/http-proxy-middleware/blob/master/recipes/websocket.md)
const socketProxy = createProxyMiddleware({
  target: wsTarget,
  pathFilter: '/socket.io',
  ws: true,
  // pathRewrite: {
  //   '^/socket': '',
  // },
  on: {
    // res is an IncomingMessage type
    // _response is a ServerResponse<IncomingMessage> type
    proxyReq: (proxyReq, req, res, servOptions) => {
      console.log(socketProxyPrefix, 'request from:', req.url)
      console.log(socketProxyPrefix, 'proxyReq host:', proxyReq.host)

      const upgrade = req.headers.upgrade
      if (upgrade && upgrade === 'websocket') {
        console.log(socketProxyPrefix, '- proxy request,', req.url, '- Got header "Upgrade": "websocket"; ')
      }
    },
    proxyReqWs: (proxyReq, req, socket, servOptions) => {

      console.log(socketProxyPrefix, 'ReqWs - request from:', req.url)
      console.log(socketProxyPrefix, 'ReqWs - proxyReq host:', proxyReq.host)
      console.log('**  in proxyReqWs...')
      // console.log(socketProxyPrefix, 'ReqWs - socket address:', socket?.address?.())

    },
    proxyRes: (proxyRes, req, res) => {
      console.log(socketProxyPrefix, '- proxy response')
      console.log(socketProxyPrefix, '- proxy response, headers:,', res.getHeaders())
    },
    error: (err, req, res) => {
      console.log("! - a socket proxy error has occurred.")
      console.log(socketProxyPrefix, '- error:', err)
    }
  },
  // changeOrigin: true

});

app.use('/', socketProxy)

// app.use(cors({
//   origin: ['http://localhost:9000']
// }))

// localhost:4200 - webapp    - https://notifications.lscscout.com/web
// localhost:3000 - api       - https://notifications.lscscout.com/api
// localhost:3002 - websocket - https://notifications.lscscout.com/ws


// Identical proxies to the webapp content, except that one is from the "/web" route and one is from requests to the root "/"
// So, "/web" and "/" will both serve as valid ways to reach the webapp
const webAppAccessors = ['/web', '/'].map(accessedFrom => createProxyMiddleware({
  // localhost
  // --- Can requests get "out" of the docker web container?
  // Requests will work when this is being served outside of Docker on http://localhost:4200

  // TODO - ok, for some reason, the NovuProvider on the LSP frontend insists on calling for the socket as follows:
  // wss://notifications.lscscout.com:9000/socket.io/?EIO=4&transport=websocket

  // This handler should never really be receiving any ws requests.
  // (Now that one is added upstream/above to look for /socket.io requests coming across "/")
  target: webappLocalUrl,
  on: {
    proxyReq: (proxyReq, req, res) => {
      console.log('[' + accessedFrom + '] - proxy request')
      console.log('[' + accessedFrom + '] - proxy request,', req.url)
      console.log('[' + accessedFrom + '] proxyReq host:', proxyReq.host)
      // console.log('[' + accessedFrom + '] setting proxyReq origin to:', webappLocalUrl)
      // proxyReq.setHeader('origin', webappLocalUrl)
      // If our request is one meant for the websocket,
      // redirect/proxy it to there.
      // The below 2 will be present on a call to the websocket.
      // EIO: 4
      // transport: websocket
      if (req) {
        // Does the request have the header { Upgrade: "websocket" }?
        const upgrade = req.headers.upgrade
        if (upgrade && upgrade === 'websocket') {
          console.log('[' + accessedFrom + '] - proxy request,', req.url, '- Got header "Upgrade": "websocket"; ')
        }
      }
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



const apiTarget = `http://${docker ? 'api' : 'localhost'}:3000/api`
app.use(
  '/api',
  createProxyMiddleware({
    // localhost
    target: apiTarget,
    on: {
      proxyReq: (proxyReq, req, res) => {
        console.log('[api] - proxy request')
        console.log('[api] - proxy request,', req.url)
        console.log('[api] proxyReq host:', proxyReq.host)
        // console.log('[api] setting proxyReq origin to:', apiTarget)
        // proxyReq.setHeader('origin', apiTarget)
      },
      proxyRes: (proxyRes, req, res) => {
        console.log('[api] - response')
        console.log('[api] - response, headers:,', res.getHeaders())
        console.log('[api] - response status:', res.statusCode, res.statusMessage)
        console.log('[api] - proxy response')
        console.log('[api] - proxy response, headers:,', proxyRes.headers)
        console.log('[api] - proxy response status:', proxyRes.statusCode, proxyRes.statusMessage)
      },
      error: (err, req, res) => {
        console.log('[api] - proxy error:', err)
      },
    },
    // changeOrigin: true,
  }),
);

// So, from the LSP frontend,
// where REACT_APP_NOVU_SOCKET_URL="" -
// It looks like it is instead then calling this URL:
// wss://notifications.lscscout.com:9000/socket.io/?EIO=4&transport=websocket
// So it's missing this one, at /ws.
// Could it be stripping '/ws' out, thinking it's a protocol, trying to be clever?
// ---
// It's possible this handler will never be handling requests, as any websocket traffic -
// - might now always be handled by the earlier/above handler that's listening for "/socket.io" on "/"
app.use(
  `/${webSocketPath}`,
  createProxyMiddleware({
    ws: true,
    target: wsTarget,
    on: {
      proxyReq: (proxyReq, req, res) => {
        console.log(`[ws (/${webSocketPath})] - proxy request`)
        console.log(`[ws (/${webSocketPath})] - proxy request,`, req.url)
        console.log(`[ws (/${webSocketPath})] proxyReq host:`, proxyReq.host)
        // console.log('[ws] setting proxyReq origin to:', wsTarget)
        // proxyReq.setHeader('origin', wsTarget)
      },
      proxyRes: (proxyRes, req, res) => {
        console.log(`[ws (/${webSocketPath})] - proxy response`)
        console.log(`[ws (/${webSocketPath})] - proxy response, headers:`, res.getHeaders())
      },
      error: (err, req, res) => {
        console.log(`[ws (/${webSocketPath})] - proxy error:`, err)
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
