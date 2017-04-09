const ServerResponse = require('http').ServerResponse
const RequestError = require('./RequestError')

class Response {
  static get OPEN () { return 1 }
  static get FINISHED () { return 2 }

  /**
   * Wraps a plain `http.ServerResponse` into a `Response` object.
   * @param {http.ServerResponse} [response=null] The plain response to wrap
   * @return {Response} A new Response object
   */
  static from (response = null) {
    if (response === null || !(response instanceof ServerResponse)) {
      throw new TypeError('response must be an instance of http.ServerResponse')
    }
    return new Response(response)
  }

  /**
   * Creates a new Response.
   * @param {http.ServerResponse} response The original response object
   */
  constructor (response) {
    this._orig = response
    this._state = Response.OPEN

    this._orig.once('finish', () => {
      this._state = Response.FINISHED
    })
  }

  /**
   * The original response object.
   * @return {http.ServerResponse} The original response object
   */
  get original () { return this._orig }
  /**
   * The response status code.
   * @return {Number} The response status code
   */
  get statusCode () { return this._orig.statusCode }
  /**
   * The response state. Is either {Response.OPEN} or {Response.FINISHED}.
   * @return {Number} The response state.
   */
  get state () { return this._state }

  /**
   * Writes the given error to the client and ends the response.
   * @param {Request.RequestError} [error=null] The error to write
   */
  writeError (error = null) {
    if (error === null || !(error instanceof RequestError)) {
      throw new TypeError('error must be an instance of Request.RequestError')
    } else if (this._state !== Response.OPEN) {
      throw new Error('response is not open')
    } else if (this._orig.headersSent) {
      throw new Error('headers already sent')
    }
    this._orig.writeHead(error.statusCode, error.message, error.headers)
    this._orig.end(error.message)
  }
}

module.exports = exports = Response
