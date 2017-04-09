const path = require('path')

const Server = require('./lib/Server')
const FileStore = require('./lib/FileStore')

const debug = require('debug')('Nexus:example')

const server = new Server({
  store: new FileStore(path.resolve(process.cwd(), './resources'))
})

server.on('download', (resource, mode) => {
  debug(`got download request for ${resource} (${mode})`)
})

server.on('upload', (resource, mode) => {
  debug(`got upload request for ${resource} (${mode})`)
})

server.listen().then(() => {
  const address = server.server.address()
  console.log(`server listening on ${address.address}:${address.port}`)
}).catch(err => {
  console.error(err)
})
