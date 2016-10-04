// deps
const Raven = require('raven-js')
const { h, render } = require('preact')
const { Layout } = require('../components/layout')
const { getCurrentPluginVersion } = require('../js/lib/api')

// libs
const statics = require('./lib/static')
const _settings = require('../settings')

// settings
const CURRENT_VERSION_TAG = require('raw!../../VERSION_TAG').trim()
const DEFAULT_ROOT_NODE = _settings.default_root_node
const DEFAULT_OPTS = _settings.defualt_opts

/**
 * {class} ParcelLab
 * find information about usage at
 * ~> https://github.com/parcelLab/parcelLab-js-plugin
 */
class ParcelLab {
  constructor(rootNodeQuery, opts) {
    if (!rootNodeQuery) rootNodeQuery = DEFAULT_ROOT_NODE
    if (rootNodeQuery && typeof rootNodeQuery === 'string') {
      if (document.querySelector(rootNodeQuery)) {
        this.rootNodeQuery = rootNodeQuery
        this.$root = document.querySelector(rootNodeQuery)
        this._langCode = navigator.language || navigator.userLanguage
        if (!opts && typeof opts !== 'object') opts = DEFAULT_OPTS
        this.options = opts
      } else {
        console.error('🙀 Could not find the rootNode ~> ' + rootNodeQuery)
      }
    }
  }

  ///////////////////////
  // Instance methods //
  //////////////////////

  initialize() {
    Raven.config('https://2b7ac8796fe140b8b8908749849ff1ce@app.getsentry.com/94336', {
      whitelistUrls: [/cdn\.parcellab\.com/],
    }).install()

    // read props from url
    this.orderNo = this.getUrlQuery('orderNo')
    this.trackingNo = this.getUrlQuery('trackingNo')
    this.xid = this.getUrlQuery('xid')
    this.courier = this.getUrlQuery('courier')
    this.userId = this.getUrlQuery('u')
    this.initLanguage()
    if (!this.propsCheck())
      this.$root.innerHTML = `<div class="pl-alert pl-alert-danger">
        Can't find this tracking...</div>`
    else {
      // do a self update
      this.selfUpdate()

      // preact go!
      this.renderLayout()
    }

  }

  initLanguage() {
    if (this.getUrlQuery('lang')) this._langCode = this.getUrlQuery('lang')
    if (statics.languages[this._langCode]) {
      this.lang = statics.languages[this._langCode]
    } else {
      this.handleError('Could not detect user language ... fallback to [EN]!')
      this.lang = statics.languages.en
    }
  }

  props() {
    return {
      trackingNo: this.trackingNo,
      orderNo: this.orderNo,
      courier: this.courier,
      userId: this.userId,
      lang: this.lang,
    }
  }

  propsCheck() {
    var result = false
    if (this.trackingNo && this.courier) result = true
    if (this.orderNo && this.userId) result = true
    if (this.xid && this.userId) result = true
    return result
  }

  getUrlQuery(key, url) {
    if (!url) url = window.location.href
    key = key.replace(/[\[\]]/g, '\\$&')
    var regex = new RegExp('[?&]' + key + '(=([^&#]*)|&|#|$)')
    var results = regex.exec(url)
    if (!results) return null
    if (!results[2]) return ''
    return decodeURIComponent(results[2].replace(/\+/g, ' '))
  }

  handleError(err) {
    if (typeof err === 'string')
      console.error(`🙀  ${err}`)
    else if (typeof err === 'object') {
      Raven.captureException(err)
      console.error(`🙀  ${err.message}`)
    }
  }

  lsSet(key, val) {
    try {
      localStorage.setItem(key, val)
    } catch (e) {
      if (e.name === 'NS_ERROR_FILE_CORRUPTED') {
        console.log(`😿 Sorry, it looks like your browser storage is corrupted.
        Please clear your storage by going to Tools -> Clear Recent History -> Cookies
        and set time range to 'Everything'.
        This will remove the corrupted browser storage across all sites.`)
      }
    }
  }

  lsGet(key) {
    var res = null
    try {
      res = localStorage.getItem(key)
    } catch (e) {
      if (e.name === 'NS_ERROR_FILE_CORRUPTED') {
        console.log(`😿 Sorry, it looks like your browser storage is corrupted.
        Please clear your storage by going to Tools -> Clear Recent History -> Cookies
        and set time range to 'Everything'.
        This will remove the corrupted browser storage across all sites.`)
      }
    }
    finally {
      return res
    }
  }

  selfUpdate() {
    var lastUpdate = this.lsGet('parcelLab.js.updatedAt')

    // check if selfUpdate was executed in the last 12 h
    if (lastUpdate && lastUpdate > Date.now() - 43200000) {
      return null
    }

    console.log('👻 Searching for new parcelLab.js version...')
    getCurrentPluginVersion((err, versionTag)=> {
      if (err) return this.lsSet('parcelLab.js.updatedAt', Date.now())
      else {
        this.lsSet('parcelLab.js.updatedAt', Date.now())
        if (versionTag && versionTag !== CURRENT_VERSION_TAG) {
          console.log('👻 Updating plugin to version ~> ', versionTag)
          window.location.reload(true)
        }
      }
    })
  }

  ///////////////////////////
  // DOM affecting methods //
  ///////////////////////////

  renderLayout() {
    this.$root.innerHTML = ''
    render(
      h( Layout, { ...this.props(), opts: this.options, handleError: this.handleError } ),
      this.$root
    )
  }
}

module.exports = ParcelLab
