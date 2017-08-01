# <img src="/src/img/icon48.png" align="absmiddle"> The Great Discarder

"The Great Discarder" is a clone of my other open source chrome extension "The Great Suspender". It was built to take advantage of Google's new 'tab discarding' functionality which is essentially a native implementation of tab suspension.
This implementation is more robust and performant, both in the resources consumed by the extension, and the memory savings of the tab suspension. It is also compatible with chrome tab history syncing.

If you have suggestions or problems using the extension, please [submit a bug or a feature request](https://github.com/deanoemcke/thegreatdiscarder/issues/).

### Chrome Web Store

The Great Suspender is also [available via the official Chrome Web Store](https://chrome.google.com/webstore/detail/the-great-discarder/jlipbpadkjcklpeiajndiijbeieicbdh).

### Install as an extension from source

1. Download the **[latest available version](https://github.com/deanoemcke/thegreatdiscarder/releases/tag/v0.1.2)** and unarchive to your preferred location (whichever suits you).
2. Using **Google Chrome** browser, navigate to chrome://extensions/ and enable "Developer mode" in the upper right corner.
3. Click on the <kbd>Load unpacked extension...</kbd> button.
4. Browse to the src directory of the downloaded, unarchived release and confirm.

### Build from github

Dependencies: openssl, npm.

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

The extension in crx format will be inside the build/crx/ directory. You can drag it into [extensions] (chrome://extensions) to install locally.

### License

This work is licensed under a GNU GENERAL PUBLIC LICENSE (v2)

### Shoutouts

This package uses the indexedDb wrapper [db.js] (https://github.com/aaronpowell/db.js) written by Aaron Powell.
Thank you also to www.browserstack.com for providing free chrome testing tools.
