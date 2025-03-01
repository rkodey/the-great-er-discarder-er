# <img src="./src/img/icon48.png" align="left" /> The Great-*er* Tab Discarder
```diff
- The Great Discarder
+ The Great-er Tab Discarder
```

# Change Log

## 1.1.0 - Feb 2025
- New: Migrate suspended tabs from several other extensions, like "The Marvellous Suspender" and "The Great Suspender (notrack)"
- New: Automatic dark mode
- New Name!  Sort-of.  Small change for now, to see if visibility changes.

## 1.0.1 - Feb 2025
- Fix tempWhitelist bug introduced in the Manifest V3 changes ( [Closes #33](https://github.com/rkodey/the-great-er-discarder-er/issues/33) )
- Update the Profiler page to show tab group and pinned status
- Update the Profiler page to group by Window - thanks again to ( [vapier](https://github.com/vapier) )
- Add a link to the Profiler page in the extension popup

## 1.0.0 - Feb 2025
- Update to Manifest V3.  Finally!
- Huge thanks to **Mike Frysinger** ( [vapier](https://github.com/vapier) ) for doing all the hard stuff!
- Almost 4 years between releases... Yikes!

## 0.2.1 - Oct 2021
- Add new popup command to discard all eligible tabs based on options (aka no force) ( Closes upstream #18 )
- Discard at startup option has its own group and visibility ( ( [Closes #9](https://github.com/rkodey/the-great-er-discarder-er/issues/9) ) - thanks @LordXerus )
- Add option to enable links to the Chrome Discards page ( Closes upstream #39 )
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
