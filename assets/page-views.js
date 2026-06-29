(function () {
  var namespace = "tarahome-ai";
  var apiBase = "https://api.counterapi.dev/v1";
  var liveHosts = { "tarahome.ai": true, "www.tarahome.ai": true };
  var styleId = "tara-page-views-style";
  var badge = null;
  var activeKey = "";
  var activeRequest = 0;
  var attachTimer = 0;
  var observed = false;

  function isLiveHost() {
    return !!liveHosts[window.location.hostname];
  }

  function canonicalPath() {
    var fallback = window.location.pathname || "/";
    var canonical = document.querySelector('link[rel="canonical"]');

    if (!canonical || !canonical.href) {
      return fallback;
    }

    try {
      var url = new URL(canonical.href, window.location.href);
      if (liveHosts[url.hostname]) {
        return url.pathname || fallback;
      }
    } catch (error) {
      return fallback;
    }

    return fallback;
  }

  function pageKey() {
    var path = canonicalPath().toLowerCase();
    path = path.replace(/\/index\.html$/, "/");
    path = path.replace(/\.html$/, "");
    path = path.replace(/\/+$/, "");

    if (!path || path === "/") {
      return "home";
    }

    return path
      .replace(/^\/+/, "")
      .replace(/\/+/g, "--")
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 140) || "home";
  }

  function formatCount(value) {
    return new Intl.NumberFormat("en-US").format(value);
  }

  function storageGet(key) {
    try {
      return window.sessionStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function storageSet(key, value) {
    try {
      window.sessionStorage.setItem(key, value);
    } catch (error) {
      return;
    }
  }

  function injectStyle() {
    if (document.getElementById(styleId)) {
      return;
    }

    var style = document.createElement("style");
    style.id = styleId;
    style.textContent = [
      ".tara-page-views{align-items:center;background:rgba(65,168,103,.12);border:1px solid rgba(65,168,103,.34);border-radius:999px;color:var(--ink,#16382f);display:inline-flex;font-family:Avenir,Inter,ui-sans-serif,system-ui,sans-serif;font-size:.82rem;font-weight:900;gap:.35rem;line-height:1;margin-top:14px;min-height:32px;padding:0 12px;text-transform:uppercase;width:max-content}",
      ".tara-page-views[hidden]{display:none!important}",
      ".article-meta .tara-page-views,.tara-rx-article-meta .tara-page-views{color:inherit;margin-top:0;min-height:26px;padding:0 10px}",
      ".tara-rx .tara-page-views,[data-tara-theme=\"dark\"] .tara-page-views{background:rgba(215,255,182,.1);border-color:rgba(215,255,182,.24);color:inherit}",
      ".tara-page-views-number{font-variant-numeric:tabular-nums}",
      "@media(max-width:520px){.tara-page-views{font-size:.76rem;min-height:29px;padding:0 10px}}"
    ].join("");
    document.head.appendChild(style);
  }

  function createBadge() {
    if (badge) {
      return badge;
    }

    badge = document.createElement("span");
    badge.className = "tara-page-views";
    badge.hidden = true;
    badge.setAttribute("aria-label", "Total page views");
    badge.innerHTML = '<span class="tara-page-views-number">0</span><span>Total views</span>';
    return badge;
  }

  function currentAnchor() {
    return document.querySelector(".article-meta, .tara-rx-article-meta");
  }

  function placeBadge() {
    var node = createBadge();
    var meta = currentAnchor();
    var heading = document.querySelector("main h1, #root h1, h1");

    if (meta) {
      if (node.parentElement !== meta) {
        meta.appendChild(node);
      }
      return;
    }

    if (heading) {
      if (node.previousElementSibling !== heading) {
        heading.insertAdjacentElement("afterend", node);
      }
      return;
    }

    if (!node.parentElement && document.body) {
      document.body.appendChild(node);
    }
  }

  function scheduleAttach() {
    window.clearTimeout(attachTimer);
    attachTimer = window.setTimeout(placeBadge, 60);
  }

  function updateBadge(count) {
    var node = createBadge();
    var countNode = node.querySelector(".tara-page-views-number");
    if (countNode) {
      countNode.textContent = formatCount(count);
    }
    node.hidden = false;
    placeBadge();
  }

  function hideBadge() {
    if (badge) {
      badge.hidden = true;
    }
  }

  function parseCount(data) {
    var value = data && (data.count || data.value || (data.counter && data.counter.count));
    var number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : null;
  }

  function requestCount(key, shouldIncrement, requestId) {
    var url = apiBase + "/" + namespace + "/" + encodeURIComponent(key) + (shouldIncrement ? "/up" : "");

    return fetch(url, {
      cache: "no-store",
      credentials: "omit",
      mode: "cors"
    }).then(function (response) {
      if (!response.ok && !shouldIncrement) {
        return requestCount(key, true, requestId);
      }
      if (!response.ok) {
        throw new Error("Counter request failed");
      }
      return response.json();
    }).then(function (data) {
      var count = parseCount(data);
      if (count === null || requestId !== activeRequest || key !== activeKey) {
        return;
      }
      storageSet("tara-page-view-counted:" + key, "1");
      updateBadge(count);
    }).catch(function () {
      if (requestId === activeRequest && key === activeKey) {
        hideBadge();
      }
    });
  }

  function countCurrentPage() {
    if (!isLiveHost()) {
      return;
    }

    injectStyle();
    placeBadge();

    var key = pageKey();
    var countedKey = "tara-page-view-counted:" + key;
    var shouldIncrement = storageGet(countedKey) !== "1";

    if (key !== activeKey) {
      activeKey = key;
      activeRequest += 1;
      hideBadge();
      requestCount(key, shouldIncrement, activeRequest);
      return;
    }

    placeBadge();
  }

  function watchRenderChanges() {
    if (observed || !window.MutationObserver || !document.body) {
      return;
    }

    observed = true;
    new MutationObserver(function () {
      if (activeKey) {
        scheduleAttach();
      }
    }).observe(document.body, { childList: true, subtree: true });
  }

  function patchHistoryMethod(name) {
    var original = window.history && window.history[name];
    if (!original) {
      return;
    }

    window.history[name] = function () {
      var result = original.apply(this, arguments);
      window.setTimeout(countCurrentPage, 0);
      return result;
    };
  }

  function start() {
    if (!isLiveHost()) {
      return;
    }

    countCurrentPage();
    watchRenderChanges();
    patchHistoryMethod("pushState");
    patchHistoryMethod("replaceState");
    window.addEventListener("popstate", function () {
      window.setTimeout(countCurrentPage, 0);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
