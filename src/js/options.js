/* global chrome */

'use strict';

var elementPrefMap;
var elementIdMap;
var currentOptions;
var storage;

chrome.runtime.sendMessage({ action: 'dumpStorage' }, (storage) => {
  globalThis.storage = storage;
  chrome.runtime.sendMessage({ action: 'requestCurrentOptions' }, initialize);
});


function initialize(options) {

  currentOptions = options;

  elementPrefMap = {
    'onlineCheck': storage.ONLINE_CHECK,
    'batteryCheck': storage.BATTERY_CHECK,
    'dontDiscardPinned': storage.IGNORE_PINNED,
    'dontDiscardAudio': storage.IGNORE_AUDIO,
    'timeToDiscard': storage.SUSPEND_TIME,
    'whitelist': storage.WHITELIST,
    'addContextMenu': storage.ADD_CONTEXT,
    'syncOptions': storage.SYNC_OPTIONS,
    'discardAtStartup': storage.DISCARD_STARTUP,
    'addDiscardsMenu': storage.ADD_DISCARDS
  };
  elementIdMap = invert(elementPrefMap);

  var optionEls = document.getElementsByClassName('option');
  var saveEl = document.getElementById('saveBtn');
  var cancelEl = document.getElementById('cancelBtn');
  var pref;
  var element;
  var i;

  saveEl.onclick = function () {
    saveChanges(optionEls)
      .then(() => {
        closeSettings();
      })
      .catch((e) => {
        // closeSettings();
      });
    return false;
  };

  cancelEl.onclick = function () {
    closeSettings();
    return false;
  };

  for (i = 0; i < optionEls.length; i++) {
    element = optionEls[i];

    //add change listeners for all 'option' elements
    element.onchange = handleChange(element);

    pref = elementPrefMap[element.id];
    populateOption(element, options[pref]);
  }

  setAutoDiscardOptionsVisibility(options[storage.SUSPEND_TIME] > 0);
  setSyncNoteVisibility(!options[storage.SYNC_OPTIONS]);
}

function invert(obj) {

  var new_obj = {},
    prop;

  for (prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      new_obj[obj[prop]] = prop;
    }
  }
  return new_obj;
}

function selectComboBox(element, key) {
  var i,
    child;

  for (i = 0; i < element.children.length; i += 1) {
    child = element.children[i];
    if (child.value === key) {
      child.selected = 'true';
      break;
    }
  }
}

function populateOption(element, value) {

  if (element.tagName === 'INPUT' && element.hasAttribute('type') && element.getAttribute('type') === 'checkbox') {
    element.checked = value;

  } else if (element.tagName === 'SELECT') {
    selectComboBox(element, value);

  } else if (element.tagName === 'TEXTAREA') {
    element.value = value;
  }
}

function getOptionValue(element) {
  // TODO switch statement?
  if (element.tagName === 'INPUT' && element.hasAttribute('type') && element.getAttribute('type') === 'checkbox') {
    return element.checked;
  }
  if (element.tagName === 'SELECT') {
    return element.children[element.selectedIndex].value;
  }
  if (element.tagName === 'TEXTAREA') {
    return element.value;
  }
}

function setAutoDiscardOptionsVisibility(visible) {
  Array.prototype.forEach.call(document.getElementsByClassName('autoDiscardOption'), function(el) {
    if (visible) {
      el.style.display = 'block';
    } else {
      el.style.display = 'none';
    }
  });
}

function setSyncNoteVisibility(visible) {
  if (visible) {
    document.getElementById('syncNote').style.display = 'block';
  } else {
    document.getElementById('syncNote').style.display = 'none';
  }
}

function handleChange(element) {
  return function () {
    var pref = elementPrefMap[element.id],
      interval;

    //add specific screen element listeners
    if (pref === storage.SUSPEND_TIME) {
      interval = getOptionValue(element);
      setAutoDiscardOptionsVisibility(interval > 0);

    } else if (pref === storage.SYNC_OPTIONS) {
      setSyncNoteVisibility(!getOptionValue(element));
    }
  };
}

async function saveChanges(elements) {
  // console.log(['saveChanges',elements]);
  var options = {};
  for (var i = 0; i < elements.length; i++) {

    var element = elements[i];

    var pref = elementPrefMap[element.id],
      oldValue = currentOptions[pref],
      newValue = getOptionValue(element);

    //clean up whitelist before saving
    if (pref === storage.WHITELIST) {
      newValue = (await chrome.runtime.sendMessage({ action: 'cleanupWhitelist', value: newValue })).value;
    }

    //if interval has changed then reset the tab timers
    if (pref === storage.SUSPEND_TIME && oldValue !== newValue) {
      chrome.runtime.sendMessage({ action: 'resetTabTimers' });
    }

    options[pref] = newValue;
  }

  // Update the context menu
  // console.log(['saveChanges context',options[storage.ADD_CONTEXT], options[storage.ADD_DISCARDS]]);
  chrome.runtime.sendMessage({ action: 'updateContextMenuItems', visible: options[storage.ADD_CONTEXT], discards: options[storage.ADD_DISCARDS] });

  //save option
  await chrome.runtime.sendMessage({ action: 'setOptions', options });
  // Push out all our saved settings to sync storage.
  await chrome.runtime.sendMessage({ action: 'syncOptions', options });
}

function closeSettings() {
  //only close the window if we were opened in a new tab.
  //else, go back to the page we were on.
  //this is to fix closing tabs if they were opened from the context menu.
  if (document.referrer === "") {
    window.close();
  } else {
    history.back();
  }
}
