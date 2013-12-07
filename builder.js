var _fs = require('fs'),
    _path = require('path');

(function() {
  var Configure = function(preset) {
    return new Configure.o(preset);
  };

  Configure.o = function(preset) {
    this.config = {
       'GAIA_DIR': ''
      ,'PROFILE_DIR': ''
      ,'PROFILE_FOLDER': ''
      ,'GAIA_SCHEME': 'http://'
      ,'GAIA_DOMAIN': 'gaiamobile.org'
      ,'DEBUG': '1'
      ,'LOCAL_DOMAINS': '1'
      ,'DESKTOP': '1'
      ,'DEVICE_DEBUG': '0'
      ,'HOMESCREEN': 'http://system.gaiamobile.org'
      ,'GAIA_PORT': ':8080'
      ,'GAIA_LOCALES_PATH': 'locales'
      ,'LOCALES_FILE': 'shared/resources/languages.json'
      ,'GAIA_KEYBOARD_LAYOUTS': 'en,pt-BR,es,de,fr,pl'
      ,'BUILD_APP_NAME': '*'
      ,'PRODUCTION': '0'
      ,'GAIA_OPTIMIZE': '0'
      ,'GAIA_DEV_PIXELS_PER_PX': '1'
      ,'DOGFOOD': '0'
      ,'OFFICIAL': ''
      ,'GAIA_DEFAULT_LOCALE': 'en-US'
      ,'GAIA_INLINE_LOCALES': '1'
      ,'GAIA_CONCAT_LOCALES': '1'
      ,'GAIA_ENGINE': 'xpcshell'
      ,'GAIA_DISTRIBUTION_DIR': ''
      ,'GAIA_APPDIRS': ''
      ,'NOFTU': '1'
      ,'REMOTE_DEBUGGER': '0'
      ,'TARGET_BUILD_VARIANT': ''
      ,'SETTINGS_PATH': 'build/custom-settings.json'
      ,'VARIANT_PATH': ''
    };
    if (preset)
      this._preset(preset);

    this.checkStates = {
      'port': 0,
      '_setPath': {},
      'passed': true
    };

    this.pathSection = {
       'gaia': this._pathGaia.bind(this)
      ,'profile': this._pathProfile.bind(this)
      ,'locales': this._pathLocales.bind(this)
      ,'localesFile': this._pathLocalesFile.bind(this)
      ,'distribution': this._pathDistribution.bind(this)
      ,'apps': this._pathApps.bind(this)
      ,'settings': this._pathSettings.bind(this)
      ,'variant': this._pathVariant.bind(this)
      ,'done': (function(){ return this; }).bind(this)
    };

    // Should some conflicts check and handle them automically.
    this.switchSection = {
       'debug': this._switchDebug.bind(this)
      ,'localDomains': this._switchLocalDomains.bind(this)
      ,'desktop': this._switchDesktop.bind(this)
      ,'deviceDebug': this._switchDeviceDebug.bind(this)
      ,'production': this._switchProduction.bind(this)
      ,'optimize': this._switchOptimize.bind(this)
      ,'dogfood': this._switchDogFood.bind(this)
      ,'inlineLocales': this._switchInlineLocales.bind(this)
      ,'concatLocales': this._switchConcatLocales.bind(this)
      ,'noFTU': this._switchNoFTU.bind(this)
      ,'remoteDebugger': this._switchRemoteDebugger.bind(this)
      ,'done': (function(){ return this; }).bind(this)
    };
  };

  /**
   * Set the port (number).
   *
   * @param {number} |port|
   * @return {Configure}
   * @this {Configure}
   */
  Configure.o.prototype.port = function(port) {
    if (port < 1 || port > 65535) {
      this.checkStates.port = port;
      this.checkStates.passed = false;
      return false;
    }
    this.config['GAIA_PORT'] = ':' + port;
    return this;
  };

  Configure.o.prototype.path = function() {

    // Some methods check and some of them not.
    // Principle: if user call them, should do check unless they're actually not paths.
    return this.pathSection;
  };

  /**
   * Corresponds to the 'GAIA_DIR' option.
   *
   * @param {string} |path|
   * @return {this.pathSection}
   * @this {Configure.o}
   */
  Configure.o.prototype._pathGaia = function(path) {
    this._setPath('GAIA_DIR', Configure._resolvePath(path));
    return this.pathSection;
  };

  /**
   * Corresponds to the 'PROFILE_DIR' and 'PROFILE_FOLDER' option.
   *
   * @param {string} |path|
   * @return {this.pathSection}
   * @this {Configure.o}
   */
  Configure.o.prototype._pathProfile = function(path) {
    this._setPath('PROFILE_DIR', Configure._resolvePath(path), false);
    this.config['PROFILE_FOLDER'] = _path.basename(path);
    return this.pathSection;
  };

  /**
   * Corresponds to the 'GAIA_LOCALES_PATH' option.
   *
   * @param {string} |spath| The relative path under the GAIA_DIR.
   * @return {this.pathSection}
   * @this {Configure.o}
   */
  Configure.o.prototype._pathLocales = function(spath) {
    this._checkPath('GAIA_LOCALES_PATH (absolute)',
      this.config['GAIA_DIR'] + '/' + spath);
    this._setPath('GAIA_LOCALES_PATH', spath, false);
    return this.pathSection;
  };

  /**
   * Corresponds to the 'LOCALES_FILE' option.
   *
   * @param {string} |spath| The relative path under the GAIA_DIR.
   * @return {this.pathSection}
   * @this {Configure.o}
   */
  Configure.o.prototype._pathLocalesFile = function(spath) {
    this._checkPath('LOCALES_FILE (absolute)',
      this.config['GAIA_DIR'] + '/' + spath);
    this._setPath('LOCALES_FILE', spath, false);
    return this.pathSection;
  };

  /**
   * Corresponds to the 'GAIA_DISTRIBUTION_DIR' option.
   *
   * @param {string} |path|
   * @return {this.pathSection}
   * @this {Configure.o}
   */
  Configure.o.prototype._pathDistribution = function(path) {
    this._setPath('GAIA_DISTRIBUTION_DIR', Configure._resolvePath(path));
    return this.pathSection;
  };

  /**
   * Give an array of apps' path, then join them into the format needed
   * by profile builder, which is separated by spaces.
   *
   * Corresponds to the 'GAIA_APPDIRS' option.
   *
   * @param { [string] } |paths|
   * @this {Configure.o}
   */
  Configure.o.prototype._pathApps = function(paths) {
    var name = 'GAIA_APPDIRS';
    var apaths = [];
    paths.forEach((function _doCheck(path, i, a) {
      // Will not overwrite the 'GAIA_APPDIRS' with the postfix.
      this._checkPath(name + '#' + i, path);
      apaths.push(Configure._resolvePath(path));
    }).bind(this));
    this._setPath(name, apaths.join(' '));
    return this.pathSection;
  };

  /**
   * Corresponds to the 'SETTINGS_PATH' option.
   *
   * @param {string} |spath| The relative path under the GAIA_DIR.
   * @return {this.pathSection}
   * @this {Configure.o}
   */
  Configure.o.prototype._pathSettings = function(spath) {
    this._checkPath('SETTINGS_PATH (absolute)',
      this.config['GAIA_DIR'] + '/' + spath);
    this._setPath('SETTINGS_PATH', spath, false);
    return this.pathSection;
  };

  /**
   * Corresponds to the 'VARIANT_PATH' option.
   *
   * @param {string} |spath| The relative path under the GAIA_DIR.
   * @return {this.pathSection}
   * @this {Configure.o}
   */
  Configure.o.prototype._pathVariant = function(spath) {
    this._checkPath('VARIANT_PATH (absolute)',
      this.config['GAIA_DIR'] + '/' + spath);
    this._setPath('VARIANT_PATH', spath, false);
    return this.pathSection;
  };

  /**
   * Corresponds to the 'DEBUG' option.
   *
   * @param {boolean} |s|
   * @return {this.switchSection}
   * @this {Configure.o}
   */
  Configure.o.prototype._switchDebug = function(s) {
    this._switch('DEBUG', s);
    return this.switchSection;
  };

  /**
   * Corresponds to the 'LOCAL_DOMAINS' option.
   *
   * @param {boolean} |s|
   * @return {this.switchSection}
   * @this {Configure.o}
   */
  Configure.o.prototype._switchLocalDomains = function() {
    this._switch('LOCAL_DOMAINS', s);
    return this.switchSection;
  };

  /**
   * Corresponds to the 'DESKTOP' option.
   *
   * @param {boolean} |s|
   * @return {this.switchSection}
   * @this {Configure.o}
   */
  Configure.o.prototype._switchDesktop = function() {
    this._switch('DESKTOP', s);
    return this.switchSection;
  };

  /**
   * Corresponds to the 'DEVICE_DEBUG' option.
   *
   * @param {boolean} |s|
   * @return {this.switchSection}
   * @this {Configure.o}
   */
  Configure.o.prototype._switchDeviceDebug = function() {
    this._switch('DEVICE_DEBUG', s);
    return this.switchSection;
  };

  /**
   * Corresponds to the 'PRODUCTION' option.
   *
   * @param {boolean} |s|
   * @return {this.switchSection}
   * @this {Configure.o}
   */
  Configure.o.prototype._switchProduction = function() {
    this._switch('PRODUCTION', s);
    return this.switchSection;
  };

  /**
   * Corresponds to the 'GAIA_OPTIMIZE' option.
   *
   * @param {boolean} |s|
   * @return {this.switchSection}
   * @this {Configure.o}
   */
  Configure.o.prototype._switchOptimize = function() {
    this._switch('GAIA_OPTIMIZE', s);
    return this.switchSection;
  };

  /**
   * Corresponds to the 'DOGFOOD' option.
   *
   * @param {boolean} |s|
   * @return {this.switchSection}
   * @this {Configure.o}
   */
  Configure.o.prototype._switchDogFood = function() {
    this._switch('DOGFOOD', s);
    return this.switchSection;
  };

  /**
   * Corresponds to the 'GAIA_INLINE_LOCALES' option.
   *
   * @param {boolean} |s|
   * @return {this.switchSection}
   * @this {Configure.o}
   */
  Configure.o.prototype._switchInlineLocales = function() {
    this._switch('GAIA_INLINE_LOCALES', s);
    return this.switchSection;
  };

  /**
   * Corresponds to the 'GAIA_CONCAT_LOCALES' option.
   *
   * @param {boolean} |s|
   * @return {this.switchSection}
   * @this {Configure.o}
   */
  Configure.o.prototype._switchConcatLocales = function() {
    this._switch('GAIA_CONCAT_LOCALES', s);
    return this.switchSection;
  };

  /**
   * Corresponds to the 'NOFTU' option.
   *
   * @param {boolean} |s|
   * @return {this.switchSection}
   * @this {Configure.o}
   */
  Configure.o.prototype._switchNoFTU = function() {
    this._switch('NOFTU', s);
    return this.switchSection;
  };

  /**
   * Corresponds to the 'REMOTE_DEBUGGER' option.
   *
   * @param {boolean} |s|
   * @return {this.switchSection}
   * @this {Configure.o}
   */
  Configure.o.prototype._switchRemoteDebugger = function() {
    this._switch('REMOTE_DEBUGGER', s);
    return this.switchSection;
  };

  /**
   * Return built configure and the states.
   *
   * @return { {'configure': Object, 'states': Object} }
   * @this {Configure.o}
   */
  Configure.o.prototype.get = function() {
    return {'config': this.config, 'states': this.checkStates};
  };

  Configure.o.prototype._setPath = function(name, path, check) {
    this.config[name] = path;
    if (false === check) {
      return;
    }
    this._checkPath(name, path);
  };

  Configure.o.prototype._switch = function(name, bool) {
    this.config[name] = bool ? '1' : '0';
  };

  /**
   * Check the path if it exists, and record it in ths state.
   *
   * @param {string} |name| The name to record.
   * @param {string} |path|
   * @return {boolean}
   * @this {Configure.o}
   */
  Configure.o.prototype._checkPath = function(name, path) {
    var apth = Configure._resolvePath(path);
    if (!_fs.existsSync(apth)) {
      this.checkStates._setPath[name] = apth;
      this.checkStates.passed = false;
      return false;
    }
    return true;
  };

  /**
   * Give preset object to overwrite parts or the whole default config.
   *
   * @param {Object} |preset|
   * @this {Configure.o}
   */
  Configure.o.prototype._preset = function(preset) {
    for (var k in preset) {
      this.config[k] = preset[k];
    }
  };

  /**
   * Resolver with '~' ability.
   *
   * @param {string} |path|
   * @return {string}
   */
  Configure._resolvePath = function(path) {
    if (path.substr(0,1) === '~')
      path = process.env.HOME + path.substr(1);
    return _path.resolve(path);
  };

  module.exports = Configure;

})();
