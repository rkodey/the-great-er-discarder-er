
'use strict';

const CURRENT_TAB_ID      = 'currentTabId';
const PREVIOUS_TAB_ID     = 'previousTabId';
const TEMPORARY_WHITELIST = 'temporaryWhitelist';

const extensionActiveIcon = '/img/icon19.png';
const extensionPausedIcon = '/img/icon19b.png';
const DEBUG               = !(chrome.runtime.getManifest().update_url); // Turn on debug for local unpacked extension

const  log = function(...msg) { if(DEBUG) console.log(...msg); }
const warn = function(...msg) { if(DEBUG) console.warn(...msg); }
// const  err = function(...msg) { if(DEBUG) console.error(...msg); }

log('Extension loading...');

// initialize global state vars
var chargingMode          = false;
var startupDone           = false;

// chrome.alarms.getAll(function (alarms) {
//   log(alarms);
//     chrome.alarms.clearAll(function () {
//   });
// });

log('Registering listeners...');

if (typeof self != 'undefined' && self instanceof ServiceWorkerGlobalScope) {
  self.addEventListener("install", (event) => {
    log('1 service worker install');
  });
}

chrome.runtime.onInstalled.addListener(function() {
  log('2 chrome onInstalled');
  // Fired when the extension is first installed, when the extension is updated to a new version, and when Chrome is updated to a new version.
  // Fired when an unpacked extension is reloaded

  storage.getOptions(function (options) {
    if (options[storage.ADD_CONTEXT]) {
      buildContextMenu(true, options[storage.ADD_DISCARDS]);
    }
  });
});

if (typeof self != 'undefined' && self instanceof ServiceWorkerGlobalScope) {
  self.addEventListener("activate", (event) => {
    log('3 service worker activate');
    startupDiscard();
  });
}

chrome.runtime.onStartup.addListener(function () {
  log('4 chrome onStartup');
  // Fired when a profile that has this extension installed first starts up.
  // This event is not fired when an incognito profile is started, even if this extension is operating in 'split' incognito mode.

  // chrome.runtime.onStartup wasn't firing on browser start when cache was cleared, so this makes sure we run once
  // onStartup was running 2-3 seconds after this extension loads, so choosing 5 seconds should put us after onStartup has a chance

  chrome.alarms.clearAll(function () {
    asyncSessionSet({ [TEMPORARY_WHITELIST]: {} });
    tabStates.clearTabStates(function () {
      chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        if (tabs.length > 0) {
          asyncSessionSet({ [CURRENT_TAB_ID]: tabs[0].id })
        }
      });
    });
  });

  startupDiscard();

});

chrome.alarms.onAlarm.addListener(function (alarm) {
  log('onAlarm', alarm);

  chrome.tabs.get(parseInt(alarm.name), function (tab) {
    if (chrome.runtime.lastError) {
      log(chrome.runtime.lastError.message);
    }
    else {
      requestTabDiscard(tab);
    }
  });
});

//listen for changes to battery state
if (navigator.getBattery) {
  navigator.getBattery().then(function(battery) {

    chargingMode = battery.charging;
    battery.onchargingchange = function () {
      chargingMode = battery.charging;
      log('Battery state updated', chargingMode);
    };
  });
}

//listen for changes to tab states
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {

  if (changeInfo.status === 'loading') {
    return;
  }
  else if (isDiscarded(tab)) {
    return;
  }

  // log(`onUpdated: ${tab.index}, ${tab.id}, Tab Status ${tab.status}`);

  tabStates.getTabState(tabId, function (previousTabState) {
    chrome.alarms.get(String(tab.id), function (alarm) {

      // log('previousTabState', previousTabState);

      if (!alarm && changeInfo.status === 'complete') {
        resetTabTimer(tab);
      }

      //check for tab playing audio
      else if (!tab.audible && previousTabState && previousTabState.audible) {
        log('tab finished playing audio. restarting timer: ' + tab.id);
        resetTabTimer(tab);
      }

      tabStates.setTabState(tab);
    });
  });
});

//add message and command listeners
chrome.runtime.onMessage.addListener(messageRequestListener);
chrome.commands.onCommand.addListener(commandListener);
chrome.contextMenus.onClicked.addListener(contextMenuListener);


