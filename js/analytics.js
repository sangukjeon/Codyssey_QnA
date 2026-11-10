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
  const run = (fn) => { try { fn(window.umami); } catch (e) { /* 통계 실패는 사이트 동작에 영향 주지 않음 */ } };
  const send = (fn) => (ready() ? run(fn) : queue.push(fn));
  const flush = () => { while (ready() && queue.length) run(queue.shift()); };

  const tag = document.getElementById("umami");
  if (tag) tag.addEventListener("load", flush);
  window.addEventListener("load", flush);

  // 해시 주소 → 통계용 경로 (#faq/24 → /faq/24, 비었으면 /)
  const pathOf = (hash) => "/" + String(hash || "").replace(/^#\/?/, "").replace(/^home$/, "");

  let lastPath = null;
  function page(hash, title) {
    const url = pathOf(hash);
    if (url === lastPath) return;
    lastPath = url;
    send((u) => u.track((props) => ({ ...props, url, title })));
  }

  function event(name, data) {
    send((u) => u.track(name, data));
  }

  window.addEventListener("appinstalled", () => event("app-install"));

  return { page, event };
})();
