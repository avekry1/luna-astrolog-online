/* D-197: клик из рекламы Meta. Источник: ~/luna/deploy/fb-clicks/track.js, копия лежит на luna-astrolog.online.
   Если в адресе есть fbclid или utm_content (объявление Meta), страница отдаёт клик прокладке (Cloudflare) и
   дописывает к метке код: ?start=fbi_1 → ?start=fbi_1--k7x2m9qa1b. app.js и /go/ берут start из адреса, поэтому код
   уходит в кнопку Telegram сам. Прокладка не ответила: человек всё равно попадает в бота, просто без данных клика. */
(function () {
  var URL_C = 'https://luna-clicks.luna-astrolog.workers.dev/c';
  try {
    var P = new URLSearchParams(location.search);
    var fbclid = P.get('fbclid') || '';
    if (!fbclid && !P.get('utm_content')) return;
    var start = P.get('start') || '';
    var m = /^(.*)--([a-z0-9]{10})$/.exec(start);
    if (m) start = m[1];
    if (!/^[A-Za-z0-9_-]{1,52}$/.test(start)) start = 'lp_site';
    var key = 'luna_click', code = m ? m[2] : '';
    if (!code) {
      try { var saved = JSON.parse(sessionStorage.getItem(key) || 'null'); if (saved && saved.f === fbclid) code = saved.c; } catch (e) {}
    }
    if (!/^[a-z0-9]{10}$/.test(code)) {
      var abc = '0123456789abcdefghijklmnopqrstuvwxyz', bytes = new Uint8Array(10);
      crypto.getRandomValues(bytes);
      code = '';
      for (var i = 0; i < 10; i++) code += abc[bytes[i] % 36];
    }
    try { sessionStorage.setItem(key, JSON.stringify({ f: fbclid, c: code })); } catch (e) {}
    var body = { code: code, label: start, fbclid: fbclid, utm_source: P.get('utm_source'), utm_medium: P.get('utm_medium'),
      utm_campaign: P.get('utm_campaign'), utm_term: P.get('utm_term'), utm_content: P.get('utm_content'),
      ad_name: P.get('ad_name'), page_url: location.href.split('#')[0] };
    var send = function (ev) {
      body.ev = ev;
      var s = JSON.stringify(body);
      try { if (navigator.sendBeacon && navigator.sendBeacon(URL_C, new Blob([s], { type: 'text/plain' }))) return; } catch (e) {}
      try { fetch(URL_C, { method: 'POST', body: s, keepalive: true, mode: 'no-cors' }); } catch (e) {}
    };
    send('view');
    P.set('start', start + '--' + code);
    history.replaceState(null, '', location.pathname + '?' + P.toString() + location.hash);
    document.addEventListener('click', function (e) {
      var a = e.target && e.target.closest && e.target.closest('a[href*="t.me/"]');
      if (a) send('tap');
    }, true);
    window.__lunaClick = send;
  } catch (e) {}
})();
