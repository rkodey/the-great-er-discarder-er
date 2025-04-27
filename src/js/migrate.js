// @ts-check

(function () {

  'use strict';

  /**
   * @param {number} n
   */
  function plural(n) {
    return n == 1 ? '' : 's';
  }


  /**
   * @param {number | undefined}    id
   * @param {(id: number) => void}  callback
   * @param {number}                nRetry
   */
  function waitForTab(id, callback, nRetry = 20) {
    if (id) {
      chrome.tabs.get(id, (tab) => {
        // console.log('waitForTab', nRetry, tab.status);
        if (nRetry > 0 && tab.status?.toLowerCase() == 'loading') {
          setTimeout(() => {
            waitForTab(id, callback, nRetry-1);
          }, 1000);
        }
        else {
          callback(id);
        }
      });
    }
  }


  function updatePage() {
    // console.log('updatePage');
    document.documentElement.style.cursor = 'progress';

    const knownExtensions  = {
      'noogafoofpebimajpfpamcfhoaifemoa'  : 'The Marvellous Suspender',
      'klbibkeccnjlkjkiokjodocebajanakg'  : 'The Great Suspender',
      'ahkbmjhfoplmfkpncgoedjgkajkehcgo'  : 'The Great Suspender (notrack)',
      'fiabciakcmgepblmdkmemdbbkilneeeh'  : 'Tab Suspender',
      'bbomjaikkcabgmfaomdichgcodnaeecf'  : 'Tiny Suspender',
    }
    knownExtensions[chrome.runtime.id]    = 'The Great-<span class="italic">er</span> Tab Discarder ( this extension! )';

    let   foundExts   = {};
    const tabTable    = document.getElementById('migrateTabTable');
    const migrateBtn  = document.getElementById('migrateBtn');
    const discardBtn  = document.getElementById('discardBtn');
    const selectedMap = new Map();
    let   nRows       = 0;

    if (!(tabTable instanceof HTMLTableElement)) return;

    tabTable.innerHTML= '';


    /**
     * @param {HTMLElement} elem
     * @param {string}      name
     */
    function setButton(elem, name) {
      const length    = selectedMap.size;
      elem.innerHTML  = `${name} ${length} tab${plural(length)}`;
    }

    /**
     * @param {chrome.tabs.Tab} tab
     * @param {URL}             url
     */
    function generateTabInfo(tab, url) {
      const
        tabId         = tab.id        ?? '?',
        pinned        = tab.pinned    ? '<i class="fa fa-thumb-tack"></i>' : '',
        tabTitle      = tab.title     ?? 'unknown';

      if (!(tabTable instanceof HTMLTableElement) || !migrateBtn || !discardBtn) return;

      if (nRows == 0) {
        // console.log('updatePage resetting tabTable');
        tabTable.innerHTML  = `
              <tr>
                <th class="check">
                  <a href="#" id="checkAll"><i class="fa fa-check-square-o"></i></a>
                  <span style="padding-left:10px;">Title</span>
                </th>
                <th>Pinned</th>
              </tr>
        `;
      }
      const row       = tabTable.insertRow();
      row.className   = nRows == 0 ? 'newrow' : '';

      const checkCell = row.insertCell();
      const check     = document.createElement('input');
      check.type      = 'checkbox';
      check.id        = `tab-${tabId}`;
      check.className = 'tabList';
      check.onchange  = (e) => {
        // console.log('onchange', selectedMap.size);
        if (e.target instanceof HTMLInputElement && e.target.checked) {
          selectedMap.set(tabId, { tab, url });
        }
        else {
          selectedMap.delete(tabId);
        }
        // console.log('onchange', selectedMap.size);
        setButton(migrateBtn, 'Migrate');
        setButton(discardBtn, 'Convert');
      };
      checkCell.appendChild(check);
      const label     = document.createElement('label');
      label.setAttribute('for', check.id);
      label.innerHTML = `<span class="overlay"></span>${tabTitle}`;
      checkCell.appendChild(label);
      const pin       = row.insertCell();
      pin.innerHTML   = pinned
      nRows += 1;
    }


    chrome.tabs.query({}, (tabs) => {

      for (let i  = 0; i < tabs.length; ++i) {
        const tab = tabs[i];
        const url = new URL(tab.url || '');
        if (url.protocol.match(/extension:$/i)
          && url.pathname.match(/\/(suspend(ed)?|park).html$/i)
          // && url.host.toLowerCase() !== chrome.runtime.id
          ) {
          foundExts[knownExtensions[url.host] ?? url.host]++;
          generateTabInfo(tab, url);
        }
      }

      // hook up "selectAll" if the table was drawn
      const checkAll      = document.getElementById('checkAll');
      if (checkAll) {
        checkAll.onclick  = () => {
          // console.log('checkAll', nRows, selectedMap.size);
          const state     = nRows != selectedMap.size;
          document.querySelectorAll('input[type="checkbox"]').forEach((input) => {
            if (input instanceof HTMLInputElement && input.checked != state) input.click();
          });
          return false;
        }
      }


      const nHosts  = Object.keys(foundExts).length;

      const suspendedDiv  = document.getElementById('suspendedDiv');
      const extensionDiv  = document.getElementById('extensionDiv');
      if (suspendedDiv && extensionDiv) {
        const strTabs           = `<H2>Found ${nRows} suspended tab${plural(nRows)}`;
        const strExtensions     = nHosts > 0 ? `from ${nHosts} extension${plural(nHosts)}</H2>` : '';
        suspendedDiv.innerHTML  = `${strTabs} ${strExtensions}`;
        extensionDiv.innerHTML  = nHosts > 0 ? `<ul class="unorderedList"><li>${Object.keys(foundExts).join('</li><li>')}</li></ul>` : '';
      }

      const migrateDiv = document.getElementById('migrateDiv');
      if (migrateDiv) {
        migrateDiv.style.display = nRows ? 'block' : 'none';
      }

      const notFoundDiv = document.getElementById('notFoundDiv');
      if (notFoundDiv && !nRows) {
        notFoundDiv.style.display = 'block';
      }


      if (migrateBtn) {
        setButton(migrateBtn, 'Migrate');

        // To migrate a tab, simply drop in this extension's ID into the host, and update the pathname.  QueryString is maintained.
        migrateBtn.onclick = () => {
          let nProcessed = 0;

          document.documentElement.style.cursor = 'progress';
          // updatePage will reset the cursor once it's done

          // Wait 100ms to let the cursor change before we jump into a potentially really large loop.  600 tabs takes around 30 seconds.
          setTimeout(() => {
            selectedMap.forEach((/** @type { { url:URL, tab:chrome.tabs.Tab } } */ obj) => {
              nProcessed += 1;
              // if (obj.url.host   != chrome.runtime.id) {
                // replace the host with our extension ID to migrate
                obj.url.host      = chrome.runtime.id;
                obj.url.pathname  = '/html/suspended.html'
                const fLast       = nProcessed == selectedMap.size;         // compare outside the closure to prevent re-evaluation after async
                if (!obj.tab.id) return;
                chrome.tabs.update(obj.tab.id, { url: obj.url.href }, (tab) => {
                  // On the last processed tab, wait for it to finish loading then update the page
                  if (fLast) {
                    waitForTab(tab?.id, (/* id */) => {
                      updatePage();
                    });
                  }
                });

              // }
            });
            return false;
          }, 100);
        };

      }

      if (discardBtn) {
        setButton(discardBtn, 'Convert');

        // To convert to a Discard tab, grab the uri, tell the browser to load that URI, wait for the tab to get past "loading", then discard it.
        discardBtn.onclick = () => {
          let nProcessed = 0;

          document.documentElement.style.cursor = 'progress';
          // updatePage will reset the cursor once it's done

          // Wait 100ms to let the cursor change before we jump into a potentially really large loop.  600 tabs takes around 30 seconds.
          setTimeout(() => {
            selectedMap.forEach((/** @type { { url:URL, tab:chrome.tabs.Tab } } */ obj) => {
              nProcessed += 1;
              const [hash_query, hash_uri]  = obj.url.hash.split(/&uri=/i);
              const vars          = new URLSearchParams((hash_query || obj.url.search).substring(1));
              const str_uri       = hash_uri || vars.get('url') || vars.get('uri'); // Get the url from both formats
              const fLast         = nProcessed == selectedMap.size;         // compare outside the closure to prevent re-evaluation after async
              if (!obj.tab.id || !str_uri) return;
              chrome.tabs.update(obj.tab.id, { url: str_uri }, (tab) => {
                // On the last processed tab, wait for it to finish loading then update the page
                // @TODO maybe a promise ALL would be better to make sure all tabs reload even if out of order
                waitForTab(tab?.id, (id) => {
                  chrome.tabs.discard(id, () => {
                    if (fLast) {
                      updatePage();
                    }
                  });
                });
              });
            });
            return false;
          }, 100);
        }
      }

    });

    document.documentElement.style.cursor = 'default';
  }

  window.onload = () => {

    window.onfocus = () => {
      updatePage();
    }

    window.setTimeout(() => {
      updatePage();
    }, 100);

  };

}());
