var Configure = require('./builder.js');

// You can specify a preset settings to overwrite them at once.
var fin = Configure({'GAIA_DIR' : '/tmp'})
  .path()
    .gaia('~/Projects/gaia')
    .locales('locales')
    .localesFile('shared/resources/languages.json')
    .apps(['./apps/system', './apps/calendar'])
  .done()
  .get();
console.dir(fin);
