
(function () {

  'use strict';

  var readyStateCheckInterval = window.setInterval(function () {
    if (document.readyState === 'complete') {

      window.clearInterval(readyStateCheckInterval);

      var versionEl = document.getElementById('aboutVersion');
      versionEl.innerHTML = 'The Great-<span class="italic">er</span> Tab Discarder v' + chrome.runtime.getManifest().version;

    }
  }, 50);

}());
