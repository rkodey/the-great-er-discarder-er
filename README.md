# <img src="./src/img/icon48.png" align="left" /> The Great-*er* Tab Discarder
```diff
- The Great Discarder
+ The Great-er Tab Discarder
```

Helps your browser load and run faster by freeing up memory and resources used by inactive or old tabs.

No tracking.  No drama.  Only fast-*er* browsing!

Full Manifest V3 support in Chrome and Edge.

<br>

## Welcome
...to all users coming from
- **The Marvellous Suspender**
- **The Great Suspender (notrack)**
- **Tab Suspender**
- **Tiny Suspender**
- This extension can migrate your suspended tabs!

> Is your tab "Suspender" extension showing a warning "This extension may soon no longer be supported" ?<br>

Don't risk losing your suspended tabs!

This extension can migrate your existing suspended tabs,
so you won't lose them if/when Chrome removes your old unsupported extensions.

<br>

## Get the extension

- [Chrome Web Store](https://chromewebstore.google.com/detail/the-great-er-tab-discarder/plpkmjcnhhnpkblimgenmdhghfgghdpp)
- [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/the-greater-tab-discarder/lieejiddoadedggjdkgeellgeeibbnai)

Help others find the extension -- submit a ⭐⭐⭐⭐⭐ rating in the App Store(s) if you like the extension!

<br>

## What does "Discarding" a tab mean?
> A discarded tab is one whose content has been unloaded from memory, but is still visible in the tab strip.
> Its content is automatically reloaded the next time it is activated.

Discarding a tab does NOT close or remove or delete the tab.
It natively tells your browser it can frees up memory and resources, and is the preferred way to keep your browser running fast and efficient.

## What about "Suspending" tabs?
Tab suspending is the old-school approach at saving memory, **but allows for customization**.
Your browser will still assign some resources to the suspended "mini-pages" to allow for the customization.
You can also Discard a Suspended tab...  perhaps getting the best of both worlds.

<br>

## Screenshots
<img src="./screenshots/Popup Light.png" height="200" /> &nbsp;
<img src="./screenshots/Options Light.png" height="200" /> &nbsp;

<img src="./screenshots/Popup Dark.png" height="200" /> &nbsp;
<img src="./screenshots/Options Dark.png" height="200" /> &nbsp;

<br>

## What's New

### April 2025
- **Suspending Tabs** has been added
  - You can Suspend individual tabs in addition to Discarding them, using the extension popup or keyboard shortcuts
  - You can switch between automatic Suspending and Discarding tabs in the Settings
- **Suspended Tabs** can have their tab titles customized with a prefix for setting visual distinction
  - Example prefixes: 💤 🔴 🟡 ( ... and more colors )
  - I'm considering favicon customization as well, if there's positive feedback for that
- **Migrating** tabs is awesome-*er* now that you can view and select which eligible tabs you'd like to Migrate or Convert
- **Tiny Suspender** `suspend.html` tabs can be migrated!
- Fixed tab migration to handle the different formats better, which should prevent looping

### March 2025
- **Tab Suspender** `park.html` tabs can be migrated!
- Fixed several issues ( introduced by Manifest V3 ) affecting popup and context menu actions
- **Discard at startup** was fixed to handle occasional browser startup quirks
- Rearrange the tab migration page to simplify it a bit
- Tab Groups are now ( optionally ) displayed on the Profiler page

see [CHANGELOG.md](./CHANGELOG.md) for full details.

<br>

## Feature Highlights
- **Migrate Tabs** - Migrate your suspended tabs from another extension - OR, you can convert them to proper Discarded tabs!
- **Automatic Dark Mode** - The extension follows your browser's Appearance settings.
- **Discard all tabs at startup** - Prevents your browser from reloading all your tabs at startup, which can greatly speed up startup time.
- **Discard all eligible tabs** - Same as "Discard all other tabs" but observes the current auto-discard settings, like skipping Pinned and Audio tabs.
- **Display tab details** - Adds a link to the popup menus to show details useful for seeing how the extension sees things.
- **Settings** - Will re-use an existing settings tab if one exists.
- **Removed Google Analytics** - No tracking. No drama. Only fast-*er* browsing!

<br>

## Help & Support

If you have suggestions or problems using the extension, please
- [Start a discussion if you have a question](https://github.com/rkodey/the-great-er-discarder-er/discussions).
- [Submit a bug or feature request](https://github.com/rkodey/the-great-er-discarder-er/issues).

<br>

## Contributors
- Huge thanks to **Mike Frysinger** ([vapier](https://github.com/vapier)) for updating to Manifest V3!
- [LordXerus](https://github.com/LordXerus)
  <br><br>see [DEVNOTES.md](./DEVNOTES.md) for additional Developer Notes

## Shout-outs
- deanoemcke for original extension (before selling it) [thegreatdiscarder](https://github.com/deanoemcke/).
- This package uses the indexedDb wrapper [db.js](https://github.com/aaronpowell/db.js) written by Aaron Powell.

## License

This work is licensed under a GNU GENERAL PUBLIC LICENSE (v2)
