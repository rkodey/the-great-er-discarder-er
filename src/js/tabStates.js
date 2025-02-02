(function (window) {

  'use strict';

  var self = {

    DB_SERVER: 'tgd',
    DB_VERSION: '1',

    TAB_STATES: 'tabStates',

    getTabState: getTabState,
    setTabState: setTabState,
    removeTabState: removeTabState,
    clearTabStates: clearTabStates

  };

  window.tabStates = self;

  const noop = function() {};

  function getTabState(tabId, callback) {

    // console.log('Getting tabState for id: ' + tabId);
    var server;

    getDb()
      .then(function (s) {
        server = s;
        return server.query(self.TAB_STATES).filter('id', tabId).execute();
      })
      .then(function (results) {
        callback(results.length > 0 ? results[0] : null);
      })
      .catch(function (e) {
        console.error(e);
      });
  }

  function setTabState(tabState) {

    // console.log('Setting tabState for id: ' + tabState.id);
    var server;

    //first check to see if session id already exists
    getDb()
      .then(function (s) {
        server = s;
        return server.query(self.TAB_STATES).filter('id', tabState.id).execute();
      })
      .then(function (result) {
        if (result.length > 0) {
          return server.update(self.TAB_STATES, tabState);
        } else {
          return server.add(self.TAB_STATES, tabState);
        }
      })
      .catch(function () {
        return server.update(self.TAB_STATES, tabState);
      })
      .catch(function (e) {
        console.error(e);
      });
  }

  function removeTabState(tabState, callback) {

    // console.log('Removing tabState with id: ' + tabState.id);
    var server;
    callback = callback || noop;

    getDb()
      .then(function (s) {
        server = s;
        return server.query(self.TAB_STATES).filter('id', tabState.id).execute();

      })
      .then(function (result) {
        if (result.length > 0) {
          server.remove(self.TAB_STATES, tabState.id);
        }
      })
      .then(callback)
      .catch(function (e) {
        console.error(e);
      });
  }

  function clearTabStates(callback) {

    // console.log('Removing all tabStates');
    callback = callback || noop;

    getDb()
      .then(function (server) {
        server.clear(self.TAB_STATES);
        callback();
      })
      .catch(function (e) {
        console.error(e);
      });
  }

  // PRIVATE FUNCTIONS

  function getSchema () {
    return {
      [self.TAB_STATES]: {
        key: {
          keyPath: 'id'
        },
        indexes: {
          id: {}
        }
      }
    };
  }

  function getDb () {
    return db.open({
      server: self.DB_SERVER,
      version: self.DB_VERSION,
      schema: getSchema
    });
  }

}(globalThis));
