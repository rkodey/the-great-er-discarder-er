
(function () {

  'use strict';

  const browser   = navigator.userAgent.match(/Chrome\/.*Edg\//i) ? 'edge' : 'chrome';

  function generateTabInfo(table, info, first) {

    const
      windowId    = info?.windowId      ?? '?',
      tabId       = info?.tabId         ?? '?',
      groupId     = info?.groupId > 0   ? info?.groupId : '',
      groupName   = info?.group?.title,
      groupColor  = info?.group?.color  ?? '',
      pinned      = info?.pinned        ? '<i class="fa fa-thumb-tack"></i>' : '',
      tabTitle    = info?.tab.title     ?? 'unknown',
      tabStatus   = info?.status        ?? 'unknown',
      tabTimer    = info?.timerUp       ?? '';

    // console.log('5 tab info', groupId, groupName, groupColor);

    const row = table.insertRow();
    if (first) {
      row.className = 'newrow';
    }
    row.insertCell().innerText = windowId;
    row.insertCell().innerText = tabId;

    const group       = row.insertCell();
    group.className   = 'center';
    group.innerHTML   = groupName ? `<span class="group ${browser} ${groupColor}">${groupName}</span>` : groupId;

    const title       = row.insertCell();
    title.className   = 'title';
    title.innerText   = tabTitle;

    const timer       = row.insertCell();
    timer.className   = 'center';
    timer.innerText   = tabTimer;

    row.insertCell().innerText = tabStatus;
    row.insertCell().innerHTML = pinned;
  }

  async function generateRows(groupMap) {
    // console.log('4 main loop', groupMap);
    const windows = new Map();
    const tabs = await chrome.tabs.query({});
    for (let i = 0; i < tabs.length; ++i) {
      const curTab = tabs[i];
      if (!windows.has(curTab.windowId)) {
        windows.set(curTab.windowId, []);
      }
      const win = windows.get(curTab.windowId);

      const discardInfo = await chrome.runtime.sendMessage({ action: 'requestTabInfo', tab: curTab });
      discardInfo.tab = curTab;
      if (groupMap) {
        discardInfo.group = groupMap[discardInfo.groupId];
      }
      win.push(discardInfo);
    }

    const tableEl = document.getElementById('gsProfilerBody');
    tableEl.innerHTML = '';

    for (const winId of Array.from(windows.keys()).sort()) {
      const infos = windows.get(winId);
      let first = true;
      for (const discardInfo of infos) {
        generateTabInfo(tableEl, discardInfo, first);
        first = false;
      }
    }
  }

  function generateTable() {

    // console.log('1 perms');
    chrome.permissions.contains({ permissions: ['tabGroups'] }, async (fShopGroups) => {

      if (fShopGroups) {

        document.getElementById('enableTabGroups').style.display = 'none';
        // console.log('2 tabGroups', chrome.tabGroups);
        const groupMap = {};
        chrome.tabGroups?.query({}, function(groups) {
          groups.forEach((group) => {
            groupMap[group.id] = group;
          });
          generateRows(groupMap);
        });
        // console.log('3 tabGroups', chrome.tabGroups);

      }
      else {
        generateRows();
      }

    });
  }


  window.onload = function () {

    document.getElementById('refreshProfiler').onclick = function (e) {
      generateTable();
    };

    document.getElementById('enableTabGroups').onclick = function (e) {
      chrome.permissions.request({ permissions: ['tabGroups'] }, (fAccepted) => {
        generateTable();
      });
    };

    generateTable();

    /*
    chrome.processes.onUpdatedWithMemory.addListener(function (processes) {
      chrome.tabs.query({}, function (tabs) {
        var html = '';
        html += generateMemStats(processes);
        html += '<br />';
        html += generateTabStats(tabs);
        document.getElementById('gsProfiler').innerHTML = html;
      });
    });
    */
  };
}());
