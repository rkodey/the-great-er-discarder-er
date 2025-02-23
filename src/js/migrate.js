
(function () {

  'use strict';

  function plural(n) {
    return n == 1 ? '' : 's';
  }

  function setButton(elem, name, length) {
    elem.innerHTML = `${name} ${length} tab${plural(length)}`;
  }

  function updatePage() {
    // console.log('fetchInfo');
    let hosts   = {};
    let aTabs   = [];
    let nLimit  = 1;

    const knownHosts  = {
      'bboojcojcpjjojafogcbkpfmllncnbdj'  : 'The Great-er Tab Discarder ( this extension! )',
      'noogafoofpebimajpfpamcfhoaifemoa'  : 'The Marvellous Suspender',
      'klbibkeccnjlkjkiokjodocebajanakg'  : 'The Great Suspender',
      'ahkbmjhfoplmfkpncgoedjgkajkehcgo'  : 'The Great Suspender (notrack)',
    }

    chrome.tabs.query({}, function (tabs) {

      for (let i  = 0; i < tabs.length; ++i) {
        const tab = tabs[i];
        const url = new URL(tab.url);
        if (url.protocol.toLowerCase() === 'chrome-extension:'
          && url.pathname.match(/\/suspended.html$/i)
          // && url.host.toLowerCase() !== chrome.runtime.id
          ) {
          aTabs.push({ tab, url });
          hosts[knownHosts[url.host] ?? url.host]++;
        }
      }
      // nLimit = aTabs.length;

      const nHosts  = Object.keys(hosts).length;

      const suspendedDiv = document.getElementById('suspendedDiv');
      if (suspendedDiv) {
        suspendedDiv.innerHTML = `Found ${aTabs.length} suspended tab${plural(aTabs.length)} from ${nHosts} extension${plural(nHosts)}<br>
        <br>${Object.keys(hosts).join('<br>')}`;

      }

      const migrateDiv = document.getElementById('migrateDiv');
      if (migrateDiv) {
        migrateDiv.style.display = aTabs.length ? 'block' : 'none';
      }

      const notFoundDiv = document.getElementById('notFoundDiv');
      if (notFoundDiv && !aTabs.length) {
        notFoundDiv.style.display = 'block';
      }

      const migrateBtn = document.getElementById('migrateBtn');
      if (migrateBtn) {
        setButton(migrateBtn, 'Migrate', nLimit);
        // migrateBtn.innerText = `Migrate ${aTabs.length} tab${plural(aTabs.length)}`;
        migrateBtn.onclick = function () {
          while (aTabs.length && nLimit > 0) {
            nLimit--;
            const obj = aTabs.shift();
            // console.log(obj.url);
            obj.url.host      = chrome.runtime.id;
            obj.url.pathname  = '/html/suspended.html'
            chrome.tabs.update(obj.tab.id, { url: obj.url.href });
          }
          document.location.href = '/html/migrate.html';
          return false;
        };

      }

      function waitForTab(id, fn, nRetry = 20) {
        chrome.tabs.get(id, function(tab) {
          // console.log(nRetry, tab.status);
          if (nRetry > 0 && tab.status.toLowerCase() == 'loading') {
            setTimeout(function() {
              waitForTab(id, fn, nRetry-1);
            }, 500);
          }
          else {
            fn(id);
          }
        });
      }

      const discardBtn = document.getElementById('discardBtn');
      if (discardBtn) {
        setButton(discardBtn, 'Convert', nLimit);
        // discardBtn.innerText = `Convert ${aTabs.length} tab${plural(aTabs.length)}`;
        discardBtn.onclick = function () {
          while (aTabs.length && nLimit > 0) {
            nLimit--;
            const obj = aTabs.shift();
            const [query, uri] = obj.url.hash.split(/&uri=/i);
            chrome.tabs.update(obj.tab.id, { url: uri }, function(tab) {
              waitForTab(tab.id, function(id) {
                chrome.tabs.discard(id, function() {
                  updatePage();
                });
              });
            });
          }
          return false;
        }
      }

      const processAll = document.getElementById('processAll');
      const nextTab = document.getElementById('nextTab');
      if (processAll && nextTab && aTabs.length) {
        nextTab.innerHTML = `Next tab: <img src="${aTabs[0].tab.favIconUrl}" class="favicon" /><span style="bold">${aTabs[0].tab.title}</span>`;
        processAll.onclick = function () {
          nLimit = processAll.checked ? aTabs.length : 1;
          setButton(migrateBtn, 'Migrate', nLimit);
          setButton(discardBtn, 'Convert', nLimit);
          nextTab.style.visibility = processAll.checked ? 'hidden' : 'visible';
        }
      }

    });
  }

  window.onload = function () {
    window.setTimeout(function () {
      updatePage();
    }, 100);
  };

}());
