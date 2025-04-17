// @ts-check

(function () {

  'use strict';

  let elementPrefMap;
  let currentOptions;
  let storage;

  chrome.runtime.sendMessage({ action: 'getStorageObject' }, (storObj) => {
    // globalThis.storage = storObj;
    storage = storObj;
    // console.log('options getStorageObject', storObj);
    chrome.runtime.sendMessage({ action: 'requestCurrentOptions' }, initialize);
  });


  /**
   * @param {object} options
   */
  function initialize(options) {

    // console.log('options initialize', storage, options);
    currentOptions = options;

    elementPrefMap = {
      'onlineCheck'       : storage.ONLINE_CHECK,
      'batteryCheck'      : storage.BATTERY_CHECK,
      'dontDiscardPinned' : storage.IGNORE_PINNED,
      'dontDiscardAudio'  : storage.IGNORE_AUDIO,
      'timeToDiscard'     : storage.DISCARD_TIME,
      'whitelist'         : storage.WHITELIST,
      'addContextMenu'    : storage.ADD_CONTEXT,
      'syncOptions'       : storage.SYNC_OPTIONS,
      'discardAtStartup'  : storage.DISCARD_STARTUP,
      'suspendMode'       : storage.SUSPEND_MODE,
      'addDiscardsMenu'   : storage.ADD_DISCARDS
    };
    // const elementIdMap = invert(elementPrefMap);

    const optionEls = document.getElementsByClassName('option');
    const saveEl    = document.getElementById('saveBtn');
    const cancelEl  = document.getElementById('cancelBtn');
    var pref;
    var element;
    var i;

    if (!optionEls || !saveEl || !cancelEl) return;

    setModeLabels();

    saveEl.onclick = () => {
      saveChanges(optionEls)
        .then(() => {
          closeSettings();
        })
        .catch((e) => {
          // closeSettings();
        });
      return false;
    };

    cancelEl.onclick = () => {
      closeSettings();
      return false;
    };

    for (i = 0; i < optionEls.length; i++) {
      element = optionEls[i];
      // console.log('initialize', element);
      if (element instanceof HTMLElement) {
        //add change listeners for all 'option' elements
        element.onchange = handleChange(element);

        pref = elementPrefMap[element.id];
        populateOption(element, options[pref]);
      }
    }

    setAutoDiscardOptionsVisibility(options[storage.DISCARD_TIME] > 0);
    setSyncNoteVisibility(!options[storage.SYNC_OPTIONS]);
  }

  // function invert(obj) {
  //   var new_obj = {},
  //     prop;
  //   for (prop in obj) {
  //     if (obj.hasOwnProperty(prop)) {
  //       new_obj[obj[prop]] = prop;
  //     }
  //   }
  //   return new_obj;
  // }

  // function selectComboBox(element, key) {
  //   var i, child;
  //   for (i = 0; i < element.children.length; i += 1) {
  //     child = element.children[i];
  //     if (child.value === key) {
  //       child.selected = 'true';
  //       break;
  //     }
  //   }
  // }

  /**
   * @param {boolean} [value]
   */
  function setModeLabels(value) {
    // console.log('setModeLabels', currentOptions);
    document.querySelectorAll('span.modeLabel').forEach((element) => {
      const current = value === undefined ? currentOptions[storage.SUSPEND_MODE] : value;
      element.innerHTML = current ? 'Suspend' : 'Discard';
    });
  }

  /**
   * @param {Element} element
   */
  function populateOption(element, value) {

    if (element instanceof HTMLInputElement) {
      element.checked = value;

    }
    else if (element instanceof HTMLSelectElement) {
      element.value = value;

    }
    else if (element instanceof HTMLTextAreaElement) {
      element.value = value;
    }
  }

  /**
   * @param {Element} element
   */
  function getOptionValue(element) {
    // TODO switch statement?
    if (element instanceof HTMLInputElement) {
      return element.checked;
    }
    else if (element instanceof HTMLSelectElement) {
      return element.value;
    }
    else if (element instanceof HTMLTextAreaElement) {
      return element.value;
    }
  }

  /**
   * @param {boolean} visible
   */
  function setAutoDiscardOptionsVisibility(visible) {
    Array.prototype.forEach.call(document.getElementsByClassName('autoDiscardOption'), (el) => {
      el.style.display = visible ? 'block' : 'none';
    });
  }

  /**
   * @param {boolean} visible
   */
  function setSyncNoteVisibility(visible) {
    const syncNote = document.getElementById('syncNote');
    if (syncNote) {
      syncNote.style.display = visible ? 'block' : 'none';
    }
  }

  function handleChange(element) {
    return () => {
      var pref = elementPrefMap[element.id],
        interval;

      //add specific screen element listeners
      if (pref === storage.DISCARD_TIME) {
        interval = element.value; // element is a select
        setAutoDiscardOptionsVisibility(interval > 0);

      }
      else if (pref === storage.SYNC_OPTIONS) {
        setSyncNoteVisibility(!getOptionValue(element));
      }
      else if (pref === storage.SUSPEND_MODE) {
        setModeLabels(element.checked);
      }
    };
  }

  /**
   * @param {HTMLCollectionOf<Element>} elements
   */
  async function saveChanges(elements) {
    // console.log(['saveChanges',elements]);
    var options = {};
    for (var i = 0; i < elements.length; i++) {

      var element = elements[i];

      var pref = elementPrefMap[element.id],
        oldValue = currentOptions[pref],
        newValue = getOptionValue(element);
      // console.log('saveChanges', element.id, pref, newValue);

      //clean up whitelist before saving
      if (pref === storage.WHITELIST) {
        newValue = (await chrome.runtime.sendMessage({ action: 'cleanWhitelist', value: newValue })).value;
      }

      //if interval has changed then reset the tab timers
      if (pref === storage.DISCARD_TIME && oldValue !== newValue) {
        chrome.runtime.sendMessage({ action: 'resetTabTimers' });
      }

      options[pref] = newValue;
    }

    // Update the context menu
    chrome.runtime.sendMessage({ action: 'updateContextMenuItems', visible: options[storage.ADD_CONTEXT], discards: options[storage.ADD_DISCARDS] });

    await chrome.runtime.sendMessage({ action: 'setOptions', options });
    // sync options are now saved within setOptions
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

}());
