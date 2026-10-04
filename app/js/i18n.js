/*
 * SPDX-License-Identifier: GPL-3.0-or-later
 * Velvo — arayüz çevirisi.
 *
 * Kaynak dil Türkçe. Ekrana eklenen her metin düğümü, seçili dil Türkçe değilse
 * sözlükten (tam eşleşme) ya da kurallardan (sayı içeren kalıplar) çevrilir.
 * Film adı, özet, kategori adı gibi içerik alanları "nt" sınıfıyla işaretlenir ve çevrilmez.
 *
 * Yeni dil eklemek için: DICT ve RULES'a aynı anahtarlarla bir giriş ekleyin ve
 * A.UI_LANGS listesine dili yazın.
 */
(function (A) {
  'use strict';

  var DICT = {
    en: {
      // genel
      'Yükleniyor…': 'Loading…',
      'Bağlantı hatası': 'Connection error',
      'Zaman aşımı': 'Timed out',
      'Sunucu yanıtı okunamadı': "Couldn't read the server response",
      'Vazgeç': 'Cancel',
      'Kaydet': 'Save',
      'Bitti': 'Done',
      'Düzenle': 'Edit',
      // sol menü
      'Profil': 'Profile',
      'Ara': 'Search',
      'Ana sayfa': 'Home',
      'Filmler': 'Movies',
      'Diziler': 'Series',
      'Canlı TV': 'Live TV',
      'Listem': 'My List',
      'Ayarlar': 'Settings',
      // klavye
      'Boşluk': 'Space',
      'Sil': 'Delete',
      'Temizle': 'Clear',
      // profiller
      'Kim izliyor?': "Who's watching?",
      'Profilleri yönet': 'Manage profiles',
      'Profil ekle': 'Add profile',
      'Profili düzenle': 'Edit profile',
      'Yeni profil': 'New profile',
      'Renk': 'Color',
      'Ad yaz': 'Type a name',
      'Profil için bir ad yaz.': 'Type a name for the profile.',
      'Profil güncellendi': 'Profile updated',
      'Profili sil': 'Delete profile',
      'Evet, sil': 'Yes, delete',
      'Profil silindi': 'Profile deleted',
      'Profil değiştir': 'Switch profile',
      // ana sayfa ve kartlar
      'Dizi': 'Series',
      'Film': 'Movie',
      'İzle': 'Play',
      'Detaylar': 'Details',
      'Listeme eklendi': 'Added to My List',
      'Listemden çıkarıldı': 'Removed from My List',
      'Kaldığın yerden devam et': 'Continue watching',
      'Uzun versiyon': 'Extended version',
      // detay
      'Fragman': 'Trailer',
      'YouTube açılamadı': "Couldn't open YouTube",
      'Ses ve altyazı okunuyor…': 'Reading audio and subtitles…',
      'Oyuncular': 'Cast',
      'Oyuncular:': 'Cast:',
      'Yönetmen': 'Director',
      'Baştan izle': 'Start over',
      'Benzer içerikler': 'More like this',
      'Özel': 'Specials',
      'Bu dizide bölüm bulunamadı': 'No episodes found for this series',
      'Bölümler yükleniyor…': 'Loading episodes…',
      'Dizi bilgisi alınamadı': "Couldn't load the series",
      // listeler
      'Bu kategoride içerik yok.': 'Nothing in this category.',
      'Kategoriler alınamadı': "Couldn't load categories",
      'Kategoriler yükleniyor…': 'Loading categories…',
      'Listen boş. Bir film ya da dizinin detayında kalp düğmesine basarak ekleyebilirsin.': 'Your list is empty. Add a movie or series with the heart button on its detail page.',
      // arama
      'Film, dizi ve kanal adlarında arar.': 'Searches movie, series and channel names.',
      'Arşiv hazırlanıyor… (ilk aramada birkaç saniye sürer)': 'Preparing the library… (the first search takes a few seconds)',
      'En az 2 harf yaz.': 'Type at least 2 letters.',
      "Kumandayla harfleri seçip OK'a bas.": 'Pick letters with the remote and press OK.',
      // ayarlar
      'Dil ve altyazı': 'Language and subtitles',
      'Altyazı görünümü': 'Subtitle style',
      'IPTV hesabı': 'IPTV account',
      'Hakkında': 'About',
      'Uygulama dili': 'App language',
      'Menülerin dili': 'Language of menus and buttons',
      'Otomatik': 'Automatic',
      'Ana sayfa rafları': 'Home rows',
      "Ana sayfada hangi kategorilerin hangi sırayla görüneceğini seç. Bir rafın üzerinde OK'a basınca taşıyabilir ya da kaldırabilirsin.": 'Choose which categories appear on Home and in what order. Press OK on a row to move or remove it.',
      'OK: düzenle': 'OK: edit',
      'Yukarı taşı': 'Move up',
      'Aşağı taşı': 'Move down',
      'Ana sayfadan kaldır': 'Remove from Home',
      'Varsayılana dön': 'Reset to default',
      'Varsayılan raflar geri yüklendi': 'Default rows restored',
      'Eklenebilir kategoriler': 'Categories you can add',
      'Tercih edilen ses': 'Preferred audio',
      'Film açılınca bu dil varsa otomatik seçilir': 'Selected automatically when available',
      'Tercih edilen altyazı': 'Preferred subtitles',
      'Önce dosyanın içinde aranır': 'Looked for inside the video file first',
      'Ses altyazı dilindeyse altyazıyı kapat': 'Skip subtitles on matching audio',
      'Dublajlı izlerken altyazı açılmaz': 'Subtitles stay off when you watch dubbed',
      'İzlerken Ses ve Altyazı düğmeleriyle dili her zaman değiştirebilirsin. Sarı tuş sesi, mavi tuş altyazıyı hızlıca değiştirir. Bir dizide yaptığın seçim sonraki bölümlerde de uygulanır.': 'While watching you can always change languages with the Audio and Subtitles buttons. The yellow key switches audio, the blue key switches subtitles. Your choice for a series carries over to its next episodes.',
      'Bu akşam partiye kimler geliyor, biliyor musun?': "Do you know who's coming to the party tonight?",
      'Boyut': 'Size',
      'Yazı rengi': 'Text color',
      'Konum': 'Position',
      'Küçük': 'Small',
      'Normal': 'Normal',
      'Büyük': 'Large',
      'Çok büyük': 'Extra large',
      'Beyaz': 'White',
      'Sarı': 'Yellow',
      'Yeşil': 'Green',
      'Mavi': 'Blue',
      'Gri': 'Gray',
      'Yok': 'None',
      'Yarı saydam': 'Semi-transparent',
      'Siyah kutu': 'Black box',
      'Daha aşağı': 'Lower',
      'Biraz yukarı': 'Slightly higher',
      'Yukarı': 'Higher',
      'Önizleme yaklaşıktır. Ayarlar altyazı açıldığında uygulanır. İzlerken Altyazı düğmesinin penceresinden de boyutu, rengi ve konumu anında değiştirebilirsin.': 'The preview is approximate. Settings apply when subtitles turn on. While watching you can also change size, color and position instantly from the Subtitles button.',
      'İzleme geçmişi, Listem, dil ve altyazı ayarları ile ana sayfa düzeni her profile özeldir.': 'Watch history, My List, language and subtitle settings and the Home layout are separate for each profile.',
      // IPTV hesabı
      'Sunucu': 'Server',
      'Sunucu adresi': 'Server address',
      'Kullanıcı adı': 'Username',
      'Şifre': 'Password',
      'Abonelik': 'Subscription',
      'Bilgi alınıyor…': 'Loading…',
      'Bilgi alınamadı': "Couldn't load",
      'Durum': 'Status',
      'Aktif': 'Active',
      'Aktif · deneme': 'Active · trial',
      'Bitiş tarihi': 'Expires',
      'Süresiz': 'Never',
      'Bağlantı': 'Connections',
      'Hesap bilgilerini düzenle': 'Edit account details',
      'Hesaptan çık': 'Sign out',
      'IPTV hesabından çıkılsın mı?': 'Sign out of the IPTV account?',
      'Evet, çık': 'Yes, sign out',
      "Hesap bilgileri bu TV'deki tüm profillerde ortak kullanılır.": 'Account details are shared by all profiles on this TV.',
      'Uygulama': 'App',
      'Not': 'Note',
      'Kaynak kodu': 'Source code',
      'Lisans': 'License',
      'Bu uygulama içerik sağlamaz; kendi IPTV hesabınla çalışır.': 'This app provides no content; it works with your own IPTV account.',
      'Ücretsiz ve açık kaynaklıdır. Hiçbir kişisel veri toplanmaz; hesap bilgileri yalnızca bu TV\'de saklanır.': 'Free and open source. No personal data is collected; account details are stored only on this TV.',
      // giriş
      'IPTV hesabını düzenle': 'Edit IPTV account',
      'IPTV hesabını bağla': 'Connect your IPTV account',
      'Sağlayıcının verdiği sunucu adresi, kullanıcı adı ve şifre.': 'The server address, username and password from your provider.',
      'http://sunucu:8080': 'http://server:8080',
      'Test et ve kaydet': 'Test and save',
      'Bağlan': 'Connect',
      'Üç alanı da doldur.': 'Fill in all three fields.',
      'Bağlanıyor…': 'Connecting…',
      'Kullanıcı adı veya şifre hatalı.': 'Wrong username or password.',
      'Hesap bilgileri kaydedildi': 'Account details saved',
      'Xtream (sunucu + kullanıcı)': 'Xtream (server + user)',
      'M3U listesi': 'M3U playlist',
      'Sağlayıcının verdiği M3U liste adresi.': 'The M3U playlist address from your provider.',
      'Liste adresi (M3U)': 'Playlist address (M3U)',
      'Liste adresi': 'Playlist address',
      'http://ornek.com/liste.m3u': 'http://example.com/playlist.m3u',
      'Liste adresini yaz.': 'Enter the playlist address.',
      'Listede oynatılabilir bir kayıt bulunamadı.': 'No playable entries found in the playlist.',
      'Bu adres bir M3U listesi değil': "This address isn't an M3U playlist",
      'Tür': 'Type',
      'Diğer': 'Other',
      'Bulunamadı': 'Not found',
      "Bu TV'de gömülü altyazı desteklenmiyor": "This TV doesn't support embedded subtitles",
      // oynatıcı
      'Ses': 'Audio',
      'Altyazı': 'Subtitles',
      'Altyazı kapalı': 'Subtitles off',
      'altyazı kapalı': 'subtitles off',
      'Kapalı': 'Off',
      'Ses bilgisi yok': 'No audio information',
      'Altyazılar okunuyor…': 'Reading subtitles…',
      'Bu dosya türünde altyazı okunamıyor': "Subtitles can't be read from this file type",
      'Bu içerikte altyazı yok': 'No subtitles in this video',
      'Ayarlar · ◀ ▶ ile değiştir': 'Settings · change with ◀ ▶',
      'Sonraki bölüm': 'Next episode',
      'CANLI': 'LIVE',
      'Orijinal': 'Original',
      // diller
      'Türkçe': 'Turkish',
      'İngilizce': 'English',
      'Arapça': 'Arabic',
      'İspanyolca': 'Spanish',
      'Almanca': 'German',
      'Fransızca': 'French',
      'Rusça': 'Russian',
      'İtalyanca': 'Italian',
      'Japonca': 'Japanese',
      'Korece': 'Korean',
      'Portekizce': 'Portuguese',
      'Felemenkçe': 'Dutch',
      'Lehçe': 'Polish',
      'Hintçe': 'Hindi',
      'Çince': 'Chinese',
      'Vietnamca': 'Vietnamese',
      'İsveççe': 'Swedish',
      'Yunanca': 'Greek',
      'İbranice': 'Hebrew',
      'Farsça': 'Persian',
      'Bilinmeyen dil': 'Unknown language'
    }
  };

  // Sayı ya da içerik barındıran kalıplar. Fonksiyonlar eşleşen grupları alır; t() iç içe çeviri yapar.
  var RULES = {
    en: [
      [/^(\d+)\. Sezon · (\d+)\. Bölüm · sıradaki$/, function (m, s, e) { return 'S' + s + ' · E' + e + ' · up next'; }],
      [/^(\d+)\. Sezon · (\d+)\. Bölüm · (.*)$/, function (m, s, e, rest) { return 'S' + s + ' · E' + e + ' · ' + rest; }],
      [/^(\d+)\. Sezon · (\d+)\. Bölüm$/, function (m, s, e) { return 'S' + s + ' · E' + e; }],
      [/^Devam et · (\d+)\. Sezon (\d+)\. Bölüm$/, function (m, s, e) { return 'Continue · S' + s + ' E' + e; }],
      [/^İzle · (\d+)\. Sezon (\d+)\. Bölüm$/, function (m, s, e) { return 'Play · S' + s + ' E' + e; }],
      [/^Devam et · (.+)$/, function (m, t) { return 'Continue · ' + t; }],
      [/^Sıradaki bölüm başlıyor: (\d+)\. Sezon (\d+)\. Bölüm$/, function (m, s, e) { return 'Next episode starting: S' + s + ' E' + e; }],
      [/^Sezon (\d+)$/, function (m, s) { return 'Season ' + s; }],
      [/^Bölüm (\d+)$/, function (m, n) { return 'Episode ' + n; }],
      [/^(\d+) altyazı dili$/, function (m, n) { return n + (n === '1' ? ' subtitle language' : ' subtitle languages'); }],
      [/^(\d+) sezon$/, function (m, n) { return n + (n === '1' ? ' season' : ' seasons'); }],
      [/^Kalan (.+)$/, function (m, d) { return dur(d) + ' left'; }],
      [/^(\d+ sa )?\d+ dk$/, function (m) { return dur(m); }],
      [/^(.+) · (\d+ sa \d+ dk|\d+ dk)$/, function (m, a, d) { return a + ' · ' + dur(d); }],
      [/^(\d\d\.\d\d\.\d{4}) · (\d+) gün kaldı$/, function (m, d, n) { return d + ' · ' + n + (n === '1' ? ' day left' : ' days left'); }],
      [/^(\d\d\.\d\d\.\d{4}) · süresi doldu$/, function (m, d) { return d + ' · expired'; }],
      [/^(\d+) \/ (\d+) cihaz kullanımda$/, function (m, a, b) { return a + ' / ' + b + ' devices in use'; }],
      [/^Velvo · sürüm (.+)$/, function (m, v) { return 'Velvo · version ' + v; }],
      [/^İlk (\d+) \/ (\d+) gösteriliyor · tamamı için Ara$/, function (m, a, b) { return 'Showing the first ' + a + ' of ' + b + ' · use Search for the rest'; }],
      [/^"(.*)" için sonuç yok\.$/, function (m, q) { return 'No results for "' + q + '".'; }],
      [/^(Diziler|Filmler|Canlı TV) · (\d+)$/, function (m, g, n) { return t(g) + ' · ' + n; }],
      [/^Ana sayfada · (\d+) raf$/, function (m, n) { return 'On Home · ' + n + (n === '1' ? ' row' : ' rows'); }],
      [/^Bilgi alınamadı: (.*)$/, function (m, e) { return "Couldn't load: " + t(e); }],
      [/^Yüklenemedi: (.*)$/, function (m, e) { return "Couldn't load: " + t(e); }],
      [/^Bağlanamadı: (.*)$/, function (m, e) { return "Couldn't connect: " + t(e); }],
      [/^Video açılamadı \(hata (.+)\)$/, function (m, c) { return "Couldn't play the video (error " + c + ')'; }],
      [/^(.+) noktasından devam ediliyor$/, function (m, tm) { return 'Resuming from ' + tm; }],
      [/^(.+) profili oluşturuldu$/, function (m, n) { return 'Profile ' + n + ' created'; }],
      [/^(.+) silinsin mi\? İzleme geçmişi ve listesi de silinir\.$/, function (m, n) { return 'Delete ' + n + '? Their watch history and list will be deleted too.'; }],
      [/^(.+) ana sayfaya eklendi$/, function (m, n) { return n + ' added to Home'; }],
      [/^(.+) kaldırıldı$/, function (m, n) { return n + ' removed'; }],
      [/^Son seçimin: (.+)$/, function (m, rest) { return 'Your last choice: ' + rest.split(' · ').map(t).join(' · '); }],
      [/^(.+) altyazı açıldı$/, function (m, l) { return t(l) + ' subtitles on'; }],
      [/^(.+) · işitme engelliler için$/, function (m, l) { return t(l) + ' · SDH'; }],
      [/^(.+) · zorunlu$/, function (m, l) { return t(l) + ' · forced'; }],
      [/^(.+) · (.+) (ses|altyazı)$/, function (m, a, l, k) { return t(a) + ' · ' + t(l + ' ' + k); }],
      [/^(.+) ses$/, function (m, l) { return t(l) + ' audio'; }],
      [/^(.+) altyazı$/, function (m, l) { return t(l) + ' subtitles'; }]
    ]
  };

  function dur(s) { return String(s).replace(/(\d+) sa/, '$1 h').replace(/(\d+) dk/, '$1 min'); }

  A.UI_LANGS = [['auto', 'Otomatik'], ['tr', 'Türkçe'], ['en', 'English']];
  A.lang = 'tr';

  // Bir metni seçili dile çevirir (bulunamazsa olduğu gibi döner)
  function t(s) {
    if (A.lang === 'tr' || s == null) return s;
    var str = String(s), key = str.trim();
    if (!key) return str;
    var d = DICT[A.lang] || {}, lead = str.slice(0, str.indexOf(key)), trail = str.slice(str.indexOf(key) + key.length);
    if (d.hasOwnProperty(key)) return lead + d[key] + trail;
    var rules = RULES[A.lang] || [];
    for (var i = 0; i < rules.length; i++) {
      var m = rules[i][0].exec(key);
      if (m) return lead + rules[i][1].apply(null, m) + trail;
    }
    return str;
  }
  A.t = t;

  A.detectLang = function () {
    var l = String(navigator.language || '').toLowerCase();
    return l.indexOf('tr') === 0 ? 'tr' : 'en';
  };

  A.applyLang = function () {
    var p = (A.prefs && A.prefs.uiLang) || 'auto';
    A.lang = p === 'auto' ? A.detectLang() : p;
    if (!DICT[A.lang] && A.lang !== 'tr') A.lang = 'en';
    document.documentElement.lang = A.lang;
  };

  // ---- ekrana eklenen metinleri otomatik çevir
  function skip(node) {
    for (var e = node.parentNode; e && e !== document; e = e.parentNode) {
      if (e.classList && e.classList.contains('nt')) return true;
      if (e.tagName === 'SCRIPT' || e.tagName === 'STYLE') return true;
    }
    return false;
  }
  function textNode(n) {
    if (n._tv === n.nodeValue || !/[A-Za-zÇĞİÖŞÜçğıöşü]/.test(n.nodeValue) || skip(n)) return;
    var v = t(n.nodeValue);
    if (v !== n.nodeValue) n.nodeValue = v;
    n._tv = n.nodeValue;
  }
  function tree(root) {
    if (A.lang === 'tr') return;
    if (root.nodeType === 3) { textNode(root); return; }
    if (root.nodeType !== 1) return;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false), list = [], n;
    while ((n = w.nextNode())) list.push(n);
    list.forEach(textNode);
    var ph = root.querySelectorAll ? root.querySelectorAll('[placeholder]') : [];
    for (var i = 0; i < ph.length; i++) ph[i].setAttribute('placeholder', t(ph[i].getAttribute('placeholder')));
  }
  A.translateTree = tree;

  if (window.MutationObserver) {
    new MutationObserver(function (muts) {
      if (A.lang === 'tr') return;
      for (var i = 0; i < muts.length; i++) {
        var m = muts[i];
        if (m.type === 'characterData') textNode(m.target);
        else for (var j = 0; j < m.addedNodes.length; j++) tree(m.addedNodes[j]);
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  A.applyLang();
}(App));
