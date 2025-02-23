/* global chrome */

(function () {

  'use strict';

  function generateTabInfo(table, info, first) {
    const
      windowId = info?.windowId ?? '?',
      tabId = info?.tabId ?? '?',
      groupId = info?.groupId > 0 ? info.groupId : '',
      // @INFO Not enabling tabGroups yet since it requires a new permission in the Manifest
      // groupName = info?.group?.title ?? '',
      // groupColor = info?.group?.color ?? '',
      pinned = info?.pinned ? '<i class="fa fa-thumb-tack"></i>' : '',
      tabTitle = info?.tab.title ?? 'unknown',
      tabTimer = info?.timerUp ?? -1,
      tabStatus = info?.status ?? 'unknown';

    const row = table.insertRow();
    if (first) {
      row.className = 'newrow';
    }
    row.insertCell().innerText = windowId;
    row.insertCell().innerText = tabId;

    const group       = row.insertCell();
    // group.style.color = groupColor;
    // group.innerText   = groupName;
    group.innerText   = groupId;

    const cell        = row.insertCell();
    cell.className    = 'title';
    cell.innerText    = tabTitle;

    row.insertCell().innerText = tabTimer;
    row.insertCell().innerText = tabStatus;
    row.insertCell().innerHTML = pinned;
  }

  async function fetchInfo() {
    // chrome.tabGroups.query({}, async function(groups) {

      // const groupMap = {};
      // groups.forEach((group) => {
      //   groupMap[group.id] = group
      // });

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
        // discardInfo.group = groupMap[discardInfo.groupId];
        win.push(discardInfo);
      }

      const tableEl = document.getElementById('gsProfilerBody');
      for (const winId of Array.from(windows.keys()).sort()) {
        const infos = windows.get(winId);
        let first = true;
        for (const discardInfo of infos) {
          generateTabInfo(tableEl, discardInfo, first);
          first = false;
        }
      }
    // });
  }

  window.onload = function () {
    fetchInfo();

    //handler for refresh
    document.getElementById('refreshProfiler').onclick = function (e) {
      document.getElementById('gsProfilerBody').innerHTML = '';
      fetchInfo();
    };

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
