(function () {
  /*CFG_START*/ var CFG = {"hosts":["nyr-tools-nyr-dev-tools.vercel.app"],"allowLocalhost":true}; /*CFG_END*/
  var h = String(location.hostname || "").toLowerCase();
  var local = h === "localhost" || h === "127.0.0.1" || h === "[::1]" || h === "::1";
  var pinned = CFG.hosts.indexOf(h) !== -1 || (CFG.allowLocalhost && local);
  var secure = local || location.protocol === "https:";
  if (pinned && secure && window.top === window.self) return;
  try { window.stop(); } catch (e) {}
  document.documentElement.style.display = "none";
  location.replace("/");
})();
