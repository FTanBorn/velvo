/*
 * SPDX-License-Identifier: GPL-3.0-or-later
 * Velvo — çekirdek: yardımcılar, Xtream API, kayıtlı veriler, odak motoru, yönlendirici.
 * Sadece ES5 (webOS 3.x / Chrome 38): let/const, ok fonksiyon, template string,
 * Object.assign, Array.find, String.includes/startsWith, Element.closest YOK.
 */
var App = (function () {
  'use strict';

  var A = {};

  // ---------------------------------------------------------------- yardımcılar

  A.$ = function (sel, root) { return (root || document).querySelector(sel); };
  A.$$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  A.h = function (tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };

  A.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  };

  A.extend = function (dst) {
    for (var i = 1; i < arguments.length; i++) {
      var src = arguments[i];
      if (!src) continue;
      for (var k in src) if (src.hasOwnProperty(k)) dst[k] = src[k];
    }
    return dst;
  };

  A.parentWith = function (el, cls, stop) {
    while (el && el !== stop && el !== document.body) {
      if (el.classList && el.classList.contains(cls)) return el;
      el = el.parentNode;
    }
    return null;
  };

  var logs = [];
  A.log = function (msg) {
    logs.push(new Date().toISOString().slice(11, 19) + ' ' + msg);
    if (logs.length > 400) logs.shift();
    if (window.console) console.log('[sahne] ' + msg);
  };
  window.__sahneLogs = logs;
  window.onerror = function (msg, src, line) { A.log('HATA: ' + msg + ' @' + String(src).split('/').pop() + ':' + line); };

  A.fmtTime = function (sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    var h = Math.floor(sec / 3600), m = Math.floor(sec / 60) % 60, s = sec % 60;
    return (h ? h + ':' + (m < 10 ? '0' : '') : '') + m + ':' + (s < 10 ? '0' : '') + s;
  };

  A.fmtDuration = function (secOrHms) {
    var sec = secOrHms;
    if (typeof secOrHms === 'string') {
      var p = secOrHms.split(':');
      sec = p.length === 3 ? (+p[0]) * 3600 + (+p[1]) * 60 + (+p[2]) : +secOrHms;
    }
    sec = Math.round(sec || 0);
    if (!sec) return '';
    var h = Math.floor(sec / 3600), m = Math.round((sec % 3600) / 60);
    return h ? h + ' sa ' + m + ' dk' : m + ' dk';
  };

  var toastTimer = null;
  A.toast = function (text) {
    var t = A.$('#toast');
    t.textContent = text;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2600);
  };

  // ---------------------------------------------------------------- ikonlar

  A.icon = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
    film: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/></svg>',
    series: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 3l4 4 4-4"/></svg>',
    live: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="2"/><path d="M7.8 16.2a6 6 0 010-8.4M16.2 7.8a6 6 0 010 8.4M5 19a10 10 0 010-14M19 5a10 10 0 010 14"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z"/></svg>',
    heartFill: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>',
    replay: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 108-8H8"/><path d="M8 1L5 4l3 3"/></svg>',
    trailer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9l5 3-5 3z" fill="currentColor"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>'
  };

  // ---------------------------------------------------------------- başlık temizleme

  var PLATFORMS = { NF: 'Netflix', DSNP: 'Disney+', AMZN: 'Prime Video', 'TV+': 'Apple TV+', HBO: 'HBO Max', HMAX: 'HBO Max' };

  // "#001 | Esaretin Bedeli (1994)" / "Örümcek Adam | 2021 | 8.6 | IMAX" -> başlık, yıl, puan, rozetler
  A.clean = function (name) {
    var out = { title: String(name || ''), year: '', rating: '', badges: [], rank: '' };
    var s = out.title;
    var m = /^#0*(\d+)\s*\|\s*(.*)$/.exec(s);
    if (m) { out.rank = '#' + m[1]; s = m[2]; }
    var parts = s.split('|').map(function (p) { return p.trim(); }).filter(function (p) { return p; });
    var title = parts[0] || '';
    for (var i = 1; i < parts.length; i++) {
      var p = parts[i];
      if (/^(19|20)\d\d$/.test(p)) out.year = p;
      else if (/^\d+(\.\d+)?$/.test(p)) out.rating = p;
      else if (PLATFORMS[p]) out.badges.push(PLATFORMS[p]);
      else if (/^extended version$/i.test(p)) out.badges.push('Uzun versiyon');
      else out.badges.push(p);
    }
    m = /\s*\((\d{4})\)\s*$/.exec(title);
    if (m) { out.year = out.year || m[1]; title = title.slice(0, m.index); }
    out.title = title.trim();
    return out;
  };

  A.catName = function (n) { return String(n || '').replace(/^[A-Z]{2}\s*[^\w\s]\s*/, '').trim(); };

  // TMDB görsellerini istenen boyutta ister; bozuk/boş adresleri eler
  A.img = function (url, size) {
    if (!url || !/\.(jpe?g|png|webp)(\?|$)/i.test(url)) return '';
    if (/image\.tmdb\.org\/t\/p\//.test(url)) return url.replace(/\/t\/p\/[^\/]+\//, '/t/p/' + size + '/');
    return url;
  };

  A.resBadge = function (w) {
    w = +w || 0;
    return w >= 3800 ? '4K' : w >= 1900 ? '1080p' : w >= 1260 ? '720p' : w ? 'SD' : '';
  };

  // Türkçe büyük/küçük harf ve aksan duyarsız arama anahtarı
  A.norm = function (s) {
    return String(s || '').replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase()
      .replace(/[çğıöşüâîû]/g, function (c) { return { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u', 'â': 'a', 'î': 'i', 'û': 'u' }[c]; });
  };

  // ---------------------------------------------------------------- kayıtlı veriler

  A.store = {
    get: function (k, def) {
      try { var v = localStorage.getItem(k); return v == null ? def : JSON.parse(v); } catch (e) { return def; }
    },
    set: function (k, v) {
      try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { A.log('kayıt hatası: ' + k); }
    }
  };

  // ---- profiller: her profilin kendi tercihleri, izleme geçmişi ve listesi var
  A.PROFILE_COLORS = ['#e6005c', '#1fc7a6', '#f5a623', '#3d7cff', '#8b5cf6', '#ff6b4a'];
  A.profiles = {
    list: function () { return A.store.get('sahne_profiles', []); },
    save: function (l) { A.store.set('sahne_profiles', l); },
    get: function (id) { return this.list().filter(function (p) { return p.id === id; })[0] || null; },
    current: function () { return this.get(A.profileId) || this.list()[0]; },
    add: function (name, color) {
      var l = this.list(), id = 'p' + Date.now().toString(36);
      l.push({ id: id, name: name, color: color });
      this.save(l);
      return id;
    },
    update: function (id, name, color) {
      var l = this.list();
      l.forEach(function (p) { if (p.id === id) { p.name = name; p.color = color; } });
      this.save(l);
    },
    remove: function (id) {
      this.save(this.list().filter(function (p) { return p.id !== id; }));
      ['sahne_prefs_', 'sahne_progress_', 'sahne_fav_', 'sahne_trackmem_'].forEach(function (k) { try { localStorage.removeItem(k + id); } catch (e) { /* yoksay */ } });
    }
  };

  // Profillerden önceki sürümün verilerini ilk profile taşı
  (function migrate() {
    if (A.store.get('sahne_profiles', null)) return;
    A.store.set('sahne_profiles', [{ id: 'p1', name: 'Profil 1', color: 0 }]);
    ['sahne_prefs', 'sahne_progress', 'sahne_fav'].forEach(function (k) {
      try {
        var v = localStorage.getItem(k);
        if (v != null) { localStorage.setItem(k + '_p1', v); localStorage.removeItem(k); }
      } catch (e) { /* yoksay */ }
    });
    A.store.set('sahne_active', 'p1');
  }());

  // Profile özel anahtar: 'sahne_fav' -> 'sahne_fav_p1'
  A.pk = function (base) { return base + '_' + A.profileId; };

  // TV'nin dili (ör. 'tr', 'de'); ses ve altyazı tercihinin varsayılanı
  A.homeLang = String(navigator.language || 'en').toLowerCase().split('-')[0] || 'en';
  var PREF_DEFAULTS = { uiLang: 'auto', audio: A.homeLang, sub: A.homeLang, subOffWithTrAudio: true, subSize: 2, subColor: 2, subBg: 'none', subPos: 0 };
  A.useProfile = function (id) {
    if (!A.profiles.get(id)) id = (A.profiles.list()[0] || {}).id;
    A.profileId = id;
    A.store.set('sahne_active', id);
    A.prefs = A.extend({}, PREF_DEFAULTS, A.store.get(A.pk('sahne_prefs'), {}));
    if (A.applyLang) A.applyLang();
  };
  A.savePrefs = function () { A.store.set(A.pk('sahne_prefs'), A.prefs); };
  A.useProfile(A.store.get('sahne_active', 'p1'));

  // İzleme ilerlemesi: 'm<id>' film, 'e<id>' bölüm, 's<id>' dizinin son izlenen bölümü
  A.progress = {
    all: function () { return A.store.get(A.pk('sahne_progress'), {}); },
    get: function (key) { return this.all()[key] || null; },
    put: function (key, val) {
      var all = this.all();
      if (val) all[key] = A.extend({}, all[key], val, { updated: Date.now() });
      else delete all[key];
      // en eski kayıtları buda
      var keys = Object.keys(all);
      if (keys.length > 400) {
        keys.sort(function (a, b) { return all[a].updated - all[b].updated; });
        keys.slice(0, keys.length - 400).forEach(function (k) { delete all[k]; });
      }
      A.store.set(A.pk('sahne_progress'), all);
    },
    continueList: function () {
      var all = this.all(), out = [];
      Object.keys(all).forEach(function (k) {
        var v = all[k];
        if (k.charAt(0) === 'm' && v.dur && v.t / v.dur < 0.95 && v.t > 30) out.push(A.extend({ key: k }, v));
        if (k.charAt(0) === 's' && !v.hidden) out.push(A.extend({ key: k }, v));
      });
      out.sort(function (a, b) { return b.updated - a.updated; });
      return out.slice(0, 20);
    }
  };

  A.fav = {
    list: function () { return A.store.get(A.pk('sahne_fav'), []); },
    has: function (type, id) { return this.list().some(function (f) { return f.type === type && String(f.id) === String(id); }); },
    // Listeye ekler ya da çıkarır; eklendiyse true döner
    toggle: function (item) {
      var l = this.list(), idx = -1;
      for (var i = 0; i < l.length; i++) if (l[i].type === item.type && String(l[i].id) === String(item.id)) idx = i;
      if (idx >= 0) l.splice(idx, 1);
      else l.unshift({ type: item.type, id: item.id, title: item.title, poster: item.poster, year: item.year, rating: item.rating, badges: item.badges || [] });
      A.store.set(A.pk('sahne_fav'), l);
      return idx < 0;
    }
  };

  A.avatar = function (p, size) {
    p = p || { name: '?', color: 0 };
    var col = A.PROFILE_COLORS[p.color % A.PROFILE_COLORS.length];
    var ch = String(p.name || '?').charAt(0), letter = ch === 'i' ? 'İ' : ch === 'ı' ? 'I' : ch.toUpperCase();
    return '<span class="av" style="width:' + size + 'px; height:' + size + 'px; line-height:' + size + 'px; font-size:' + Math.round(size * 0.45) + 'px; background:' + col + '">' + A.esc(letter) + '</span>';
  };

  // ---------------------------------------------------------------- Xtream API

  A.creds = A.store.get('iptv_creds', null);
  var cache = {}, inflight = {};

  // ---------------------------------------------------------------- M3U listesi
  // Liste bir kez indirilip ayrıştırılır; yanıtlar Xtream API biçiminde üretilir, böylece
  // ekranlar iki kaynağı ayırt etmeden çalışır. Kimlik: { type: 'm3u', url: '...' }

  var M3U = { data: null, waiting: null };
  var EP_RE = /^(.*?)[\s\-–:._|]*S(\d{1,2})\s*[.\-_]?\s*E(\d{1,3})(?![0-9])[\s\-–:._|]*(.*)$/i;

  function parseAttrs(s) {
    var o = {}, re = /([\w-]+)="([^"]*)"/g, m;
    while ((m = re.exec(s))) o[m[1].toLowerCase()] = m[2];
    return o;
  }

  function classify(name, url) {
    var u = url.split('?')[0].toLowerCase();
    var ext = (/\.([a-z0-9]{2,4})$/.exec(u) || [])[1] || '';
    var file = /^(mkv|mp4|avi|mov|m4v|wmv|webm)$/.test(ext);
    if (/\/series\//.test(u) || (file && EP_RE.test(name))) return { type: 'series', ext: ext };
    if (/\/movie\//.test(u) || file) return { type: 'movie', ext: ext };
    return { type: 'live', ext: ext };
  }

  function parseM3U(text) {
    var lines = text.split(/\r?\n/), out = [], cur = null;
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i].trim();
      if (!l) continue;
      if (l.indexOf('#EXTINF') === 0) {
        // adı ayıran virgül: tırnak içindeki virgüller (group-title="A, B") sayılmaz
        var inQ = false, idx = -1;
        for (var k = 0; k < l.length; k++) {
          var ch = l.charAt(k);
          if (ch === '"') inQ = !inQ;
          else if (ch === ',' && !inQ) { idx = k; break; }
        }
        var attrs = parseAttrs(idx >= 0 ? l.slice(0, idx) : l);
        // tvg-backdrop ve tvg-plot standart dışı, isteğe bağlı Velvo alanları (yatay görsel ve özet)
        cur = { name: (idx >= 0 ? l.slice(idx + 1).trim() : '') || attrs['tvg-name'] || '', logo: attrs['tvg-logo'] || '', group: attrs['group-title'] || '',
          backdrop: attrs['tvg-backdrop'] || '', plot: attrs['tvg-plot'] || '' };
      } else if (l.indexOf('#EXTGRP:') === 0) {
        if (cur && !cur.group) cur.group = l.slice(8).trim();
      } else if (l.charAt(0) !== '#') {
        var e = cur || { name: decodeURIComponent(l.split('?')[0].split('/').pop() || l), logo: '', group: '', backdrop: '', plot: '' };
        var c = classify(e.name, l);
        e.url = l;
        e.type = c.type;
        e.ext = c.ext;
        e.id = out.length;
        out.push(e);
        cur = null;
      }
    }
    return out;
  }

  // Ayrıştırılmış listeden Xtream biçimli kategori/öğe listeleri kur
  function buildM3U(entries) {
    var D = { byId: {}, cats: { live: [], movie: [], series: [] }, live: [], movie: [], series: [], seriesInfo: {}, count: entries.length };
    var catIds = { live: {}, movie: {}, series: {} }, seriesByKey = {};
    function catOf(type, group) {
      var g = group || 'Diğer';
      if (catIds[type][g] == null) {
        catIds[type][g] = type.charAt(0) + D.cats[type].length;
        D.cats[type].push({ category_id: catIds[type][g], category_name: g });
      }
      return catIds[type][g];
    }
    entries.forEach(function (e) {
      D.byId[e.id] = e;
      var cat = catOf(e.type, e.group), order = entries.length - e.id; // liste sırası korunsun
      if (e.type === 'live') {
        D.live.push({ stream_id: e.id, name: e.name, stream_icon: e.logo, category_id: cat });
      } else if (e.type === 'movie') {
        D.movie.push({ stream_id: e.id, name: e.name, stream_icon: e.logo, category_id: cat, container_extension: e.ext, added: order });
      } else {
        var m = EP_RE.exec(e.name) || [e.name, e.name, '1', String(e.id), ''];
        var sname = (m[1] || e.name).trim(), season = +m[2], num = +m[3];
        var key = 's' + A.norm(sname + '|' + cat).replace(/[^a-z0-9]+/g, '-');
        if (!seriesByKey[key]) {
          seriesByKey[key] = { series_id: key, name: sname, cover: e.logo, category_id: cat, last_modified: order, backdrop_path: e.backdrop ? [e.backdrop] : [], plot: e.plot };
          D.series.push(seriesByKey[key]);
          D.seriesInfo[key] = { info: { name: sname, cover: e.logo, backdrop_path: e.backdrop ? [e.backdrop] : [], plot: e.plot }, episodes: {} };
        }
        var eps = D.seriesInfo[key].episodes;
        (eps[season] = eps[season] || []).push({ id: e.id, episode_num: num, title: 'S' + season + 'E' + num + ' - ' + (m[4] || 'Bölüm ' + num), container_extension: e.ext, info: {} });
      }
    });
    return D;
  }

  function loadM3U(cb) {
    if (M3U.data) { cb(null, M3U.data); return; }
    if (M3U.waiting) { M3U.waiting.push(cb); return; }
    M3U.waiting = [cb];
    var url = A.creds.url, xhr = new XMLHttpRequest();
    function done(err, data) {
      var w = M3U.waiting;
      M3U.waiting = null;
      if (!err) M3U.data = data;
      w.forEach(function (f) { f(err, data); });
    }
    xhr.open('GET', url, true);
    xhr.timeout = 120000;
    xhr.onload = function () {
      if ((xhr.status < 200 || xhr.status >= 300) && xhr.status !== 0) { done('HTTP ' + xhr.status); return; }
      var text = xhr.responseText || '';
      if (text.indexOf('#EXT') < 0 && !/^https?:\/\//m.test(text)) { done('Bu adres bir M3U listesi değil'); return; }
      var entries = parseM3U(text);
      A.log('m3u: ' + entries.length + ' kayıt');
      done(null, buildM3U(entries));
    };
    xhr.onerror = function () { done('Bağlantı hatası'); };
    xhr.ontimeout = function () { done('Zaman aşımı'); };
    xhr.send();
  }

  function m3uApi(params, cb) {
    loadM3U(function (err, D) {
      if (err) { cb(err); return; }
      var c = params.category_id;
      var byCat = function (list) { return c == null ? list : list.filter(function (x) { return String(x.category_id) === String(c); }); };
      var e;
      switch (params.action) {
        case undefined: cb(null, { user_info: { auth: D.count ? 1 : 0, status: 'Active' } }); return;
        case 'get_live_categories': cb(null, D.cats.live); return;
        case 'get_vod_categories': cb(null, D.cats.movie); return;
        case 'get_series_categories': cb(null, D.cats.series); return;
        case 'get_live_streams': cb(null, byCat(D.live)); return;
        case 'get_vod_streams': cb(null, byCat(D.movie)); return;
        case 'get_series': cb(null, byCat(D.series)); return;
        case 'get_vod_info':
          e = D.byId[params.vod_id];
          cb(e ? null : 'Bulunamadı', e && { info: { name: e.name, cover_big: e.logo, backdrop_path: e.backdrop ? [e.backdrop] : [], plot: e.plot }, movie_data: { stream_id: e.id, name: e.name, container_extension: e.ext, category_id: D.movie.filter(function (x) { return x.stream_id === e.id; })[0].category_id } });
          return;
        case 'get_series_info': cb(D.seriesInfo[params.series_id] ? null : 'Bulunamadı', D.seriesInfo[params.series_id]); return;
        default: cb('Desteklenmeyen işlem');
      }
    });
  }
  A.isM3U = function () { return !!(A.creds && A.creds.type === 'm3u'); };

  A.api = function (params, cb) {
    if (A.isM3U()) { m3uApi(params, cb); return; }
    var q = 'username=' + encodeURIComponent(A.creds.user) + '&password=' + encodeURIComponent(A.creds.pass);
    var key = '';
    for (var k in params) {
      if (params.hasOwnProperty(k)) {
        q += '&' + k + '=' + encodeURIComponent(params[k]);
        key += k + '=' + params[k] + ';';
      }
    }
    if (key && cache[key]) { cb(null, cache[key]); return; }
    if (key && inflight[key]) { inflight[key].push(cb); return; }
    if (key) inflight[key] = [cb];
    var xhr = new XMLHttpRequest();
    var done = function (err, data) {
      var cbs = key ? inflight[key] : [cb];
      if (key) delete inflight[key];
      if (!err && key) cache[key] = data;
      cbs.forEach(function (f) { f(err, data); });
    };
    xhr.open('GET', A.creds.base + '/player_api.php?' + q, true);
    xhr.timeout = 60000;
    xhr.onload = function () {
      if (xhr.status < 200 || xhr.status >= 300) { done('HTTP ' + xhr.status); return; }
      var data;
      try { data = JSON.parse(xhr.responseText); } catch (e) { done('Sunucu yanıtı okunamadı'); return; }
      done(null, data);
    };
    xhr.onerror = function () { done('Bağlantı hatası'); };
    xhr.ontimeout = function () { done('Zaman aşımı'); };
    xhr.send();
  };
  // Hesap değişince tüm sağlayıcı verisini unut
  A.clearCache = function () { cache = {}; M3U.data = null; A.cats = { movie: null, series: null, live: null }; };
  A.dropCache = function (action) {
    for (var k in cache) if (cache.hasOwnProperty(k) && k.indexOf('action=' + action) === 0) delete cache[k];
  };

  A.streamUrl = function (kind, id, ext) {
    if (A.isM3U()) { var e = M3U.data && M3U.data.byId[id]; return e ? e.url : ''; }
    return A.creds.base + '/' + kind + '/' + encodeURIComponent(A.creds.user) + '/' +
      encodeURIComponent(A.creds.pass) + '/' + id + '.' + (ext || 'mp4');
  };

  // Kategoriler (bir kez yüklenir)
  A.cats = { movie: null, series: null, live: null };
  A.loadCats = function (type, cb) {
    if (A.cats[type]) { cb(null, A.cats[type]); return; }
    var action = { movie: 'get_vod_categories', series: 'get_series_categories', live: 'get_live_categories' }[type];
    A.api({ action: action }, function (err, list) {
      if (err) { cb(err); return; }
      A.cats[type] = (list || []).map(function (c) { return { id: c.category_id, name: A.catName(c.category_name) }; });
      cb(null, A.cats[type]);
    });
  };

  // Ham listeleri ortak öğe biçimine çevir
  A.toItem = {
    movie: function (m) {
      var c = A.clean(m.name);
      return { type: 'movie', id: m.stream_id, title: c.title, year: c.year, rating: c.rating || (m.rating && +m.rating ? (+m.rating).toFixed(1) : ''),
        badges: c.badges, rank: c.rank, poster: m.stream_icon, ext: m.container_extension, added: +m.added || 0, cat: m.category_id };
    },
    series: function (s) {
      var c = A.clean(s.name);
      return { type: 'series', id: s.series_id, title: c.title, year: c.year || String(s.releaseDate || '').slice(0, 4),
        rating: s.rating && +s.rating ? (+s.rating).toFixed(1) : '', badges: c.badges, poster: s.cover,
        backdrop: (s.backdrop_path || [])[0] || '', plot: s.plot, genre: s.genre, added: +s.last_modified || 0, cat: s.category_id };
    },
    live: function (ch) {
      return { type: 'live', id: ch.stream_id, title: String(ch.name || '').replace(/^[A-Z]{2}:\s*/, ''), poster: ch.stream_icon, cat: ch.category_id };
    }
  };

  A.loadList = function (type, catId, cb) {
    var action = { movie: 'get_vod_streams', series: 'get_series', live: 'get_live_streams' }[type];
    var params = { action: action };
    if (catId != null) params.category_id = catId;
    A.api(params, function (err, list) {
      if (err) { cb(err); return; }
      cb(null, (list || []).map(A.toItem[type]));
    });
  };

  // ---------------------------------------------------------------- webOS sistem servisi

  var bridges = [];
  // Sistem servisi çağrısı. LG'nin belgelenmiş yolu webOSTV.js'teki webOS.service.request;
  // kütüphane yoksa (geliştirme ortamı) doğrudan PalmServiceBridge kullanılır.
  A.luna = function (uri, params, cb) {
    var method = uri.split('/').pop(), service = uri.slice(0, uri.length - method.length - 1);
    function result(r) {
      A.log('luna ' + method + ' -> ' + (r && r.returnValue ? 'tamam' : 'hata: ' + (r && r.errorText)));
      if (cb) cb(r && r.returnValue ? null : ((r && r.errorText) || 'hata'), r || {});
    }
    if (window.webOS && webOS.service && webOS.service.request) {
      webOS.service.request(service, { method: method, parameters: params, onSuccess: result, onFailure: result });
      return;
    }
    if (typeof PalmServiceBridge === 'undefined') { if (cb) cb('Sistem servisi yok'); return; }
    var b = new PalmServiceBridge();
    bridges.push(b);
    b.onservicecallback = function (msg) {
      var i = bridges.indexOf(b);
      if (i >= 0) bridges.splice(i, 1);
      var r;
      try { r = JSON.parse(msg); } catch (e) { r = { returnValue: false, errorText: 'yanıt okunamadı' }; }
      A.log('luna ' + uri.split('/').pop() + ' -> ' + (r.returnValue ? 'tamam' : 'hata: ' + r.errorText));
      if (cb) cb(r.returnValue ? null : (r.errorText || 'hata'), r);
    };
    b.call(uri, JSON.stringify(params));
  };

  // ---------------------------------------------------------------- tembel görsel yükleme

  var lazyTimer = null;
  A.lazy = function () {
    clearTimeout(lazyTimer);
    lazyTimer = setTimeout(function () {
      A.$$('[data-bg]').forEach(function (e) {
        var r = e.getBoundingClientRect();
        if (r.right > -300 && r.left < 2220 && r.bottom > -300 && r.top < 1380) {
          e.style.backgroundImage = 'url("' + e.getAttribute('data-bg') + '")';
          e.removeAttribute('data-bg');
        }
      });
    }, 60);
  };

  // ---------------------------------------------------------------- odak motoru (uzamsal gezinme)

  var F = A.focus = { cur: null, modal: null };

  F.root = function () {
    if (F.modal) return F.modal;
    var s = A.router.top();
    return s ? s.el : document.body;
  };

  F.all = function () {
    var root = F.root(), list = A.$$('.fc', root);
    // sol menü ana ekranların parçası
    if (!F.modal && A.router.top() && A.router.top().rail) list = A.$$('.fc', A.$('#rail')).concat(list);
    return list.filter(function (e) { return e.offsetParent !== null; });
  };

  F.set = function (el, opts) {
    if (!el) return;
    opts = opts || {};
    if (F.cur && F.cur !== el) {
      F.cur.classList.remove('focus');
      if (F.cur.onblurx) F.cur.onblurx();
    }
    F.cur = el;
    el.classList.add('focus');
    var inRail = !!A.parentWith(el, 'rail-zone');
    A.$('#rail').classList.toggle('open', inRail);
    if (!opts.noScroll) F.reveal(el);
    if (el.onfocusx) el.onfocusx();
    A.lazy();
  };

  F.first = function () {
    var list = F.all();
    var pref = A.$$('[data-autofocus]', F.root()).filter(function (e) { return e.offsetParent !== null; })[0];
    F.set(pref || list.filter(function (e) { return !A.parentWith(e, 'rail-zone'); })[0] || list[0]);
  };

  F.byKey = function (key) {
    if (!key) return null;
    return F.all().filter(function (e) { return e.getAttribute('data-key') === key; })[0] || null;
  };

  F.move = function (dir) {
    var cur = F.cur;
    if (!cur || cur.offsetParent === null || !F.root().contains(cur) && !A.parentWith(cur, 'rail-zone')) { F.first(); return; }
    if (cur.onnav && cur.onnav(dir) === true) return;
    var r = cur.getBoundingClientRect();
    var cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2;
    var best = null, bestScore = Infinity;
    F.all().forEach(function (e) {
      if (e === cur) return;
      var q = e.getBoundingClientRect();
      if (!q.width && !q.height) return;
      var ex = (q.left + q.right) / 2, ey = (q.top + q.bottom) / 2, primary, secondary;
      if (dir === 'right' || dir === 'left') {
        if (dir === 'right' ? q.left < r.right - 6 : q.right > r.left + 6) return;
        primary = dir === 'right' ? q.left - r.right : r.left - q.right;
        // aynı satırdakileri güçlü şekilde tercih et
        var overlap = Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top);
        secondary = overlap > 0 ? 0 : Math.abs(ey - cy);
        var score = Math.max(primary, 0) + secondary * 6;
      } else {
        if (dir === 'down' ? q.top < r.bottom - 6 : q.bottom > r.top + 6) return;
        primary = dir === 'down' ? q.top - r.bottom : r.top - q.bottom;
        secondary = Math.abs(ex - cx);
        // aynı "satır grubundaki" son odaklanan öğeye dön
        score = Math.max(primary, 0) * 1.4 + secondary;
      }
      if (score < bestScore) { bestScore = score; best = e; }
    });
    if (best) {
      // satıra geri dönerken o satırda en son seçilen öğeye git
      var row = A.parentWith(best, 'mem');
      if ((dir === 'up' || dir === 'down') && row && row !== A.parentWith(cur, 'mem') && row._last && row.contains(row._last) && row._last.offsetParent) best = row._last;
      F.set(best);
    }
  };

  // Odaklanan öğeyi görünür yap: yatay (.hs > .track) ve dikey (.vs > .vtrack) kaydırma
  F.reveal = function (el) {
    var row = A.parentWith(el, 'mem');
    if (row) row._last = el;
    var hs = A.parentWith(el, 'hs');
    if (hs) {
      var track = hs.firstElementChild, off = track._off || 0;
      var hr = hs.getBoundingClientRect(), er = el.getBoundingClientRect();
      var lpad = +(hs.getAttribute('data-lpad') || 0);
      if (er.right > 1860) off -= er.right - 1860;
      if (er.left < hr.left + lpad) off += hr.left + lpad - er.left;
      if (off > 0) off = 0;
      track._off = off;
      track.style.transform = 'translateX(' + off + 'px)';
    }
    var vs = A.parentWith(el, 'vs');
    if (vs) {
      var vt = vs.firstElementChild, voff = vt._off || 0;
      var target = el.hasAttribute('data-top') ? null : (A.parentWith(el, 'row') || el);
      var vr = vs.getBoundingClientRect();
      if (!target) voff = 0;
      else {
        var tr = target.getBoundingClientRect();
        var topPad = +(vs.getAttribute('data-toppad') || 40), botPad = 40;
        if (tr.top < vr.top + topPad) voff += vr.top + topPad - tr.top;
        if (tr.bottom > vr.bottom - botPad) voff -= tr.bottom - (vr.bottom - botPad);
        if (voff > 0) voff = 0;
      }
      vt._off = voff;
      vt.style.transform = 'translateY(' + voff + 'px)';
    }
  };

  // ---------------------------------------------------------------- yönlendirici

  var R = A.router = { stack: [] };
  A.screens = {};

  R.top = function () { return R.stack[R.stack.length - 1]; };

  function mount(entry, restore) {
    var host = A.$('#screens');
    host.innerHTML = '';
    var def = A.screens[entry.name];
    entry.rail = !!def.rail;
    entry.el = A.h('div', 'screen');
    host.appendChild(entry.el);
    A.$('#rail').classList.toggle('hidden', !entry.rail);
    A.$$('#rail .ri').forEach(function (r) { r.classList.toggle('on', r.getAttribute('data-go') === (def.railKey || entry.name)); });
    if (F.cur) F.cur.classList.remove('focus');
    F.cur = null;
    F.modal = null;
    entry.waitFocus = false;
    def.render(entry.el, entry.params || {}, entry, restore);
    // Asenkron içerik bekleyen ekranlar (waitFocus) odağı yükleme bitince kendileri verir
    if (!F.cur && !entry.waitFocus) A.restoreFocus(entry, restore);
    A.lazy();
  }

  // Geri dönüldüğünde önceki odaklı öğeye, yoksa ilk öğeye odaklan
  A.restoreFocus = function (entry, restore) {
    if (!A.alive(entry)) return;
    var again = restore !== false && F.byKey(entry.focusKey);
    if (again) F.set(again); else if (!F.cur || !F.cur.offsetParent) F.first();
  };

  R.go = function (name, params) {
    var top = R.top();
    if (top) {
      top.focusKey = F.cur && F.cur.getAttribute('data-key');
      if (A.screens[top.name].leave) A.screens[top.name].leave(top);
    }
    var entry = { name: name, params: params || {} };
    R.stack.push(entry);
    mount(entry, false);
  };

  // Ana menüden geçişlerde yığını sıfırla
  R.root = function (name, params) {
    var top = R.top();
    if (top && A.screens[top.name].leave) A.screens[top.name].leave(top);
    R.stack = [{ name: name, params: params || {} }];
    mount(R.stack[0], false);
  };

  R.back = function () {
    var top = R.top();
    if (top && A.screens[top.name].onBack && A.screens[top.name].onBack(top) === true) return;
    if (R.stack.length <= 1) {
      if (top && top.name !== 'home' && top.name !== 'login') { R.root('home'); return; }
      if (window.webOS && webOS.platformBack) webOS.platformBack(); else window.close();
      return;
    }
    if (A.screens[top.name].leave) A.screens[top.name].leave(top);
    R.stack.pop();
    mount(R.top(), true);
  };

  // Ekran hâlâ açık mı? (asenkron yüklemelerden sonra kontrol için)
  A.alive = function (entry) { return R.top() === entry; };

  // ---------------------------------------------------------------- kumanda

  var KEY = A.KEY = {
    LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, ENTER: 13, BACK: 461, ESC: 27, BACKSPACE: 8,
    PLAY: 415, PAUSE: 19, PLAYPAUSE: 10252, STOP: 413, FF: 417, RW: 412,
    RED: 403, GREEN: 404, YELLOW: 405, BLUE: 406, CH_UP: 33, CH_DOWN: 34
  };
  var keyboardOpen = false;
  document.addEventListener('keyboardStateChange', function (e) {
    keyboardOpen = !!(e.detail && e.detail.visibility);
    if (!keyboardOpen && document.activeElement && document.activeElement.tagName === 'INPUT') document.activeElement.blur();
  }, false);

  function handleKey(k, e) {
    var top = R.top();
    var def = top && A.screens[top.name];
    if (def && def.onKey && def.onKey(k, e, top) === true) { e.preventDefault(); return; }
    if (k === KEY.BACK || k === KEY.ESC) { e.preventDefault(); R.back(); return; }
    var dir = { 37: 'left', 38: 'up', 39: 'right', 40: 'down' }[k];
    if (dir) { e.preventDefault(); F.move(dir); return; }
    if (k === KEY.ENTER) {
      var c = F.cur;
      if (c && c.tagName === 'INPUT') { c.focus(); return; }
      if (c && c.onok) { e.preventDefault(); c.onok(); }
    }
  }
  document.addEventListener('keydown', function (e) {
    if (!keyboardOpen) handleKey(e.keyCode, e);
  }, false);

  // Magic Remote tekerleği: yukarı/aşağı yön tuşu gibi davranır
  var wheelAt = 0;
  document.addEventListener('onwheel' in document ? 'wheel' : 'mousewheel', function (e) {
    if (keyboardOpen) return;
    var dy = e.deltaY != null ? e.deltaY : -(e.wheelDelta || 0), now = Date.now();
    e.preventDefault();
    if (!dy || now - wheelAt < 150) return;
    wheelAt = now;
    handleKey(dy > 0 ? KEY.DOWN : KEY.UP, e);
  }, false);

  // Magic Remote imleci: üzerine gelince odakla, tıklayınca seç
  document.addEventListener('mouseover', function (e) {
    var el = e.target;
    while (el && el !== document.body && !(el.classList && el.classList.contains('fc'))) el = el.parentNode;
    if (el && el !== document.body && el !== F.cur) F.set(el, { noScroll: true });
  }, false);
  document.addEventListener('click', function (e) {
    var el = e.target;
    while (el && el !== document.body && !(el.classList && el.classList.contains('fc'))) el = el.parentNode;
    if (el && el !== document.body && el.onok) el.onok();
  }, false);

  // Odaklanabilir öğe kısayolu
  A.fc = function (el, key, onok, extra) {
    el.classList.add('fc');
    if (key) el.setAttribute('data-key', key);
    if (onok) el.onok = onok;
    if (extra) A.extend(el, extra);
    return el;
  };

  return A;
}());
