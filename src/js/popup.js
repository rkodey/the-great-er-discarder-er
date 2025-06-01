// @ts-check

(function () {

  'use strict';

  /**
   * @param {string} status
   * @param {string} modeLabel
   */
  function setStatus(status, modeLabel) {
    var statusDetail = '',
      statusIconClass = '',
      message;

    if (status === 'normal') {
      statusDetail = `This tab can be ${modeLabel}ed automatically.`;
      statusIconClass = 'fa fa-clock-o';

    } else if (status === 'special') {
      statusDetail = `This tab cannot be ${modeLabel}ed.`;
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
      statusDetail = `Tab ${modeLabel}ing paused. <a href="#">Unpause</a>`;
      statusIconClass = 'fa fa-pause-circle';
      message = 'undoTempWhitelist';

    } else if (status === 'never') {
      statusDetail = `Automatic ${modeLabel}ing is disabled.`;
      statusIconClass = 'fa fa-ban';

    } else if (status === 'noConnectivity') {
      statusDetail = 'No network connection.';
      statusIconClass = 'fa fa-pause-circle';

    } else if (status === 'charging') {
      statusDetail = 'Connected to power source.';
      statusIconClass = 'fa fa-pause-circle';
    }


    setVisibility('header', true);
    const detailElem = document.getElementById('statusDetail');
    if (detailElem) {
      detailElem.innerHTML = statusDetail;
    }
    const iconElem = document.getElementById('statusIcon');
    if (iconElem) {
      iconElem.className = statusIconClass;
    }


    const linkElem = document.getElementsByTagName('a')[0];
    if (message) {
      linkElem.onclick = () => {
        chrome.runtime.sendMessage({ action: message });
        window.close();
      };
    }
  }

  /**
   * @param {string} id
   * @param {string} str
   */
  function setInnerHTML(id, str) {
    const elem = document.getElementById(id);
    if (elem) {
      elem.innerHTML = str;
    }
  }
  /**
   * @param {string} id
   * @param {boolean} visible
   */
  function setVisibility(id, visible) {
    const elem = document.getElementById(id);
    if (elem) {
      elem.style.display = visible ? 'block' : 'none';
    }
  }

  function setVisibilityForSelectedGroup() {
    chrome.tabs.query({ highlighted: true, lastFocusedWindow: true }, function (tabs) {
      setVisibility('discardSelectedGroup', tabs && tabs.length > 1);
    });
  }

  /**
   * @param {object} options
   */
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

  /**
   * @param {boolean} value
   */
  function setModeLabels(value) {
    // console.log('setModeLabels');
    document.querySelectorAll('span.modeLabel').forEach((element) => {
      element.innerHTML = value ? 'Suspend' : 'Discard';
    });
  }

  /**
   * @param {string} idMessage
   */
  function addClickListener(idMessage) {
    document.getElementById(idMessage)?.addEventListener('click', function (e) {
      // console.log(`click ${idMessage}`);
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
    addClickListener('suspendSelected');
    addClickListener('reloadSelected');
    addClickListener('whitelist');
    addClickListener('tempWhitelist');
    addClickListener('openOptionsTab');
    addClickListener('openDiscardsTab');
    addClickListener('openProfilerTab');
    addClickListener('debugReload');

    chrome.runtime.sendMessage({ action: 'requestCurrentTabInfo' }, function (info) {
      // console.log('requestCurrentTabInfo', info);

      chrome.runtime.sendMessage({ action: 'requestCurrentOptions' }, function (options) {
        // console.log('requestCurrentOptions', options);
        setModeLabels(options.suspendMode);
        setVisibility('showDiscardsLinkGroup', options.addDiscardsMenu);
        setEligibleOptions(options);

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
        setStatus(status, options.suspendMode ? 'Suspend' : 'Discard');

        chrome.commands.getAll(function (commands) {
          console.log('commands', commands);
          for (const command of commands) {
            if (command.shortcut && command.name === '1-discard-tab') {
              setInnerHTML('discardShortcut', command.shortcut);
            }
            if (command.shortcut && command.name === '2-suspend-tab') {
              setInnerHTML('suspendShortcut', command.shortcut);
            }
          }
        });

        setTimeout(() => {
          chrome.runtime.sendMessage({ action: 'requestDiscardStats' }, function (stats) {
            // console.log('requestDiscardStats', stats);
            const out = [];
            if (stats.discarded) out.push(`${stats.discarded} discarded`);
            if (stats.suspended) out.push(`${stats.suspended} suspended`);
            if (out.length) {
              setInnerHTML('discardStats', ` &nbsp; ( ${out.join(', ')} )`);
            }
          });
        }, 200);

      });

    });
  });

}());
