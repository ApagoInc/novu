### About

Custom reverse proxy server for use with the Apago Novu fork.

Serves as the sole HTTPS gateway to access any of the 3 services that are to be exposed over a network. (The services with sources defined under `api`, `ws`, and `web` in the ./apps directory)

### Proxy default mappings

Assuming that the novu fork is being hosted at a base URL "https://example.com",
this proxy server provides the following default mappings:

| Foreign Address                | Local Address            | Service           | Notes                          |
|--------------------------------|--------------------------|-------------------|--------------------------------|
| https://example.com:9000/api   | http[s]://localhost:3000 | API               |                                |
| https://example.com:9000/ws    | http[s]://localhost:3001 | websocket         |                                |
| https://example.com:9000/web   | http[s]://localhost:4200 | admin web frontend|                                |
| https://example.com:9000       | http[s]://localhost:4200 |                   | Redirect to admin web frontend |
