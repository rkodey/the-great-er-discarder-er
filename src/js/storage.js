// @ts-check

import  { log, warn } from './log.js';

export const storage = (function () {

  'use strict';

  const self = {
    ONLINE_CHECK            : 'onlineCheck',
    BATTERY_CHECK           : 'batteryCheck',
    DISCARD_TIME            : 'timeToDiscard',
    IGNORE_PINNED           : 'dontDiscardPinned',
    IGNORE_FORMS            : 'dontDiscardForms',
    IGNORE_AUDIO            : 'dontDiscardAudio',
    IGNORE_CACHE            : 'ignoreCache',
    ADD_CONTEXT             : 'addContextMenu',
    ADD_DISCARDS            : 'addDiscardsMenu',
    WHITELIST               : 'whitelist',
    SYNC_OPTIONS            : 'syncOptions',
    DISCARD_STARTUP         : 'discardAtStartup',
    SUSPEND_MODE            : 'suspendMode',
    SUSPEND_RESTORE_CLICK   : 'suspendRestoreClickAnywhere',
    SUSPEND_RESTORE_RELOAD  : 'suspendRestoreReload',
    SUSPEND_FAVICON         : 'suspendFavicon',

    getOption               : getOption,
    getOptions              : getOptions,
    setOption               : setOption,
    setOptions              : setOptions,
  };

  function getSettingsDefaults() {
    var defaults = {};
    defaults[self.ONLINE_CHECK]           = false;
    defaults[self.BATTERY_CHECK]          = false;
    defaults[self.IGNORE_PINNED]          = true;
    defaults[self.IGNORE_FORMS]           = true;
    defaults[self.IGNORE_AUDIO]           = true;
    defaults[self.IGNORE_CACHE]           = false;
    defaults[self.ADD_CONTEXT]            = true;
    defaults[self.ADD_DISCARDS]           = false;
    defaults[self.DISCARD_TIME]           = '60';
    defaults[self.WHITELIST]              = '';
    defaults[self.SYNC_OPTIONS]           = true;
    defaults[self.DISCARD_STARTUP]        = false;
    defaults[self.SUSPEND_MODE]           = false;
    defaults[self.SUSPEND_RESTORE_CLICK]  = true;
    defaults[self.SUSPEND_RESTORE_RELOAD] = false;
    defaults[self.SUSPEND_FAVICON]        = 'dim';
    return defaults;
  }


  const noop    = () => {};

  const logOpt  = (options) => {
    return [ self.WHITELIST, options[self.WHITELIST], JSON.parse(JSON.stringify(options)) ];
  }


  function getMergedOptions(localOptions) {
    const mergedOptions = getSettingsDefaults();
    // log('getMergedOptions defaults', ...logOpt(mergedOptions));
    for (var prop in mergedOptions) {
      if (typeof localOptions[prop] !== 'undefined' && localOptions[prop] !== null) {
        mergedOptions[prop] = localOptions[prop];
      }
    }
    return mergedOptions;
  }

  function getOption(prop, callback) {
    // log('getOption', prop);
    getOptions((options) => {
      callback(options[prop]);
    });
  }

  function getOptions(callback) {
    // log('getOptions');
    chrome.storage.local.get(null, (localOptions) => {
      // log('getOptions local', ...logOpt(localOptions));

      const mergedOptions = getMergedOptions(localOptions);
      // log('getOptions merged', ...logOpt(mergedOptions));

      // Overlay sync updates in the local data store.  Like sync itself, we just guarantee eventual consistency.
      if (mergedOptions[self.SYNC_OPTIONS]) {
        chrome.storage.sync.get(null, (syncedOptions) => {
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
    // warn('setOptions', newOptions);

    chrome.storage.local.get(null, function (localOptions) {
    // getOptions((mergedOptions) => {
      // log('setOptions curOptions', ...logOpt(mergedOptions));

      const mergedOptions = getMergedOptions(localOptions);

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

  return self;

}());
