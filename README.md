# <img src="./src/img/icon48.png" align="left" /> The Great-*er* Tab Discarder
```diff
- The Great Discarder
+ The Great-er Tab Discarder
```

This is a fork of the dormant "The Great Discarder" project, now updated with new features.<br>
No tracking.  No drama.  Full Manifest V3 support in Chrome.

<br>

**Welcome** to all users coming from "The Marvellous Suspender", "The Great Suspender (notrack)", or other similar extensions!

> **Is your current tab "Suspender" extension showing a warning "This extension may soon no longer be supported" ?**<br>

Don't risk losing your suspended tabs!<br>
This extension can migrate your existing suspended tabs,
so you won't lose them if/when Chrome removes your old unsupported extensions.

<br>

## What does "Discarding" a tab mean?
Discarding a tab does NOT close or remove or delete the tab.  Discarding simply frees up memory.  It's a feature of Chrome, and the preferred way to keep your browser running fast and efficient.

## What about "Suspending" tabs?
Tab suspending is the old-school approach at saving memory.  Problem is, Chrome still assigns resources to the suspended mini-pages.  Chrome added tab discarding for a reason, as it's able to natively free up memory.

<br>

## Feb 2025 What's New
- Updated to "Manifest V3" so no more warning messages from Chrome!
- Migrate suspended tabs from several other extensions, like "The Marvellous Suspender" and "The Great Suspender (notrack)"
- Automatic dark mode.
- New name!  Sort-of.  Small change for now, to see if visibility changes.

**The Great-*er* Tab Discarder** is available on the [Chrome Web Store](https://chrome.google.com/webstore/detail/the-great-er-discarder-er/plpkmjcnhhnpkblimgenmdhghfgghdpp).

<br>

## Added Features
- **Migrate Tabs** - Migrate your suspended using a similar suspend technique - OR, you can convert them to proper Discarded tabs!
- **Discard all tabs at startup** - Prevents Chrome from loading all your tabs at startup, while preserving the tabs in your last session.
- **Discard other eligible tabs** - Same as "Discard all other tabs" but observes the current auto-discard settings, like skipping Pinned and Audio tabs.
- **Optional link to Chrome Discards** - Adds a link on the context and popup menus to launch the built-in chrome://discards/ page.
- **Options / Settings** - Will switch to an existing tab if one exists, instead of always launching a new tab.
- **Removed Google Analytics** - No tracking. No drama.

see [CHANGELOG.md](./CHANGELOG.md) for full **Release Notes**

see [DEVNOTES.md](./DEVNOTES.md) for additional Developer Notes

<br>

If you have suggestions or problems using the extension, please [submit a bug or a feature request on github](https://github.com/rkodey/the-great-er-discarder-er/issues).

<br>

## Contributors
- Huge thanks to **Mike Frysinger** ([vapier](https://github.com/vapier)) for updating to Manifest V3!
- [LordXerus](https://github.com/LordXerus)


<br><br>
----------
<br><br>


# Notes from the original author...

"The Great Discarder" started as a clone of another (former) open source chrome extension "The Great Suspender".
It was built to take advantage of Chromium's 'tab discarding' functionality which is essentially a native implementation of tab suspension.
This extension is more robust and performant, both in the resources consumed by the extension, and the memory savings of the tab suspension.
It is also compatible with chrome tab history syncing.


## Install as a local extension from source

1. Download the **[latest release](https://github.com/rkodey/the-great-er-discarder-er/releases)** and unarchive to your preferred location (whichever suits you).
2. Using **Google Chrome**, navigate to chrome://extensions/ and enable "Developer mode" in the upper right corner.
3. Click on the `Load unpacked extension...` button.
4. Browse to the src directory of the downloaded, un-archived release and confirm.


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

## Shout-outs
- deanoemcke for original extension (before selling it) [thegreatdiscarder](https://github.com/deanoemcke/).
- This package uses the indexedDb wrapper [db.js](https://github.com/aaronpowell/db.js) written by Aaron Powell.
