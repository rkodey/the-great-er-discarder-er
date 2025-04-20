// @ts-check

(function () {

  'use strict';

  var readyStateCheckInterval = window.setInterval(function () {
    if (document.readyState === 'complete') {

      window.clearInterval(readyStateCheckInterval);
      const
        // optionEls   = document.getElementsByClassName('option'),
        shortcutsEl = document.getElementById('keyboardShortcuts'),
        configureEl = document.getElementById('configureShortcuts');
      let count     = 0;

      if (!shortcutsEl || !configureEl) return;

      //populate keyboard shortcuts
      chrome.commands.getAll(function (commands) {
        commands.forEach(function (command) {
          // console.log(command);
          const description = command.description || 'Activate this extension';
          const shortcut    = command.shortcut !== '' ? command.shortcut : '(not set)';
          const style       = [3,5].includes(count) ? 'margin: 15px 0 0;' : '';
          shortcutsEl.innerHTML += `<div style="${style}">${description}: &nbsp; <span class="bold">${shortcut}</span></div>`;
          count++;
        });
      });

      //listener for configureShortcuts
      configureEl.onclick = () => {
        chrome.tabs.create({url: 'chrome://extensions/configureCommands'});
        return false;
      };
    }
  }, 100);

}());
