/* global chrome */

(function () {

  'use strict';

  function setStatus(status) {
    var statusDetail = '',
      statusIconClass = '',
      message;

    if (status === 'normal') {
      statusDetail = 'Tab will be discarded automatically.';
      statusIconClass = 'fa fa-clock-o';

    } else if (status === 'special') {
      statusDetail = 'Tab cannot be discarded.';
      statusIconClass = 'fa fa-remove';

    } else if (status === 'whitelisted') {
      statusDetail = 'Site whitelisted. <a href="#">Remove from whitelist</a>';
      statusIconClass = 'fa fa-check';
      message = 'removeWhitelist';

    } else if (status === 'audible') {
      statusDetail = 'Tab is playing audio.';
      statusIconClass = 'fa fa-volume-up';

    } else if (status === 'pinned') {
      statusDetail = 'Tab has been pinned.';
      statusIconClass = 'fa fa-thumb-tack';

    } else if (status === 'tempWhitelist') {
      statusDetail = 'Tab suspension paused. <a href="#">Unpause</a>';
      statusIconClass = 'fa fa-pause';
      message = 'undoTempWhitelist';

    } else if (status === 'never') {
      statusDetail = 'Automatic tab suspension disabled.';
      statusIconClass = 'fa fa-ban';

    } else if (status === 'noConnectivity') {
      statusDetail = 'No network connection.';
      statusIconClass = 'fa fa-pause';

    } else if (status === 'charging') {
      statusDetail = 'Connected to power source.';
      statusIconClass = 'fa fa-pause';
    }

    if (document.getElementsByTagName('a')[0]) {
      document.getElementsByTagName('a')[0].removeEventListener('click');
    }

    document.getElementById('header').style.display = 'block';
    document.getElementById('statusDetail').innerHTML = statusDetail;
    document.getElementById('statusIcon').className = statusIconClass;

    if (message) {
      document.getElementsByTagName('a')[0].addEventListener('click', function (e) {
        chrome.runtime.sendMessage({ action: message });
        window.close();
      });
    }
  }

  function setWhitelistVisibility(visible) {
    if (visible) {
      document.getElementById('whitelist').style.display = 'block';
    } else {
      document.getElementById('whitelist').style.display = 'none';
    }
  }

  function setPauseVisibility(visible) {
    if (visible) {
      document.getElementById('tempWhitelist').style.display = 'block';
    } else {
      document.getElementById('tempWhitelist').style.display = 'none';
    }
  }

  function setDiscardOneVisibility(visible) {
    if (visible) {
      document.getElementById('discardOne').style.display = 'block';
    } else {
      document.getElementById('discardOne').style.display = 'none';
    }
  }

  function setDiscardSelectedVisibility() {
    chrome.tabs.query({ highlighted: true, lastFocusedWindow: true }, function (tabs) {
      if (tabs && tabs.length > 1) {
        document.getElementById('discardSelectedGroup').style.display = 'block';
      } else {
        document.getElementById('discardSelectedGroup').style.display = 'none';
      }
    });
  }

  function setShowDiscardsLinkVisibility(visible) {
    if (visible) {
      document.getElementById('showDiscardsLinkGroup').style.display = 'block';
    } else {
      document.getElementById('showDiscardsLinkGroup').style.display = 'none';
    }
  }

  function setEligibleOptions(options) {
    var menu  = document.getElementById('discardAllEligible');
    var div   = document.getElementById('eligibleText');
    if (menu && div) {
      var aExcludes = [];
      if (options.dontDiscardPinned) aExcludes.push('pinned');
      if (options.dontDiscardAudio) aExcludes.push('audio');
      if (aExcludes.length) {
        menu.style.display = 'block';
        div.innerText = 'excluding ' + aExcludes.join(' and ') + ' tabs';
      }
      else {
        menu.style.display = 'none';
      }
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('discardOne').addEventListener('click', function (e) {
      chrome.runtime.sendMessage({ action: 'discardOne' });
      window.close();
    });
    document.getElementById('discardAll').addEventListener('click', function (e) {
      chrome.runtime.sendMessage({ action: 'discardAll' });
      window.close();
    });
    document.getElementById('discardAllEligible').addEventListener('click', function (e) {
      chrome.runtime.sendMessage({ action: 'discardAllEligible' });
      window.close();
    });
    document.getElementById('reloadAll').addEventListener('click', function (e) {
      chrome.runtime.sendMessage({ action: 'reloadAll' });
      window.close();
    });
    document.getElementById('discardSelected').addEventListener('click', function (e) {
      chrome.runtime.sendMessage({ action: 'discardSelected' });
      window.close();
    });
    document.getElementById('reloadSelected').addEventListener('click', function (e) {
      chrome.runtime.sendMessage({ action: 'reloadSelected' });
      window.close();
    });
    document.getElementById('whitelist').addEventListener('click', function (e) {
      chrome.runtime.sendMessage({ action: 'whitelist' });
      window.close();
    });
    document.getElementById('tempWhitelist').addEventListener('click', function (e) {
      chrome.runtime.sendMessage({ action: 'tempWhitelist' });
      window.close();
    });
    document.getElementById('settingsLink').addEventListener('click', function (e) {
      chrome.runtime.sendMessage({ action: 'openOptionsTab' });
      window.close();
    });
    document.getElementById('discardsLink').addEventListener('click', function (e) {
      chrome.runtime.sendMessage({ action: 'openDiscardsTab' });
      window.close();
    });
    document.getElementById('profilerLink').addEventListener('click', function (e) {
      console.log('profiler');
      chrome.runtime.sendMessage({ action: 'openProfilerTab' });
      window.close();
    });

    chrome.runtime.sendMessage({ action: 'requestCurrentOptions' }, function (options) {
      setShowDiscardsLinkVisibility(options.addDiscardsMenu);
      setEligibleOptions(options);
    });

    chrome.runtime.sendMessage({ action: 'requestCurrentTabInfo' }, function (info) {

      var status = info.status,
        //timeLeft = info.timerUp, // unused
        discardOneVisible = (status === 'discarded' || status === 'special' || status === 'unknown') ? false : true,
        whitelistVisible = (status !== 'whitelisted' && status !== 'special') ? true : false,
        pauseVisible = (status === 'normal') ? true : false;

      setDiscardSelectedVisibility();
      setDiscardOneVisibility(discardOneVisible);
      setWhitelistVisibility(whitelistVisible);
      setPauseVisibility(pauseVisible);
      setStatus(status);

    });
  });
}());
