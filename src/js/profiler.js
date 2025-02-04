/* global chrome */

(function () {

  'use strict';

  function generateTabInfo(info) {
    var html = '',
      windowId = info && info.windowId ? info.windowId : '?',
      tabId = info && info.tabId ? info.tabId : '?',
      tabTitle = info && info.tab ? info.tab.title : 'unknown',
      tabTimer = info ? info.timerUp : -1,
      tabStatus = info ? info.status : 'unknown';

    html += '<tr>';
    html += '<td>' + windowId + '</td>';
    html += '<td>' + tabId + '</td>';
    html += '<td style="max-width:800px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + tabTitle + '</td>';
    html += '<td>' + tabTimer + '</td>';
    html += '<td>' + tabStatus + '</td>';
    html += '</tr>';

    return html;
  }

  function fetchInfo() {
    chrome.tabs.query({}, function (tabs) {
      tabs.forEach(function (curTab, i, tabs) {
        chrome.runtime.sendMessage({ action: 'requestTabInfo', tab: curTab }, function (discardInfo) {
          var html = '',
            tableEl = document.getElementById('gsProfilerBody');

          discardInfo.tab = curTab;

          html = generateTabInfo(discardInfo);
          tableEl.innerHTML = tableEl.innerHTML + html;
        });
      });
    });
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
