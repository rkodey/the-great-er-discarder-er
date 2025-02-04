/* global chrome */

(function () {

  'use strict';

  function generateTabInfo(table, info, first) {
    const
      windowId = info?.windowId ?? '?',
      tabId = info?.tabId ?? '?',
      tabTitle = info?.tab.title ?? 'unknown',
      tabTimer = info?.timerUp ?? -1,
      tabStatus = info?.status ?? 'unknown';

    const row = table.insertRow();
    let cell;
    if (first) {
      row.className = 'newrow';
    }
    row.insertCell().innerText = windowId;
    row.insertCell().innerText = tabId;
    cell = row.insertCell();
    cell.className = 'title';
    cell.innerText = tabTitle;
    row.insertCell().innerText = tabTimer;
    row.insertCell().innerText = tabStatus;
  }

  async function fetchInfo() {
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
