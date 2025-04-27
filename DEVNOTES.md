# <img src="./src/img/icon48.png" align="left" /> The Great-*er* Tab Discarder
```diff
- The Great Discarder
+ The Great-er Tab Discarder
```

# Developer Notes

<br>

## Tab migration


### `suspended.html` type URL format
- uri is NOT encoded at the end -- their source code explicitly notes this
  > chrome-extension://`EXTID`/suspended.html#ttl=`TITLE`&pos=0&uri=`URI`


### "Tab Suspender" `park.html` URL format
- fiabciakcmgepblmdkmemdbbkilneeeh
- The querystring looks correctly coded here, and using URL.searchParams produces good results so far
  > chrome-extension://`EXTID`/park.html?title=`TITLE`&url=`URI`&tabId=`INT`&sessionId=`INT`&icon=data%3Aimage%2Fpng%3Bbase64%2C`data`


### "Tiny Suspender" `suspend.html` URL format
- bbomjaikkcabgmfaomdichgcodnaeecf
  > chrome-extension://`EXTID`/suspend.html?url=`URI`&title=`TITLE`&favIconUrl=https%3A%2F%2Fkodey.com%2Fassets%2Fimg%2Ffavicons%2Ffavicon.ico&scroll_x=0&scroll_y=0&dark_mode=true

<br>

## Building the extension from source

You must have nodejs installed

Clone the repository and run these commands:
```
npm install
npm run generate-key
npm run build
```

It should say:
```
Done, without errors.
```

The extension in crx format will be inside the build/crx/ directory. You can drag it into chrome://extensions to install locally.

<br>

## Chrome & Edge Extension Startup Events
Chrome documentation:
[extension service worker lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle)

- Launching browser with empty cache directories
  - 1 service worker install
  - 3 service worker activate

- Launching browser "normally"
  - 4 chrome onStartup

- Reloading the extension ( unpacked )
  - 1 service worker install
  - 2 chrome onInstalled
  - 3 service worker activate

- Disable extension, then re-enable
  - 1 service worker install
  - 3 service worker activate

- Reactivating the extension from "inactive"
  - ( nothing )

<br>

## Tab state "lastAccessed"

The [`lastAccessed`](https://developer.chrome.com/docs/extensions/reference/api/tabs)
API looks like it almost does what we need, but it tracks slightly different
state that makes it not useful to us.

The field is described as:
> The last time the tab became active in its window as the number of milliseconds since epoch.

That means when you activate a tab, the field is updated.  But if you leave the
tab active for an hour, and then switch away, the field does not change.  It is
not tracking the last time the tab was used or focused, only the last time focus
changed to it.  If we used that to determine when a tab as last used, we would
prematurely discard tabs held active for a long time.

<br>
