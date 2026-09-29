(function () {
  'use strict';

  var copyBtn = document.getElementById('copy-link');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var url = new URL(copyBtn.dataset.url, location.href).href;
      var old = copyBtn.textContent;
      var done = function () {
        copyBtn.textContent = 'Copied';
        setTimeout(function () { copyBtn.textContent = old; }, 1200);
      };
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, function () {});
    });
  }

  var del = document.getElementById('confirm-delete');
  if (!del) return;
  var msg = document.getElementById('delete-msg');
  var say = function (text, cls) { msg.textContent = text; msg.className = 'small ' + cls; };

  del.addEventListener('click', function () {
    var tok = document.getElementById('deletion-token').value.trim();
    if (!tok) { say('Enter the deletion token.', 'bad'); return; }
    var base = new URL(del.dataset.url, location.href).pathname.replace(/\/+$/, '');
    fetch(base + '/' + encodeURIComponent(tok), { method: 'DELETE' }).then(function (r) {
      if (r.ok) { say('Deleted.', 'ok'); setTimeout(function () { location.href = '/'; }, 800); }
      else if (r.status === 404 || r.status === 400) say('Wrong token or file already gone.', 'bad');
      else say('Delete failed (' + r.status + ').', 'bad');
    }, function () { say('Network error.', 'bad'); });
  });
})();
