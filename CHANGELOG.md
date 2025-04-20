# <img src="./src/img/icon48.png" align="left" /> The Great-*er* Tab Discarder
```diff
- The Great Discarder
+ The Great-er Tab Discarder
```

# Change Log

## 1.3.0 - Apr 2025
- New: **Suspending Tabs** has been added
  ( [Closes #42](https://github.com/rkodey/the-great-er-discarder-er/issues/42) )
  - You can Suspend individual tabs in addition to Discarding them, using the extension popup or keyboard shortcuts
  - You can switch between automatic Suspending and Discarding tabs in the Settings
- New: **Suspended Tabs** can have their tab titles customized with a prefix for setting visual distinction
  ( [Partial #41](https://github.com/rkodey/the-great-er-discarder-er/issues/41) )
  ( [Partial #5](https://github.com/rkodey/the-great-er-discarder-er/issues/5) )
  - Example prefixes: 💤 🔴 🟡 ( ... and more colors )
  - I'm considering favicon customization as well, if there's positive feedback for that
- Update: **Migrating** tabs is awesome-*er* now that you can view and select which eligible tabs you'd like to Migrate or Convert
- New: **Tiny Suspender** `suspend.html` tabs can be migrated!
  ( [Closes #51](https://github.com/rkodey/the-great-er-discarder-er/issues/51) )
- Fix: Tab migration to handle the different formats better, which should prevent looping
  ( [Might help #45](https://github.com/rkodey/the-great-er-discarder-er/issues/45) )

## 1.2.2 - Mar 2025
- Fix: "Discard at startup" (again) to prevent discarding tabs when the browser restarts idle workers
  ( [Closes #43](https://github.com/rkodey/the-great-er-discarder-er/issues/43) )

## 1.2.1 - Mar 2025
- Fix: "Discard at startup" would occasionally get skipped during browser startup
- Rearrange the tab migration page to simplify it a bit

## 1.2.0 - Mar 2025
- New: Migrate `park.html` tabs from "**Tab Suspender**"
  ( [Closes #40](https://github.com/rkodey/the-great-er-discarder-er/issues/40) )
- Fix: "Don't discard this tab for now"
  ( [Closes #39](https://github.com/rkodey/the-great-er-discarder-er/issues/39) )
  - Renamed this action to "Pause discarding this tab" to try to clarify / simplify
- Fix: Several other issues related to popup and context menu actions
  - Several of the popup and context menu actions were not working
  - Re-wrote a bunch of the options storage code
- New: Tab Groups are now ( optionally ) displayed on the Profiler page

## 1.1.0 - Feb 2025
- New: Migrate `suspended.html` tabs from several other extensions,
  like "**The Marvellous Suspender**" and "**The Great Suspender (notrack)**"
  ( [Closes #35](https://github.com/rkodey/the-great-er-discarder-er/issues/35) )
- New: Automatic dark mode
- New Name!  Sort-of.  Small change for now, to see if visibility changes

## 1.0.1 - Feb 2025
- Fix tempWhitelist bug introduced in the Manifest V3 changes
  ( [Closes #33](https://github.com/rkodey/the-great-er-discarder-er/issues/33) )
- Update the Profiler page to show tab group and pinned status
- Update the Profiler page to group by Window - thanks again to ( [vapier](https://github.com/vapier) )
- Add a link to the Profiler page in the extension popup

## 1.0.0 - Feb 2025
- Update to Manifest V3.  Finally!
- Huge thanks to **Mike Frysinger** ( [vapier](https://github.com/vapier) ) for doing all the hard stuff!
- Almost 4 years between releases... Yikes!

## 0.2.1 - Oct 2021
- Add new popup command to discard all eligible tabs based on options (aka no force) ( Closes upstream #18 )
- Discard at startup option has its own group and visibility
  ( ( [Closes #9](https://github.com/rkodey/the-great-er-discarder-er/issues/9) ) - thanks @LordXerus )
- Add option to enable links to the browser Discards page ( Closes upstream #39 )
- Update options tab to switch to an existing tab instead of always opening a new tab
- Update HTML to be a bit easier to read with heavier font and tweaked layout
- Standardize and format HTML and CSS files
- Remove time-grunt dependency
- Remove nag stuff
- Clean up logging

## 0.2.0 - Feb 2021
- First official release of this fork
- Add new option to discard all tabs at startup
- Remove Google Analytics
- Remove unneeded (I think) extension permissions
