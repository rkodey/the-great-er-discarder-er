/* global chrome */
(function (window) {

  'use strict';

  var self = {
    ONLINE_CHECK: 'onlineCheck',
    BATTERY_CHECK: 'batteryCheck',
    SUSPEND_TIME: 'timeToDiscard',
    IGNORE_PINNED: 'dontDiscardPinned',
    IGNORE_FORMS: 'dontDiscardForms',
    IGNORE_AUDIO: 'dontDiscardAudio',
    IGNORE_CACHE: 'ignoreCache',
    ADD_CONTEXT: 'addContextMenu',
    NO_NAG: 'noNag',
    WHITELIST: 'whitelist',
    SYNC_OPTIONS: 'syncOptions',

    getOption: getOption,
    getOptions: getOptions,
    setOption: setOption,
    setOptions: setOptions,
    syncOptions: syncOptions,
    saveToWhitelist: saveToWhitelist,
    removeFromWhitelist: removeFromWhitelist,
    cleanupWhitelist: cleanupWhitelist

  };
  window.storage = self;


  const noop = function() {};

  function getOption(prop, callback) {
    getOptions(function (options) {
      callback(options[prop]);
    });
  }

  function getOptions(callback) {
    chrome.storage.local.get(null, function (options) {
      // console.log('options',options);

      var defaults = getSettingsDefaults();
      for (var prop in defaults) {
        if (typeof(options[prop]) !== 'undefined' && options[prop] !== null) {
          defaults[prop] = options[prop];
        }
      }

      // Overlay sync updates in the local data store.  Like sync
      // itself, we just guarantee eventual consistency.
      if (defaults[self.SYNC_OPTIONS]) {
        chrome.storage.sync.get(null, function(syncOptions) {
          // console.log('syncOptions',syncOptions);
          for (var prop in defaults) {
            if (syncOptions[prop] !== undefined && syncOptions[prop] !== defaults[prop]) {
              // console.log('updating local setting with synced one. ' + prop + ' = ' + syncOptions[prop]);
              setOption(prop, syncOptions[prop]);
              defaults[prop] = syncOptions[prop];
            }
          }
        });
      }

      callback(defaults);
    });
  }

  function setOption(prop, value, callback) {
    callback = callback || noop;
    var valueByProp = {};
    valueByProp[prop] = value;
    setOptions(valueByProp, callback);
  }

  function setOptions(valueByProp, callback) {
    callback = callback || noop;
    chrome.storage.local.get(null, function (options) {

      for (var prop in valueByProp) {
        if (valueByProp.hasOwnProperty(prop)) {
          options[prop] = valueByProp[prop];
        }
      }
      // console.log('saving options',options);
      chrome.storage.local.set(options, callback);
    });
  }

  function syncOptions(options) {
    if (options[self.SYNC_OPTIONS]) {
      // Since sync is a local setting, delete it to simplify things.
      var syncObjects = Object.assign({}, options);
      delete syncObjects[self.SYNC_OPTIONS];
      // console.log('Pushing local options to sync');
      chrome.storage.sync.set(syncObjects, noop);
    }
  }

  // WHITELIST HELPERS

  function saveToWhitelist (newString, callback) {
    callback = callback || noop;
    self.getOption(self.WHITELIST, function (whitelist) {
      whitelist = whitelist ? whitelist + '\n' + newString : newString;
      whitelist = cleanupWhitelist(whitelist);
      self.setOption(self.WHITELIST, whitelist, callback);
    });
  }

  function removeFromWhitelist (url, callback) {
    callback = callback || noop;
    self.getOption(self.WHITELIST, function (whitelist) {

      var whitelistItems = whitelist ? whitelist.split(/[\s\n]+/).sort() : '',
        i;

      for (i = whitelistItems.length - 1; i >= 0; i--) {
        if (testForMatch(whitelistItems[i], url)) {
          whitelistItems.splice(i, 1);
        }
      }
      self.setOption(self.WHITELIST, whitelistItems.join('\n'), callback);
    });
  }

  function cleanupWhitelist (whitelist) {
    var whitelistItems = whitelist ? whitelist.split(/[\s\n]+/).sort() : '',
      i,
      j;

    for (i = whitelistItems.length - 1; i >= 0; i--) {
      j = whitelistItems.lastIndexOf(whitelistItems[i]);
      if (j !== i) {
        whitelistItems.splice(i + 1, j - i);
      }
    }
    if (whitelistItems.length) {
      return whitelistItems.join('\n');
    } else {
      return whitelistItems;
    }
  }

  // PRIVATE FUNCTIONS

  function getSettingsDefaults() {

    var defaults = {};
    defaults[self.ONLINE_CHECK] = false;
    defaults[self.BATTERY_CHECK] = false;
    defaults[self.IGNORE_PINNED] = true;
    defaults[self.IGNORE_FORMS] = true;
    defaults[self.IGNORE_AUDIO] = true;
    defaults[self.IGNORE_CACHE] = false;
    defaults[self.ADD_CONTEXT] = true;
    defaults[self.SUSPEND_TIME] = '60';
    defaults[self.NO_NAG] = false;
    defaults[self.WHITELIST] = '';
    defaults[self.SYNC_OPTIONS] = true;

    return defaults;
  }




}(window));

