# <img src="./src/img/icon48.png" align="left" /> The Great-*er* Tab Discarder
```diff
- The Great Discarder
+ The Great-er Tab Discarder
```

# Developer Notes

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

## Tab migration

### "Suspender" type URL format
- uri is NOT encoded at the end -- their code explicitly notes this
  > chrome-extension://`EXTID`/suspended.html#ttl=`TITLE`&pos=0&uri=`URI`


### "Tab Profiler" URL format
- The querystring looks correctly coded here, and using URL.searchParams produces good results so far
  > chrome-extension://`EXTID`/park.html?title=`TITLE`&url=`URI`&tabId=`INT`&sessionId=`INT`&icon=data%3Aimage%2Fpng%3Bbase64%2C`data`

<br>
