
(function () {

  'use strict';

  function faviconURL(u) {
    const url = new URL(chrome.runtime.getURL("/_favicon/"));
    url.searchParams.set("pageUrl", u);
    url.searchParams.set("size", "32");
    return url.toString();
  }

  function updatePage() {

    const fullURL = new URL(document.location.href);
    const hash    = fullURL.hash.substring(1);

    const [query, uri] = hash.split(/&uri=/i);
    // console.log(query, uri);
    const vars  = new URLSearchParams(query || fullURL.search.substring(1));  // Now we have a merged set of vars from both known formats
    if (uri) vars.set('uri', uri);
    // console.log(...Array.from(vars.entries()));

    const page_title      = document.getElementById('page_title');
    const suspended_title = document.getElementById('suspended_title');
    const str_title       = vars.get('ttl') || vars.get('title');
    const str_uri         = vars.get('uri') || vars.get('url');
    if (str_title && page_title && suspended_title) {
      page_title.innerText = `${str_title || 'Suspended'} | Suspended`;
      suspended_title.innerHTML = `<img src="${faviconURL(str_uri)}" class="favicon" />${str_title ?? ''}`;
      // suspended_title.innerHTML = `${title ?? ''}`;
    }

    const suspended_uri = document.getElementById('suspended_uri');
    if (str_uri && suspended_uri) {
      suspended_uri.innerHTML = `<a href="${str_uri}">${str_uri}</a>`;
    }

    const suspended_ico = document.getElementById('suspended_ico');
    if (str_uri && suspended_ico) {
      suspended_ico.href = faviconURL(str_uri);
    }

  }

  window.onload = function () {
    window.setTimeout(function () {
      updatePage();
    }, 100);
  };

}());
