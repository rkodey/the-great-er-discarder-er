/* global chrome, storage, ga, tabStates */
/*
 * The Great Discarder
 * Copyright (C) 2017 Dean Oemcke
 * Available under GNU GENERAL PUBLIC LICENSE v2
 * http://github.com/deanoemcke/thegreatdiscarder
 * ༼ つ ◕_◕ ༽つ
*/

'use strict';

const CURRENT_TAB_ID = 'currentTabId';
const PREVIOUS_TAB_ID = 'previousTabId';
const TEMPORARY_WHITELIST = 'temporaryWhitelist';

const suspensionActiveIcon = '/img/icon19.png';
const suspensionPausedIcon = '/img/icon19b.png';
const debug = true;


//initialise global state vars
var chargingMode = false;

// chrome.alarms.getAll(function (alarms) {
//   console.log(alarms);
//     chrome.alarms.clearAll(function () {
//   });
// });

chrome.runtime.onInstalled.addListener(function() {

  storage.getOptions(function (options) {
    if (options[storage.ADD_CONTEXT]) {
      buildContextMenu(true);
    }
  });
});

//reset tabStates on extension load
chrome.runtime.onStartup.addListener(function () {
  if (debug) { console.log('Extension started.'); }

  // Standard Google Universal Analytics code
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
  ga('create', 'UA-89460956-1', 'auto');
  ga('set', 'checkProtocolTask', function(){});
  ga('require', 'displayfeatures');
  ga('send', 'pageview', '/eventPage.html');

  chrome.alarms.clearAll(function () {
    localStorage.setItem(TEMPORARY_WHITELIST, []);
    tabStates.clearTabStates(function () {
      chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        if (tabs.length > 0) {
          localStorage.setItem(CURRENT_TAB_ID, tabs[0].id);
        }
      });
    });
  });

  storage.getOptions(function (options) {
    // If user has requested Discard at Startup, then discardAllTabs without the forced update.  This allows isExcluded() tabs to survive.
    if (options[storage.DISCARD_STARTUP]) { discardAllTabs({noForce:true}); }
  });

});

//listen for alarms
chrome.alarms.onAlarm.addListener(function (alarm) {
  console.log('alarm fired:', alarm);
  chrome.tabs.get(parseInt(alarm.name), function (tab) {
    if (chrome.runtime.lastError) {
      if (debug) { console.log(chrome.runtime.lastError.message); }
    }
    else {
      requestTabSuspension(tab);
    }
  });
});

