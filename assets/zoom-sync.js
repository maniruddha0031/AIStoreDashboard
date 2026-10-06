/* ============================================================
   App-wide zoom sync — keeps the page zoom level identical across
   every screen (index.html, settings.html and its ?section= views).

   Why this exists: the browser's own Ctrl+scroll / Ctrl+"+"/"-" zoom
   is remembered per exact URL, not per app. Since this app navigates
   between separate files (index.html, settings.html) and settings.html
   itself changes the URL via ?section=..., the browser was treating
   each one as a distinct page and remembering a different zoom % for
   each — so the same left-panel navigation could visibly "jump" size.

   Fix: stop relying on native browser zoom. Intercept the same
   gestures (Ctrl+scroll, Ctrl +/-/0) ourselves, store one shared zoom
   level in localStorage, and apply it via CSS zoom on <html> on every
   page load, before first paint. All pages then always render at the
   exact same zoom, regardless of which URL got navigated to last.
   ============================================================ */
(function(){
  var KEY = 'aidash_app_zoom_v1';
  var MIN = 50, MAX = 150, STEP = 5, KEY_STEP = 10;

  function clamp(z){ return Math.max(MIN, Math.min(MAX, Math.round(z))); }

  function readZoom(){
    var saved = parseFloat(localStorage.getItem(KEY));
    return (!saved || isNaN(saved)) ? 100 : clamp(saved);
  }

  /* A handful of screens (AI Hub, Pulse Index, the Eva fullscreen chat
     panel) size themselves off `calc(100vh - Npx)` instead of a %-height
     chain, to get a "fits the viewport, scrolls internally" box without
     needing every ancestor div to pass a height down. `100vh` itself has
     the exact same zoom problem `body.h-screen` had (see style.css): it
     keeps resolving against the true unzoomed window height while the
     box it sizes renders inside the zoomed page, so at low zoom that box
     comes out far shorter than the visible window. Rather than ban `vh`
     from those screens, this keeps a zoom-corrected replacement — the
     CSS pixel height `100vh` would need to be *within the zoomed
     coordinate system* — live on <html> as --app-100vh, which those
     rules read via calc(var(--app-100vh) - Npx) instead of 100vh. */
  function updateVh(z){
    var logical = window.innerHeight / (z / 100);
    document.documentElement.style.setProperty('--app-100vh', logical + 'px');
  }

  function apply(z){
    document.documentElement.style.zoom = z + '%';
    updateVh(z);
  }

  apply(readZoom());

  window.addEventListener('resize', function(){ updateVh(readZoom()); });

  window.appZoom = {
    get: readZoom,
    set: function(z){
      z = clamp(z);
      localStorage.setItem(KEY, z);
      apply(z);
      window.dispatchEvent(new CustomEvent('aidash-zoom-change', { detail: z }));
      return z;
    }
  };

  document.addEventListener('wheel', function(e){
    if(!e.ctrlKey) return;
    e.preventDefault();
    window.appZoom.set(readZoom() + (e.deltaY < 0 ? STEP : -STEP));
  }, { passive:false });

  document.addEventListener('keydown', function(e){
    if(!e.ctrlKey) return;
    if(e.key === '0'){ e.preventDefault(); window.appZoom.set(100); return; }
    if(e.key === '+' || e.key === '='){ e.preventDefault(); window.appZoom.set(readZoom() + KEY_STEP); return; }
    if(e.key === '-' || e.key === '_'){ e.preventDefault(); window.appZoom.set(readZoom() - KEY_STEP); return; }
  }, { passive:false });

  window.addEventListener('storage', function(e){
    if(e.key === KEY) apply(readZoom());
  });
})();
