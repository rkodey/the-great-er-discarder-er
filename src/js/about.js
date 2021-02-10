/*global chrome */

var NO_NAG = 'noNag';

(function () {

  'use strict';

  var readyStateCheckInterval = window.setInterval(function () {
    if (document.readyState === 'complete') {

      window.clearInterval(readyStateCheckInterval);

      var versionEl = document.getElementById('aboutVersion');
      versionEl.innerHTML = 'The Great-er Discarder-er v' + chrome.runtime.getManifest().version;

      var noNag = localStorage.getItem(NO_NAG) === 'true';
      if (noNag) {
        document.getElementById('donateSection').style.display = 'none';
        document.getElementById('donatedSection').style.display = 'block';
      }

      var donateBtns = document.getElementsByClassName('btnDonate'),
        i;

      for (i = 0; i < donateBtns.length; i++) {
        donateBtns[i].onclick = function() {
          toggleNag(true);
        };
      }
      document.getElementById('alreadyDonatedToggle').onclick = function() {
        toggleNag(true);
        window.location.reload();
      };
      document.getElementById('donateAgainToggle').onclick = function() {
        toggleNag(false);
        window.location.reload();
      };

      function toggleNag(hideNag) {
        localStorage.setItem(NO_NAG, hideNag);
      }
    }
  }, 50);

}());
