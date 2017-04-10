const EventEmitter = require('events').EventEmitter
const https = require('https')
const http = require('http')

const Request = require('./Request')
const Response = require('./Response')

const debug = require('debug')('Nexus:Nexus')

/**
 * Default options.
 * @type {Object}
 */
const DEFAULT_OPTIONS = {
  secure: false,
  hostname: null,
  port: 6607,
  store: null
}

/**
 * Class representing a Nexus server.
 */
class Server extends EventEmitter {
  /**
   * Server initization state.
   * @type {Number}
   */
  static get INIT () { return 0 }
  /**
   * Server ready state.
   * @type {Number}
   */
  static get READY () { return 1 }
  /**
   * Server listening state.
   * @type {Number}
   */
  static get LISTENING () { return 2 }
  /**
   * Server closing state.
   * @type {Number}
   */
  static get CLOSING () { return 3 }
  /**
   * Server closed status.
   * @type {Number}
   */
  static get CLOSED () { return 4 }

  /**
   * Create a new Nexus server.
   * @param {Object} [options={}] Options
   * @param {Boolean} [options.secure=false] Use SSL
   * @param {String} [options.hostname=null] Hostname
   * @param {Number} [options.port=6607] Port
   * @param {Object} [options.store=null] Store to use
   */
  constructor (options = {}) {
    super()
    this._readyState = Server.INIT
    this._options = Object.assign({}, DEFAULT_OPTIONS, options)
    this._store = this._options.store
    this._server = null

    if (this._options.store === null) {
      throw new TypeError('options.store is required')
    }

    this._createServer()
  }

  /**
   * Ready state.
   * @return {Number} Number indicating the current ready state
   */
  get readyState () { return this._readyState }
  /**
   * Get the underlying server.
   * @return {http.server} The server
   */
  get server () { return this._server }

  /**
   * Starts listening on the given hostname and port.
   */
  listen () {
    return new Promise((resolve, reject) => {
      if (this._readyState !== Server.READY) {
        return reject(new Error('incorrect ready state'))
      } else if (this._server === null) {
        return reject(new Error('server is null'))
      }
      this._server.listen(this._options.port, this._options.hostname || undefined, () => {
        resolve()
      })
    })
  }

  /**
   * Closes the server and stops accepting new requests.
   * @return {Promise} Resolves when the server has closed
   */
  close () {
    return new Promise((resolve, reject) => {
      if (this._readyState !== Server.LISTENING) {
        return reject(new Error('incorrect ready state'))
      } else if (this._server === null) {
        return reject(new Error('server is null'))
      }
      this._server.close(() => {
        debug('server closed')
        resolve()
      })
    })
  }

  /**
   * Resets internal variables to the server can be re-used.
   * @return {Promise} Resolves after the reset
   */
  reset () {
    if (this._readyState !== Server.CLOSED) {
      return Promise.reject(new Error('incorrect ready state'))
    } else if (this._server === null) {
      return Promise.reject(new Error('server is null'))
    }
    this._readyState = Server.READY
    debug('server reset')
    return Promise.resolve()
  }

  /**
   * Creates a new server.
   */
  _createServer () {
    if (this._readyState !== Server.INIT) {
      throw new Error('incorrect ready state')
    } else if (this._server !== null) {
      throw new Error('server not null')
    }

    this._server = this._options.secure
      ? https.createServer(this._options)
      : http.createServer()

    debug('server created')
    this._attachListeners()
  }

  /**
   * Attaches the required event listeners to the server.
   */
  _attachListeners () {
    const onListening = () => {
      const address = this._server.address()
      debug(`server listening on ${address.address}:${address.port}`)
      this._readyState = Server.LISTENING
    }

    const onRequest = (request, response) => {
      debug(`incoming request from ${request.socket.address().address}`)
      request = Request.from(request)
      response = Response.from(response)
      this._handleRequest(request, response)
    }

    const onError = err => {
      this.emit('error', err)
    }

    const onClose = () => {
      this._readyState = Server.CLOSED
    }

    this._server.on('listening', onListening)
    this._server.on('request', onRequest)
    this._server.on('checkContinue', onRequest)
    this._server.on('error', onError)
    this._server.on('close', onClose)
    this._readyState = Server.READY
  }

  /**
   * Handles the server's `request` events.
   */
  _handleRequest (request, response) {
    const action = request.getAction()
    if (action === Request.ACTION_INVALID) {
      response.writeError(new Request.Error('Not Found', 404))
    } else if (!request.hasValidResource()) {
      response.writeError(new Request.Error('Invalid Resource', 400))
    } else if (action === Request.ACTION_DOWNLOAD) {
      this._handleRead(request, response)
    } else if (action === Request.ACTION_UPLOAD) {
      this._handleWrite(request, response)
    }
  }

  /**
   * Handles an incoming read request.
   */
  _handleRead (request, response) {
    this.emit('download', request.resource, request.mode || 'r')
    this._store.createReadStream(request.resource, request.mode || 'r').then(({ stream, stats }) => {
      response.original.writeHead(200, { 'Content-Length': stats.size, 'Last-Modified': stats.ctime.toUTCString() })
      stream.pipe(response.original)
    }).catch(err => {
      if (!(err instanceof Request.Error)) {
        err = Request.Error.wrap(err, 404, 'Resource Not Accessible')
      }
      debug(`_handleRead('${request.resource}', '${request.mode}') error: ${err.original ? err.original.message : err.message}`)
      response.writeError(err)
    })
  }

  /**
   * Handles an incoming write request.
   */
  _handleWrite (request, response) {
    this.emit('upload', request.resource, request.mode || 'w')
    this._store.createWriteStream(request.resource, request.mode || 'w').then(stream => {
      debug(`createWriteStream('${request.resource}', '${request.mode}'): writing 100 Continue and piping`)
      response.original.writeContinue()
      request.original.pipe(stream)
    }).catch(err => {
      if (!(err instanceof Request.Error)) {
        err = Request.Error.wrap(err, 404, 'Resouce Not Accessible')
      }
      debug(`_handleWrite('${request.resource}', '${request.mode}') error: ${err.original ? err.original.message : err.message}`)
      response.writeError(err)
    })
  }
}

module.exports = exports = Server
