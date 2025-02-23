
(function () {

  'use strict';

  function faviconURL(u) {
    const url = new URL(chrome.runtime.getURL("/_favicon/"));
    url.searchParams.set("pageUrl", u);
    url.searchParams.set("size", "32");
    return url.toString();
  }

  function updatePage() {

    const hash  = (new URL(document.location.href)).hash.substring(1);

    const vars  = {}
    const [query, uri] = hash.split(/&uri=/i);
    // console.log(uri);
    query.split('&').forEach(function (nvpstr) {
      const nvp = nvpstr.split('=');
      vars[nvp[0]] = decodeURIComponent(nvp[1]);
    });
    // console.log(vars);

    const page_title = document.getElementById('page_title');
    const suspended_title = document.getElementById('suspended_title');
    if (vars['ttl'] && page_title && suspended_title) {
      page_title.innerText = `${vars['ttl'] ?? 'Suspended'} | Suspended`;
      suspended_title.innerHTML = `<img src="${faviconURL(uri)}" class="favicon" />${vars['ttl'] ?? ''}`;
      // suspended_title.innerHTML = `${vars['ttl'] ?? ''}`;
    }

    const suspended_uri = document.getElementById('suspended_uri');
    if (uri && suspended_uri) {
      suspended_uri.innerHTML = `<a href="${uri}">${uri}</a>`;
    }

    const suspended_ico = document.getElementById('suspended_ico');
    if (uri && suspended_ico) {
      suspended_ico.href = faviconURL(uri);
    }

  }

  window.onload = function () {
    window.setTimeout(function () {
      updatePage();
    }, 100);
  };

}());
