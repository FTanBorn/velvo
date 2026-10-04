/*
 * SPDX-License-Identifier: GPL-3.0-or-later
 * Velvo — dosya içi kanal okuma (MKV), dil tercihleri ve oynatıcı ekranı.
 */
(function (A) {
  'use strict';

  // ---------------------------------------------------------------- dil adları

  var LANGS = {
    tr: 'Türkçe', tur: 'Türkçe', en: 'İngilizce', eng: 'İngilizce', ar: 'Arapça', ara: 'Arapça',
    es: 'İspanyolca', spa: 'İspanyolca', de: 'Almanca', ger: 'Almanca', deu: 'Almanca',
    fr: 'Fransızca', fre: 'Fransızca', fra: 'Fransızca', ru: 'Rusça', rus: 'Rusça',
    it: 'İtalyanca', ita: 'İtalyanca', ja: 'Japonca', jpn: 'Japonca', ko: 'Korece', kor: 'Korece',
    pt: 'Portekizce', por: 'Portekizce', nl: 'Felemenkçe', dut: 'Felemenkçe', nld: 'Felemenkçe',
    pl: 'Lehçe', pol: 'Lehçe', hi: 'Hintçe', hin: 'Hintçe', zh: 'Çince', chi: 'Çince', zho: 'Çince',
    vi: 'Vietnamca', vie: 'Vietnamca', sv: 'İsveççe', swe: 'İsveççe', el: 'Yunanca', gre: 'Yunanca', ell: 'Yunanca', he: 'İbranice', heb: 'İbranice', fa: 'Farsça', per: 'Farsça', fas: 'Farsça'
  };
  var ISO3 = { tur: 'tr', eng: 'en', ara: 'ar', spa: 'es', ger: 'de', deu: 'de', fre: 'fr', fra: 'fr', rus: 'ru', ita: 'it',
    jpn: 'ja', kor: 'ko', por: 'pt', dut: 'nl', nld: 'nl', pol: 'pl', hin: 'hi', chi: 'zh', zho: 'zh',
    vie: 'vi', swe: 'sv', gre: 'el', ell: 'el', heb: 'he', per: 'fa', fas: 'fa' };
  function normLang(code) {
    var c = String(code || '').toLowerCase().split('-')[0];
    return ISO3[c] || c;
  }

  A.langName = function (code) {
    var c = String(code || '').toLowerCase().split('-')[0];
    return LANGS[c] || (c && c !== 'und' ? c.toUpperCase() : 'Bilinmeyen dil');
  };
  function langIs(code, group) { return normLang(code) === normLang(group); }
  function isSdh(t) { return /sdh|hearing|cc\b|işitme/i.test(t.name || ''); }
  A.trackLabel = function (t) {
    var label = A.langName(t.lang);
    if (isSdh(t)) label += ' · işitme engelliler için';
    else if (t.forced) label += ' · zorunlu';
    return label;
  };

  // ---------------------------------------------------------------- MKV başlığı okuma

  var MKV = {
    SEGMENT: 0x18538067, TRACKS: 0x1654AE6B, CLUSTER: 0x1F43B675, TRACK_ENTRY: 0xAE,
    TRACK_TYPE: 0x83, CODEC_ID: 0x86, LANGUAGE: 0x22B59C, LANGUAGE_IETF: 0x22B59D, NAME: 0x536E,
    FLAG_DEFAULT: 0x88, FLAG_FORCED: 0x55AA
  };
  var TRACK_TYPES = { 1: 'video', 2: 'ses', 17: 'altyazı' };

  function readVint(b, pos, keepMarker) {
    var first = b[pos], len = 1, mask = 0x80;
    while (len <= 8 && !(first & mask)) { len++; mask >>= 1; }
    if (len > 8) return null;
    var value = keepMarker ? first : (first & (mask - 1));
    var allOnes = (value === mask - 1);
    for (var i = 1; i < len; i++) {
      value = value * 256 + b[pos + i];
      if (b[pos + i] !== 0xFF) allOnes = false;
    }
    return { value: value, len: len, unknown: !keepMarker && allOnes };
  }
  function readStr(b, start, end) {
    var s = '';
    for (var i = start; i < end && b[i] !== 0; i++) s += String.fromCharCode(b[i]);
    try { return decodeURIComponent(escape(s)); } catch (e) { return s; }
  }
  function readUint(b, start, end) {
    var v = 0;
    for (var i = start; i < end; i++) v = v * 256 + b[i];
    return v;
  }
  function walk(b, start, end, cb) {
    var pos = start;
    while (pos < end) {
      var id = readVint(b, pos, true);
      if (!id) return;
      var size = readVint(b, pos + id.len, false);
      if (!size) return;
      var dataStart = pos + id.len + size.len;
      var dataEnd = size.unknown ? end : Math.min(end, dataStart + size.value);
      if (cb(id.value, dataStart, dataEnd) === false) return;
      pos = dataEnd;
    }
  }
  function parseTracks(b) {
    var tracks = null;
    walk(b, 0, b.length, function (id, s, e) {
      if (id !== MKV.SEGMENT) return true;
      walk(b, s, e, function (cid, cs, ce) {
        if (cid === MKV.CLUSTER) return false;
        if (cid !== MKV.TRACKS) return true;
        tracks = [];
        walk(b, cs, ce, function (tid, ts, te) {
          if (tid !== MKV.TRACK_ENTRY) return true;
          var t = { lang: 'eng', name: '', codec: '', type: '?', def: true, forced: false };
          walk(b, ts, te, function (fid, fs, fe) {
            if (fid === MKV.TRACK_TYPE) t.type = TRACK_TYPES[readUint(b, fs, fe)] || String(readUint(b, fs, fe));
            else if (fid === MKV.CODEC_ID) t.codec = readStr(b, fs, fe);
            else if (fid === MKV.LANGUAGE) t.lang = readStr(b, fs, fe);
            else if (fid === MKV.LANGUAGE_IETF) t.lang = readStr(b, fs, fe);
            else if (fid === MKV.NAME) t.name = readStr(b, fs, fe);
            else if (fid === MKV.FLAG_DEFAULT) t.def = readUint(b, fs, fe) === 1;
            else if (fid === MKV.FLAG_FORCED) t.forced = readUint(b, fs, fe) === 1;
            return true;
          });
          tracks.push(t);
          return true;
        });
        return false;
      });
      return false;
    });
    return tracks;
  }

  // Dosyanın başını düz GET ile okuyup yeterince gelince keser (Range başlığı sunucuda sorun çıkarıyor)
  function fetchHead(url, maxBytes, cb) {
    var xhr = new XMLHttpRequest(), done = false;
    function finish(err, text) {
      if (done) return;
      done = true;
      if (err) { cb(err); return; }
      var n = Math.min(text.length, maxBytes), bytes = new Uint8Array(n);
      for (var i = 0; i < n; i++) bytes[i] = text.charCodeAt(i) & 0xFF;
      cb(null, bytes);
    }
    xhr.open('GET', url, true);
    xhr.overrideMimeType('text/plain; charset=x-user-defined');
    xhr.timeout = 45000;
    xhr.onprogress = function () {
      if (!done && xhr.responseText.length >= maxBytes) { var t = xhr.responseText; finish(null, t); xhr.abort(); }
    };
    xhr.onload = function () {
      if (xhr.status !== 200 && xhr.status !== 206 && xhr.status !== 0) finish('HTTP ' + xhr.status);
      else finish(null, xhr.responseText);
    };
    xhr.onerror = function () { finish('Bağlantı hatası'); };
    xhr.ontimeout = function () { finish('Zaman aşımı'); };
    xhr.send();
    return xhr;
  }

  var probeCache = {};
  // { status: 'tamam' | 'hata' | 'yok', audio: [...], subs: [...] }
  A.probe = function (url, ext, cb) {
    if (String(ext).toLowerCase() !== 'mkv') { cb({ status: 'yok', audio: [], subs: [] }); return; }
    if (probeCache[url]) { cb(probeCache[url]); return; }
    fetchHead(url, 1572864, function (err, bytes) {
      var tracks = !err && parseTracks(bytes);
      var res = tracks
        ? { status: 'tamam', audio: tracks.filter(function (t) { return t.type === 'ses'; }), subs: tracks.filter(function (t) { return t.type === 'altyazı'; }) }
        : { status: 'hata', audio: [], subs: [], msg: err || 'kanal listesi bulunamadı' };
      if (tracks) probeCache[url] = res;
      A.log('kanallar: ' + (tracks ? res.audio.length + ' ses, ' + res.subs.length + ' altyazı' : res.msg));
      cb(res);
    });
  };

  // Detay sayfası rozetleri: "Türkçe ses", "İngilizce altyazı" ...
  // Detay rozetleri: tüm ses dilleri; altyazı çoksa yalnızca tercih edilenler + "N altyazı dili" özeti
  A.langBadges = function (pr) {
    var out = [], seen = {}, subs = [];
    function mine(lang) { return langIs(lang, A.prefs.audio) || langIs(lang, A.prefs.sub); }
    pr.audio.forEach(function (t) {
      var name = A.langName(t.lang);
      if (seen['a' + name]) return;
      seen['a' + name] = 1;
      out.push({ text: name + ' ses', tr: mine(t.lang) });
    });
    pr.subs.forEach(function (t) {
      var name = A.langName(t.lang);
      if (t.forced || seen['s' + name]) return;
      seen['s' + name] = 1;
      subs.push({ text: name + ' altyazı', tr: mine(t.lang) });
    });
    if (subs.length > 4) {
      out = out.concat(subs.filter(function (b) { return b.tr; }));
      out.push({ text: subs.length + ' altyazı dili' });
    } else {
      out = out.concat(subs);
    }
    out.sort(function (a, b) { return (b.tr ? 1 : 0) - (a.tr ? 1 : 0); });
    return out;
  };

  // ---------------------------------------------------------------- oynatıcı ekranı

  var P = {};

  function pickAudio(list, pref) {
    var i;
    if (pref === 'orig') {
      for (i = 0; i < list.length; i++) if (!langIs(list[i].lang, 'tr')) return i;
      return -1;
    }
    for (i = 0; i < list.length; i++) if (langIs(list[i].lang, pref)) return i;
    return -1;
  }
  function pickSub(list, pref) {
    var best = -1;
    for (var i = 0; i < list.length; i++) {
      if (!langIs(list[i].lang, pref)) continue;
      if (!list[i].forced && !isSdh(list[i])) return i;
      if (best < 0) best = i;
    }
    return best;
  }

  function audioCount() { return P.v.audioTracks ? P.v.audioTracks.length : 0; }
  function activeAudio() {
    var at = P.v.audioTracks;
    if (at) for (var i = 0; i < at.length; i++) if (at[i].enabled) return i;
    return 0;
  }
  // Ses kanalı listesi: dosyadan okunan adlar, yoksa TV'nin verdiği dil kodları
  function audioList() {
    var n = audioCount(), out = [];
    var f = P.probe && P.probe.audio.length === n ? P.probe.audio : null;
    for (var i = 0; i < n; i++) {
      var t = f ? f[i] : { lang: P.v.audioTracks[i].language, name: P.v.audioTracks[i].label };
      out.push({ i: i, lang: t.lang, label: A.langName(t.lang), codec: f ? f[i].codec : '' });
    }
    return out;
  }

  function selectAudio(idx) {
    var at = P.v.audioTracks;
    if (!at) return;
    for (var i = 0; i < at.length; i++) at[i].enabled = (i === idx);
    A.log('ses kanalı: ' + idx);
  }

  // Gömülü altyazı LG medya servisiyle açılır (HTML5 textTracks bunları göstermiyor)
  function selectSub(idx) {
    var id = P.v.mediaId;
    P.subSel = idx;
    if (!id) { A.log('altyazı: mediaId yok'); return; }
    if (idx < 0) {
      A.luna('luna://com.webos.media/setSubtitleEnable', { mediaId: id, enable: false });
    } else {
      A.luna('luna://com.webos.media/setSubtitleEnable', { mediaId: id, enable: true }, function (err) {
        // Bu TV gömülü altyazı servisini desteklemiyorsa menüde bunu söyle (çalışmayan seçenek gösterme)
        if (err) { A.subUnsupported = true; P.subSel = -1; A.toast("Bu TV'de gömülü altyazı desteklenmiyor"); labels(); return; }
        A.luna('luna://com.webos.media/selectTrack', { mediaId: id, type: 'text', index: idx }, function () { applySubStyle(); });
      });
    }
  }

  // ---- altyazı görünümü (LG medya servisi; gömülü altyazıyı TV kendisi çizer)
  A.SUB_SIZES = [[1, 'Küçük'], [2, 'Normal'], [3, 'Büyük'], [4, 'Çok büyük']];
  A.SUB_COLORS = [[2, 'Beyaz', '#ffffff'], [0, 'Sarı', '#ffe14d'], [3, 'Yeşil', '#5cf08c'], [4, 'Mavi', '#66b3ff'], [5, 'Gri', '#c8c8c8']];
  A.SUB_BGS = [['none', 'Yok'], ['half', 'Yarı saydam'], ['box', 'Siyah kutu']];
  A.SUB_POS = [[-2, 'Daha aşağı'], [0, 'Normal'], [2, 'Biraz yukarı'], [4, 'Yukarı']];
  function nameOf(list, v) { for (var i = 0; i < list.length; i++) if (list[i][0] === v) return list[i][1]; return String(v); }
  function stepIn(list, v, d) {
    var i = 0;
    for (var j = 0; j < list.length; j++) if (list[j][0] === v) i = j;
    return list[Math.max(0, Math.min(list.length - 1, i + d))][0];
  }
  function fmtSync(ms) { ms = ms || 0; return (ms > 0 ? '+' : ms < 0 ? '−' : '') + (Math.abs(ms) / 1000).toFixed(1).replace('.', ',') + ' sn'; }

  function applySubStyle() {
    var id = P.v.mediaId, pr = A.prefs, m = 'luna://com.webos.media/';
    if (!id || P.subSel < 0) return;
    A.luna(m + 'setSubtitleFontSize', { mediaId: id, fontSize: pr.subSize });
    A.luna(m + 'setSubtitleColor', { mediaId: id, color: pr.subColor });
    A.luna(m + 'setSubtitlePosition', { mediaId: id, position: pr.subPos });
    // Not: setSubtitleBackground* ve setSubtitleSync webOS 3.x'te kabul edilip yok sayılıyor (TV'de denendi)
  }

  // ---- dizi başına seçim hafızası: bir bölümde seçilen ses/altyazı sonraki bölümlerde de uygulanır
  function trackMem() { return A.store.get(A.pk('sahne_trackmem'), {}); }

  function rememberTracks(audioIdx) {
    var it = P.item;
    if (!it || it.kind !== 'series' || !it.seriesId) return;
    var auds = audioList(), a = auds[audioIdx != null ? audioIdx : activeAudio()];
    var subs = P.probe ? P.probe.subs : [], s = P.subSel >= 0 ? subs[P.subSel] : null;
    var mem = trackMem();
    mem[it.seriesId] = { audio: a ? normLang(a.lang) : null, sub: s ? normLang(s.lang) : 'off', sdh: s ? isSdh(s) : false, forced: s ? !!s.forced : false, t: Date.now() };
    var keys = Object.keys(mem);
    if (keys.length > 200) { // en eski kayıtları buda
      keys.sort(function (x, y) { return mem[x].t - mem[y].t; });
      keys.slice(0, keys.length - 200).forEach(function (k) { delete mem[k]; });
    }
    A.store.set(A.pk('sahne_trackmem'), mem);
    A.log('seçim hatırlandı: ' + JSON.stringify(mem[it.seriesId]));
  }

  // Hafızadaki altyazıya en çok benzeyeni bul: aynı dil, mümkünse aynı türde (işitme engelli / zorunlu)
  function pickSubLike(list, mem) {
    var best = -1;
    for (var i = 0; i < list.length; i++) {
      if (!langIs(list[i].lang, mem.sub)) continue;
      if (isSdh(list[i]) === !!mem.sdh && !!list[i].forced === !!mem.forced) return i;
      if (best < 0) best = i;
    }
    return best;
  }

  function applyPrefs() {
    if (P.applied || !P.probe || P.v.readyState < 1 || !P.v.mediaId) return;
    P.applied = true;
    var msg = [], auds = audioList(), subs = P.probe.subs;
    var mem = P.item.kind === 'series' ? trackMem()[P.item.seriesId] : null;
    var fromMem = false;

    var ai = -1;
    if (mem && mem.audio) { ai = pickAudio(auds, mem.audio); if (ai >= 0) fromMem = true; }
    if (ai < 0) ai = pickAudio(auds, A.prefs.audio);
    if (ai >= 0 && ai !== activeAudio()) selectAudio(ai);
    var cur = auds[ai >= 0 ? ai : activeAudio()];
    if (cur && auds.length > 1) msg.push(cur.label + ' ses');

    var memSub = mem && (mem.sub === 'off' ? -2 : pickSubLike(subs, mem));
    if (mem && memSub === -2) {
      fromMem = true; // bu dizide altyazıyı kapatmıştın
    } else if (mem && memSub >= 0) {
      fromMem = true;
      selectSub(memSub);
      msg.push(A.langName(subs[memSub].lang) + ' altyazı');
    } else if (A.prefs.sub !== 'off' && subs.length) {
      var sameLang = cur && langIs(cur.lang, A.prefs.sub);
      if (!(A.prefs.subOffWithTrAudio && sameLang)) {
        var si = pickSub(subs, A.prefs.sub);
        if (si >= 0) { selectSub(si); msg.push(A.langName(subs[si].lang) + ' altyazı'); }
      }
    }
    if (fromMem && !msg.length) msg.push('altyazı kapalı');
    if (msg.length) A.toast((fromMem ? 'Son seçimin: ' : '') + msg.join(' · '));
  }

  // ---- ilerleme kaydı
  function saveProgress(final) {
    var it = P.item, v = P.v;
    if (!it || it.kind === 'live' || !v.duration || !isFinite(v.duration)) return;
    var t = v.currentTime, dur = v.duration, finished = t / dur > 0.95;
    if (it.kind === 'movie') {
      A.progress.put('m' + it.id, { type: 'movie', id: it.id, title: it.title, poster: it.poster, backdrop: it.backdrop, ext: it.ext, t: finished ? 0 : t, dur: dur });
    } else {
      A.progress.put('e' + it.id, { t: finished ? dur : t, dur: dur });
      var next = P.queue && P.queue[P.qi + 1];
      if (finished && next) {
        A.progress.put('s' + it.seriesId, { type: 'series', id: it.seriesId, epId: next.id, season: next.season, epNum: next.num, epTitle: next.title, ext: next.ext, title: it.title, poster: it.poster, backdrop: it.backdrop, t: 0, dur: 0, hidden: false });
      } else {
        A.progress.put('s' + it.seriesId, { type: 'series', id: it.seriesId, epId: it.id, season: it.season, epNum: it.epNum, epTitle: it.epTitle, ext: it.ext, title: it.title, poster: it.poster, backdrop: it.backdrop, t: t, dur: dur, hidden: finished && !next });
      }
    }
  }

  // ---- kontroller (üst bilgi + alt düğme çubuğu)

  var IC = {
    rew: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 108-8H9"/><path d="M11 1L8 4l3 3"/><text x="12" y="15.5" font-size="7" text-anchor="middle" fill="currentColor" stroke="none" font-weight="700">10</text></svg>',
    fwd: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 11-8-8h3"/><path d="M13 1l3 3-3 3"/><text x="12" y="15.5" font-size="7" text-anchor="middle" fill="currentColor" stroke="none" font-weight="700">10</text></svg>',
    lang: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 5h9M8.5 3v2M6 5c.5 3 3 6 6 7M11 5c-.5 3-3 6-6.5 7"/><path d="M13 21l4-9 4 9M14.5 18h5"/></svg>',
    cc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10.5 10.5a2 2 0 100 3M17 10.5a2 2 0 100 3" stroke-linecap="round"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 5v14l10-7z"/><rect x="16" y="5" width="3" height="14" rx="1"/></svg>'
  };

  function osdVisible() { return !P.bottom.classList.contains('off'); }

  function osd(show) {
    clearTimeout(P.osdTimer);
    P.top.classList.toggle('off', !show);
    P.bottom.classList.toggle('off', !show);
    if (show) { armHide(); return; }
    closePop(true);
    if (A.focus.cur) A.focus.cur.classList.remove('focus');
    A.focus.cur = null;
  }

  // Oynarken 5 sn dokunulmazsa kontrolleri gizle (duraklatılmışken ve liste açıkken gizleme)
  function armHide() {
    clearTimeout(P.osdTimer);
    if (!P.v.paused && !P.popOpen) P.osdTimer = setTimeout(function () { osd(false); }, 5000);
  }

  function showControls(key) {
    var wasVisible = osdVisible();
    osd(true);
    if (!wasVisible || !A.focus.cur) A.focus.set(A.focus.byKey(key || 'p-play'));
  }

  function updateBar(t) {
    if (P.item.kind === 'live') return;
    var v = P.v, dur = v.duration || 0;
    t = t == null ? v.currentTime : t;
    var pct = dur ? Math.min(100, t / dur * 100) : 0;
    P.fill.style.width = pct + '%';
    P.knob.style.left = pct + '%';
    P.tCur.textContent = A.fmtTime(t);
    P.tDur.textContent = dur ? '-' + A.fmtTime(dur - t) : '';
  }

  function seekBy(d) {
    if (P.item.kind === 'live' || !P.v.duration) return;
    var base = P.seekTarget != null ? P.seekTarget : P.v.currentTime;
    P.seekTarget = Math.max(0, Math.min(P.v.duration - 3, base + d));
    updateBar(P.seekTarget);
    if (!osdVisible()) showControls('p-seek');
    armHide();
    clearTimeout(P.seekTimer);
    P.seekTimer = setTimeout(function () { P.v.currentTime = P.seekTarget; P.seekTarget = null; }, 650);
  }

  function togglePlay() {
    if (P.v.paused) P.v.play(); else P.v.pause();
    labels();
    armHide();
  }

  // Düğme yazıları: seçili ses ve altyazı, oynat/duraklat ikonu
  function labels() {
    if (!P.bPlay) return;
    P.bPlay.innerHTML = P.v.paused ? A.icon.play : A.icon.pause;
    if (P.bAudio) {
      var auds = audioList(), a = auds[activeAudio()];
      P.bAudio.innerHTML = IC.lang + '<span>' + A.esc(a ? a.label : 'Ses') + '</span>';
    }
    if (P.bSub) {
      var subs = P.probe ? P.probe.subs : [];
      var s = P.subSel >= 0 && subs[P.subSel];
      P.bSub.innerHTML = IC.cc + '<span>' + A.esc(s ? A.langName(s.lang) + ' altyazı' : 'Altyazı kapalı') + '</span>';
    }
    if (P.bNext) P.bNext.classList.toggle('hidden', !(P.queue && P.queue[P.qi + 1]));
  }

  // ---- düğmenin üstünde açılan liste (ses / altyazı)
  function opt(parent, on, label, small, onok, key) {
    var e = A.h('div', 'opt' + (on ? ' on' : ''), '<span class="ck">' + (on ? A.icon.check : '') + '</span>' + A.esc(label) + (small ? '<span class="sm">' + A.esc(small) + '</span>' : ''));
    A.fc(e, key, onok);
    parent.appendChild(e);
    return e;
  }

  function openPop(kind) {
    var p = P.pop, anchor = kind === 'audio' ? P.bAudio : P.bSub;
    // içerik uzunsa pencere içinde kaydırılır (odak motoru .vs içini kaydırır)
    p.innerHTML = '<div class="vs pv" data-toppad="20"><div class="vtrack"></div></div>';
    var box = A.$('.vtrack', p);
    box.appendChild(A.h('div', 'ph2', kind === 'audio' ? 'Ses' : 'Altyazı'));
    if (kind === 'audio') {
      var auds = audioList(), act = activeAudio();
      if (!auds.length) box.appendChild(A.h('div', 'opt dim', 'Ses bilgisi yok'));
      auds.forEach(function (a) {
        var codec = /AC3|EAC3/i.test(a.codec) ? 'Dolby' : '';
        opt(box, a.i === act, a.label, codec, function () {
          selectAudio(a.i);
          rememberTracks(a.i);
          closePop();
          setTimeout(labels, 200);
          A.toast(a.label + ' ses');
        }, 'pa' + a.i);
      });
    } else {
      var subs = P.probe && !A.subUnsupported ? P.probe.subs : [];
      if (A.subUnsupported) box.appendChild(A.h('div', 'opt dim', "Bu TV'de gömülü altyazı desteklenmiyor"));
      opt(box, P.subSel < 0, 'Kapalı', '', function () { selectSub(-1); rememberTracks(); closePop(); labels(); A.toast('Altyazı kapalı'); }, 'ps-1');
      subs.forEach(function (s, i) {
        opt(box, P.subSel === i, A.trackLabel(s), '', function () { selectSub(i); rememberTracks(); closePop(); labels(); A.toast(A.langName(s.lang) + ' altyazı açıldı'); }, 'ps' + i);
      });
      if (!subs.length) {
        box.appendChild(A.h('div', 'opt dim', !P.probe ? 'Altyazılar okunuyor…' : P.probe.status === 'yok' ? 'Bu dosya türünde altyazı okunamıyor' : 'Bu içerikte altyazı yok'));
      } else {
        box.appendChild(A.h('div', 'ph2', 'Ayarlar · ◀ ▶ ile değiştir'));
        adjRow(box, 'Boyut', function () { return nameOf(A.SUB_SIZES, A.prefs.subSize); }, function (d) {
          A.prefs.subSize = stepIn(A.SUB_SIZES, A.prefs.subSize, d); A.savePrefs(); applySubStyle();
        }, 'pb');
        adjRow(box, 'Renk', function () { return nameOf(A.SUB_COLORS, A.prefs.subColor); }, function (d) {
          A.prefs.subColor = stepIn(A.SUB_COLORS, A.prefs.subColor, d); A.savePrefs(); applySubStyle();
        }, 'pr');
        adjRow(box, 'Konum', function () { return nameOf(A.SUB_POS, A.prefs.subPos); }, function (d) {
          A.prefs.subPos = stepIn(A.SUB_POS, A.prefs.subPos, d); A.savePrefs(); applySubStyle();
        }, 'pp');
      }
    }
    p.classList.remove('hidden');
    A.$('.pv', p).style.height = Math.min(box.offsetHeight, 800) + 'px';
    // listeyi düğmenin sağ kenarına hizala
    var ar = anchor.getBoundingClientRect(), w = 600;
    p.style.left = Math.max(40, Math.min(1920 - w - 40, ar.right - w)) + 'px';
    P.popOpen = kind;
    P.popAnchor = anchor;
    A.focus.modal = p;
    clearTimeout(P.osdTimer);
    A.focus.set(A.$('.opt.on', p) || A.$('.fc', p));
  }

  // ◀ ▶ ile değer değiştiren satır (listede kalır, kapanmaz)
  function adjRow(parent, label, valueFn, change, key) {
    var e = A.h('div', 'opt adj', '<span class="ck"></span>' + A.esc(label) + '<span class="sm"></span>');
    var val = A.$('.sm', e);
    function draw() { val.innerHTML = '◀&nbsp;&nbsp;' + A.esc(valueFn()) + '&nbsp;&nbsp;▶'; }
    draw();
    A.fc(e, key, function () { change(1); draw(); }, {
      onnav: function (d) {
        if (d === 'left' || d === 'right') { change(d === 'left' ? -1 : 1); draw(); return true; }
        return false;
      }
    });
    parent.appendChild(e);
  }

  function closePop(silent) {
    if (!P.popOpen) return;
    P.pop.classList.add('hidden');
    P.popOpen = null;
    A.focus.modal = null;
    if (!silent && P.popAnchor && osdVisible()) A.focus.set(P.popAnchor);
    armHide();
  }

  // ---- oynatma
  function load(item) {
    P.item = item;
    P.applied = false;
    P.probe = null;
    P.subSel = -1;
    P.subSync = 0;
    P.resumeDone = false;
    P.title.textContent = item.title;
    P.sub.innerHTML = A.esc(item.sub || '') + (item.kind === 'live' ? '<span class="plive">CANLI</span>' : '');
    P.spin.classList.remove('hidden');
    var url = item.kind === 'live' ? A.streamUrl('live', item.id, 'm3u8')
      : A.streamUrl(item.kind === 'series' ? 'series' : 'movie', item.id, item.ext);
    P.url = url;
    A.log('oynat: ' + item.kind + ' ' + item.title + ' [' + (item.ext || 'm3u8') + ']');
    P.v.src = url;
    P.v.load();
    P.v.play();
    updateBar(0);
    labels();
    showControls('p-play');
    if (item.kind !== 'live') {
      A.probe(url, item.ext, function (res) {
        if (P.url !== url) return;
        P.probe = res;
        applyPrefs();
        labels();
      });
    } else {
      P.probe = { status: 'yok', audio: [], subs: [] };
    }
  }

  function playQueue(i) {
    saveProgress(true);
    var ep = P.queue[i], base = P.item;
    P.qi = i;
    closePop(true);
    load({ kind: 'series', id: ep.id, ext: ep.ext, title: base.title, sub: ep.season + '. Sezon · ' + ep.num + '. Bölüm · ' + ep.title,
      seriesId: base.seriesId, season: ep.season, epNum: ep.num, epTitle: ep.title, poster: base.poster, backdrop: base.backdrop, resume: true });
  }

  function zap(d) {
    if (!P.list || !P.list.length) return;
    P.li = (P.li + d + P.list.length) % P.list.length;
    var ch = P.list[P.li];
    load({ kind: 'live', id: ch.id, title: ch.title, sub: P.item.sub ? P.item.sub.replace(/ ·.*$/, '') : '' });
  }

  function bindVideo(v) {
    v.addEventListener('loadedmetadata', function () {
      var it = P.item;
      if (!P.resumeDone && it.resume && it.kind !== 'live') {
        P.resumeDone = true;
        var saved = A.progress.get((it.kind === 'movie' ? 'm' : 'e') + it.id);
        if (saved && saved.t > 30 && saved.dur && saved.t < saved.dur * 0.95) {
          v.currentTime = saved.t;
          A.toast(A.fmtTime(saved.t) + ' noktasından devam ediliyor');
        }
      }
      updateBar();
      applyPrefs();
      labels();
    }, false);
    v.addEventListener('playing', function () { P.spin.classList.add('hidden'); P.pauseIcon.classList.add('hidden'); applyPrefs(); labels(); armHide(); }, false);
    v.addEventListener('waiting', function () { P.spin.classList.remove('hidden'); }, false);
    v.addEventListener('pause', function () { if (!v.ended) P.pauseIcon.classList.remove('hidden'); labels(); if (!osdVisible()) showControls('p-play'); else armHide(); }, false);
    v.addEventListener('play', function () { P.pauseIcon.classList.add('hidden'); labels(); }, false);
    v.addEventListener('timeupdate', function () { if (P.seekTarget == null) updateBar(); }, false);
    v.addEventListener('error', function () {
      P.spin.classList.add('hidden');
      var code = v.error ? v.error.code : '?';
      A.log('video hatası: ' + code);
      if (P.item.kind === 'live' && !A.isM3U() && /\.m3u8$/.test(P.url)) {
        P.url = A.streamUrl('live', P.item.id, 'ts');
        v.src = P.url; v.load(); v.play();
        return;
      }
      A.toast('Video açılamadı (hata ' + code + ')');
    }, false);
    v.addEventListener('ended', function () {
      saveProgress(true);
      var next = P.queue && P.queue[P.qi + 1];
      if (next) {
        A.toast('Sıradaki bölüm başlıyor: ' + next.season + '. Sezon ' + next.num + '. Bölüm');
        setTimeout(function () { if (A.router.top() && A.router.top().name === 'player') playQueue(P.qi + 1); }, 2500);
      } else {
        A.router.back();
      }
    }, false);
  }

  function pbtn(key, cls, html, onok) {
    return A.fc(A.h('span', 'pbtn' + (cls ? ' ' + cls : ''), html), key, onok);
  }

  A.screens.player = {
    render: function (el, params, entry) {
      var live = params.item.kind === 'live';
      el.id = 'player';
      el.innerHTML =
        '<video id="video"></video>' +
        '<div class="pspin spinner"></div>' +
        '<div class="ppause hidden">' + A.icon.pause + '</div>' +
        '<div class="posd top"><div class="ptitle nt"></div><div class="psub"></div></div>' +
        '<div class="posd bottom">' +
        (live ? '' : '<div class="pseek"><div class="ptimes"><span class="c">0:00</span><span class="r"></span></div><div class="pbar"><i></i><b></b></div></div>') +
        '<div class="pctl"><span class="lft"></span><span class="rgt"></span></div></div>' +
        '<div class="ppop hidden"></div>';
      P.v = A.$('#video', el);
      P.top = A.$('.posd.top', el);
      P.bottom = A.$('.posd.bottom', el);
      P.title = A.$('.ptitle', el);
      P.sub = A.$('.psub', el);
      P.spin = A.$('.pspin', el);
      P.pauseIcon = A.$('.ppause', el);
      P.pop = A.$('.ppop', el);
      P.popOpen = null;
      P.queue = params.queue || null;
      P.qi = params.qi || 0;
      P.list = params.list || null;
      P.li = params.li || 0;

      // İlerleme çubuğu: üzerindeyken ◀ ▶ sarar
      var seek = A.$('.pseek', el);
      if (seek) {
        P.fill = A.$('.pbar i', el);
        P.knob = A.$('.pbar b', el);
        P.tCur = A.$('.ptimes .c', el);
        P.tDur = A.$('.ptimes .r', el);
        A.fc(seek, 'p-seek', togglePlay, {
          onnav: function (d) {
            if (d === 'left' || d === 'right') { seekBy(d === 'left' ? -10 : 10); return true; }
            return d === 'up';
          }
        });
      } else {
        P.fill = P.knob = P.tCur = P.tDur = A.h('span');
      }

      var lft = A.$('.pctl .lft', el), rgt = A.$('.pctl .rgt', el);
      if (!live) lft.appendChild(pbtn('p-rew', 'ic', IC.rew, function () { seekBy(-10); }));
      P.bPlay = pbtn('p-play', 'ic big', A.icon.pause, togglePlay);
      lft.appendChild(P.bPlay);
      if (!live) lft.appendChild(pbtn('p-fwd', 'ic', IC.fwd, function () { seekBy(10); }));
      P.bAudio = pbtn('p-audio', '', IC.lang + '<span>Ses</span>', function () { openPop('audio'); });
      rgt.appendChild(P.bAudio);
      P.bSub = null;
      P.bNext = null;
      if (!live) {
        P.bSub = pbtn('p-sub', '', IC.cc + '<span>Altyazı</span>', function () { openPop('sub'); });
        rgt.appendChild(P.bSub);
      }
      if (P.queue) {
        P.bNext = pbtn('p-next', '', IC.next + '<span>Sonraki bölüm</span>', function () { if (P.queue[P.qi + 1]) playQueue(P.qi + 1); });
        rgt.appendChild(P.bNext);
      }

      P.v.addEventListener('click', togglePlay, false); // Magic Remote imleciyle tıklama
      bindVideo(P.v);
      clearInterval(P.saveTimer);
      P.saveTimer = setInterval(function () { saveProgress(false); }, 10000);
      entry.waitFocus = true;
      load(params.item);
    },

    onKey: function (k) {
      var K = A.KEY, live = P.item.kind === 'live';
      if (P.popOpen) {
        if (k === K.BACK || k === K.ESC) { closePop(); return true; }
        return false; // listede gezinme ve seçim odak motorunda
      }
      // her durumda çalışan medya tuşları
      if (k === K.PLAY) { P.v.play(); return true; }
      if (k === K.PAUSE) { P.v.pause(); return true; }
      if (k === K.PLAYPAUSE) { togglePlay(); return true; }
      if (k === K.STOP) { A.router.back(); return true; }
      if (k === K.RW) { seekBy(-10); return true; }
      if (k === K.FF) { seekBy(10); return true; }
      if (live && k === K.CH_UP) { zap(-1); return true; }
      if (live && k === K.CH_DOWN) { zap(1); return true; }
      if (k === K.YELLOW) {
        var n = audioCount();
        if (n > 1) { var a = (activeAudio() + 1) % n; selectAudio(a); rememberTracks(a); setTimeout(labels, 200); A.toast(audioList()[a].label + ' ses'); }
        return true;
      }
      if (k === K.BLUE) {
        var subs = P.probe ? P.probe.subs : [];
        if (subs.length) {
          var s = P.subSel + 1 < subs.length ? P.subSel + 1 : -1;
          selectSub(s);
          rememberTracks();
          labels();
          A.toast(s < 0 ? 'Altyazı kapalı' : A.langName(subs[s].lang) + ' altyazı');
        }
        return true;
      }
      if (!osdVisible()) {
        if (k === K.BACK || k === K.ESC) return false; // oynatıcıdan çık
        if (!live && k === K.LEFT) { seekBy(-10); return true; }
        if (!live && k === K.RIGHT) { seekBy(10); return true; }
        if (live && k === K.UP) { zap(-1); return true; }
        if (live && k === K.DOWN) { zap(1); return true; }
        showControls('p-play'); // ilk basış sadece kontrolleri açar
        return true;
      }
      armHide();
      return false; // kontroller açıkken yön tuşları ve OK odak motorunda
    },

    leave: function () {
      saveProgress(true);
      clearInterval(P.saveTimer);
      clearTimeout(P.osdTimer);
      try { P.v.pause(); P.v.removeAttribute('src'); P.v.load(); } catch (e) { /* yoksay */ }
    }
  };

  // Hata ayıklama
  window.__sahneDiag = function () {
    if (!P.v) return 'oynatıcı yok';
    return JSON.stringify({ t: Math.round(P.v.currentTime), dur: Math.round(P.v.duration || 0), audio: audioCount(), active: activeAudio(), subSel: P.subSel,
      probe: P.probe && { status: P.probe.status, audio: P.probe.audio.length, subs: P.probe.subs.length }, applied: P.applied, osd: osdVisible(), pop: P.popOpen,
      focus: A.focus.cur && A.focus.cur.getAttribute('data-key') });
  };
}(App));