chrome.tabs.onActivated.addListener(async function (activeInfo) {
  log('onActivated', activeInfo);

  var tabId = activeInfo.tabId;
  var lastTabId = await asyncSessionGet(CURRENT_TAB_ID);

  log('tab changed: ' + tabId);

  // clear timer on current tab
  clearTabTimer(tabId);

  // reset timer on tab that lost focus
  if (lastTabId) {
    chrome.tabs.get(parseInt(lastTabId), function (lastTab) {
      if (chrome.runtime.lastError) {
        log(chrome.runtime.lastError.message);
      }
      else {
        resetTabTimer(lastTab);
      }
    });
  }
  asyncSessionSet({
    [CURRENT_TAB_ID]: tabId,
    [PREVIOUS_TAB_ID]: lastTabId,
  });
});


log('Done registering listeners.');


function startupDiscard(fCheckIfDone) {
  warn('startupDiscard');
  // The main onStartup will not pass in fCheckIfDone, and will thus ignore startupDone and always run
  if (!fCheckIfDone || !startupDone) {
    startupDone = true;
    storage.getOptions(function (options) {
      // If user has requested Discard at Startup, then discardAllTabsInAllWindows without the forced update.  This allows isExcluded() tabs to survive.
      if (options[storage.DISCARD_STARTUP]) { discardAllTabsInAllWindows({ noForce: true }); }
    });
  }
}

// chrome.runtime.onStartup wasn't firing on browser start when cache was cleared, so this makes sure we run once
// onStartup was running 2-3 seconds after this extension loads, so choosing 5 seconds should put us after onStartup has a chance
// setTimeout(function() { startupDiscard(true); }, 5000);

async function asyncSessionGet(name) {
  const ret = ( await chrome.storage.session.get([ name ]) ) [ name ];
  log('asyncSessionGet', name, ret);
  return ret;
}

async function asyncSessionSet(obj) {
  log('asyncSessionSet', obj);
  chrome.storage.session.set(obj);
}


function isDiscarded(tab) {
  return tab.discarded;
}

//tests for non-standard web pages. does not check for discarded pages!
function isSpecialTab(tab) {
  var url = tab.url;

  return (
      url.startsWith('chrome-devtools:') ||
      url.startsWith('chrome-extension:') ||
      url.startsWith('chrome:') ||
      url.startsWith('edge:') ||
      url.startsWith('extension:') ||
      url.startsWith('file:') ||
      url.indexOf('chrome.google.com/webstore') >= 0
  );
}

var openTabManager = {
  'options'   : { tabId:null, url:chrome.runtime.getURL('html/options.html') },
  'profiler'  : { tabId:null, url:chrome.runtime.getURL('html/profiler.html') },
  'discards'  : { tabId:null, url:'chrome://discards/' },
}

function createTab(name) {
  chrome.tabs.create( { url:openTabManager[name].url }, function(tab) {
    log(['createTab', openTabManager[name].tabId, tab.id]);
    openTabManager[name].tabId = tab.id;
  } );
}

function openTab(name) {
  if(openTabManager[name].tabId) {
    log(['openTab', openTabManager[name].tabId]);
    chrome.tabs.update(openTabManager[name].tabId, {active:true}, function(tab) {
      if (chrome.runtime.lastError || !tab) {
        createTab(name);
      }
    });
  }
  else {
    createTab(name);
  }
}

async function isExcluded(tab, options, tempWhitelist = null) {
  // log('isExcluded', tab.id)

  //check whitelist
  if (checkWhiteList(tab.url, options[storage.WHITELIST])) {
    return true;
  }
  else if (await checkTemporaryWhiteList(tab.id, tempWhitelist)) {
    return true;
  }
  else if (tab.active) {
    return true;
  }
  //don't allow discarding of special tabs
  else if (isSpecialTab(tab)) {
    return true;
  }
  else if (options[storage.IGNORE_PINNED] && tab.pinned) {
    return true;
  }
  else if (options[storage.IGNORE_AUDIO] && tab.audible) {
    return true;
  }
  else {
    return false;
  }
}

async function getTemporaryWhitelist() {
  const tempWhitelist = await asyncSessionGet(TEMPORARY_WHITELIST);
  log('getTemporaryWhitelist', tempWhitelist);
  return tempWhitelist ?? {};
}

async function checkTemporaryWhiteList(tabId, tempWhitelist = null) {
  // If a tempWhitelist is provided, use it as a cache, otherwise retrieve from storage
  const list = tempWhitelist ?? await getTemporaryWhitelist();
  return list[tabId];
}

