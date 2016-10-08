(global => {
  'use strict';

  // Load the sw-toolbox library.
  importScripts('bower_components/sw-toolbox/sw-toolbox.js');
  
  // Debug mode
  //global.toolbox.options.debug = true;

  var AppManifest = '{"name": "Moby-Dick; or, The Whale", "short_name": "Moby-Dick", "start_url": "index.html", "display": "standalone", "icons": [{"src": "icon-large.png", "sizes": "192x192", "type": "image/png"}]}'

  toolbox.precache([
      'css/mobydick.css',
      'fonts/STIXGeneral.otf',
      'fonts/STIXGeneralBol.otf',
      'fonts/STIXGeneralBolIta.otf',
      'fonts/STIXGeneralItalic.otf'
    ]);

  global.toolbox.router.get('appmanifest.json', function(request) {
    return new Response(AppManifest);
  });

  global.toolbox.router.default = global.toolbox.fastest;

  // Ensure that our service worker takes control of the page as soon as possible.
  global.addEventListener('install', event => event.waitUntil(global.skipWaiting()));
  global.addEventListener('activate', event => event.waitUntil(global.clients.claim()));
})(self);