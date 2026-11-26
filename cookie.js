(function () {
  var KEY = "cookie_notice_ok";
  try { if (localStorage.getItem(KEY)) return; } catch (e) {}
  function show() {
    var st = document.createElement("style");
    st.textContent = ".ck{position:fixed;left:16px;bottom:16px;z-index:9999;box-sizing:border-box;max-width:540px;width:calc(100% - 32px);display:flex;gap:14px;align-items:center;flex-wrap:wrap;padding:14px 16px;background:#ffffff;color:#15131C;border:1px solid #d9dde1;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.12);font:400 14px/1.45 'Golos Text',system-ui,sans-serif}.ck p{margin:0;flex:1 1 240px}.ck a{color:#15131C;text-decoration:underline}.ck button{flex:0 0 auto;border:0;border-radius:8px;padding:10px 18px;background:#5B2C8F;color:#ffffff;font:600 14px/1 'Golos Text',system-ui,sans-serif;cursor:pointer}.ck button:focus-visible{outline:3px solid #5B2C8F;outline-offset:2px}@media(max-width:480px){.ck{left:12px;bottom:12px;width:calc(100% - 24px)}}";
    document.head.appendChild(st);
    var box = document.createElement("div");
    box.className = "ck";
    box.setAttribute("role", "region");
    box.setAttribute("aria-label", "Уведомление о файлах cookie");
    box.innerHTML = "<p>Сайт использует файлы cookie, чтобы работать корректно. Продолжая пользоваться сайтом, вы соглашаетесь с этим. Подробнее в <a href=\"privacy.html\">политике конфиденциальности</a>.</p><button type=\"button\">Понятно</button>";
    box.querySelector("button").addEventListener("click", function () {
      try { localStorage.setItem(KEY, "1"); } catch (e) {}
      box.remove();
    });
    document.body.appendChild(box);
  }
  if (document.body) show(); else document.addEventListener("DOMContentLoaded", show);
})();
