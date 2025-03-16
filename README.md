# <img src="./src/img/icon48.png" align="left" /> The Great-*er* Tab Discarder
```diff
- The Great Discarder
+ The Great-er Tab Discarder
```

This is a fork of the dormant "The Great Discarder" project, now updated with new features.<br>
No tracking.  No drama.  Only fast-*er* browsing!<br>
Full Manifest V3 support in Chrome and Edge.

<br>

**Welcome** to all users coming from "**The Marvellous Suspender**", "**The Great Suspender (notrack)**", "**Tab Suspender**", or other similar extensions!

> Is your tab "Suspender" extension showing a warning "This extension may soon no longer be supported" ?<br>

Don't risk losing your suspended tabs!<br>
This extension can migrate your existing suspended tabs,
so you won't lose them if/when Chrome removes your old unsupported extensions.

<br>

## What does "Discarding" a tab mean?
> A discarded tab is one whose content has been unloaded from memory, but is still visible in the tab strip.
> Its content is reloaded the next time it is activated."

Discarding a tab does NOT close or remove or delete the tab.
It natively tells your browser it can frees up memory and resources, and is the preferred way to keep your browser running fast and efficient.

## What about "Suspending" tabs?
Tab suspending is the old-school approach at saving memory.
Problem is, the browsers still assign resources to the suspended mini-pages.
Tab discarding was added for a reason, as it allows the browser to natively free up memory.

<br>

## What's New
see [CHANGELOG.md](./CHANGELOG.md) for full details.

### Mar 2025
- Migrate `park.html` tabs from "**Tab Suspender**"
- Fixed several issues ( introduced by Manifest V3 ) affecting popup and context menu actions
- Fixed "Discard at startup" to handle occasional browser startup quirks
- Rearrange the tab migration page to simplify it a bit
- Tab Groups are now ( optionally ) displayed on the Profiler page

### Feb 2025
- Updated to "Manifest V3" so no more warning messages from Chrome!
- Migrate `suspended.html` tabs from several other extensions, like "**The Marvellous Suspender**" and "**The Great Suspender (notrack)**"
- Automatic dark mode
- New name!  ( Sort-of. )  Small change for now, to see if visibility changes

<br>

## Installation

Help others find this extension -- **submit a rating** on the App Store(s)!

- [Chrome Web Store](https://chromewebstore.google.com/detail/the-great-er-tab-discarder/plpkmjcnhhnpkblimgenmdhghfgghdpp)
- Microsoft Edge Add-ons ( coming soon )

<br>

## Added Features ( beyond the original )
- **Migrate Tabs** - Migrate your suspended tabs from another extension - OR, you can convert them to proper Discarded tabs!
- **Discard all tabs at startup** - Prevents loading all your tabs at startup, while preserving the tabs in your last session.
- **Discard other eligible tabs** - Same as "Discard all other tabs" but observes the current auto-discard settings, like skipping Pinned and Audio tabs.
- **Optional link to Discards debug page** - Adds a link on the context and popup menus to launch the built-in chrome://discards/ page.
- **Options / Settings** - Will switch to an existing tab if one exists, instead of always launching a new tab.
- **Removed Google Analytics** - No tracking. No drama.

<br>

If you have suggestions or problems using the extension, please [submit a bug or a feature request on github](https://github.com/rkodey/the-great-er-discarder-er/issues).

see [DEVNOTES.md](./DEVNOTES.md) for additional Developer Notes

<br>

## Contributors
- Huge thanks to **Mike Frysinger** ([vapier](https://github.com/vapier)) for updating to Manifest V3!
- [LordXerus](https://github.com/LordXerus)


<br><br>
----------
<br><br>


# Notes from the original author...

"The Great Discarder" started as a clone of another (former) open source extension "The Great Suspender".
It was built to take advantage of Chromium's 'tab discarding' functionality which is essentially a native implementation of tab suspension.
This extension is more robust and performant, both in the resources consumed by the extension, and the memory savings of the tab suspension.
It is also compatible with tab history syncing.


## Install as a local extension from source

1. Download the **[latest release](https://github.com/rkodey/the-great-er-discarder-er/releases)** and unarchive to your preferred location (whichever suits you).
2. Navigate to chrome://extensions/ and enable "Developer mode" in the upper right corner.
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
