// @ts-check

(function () {

  'use strict';

  // let str_title = '';
  // let str_uri   = '';

  /**
   * @param {string} target
   */
  function faviconURL(target) {
    const url = new URL(chrome.runtime.getURL("/_favicon/"));
    url.searchParams.set("pageUrl", target);
    url.searchParams.set("size", "32");
    return url.toString();
  }

  /**
   * @param {string} id
   * @param {string} attr
   * @param {string} value
   */
  function setAttribute(id, attr, value) {
    const elem = document.getElementById(id);
    if (elem) {
      elem[attr] = value;
    }
  }

  /**
   * @param {string} id
   * @param {string} html
   */
  function setInnerHTML(id, html) {
    setAttribute(id, 'innerHTML', html);
  }

  /**
   * @param {string} html
   */
  function setHeadTitle(html) {
    setInnerHTML('head_title', html);
  }

  function parseURL() {
    const fullURL = new URL(document.location.href);

    const [hash_query, hash_uri] = fullURL.hash.split(/&uri=/i);
    const hash_vars   = new URLSearchParams((hash_query || fullURL.search).substring(1));  // Now we have a merged set of vars from both known formats
    // console.log(...Array.from(hash_vars.entries()));

    const full_title  = hash_vars.get('ttl') || hash_vars.get('title')  || '';
    const clean_title = full_title.replace(/^((&#\w+;)*\s*)+/, '').replace(/(\s*[|]\s*Suspended)+$/i, '');
    const emoji       = (full_title.match(/^&#(\w+);/) || [])[1];

    const target      = hash_vars.get('uri') || hash_vars.get('url')    || hash_uri;

    return { fullURL, hash_query, hash_uri, hash_vars, full_title, clean_title, emoji, target };
  }

  function updatePage() {
    const url     = parseURL();
    console.log(url, url.hash_vars.toString());
    if (url.target && url.clean_title) {
      setInnerHTML('suspended_title', `<img src="${faviconURL(url.target)}" class="favicon" />${url.clean_title ?? ''}`);
      setInnerHTML('suspended_uri', `<a href="${url.target}">${url.target}</a>`);
      setAttribute('suspended_ico', 'href', faviconURL(url.target));
      setHeadTitle(url.full_title);
      // console.log(`[${url.emoji}]`);
      const sel   = document.getElementById('customTitle');
      if (sel instanceof HTMLSelectElement && url.emoji) {
        sel.value = url.emoji;
      }
    }

  }

  /**
   * @param {string} value
   */
  function customTitle(value) {
    const url     = parseURL();
    console.log(url, url.hash_vars.toString());
    let str_title = '';
    if (!value) {
      str_title   = url.clean_title;
    }
    else if (value === 'Suspended') {
      str_title   = `${url.clean_title} | Suspended`;
    }
    else {
      str_title   = `&#${value}; ${url.clean_title}`;
    }

    setHeadTitle(str_title);

    url.hash_vars.delete('favicon');
    url.hash_vars.delete('icon');
    url.hash_vars.delete('ttl');
    url.hash_vars.delete('uri');
    url.hash_vars.set('title', str_title);
    url.hash_vars.set('url', url.target);

    let hash      = `#${url.hash_vars.toString()}`;
    // if (url.hash_uri) hash += `&uri=${url.hash_uri}`;
    document.location.hash = hash;
    console.log(hash);
    updatePage();
  }

  window.onload = () => {

    const sel = document.getElementById('customTitle');
    if (sel) {
      sel.onchange = (e) => {
        if (e.target instanceof HTMLSelectElement) {
          // console.log('onchange', e.target.value);
          customTitle(e.target.value);
        }
      };
    }

    window.setTimeout(() => {
      updatePage();
    }, 100);
  };

}());
