# Nexus

[![Standard - JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

Nexus is a simple remote file storage server over HTTP. Easily create, read and update
files remotely, using only HTTP. With an easy to use HTTP API and [node.js client](http://github.com/MichielvdVelde/nexus-client-http),
it's fast to set up and use.

> Nexus is currently **an alpha version**. Use at your own risk.

> **Important**: The version you see here MAY NOT be the one currently published
> on npm! To check the latest published version, [look at the package on npm](https://www.npmjs.com/package/nexus-server).

Documentation is sparse at the moment, I will write some more later. In the mean
time take a look at the source code if you're interested.

## Features

* Simple to use HTTP API
  * To download a file, simply make a request: `GET /my/resource.json`
  * To upload a file, make another simple request: `PUT /my/resource.json` (`POST` works too)
* The given path is the resource path
  * Extensions are optional, but a resource will **always** be a file
  * E.g. `/resource`, `/resource.json`, `/dir/subdir/another/resource`
* Support for **read** (r), **write** (w) and **append** (a) modes (may depend on the store used)
* Abstracts file handling, making it possible to use multiple types of stores

## Roadmap

**Soon**

* Support partial content and `Range` headers

**Longer**

* Support for authentication
* Maybe look into making core functionality transport-independent
  * WebSocket support would make a nice addition
  * Vanilla TCP might be fun too

## Install

```
npm install nexus-server
```

## Stores

In order to get Nexus running, you need a store. As the name suggests, a store is
where your files will be... stored. Nexus abstracts file handling, providing a
lot of flexibility in what storage back-ends to use.

By default Nexus comes bundled with `FileStore`, a store which uses the local file
system to store resources. Because the store is so important, you'll have to set
one manually.

It's simple to make your own store, as they use streams. Any object which has the
methods `createReadStream(resource, mode)` and `createWriteStream(resource, mode)`
and which return a Promise that resolves in the appropriate stream will work fine.
For an example, see [FileStore.js](./lib/FileStore.js).

## Setting up a server

A few lines of code say more than a thousand words.

```js
const path = require('path')
const Nexus = require('nexus-server')

const server = new Nexus.Server({
  // FileStore requires an absolute path!
  store: new Nexus.FileStore(path.resolve(process.cwd(), './resources'))
})

server.listen().then(() => {
  // Get the address from the underlying http.Server
  const address = server.server.address()
  console.log(`server listening on ${address.address}:${address.port}`)
}).catch(err => {
  console.error(`error starting server: ${err.message}`)
})
```

### Enabling SSL

By setting `options.secure` to `true` and providing the appropriate keys and/or
certificates in the options object, HTTPS will be enabled and your connection
will be secure.

Note that Nexus uses `http.Server`, so all options that can be provided to
`https.createServer([options])` will be valid for use.

```js
const client = new Client({
  secure: true,
  key: fs.readFileSync('test/fixtures/keys/agent2-key.pem'),
  cert: fs.readFileSync('test/fixtures/keys/agent2-cert.pem')
})
```

[![Standard - JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

## License

Copyright 2017 [Michiel van der Velde](http://www.michielvdvelde.nl).

This software is licensed under the [MIT License](LICENSE).
