const IncomingMessage = require('http').IncomingMessage
const RequestError = require('./RequestError')

class Request {
  /**
   * Resource header name.
   * @type {String}
   */
  static get HEADER_RESOURCE () { return 'X-Resource' }
  /**
   * Mode header name.
   * @type {String}
   */
  static get HEADER_MODE () { return 'X-Mode' }

  /**
   * Invalid action.
   * @type {Number}
   */
  static get ACTION_INVALID () { return -1 }
  /**
   * Download action.
   * @type {Number}
   */
  static get ACTION_DOWNLOAD () { return 0 }
  /**
   * Upload action.
   * @type {Number}
   */
  static get ACTION_UPLOAD () { return 1 }

  /**
   * Convenience method for {RequestError}.
   * @type {RequestError}
   */
  static get Error () { return RequestError }

  /**
   * Wraps a plain `http.IncomingMessage` into a `Request` object.
   * @param {http.IncomingMessage} [request=null] The plain request to wrap
   * @return {Request} A new Request object
   */
  static from (request = null) {
    if (request === null || !(request instanceof IncomingMessage)) {
      throw new TypeError('request must be an instance of http.IncomingMessage')
    }
    return new Request(request)
  }

  /**
   * Creates a new Request object.
   * @param {http.IncomingMessage} request The original request object
   */
  constructor (request) {
    this._orig = request
  }

  /**
   * The original {http.IncomingMessage} object.
   * @return {http.IncomingMessage} The original request object
   */
  get original () { return this._orig }
  /**
   * HTTP request method.
   * @return {String} Http request method
   */
  get method () { return this._orig.method }
  /**
   * The request path.
   * @return {String} The request path
   */
  get url () { return this._orig.url }
  /**
   * The requested resource.
   * @return {String} The requested resource
   */
  get resource () { return this._orig.headers[Request.HEADER_RESOURCE.toLowerCase()] || null }
  /**
   * The requested mode.
   * @return {String} The requested mode
   */
  get mode () { return this._orig.headers[Request.HEADER_MODE.toLowerCase()] || null }

  /**
   * Gets the type of action this request represents.
   * @return {Number} An integer representing an action constant
   */
  getAction () {
    if (this.isDownload()) {
      return Request.ACTION_DOWNLOAD
    } else if (this.isUpload()) {
      return Request.ACTION_UPLOAD
    } else {
      return Request.ACTION_INVALID
    }
  }

  /**
   * Checks to see if the request has a valid resource header set.
   * @return {Boolean} Returns true if the resource header is valid
   */
  hasValidResource () {
    return this._orig.headers[Request.HEADER_RESOURCE.toLowerCase()] && this._orig.headers[Request.HEADER_RESOURCE.toLowerCase()][0] === '/'
  }

  /**
   * Checks to see if the request is a download request.
   * @return {Boolean} Returns true if the request is a valid download request
   */
  isDownload () {
    return this._orig.url === '/download' && this._orig.method === 'GET'
  }

  /**
   * Checks to see if the request is an upload request.
   * @return {Boolean} Returns true if the request is a valid upload request
   */
  isUpload () {
    return this._orig.url === '/upload' && [ 'PUT', 'POST' ].indexOf(this._orig.method) !== -1
  }
}

module.exports = exports = Request
