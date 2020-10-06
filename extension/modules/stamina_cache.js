let cache = '2592000'
let cacheForce = ''

chrome.webRequest.onHeadersReceived.addListener(
  function(obj) {
    var headers = obj.responseHeaders,
      cont = false

    for (let i = 0; i < headers.length && !cont; i = i + 1) {
      const flag = headers[i].name.toLowerCase()
      if (flag === 'cache-control') {
        if (cacheForce) {
          headers.splice(i, 1)
        }
        else {
          cont = true
        }

        break
      }
    }

    if (!cont) {
      headers.push({
        name: 'cache-control',
        value: 'private, max-age=' + cache
      })
    }

    return {
      responseHeaders: headers
    }
  }, {
    urls: ['<all_urls>']
  }, ['blocking', 'responseHeaders']
)

chrome.runtime.onInstalled.addListener(function() {
  cache = '2592000'
  cacheForce = true

  chrome.storage.local.set({
    cache: cache,
    cacheForce: cacheForce
  })
})

chrome.storage.local.get(function(obj) {
  cache = obj.cache
  cacheForce = !!obj.cacheForce
})