function checkWhiteList(url, whitelist) {
  const whitelistItems = whitelist ? whitelist.split(/[\s\n]+/) : [];
  const whitelisted = whitelistItems.some(function (item) {
    return testForMatch(item, url);
  });
  return whitelisted;
}

function testForMatch(whitelistItem, word) {

  if (whitelistItem.length < 1) {
    return false;

  //test for regex ( must be of the form /foobar/ )
  } else if (whitelistItem.length > 2 &&
    whitelistItem.indexOf('/') === 0 &&
    whitelistItem.indexOf('/', whitelistItem.length - 1) !== -1) {

  whitelistItem = whitelistItem.substring(1, whitelistItem.length - 1);
  try {
    new RegExp(whitelistItem);
  } catch(e) {
    return false;
  }
  return new RegExp(whitelistItem).test(word);

  // test as substring
  } else {
    return word.indexOf(whitelistItem) >= 0;
  }
}

async function discardEligibleTab(tab, options, tempWhitelist = null) {
  log('discardEligibleTab', options);
  if (!(await isExcluded(tab, options, tempWhitelist) &&
      !(options[storage.ONLINE_CHECK] && !navigator.onLine) &&
      !(options[storage.BATTERY_CHECK] && chargingMode))) {
    // log('discardEligibleTab', tab.index, tab.id);
    discardOrSuspendTab(tab, options[storage.SUSPEND_MODE]);
  }
}

function requestTabDiscard(tab, force = false, options = null, tempWhitelist = null) {
  log('requestTabDiscard', force);

  //safety check
  if (typeof(tab) === 'undefined') { return; }

  //if forcing tab discard then skip other checks
  if (force) {
    discardOrSuspendTab(tab);

  }
  else {
    // otherwise perform soft checks before discarding
    if (options) {
      // if we've been provided options, assume they're good and use them ( good for batches of tabs )
      discardEligibleTab(tab, options, tempWhitelist);
    }
    else {
      // otherwise, go get the options and discard
      storage.getOptions(function (new_options) {
        discardEligibleTab(tab, new_options, tempWhitelist);
      });
    }
  }
}

function clearTabTimer(tabId) {
  chrome.alarms.clear(String(tabId));
}

function resetTabTimer(tab) {

  storage.getOption(storage.DISCARD_TIME, function (discardTime) {

    if (discardTime === '0') {
      log('Clearing timer for tab: ' + tab.id);
      clearTabTimer(tab.id);
    }
    else if (!isDiscarded(tab) && !tab.active && !isSpecialTab(tab)) {
      log('Resetting timer for tab: ' + tab.id);
      const whenToDiscard = parseInt(Date.now() + (parseFloat(discardTime) * 1000 * 60));
      chrome.alarms.create(String(tab.id), {when: whenToDiscard});
    }
    else {
      log("Skipping tab timer reset: ",tab);
    }
  });
}

/**
 * @param {chrome.tabs.Tab}     tab
 * @param {'suspend'|undefined} fSuspend
 */
function discardOrSuspendTab(tab, fSuspend) {
  log('discardOrSuspendTab', fSuspend);

  if (fSuspend) {
    // make sure tab is not special
    if (isSpecialTab(tab)) { return; }
    chrome.tabs.update(tab.id, { url: `chrome-extension://${chrome.runtime.id}/html/suspended.html#ttl=${tab.title}&uri=${tab.url}` });
  }
  else {
    // make sure tab already discarded
    if (isDiscarded(tab)) { return; }
    chrome.tabs.discard(tab.id, (discardedTab) => {
      if (chrome.runtime.lastError) {
        log(chrome.runtime.lastError.message);
      }
    });
  }
}

function whitelistHighlightedTab() {
  chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
    // log('whitelistHighlightedTab');
    if (tabs.length > 0) {

      // Instead of manually parsing, let's use URL()
      const url = new URL(tabs[0].url);
      log('whitelistHighlightedTab', url.host);

      storage.addToWhitelist(url.host, function () {
        if (isDiscarded(tabs[0])) {
          reloadTab(tabs[0]);
        }
      });
    }
  });
}

function unwhitelistHighlightedTab() {
  chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
    if (tabs.length > 0) {
      storage.removeFromWhitelist(tabs[0].url);
    }
  });
}

