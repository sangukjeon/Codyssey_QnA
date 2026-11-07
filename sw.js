/*
 * 설치(앱으로 추가)용 최소 서비스 워커.
 * 요청을 가로채지 않는다(fetch 처리 없음) → 브라우저가 평소처럼 직접 받아서
 * 네트워크가 느릴 때 서비스 워커 때문에 화면이 멈추는 일이 없다.
 */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
