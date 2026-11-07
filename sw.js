/*
 * 설치(앱으로 추가)용 최소 서비스 워커.
 * 아무것도 캐시하지 않고 요청을 그대로 네트워크로 보낸다.
 * → 공지를 고치면 항상 최신 내용이 보이고, 예전 파일이 남는 문제가 생기지 않는다.
 */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (e) => e.respondWith(fetch(e.request)));