//listen for changes to battery state
if (navigator.getBattery) {
  navigator.getBattery().then(function(battery) {

    chargingMode = battery.charging;
    battery.onchargingchange = function () {
      chargingMode = battery.charging;
      if (debug) { console.log('Battery state updated', chargingMode); }
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

  if (debug) { console.log('Tab updated: ' + tabId + '. Status: ' + changeInfo.status); }

  tabStates.getTabState(tabId, function (previousTabState) {
    chrome.alarms.get(String(tab.id), function (alarm) {

      if (debug) { console.log('previousTabState',previousTabState); }

      if (!alarm && changeInfo.status === 'complete') {
        resetTabTimer(tab);
      }

      //check for tab playing audio
      else if (!tab.audible && previousTabState && previousTabState.audible) {
        if (debug) { console.log('tab finished playing audio. restarting timer: ' + tab.id); }
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


//listen for focus changes
chrome.windows.onFocusChanged.addListener(function (windowId) {
  if (debug) {
    console.log('window changed: ' + windowId);
  }
});
chrome.tabs.onActivated.addListener(function (activeInfo) {

  console.log(activeInfo);
  var tabId = activeInfo.tabId;
  var windowId = activeInfo.windowId;
  var lastTabId = localStorage.getItem(CURRENT_TAB_ID);

  if (debug) {
    console.log('tab changed: ' + tabId);
  }

  // clear timer on current tab
  clearTabTimer(tabId);

  // reset timer on tab that lost focus
  if (lastTabId) {
    chrome.tabs.get(parseInt(lastTabId), function (lastTab) {
      if (chrome.runtime.lastError) {
        console.log(chrome.runtime.lastError.message);
      }
      else {
        resetTabTimer(lastTab);
      }
    });
  }
  localStorage.setItem(CURRENT_TAB_ID, tabId);
  localStorage.setItem(PREVIOUS_TAB_ID, lastTabId);
});


function isDiscarded(tab) {
  return tab.discarded;
}

//tests for non-standard web pages. does not check for discarded pages!
function isSpecialTab(tab) {
  var url = tab.url;

  if (url.indexOf('chrome-extension:') === 0 ||
      url.indexOf('chrome:') === 0 ||
      url.indexOf('chrome-devtools:') === 0 ||
      url.indexOf('file:') === 0 ||
      url.indexOf('chrome.google.com/webstore') >= 0) {
    return true;
  }
  return false;
}

function isExcluded(tab, options) {

  //check whitelist
  if (checkWhiteList(tab.url, options[storage.WHITELIST])) {
    return true;
  }
  else if (checkTemporaryWhiteList(tab.id)) {
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

function getTemporaryWhitelist() {
  var tempWhitelist = localStorage.getItem(TEMPORARY_WHITELIST);
  return tempWhitelist ? tempWhitelist.split(',') : [];
}

function checkTemporaryWhiteList(tabId) {

  var tempWhitelist = getTemporaryWhitelist();
  return tempWhitelist.some(function (element, index, array) {
    return element === String(tabId);
  });
}

function checkWhiteList(url, whitelist) {

  var whitelistItems = whitelist ? whitelist.split(/[\s\n]+/) : [],
    whitelisted;

  whitelisted = whitelistItems.some(function (item) {
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

function requestTabSuspension(tab, force) {
  force = force || false;

  //safety check
  if (typeof(tab) === 'undefined') { return; }

  //make sure tab is not special or already discarded
  if (isDiscarded(tab) || isSpecialTab(tab)) { return; }

  //if forcing tab discard then skip other checks
  if (force) {
    discardTab(tab);

  //otherwise perform soft checks before discarding
  } else {

    storage.getOptions(function (options) {

      if (!isExcluded(tab, options) &&
          !(options[storage.ONLINE_CHECK] && !navigator.onLine) &&
          !(options[storage.BATTERY_CHECK] && chargingMode)) {
        discardTab(tab);
      }
    });
  }
}

function clearTabTimer(tabId) {
  chrome.alarms.clear(String(tabId));
}

function resetTabTimer(tab) {

  storage.getOption(storage.SUSPEND_TIME, function (suspendTime) {

    if (suspendTime === '0') {
      if (debug) { console.log('Clearing timer for tab: ' + tab.id); }
      clearTabTimer(tab.id);
    }
    else if (!isDiscarded(tab) && !tab.active && !isSpecialTab(tab)) {
      if (debug) { console.log('Resetting timer for tab: ' + tab.id); }
      var dateToSuspend = parseInt(Date.now() + (parseFloat(suspendTime) * 1000 * 60));
      chrome.alarms.create(String(tab.id), {when:  dateToSuspend});
    }
    else {
      if (debug) { console.log("Skipping tab timer reset: ",tab); }
    }
  });
}

function discardTab(tab) {

  chrome.tabs.discard(tab.id, function (discardedTab) {

    if (chrome.runtime.lastError) {
      console.log(chrome.runtime.lastError.message);
    }
  });
}

function whitelistHighlightedTab() {
  chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
    if (tabs.length > 0) {

      var rootUrlStr = tabs[0].url;
      if (rootUrlStr.indexOf('//') > 0) {
          rootUrlStr = rootUrlStr.substring(rootUrlStr.indexOf('//') + 2);
      }
      rootUrlStr = rootUrlStr.substring(0, rootUrlStr.indexOf('/'));
      storage.saveToWhitelist(rootUrlStr, function () {
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

  chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
    if (tabs.length > 0) {
      var tempWhitelist = getTemporaryWhitelist();
      tempWhitelist.push(tabs[0].id);
      localStorage.setItem(TEMPORARY_WHITELIST, tempWhitelist);
    }
  });
}

function undoTemporarilyWhitelistHighlightedTab() {
  chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
    if (tabs.length > 0) {
      var tempWhitelist = getTemporaryWhitelist(),
        i;
      for (i = tempWhitelist.length - 1; i >= 0; i--) {
        if (tempWhitelist[i] === String(tabs[0].id)) {
          tempWhitelist.splice(i, 1);
        }
      }
      localStorage.setItem(TEMPORARY_WHITELIST, tempWhitelist);
    }
  });
}

function discardHighlightedTab() {
  chrome.tabs.query({active: true, currentWindow: true, discarded: false}, function (tabs) {
    if (tabs.length > 0) {
      var tabToDiscard = tabs[0];
      var previousTabId = parseInt(localStorage.getItem(PREVIOUS_TAB_ID));
      chrome.tabs.get(previousTabId, function (prevTab) {
          if (prevTab) {
              chrome.tabs.update(previousTabId, { active: true, highlighted: true }, function (tab) {
                  discardTab(tabToDiscard, true);
              });
          }
          else {
              chrome.tabs.create({}, function (tab) {
                  discardTab(tabToDiscard, true);
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

function discardAllTabs(args) {
  args      = args || {};
  var force = !args.noForce;
  if (debug) { console.log("discardAllTabs", force); }
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    var curWindowId = tabs[0].windowId;
    chrome.windows.get(curWindowId, {populate: true}, function(curWindow) {
      curWindow.tabs.forEach(function (tab) {
        if (!tab.active) {
          // There's a good argument that requestTabSuspension should NEVER be forced, and should always obey user options
          // But for now, only Discard at Startup will use non-froced discards
          requestTabSuspension(tab, force);
        }
      });
    });
  });
}


function discardAllTabsInAllWindows() {
  chrome.tabs.query({}, function (tabs) {
    tabs.forEach(function (currentTab) {
      requestTabSuspension(currentTab, true);
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
      requestTabSuspension(tab, true);
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

//get info for a tab. defaults to currentTab if no id passed in
//returns the current tab suspension and timer states. possible suspension states are:

//normal: a tab that will be discarded
//special: a tab that cannot be discarded
//discarded: a tab that is discarded
//never: suspension timer set to 'never discard'
//formInput: a tab that has a partially completed form (and IGNORE_FORMS is true)
//audible: a tab that is playing audio (and IGNORE_AUDIO is true)
//tempWhitelist: a tab that has been manually paused
//pinned: a pinned tab (and IGNORE_PINNED is true)
//whitelisted: a tab that has been whitelisted
//charging: computer currently charging (and BATTERY_CHECK is true)
//noConnectivity: internet currently offline (and ONLINE_CHECK is true)
//unknown: an error detecting tab status
function requestTabInfo(tab, callback) {

  var info = {
      windowId: '',
      tabId: '',
      status: 'unknown',
      timerUp: '-'
  };

  chrome.alarms.get(String(tab.id), function (alarm) {

    if (alarm && !isDiscarded(tab)) {
      info.timerUp = parseInt((alarm.scheduledTime - Date.now()) / 1000);
    }

    info.windowId = tab.windowId;
    info.tabId = tab.id;

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

  storage.getOptions(function (options) {

    //check whitelist
    if (checkWhiteList(tab.url, options[storage.WHITELIST])) {
      status = 'whitelisted';

    //check temporary whitelist
    } else if (checkTemporaryWhiteList(tab.id)) {
      status = 'tempWhitelist';

    //check pinned tab
    } else if (options[storage.IGNORE_PINNED] && tab.pinned) {
      status = 'pinned';

    //check audible tab
    } else if (options[storage.IGNORE_AUDIO] && tab.audible) {
      status = 'audible';

    //check never discard
    } else if (options[storage.SUSPEND_TIME] === "0") {
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
  var icon = status !== 'normal' ? suspensionPausedIcon : suspensionActiveIcon;
  chrome.browserAction.setIcon({path: icon});
}


//HANDLERS FOR MESSAGE REQUESTS

function messageRequestListener(request, sender, sendResponse) {
  if (debug) {
    console.log('listener fired:', request.action);
  }

  switch (request.action) {

  case 'requestCurrentTabInfo':
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
      if (tabs.length > 0) {
        requestTabInfo(tabs[0], function(info) {
          console.log('tab info', info);
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
    buildContextMenu(request.visible);
    break;

  case 'discardOne':
    discardHighlightedTab();
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

  case 'reloadAll':
    reloadAllTabs();
    break;

  case 'discardSelected':
    discardSelectedTabs();
    break;

  case 'reloadSelected':
    reloadSelectedTabs();
    break;

  default:
    break;
  }
  return true;
}


//HANDLERS FOR KEYBOARD SHORTCUTS

function commandListener (command) {
  if (command === '1-discard-tab') {
    discardHighlightedTab();

  } else if (command === '2-reload-tab') {
    reloadHighlightedTab();

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

  switch (info.menuItemId) {

    case 'discard-tab':
      discardHighlightedTab();
      break;

    case 'dont-suspend-for-now':
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
      chrome.tabs.create({
        url: chrome.extension.getURL('html/options.html')
      });
      break;

    default:
      break;
  }
}


function buildContextMenu(showContextMenu) {

  var allContexts = ["page", "frame", "editable", "image", "video", "audio"];

  chrome.contextMenus.removeAll();

  if (showContextMenu) {

    //Open tab discarded
    // chrome.contextMenus.create({
    //   id: "open-in-new-discarded-tab",
    //   title: "Open link in new discarded tab",
    //   contexts:["link"],
    //   onclick: function (info, tab) {
    //     openLinkInDiscardedTab(tab, info.linkUrl);
    //   }
    // });

    //Suspend present tab
    chrome.contextMenus.create({
      id: "discard-tab",
      title: "Discard tab",
      contexts: allContexts
    });

    //Add present tab to temporary whitelist
    chrome.contextMenus.create({
      id: "dont-suspend-for-now",
      title: "Don't discard for now",
      contexts: allContexts
    });

    //Add present tab to permenant whitelist
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

    //Suspend all the tabs
    chrome.contextMenus.create({
      id: "discard-others",
      title: "Discard other tabs",
      contexts: allContexts
    });

    //Unsuspend all the tabs
    chrome.contextMenus.create({
      id: "reload-all",
      title: "Reload all tabs",
      contexts: allContexts
    });

    //Open settings page
    chrome.contextMenus.create({
      id: "settings",
      title: "Settings",
      contexts: allContexts
    });
  }
}
