// @ts-check

import  { log, warn } from  './log.js';

export const favicon = (function () {

  'use strict';

  /**
   * @param {string} target
   */
  function getURL(target) {
    const url = new URL(chrome.runtime.getURL("/_favicon/"));
    url.searchParams.set("pageUrl", target);
    url.searchParams.set("size", '32');
    return url.toString();
  }

  /**
   * @param {string}  target
   * @param {string}  sourceID
   * @param {string}  destID
   * @param {'dim'}   modify
   */
  function loadImage(target, sourceID, destID, modify) {
    const url         = getURL(target);
    const sourceImg   = document.getElementById(sourceID);
    const destIcon    = document.getElementById(destID);
    let   done        = false;
    if (!(sourceImg instanceof HTMLImageElement)) return;
    if (!(destIcon  instanceof HTMLLinkElement)) return;

    sourceImg.onload  = () => {
      if (done) return;
      done            = true;
      log('loadImage', sourceImg.naturalWidth, sourceImg.naturalHeight, sourceImg.src);
      const canvas    = window.document.createElement('canvas');
      canvas.width    = sourceImg.naturalWidth;
      canvas.height   = sourceImg.naturalHeight;
      const ctx       = canvas.getContext('2d');
      if (!ctx) return;
      if (modify === 'dim') {
        ctx.filter    = "brightness(60%)";
      }
      ctx.drawImage(sourceImg, 0, 0, sourceImg.naturalWidth, sourceImg.naturalHeight);
      // canvas.style.margin = '0 16px';
      // sourceImg.parentNode?.appendChild(canvas);
      log('loadImage', canvas.toDataURL());
      destIcon.href   = canvas.toDataURL();
    }
    sourceImg.src   = url;
  }

  return { loadImage };

}());
