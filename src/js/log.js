// @ts-check

export const DEBUG  = !(chrome.runtime.getManifest().update_url); // Turn on debug for local unpacked extension
export const  log   = function(...msg) { if(DEBUG) console.log(...msg); }
export const warn   = function(...msg) { if(DEBUG) console.warn(...msg); }
// const  err = function(...msg) { if(DEBUG) console.error(...msg); }
