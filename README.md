# Nexus

[![Standard - JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

Nexus is simple remote file storage server over HTTP. Easily create, read and update
files remotely, using only HTTP. With an easy to use HTTP API and [node.js client](http://github.com/MichielvdVelde/nexus-client),
it's fast to set up and use.

> Nexus is currently **an alpha version**. Use at your own risk.

> Also, it is **not yet available on npm**!

Documentation is sparse at the moment, I will write some more later. In the mean
time take a look at the source code if you're interested.

## Features

* Provides two HTTP endpoints, `/download` and `/upload`
* Support for **read** (r), **write** (w) and **append** (a) modes (may depend on the store used)
* Resource paths are like directory paths, but starting with a single forward slash (`/`)
  * Extensions are optional, but a resource will **always** be a file
  * E.g. `/resource`, `resource.json`, `dir/subdir/another/resource`
* Abstracts file handling, making it possible to use multiple stores

## Roadmap

* Support HTTPS
* Maybe look into making core functionality transport-independent
  * WebSocket support would make a nice addition
  * Vanilla TCP might be fun too

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

A few lines of code says more than a thousand words.

```js
const path = require('path')

const Nexus = require('nexus')
const Server = Nexus.Server
const FileStore = Nexus.FileStore

const server = new Server({
  // FileStore requires an absolute path!
  store: new FileStore(path.resolve(process.cwd(), './resources'))
})

server.listen().then(() => {
  // Get the address from the underlying http.Server
  const address = server.server.address()
  console.log(`server listening on ${address.address}:${address.port}`)
}).catch(err => {
  console.error(`error starting server: ${err.message}`)
})
```

[![Standard - JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

### License

Copyright 2017 [Michiel van der Velde](http://www.michielvdvelde.nl).

This software is licensed under the [MIT License](LICENSE).
