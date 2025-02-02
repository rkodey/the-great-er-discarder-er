# <img src="/src/img/icon48.png" align="left" /> The Great-*er*  Discarder-*er*
```diff
- The Great Discarder
+ The Great-er Discarder-er
```

Since the "The Great Discarder" project has been dormant for years, and the semi-related "The Great Suspender" has hit some bumps in the road,
I thought I'd take a crack at publishing this clean fork.

**The Great-*er* Discarder-*er*** continues where "The Great Discarder" left off some 4 years ago.  I plan to add some functionality and address some old open issues while keeping things simple.

<br>

## What does "Discard" mean?
Discarding a tab does not close or remove or delete the tab.  It's a feature of Chrome that simply frees up resources and memory that the tab is using.
Discarding tabs should let Chrome run faster while consuming less memory.

<br>

## Added Features
- **Discard all tabs at startup** - Prevents Chrome from loading all your tabs at startup, while preserving the tabs in your last session.
- **Discard other eligible tabs** - Same as "Discard other tabs" but observes the current auto-discard settings, like skipping Pinned and Audio tabs.
- **Optional link to Chrome Discards** - Adds a link on the context and popup menus to launch the built-in chrome://discards/ page.
- **Options / Settings** page now switches to an existing tab if one exists, instead of always launching a new tab.
- **Removed Google Analytics** tracking from original code.

see [CHANGELOG](./CHANGELOG.md) for full **Release Notes**

<br>

If you have suggestions or problems using the extension, please [submit a bug or a feature request](https://github.com/rkodey/the-great-er-discarder-er/issues).

<br>

## lastAccessed tab state

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

## Chrome Web Store

**The Great-*er* Discarder-*er*** is available on the [Chrome Web Store](https://chrome.google.com/webstore/detail/the-great-er-discarder-er/plpkmjcnhhnpkblimgenmdhghfgghdpp).

<br><br>

# Notes from the original author...

"The Great Discarder" started as a clone of another (former) open source chrome extension "The Great Suspender".
It was built to take advantage of Chromium's 'tab discarding' functionality which is essentially a native implementation of tab suspension.
This extension is more robust and performant, both in the resources consumed by the extension, and the memory savings of the tab suspension.
It is also compatible with chrome tab history syncing.


## Install as a local extension from source

1. Download the **[latest release](https://github.com/rkodey/the-great-er-discarder-er/releases)** and unarchive to your preferred location (whichever suits you).
2. Using **Google Chrome**, navigate to chrome://extensions/ and enable "Developer mode" in the upper right corner.
3. Click on the <kbd>Load unpacked extension...</kbd> button.
4. Browse to the src directory of the downloaded, unarchived release and confirm.


## Build from github

Dependencies: openssl, nodejs / npm.

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

## License

This work is licensed under a GNU GENERAL PUBLIC LICENSE (v2)

## Shoutouts
deanoemcke for original extension (before selling it) [thegreatdiscarder] (https://github.com/deanoemcke/thegreatdiscarder)<br>
This package uses the indexedDb wrapper [db.js] (https://github.com/aaronpowell/db.js) written by Aaron Powell.<br>
