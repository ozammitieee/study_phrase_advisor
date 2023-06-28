/* Open popup window as a seperate window */
chrome.browserAction.onClicked.addListener(function (activeTab) {
  chrome.windows.create({
    url: chrome.runtime.getURL("popup.html"), type:
      "popup", height: 800, width: 600
  });
});


// Dictionary to store the content type of visited URL
var tabToMimeType = {};

/* Dictionary to store the HTML content of a visited web page */
var htmlContent = {};

/* Action to do when there is a message.
    This is mainly used to get the HTML code of the page.*/
chrome.runtime.onMessage.addListener(
  function (message, callback) {
    // Read registration code from local storage.
    var registration_code = get_registration();
    if (registration_code == null) {
      // Ignore
      return;
    }
    /* Get the HTML content */
    if (message.action == "getContent") {
      htmlContent[message.source] = message.data;
    } else {
      /* Do nothing */
    }
  }
);


chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {

  // Check if data collection is pause.
  if (localStorage.getItem(PAUSE) == 'true') {
    return
  }

  // Consider only URL visits that are loaded.
  // Other status is ignored.
  if (changeInfo.status != "complete") {
    return;
  }

  // Determine the openerTabId.
  var openerTabId = tab.openerTabId;
  if (typeof openerTabId === 'undefined') {
    // If the tab was not opened by another tab,
    // change the openerTabId as the tab ID itself.
    openerTabId = tabId;
  }

  // Read registration code from local storage.
  var registration_code = get_registration();
  if (registration_code == null) {
    // Do not send the request.
    return;
  }

  // Get content type
  var content_type = "unknown";
  if (tab.url in tabToMimeType) {
    content_type = tabToMimeType[tab.url];
    delete tabToMimeType[tab.url];
  }

  // Get content from dictionary
  var content = "";
  if (tab.url in htmlContent) {
    content = htmlContent[tab.url];
    delete htmlContent[tab.url];
  }

  // Build request object.
  json = {
    "registration_code": registration_code.registration_code,
    "tab_id": tabId, // The tab ID is the tab ID of the tab that fired the event.
    "opener_tab_id": openerTabId, // The tab ID that opened the current tab.
    "window_id": tab.windowId,
    "url": tab.url,
    "content_type": content_type,
    "content": content // The HTML content.
  };

  // Send request to the server
  $.post(API_URL + "user/visited_url.php", JSON.stringify(json));

});


chrome.webRequest.onHeadersReceived.addListener(function (details) {

  // Check if data collection is pause.
  if (localStorage.getItem(PAUSE) == 'true') {
    return
  }

  // Get the content type header from the request.
  var content_type = getHeaderFromHeaders(details.responseHeaders, "content-type");

  // If the content type cannot be retrieved, set to a default not to loose the call.
  if (content_type == null) {
    // Set to default value.
    content_type = "unknown";
  } else {
    // Extract the content type value.
    content_type = content_type.value;
  }

  // Get the URL from the request.
  var url = details.url;
  if (url == null) {
    // If there is no URL, do nothing.
    return;
  }

  // Update global dictionary
  tabToMimeType[url] = content_type;

}, {
  urls: ['*://*/*'],
  types: ['main_frame']
}, ['responseHeaders']);
