const path = require('path')
const fs = require('fs-extra')

const debug = require('debug')('Nexus:FileStore')

/**
 * Default options
 * @type {Object}
 */
const DEFAULT_OPTIONS = {
  checkRootExistence: true,
  ensureRoot: false
}

/**
 * Class representing a local file store.
 */
class FileStore {
  /**
   * Supported read modes
   * @type {Array}
   */
  static get MODES_READ () { return [ 'r' ] }
  /**
   * Supported write modes
   * @type {Array}
   */
  static get MODES_WRITE () { return [ 'w', 'a' ] }

  /**
   * Read mode (r) (default)
   * @type {String}
   */
  static get MODE_READ () { return 'r' }
  /**
   * Append mode (a)
   * @type {String}
   */
  static get MODE_APPEND () { return 'a' }
  /**
   * Write mode
   * @type {String}
   */
  static get MODE_WRITE () { return 'w' }

  /**
   * Creates a new FileStore.
   * @param {String} [root=null] The absolute root path
   * @param {Object} [options={}] Options
   * @param {Boolean} [options.checkRootExistence=true] Check to make sure the root path is valid
   * @param {Boolean} [options.ensureRoot=false] Create the root path if it does not exist
   */
  constructor (root = null, options = {}) {
    this._options = Object.assign({}, DEFAULT_OPTIONS, options)
    if (root === null) {
      throw new TypeError('root can not be null')
    } else if (!path.isAbsolute(root)) {
      throw new TypeError('root must be an absolute path')
    } else if (this._options.checkRootExistence && !fs.existsSync(root)) {
      if (!this._options.ensureRoot) throw new Error('root does not exist')
      fs.ensureDirSync(root)
    }
    this._root = root
  }

  /**
   * Creates a new read stream to the provided resource.
   * @param {String} resource The path to the resource
   * @param {String} [mode=FileStore.MODE_READ] Mode to open resource in
   * @return {Promise} Resolves with a readable stream to the resource
   */
  createReadStream (resource, mode = FileStore.MODE_READ) {
    debug(`createReadStream ('${resource}', '${mode}')`)
    return new Promise((resolve, reject) => {
      const resourcePath = this._getResourcePath(resource)
      if (FileStore.MODES_READ.indexOf(mode) === -1) {
        return reject(new TypeError(`unsupported read mode (${mode})`))
      }
      fs.access(resourcePath, fs.constants.R_OK, err => {
        if (err) return reject(err)
        resolve(fs.createReadStream(resourcePath))
      })
    })
  }

  /**
   * Creates a new write stream to the provided resource.
   * @param {String} resource The path to the resourc
   * @param {String} [mode=FileStore.MODE_WRITE] Mode to open the resource in
   * @return {Promise} Resolves with a writable stream to the resource
   */
  createWriteStream (resource, mode = FileStore.MODE_WRITE) {
    debug(`createWriteStream ('${resource}', '${mode}')`)
    return new Promise((resolve, reject) => {
      const resourcePath = this._getResourcePath(resource)
      if (FileStore.MODES_WRITE.indexOf(mode) === -1) {
        return reject(new TypeError(`unsupported write mode (${mode})`))
      }
      fs.ensureFile(resourcePath, err => {
        if (err) return reject(err)
        resolve(fs.createWriteStream(resourcePath))
      })
    })
  }

  /**
   * Converts the resource path to an absolute file system path.
   * @param {String} resource The resource path
   * @return {String} An absolute path to the resource
   */
  _getResourcePath (resource) {
    let resourcePath = path.resolve(this._root, `.${resource}`)
    // With no extension add a period, so the file system will see it as a file
    if (path.extname(resourcePath) === '') resourcePath += '.'
    return resourcePath
  }
}

module.exports = exports = FileStore
