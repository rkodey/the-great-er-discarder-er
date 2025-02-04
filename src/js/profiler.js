/* global chrome */

(function () {

  'use strict';

  function generateTabInfo(info, first) {
    var html = '',
      windowId = info && info.windowId ? info.windowId : '?',
      tabId = info && info.tabId ? info.tabId : '?',
      tabTitle = info && info.tab ? info.tab.title : 'unknown',
      tabTimer = info ? info.timerUp : -1,
      tabStatus = info ? info.status : 'unknown';

    if (first) {
      html += '<tr class="newrow">';
    } else {
      html += '<tr>';
    }
    html += '<td>' + windowId + '</td>';
    html += '<td>' + tabId + '</td>';
    html += '<td style="max-width:800px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + tabTitle + '</td>';
    html += '<td>' + tabTimer + '</td>';
    html += '<td>' + tabStatus + '</td>';
    html += '</tr>';

    return html;
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
        const html = generateTabInfo(discardInfo, first);
        tableEl.innerHTML += html;
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
