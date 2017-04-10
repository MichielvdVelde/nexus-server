class RequestError extends Error {
  static get BAD_REQUEST () { return 400 }
  static get NOT_FOUND () { return 404 }
  static get INTERNAL_SERVER_ERROR () { return 500 }
  static get RANGE_NOT_SATISFIABLE () { return 416 }

  /**
   * Wraps an Error object into a RequestError object. The original Error
   * object will remain available as `error.original`.
   * @param {Error} [error=null] The Error object to wrap
   * @param {String} [statusCode=500] The status code
   * @param {Null|String} [message=null] Override error message
   * @return {RequestError} A new RequestError with the error wrapped
   */
  static wrap (error = null, statusCode = RequestError.INTERNAL_SERVER_ERROR, message = null, headers = {}) {
    if (error === null || !(error instanceof Error)) {
      throw new TypeError('error must be an instance of Error')
    }
    message = message === null ? error.message : message
    return new RequestError(message, statusCode, headers, error)
  }

  /**
   * Create a new RequestError.
   * @param {String} [message='Internal Server Error'] Human-readable error message
   * @param {Number} [statusCode=500] HTTP status code
   * @param {Error} [orig=null] Original error message, used with {RequestError.wrap}
   */
  constructor (message = 'Internal Server Error', statusCode = RequestError.INTERNAL_SERVER_ERROR, headers = {}, orig = null) {
    super(message)
    this._orig = orig
    this.statusCode = statusCode
    this.headers = Object.assign({}, headers, {
      'Content-Type': 'text/plain',
      'Content-Length': Buffer.byteLength(this.message),
      'Connection': 'close'
    })
  }

  /**
   * Checks to see if this is a wrapped {Error}.
   * @return {Boolean} True if this is a wrapped {Error}
   */
  get wrapped () { return this._orig !== null }
  /**
   * Gets the original {Error}.
   * @return {Error} The original error, or null
   */
  get original () { return this._orig }
}

module.exports = exports = RequestError
