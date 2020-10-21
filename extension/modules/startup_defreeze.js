"use strict";

// discard all tabs in all windows
function discardAllTabs(autoNewTab, discardPinned) {
  // discard all tabs at startup
  chrome.tabs.query({}, function(tabs) {
    if (autoNewTab) {
      var windowIds = {};

      // First check for new tabs in all windows
      for (var i = 0; i < tabs.length; ++i) {
        var tab = tabs[i];
        if (!windowIds.hasOwnProperty(tab.windowId)) {
          windowIds[tab.windowId] = [];
        }
        if (isNewTab(tab)) {
          windowIds[tab.windowId].push(tab.index);
        }
      }

      for (var wid in windowIds) {
        if (windowIds[wid].length == 0) {
          chrome.tabs.create({ windowId: Number.parseInt(wid), active: true });
        }
      }
    }

    for (var i = 0; i < tabs.length; ++i) {
      requestTabSuspension(autoNewTab, discardPinned, tabs[i]);
    }

  });
}

// request tab suspension
function requestTabSuspension(autoNewTab, discardPinned, tab) {
  if (tab === undefined) {
    return;
  }

  if (isNewTab(tab)) {
    chrome.tabs.update(tab.id, { active: true });
    return;
  }

  if (isDiscarded(tab) || isSpecialTab(tab)) {
    return;
  }

  if (isActiveTab(tab) && !autoNewTab) {
    return;
  }

  if (tab.pinned && !discardPinned) {
    return;
  }

  discardTab(tab);
}

// check to see if the tab is discarded
function isDiscarded(tab) {
  return tab.discarded;
}

// check to see if the tab is special
function isSpecialTab(tab) {
  var url = tab.url;

  if (url.indexOf('chrome-extension:') === 0 ||
    url.indexOf('chrome:') === 0 ||
    url.indexOf('chrome-devtools:') === 0 ||
    url.indexOf('file:') === 0 ||
    url.indexOf('chrome.google.com/webstore') >= 0) {
    return true;
  }

  return false;
}

// discard tab
function discardTab(tab) {
  if (isNewTab(tab)) {
    chrome.tabs.update(tab.id, { active: true });
  }
  else {
    chrome.tabs.update(tab.id, { active: false }, function() {
      chrome.tabs.discard(tab.id, function(discardedTab) {
        if (chrome.runtime.lastError) {
          log(chrome.runtime.lastError.message);
        }
      });
    });
  }
}

function log() {
  chrome.extension.getBackgroundPage().console.log.apply(console, arguments);
}

function isNewTab(tab) {
  return tab.url === 'chrome://newtab/';
}

function isActiveTab(tab) {
  return tab.active;
}

chrome.runtime.onStartup.addListener(function() {
  // put all tabs to sleep
  var autoNewTab = localStorage.getItem('autoNewTab') == 'true';
  var discardPinned = localStorage.getItem('discardPinned') == 'true';
  discardAllTabs(autoNewTab, discardPinned);

  // open new tab to prevent loading last saved tab
  var action_url = "chrome://newtab/";
  chrome.tabs.create({ url: action_url });
});
