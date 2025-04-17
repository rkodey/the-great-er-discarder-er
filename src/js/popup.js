
(function () {

  'use strict';

  function setStatus(status) {
    var statusDetail = '',
      statusIconClass = '',
      message;

    if (status === 'normal') {
      statusDetail = 'This tab can be discarded automatically.';
      statusIconClass = 'fa fa-clock-o';

    } else if (status === 'special') {
      statusDetail = 'This tab cannot be discarded.';
      statusIconClass = 'fa fa-remove';

    } else if (status === 'whitelisted') {
      statusDetail = 'Site whitelisted. <a href="#">Remove from whitelist</a>';
      statusIconClass = 'fa fa-check';
      message = 'removeWhitelist';

    } else if (status === 'audible') {
      statusDetail = 'This tab is playing audio.';
      statusIconClass = 'fa fa-volume-up';

    } else if (status === 'pinned') {
      statusDetail = 'This tab has been pinned.';
      statusIconClass = 'fa fa-thumb-tack';

    } else if (status === 'tempWhitelist') {
      statusDetail = 'Tab discarding paused. <a href="#">Unpause</a>';
      statusIconClass = 'fa fa-pause-circle';
      message = 'undoTempWhitelist';

    } else if (status === 'never') {
      statusDetail = 'Automatic tab discarding disabled.';
      statusIconClass = 'fa fa-ban';

    } else if (status === 'noConnectivity') {
      statusDetail = 'No network connection.';
      statusIconClass = 'fa fa-pause-circle';

    } else if (status === 'charging') {
      statusDetail = 'Connected to power source.';
      statusIconClass = 'fa fa-pause-circle';
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

  function setVisibility(id, visible) {
    document.getElementById(id).style.display = visible ? 'block' : 'none';
  }

  function setVisibilityForSelectedGroup() {
    chrome.tabs.query({ highlighted: true, lastFocusedWindow: true }, function (tabs) {
      setVisibility('discardSelectedGroup', tabs && tabs.length > 1);
    });
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
        div.innerText = 'Skip ' + aExcludes.join(' and ') + ' tabs';
      }
      else {
        menu.style.display = 'none';
      }
    }
  }

  function addClickListener(idMessage) {
    document.getElementById(idMessage).addEventListener('click', function (e) {
      console.log(`click ${idMessage}`);
      chrome.runtime.sendMessage({ action: idMessage });
      window.close();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {

    addClickListener('discardOne');
    addClickListener('suspendOne');
    addClickListener('discardAll');
    addClickListener('discardAllEligible');
    addClickListener('reloadAll');
    addClickListener('discardSelected');
    addClickListener('reloadSelected');
    addClickListener('whitelist');
    addClickListener('tempWhitelist');
    addClickListener('openOptionsTab');
    addClickListener('openDiscardsTab');
    addClickListener('openProfilerTab');
    addClickListener('debugReload');

    chrome.runtime.sendMessage({ action: 'requestCurrentOptions' }, function (options) {
      setVisibility('showDiscardsLinkGroup', options.addDiscardsMenu);
      setEligibleOptions(options);
    });

    chrome.runtime.sendMessage({ action: 'requestCurrentTabInfo' }, function (info) {

      var status = info.status,
        //timeLeft = info.timerUp, // unused
        discardOneVisible = (status === 'discarded' || status === 'special' || status === 'unknown') ? false : true,
        whitelistVisible = (status !== 'whitelisted' && status !== 'special') ? true : false,
        pauseVisible = (status === 'normal') ? true : false;

      setVisibilityForSelectedGroup();
      setVisibility('currentGroup', discardOneVisible || whitelistVisible || pauseVisible);
      setVisibility('discardOne', discardOneVisible);
      setVisibility('suspendOne', discardOneVisible);  // set suspendOne visibility same as discardOne
      setVisibility('whitelist', whitelistVisible);
      setVisibility('tempWhitelist', pauseVisible);
      setVisibility('debugReload', !(chrome.runtime.getManifest().update_url));
      setStatus(status);

    });
  });
}());
