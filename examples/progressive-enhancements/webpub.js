/* 
This is the 1.0 version of the Web Publication JS prototype.

It now supports:
- caching resources necessary for reading the publication offline
- adding navigation to the previous and/or next resource in the publication

This script checks if the manifest file is stored in the cache, and only precaches resources if it isn't.

It can extract the location of the Web Publication Manifest:
- either directly from a link in the page
- or indirectly through a Web App Manifest

This prototype is very chatty, check your console to see what's going on.

Check the full list of potential features at: 
https://github.com/HadrienGardeur/webpub-manifest/wiki/Web-Publication-JS
*/

(function() {

  if (navigator.serviceWorker) {
    //Basic SW
    navigator.serviceWorker.register('/webpub-manifest/sw.js');
  
    navigator.serviceWorker.ready.then(function() {
      console.log('SW ready');
    }); 
  };
  
  var manifest = document.querySelector("link[rel='manifest'][type='application/webpub+json']");
  if(manifest) {var manifest_url = manifest.href};
  var appmanifest = document.querySelector("link[rel='manifest'][type='application/manifest+json']");
  if(appmanifest) {var appmanifest_url = appmanifest.href};

  if (manifest_url) {
    verifyAndCacheManifest(manifest_url).catch(function() {});
    addNavigation(manifest_url).catch(function() {});
  } else if (appmanifest_url && !manifest_url) {
    var manifestPromise = getManifestFromAppManifest(appmanifest_url);
    manifestPromise.then(function(manifest_url){verifyAndCacheManifest(manifest_url)}).catch(function() {});
    manifestPromise.then(function(manifest_url){addNavigation(manifest_url)}).catch(function() {});
  }
  else {
      console.log('No manifest detected');
  };


  function getManifest(url) {
    return fetch(url).catch(function() {
      return caches.match(url);
    }).then(function(response) {
      return response.json();
    })
  };

  function getManifestFromAppManifest(url) {
    return fetch(appmanifest_url).then(function(response) { return response.json() }).then(function(document){
      if (document.publication) {
        var manifest_url = new URL(document.publication, appmanifest_url).href;
        console.log("Detected publication in Web App Manifest at: "+manifest_url);
        return manifest_url;
      } else {
        console.log("Could not find a Web Publication Manifest");
        throw new Error("Could not find a Web Publication Manifest");
      }
    })
  }

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

  function addNavigation(url) {
    return getManifest(url).then(function(json) { return (json.readingOrder || json.spine)} ).then(function(spine) {
      var current_index = spine.findIndex(function(element) {
        var element_url = new URL(element.href, url);
        return element_url.href == location.href
      })
      
      if (current_index >= 0) {

        console.log("Current position in spine: "+current_index);
        var navigation = document.querySelector("nav.publication");
        if (navigation) {
          navigation.innerHTML = "";
          navigation.style = "text-align: right;"
        } else {
          navigation = document.createElement("nav");
          navigation.className = "publication";
          navigation.style = "text-align: right;";
          document.body.appendChild(navigation);
        };

        if (current_index > 0) {
          console.log("Previous document is: "+spine[current_index - 1].href);
          var previous = document.createElement("a");
          previous.href = new URL(spine[current_index - 1].href, url).href;
          previous.rel = "prev;"
          previous.textContent = "< Previous";
          navigation.appendChild(previous);
          navigation.appendChild( document.createTextNode( '\u00A0' ) );
        };
        
        if (current_index < (spine.length-1)) {
          console.log("Next document is: "+spine[current_index + 1].href);
          var next = document.createElement("a");
          next.href = new URL(spine[current_index + 1].href, url).href;
          next.rel = "next";
          next.textContent = "Next >";
          navigation.appendChild( document.createTextNode( '\u00A0' ) );
          navigation.appendChild(next);
        };
      }
    });
  };

}());
