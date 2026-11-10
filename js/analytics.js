/*
 * 방문 통계 (Umami, 쿠키 없음 · 개인 식별 안 함)
 *   - 화면 조회: 해시 주소(#faq/24)를 /faq/24 같은 경로로 바꿔 직접 기록한다.
 *   - 이벤트: 검색, 키워드·분류 클릭, 챗봇 사용 결과, 앱 설치 등.
 *   - 챗봇에 입력한 문장은 기록하지 않는다 (결과와 질문 번호만).
 *   - Umami 스크립트는 defer 로 늦게 실행되므로, 준비되기 전 기록은 모아 두었다가 보낸다.
 *   - 광고 차단 등으로 스크립트가 막히면 아무 일도 하지 않는다.
 */
const Analytics = (() => {
  const queue = [];
  const ready = () => typeof window.umami !== "undefined" && typeof window.umami.track === "function";

  // 확인 모드: 주소에 ?stats-debug 를 붙이면 화면 구석에 스크립트 상태와 전송 결과를 보여 준다
  const DEBUG = /[?&]stats-debug\b/.test(location.search);
  const stat = { script: "불러오는 중", ok: 0, fail: 0, last: "" };
  let box = null;
  const show = () => {
    if (!DEBUG) return;
    if (!box) {
      box = document.createElement("div");
      box.setAttribute("role", "status");
      box.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:99;max-width:300px;padding:10px 12px;border-radius:10px;" +
        "background:#141a24;color:#fff;font:12px/1.5 system-ui,sans-serif;box-shadow:0 4px 12px rgba(0,0,0,.3);white-space:pre-line";
      document.body.appendChild(box);
    }
    box.textContent = `[통계 확인 모드]\n스크립트: ${stat.script}\n전송 성공 ${stat.ok} · 실패 ${stat.fail}\n최근: ${stat.last}\n주소: ${location.hostname}`;
  };
  const run = (fn, label) => {
    try { fn(window.umami); if (DEBUG) { stat.last = label; show(); } }
    catch (e) { /* 통계 실패는 사이트 동작에 영향 주지 않음 */ }
  };
  // Umami 는 전송 실패를 밖으로 알리지 않으므로, 확인 모드에서는 실제 전송 요청(/api/send)의 응답을 직접 센다
  if (DEBUG && window.fetch) {
    const orig = window.fetch.bind(window);
    window.fetch = (input, init) => {
      const u = typeof input === "string" ? input : (input && input.url) || "";
      const p = orig(input, init);
      if (/\/api\/send/.test(u)) {
        p.then((res) => { if (res.ok) stat.ok++; else { stat.fail++; stat.last += ` (응답 ${res.status})`; } show(); })
          .catch(() => { stat.fail++; stat.last += " (전송 차단됨)"; show(); });
      }
      return p;
    };
  }
  const send = (fn, label) => (ready() ? run(fn, label) : queue.push([fn, label]));
  const flush = () => { while (ready() && queue.length) { const [fn, label] = queue.shift(); run(fn, label); } };

  const tag = document.getElementById("umami-script");
  if (tag) {
    tag.addEventListener("load", () => { stat.script = ready() ? "정상 로드" : "로드됐지만 umami 없음 (차단 앱이 빈 파일로 바꿨을 수 있음)"; flush(); show(); });
    tag.addEventListener("error", () => { stat.script = "차단됨 (광고·추적 차단 확인)"; show(); });
  }
  window.addEventListener("load", () => { flush(); show(); });

  // 해시 주소 → 통계용 경로 (#faq/24 → /faq/24, 비었으면 /)
  const pathOf = (hash) => "/" + String(hash || "").replace(/^#\/?/, "").replace(/^home$/, "");

  let lastPath = null;
  function page(hash, title) {
    const url = pathOf(hash);
    if (url === lastPath) return;
    lastPath = url;
    send((u) => u.track((props) => ({ ...props, url, title })), "조회 " + url);
  }

  function event(name, data) {
    send((u) => u.track(name, data), "이벤트 " + name);
  }

  window.addEventListener("appinstalled", () => event("app-install"));

  return { page, event };
})();