function temporarilyWhitelistHighlightedTab() {
  chrome.tabs.query({active: true, currentWindow: true}, async function (tabs) {
    if (tabs.length > 0) {
      const tempWhitelist = await getTemporaryWhitelist();
      tempWhitelist[tabs[0].id] = 1;
      asyncSessionSet({ [TEMPORARY_WHITELIST]: tempWhitelist });
    }
  });
}

function undoTemporarilyWhitelistHighlightedTab() {
  chrome.tabs.query({active: true, currentWindow: true}, async function (tabs) {
    if (tabs.length > 0) {
      const tempWhitelist = await getTemporaryWhitelist();

      // Now that we're using an object we can delete without a loop
      delete tempWhitelist[tabs[0].id];

      asyncSessionSet({ [TEMPORARY_WHITELIST]: tempWhitelist });
    }
  });
}

/**
 * @param {'suspend'|undefined} fSuspend
 */
function discardHighlightedTab(fSuspend) {
  chrome.tabs.query({active: true, currentWindow: true, discarded: false}, async (tabs) => {
    if (tabs.length > 0) {
      var tabToDiscard = tabs[0];

      if (fSuspend) {
        discardOrSuspendTab(tabToDiscard, true);
        return;
      }

      var previousTabId = await asyncSessionGet(PREVIOUS_TAB_ID);
      if (!previousTabId) return;
      chrome.tabs.get(previousTabId, (prevTab) => {
        if (chrome.runtime.lastError) {
          log(chrome.runtime.lastError.message);
        }
        if (prevTab) {
          chrome.tabs.update(previousTabId, { active: true, highlighted: true }, (tab) => {
            discardOrSuspendTab(tabToDiscard, false);
          });
        }
        else {
          chrome.tabs.create({}, (tab) => {
            discardOrSuspendTab(tabToDiscard, false);
          });
        }
      })
    }
  });
}

function reloadHighlightedTab() {
  chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
    if (tabs.length > 0 && isDiscarded(tabs[0])) {
      reloadTab(tabs[0]);
    }
  });
}

async function discardAllTabs(args = {}) {
  warn("discardAllTabs", args);

  // Retrieve the tempWhitelist and options once before looping, to avoid each loop doing so
  const tempWhitelist = await getTemporaryWhitelist();
  storage.getOptions(function (options) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      var curWindowId = tabs[0].windowId;
      chrome.windows.get(curWindowId, {populate: true}, function(curWindow) {
        curWindow.tabs.forEach(function (tab) {
          if (!tab.active) {
            // There's a good argument that requestTabDiscard should NEVER be forced, and should always obey user options
            // But for now, only Discard at Startup will use non-forced discards
            requestTabDiscard(tab, !args.noForce, options, tempWhitelist);
          }
        });
      });
    });
  });
}

async function discardAllTabsInAllWindows(args = {}) {
  warn("discardAllTabsInAllWindows", args);

  // Retrieve the tempWhitelist and options once before looping, to avoid each loop doing so
  // Retrieve the tempWhitelist and options once before looping, to avoid each loop doing so
  const tempWhitelist = await getTemporaryWhitelist();
  storage.getOptions(function (options) {
    chrome.tabs.query({}, function (tabs) {
      tabs.forEach(function (tab) {
        if (!tab.active) {
          requestTabDiscard(tab, !args.noForce, options, tempWhitelist);
        }
      });
    });
  });
}

function reloadAllTabs() {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    var curWindowId = tabs[0].windowId;
    chrome.windows.get(curWindowId, {populate: true}, function(curWindow) {
      curWindow.tabs.forEach(function (currentTab) {
        if (isDiscarded(currentTab)) {
          reloadTab(currentTab);
        }
        else {
          resetTabTimer(currentTab);
        }
      });
    });
  });
}

function reloadAllTabsInAllWindows() {
  chrome.tabs.query({}, function (tabs) {
    tabs.forEach(function (currentTab) {
      if (isDiscarded(currentTab)) { reloadTab(currentTab); }
    });
  });
}

function discardSelectedTabs() {
  chrome.tabs.query({highlighted: true, lastFocusedWindow: true}, function (selectedTabs) {
    selectedTabs.forEach(function (tab) {
      requestTabDiscard(tab, true);
    });
  });
}

function reloadSelectedTabs() {
  chrome.tabs.query({highlighted: true, lastFocusedWindow: true}, function (selectedTabs) {
    selectedTabs.forEach(function (tab) {
      if (isDiscarded(tab)) {
        reloadTab(tab);
      }
    });
  });
}

