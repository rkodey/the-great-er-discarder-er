
(function (window) {

  'use strict';

  var self = {
    ONLINE_CHECK        : 'onlineCheck',
    BATTERY_CHECK       : 'batteryCheck',
    DISCARD_TIME        : 'timeToDiscard',
    IGNORE_PINNED       : 'dontDiscardPinned',
    IGNORE_FORMS        : 'dontDiscardForms',
    IGNORE_AUDIO        : 'dontDiscardAudio',
    IGNORE_CACHE        : 'ignoreCache',
    ADD_CONTEXT         : 'addContextMenu',
    WHITELIST           : 'whitelist',
    SYNC_OPTIONS        : 'syncOptions',
    DISCARD_STARTUP     : 'discardAtStartup',
    SUSPEND_MODE        : 'suspendMode',
    ADD_DISCARDS        : 'addDiscardsMenu',

    getOption           : getOption,
    getOptions          : getOptions,
    setOption           : setOption,
    setOptions          : setOptions,
    // sync_Options         : sync_Options,
    addToWhitelist      : addToWhitelist,
    removeFromWhitelist : removeFromWhitelist,
    cleanWhitelist      : cleanWhitelist
  };
  window.storage = self;

  function getSettingsDefaults() {
    var defaults = {};
    defaults[self.ONLINE_CHECK]     = false;
    defaults[self.BATTERY_CHECK]    = false;
    defaults[self.IGNORE_PINNED]    = true;
    defaults[self.IGNORE_FORMS]     = true;
    defaults[self.IGNORE_AUDIO]     = true;
    defaults[self.IGNORE_CACHE]     = false;
    defaults[self.ADD_CONTEXT]      = true;
    defaults[self.DISCARD_TIME]     = '60';
    defaults[self.WHITELIST]        = '';
    defaults[self.SYNC_OPTIONS]     = true;
    defaults[self.DISCARD_STARTUP]  = false;
    defaults[self.SUSPEND_MODE]     = false;
    defaults[self.ADD_DISCARDS]     = false;
    return defaults;
  }


  const noop    = function() {};

  const logOpt  = function(options) {
    return [ self.WHITELIST, options[self.WHITELIST], JSON.parse(JSON.stringify(options)) ];
  }


  function getOption(prop, callback) {
    // log('getOption', prop);
    getOptions(function (options) {
      callback(options[prop]);
    });
  }

  function getOptions(callback) {
    log('getOptions');
    chrome.storage.local.get(null, function (localOptions) {
      // log('getOptions local', ...logOpt(localOptions));

      var mergedOptions = getSettingsDefaults();
      // log('getOptions defaults', ...logOpt(mergedOptions));
      for (var prop in mergedOptions) {
        if (typeof localOptions[prop] !== 'undefined' && localOptions[prop] !== null) {
          mergedOptions[prop] = localOptions[prop];
        }
      }
      // log('getOptions merged', ...logOpt(mergedOptions));

      // Overlay sync updates in the local data store.  Like sync itself, we just guarantee eventual consistency.
      if (mergedOptions[self.SYNC_OPTIONS]) {
        chrome.storage.sync.get(null, function(syncedOptions) {
          // log('getOptions syncedOptions', ...logOpt(syncedOptions));
          for (var prop in mergedOptions) {
            if (typeof syncedOptions[prop] !== 'undefined' && syncedOptions[prop] !== mergedOptions[prop]) {
              // err(`overriding local setting with synced ${prop} = ${syncedOptions[prop]}`);
              setOption(prop, syncedOptions[prop]);
              mergedOptions[prop] = syncedOptions[prop];
            }
          }
        });
      }

      // log('getOptions callback', ...logOpt(mergedOptions));
      callback(mergedOptions);
    });
  }

  function setOption(prop, value, callback) {
    // log('setOption', prop, value);
    var valueByProp = {};
    valueByProp[prop] = value;
    setOptions(valueByProp, callback || noop);
  }

  function setOptions(newOptions, callback) {
    // var log = warn;
    log('setOptions', newOptions);

    chrome.storage.local.get(null, function (mergedOptions) {
      // log('setOptions curOptions', ...logOpt(mergedOptions));

      for (var prop in newOptions) {
        if (newOptions.hasOwnProperty(prop)) {
          mergedOptions[prop] = newOptions[prop];
        }
      }

      if (mergedOptions[self.SYNC_OPTIONS]) {
        // Since sync is a local setting, delete it to simplify things.
        var syncObjects = Object.assign({}, mergedOptions);
        delete syncObjects[self.SYNC_OPTIONS];
        // log('setOptions save syncObjects', ...logOpt(syncObjects));
        chrome.storage.sync.set(syncObjects);
      }

      // log('setOptions save curOptions', ...logOpt(mergedOptions));
      chrome.storage.local.set(mergedOptions, callback || noop);
    });
  }


  // WHITELIST HELPERS

  function addToWhitelist (entry, callback) {
    log('addToWhitelist', entry);
    self.getOption(self.WHITELIST, function (whitelist) {
      whitelist = whitelist ? whitelist + '\n' + entry : entry;
      whitelist = cleanWhitelist(whitelist);
      self.setOption(self.WHITELIST, whitelist, callback || noop);
    });
  }

  function removeFromWhitelist (entry, callback) {
    log('removeFromWhitelist', entry);
    self.getOption(self.WHITELIST, function (whitelist) {

      var whitelistItems = whitelist ? whitelist.split(/[\s\n]+/).sort() : '';
      for (var i = whitelistItems.length - 1; i >= 0; i--) {
        if (testForMatch(whitelistItems[i], entry)) {
          whitelistItems.splice(i, 1);
        }
      }
      self.setOption(self.WHITELIST, whitelistItems.join('\n'), callback || noop);

    });
  }

  function cleanWhitelist (whitelist) {
    // var log = warn;
    // log('cleanWhitelist', whitelist);

    // We can skip the array sort that was here
    const whitelistItems = String(whitelist).toLowerCase().split(/[\s\n]+/);
    // log('cleanWhitelist before', whitelistItems);

    // Yikes...  looks like this original code is simply deduping.  Let's try something modern...
    // for (var i = whitelistItems.length - 1; i >= 0; i--) {
    //   var j = whitelistItems.lastIndexOf(whitelistItems[i]);
    //   log('cleanWhitelist loop', i, j, whitelistItems[i], whitelistItems[j]);
    //   if (j !== i) {
    //     whitelistItems.splice(i + 1, j - i);
    //   }
    // }

    const unique = new Set(whitelistItems);
    unique.delete('');
    const newList = [...unique];

    log('cleanWhitelist after', newList);

    return newList.join('\n');
  }

}(globalThis));
