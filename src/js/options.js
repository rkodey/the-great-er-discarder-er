// @ts-check

(function () {

  'use strict';

  let currentOptions;
  let storage;


  /**
   * @param {object} optionsObj
   * @param {object} storageObj
   */
  function initialize(optionsObj, storageObj) {
    // console.log('options initialize', storage, options);

    currentOptions        = optionsObj;
    storage               = storageObj

    for (const element of document.getElementsByClassName('option')) {
      // console.log('initialize', element);
      if (element instanceof HTMLElement) {
        //add change listeners for all 'option' elements
        element.onchange = handleChange(element);
        populateOption(element, optionsObj[element.id]);
      }
    }

    setAutoDiscardOptionsVisibility(optionsObj[storage.DISCARD_TIME] > 0);
    setSyncNoteVisibility(!optionsObj[storage.SYNC_OPTIONS]);
  }

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
   * @param {any}         value
   */
  function populateOption(element, value) {
    // console.log('populateOption', element, value);

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
    // console.log('getOptionValue', element);

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

  /**
   * @param {Element} element
   */
  function handleChange(element) {
    return () => {

      const value = getOptionValue(element);
      if (element.id === storage.DISCARD_TIME) {
        setAutoDiscardOptionsVisibility(Boolean(value));
      }
      else if (element.id === storage.SYNC_OPTIONS) {
        setSyncNoteVisibility(!value);
      }
      else if (element.id === storage.SUSPEND_MODE) {
        setModeLabels(Boolean(value));
      }

      saveChanges(document.getElementsByClassName('option'));

    };
  }

  /**
   * @param {HTMLCollectionOf<Element>} elements
   */
  async function saveChanges(elements) {
    // console.log(['saveChanges',elements]);
    var options = {};
    for (const element of elements) {

      const oldValue = currentOptions[element.id];
      let   newValue = getOptionValue(element);
      // console.log('saveChanges', element.id, pref, newValue);

      //clean up whitelist before saving
      if (element.id === storage.WHITELIST) {
        newValue = (await chrome.runtime.sendMessage({ action: 'cleanWhitelist', value: newValue })).value;
      }

      //if interval has changed then reset the tab timers
      if (element.id === storage.DISCARD_TIME && oldValue !== newValue) {
        chrome.runtime.sendMessage({ action: 'resetTabTimers' });
      }

      options[element.id] = newValue;
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


  chrome.runtime.sendMessage({ action: 'getStorageObject' }, (storObj) => {
    chrome.runtime.sendMessage({ action: 'requestCurrentOptions' }, (optionsObj) => {
      initialize(optionsObj, storObj);
    });
  });

}());
