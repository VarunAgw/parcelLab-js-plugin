// deps
const Raven = require('raven-js');
var _$ = require('cash-dom');
if (typeof window.jQuery === 'function')
  _$ = window.jQuery;

// libs
const Api = require('./lib/api');
const statics = require('./lib/static');
const _settings = require('json!../../settings.json');

// settings
const CURRENT_VERSION_TAG = require('raw!../../VERSION_TAG').trim();
const DEFAULT_ROOT_NODE = _settings.default_root_node;
const DEFAULT_OPTS = _settings.defualt_opts;

/**
 * {class} ParcelLab
 * find information about usage at
 * ~> https://github.com/parcelLab/parcelLab-js-plugin
 */
class ParcelLab {
  constructor(rootNodeQuery, opts) {
    if (!rootNodeQuery) rootNodeQuery = DEFAULT_ROOT_NODE;
    if (rootNodeQuery && typeof rootNodeQuery === 'string') {
      if (_$(rootNodeQuery).get(0)) {
        this.rootNodeQuery = rootNodeQuery;
        this._langCode = navigator.language || navigator.userLanguage;
        if (!opts && typeof opts !== 'object') opts = DEFAULT_OPTS;
        this.options = opts;
      } else {
        console.error('🙀 Could not find the rootNode ~> ' + rootNodeQuery);
      }
    }
  }

  ///////////////////////
  // Instance methods //
  //////////////////////

  initialize() {
    Raven.config('https://2b7ac8796fe140b8b8908749849ff1ce@app.getsentry.com/94336', {
      whitelistUrls: [/cdn\.parcellab\.com/],
    }).install();
    this.loading();
    this.initLanguage();

    if (this.propsCheck() === false) return this.showError(); // check yourself before you ...

    // do a self update
    this.selfUpdate();

    // get the prediction
    Api.getShopPrediction(this.props(), (err, res)=> {
      if (err) return this.handleError(err);
      else if (res) {

        var prediction = res.minDeliveryTime === res.maxDeliveryTime ?
          res.minDeliveryTime :
          res.minDeliveryTime + '-' + res.maxDeliveryTime;
        if (this.options.prefix) prediction = this.options.prefix + ' ' + prediction;
        if (this.options.suffix) prediction += ' ' + this.options.suffix;

        this.innerHTML(prediction);

      } else this.showError();
    });
  }

  initLanguage() {
    this._langCode = 'en';
    if (statics.languages[this._langCode]) {
      this.lang = statics.languages[this._langCode];
    } else {
      this.handleError('Could not detect user language ... fallback to [EN]!');
      this.lang = statics.languages.en;
    }
  }

  props() {
    return {
      userId: this.options.userId,
      location: this.options.location,
      courier: this.options.courier,
    };
  }

  propsCheck() {
    return this.options.userId && this.options.location && this.options.courier;
  }

  $find(sel) {
    var buildSelector = (sel)=> {
      var res = this.rootNodeQuery;
      if (sel) res += ` ${sel}`;
      return res;
    };

    return _$(buildSelector(sel));
  }

  handleError(err) {
    if (typeof err === 'string')
      console.error(`🙀  ${err}`);
    else if (typeof err === 'object') {
      Raven.captureException(err);
      console.error(`🙀  ${err.message}`);
    }
  }

  lsSet(key, val) {
    try {
      localStorage.setItem(key, val);
    } catch (e) {
      if (e.name === 'NS_ERROR_FILE_CORRUPTED') {
        console.log(`😿 Sorry, it looks like your browser storage is corrupted.
        Please clear your storage by going to Tools -> Clear Recent History -> Cookies
        and set time range to 'Everything'.
        This will remove the corrupted browser storage across all sites.`);
      }
    }
  }

  lsGet(key) {
    var res = null;
    try {
      res = localStorage.getItem(key);
    } catch (e) {
      if (e.name === 'NS_ERROR_FILE_CORRUPTED') {
        console.log(`😿 Sorry, it looks like your browser storage is corrupted.
        Please clear your storage by going to Tools -> Clear Recent History -> Cookies
        and set time range to 'Everything'.
        This will remove the corrupted browser storage across all sites.`);
      }
    }
    finally {
      return res;
    }
  }

  selfUpdate() {
    var lastUpdate = this.lsGet('parcelLab.js.updatedAt');

    // check if selfUpdate was executed in the last 12 h
    if (lastUpdate && lastUpdate > Date.now() - 43200000) {
      return;
    }

    console.log('👻 Searching for new parcelLab.js version...');
    Api.getCurrentPluginVersion((err, versionTag)=> {
      if (err) return this.lsSet('parcelLab.js.updatedAt', Date.now());
      else {
        this.lsSet('parcelLab.js.updatedAt', Date.now());
        if (versionTag && versionTag !== CURRENT_VERSION_TAG) {
          console.log('👻 Updating plugin to version ~> ', versionTag);
          window.location.reload(true);
        }
      }
    });
  }

  ///////////////////////////
  // DOM affecting methods //
  ///////////////////////////

  loading(isLoading=true) {
    // currently, do nothing
  }

  showError() {
    // currently, do nothing
  }

  innerHTML(html) {
    this.loading(false);
    this.$find().html(html);
  }

}

module.exports = ParcelLab;
