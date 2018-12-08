/* Simple prototype for a Web App for comics based on an image. */

(function() {

  if (navigator.serviceWorker) {
    //HINT: Make sure that the path to your Service Worker is correct
    navigator.serviceWorker.register('/webpub-manifest/sw.js');
  
    navigator.serviceWorker.ready.then(function() {
      console.log('SW ready');
    }); 
  };
  
  var DEFAULT_MANIFEST = "https://hadriengardeur.github.io/webpub-manifest/examples/comics/manifest.json";
  var current_url_params = new URLSearchParams(location.href);

  if (current_url_params.has("href")) {
    console.log("Found manifest in params")
    var manifest_url = current_url_params.get("href");
  } else {
    var manifest_url = DEFAULT_MANIFEST;
  };

  var left = document.getElementById("left-page");
  var right = document.getElementById("right-page");
  var next = document.querySelector("a[rel=next]");
  var previous = document.querySelector("a[rel=prev]");
  
  if (navigator.serviceWorker) verifyAndCacheManifest(manifest_url).catch(function() {});
  initializeNavigation(manifest_url).catch(function() {});
  
  var mc = new Hammer(left);

  mc.on("swipeleft", function(event) {
    if (next.hasAttribute("href")) {
      left.src = next.href;
      window.scrollTo(0,0);
      updateNavigation(manifest_url).catch(function() {});
    };
  });

  mc.on("swiperight", function(event) {
    if ( previous.hasAttribute("href")) {
      left.src = previous.href;
      window.scrollTo(0,0);
      updateNavigation(manifest_url).catch(function() {});
    };
  });

  next.addEventListener("click", function(event) {
    if (next.hasAttribute("href")) {
      left.src = next.href;
      window.scrollTo(0,0);
      updateNavigation(manifest_url).catch(function() {});
    };
    event.preventDefault();
  });

  previous.addEventListener("click", function(event) {
    if ( previous.hasAttribute("href")) {
      left.src = previous.href;
      window.scrollTo(0,0);
      updateNavigation(manifest_url).catch(function() {});
    };
    event.preventDefault();
  });

  function getManifest(url) {
    return fetch(url).catch(function() {
      return caches.match(url);
    }).then(function(response) {
      return response.json();
    })
  };

  function verifyAndCacheManifest(url) {
    return caches.open(url).then(function(cache) {
      return cache.match(url).then(function(response){
        if (!response) {
          console.log("No cache key found");
          console.log('Caching manifest at: '+url);
          return cacheManifest(url);
        } else {
          console.log("Found cache key");
        };
      })
    });
  };
  
  function cacheURL(data, manifest_url) {
    return caches.open(manifest_url).then(function(cache) {
      return cache.addAll(data.map(function(url) {
        console.log("Caching "+url);
        return new URL(url, manifest_url);
      }));
    });
  };

  function cacheManifest(url) {
    var manifestJSON = getManifest(url);
    return Promise.all([cacheSpine(manifestJSON, url), cacheResources(manifestJSON, url)])
  };

  function cacheSpine(manifestJSON, url) {
    return manifestJSON.then(function(manifest) {
      var spn = manifest.readingOrder || manifest.spine;
      return spn.map(function(el) { return el.href});}).then(function(data) {
        data.push(url);
        return cacheURL(data, url);})
  };

  function cacheResources(manifestJSON, url) {
    return manifestJSON.then(function(manifest) {
      return manifest.resources.map(function(el) { return el.href});}).then(function(data) {return cacheURL(data, url);})
  };

  function initializeNavigation(url) {
    return getManifest(url).then(function(json) { 
      var title = json.metadata.title;
      console.log("Title of the comics: "+title);
      document.querySelector("title").textContent = title;
      return (json.readingOrder || json.spine);
    }).then(function(spine) {
      
      var start_url = new URL(spine[0].href, url).href;
      console.log("Set page to: "+start_url)
      
      //Set start page
      left.src = start_url;

      //Set next button
      console.log("Next document is: "+spine[1].href);
      next.href = new URL(spine[1].href, url).href;

    });
  };

  function updateNavigation(url) {
    console.log("Getting "+url)
    return getManifest(url).then(function(json) { return (json.readingOrder || json.spine)} ).then(function(spine) {

      var current_index = spine.findIndex(function(element) {
        var element_url = new URL(element.href, url);
        return element_url.href == left.src
      })
      
      if (current_index >= 0) {

        if (current_index > 0) {
          console.log("Previous document is: "+spine[current_index - 1].href);
          previous.href = new URL(spine[current_index - 1].href, url).href;
        } else {
          previous.removeAttribute("href");
        };
        
        if (current_index < (spine.length-1)) {
          console.log("Next document is: "+spine[current_index + 1].href);
          next.href = new URL(spine[current_index + 1].href, url).href;
        } else {
          next.removeAttribute("href");
        };
      }
    });
  };

}());
