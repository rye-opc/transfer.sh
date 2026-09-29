(function () {
  'use strict';

  var drop = document.getElementById('drop');
  var input = document.getElementById('file');
  var queue = document.getElementById('queue');

  function fmtSize(n) {
    var u = ['B', 'KB', 'MB', 'GB', 'TB'], i = 0;
    while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
    return (i ? n.toFixed(1) : n) + ' ' + u[i];
  }

  function copy(text, btn) {
    var done = function () {
      var old = btn.textContent;
      btn.textContent = 'Copied';
      setTimeout(function () { btn.textContent = old; }, 1200);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, function () {});
    } else {
      var ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) {}
      document.body.removeChild(ta);
    }
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function upload(file) {
    var li = el('li', 'item');
    var top = el('div', 'item-top');
    var name = el('span', 'item-name', file.name || 'pasted-file');
    name.title = name.textContent;
    var size = el('span', 'item-size', fmtSize(file.size));
    top.appendChild(name); top.appendChild(size);
    var bar = el('div', 'bar'), fill = el('i');
    bar.appendChild(fill);
    li.appendChild(top); li.appendChild(bar);
    queue.insertBefore(li, queue.firstChild);

    var fail = function (msg) {
      li.classList.add('error');
      li.appendChild(el('div', 'err', msg));
    };

    var xhr = new XMLHttpRequest();
    var path = '/' + encodeURIComponent(file.name || 'pasted-file');
    xhr.open('PUT', path);
    xhr.upload.onprogress = function (e) {
      if (e.lengthComputable) fill.style.width = (e.loaded / e.total * 100) + '%';
    };
    xhr.onerror = function () { fail('Network error.'); };
    xhr.onload = function () {
      if (xhr.status === 200) {
        var url = xhr.responseText.trim();
        li.classList.add('done');
        var row = el('div', 'item-link');
        var field = el('input');
        field.type = 'text'; field.readOnly = true; field.value = url;
        field.addEventListener('focus', function () { field.select(); });
        var btn = el('button', 'btn', 'Copy');
        btn.type = 'button';
        btn.addEventListener('click', function () { copy(url, btn); });
        row.appendChild(field); row.appendChild(btn);
        li.appendChild(row);
        var del = xhr.getResponseHeader('X-Url-Delete');
        if (del) {
          var d = el('button', 'btn', 'Copy delete URL');
          d.type = 'button';
          d.addEventListener('click', function () { copy(del, d); });
          row.appendChild(d);
        }
      } else if (xhr.status === 401) {
        fail('Login required or wrong credentials. Reload and try again.');
      } else if (xhr.status === 413) {
        fail('File is too large.');
      } else {
        fail('Upload failed (' + xhr.status + ').');
      }
    };
    xhr.send(file);
  }

  function addFiles(list) {
    for (var i = 0; i < list.length; i++) upload(list[i]);
  }

  drop.addEventListener('click', function () { input.click(); });
  drop.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); }
  });
  input.addEventListener('change', function () { addFiles(input.files); input.value = ''; });

  ['dragenter', 'dragover'].forEach(function (t) {
    drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add('over'); });
  });
  ['dragleave', 'drop'].forEach(function (t) {
    drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.remove('over'); });
  });
  drop.addEventListener('drop', function (e) { addFiles(e.dataTransfer.files); });
  // Prevent the browser from navigating to a file dropped outside the zone.
  window.addEventListener('dragover', function (e) { e.preventDefault(); });
  window.addEventListener('drop', function (e) { e.preventDefault(); });

  document.addEventListener('paste', function (e) {
    var files = e.clipboardData && e.clipboardData.files;
    if (files && files.length) addFiles(files);
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-copy]'), function (box) {
    var btn = box.querySelector('.copy');
    btn.addEventListener('click', function () {
      copy(box.querySelector('pre').textContent.replace(/\n{2,}$/, ''), btn);
    });
  });
})();
