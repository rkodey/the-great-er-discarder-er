
(function () {

  'use strict';

  function plural(n) {
    return n == 1 ? '' : 's';
  }

  function setButton(elem, name, length) {
    elem.innerHTML = `${name} ${length} tab${plural(length)}`;
  }

  function updatePage() {
    let found   = {};
    let aTabs   = [];
    let nLimit  = 1;

    const knownExtensions  = {
      'noogafoofpebimajpfpamcfhoaifemoa'  : 'The Marvellous Suspender',
      'klbibkeccnjlkjkiokjodocebajanakg'  : 'The Great Suspender',
      'ahkbmjhfoplmfkpncgoedjgkajkehcgo'  : 'The Great Suspender (notrack)',
      'fiabciakcmgepblmdkmemdbbkilneeeh'  : 'Tab Suspender',
    }
    knownExtensions[chrome.runtime.id]    = 'The Great-<span class="italic">er</span> Tab Discarder ( this extension! )';

    chrome.tabs.query({}, function (tabs) {

      for (let i  = 0; i < tabs.length; ++i) {
        const tab = tabs[i];
        const url = new URL(tab.url);
        if (url.protocol.match(/extension:$/i)
          && url.pathname.match(/\/(suspended|park).html$/i)
          // && url.host.toLowerCase() !== chrome.runtime.id
          ) {
          // console.log(url);
          aTabs.push({ tab, url });
          found[knownExtensions[url.host] ?? url.host]++;
        }
      }

      const nHosts  = Object.keys(found).length;

      const suspendedDiv  = document.getElementById('suspendedDiv');
      const extensionDiv  = document.getElementById('extensionDiv');
      if (suspendedDiv && extensionDiv) {
        const strTabs           = `<H2>Found ${aTabs.length} suspended tab${plural(aTabs.length)}`;
        const strExtensions     = nHosts > 0 ? `from ${nHosts} extension${plural(nHosts)}</H2>` : '';
        suspendedDiv.innerHTML  = `${strTabs} ${strExtensions}`;
        extensionDiv.innerHTML  = `${Object.keys(found).join('<br>')}`;
      }

      const migrateDiv = document.getElementById('migrateDiv');
      if (migrateDiv) {
        migrateDiv.style.display = aTabs.length ? 'block' : 'none';
      }

      const notFoundDiv = document.getElementById('notFoundDiv');
      if (notFoundDiv && !aTabs.length) {
        notFoundDiv.style.display = 'block';
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

      const migrateBtn = document.getElementById('migrateBtn');
      if (migrateBtn) {
        setButton(migrateBtn, 'Migrate', nLimit);

        // To migrate a tab, simply drop in this extension's ID into the host, and update the pathname.  QueryString is maintained.
        migrateBtn.onclick = function () {
          while (aTabs.length && nLimit > 0) {
            nLimit--;
            const obj = aTabs.shift();

            if (obj.url.host   != chrome.runtime.id) {
              obj.url.host      = chrome.runtime.id;
              obj.url.pathname  = '/html/suspended.html'
              chrome.tabs.update(obj.tab.id, { url: obj.url.href });
              waitForTab(obj.tab.id, function(id) {
                updatePage();
              });
            }
          }
          document.location.href = '/html/migrate.html';
          return false;
        };

      }

      const discardBtn = document.getElementById('discardBtn');
      if (discardBtn) {
        setButton(discardBtn, 'Convert', nLimit);

        // To convert to a Discard tab, grab the uri, tell the browser to load that URI, wait for the tab to get past "loading", then discard it.
        discardBtn.onclick = function () {
          while (aTabs.length && nLimit > 0) {
            nLimit--;
            const obj = aTabs.shift();

            const [query, uri] = obj.url.hash.split(/&uri=/i);
            const str_uri = uri || obj.url.searchParams.get('url');   // Get the url from both formats
            chrome.tabs.update(obj.tab.id, { url: str_uri }, function(tab) {
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
