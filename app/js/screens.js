/*
 * SPDX-License-Identifier: GPL-3.0-or-later
 * Velvo — ekranlar: ana sayfa, detay, filmler/diziler, canlı TV, listem, arama, ayarlar, giriş.
 */
(function (A) {
  'use strict';

  var R = A.router, F = A.focus, h = A.h, esc = A.esc;

  // ---------------------------------------------------------------- kart ve satır yapıcıları

  function metaLine(it) {
    return [it.year, it.rating ? '★ ' + it.rating : ''].filter(function (x) { return x; }).join('  ·  ');
  }

  function posterCard(it, key, small) {
    var plat = (it.badges || []).filter(function (b) { return /Netflix|Disney|Prime|Apple|HBO|IMAX/.test(b); })[0];
    var src = A.img(it.poster, small ? 'w185' : 'w185');
    var e = h('div', 'pc' + (small ? ' sm' : ''),
      '<div class="im"' + (src ? ' data-bg="' + esc(src) + '"' : '') + '>' +
      (src ? '' : '<div class="ni nt">' + esc(it.title) + '</div>') +
      (it.rank ? '<span class="rank">' + esc(it.rank) + '</span>' : '') +
      (plat ? '<span class="plat">' + esc(plat) + '</span>' : '') + '</div>' +
      '<div class="pt nt">' + esc(it.title) + '</div><div class="pm">' + esc(metaLine(it)) + '</div>');
    return A.fc(e, key, function () { A.openItem(it); });
  }

  function landscapeCard(c, key) {
    var src = A.img(c.backdrop, 'w300') || A.img(c.poster, 'w300');
    var pct = c.dur ? Math.round(c.t / c.dur * 100) : 0;
    var sub = c.type === 'series'
      ? c.season + '. Sezon · ' + c.epNum + '. Bölüm' + (c.t < 5 ? ' · sıradaki' : '')
      : 'Kalan ' + A.fmtDuration(c.dur - c.t);
    var e = h('div', 'lc',
      '<div class="im"' + (src ? ' data-bg="' + esc(src) + '"' : '') + '><span class="play">' + A.icon.play + '</span>' +
      (pct > 0 ? '<span class="bar"><i style="width:' + pct + '%"></i></span>' : '') + '</div>' +
      '<div class="pt nt">' + esc(c.title) + '</div><div class="pm">' + esc(sub) + '</div>');
    return A.fc(e, key, function () {
      if (c.type === 'series') A.playSeries({ id: c.id, title: c.title, poster: c.poster, backdrop: c.backdrop }, c.epId);
      else A.playMovie({ id: c.id, title: c.title, ext: c.ext, poster: c.poster, backdrop: c.backdrop }, true);
    });
  }

  // keepText: başlık sağlayıcının kategori adıysa çevrilmez
  function rowEl(title, cards, cls, keepText) {
    var row = h('div', 'row mem' + (cls ? ' ' + cls : ''));
    row.appendChild(h('h3', 't-row' + (keepText ? ' nt' : ''), esc(title)));
    var hs = h('div', 'hs');
    var track = h('div', 'track');
    cards.forEach(function (c) { track.appendChild(c); });
    hs.appendChild(track);
    row.appendChild(hs);
    return row;
  }

  function loadingEl(text) {
    return h('div', 'loading', '<div class="spinner"></div>' + esc(text || 'Yükleniyor…'));
  }

  // ---------------------------------------------------------------- açma / oynatma

  A.openItem = function (it) {
    if (it.type === 'live') { A.playLive(it); return; }
    R.go('detail', { type: it.type, id: it.id, item: it });
  };

  A.playMovie = function (m, resume) {
    R.go('player', { item: { kind: 'movie', id: m.id, ext: m.ext, title: m.title, sub: [m.year, A.fmtDuration(m.durSec)].filter(Boolean).join(' · '),
      poster: m.poster, backdrop: m.backdrop, resume: resume } });
  };

  A.playLive = function (ch, list) {
    list = list || [ch];
    var li = 0;
    for (var i = 0; i < list.length; i++) if (String(list[i].id) === String(ch.id)) li = i;
    R.go('player', { item: { kind: 'live', id: ch.id, title: ch.title, sub: ch.catName || '' }, list: list, li: li });
  };

  function epTitle(t) {
    var m = /S\d+\s*E\d+\s*-\s*(.*)$/i.exec(t || '');
    return m ? m[1] : (t || '');
  }

  // Bölümleri sezon sırasına göre düzleştir
  A.seriesQueue = function (info) {
    var eps = (info && info.episodes) || {}, q = [];
    Object.keys(eps).sort(function (a, b) { return +a - +b; }).forEach(function (s) {
      (eps[s] || []).slice().sort(function (a, b) { return (+a.episode_num) - (+b.episode_num); }).forEach(function (e) {
        var i = e.info || {};
        q.push({ id: e.id, ext: e.container_extension, season: +s, num: +e.episode_num, title: epTitle(e.title),
          img: i.movie_image, plot: i.plot, dur: i.duration, durSec: +i.duration_secs || 0, res: i.video && i.video.width });
      });
    });
    return q;
  };

  A.playSeries = function (s, epId, fromStart, info) {
    function go(info) {
      var q = A.seriesQueue(info);
      if (!q.length) { A.toast('Bu dizide bölüm bulunamadı'); return; }
      var qi = 0;
      if (epId != null) for (var i = 0; i < q.length; i++) if (String(q[i].id) === String(epId)) qi = i;
      var ep = q[qi];
      R.go('player', {
        item: { kind: 'series', id: ep.id, ext: ep.ext, title: s.title, sub: ep.season + '. Sezon · ' + ep.num + '. Bölüm · ' + ep.title,
          seriesId: s.id, season: ep.season, epNum: ep.num, epTitle: ep.title, poster: s.poster, backdrop: s.backdrop, resume: !fromStart },
        queue: q, qi: qi
      });
    }
    if (info) { go(info); return; }
    A.toast('Bölümler yükleniyor…');
    A.api({ action: 'get_series_info', series_id: s.id }, function (err, inf) {
      if (err) { A.toast('Dizi bilgisi alınamadı'); return; }
      go(inf);
    });
  };

  // ---------------------------------------------------------------- sol menü

  // Velvo işareti: V + iki altyazı satırı (kaynak: velvo/logo/velvo-mark.svg)
  var LOGO_MARK = '<svg width="50" height="64" viewBox="104 80 304 390"><path d="M150 112 L256 300 L362 112" fill="none" stroke="#e6005c" ' +
    'stroke-width="64" stroke-linecap="round" stroke-linejoin="round"/><rect x="136" y="356" width="240" height="30" rx="15" fill="#fff"/>' +
    '<rect x="186" y="408" width="140" height="30" rx="15" fill="#fff" fill-opacity=".55"/></svg>';

  function buildRail() {
    var rail = A.$('#rail');
    rail.innerHTML = '<div class="logo">' + LOGO_MARK + '</div>';
    var me = A.profiles.current();
    var pe = h('div', 'ri rprof', '<span class="rav">' + A.avatar(me, 40) + '</span><span class="nt">' + esc(me ? me.name : 'Profil') + '</span>');
    pe.setAttribute('data-go', 'profiles');
    A.fc(pe, 'rail-profiles', function () { R.root('profiles'); });
    rail.appendChild(pe);
    [['search', 'search', 'Ara'], ['home', 'home', 'Ana sayfa'], ['movies', 'film', 'Filmler'], ['series', 'series', 'Diziler'],
      ['live', 'live', 'Canlı TV'], ['mylist', 'heart', 'Listem'], ['settings', 'settings', 'Ayarlar']].forEach(function (r) {
      var e = h('div', 'ri', A.icon[r[1]] + '<span>' + r[2] + '</span>');
      e.setAttribute('data-go', r[0]);
      A.fc(e, 'rail-' + r[0], function () { R.root(r[0]); });
      rail.appendChild(e);
    });
  }
  A.refreshRail = buildRail;

  // ---------------------------------------------------------------- ekran klavyesi (arama ve profil adı)

  function buildKeyboard(keys, type) {
    'abcçdefgğhıijklmnoöprsştuüvyz0123456789'.split('').forEach(function (ch) {
      keys.appendChild(A.fc(h('span', 'key', ch), 'k-' + ch, function () { type(ch); }));
    });
    keys.appendChild(A.fc(h('span', 'key w3', 'Boşluk'), 'k-sp', function () { type(' '); }));
    keys.appendChild(A.fc(h('span', 'key w2', 'Sil'), 'k-del', function () { type('del'); }));
    keys.appendChild(A.fc(h('span', 'key w2', 'Temizle'), 'k-clr', function () { type('clr'); }));
    A.$('.key', keys).setAttribute('data-autofocus', '1');
  }

  // ---------------------------------------------------------------- profiller

  function enterProfile(id) {
    A.useProfile(id);
    buildRail();
    R.root('home');
  }

  A.screens.profiles = {
    render: function (el, p, entry) {
      entry.state = entry.state || { edit: false };
      var list = A.profiles.list();
      el.innerHTML = '<div style="position:absolute; left:0; top:200px; width:1920px; text-align:center;">' +
        '<h1 class="t-xl ttl"></h1><div class="tiles" style="margin-top:90px; white-space:nowrap"></div>' +
        '<div class="pbtns" style="margin-top:90px"></div></div>';
      A.$('.ttl', el).textContent = entry.state.edit ? 'Profilleri yönet' : 'Kim izliyor?';
      var tiles = A.$('.tiles', el);
      list.forEach(function (pr) {
        var t = h('div', 'ptile', A.avatar(pr, 200) + '<div class="nm nt">' + esc(pr.name) + '</div>' + (entry.state.edit ? '<div class="ed">Düzenle</div>' : ''));
        A.fc(t, 'pt-' + pr.id, function () {
          if (entry.state.edit) R.go('profileEdit', { id: pr.id });
          else enterProfile(pr.id);
        });
        if (pr.id === A.profileId) t.setAttribute('data-autofocus', '1');
        tiles.appendChild(t);
      });
      if (list.length < 6) {
        tiles.appendChild(A.fc(h('div', 'ptile', '<span class="add">+</span><div class="nm">Profil ekle</div>'), 'pt-add', function () { R.go('profileEdit', {}); }));
      }
      var b = btn('', entry.state.edit ? 'Bitti' : 'Profilleri yönet', 'pt-manage', function () {
        entry.state.edit = !entry.state.edit;
        entry.focusKey = 'pt-manage';
        R.stack[R.stack.length - 1] = entry;
        A.screens.profiles.render(el, p, entry);
        F.set(F.byKey('pt-manage'));
      });
      A.$('.pbtns', el).appendChild(b);
    }
  };

  A.screens.profileEdit = {
    render: function (el, p, entry) {
      var cur = p.id ? A.profiles.get(p.id) : null;
      entry.state = entry.state || { name: cur ? cur.name : '', color: cur ? cur.color : A.profiles.list().length % A.PROFILE_COLORS.length };
      var st = entry.state;
      el.innerHTML = '<div class="kbdpanel" style="left:0"><h2 class="t-l" style="margin:0 0 26px">' + (cur ? 'Profili düzenle' : 'Yeni profil') + '</h2>' +
        '<div class="sfield nt"></div><div class="keys"></div></div>' +
        '<div style="position:absolute; left:820px; top:120px; width:1000px;">' +
        '<div class="prev"></div>' +
        '<div class="ph2" style="margin:50px 0 18px">Renk</div><div class="colors"></div>' +
        '<div class="ebtns" style="margin-top:70px"></div><div class="msg muted" style="margin-top:24px; font-size:26px"></div></div>';
      var field = A.$('.sfield', el), prev = A.$('.prev', el), colors = A.$('.colors', el), msg = A.$('.msg', el);
      function draw() {
        field.innerHTML = (st.name ? esc(st.name) : '<span class="ph">' + A.t('Ad yaz') + '</span>') + '<span class="cur"></span>';
        prev.innerHTML = A.avatar({ name: st.name || '?', color: st.color }, 220) + '<span style="display:inline-block; vertical-align:middle; margin-left:40px; font-size:56px; font-weight:800" class="' + (st.name ? 'nt' : '') + '">' + esc(st.name || 'Yeni profil') + '</span>';
        A.$$('.cdot', colors).forEach(function (d) { d.classList.toggle('on', +d.getAttribute('data-c') === st.color); });
      }
      buildKeyboard(A.$('.keys', el), function (ch) {
        if (ch === 'del') st.name = st.name.slice(0, -1);
        else if (ch === 'clr') st.name = '';
        else if (st.name.length < 14) st.name += (st.name ? ch : ch === 'i' ? 'İ' : ch === 'ı' ? 'I' : ch.toUpperCase());
        draw();
      });
      A.PROFILE_COLORS.forEach(function (c, i) {
        var d = h('span', 'cdot');
        d.style.background = c;
        d.setAttribute('data-c', i);
        A.fc(d, 'c-' + i, function () { st.color = i; draw(); });
        colors.appendChild(d);
      });
      var btns = A.$('.ebtns', el);
      btns.appendChild(btn(A.icon.check, 'Kaydet', 'pe-save', function () {
        var name = st.name.trim();
        if (!name) { msg.textContent = 'Profil için bir ad yaz.'; return; }
        if (cur) A.profiles.update(cur.id, name, st.color);
        else A.profiles.add(name, st.color);
        buildRail();
        A.toast(cur ? 'Profil güncellendi' : name + ' profili oluşturuldu');
        R.back();
      }, 'acc'));
      if (cur && A.profiles.list().length > 1) {
        btns.appendChild(btn('', 'Profili sil', 'pe-del', function () {
          sheet(cur.name + ' silinsin mi? İzleme geçmişi ve listesi de silinir.', [
            ['Evet, sil', function () {
              A.profiles.remove(cur.id);
              if (A.profileId === cur.id) A.useProfile(A.profiles.list()[0].id);
              buildRail();
              A.toast('Profil silindi');
              R.back();
            }],
            ['Vazgeç', null]
          ]);
        }));
      }
      draw();
    },
    onKey: function (k) {
      if ((k === A.KEY.BACK || k === A.KEY.ESC) && sheetClose) { sheetClose(); return true; }
      return false;
    }
  };

  // ---------------------------------------------------------------- ana sayfa

  var HOME_ROWS = [
    { type: 'series', re: /netflix dizi/i },
    { type: 'movie', re: /vizyon/i },
    { type: 'series', re: /^yerli diziler$/i },
    { type: 'movie', re: /netflix film/i },
    { type: 'series', re: /disney\+? dizi/i },
    { type: 'movie', re: /imdb top/i, keepOrder: true },
    { type: 'series', re: /hbo/i },
    { type: 'movie', re: /marvel/i, keepOrder: true }
  ];

  function keepOrderFor(name) { return /imdb|marvel|seri film/i.test(name); }

  // Sağlayıcı kategorilerinden varsayılan raf listesi
  A.defaultHomeRows = function () {
    var conf = [];
    HOME_ROWS.forEach(function (rc) {
      var cats = A.cats[rc.type] || [];
      for (var i = 0; i < cats.length; i++) if (rc.re.test(cats[i].name)) { conf.push({ type: rc.type, id: cats[i].id }); break; }
    });
    if (!conf.length) { // tanınmayan sağlayıcı: ilk kategoriler
      (A.cats.series || []).slice(0, 3).forEach(function (c) { conf.push({ type: 'series', id: c.id }); });
      (A.cats.movie || []).slice(0, 3).forEach(function (c) { conf.push({ type: 'movie', id: c.id }); });
    }
    return conf;
  };

  // Ana sayfa rafları: Ayarlar'dan seçildiyse o liste, yoksa varsayılan (kategoriler yüklü olmalı)
  A.homeRows = function () {
    var list = A.prefs.homeRows ? A.prefs.homeRows : A.defaultHomeRows(), out = [];
    list.forEach(function (r) {
      var c = (A.cats[r.type] || []).filter(function (x) { return String(x.id) === String(r.id); })[0];
      if (c) out.push({ type: r.type, cat: c, keepOrder: keepOrderFor(c.name) });
    });
    return out;
  };

  A.screens.home = {
    rail: true,
    render: function (el, p, entry, restore) {
      el.innerHTML =
        '<div class="bgimg"></div><div class="scrim-l"></div><div class="scrim-b"></div>' +
        '<div class="vs" style="left:150px; top:0; width:1770px; height:1080px;" data-toppad="96"><div class="vtrack" style="padding-left:40px">' +
        '<div class="hero-info" style="left:40px"></div><div class="hero-space" style="height:640px"></div><div class="rows"></div>' +
        '</div></div>';
      var rows = A.$('.rows', el), heroBox = A.$('.hero-info', el), bg = A.$('.bgimg', el);
      entry.waitFocus = true;
      var hero = { items: [], i: 0 };

      function showHero(i) {
        var it = hero.items[i];
        if (!it) return;
        hero.i = i;
        var src = A.img(it.backdrop, 'w1280');
        bg.style.opacity = 0;
        setTimeout(function () { bg.style.backgroundImage = src ? 'url("' + src + '")' : ''; bg.style.opacity = 1; }, 250);
        var fav = A.fav.has(it.type, it.id);
        heroBox.innerHTML =
          '<div class="badges"><span class="badge acc nt">' + esc(it.catName || '') + '</span><span class="badge">' + (it.type === 'series' ? 'Dizi' : 'Film') + '</span></div>' +
          '<h1 class="t-hero clamp2 nt" style="margin-top:20px">' + esc(it.title) + '</h1>' +
          '<div class="meta nt" style="margin:22px 0 18px">' + [it.year, it.genre, it.rating ? '★ ' + it.rating : ''].filter(Boolean).map(esc).join('<span class="sep"></span>') + '</div>' +
          '<p class="plot clamp2 nt" style="width:960px">' + esc(it.plot || '') + '</p>' +
          '<div style="margin-top:32px" class="hbtns"></div>' +
          '<div class="dots" style="margin-top:34px">' + hero.items.map(function (x, j) { return '<i' + (j === i ? ' class="on"' : '') + '></i>'; }).join('') + '</div>';
        var btns = A.$('.hbtns', heroBox);
        var bPlay = A.fc(h('span', 'btn', A.icon.play + 'İzle'), 'hero-play', function () {
          var pr = A.progress.get('s' + it.id);
          if (it.type === 'series') A.playSeries(it, pr ? pr.epId : null);
          else A.playMovie(it, true);
        });
        var bInfo = A.fc(h('span', 'btn', A.icon.info + 'Detaylar'), 'hero-info', function () { A.openItem(it); });
        var bFav = A.fc(h('span', 'btn round' + (fav ? ' on' : ''), fav ? A.icon.heartFill : A.icon.heart), 'hero-fav', function () {
          var on = A.fav.toggle(it);
          bFav.innerHTML = on ? A.icon.heartFill : A.icon.heart;
          bFav.classList.toggle('on', on);
          A.toast(on ? 'Listeme eklendi' : 'Listemden çıkarıldı');
        });
        [bPlay, bInfo, bFav].forEach(function (b) { b.setAttribute('data-top', '1'); btns.appendChild(b); });
        // kumanda sağ/sol uçlarda vitrini döndürür
        bPlay.onnav = function (d) { return false; };
        bFav.onnav = function (d) {
          if (d === 'right' && hero.items.length > 1) { showHero((hero.i + 1) % hero.items.length); setTimeout(function () { F.set(F.byKey('hero-fav')); }, 0); return true; }
          return false;
        };
        var focusedKey = F.cur && F.cur.getAttribute('data-key');
        if (focusedKey && focusedKey.indexOf('hero-') === 0) F.set(F.byKey(focusedKey), { noScroll: true });
      }

      // Kaldığın yerden devam et + Listem
      var cw = A.progress.continueList();
      if (cw.length) rows.appendChild(rowEl('Kaldığın yerden devam et', cw.map(function (c, i) { return landscapeCard(c, 'cw-' + c.key); }), 'lrow'));
      var favs = A.fav.list();
      if (favs.length) rows.appendChild(rowEl('Listem', favs.slice(0, 30).map(function (f) { return posterCard(f, 'fav-' + f.type + f.id); })));

      var focusGiven = false;
      function giveFocus() {
        if (focusGiven || !A.alive(entry)) return;
        focusGiven = true;
        A.restoreFocus(entry, restore);
      }
      if (!restore) setTimeout(giveFocus, 2500); // içerik gecikirse yine de odak ver

      A.loadCats('series', function () {
        A.loadCats('movie', function (err) {
          if (!A.alive(entry)) return;
          var conf = A.homeRows();
          var holders = conf.map(function () { var d = h('div'); rows.appendChild(d); return d; });
          var next = 0;
          (function loadNext() {
            if (next >= conf.length || !A.alive(entry)) {
              // vitrine uygun (arka plan görselli) içerik yoksa boşluğu kapat; rafları yukarı al
              if (!hero.items.length) { A.$('.hero-space', el).style.height = '90px'; bg.style.backgroundImage = ''; }
              giveFocus();
              return;
            }
            var rc = conf[next], holder = holders[next++];
            A.loadList(rc.type, rc.cat.id, function (err2, list) {
              if (!A.alive(entry)) return;
              if (!err2 && list && list.length) {
                if (!rc.keepOrder) list = list.slice().sort(function (a, b) { return b.added - a.added; });
                list = list.slice(0, 30);
                list.forEach(function (it) { it.catName = rc.cat.name; });
                holder.appendChild(rowEl(rc.cat.name, list.map(function (it) { return posterCard(it, rc.cat.id + '-' + it.id); }), null, true));
                if (rc.type === 'series' && !hero.items.length) {
                  var pool = list.filter(function (s) { return s.backdrop; }).slice(0, 15);
                  for (var j = pool.length - 1; j > 0; j--) { var r = Math.floor(Math.random() * (j + 1)), tmp = pool[j]; pool[j] = pool[r]; pool[r] = tmp; }
                  hero.items = pool.slice(0, 5);
                  showHero(0);
                  if (!focusGiven && !restore) { focusGiven = true; F.set(F.byKey('hero-play')); }
                }
                A.lazy();
              }
              if (next === 1 && !restore && !hero.items.length) giveFocus();
              loadNext();
            });
          })();
        });
      });

      clearInterval(A.screens.home.timer);
      A.screens.home.timer = setInterval(function () {
        if (!A.alive(entry) || hero.items.length < 2) return;
        var k = F.cur && F.cur.getAttribute('data-key');
        if (k && k.indexOf('hero-') === 0) return; // kullanıcı vitrindeyken değiştirme
        if (A.$('.vtrack', el)._off) return;      // aşağı kaydırılmışken değiştirme
        showHero((hero.i + 1) % hero.items.length);
      }, 10000);
    },
    leave: function () { clearInterval(A.screens.home.timer); }
  };

  // ---------------------------------------------------------------- detay

  function btn(icon, text, key, onok, cls) {
    return A.fc(h('span', 'btn' + (cls ? ' ' + cls : ''), icon + (text ? esc(text) : '')), key, onok);
  }

  function favBtn(it) {
    var on = A.fav.has(it.type, it.id);
    var b = btn(on ? A.icon.heartFill : A.icon.heart, '', 'd-fav', null, 'round' + (on ? ' on' : ''));
    b.onok = function () {
      var now = A.fav.toggle(it);
      b.innerHTML = now ? A.icon.heartFill : A.icon.heart;
      b.classList.toggle('on', now);
      A.toast(now ? 'Listeme eklendi' : 'Listemden çıkarıldı');
    };
    return b;
  }

  function trailerBtn(id) {
    return btn(A.icon.trailer, 'Fragman', 'd-trailer', function () {
      A.luna('luna://com.webos.applicationManager/launch', { id: 'youtube.leanback.v4', params: { contentTarget: 'v=' + id } }, function (err) {
        if (err) A.toast('YouTube açılamadı');
      });
    });
  }

  function addLangBadges(box, url, ext) {
    if (String(ext).toLowerCase() !== 'mkv') return;
    box.innerHTML = '<span class="badge line">Ses ve altyazı okunuyor…</span>';
    A.probe(url, ext, function (pr) {
      if (!box.parentNode) return;
      if (pr.status !== 'tamam') { box.innerHTML = ''; return; }
      box.innerHTML = A.langBadges(pr).map(function (b) { return '<span class="badge' + (b.tr ? ' ok' : '') + '">' + esc(b.text) + '</span>'; }).join('');
    });
  }

  A.screens.detail = {
    render: function (el, p, entry, restore) {
      entry.waitFocus = true;
      el.innerHTML = '<div class="bgimg"></div><div class="scrim-l"></div><div class="scrim-b"></div>' +
        '<div class="vs" style="left:0; top:0; width:1920px; height:1080px;" data-toppad="70"><div class="vtrack"><div class="dbody"></div></div></div>';
      el.appendChild(loadingEl());
      var body = A.$('.dbody', el), bg = A.$('.bgimg', el);
      var base = p.item || {};
      if (base.backdrop) bg.style.backgroundImage = 'url("' + A.img(base.backdrop, 'w1280') + '")';

      function done() {
        var l = A.$('.loading', el);
        if (l) l.parentNode.removeChild(l);
        A.restoreFocus(entry, restore);
        if (!F.cur || !F.cur.offsetParent) F.set(F.byKey('d-play'));
        A.lazy();
      }

      if (p.type === 'movie') {
        A.api({ action: 'get_vod_info', vod_id: p.id }, function (err, d) {
          if (!A.alive(entry)) return;
          if (err || !d || !d.info) { body.innerHTML = '<div class="empty" style="padding:200px 110px">Bilgi alınamadı: ' + esc(err || '') + '</div>'; done(); return; }
          renderMovie(d);
          done();
        });
      } else {
        A.api({ action: 'get_series_info', series_id: p.id }, function (err, d) {
          if (!A.alive(entry)) return;
          if (err || !d) { body.innerHTML = '<div class="empty" style="padding:200px 110px">Bilgi alınamadı: ' + esc(err || '') + '</div>'; done(); return; }
          renderSeries(d);
          done();
        });
      }

      function head(title, metaParts, badges, plot, extra) {
        return '<div style="position:absolute; left:110px; top:64px; font-size:26px; color:#c9cdd4">' + A.icon.back + ' ' + (base.catName ? '<span class="nt">' + esc(base.catName) + '</span>' : esc(p.type === 'movie' ? 'Filmler' : 'Diziler')) + '</div>' +
          '<div style="position:absolute; left:110px; top:130px; width:1150px;">' +
          '<h1 class="t-hero clamp2 nt">' + esc(title) + '</h1>' +
          '<div class="meta" style="margin:22px 0 18px">' + metaParts.filter(Boolean).map(function (x) { return x.nt ? '<span class="nt">' + esc(x.nt) + '</span>' : esc(x); }).join('<span class="sep"></span>') + '</div>' +
          '<div class="badges">' + badges.map(function (b) { return '<span class="badge' + (b === 'Netflix' || b === 'Marvel' ? ' acc' : '') + '">' + esc(b) + '</span>'; }).join('') + '<span class="langbox"></span></div>' +
          '<p class="plot clamp3 nt" style="margin-top:8px">' + esc(plot || '') + '</p>' + (extra || '') +
          '<div class="dbtns" style="margin-top:30px"></div></div>';
      }

      function renderMovie(d) {
        var i = d.info, md = d.movie_data || {};
        var c = A.clean(md.name || i.name || base.title);
        var it = A.extend({}, base, { type: 'movie', id: p.id, title: c.title || base.title, year: c.year || String(i.releasedate || '').slice(0, 4),
          ext: md.container_extension || base.ext, poster: i.cover_big || i.movie_image || base.poster, backdrop: (i.backdrop_path || [])[0] || base.backdrop,
          durSec: +i.duration_secs || 0, rating: c.rating || (i.rating ? (+i.rating).toFixed(1) : base.rating), badges: c.badges.length ? c.badges : (base.badges || []) });
        if (it.backdrop) bg.style.backgroundImage = 'url("' + A.img(it.backdrop, 'w1280') + '")';
        var badges = it.badges.slice();
        var res = A.resBadge(i.video && i.video.width);
        if (res) badges.push(res);
        var extra = '<div class="kv">' +
          (i.cast ? '<div><b>Oyuncular</b><span class="clamp2 nt">' + esc(i.cast) + '</span></div>' : '') +
          (i.director ? '<div><b>Yönetmen</b><span class="nt">' + esc(i.director) + '</span></div>' : '') + '</div>';
        body.innerHTML = head(it.title, [it.year, A.fmtDuration(it.durSec || i.duration), i.genre ? { nt: i.genre } : '', it.rating ? '★ ' + it.rating : ''], badges, i.plot || i.description, extra) +
          '<div class="similar" style="position:absolute; left:110px; top:860px; width:1810px;"></div>';
        var pr = A.progress.get('m' + it.id);
        var btns = A.$('.dbtns', body);
        var resumable = pr && pr.t > 30 && pr.dur && pr.t < pr.dur * 0.95;
        btns.appendChild(btn(A.icon.play, resumable ? 'Devam et · ' + A.fmtTime(pr.t) : 'İzle', 'd-play', function () { A.playMovie(it, true); }, 'acc'));
        if (resumable) btns.appendChild(btn(A.icon.replay, 'Baştan izle', 'd-restart', function () { A.progress.put('m' + it.id, null); A.playMovie(it, false); }));
        if (i.youtube_trailer) btns.appendChild(trailerBtn(i.youtube_trailer));
        btns.appendChild(favBtn(it));
        addLangBadges(A.$('.langbox', body), A.streamUrl('movie', it.id, it.ext), it.ext);
        // benzer içerikler: aynı kategoriden
        var catId = md.category_id || base.cat;
        if (catId) {
          A.loadList('movie', catId, function (err, list) {
            if (err || !A.alive(entry) || !list) return;
            var sim = list.filter(function (x) { return String(x.id) !== String(it.id); }).sort(function (a, b) { return b.added - a.added; }).slice(0, 20);
            if (!sim.length) return;
            sim.forEach(function (x) { x.catName = base.catName; });
            A.$('.similar', body).appendChild(rowEl('Benzer içerikler', sim.map(function (x) { return posterCard(x, 'sim-' + x.id, true); })));
            A.lazy();
          });
        }
      }

      function renderSeries(d) {
        var info = d.info || {}, q = A.seriesQueue(d);
        var c = A.clean(info.name || base.title);
        var s = A.extend({}, base, { type: 'series', id: p.id, title: c.title || base.title, poster: info.cover || base.poster,
          backdrop: (info.backdrop_path || [])[0] || base.backdrop, year: String(info.releaseDate || base.year || '').slice(0, 4),
          rating: info.rating && +info.rating ? (+info.rating).toFixed(1) : base.rating, badges: c.badges.length ? c.badges : (base.badges || []) });
        if (s.backdrop) bg.style.backgroundImage = 'url("' + A.img(s.backdrop, 'w1280') + '")';
        var seasons = [];
        q.forEach(function (e) { if (seasons.indexOf(e.season) < 0) seasons.push(e.season); });
        var badges = s.badges.slice();
        var res = q[0] && A.resBadge(q[0].res);
        if (res) badges.push(res);
        var extra = info.cast ? '<p class="muted clamp2" style="font-size:24px; margin:10px 0 0">Oyuncular: <span class="nt">' + esc(info.cast) + '</span></p>' : '';
        body.innerHTML = head(s.title, [s.year, seasons.length + ' sezon', info.genre ? { nt: info.genre } : '', s.rating ? '★ ' + s.rating : ''], badges, info.plot, extra) +
          '<div class="eparea" style="position:absolute; left:110px; top:800px; width:1810px;"></div>';
        var pr = A.progress.get('s' + s.id);
        var cont = null;
        if (pr) for (var k = 0; k < q.length; k++) if (String(q[k].id) === String(pr.epId)) cont = q[k];
        var first = q[0];
        var btns = A.$('.dbtns', body);
        if (cont) {
          btns.appendChild(btn(A.icon.play, 'Devam et · ' + cont.season + '. Sezon ' + cont.num + '. Bölüm', 'd-play', function () { A.playSeries(s, cont.id, false, d); }, 'acc'));
          btns.appendChild(btn(A.icon.replay, 'Baştan izle', 'd-restart', function () { A.playSeries(s, first.id, true, d); }));
        } else if (first) {
          btns.appendChild(btn(A.icon.play, 'İzle · ' + first.season + '. Sezon ' + first.num + '. Bölüm', 'd-play', function () { A.playSeries(s, first.id, false, d); }, 'acc'));
        }
        if (info.youtube_trailer) btns.appendChild(trailerBtn(info.youtube_trailer));
        btns.appendChild(favBtn(s));
        var target = cont || first;
        if (target) addLangBadges(A.$('.langbox', body), A.streamUrl('series', target.id, target.ext), target.ext);

        // sezon sekmeleri + bölümler
        var area = A.$('.eparea', body);
        var seg = h('div', 'seg mem');
        var epHolder = h('div', 'row mem', '');
        epHolder.style.marginTop = '24px';
        epHolder.style.height = '220px';
        area.appendChild(seg);
        area.appendChild(epHolder);
        var curSeason = target ? target.season : seasons[0], segTimer = null;

        function showSeason(sn) {
          curSeason = sn;
          A.$$('span', seg).forEach(function (x) { x.classList.toggle('on', +x.getAttribute('data-s') === sn); });
          var eps = q.filter(function (e) { return e.season === sn; });
          var hs = h('div', 'hs'), track = h('div', 'track');
          eps.forEach(function (e) {
            var ep = A.progress.get('e' + e.id);
            var pct = ep && ep.dur ? Math.round(ep.t / ep.dur * 100) : 0;
            var img = A.img(e.img, 'w185');
            var card = h('div', 'ep',
              '<div class="im"' + (img ? ' data-bg="' + esc(img) + '"' : '') + '></div><div class="tx">' +
              '<div class="tt nt">' + e.num + '. ' + esc(e.title) + '</div><div class="du">' + esc(A.fmtDuration(e.durSec || e.dur)) + '</div>' +
              '<div class="pl clamp2 nt">' + esc(e.plot || '') + '</div></div>' +
              (pct >= 95 ? '<span class="done">' + A.icon.check + '</span>' : '') +
              (pct > 0 && pct < 95 ? '<span class="bar"><i style="width:' + pct + '%"></i></span>' : ''));
            A.fc(card, 'ep-' + e.id, function () { A.playSeries(s, e.id, false, d); });
            track.appendChild(card);
          });
          hs.appendChild(track);
          epHolder.innerHTML = '';
          epHolder.appendChild(hs);
          A.lazy();
        }
        seasons.forEach(function (sn) {
          var sp = h('span', '', sn === 0 ? 'Özel' : 'Sezon ' + sn);
          sp.setAttribute('data-s', sn);
          A.fc(sp, 'season-' + sn, function () { showSeason(sn); });
          sp.onfocusx = function () { clearTimeout(segTimer); segTimer = setTimeout(function () { if (sn !== curSeason) showSeason(sn); }, 300); };
          seg.appendChild(sp);
        });
        showSeason(curSeason);
      }
    }
  };

  // ---------------------------------------------------------------- filmler / diziler / canlı TV

  // Logosu olmayan kanal için kısa etiket: "TRT 1 HD" → TRT, "Big Buck Bunny" → BB
  function chInitials(t) {
    var w = String(t || '').replace(/^[A-Z]{2,3}\s*[:|]\s*/, '').replace(/[^0-9A-Za-zÇĞİÖŞÜçğıöşü]+/g, ' ').split(' ').filter(function (x, i) { return x && (i === 0 || !/^(of|the|and|ve|ile|de|da|la|le|el|a|an)$/.test(x)); });
    if (!w.length) return '•';
    if (w[0].length <= 4 && w[0] === w[0].toUpperCase()) return w[0];
    return (w[0].charAt(0) + (w[1] ? w[1].charAt(0) : '')).toUpperCase();
  }

  function browse(type, railKey) {
    return {
      rail: true, railKey: railKey,
      render: function (el, p, entry, restore) {
        entry.waitFocus = true;
        entry.state = entry.state || {};
        el.innerHTML = '<div class="side"><h2 class="t-l">' + { movie: 'Filmler', series: 'Diziler', live: 'Canlı TV' }[type] + '</h2>' +
          '<div class="vs" style="left:0; top:150px; width:440px; height:930px;" data-toppad="20"><div class="vtrack cats nt"></div></div></div>' +
          '<div class="vs" style="left:580px; top:0; width:1340px; height:1080px;" data-toppad="60"><div class="vtrack" style="padding-left:20px"><div class="gtitle t-l nt" style="margin:60px 0 30px"></div><div class="grid"></div></div></div>';
        var catsBox = A.$('.cats', el), grid = A.$('.grid', el), gtitle = A.$('.gtitle', el);
        var timer = null, shown = null;

        function showCat(c) {
          if (shown === c.id) return;
          shown = c.id;
          entry.state.cat = c.id;
          A.$$('.cat', catsBox).forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-id') === String(c.id)); });
          gtitle.textContent = c.name;
          grid.innerHTML = '<div class="empty">Yükleniyor…</div>';
          A.$('.vtrack', grid.parentNode.parentNode)._off = 0;
          grid.parentNode.style.transform = 'translateY(0)';
          A.loadList(type, c.id, function (err, list) {
            if (!A.alive(entry) || shown !== c.id) return;
            grid.innerHTML = '';
            if (err) { grid.innerHTML = '<div class="empty">Yüklenemedi: ' + esc(err) + '</div>'; return; }
            if (type !== 'live') list = list.slice().sort(function (a, b) { return b.added - a.added; });
            var total = list.length;
            list = list.slice(0, type === 'live' ? 400 : 240);
            list.forEach(function (it, i) {
              it.catName = c.name;
              if (type === 'live') {
                var logo = A.img(it.poster, 'w92') ? '<span class="lg" data-bg="' + esc(it.poster) + '"></span>' : '<span class="lg ini nt">' + esc(chInitials(it.title)) + '</span>';
                var row = h('div', 'chrow', logo + '<span class="nm nt">' + esc(it.title) + '</span>');
                row.style.width = '1240px';
                A.fc(row, 'g' + it.id, function () { A.playLive(it, list); });
                grid.appendChild(row);
              } else {
                grid.appendChild(posterCard(it, 'g' + it.id, true));
              }
            });
            if (!list.length) grid.innerHTML = '<div class="empty">Bu kategoride içerik yok.</div>';
            if (total > list.length) grid.appendChild(h('div', 'empty', 'İlk ' + list.length + ' / ' + total + ' gösteriliyor · tamamı için Ara'));
            A.lazy();
            if (restore && entry.focusKey && entry.focusKey.charAt(0) === 'g') { var e = F.byKey(entry.focusKey); if (e) F.set(e); restore = false; }
          });
        }

        A.loadCats(type, function (err, cats) {
          if (!A.alive(entry)) return;
          if (err) { catsBox.innerHTML = '<div class="empty" style="padding:30px">Kategoriler alınamadı</div>'; return; }
          cats.forEach(function (c) {
            var e = h('div', 'cat', esc(c.name));
            e.setAttribute('data-id', c.id);
            A.fc(e, 'cat-' + c.id, function () { showCat(c); F.move('right'); });
            e.onfocusx = function () { clearTimeout(timer); timer = setTimeout(function () { showCat(c); }, 350); };
            catsBox.appendChild(e);
          });
          var start = cats.filter(function (c) { return String(c.id) === String(entry.state.cat); })[0] || cats[0];
          if (start) showCat(start);
          if (restore && entry.focusKey && entry.focusKey.charAt(0) === 'g') return; // ızgara yüklenince odaklanır
          F.set(F.byKey('cat-' + (start && start.id)) || F.all()[0]);
        });
      }
    };
  }
  A.screens.movies = browse('movie', 'movies');
  A.screens.series = browse('series', 'series');
  A.screens.live = browse('live', 'live');

  // ---------------------------------------------------------------- listem

  A.screens.mylist = {
    rail: true,
    render: function (el) {
      var favs = A.fav.list();
      el.innerHTML = '<div class="vs" style="left:150px; top:0; width:1770px; height:1080px;" data-toppad="60"><div class="vtrack" style="padding-left:40px">' +
        '<h1 class="t-l" style="margin:60px 0 30px">Listem</h1><div class="grid"></div></div></div>';
      var grid = A.$('.grid', el);
      if (!favs.length) grid.innerHTML = '<div class="empty">Listen boş. Bir film ya da dizinin detayında kalp düğmesine basarak ekleyebilirsin.</div>';
      favs.forEach(function (f) { grid.appendChild(posterCard(f, 'fav-' + f.type + f.id, true)); });
    }
  };

  // ---------------------------------------------------------------- arama

  var index = null, indexLoading = false, indexWaiters = [];
  function loadIndex(cb) {
    if (index) { cb(index); return; }
    indexWaiters.push(cb);
    if (indexLoading) return;
    indexLoading = true;
    var out = { movie: [], series: [], live: [] }, types = ['movie', 'series', 'live'], i = 0;
    (function next() {
      if (i >= types.length) {
        index = out;
        indexLoading = false;
        indexWaiters.forEach(function (f) { f(index); });
        indexWaiters = [];
        return;
      }
      var t = types[i++];
      A.loadCats(t, function () {
        var names = {};
        (A.cats[t] || []).forEach(function (c) { names[c.id] = c.name; });
        A.loadList(t, null, function (err, list) {
          if (!err && list) out[t] = list.map(function (it) { it.catName = names[it.cat] || ''; return { n: A.norm(it.title), it: it }; });
          A.dropCache(t === 'movie' ? 'get_vod_streams' : t === 'series' ? 'get_series' : 'get_live_streams');
          next();
        });
      });
    })();
  }

  function searchIn(list, q) {
    var starts = [], words = [], contains = [];
    for (var i = 0; i < list.length; i++) {
      var n = list[i].n, p = n.indexOf(q);
      if (p < 0) continue;
      if (p === 0) starts.push(list[i].it);
      else if (n.charAt(p - 1) === ' ') words.push(list[i].it);
      else contains.push(list[i].it);
      if (starts.length >= 30) break;
    }
    return starts.concat(words, contains).slice(0, 30);
  }

  A.screens.search = {
    rail: true,
    render: function (el, p, entry) {
      entry.state = entry.state || { q: '' };
      el.innerHTML = '<div class="kbdpanel"><div class="sfield"></div><div class="keys"></div>' +
        '<div class="dim" style="margin-top:30px; font-size:24px;">Film, dizi ve kanal adlarında arar.</div></div>' +
        '<div class="vs" style="left:840px; top:0; width:1080px; height:1080px;" data-toppad="40"><div class="vtrack" style="padding-left:20px"><div class="results" style="padding-top:64px"></div></div></div>';
      var field = A.$('.sfield', el), keys = A.$('.keys', el), results = A.$('.results', el), timer = null;

      function drawField() {
        field.innerHTML = (entry.state.q ? '<span class="nt">' + esc(entry.state.q) + '</span>' : '<span class="ph">' + A.t('Ara') + '</span>') + '<span class="cur"></span>';
      }
      function type(ch) {
        if (ch === 'del') entry.state.q = entry.state.q.slice(0, -1);
        else if (ch === 'clr') entry.state.q = '';
        else entry.state.q += ch;
        drawField();
        clearTimeout(timer);
        timer = setTimeout(run, 250);
      }
      function run() {
        var q = A.norm(entry.state.q.trim());
        if (q.length < 2) { results.innerHTML = '<div class="empty">En az 2 harf yaz.</div>'; return; }
        if (!index) results.innerHTML = '<div class="empty">Arşiv hazırlanıyor… (ilk aramada birkaç saniye sürer)</div>';
        loadIndex(function (ix) {
          if (!A.alive(entry) || A.norm(entry.state.q.trim()) !== q) return;
          results.innerHTML = '';
          var groups = [['Diziler', searchIn(ix.series, q)], ['Filmler', searchIn(ix.movie, q)], ['Canlı TV', searchIn(ix.live, q)]];
          var any = false;
          groups.forEach(function (g) {
            if (!g[1].length) return;
            any = true;
            var row = rowEl(g[0] + ' · ' + g[1].length, g[1].map(function (it) {
              if (it.type === 'live') {
                var c = h('div', 'pc sm', '<div class="im" style="background-size:contain; background-color:#1b1d23"' + (A.img(it.poster, 'w185') ? ' data-bg="' + esc(it.poster) + '"' : '') + '></div><div class="pt nt">' + esc(it.title) + '</div><div class="pm nt">' + esc(it.catName) + '</div>');
                return A.fc(c, 'r-' + it.type + it.id, function () { A.playLive(it); });
              }
              return posterCard(it, 'r-' + it.type + it.id, true);
            }));
            row.style.height = '410px';
            A.$('.hs', row).setAttribute('data-lpad', '0');
            results.appendChild(row);
          });
          if (!any) results.innerHTML = '<div class="empty">"' + esc(entry.state.q) + '" için sonuç yok.</div>';
          A.lazy();
        });
      }

      buildKeyboard(keys, type);
      drawField();
      if (entry.state.q) run(); else results.innerHTML = '<div class="empty">Kumandayla harfleri seçip OK\'a bas.</div>';
      A.$('.key', keys).setAttribute('data-autofocus', '1');
      loadIndex(function () { }); // arşivi arka planda hazırla
    },
    onKey: function (k, e, entry) {
      // kumandadaki geri tuşu harf siler, alan boşsa ekrandan çıkar
      if ((k === A.KEY.BACK || k === A.KEY.BACKSPACE) && entry.state.q && F.cur && A.parentWith(F.cur, 'kbdpanel')) {
        F.byKey('k-del').onok();
        return true;
      }
      return false;
    }
  };

  // ---------------------------------------------------------------- ayarlar

  // Ses/altyazı tercih seçenekleri: TV dili, İngilizce, Orijinal/Kapalı (+ şu an seçili olan)
  function langOpts(cur, codes) {
    var out = [], seen = {};
    codes.concat([cur]).forEach(function (c) {
      if (!c || seen[c]) return;
      seen[c] = 1;
      out.push([c, c === 'orig' ? 'Orijinal' : c === 'off' ? 'Kapalı' : A.langName(c)]);
    });
    return out;
  }

  function segRow(label, hint, opts, get, set, key, ntFrom) {
    var row = h('div', 'setrow', '<div class="lb"><div>' + esc(label) + '</div>' + (hint ? '<small>' + esc(hint) + '</small>' : '') + '</div><div class="ctl"><div class="seg"></div></div>');
    var seg = A.$('.seg', row);
    function draw() {
      seg.innerHTML = opts.map(function (o, i) {
        var cls = (o[0] === get() ? 'on' : '') + (ntFrom != null && i >= ntFrom ? ' nt' : '');
        return '<span' + (cls.trim() ? ' class="' + cls.trim() + '"' : '') + '>' + esc(o[1]) + '</span>';
      }).join('');
    }
    function shift(d) {
      var idx = 0;
      for (var i = 0; i < opts.length; i++) if (opts[i][0] === get()) idx = i;
      idx = (idx + d + opts.length) % opts.length;
      set(opts[idx][0]);
      draw();
    }
    draw();
    A.fc(row, key, function () { shift(1); }, { onnav: function (d) { if (d === 'left' || d === 'right') { shift(d === 'left' ? -1 : 1); return true; } return false; } });
    return row;
  }
  function toggleRow(label, hint, get, set, key) {
    var row = h('div', 'setrow', '<div class="lb"><div>' + esc(label) + '</div>' + (hint ? '<small>' + esc(hint) + '</small>' : '') + '</div><div class="ctl"><span class="toggle"><i></i></span></div>');
    var t = A.$('.toggle', row);
    function draw() { t.classList.toggle('on', !!get()); }
    draw();
    A.fc(row, key, function () { set(!get()); draw(); });
    return row;
  }

  // Ekranın ortasında açılan seçenek penceresi (Geri ile kapanır)
  var sheetClose = null;
  function sheet(title, actions) {
    var root = R.top().el, prev = F.cur;
    var ov = h('div', 'sheet-ov'), box = h('div', 'sheet');
    box.appendChild(h('div', 'ph2', esc(title)));
    function close() {
      if (ov.parentNode) ov.parentNode.removeChild(ov);
      F.modal = null;
      sheetClose = null;
      if (prev && prev.parentNode) F.set(prev);
    }
    actions.forEach(function (a, i) {
      box.appendChild(A.fc(h('div', 'opt', esc(a[0])), 'sh' + i, function () { close(); if (a[1]) a[1](); }));
    });
    ov.appendChild(box);
    root.appendChild(ov);
    sheetClose = close;
    F.modal = box;
    F.set(A.$('.fc', box));
  }

  A.screens.settings = {
    rail: true,
    onKey: function (k) {
      if ((k === A.KEY.BACK || k === A.KEY.ESC) && sheetClose) { sheetClose(); return true; }
      return false;
    },
    render: function (el, p, entry) {
      entry.state = entry.state || { tab: 'lang' };
      el.innerHTML = '<div class="side"><h2 class="t-l">Ayarlar</h2><div class="menu" style="padding-top:10px"></div></div>' +
        '<div class="vs" style="left:640px; top:0; width:1240px; height:1080px;" data-toppad="150"><div class="vtrack" style="padding:60px 40px 80px 0">' +
        '<h2 class="t-l ttl" style="margin:0 0 30px 30px"></h2><div class="panel"></div></div></div>';
      var menu = A.$('.menu', el), panel = A.$('.panel', el), ttl = A.$('.ttl', el), vt = A.$('.vs .vtrack', el);
      var tabs = [['profile', 'Profil'], ['lang', 'Dil ve altyazı'], ['subs', 'Altyazı görünümü'], ['home', 'Ana sayfa'], ['account', 'IPTV hesabı'], ['about', 'Hakkında']];

      function saveRows(rows) {
        A.prefs.homeRows = rows.map(function (r) { return { type: r.type, id: r.cat.id }; });
        A.savePrefs();
      }

      function drawHomeRows(focusKey) {
        panel.innerHTML = '';
        panel.appendChild(h('div', 'empty', 'Ana sayfada hangi kategorilerin hangi sırayla görüneceğini seç. Bir rafın üzerinde OK\'a basınca taşıyabilir ya da kaldırabilirsin.'));
        var rows = A.homeRows();
        panel.appendChild(h('div', 'ph2', 'Ana sayfada · ' + rows.length + ' raf'));
        rows.forEach(function (r, i) {
          var row = h('div', 'setrow', '<div class="lb"><div class="nt">' + (i + 1) + '. ' + esc(r.cat.name) + '</div><small>' + (r.type === 'series' ? 'Dizi' : 'Film') + '</small></div><div class="ctl dim" style="font-size:23px; padding-top:20px">OK: düzenle</div>');
          var key = 'hr-' + r.type + r.cat.id;
          A.fc(row, key, function () {
            function move(d) {
              var j = i + d;
              if (j < 0 || j >= rows.length) return;
              var t = rows[i]; rows[i] = rows[j]; rows[j] = t;
              saveRows(rows);
              drawHomeRows(key);
            }
            sheet(r.cat.name, [
              ['Yukarı taşı', function () { move(-1); }],
              ['Aşağı taşı', function () { move(1); }],
              ['Ana sayfadan kaldır', function () { rows.splice(i, 1); saveRows(rows); A.toast(r.cat.name + ' kaldırıldı'); drawHomeRows(); }],
              ['Vazgeç', null]
            ]);
          });
          panel.appendChild(row);
        });
        var reset = h('div', '', '');
        reset.style.margin = '20px 0 10px 30px';
        reset.appendChild(btn(A.icon.replay, 'Varsayılana dön', 'hr-reset', function () {
          delete A.prefs.homeRows;
          A.savePrefs();
          A.toast('Varsayılan raflar geri yüklendi');
          drawHomeRows('hr-reset');
        }));
        panel.appendChild(reset);
        panel.appendChild(h('div', 'ph2', 'Eklenebilir kategoriler'));
        ['series', 'movie'].forEach(function (type) {
          (A.cats[type] || []).forEach(function (c) {
            if (rows.some(function (r) { return r.type === type && String(r.cat.id) === String(c.id); })) return;
            var row = h('div', 'setrow', '<div class="lb"><div class="nt">＋ ' + esc(c.name) + '</div><small>' + (type === 'series' ? 'Dizi' : 'Film') + '</small></div>');
            A.fc(row, 'ha-' + type + c.id, function () {
              rows.push({ type: type, cat: c });
              saveRows(rows);
              A.toast(c.name + ' ana sayfaya eklendi');
              drawHomeRows('hr-' + type + c.id);
            });
            panel.appendChild(row);
          });
        });
        var f = focusKey && F.byKey(focusKey);
        if (f) F.set(f);
      }

      function show(tab) {
        entry.state.tab = tab;
        A.$$('.cat', menu).forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-t') === tab); });
        panel.innerHTML = '';
        vt._off = 0;
        vt.style.transform = 'translateY(0)';
        if (tab === 'home') {
          ttl.textContent = 'Ana sayfa rafları';
          panel.innerHTML = '<div class="empty">Kategoriler yükleniyor…</div>';
          A.loadCats('series', function () {
            A.loadCats('movie', function () {
              if (A.alive(entry) && entry.state.tab === 'home') drawHomeRows();
            });
          });
        } else if (tab === 'lang') {
          ttl.textContent = 'Dil ve altyazı';
          panel.appendChild(segRow('Uygulama dili', 'Menülerin dili', A.UI_LANGS, function () { return A.prefs.uiLang || 'auto'; }, function (v) {
            A.prefs.uiLang = v;
            A.savePrefs();
            A.applyLang();
            A.refreshRail();
            // metinler ekrana çizilirken çevrildiği için ekranı yeniden çiz
            setTimeout(function () { R.root('settings'); F.set(F.byKey('set-uilang')); }, 0);
          }, 'set-uilang', 1));
          panel.appendChild(segRow('Tercih edilen ses', 'Film açılınca bu dil varsa otomatik seçilir', langOpts(A.prefs.audio, [A.homeLang, 'orig', 'en']),
            function () { return A.prefs.audio; }, function (v) { A.prefs.audio = v; A.savePrefs(); }, 'set-audio'));
          panel.appendChild(segRow('Tercih edilen altyazı', 'Önce dosyanın içinde aranır', langOpts(A.prefs.sub, [A.homeLang, 'en', 'off']),
            function () { return A.prefs.sub; }, function (v) { A.prefs.sub = v; A.savePrefs(); }, 'set-sub'));
          panel.appendChild(toggleRow('Ses altyazı dilindeyse altyazıyı kapat', 'Dublajlı izlerken altyazı açılmaz',
            function () { return A.prefs.subOffWithTrAudio; }, function (v) { A.prefs.subOffWithTrAudio = v; A.savePrefs(); }, 'set-subofftr'));
          panel.appendChild(h('div', 'empty', 'İzlerken Ses ve Altyazı düğmeleriyle dili her zaman değiştirebilirsin. Sarı tuş sesi, mavi tuş altyazıyı hızlıca değiştirir. Bir dizide yaptığın seçim sonraki bölümlerde de uygulanır.'));
        } else if (tab === 'subs') {
          ttl.textContent = 'Altyazı görünümü';
          var prevBox = h('div', 'subprev', '<div class="txt">Bu akşam partiye kimler geliyor, biliyor musun?</div>');
          var drawPrev = function () {
            var pr = A.prefs, t = A.$('.txt', prevBox);
            var size = { 1: 26, 2: 34, 3: 42, 4: 52 }[pr.subSize] || 34;
            var col = '#ffffff';
            A.SUB_COLORS.forEach(function (c) { if (c[0] === pr.subColor) col = c[2]; });
            t.style.fontSize = size + 'px';
            t.style.color = col;
            t.style.bottom = (30 + (pr.subPos || 0) * 14) + 'px';
          };
          var setP = function (k) { return function (v) { A.prefs[k] = v; A.savePrefs(); drawPrev(); }; };
          var getP = function (k) { return function () { return A.prefs[k]; }; };
          panel.appendChild(segRow('Boyut', '', A.SUB_SIZES, getP('subSize'), setP('subSize'), 'sub-size'));
          panel.appendChild(segRow('Yazı rengi', '', A.SUB_COLORS, getP('subColor'), setP('subColor'), 'sub-color'));
          panel.appendChild(segRow('Konum', '', A.SUB_POS, getP('subPos'), setP('subPos'), 'sub-pos'));
          panel.appendChild(prevBox);
          panel.appendChild(h('div', 'empty', 'Önizleme yaklaşıktır. Ayarlar altyazı açıldığında uygulanır. İzlerken Altyazı düğmesinin penceresinden de boyutu, rengi ve konumu anında değiştirebilirsin.'));
          drawPrev();
        } else if (tab === 'profile') {
          var me = A.profiles.current();
          ttl.textContent = 'Profil';
          panel.appendChild(h('div', '', '<div style="margin:10px 0 40px 30px">' + A.avatar(me, 160) + '<span style="display:inline-block; vertical-align:middle; margin-left:36px; font-size:52px; font-weight:800" class="nt">' + esc(me.name) + '</span></div>'));
          var pb = h('div', '', '');
          pb.style.marginLeft = '30px';
          pb.appendChild(btn('', 'Profili düzenle', 'set-pedit', function () { R.go('profileEdit', { id: me.id }); }));
          pb.appendChild(btn('', 'Profil değiştir', 'set-pswitch', function () { R.root('profiles'); }));
          panel.appendChild(pb);
          panel.appendChild(h('div', 'empty', 'İzleme geçmişi, Listem, dil ve altyazı ayarları ile ana sayfa düzeni her profile özeldir.'));
        } else if (tab === 'account') {
          ttl.textContent = 'IPTV hesabı';
          var mask = new Array(Math.min(12, (A.creds.pass || '').length) + 1).join('•');
          var info = h('div', 'kv', A.isM3U()
            ? '<div><b>Tür</b><span>M3U listesi</span></div><div><b>Liste adresi</b><span class="nt">' + esc(A.creds.url) + '</span></div>'
            : '<div><b>Tür</b><span>Xtream</span></div><div><b>Sunucu</b><span class="nt">' + esc(A.creds.base) + '</span></div>' +
              '<div><b>Kullanıcı adı</b><span class="nt">' + esc(A.creds.user) + '</span></div>' +
              '<div><b>Şifre</b><span>' + mask + '</span></div>' +
              '<div class="subinfo"><b>Abonelik</b><span class="dim">Bilgi alınıyor…</span></div>');
          info.style.marginLeft = '30px';
          panel.appendChild(info);
          if (!A.isM3U()) A.api({}, function (err, d) {
            var box = A.$('.subinfo', info);
            if (!box) return;
            if (err || !d || !d.user_info) { box.innerHTML = '<b>Abonelik</b><span class="dim">Bilgi alınamadı</span>'; return; }
            var u = d.user_info, rows = '';
            var active = String(u.status).toLowerCase() === 'active';
            rows += '<div><b>Durum</b><span style="color:' + (active ? '#7ae8cf' : '#ff8fb7') + '">' + (active ? 'Aktif' : esc(u.status || '?')) + (String(u.is_trial) === '1' ? ' · deneme' : '') + '</span></div>';
            if (u.exp_date && +u.exp_date) {
              var ex = new Date(+u.exp_date * 1000), days = Math.ceil((ex.getTime() - Date.now()) / 86400000);
              var pad = function (n) { return (n < 10 ? '0' : '') + n; };
              rows += '<div><b>Bitiş tarihi</b><span>' + pad(ex.getDate()) + '.' + pad(ex.getMonth() + 1) + '.' + ex.getFullYear() + ' · ' + (days >= 0 ? days + ' gün kaldı' : 'süresi doldu') + '</span></div>';
            } else {
              rows += '<div><b>Bitiş tarihi</b><span>Süresiz</span></div>';
            }
            if (u.max_connections) rows += '<div><b>Bağlantı</b><span>' + esc(u.active_cons || 0) + ' / ' + esc(u.max_connections) + ' cihaz kullanımda</span></div>';
            box.outerHTML = rows;
          });
          var acts = h('div', '', '');
          acts.style.margin = '40px 0 0 30px';
          acts.appendChild(btn('', 'Hesap bilgilerini düzenle', 'set-edit', function () { R.go('login', { edit: true }); }));
          acts.appendChild(btn('', 'Hesaptan çık', 'set-logout', function () {
            sheet('IPTV hesabından çıkılsın mı?', [
              ['Evet, çık', function () { A.store.set('iptv_creds', null); A.creds = null; A.clearCache(); R.root('login'); }],
              ['Vazgeç', null]
            ]);
          }));
          panel.appendChild(acts);
          panel.appendChild(h('div', 'empty', 'Hesap bilgileri bu TV\'deki tüm profillerde ortak kullanılır.'));
        } else {
          ttl.textContent = 'Hakkında';
          panel.appendChild(h('div', 'kv', '<div><b>Uygulama</b><span>Velvo · sürüm 0.8</span></div>' +
            '<div><b>Not</b><span>Bu uygulama içerik sağlamaz; kendi IPTV hesabınla çalışır.</span></div>' +
            '<div><b>Kaynak kodu</b><span class="nt">github.com/FTanBorn/velvo</span></div>' +
            '<div><b>Lisans</b><span class="nt">GPL-3.0</span></div>' +
            '<div><b></b><span>Ücretsiz ve açık kaynaklıdır. Hiçbir kişisel veri toplanmaz; hesap bilgileri yalnızca bu TV\'de saklanır.</span></div>'));
        }
      }
      tabs.forEach(function (t) {
        var e = h('div', 'cat', esc(t[1]));
        e.setAttribute('data-t', t[0]);
        A.fc(e, 'tab-' + t[0], function () { show(t[0]); F.move('right'); });
        e.onfocusx = function () { if (entry.state.tab !== t[0]) show(t[0]); };
        menu.appendChild(e);
      });
      show(entry.state.tab);
      A.$('[data-t="' + entry.state.tab + '"]', menu).setAttribute('data-autofocus', '1');
    }
  };

  // ---------------------------------------------------------------- giriş

  A.screens.login = {
    render: function (el, p, entry) {
      var c = A.store.get('iptv_creds', null) || {};
      var edit = !!(p && p.edit);
      entry.state = entry.state || { mode: c.type === 'm3u' ? 'm3u' : 'xtream' };
      var mode = entry.state.mode;
      el.innerHTML = '<div class="login"><div style="width:84px; height:84px; border-radius:22px; background:#e6005c; font-size:50px; font-weight:900; text-align:center; line-height:84px; margin-bottom:30px">V</div>' +
        '<h1 class="t-l">' + (edit ? 'IPTV hesabını düzenle' : 'IPTV hesabını bağla') + '</h1>' +
        '<div class="modes" style="margin:22px 0 6px"></div>' +
        (mode === 'm3u'
          ? '<p class="muted" style="margin:14px 0 10px">Sağlayıcının verdiği M3U liste adresi.</p>' +
            '<label>Liste adresi (M3U)</label><input id="l-m3u" type="text" placeholder="http://ornek.com/liste.m3u">'
          : '<p class="muted" style="margin:14px 0 10px">Sağlayıcının verdiği sunucu adresi, kullanıcı adı ve şifre.</p>' +
            '<label>Sunucu adresi</label><input id="l-url" type="text" placeholder="http://sunucu:8080">' +
            '<label>Kullanıcı adı</label><input id="l-user" type="text">' +
            '<label>Şifre</label><input id="l-pass" type="password">') +
        '<div style="margin-top:36px" class="lbtn"></div><div class="msg"></div></div>';
      var msg = A.$('.msg', el), modes = A.$('.modes', el);

      // Xtream / M3U seçimi
      var seg = h('div', 'seg');
      [['xtream', 'Xtream (sunucu + kullanıcı)'], ['m3u', 'M3U listesi']].forEach(function (m) {
        var sp = h('span', m[0] === mode ? 'on' : '', esc(m[1]));
        A.fc(sp, 'l-mode-' + m[0], function () {
          if (entry.state.mode === m[0]) return;
          entry.state.mode = m[0];
          entry.focusKey = 'l-mode-' + m[0];
          A.screens.login.render(el, p, entry);
          F.set(F.byKey('l-mode-' + m[0]));
        });
        seg.appendChild(sp);
      });
      modes.appendChild(seg);

      var inputs = A.$$('input', el);
      inputs.forEach(function (i) { A.fc(i, i.id); });
      if (mode === 'm3u') {
        if (c.type === 'm3u' && c.url) A.$('#l-m3u', el).value = c.url;
      } else if (c.type !== 'm3u') {
        if (c.base) A.$('#l-url', el).value = c.base;
        if (c.user) A.$('#l-user', el).value = c.user;
        if (edit && c.pass) A.$('#l-pass', el).value = c.pass;
      }

      var b = btn(A.icon.play, edit ? 'Test et ve kaydet' : 'Bağlan', 'l-go', function () {
        var cr;
        if (mode === 'm3u') {
          cr = { type: 'm3u', url: A.$('#l-m3u', el).value.trim() };
          if (!cr.url) { msg.textContent = 'Liste adresini yaz.'; return; }
        } else {
          cr = { type: 'xtream', base: A.$('#l-url', el).value.trim().replace(/\/+$/, ''), user: A.$('#l-user', el).value.trim(), pass: A.$('#l-pass', el).value };
          if (!cr.base || !cr.user || !cr.pass) { msg.textContent = 'Üç alanı da doldur.'; return; }
        }
        msg.textContent = 'Bağlanıyor…';
        var old = A.creds;
        A.creds = cr;
        A.clearCache();
        A.api({}, function (err, d) {
          var ok = !err && d && d.user_info && String(d.user_info.auth) === '1';
          if (!ok) {
            A.creds = old; // eski hesap çalışmaya devam etsin
            A.clearCache();
            msg.textContent = err ? 'Bağlanamadı: ' + err : mode === 'm3u' ? 'Listede oynatılabilir bir kayıt bulunamadı.' : 'Kullanıcı adı veya şifre hatalı.';
            return;
          }
          A.store.set('iptv_creds', cr);
          if (edit) { A.toast('Hesap bilgileri kaydedildi'); R.back(); }
          else R.root(A.profiles.list().length > 1 ? 'profiles' : 'home');
        });
      }, 'acc');
      A.$('.lbtn', el).appendChild(b);
      if (!entry.focusKey || entry.focusKey.indexOf('l-mode') !== 0) {
        var first = mode === 'm3u' ? A.$('#l-m3u', el) : (!edit && c.base && c.user ? A.$('#l-pass', el) : A.$('#l-url', el));
        first.setAttribute('data-autofocus', '1');
      }
    }
  };

  // ---------------------------------------------------------------- başlangıç

  buildRail();
  if (!A.creds || !(A.creds.base || A.creds.url)) R.root('login');
  else R.root(A.profiles.list().length > 1 ? 'profiles' : 'home');
  A.log('başladı · ' + navigator.userAgent.slice(0, 90));
}(App));