function reloadTab(tab) {
  chrome.tabs.reload(tab.id);
}

// get info for a tab. defaults to currentTab if no id passed in
// returns the current tab discard and timer states. possible discard states are:

// normal         : a tab that will be discarded
// special        : a tab that cannot be discarded
// discarded      : a tab that is discarded
// never          : discard timer set to 'never discard'
// formInput      : a tab that has a partially completed form (and IGNORE_FORMS is true)
// audible        : a tab that is playing audio (and IGNORE_AUDIO is true)
// tempWhitelist  : a tab that has been manually paused
// pinned         : a pinned tab (and IGNORE_PINNED is true)
// whitelisted    : a tab that has been whitelisted
// charging       : computer currently charging (and BATTERY_CHECK is true)
// noConnectivity : internet currently offline (and ONLINE_CHECK is true)
// unknown        : an error detecting tab status
function requestTabInfo(tab, callback) {

  var info = {
      windowId: '',
      tabId: '',
      groupId: '',
      pinned: false,
      status: 'unknown',
      timerUp: '-'
  };

  chrome.alarms.get(String(tab.id), function (alarm) {

    if (alarm && !isDiscarded(tab)) {
      info.timerUp = parseInt((alarm.scheduledTime - Date.now()) / 1000);
    }

    info.windowId = tab.windowId;
    info.tabId = tab.id;
    info.groupId = tab.groupId;
    info.pinned = tab.pinned;

    //check if it is a special tab
    if (isSpecialTab(tab)) {
      info.status = 'special';
      callback(info);

    //check if it has already been discarded
    } else if (isDiscarded(tab)) {
      info.status = 'discarded';
      tabStates.getTabState(tab.id, function (tab) {
        if (tab) {
          info.availableCapacityBefore = tab.availableCapacityBefore;
          info.availableCapacityAfter = tab.availableCapacityAfter;
        }
        callback(info);
      });

    // Check if it's been unloaded.
    } else if (tab.status === 'unloaded') {
      info.status = 'unloaded';
      callback(info);

    } else {
      processActiveTabStatus(tab, function (status) {
        info.status = status;
        callback(info);
      });
    }
  });
}

function processActiveTabStatus(tab, callback) {

  var status = 'normal';

  storage.getOptions(async function (options) {

    //check whitelist
    if (checkWhiteList(tab.url, options[storage.WHITELIST])) {
      status = 'whitelisted';

    //check temporary whitelist
    } else if (await checkTemporaryWhiteList(tab.id)) {
      status = 'tempWhitelist';

    //check pinned tab
    } else if (options[storage.IGNORE_PINNED] && tab.pinned) {
      status = 'pinned';

    //check audible tab
    } else if (options[storage.IGNORE_AUDIO] && tab.audible) {
      status = 'audible';

    //check never discard
    } else if (options[storage.DISCARD_TIME] === "0") {
      status = 'never';

    //check running on battery
    } else if (options[storage.BATTERY_CHECK] && chargingMode) {
      status = 'charging';

    //check internet connectivity
    } else if (options[storage.ONLINE_CHECK] && !navigator.onLine) {
      status = 'noConnectivity';
    }
    callback(status);
  });
}

//change the icon to either active or inactive
function updateIcon(status) {
  var icon = status !== 'normal' ? extensionPausedIcon : extensionActiveIcon;
  chrome.action.setIcon({path: icon});
}


//HANDLERS FOR MESSAGE REQUESTS

