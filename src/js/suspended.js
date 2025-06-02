// @ts-check

import  { favicon }   from  './favicon.js';
import  { storage }   from  './storage.js';
import  { log, warn } from  './log.js';

(function () {

  'use strict';

  let currentOptions;
  let targetURL = '';


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
    // log(...Array.from(hash_vars.entries()));

    const full_title  = hash_vars.get('ttl') || hash_vars.get('title')  || '';
    const clean_title = full_title.replace(/^((&#\w+;)*\s*)+/, '').replace(/(\s*[|]\s*Suspended)+$/i, '');
    const emoji       = (full_title.match(/^&#(\w+);/) || [])[1];

    const target      = hash_vars.get('uri') || hash_vars.get('url')    || hash_uri;

    return { fullURL, hash_query, hash_uri, hash_vars, full_title, clean_title, emoji, target };
  }

  function setClickAnywhere() {
    log('setClickAnywhere');
    document.querySelectorAll('select,label').forEach((elem) => {
      elem.addEventListener('click', function (event) {
        event.stopPropagation();
      });
    });
    const html = document.querySelector('html');
    if (html) {
      html.style.cursor = 'copy';
      html.onclick = () => {
        document.location.href = targetURL;
      };
    }
    let elem;
    elem = document.getElementById('watermark');
    if (elem) elem.style.display = 'block';
    elem = document.getElementById('no-watermark');
    if (elem) elem.style.display = 'none';
  }

  function setRestoreOnReload() {
    log('setRestoreOnReload');
    // beforeunload triggers faster, but is harder to tell what the trigger is
    // this modern PerformanceObserver knows exactly a reload

    // window.addEventListener('beforeunload', (event) => {
    //   log('beforeunload', document.location.href);
    //   // event.preventDefault();
    // });

    // the reload event is detected on the NEXT page load, as a very early event
    // thus, the buffered: true is required to see the events that happened before observing
    // const observer = new PerformanceObserver((list) => {
    //   for (const entry of list.getEntries()) {
    //     if (entry.type === "reload") {
    //       // log('RELOAD');
    //       document.location.href = targetURL;
    //     }
    //   }
    // });
    // observer.observe({ type: "navigation", buffered: true });

    // given the above, we can just ask for already triggered events
    /** @type { PerformanceEntry & { type?: string } } */
    let entry;
    for (entry of performance.getEntriesByType("navigation")) {
      if (entry.type === "reload") {
        // log('RELOAD');
        document.location.href = targetURL;
      }
    };

  }

  function initialize() {
    log('initialize', currentOptions);

    updatePage();

    if (currentOptions[storage.SUSPEND_RESTORE_RELOAD]) {
      setRestoreOnReload();
    }
    if (currentOptions[storage.SUSPEND_RESTORE_CLICK]) {
      setClickAnywhere();
    }

    // @NEXT:  favicon caching
    favicon.loadImage(targetURL, 'title_icon', 'suspended_favicon', currentOptions[storage.SUSPEND_FAVICON]);

  }

  function updatePage() {
    const url     = parseURL();
    // log('updatePage', url, url.hash_vars.toString());
    if (url.target && url.clean_title) {
      setInnerHTML('suspended_title', `<img id="title_icon" class="favicon" />${url.clean_title ?? ''}`);
      setInnerHTML('suspended_uri', `<a href="${url.target}">${url.target}</a>`);
      setHeadTitle(url.full_title);
      const sel   = document.getElementById('customTitle');
      if (sel instanceof HTMLSelectElement && url.emoji) {
        sel.value = url.emoji;
      }
      targetURL = url.target;
    }

  }

  /**
   * @param {string} value
   */
  function customTitle(value) {
    const url     = parseURL();
    // log('customTitle', url, url.hash_vars.toString());
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
    // log(hash);
    updatePage();
  }

  window.onload = () => {

    const sel = document.getElementById('customTitle');
    if (sel) {
      sel.onchange = (e) => {
        if (e.target instanceof HTMLSelectElement) {
          // log('onchange', e.target.value);
          customTitle(e.target.value);
        }
      };
    }

    chrome.runtime.sendMessage({ action: 'requestCurrentOptions' }, (options) => {
      currentOptions = options;
      window.setTimeout(() => {
        initialize();
      }, 100);

    });

  };

}());