function messageRequestListener(request, sender, sendResponse) {
  // log('messageRequestListener', request);

  switch (request.action) {

  case 'requestCurrentOptions':
    storage.getOptions(function (options) {
      log('requestCurrentOptions', options);
      sendResponse(options);
    });
    break;

  case 'setOptions':
    log('setOptions', request.options);
    storage.setOptions(request.options, () => {
      sendResponse();
    });
    break;

  case 'getStorageObject':
    log('getStorageObject', storage);
    sendResponse(storage);
    break;

  case 'cleanWhitelist':
    log('cleanWhitelist')
    sendResponse({value: storage.cleanWhitelist(request.value)});
    break;

  case 'requestCurrentTabInfo':
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
      if (tabs.length > 0) {
        requestTabInfo(tabs[0], function(info) {
          log('requestCurrentTabInfo', info);
          sendResponse(info);
        });
      }
    });
    break;

  case 'requestTabInfo':
    requestTabInfo(request.tab, function(info) {
      sendResponse(info);
    });
    break;

  case 'resetTabTimers':
    chrome.tabs.query({}, function (tabs) {
      for (var tab of tabs) {
        resetTabTimer(tab);
      }
    });
    break;

  case 'updateContextMenuItems':
    buildContextMenu(request.visible, request.discards);
    break;

  case 'discardOne':
    discardHighlightedTab();
    break;

  case 'suspendOne':
    discardHighlightedTab('suspend');
    break;

  case 'tempWhitelist':
    temporarilyWhitelistHighlightedTab();
    break;

  case 'undoTempWhitelist':
    undoTemporarilyWhitelistHighlightedTab();
    break;

  case 'whitelist':
    whitelistHighlightedTab();
    break;

  case 'removeWhitelist':
    unwhitelistHighlightedTab();
    break;

  case 'discardAll':
    discardAllTabs();
    break;

  case 'discardAllEligible':
    discardAllTabs({noForce:true});
    break;

  case 'reloadAll':
    reloadAllTabs();
    break;

  case 'discardSelected':
    discardSelectedTabs();
    break;

  case 'reloadSelected':
    reloadSelectedTabs();
    break;

  case 'openOptionsTab':
    openTab('options');
    break;

  case 'openDiscardsTab':
    openTab('discards');
    break;

  case 'openProfilerTab':
    openTab('profiler');
    break;

  case 'debugReload':
    if (DEBUG) {
      chrome.runtime.reload();
    }
    break;

  default:
    console.error(`Unknown message action: ${request.action}`);
    break;
  }
  return true;
}


//HANDLERS FOR KEYBOARD SHORTCUTS

function commandListener (command) {
  log('commandListener', command);

  if (command === '1-discard-tab') {
    discardHighlightedTab();

  } else if (command === '2-suspend-tab') {
    discardHighlightedTab('suspend');

  } else if (command === '3-discard-active-window') {
    discardAllTabs();

  } else if (command === '4-reload-active-window') {
    reloadAllTabs();

  } else if (command === '5-discard-all-windows') {
    discardAllTabsInAllWindows();

  } else if (command === '6-reload-all-windows') {
    reloadAllTabsInAllWindows();
  }
}


//HANDLERS FOR RIGHT-CLICK CONTEXT MENU
function contextMenuListener(info, tab) {
  log('contextMenuListener', info);

  switch (info.menuItemId) {

    case 'discard-tab':
      discardHighlightedTab();
      break;

    case 'dont-discard-for-now':
      temporarilyWhitelistHighlightedTab();
      break;

    case 'never-discard':
      whitelistHighlightedTab();
      break;

    case 'discard-others':
      discardAllTabs();
      break;

    case 'reload-all':
      reloadAllTabs();
      break;

    case 'settings':
      openTab('options');
      break;

    case 'discards':
      openTab('discards');
      break;

    default:
      break;
  }
}


function buildContextMenu(showContextMenu, showDiscards) {

  var allContexts = ["page", "frame", "editable", "image", "video", "audio"];

  chrome.contextMenus.removeAll();

  if (showContextMenu) {

    // discard present tab
    chrome.contextMenus.create({
      id: "discard-tab",
      title: "Discard this tab",
      contexts: allContexts
    });

    // Add present tab to temporary whitelist
    chrome.contextMenus.create({
      id: "dont-discard-for-now",
      title: "Pause discarding this tab",
      contexts: allContexts
    });

    // Add present tab to permanent whitelist
    chrome.contextMenus.create({
      id: "never-discard",
      title: "Never discard this site",
      contexts: allContexts
    });

    chrome.contextMenus.create({
      id: "separator",
      contexts: allContexts,
      type: "separator"
    });

    // discard all the tabs
    chrome.contextMenus.create({
      id: "discard-others",
      title: "Discard all other tabs",
      contexts: allContexts
    });

    // restore all the tabs
    chrome.contextMenus.create({
      id: "reload-all",
      title: "Restore all discarded tabs",
      contexts: allContexts
    });

    //Open settings page
    chrome.contextMenus.create({
      id: "settings",
      title: "Settings",
      contexts: allContexts
    });

    if (showDiscards) {
      chrome.contextMenus.create({
        id: "separator2",
        contexts: allContexts,
        type: "separator"
      });

      //Open chrome Discards
      chrome.contextMenus.create({
        id: "discards",
        title: "chrome://discards/",
        contexts: allContexts
      });
    }
  }
}
