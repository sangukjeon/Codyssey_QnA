(() => {
  "use strict";

  /* ---------- 유틸 ---------- */
  const $ = (sel, el = document) => el.querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const paras = (text) => text.split("\n").map((l) => (l.trim() ? `<p>${esc(l)}</p>` : `<div class="gap"></div>`)).join("");
  const catName = (id) => (CATEGORIES.find((c) => c.id === id) || {}).name || "";
  const norm = (s) => s.toLowerCase().replace(/\s+/g, "");

  const ICON = {
    chevR: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>',
    chevRLg: '<svg class="chev" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>',
    chevD: '<svg class="faq-chev" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
    clip: '<svg class="clip" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-label="첨부파일 있음" role="img"><path d="M8 8.5h9a3.5 3.5 0 0 1 0 7H6.5a2.5 2.5 0 0 1 0-5H16"/></svg>',
    bookmark: '<svg class="card-pin" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true"><path d="M6 3.5h12v17l-6-4.5-6 4.5z"/></svg>',
    search: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.8-4.8"/></svg>',
    close: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    chat: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12Z"/></svg>',
    file: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M12 12v6M9 15l3 3 3-3"/></svg>',
    info: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
    bot: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 4v4M9 13h.01M15 13h.01M9.5 16.5h5"/></svg>',
    doc: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>',
    cat: {
      attend: '<path d="M8 3v3M16 3v3M4 9h16"/><rect x="4" y="5" width="16" height="16" rx="2"/><path d="m9 15 2 2 4-4"/>',
      course: '<path d="M3 6.5 12 3l9 3.5-9 3.5z"/><path d="M7 8.5V14c0 1.5 2.2 3 5 3s5-1.5 5-3V8.5M21 6.5V12"/>',
      task: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 11h6M9 15h4"/>',
      facility: '<path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-5h6v5M9 10h.01M15 10h.01"/>',
      admin: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
      etc: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.5v.7M12 17h.01"/>',
    },
  };
  const catIcon = (id) => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON.cat[id]}</svg>`;

  /* ---------- 상태 ---------- */
  const state = { faqCat: "all", faqQuery: "" };
  const main = $("#main");
  const sortedNotices = () => [...NOTICES].sort((a, b) => (b.pinned - a.pinned) || 0);
  const totalAsks = FAQS.reduce((s, f) => s + f.count, 0);

  $("#updatedAt").textContent = UPDATED_AT;

  /* ---------- 공통 조각 ---------- */
  function setChrome(tab, title, crumbs) {
    document.querySelectorAll(".tab").forEach((t) => {
      const on = t.dataset.route === tab;
      t.setAttribute("aria-selected", on);
      t.tabIndex = on ? 0 : -1;
    });
    main.setAttribute("aria-labelledby", `tab-${tab}`);
    $("#pageTitle").textContent = title;
    document.title = `${title} | 코디세이 Q&A 허브`;
    const home = '<li><a href="#home" aria-label="홈"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3 3 10.5V21h6v-6h6v6h6V10.5z"/></svg></a></li>';
    $("#crumbs").innerHTML = home + crumbs.map((c, i) =>
      i === crumbs.length - 1 ? `<li><span aria-current="page">${esc(c.label)}</span></li>` : `<li><a href="${c.href}">${esc(c.label)}</a></li>`
    ).join("");
  }

  function noticeCard(n, index) {
    const head = n.pinned
      ? `${ICON.bookmark}<span class="sr-only">고정 공지</span>`
      : `<span class="card-no">No.${index}</span>`;
    return `<li><a class="card" href="#notice/${n.id}">
      ${head}
      <div class="card-title-row"><h3 class="card-title">${esc(n.title)}</h3>${n.file ? ICON.clip : ""}</div>
      <div class="card-meta">
        <dl><div><dt>작성자</dt><dd>${esc(n.author)}</dd></div><div><dt>등록일</dt><dd>${n.date}</dd></div></dl>
        ${ICON.chevRLg}
      </div>
    </a></li>`;
  }

  function faqItem(f, open) {
    const notes = (f.related || []).map((id) => NOTICES.find((n) => n.id === id)).filter(Boolean);
    const link = notes.length
      ? `<a href="#notice/${notes[0].id}">관련 공지 보기 ${ICON.chevR}</a>` : "";
    return `<li class="faq-item" id="faq-${f.id}">
      <button class="faq-q" type="button" aria-expanded="${open}" aria-controls="faq-a-${f.id}">
        <span class="faq-mark" aria-hidden="true">Q</span>
        <span class="faq-body-wrap">
          <span class="faq-q-text">${esc(f.q)}</span>
          <span class="faq-sub"><span class="tag soft">${catName(f.cat)}</span><span class="freq">${ICON.chat}디스코드 문의 ${f.count}회</span></span>
        </span>
        ${ICON.chevD}
      </button>
      <div class="faq-a" id="faq-a-${f.id}" role="region" aria-label="답변">
        <div class="faq-a-box">${paras(f.a)}</div>
        <div class="faq-a-foot"><span>답변 갱신 ${f.updated}</span>${link}</div>
      </div>
    </li>`;
  }

  /* ---------- 화면: 한눈에 보기 ---------- */
  function renderHome() {
    setChrome("home", "한눈에 보기", [{ label: "한눈에 보기" }]);
    const top = [...FAQS].sort((a, b) => b.count - a.count).slice(0, 5);
    const notices = sortedNotices().slice(0, 3);
    const counts = (id) => FAQS.filter((f) => f.cat === id).length;

    main.innerHTML = `
      <section class="section">
        <div class="summary">
          <span class="summary-icon">${ICON.info}</span>
          <div>
            <h2>디스코드에 묻기 전에 먼저 확인해 주세요</h2>
            <p>문의 채널에 반복해서 올라온 질문과 운영 공지를 한곳에 정리했습니다.</p>
            <div class="stats"><span>정리된 질문 <b>${FAQS.length}</b>개</span><span>누적 문의 <b>${totalAsks}</b>건</span><span>공지 <b>${NOTICES.length}</b>건</span></div>
          </div>
        </div>
      </section>

      <section class="section" aria-labelledby="h-notice">
        <div class="section-head">
          <h2 class="section-title" id="h-notice">주요 공지</h2>
          <a class="more-link" href="#notice">전체 보기 ${ICON.chevR}</a>
        </div>
        <ul class="card-list">${notices.map((n) => noticeCard(n, sortedNotices().filter((x) => !x.pinned).indexOf(n) + 1)).join("")}</ul>
      </section>

      <section class="section" aria-labelledby="h-top">
        <div class="section-head">
          <div>
            <h2 class="section-title" id="h-top">많이 올라온 질문 TOP 5</h2>
            <p class="section-desc">디스코드 문의 횟수 기준</p>
          </div>
          <a class="more-link" href="#faq">전체 보기 ${ICON.chevR}</a>
        </div>
        <ol class="rank-list">${top.map((f, i) => `<li><a class="rank-row" href="#faq/${f.id}" style="text-decoration:none;color:inherit">
          <span class="rank-num">${i + 1}</span><span class="rank-q">${esc(f.q)}</span><span class="freq">${f.count}회</span><span class="chev">${ICON.chevR}</span>
        </a></li>`).join("")}</ol>
      </section>

      <section class="section" aria-labelledby="h-cat">
        <div class="section-head"><h2 class="section-title" id="h-cat">분류별로 찾기</h2></div>
        <div class="cat-grid">${CATEGORIES.filter((c) => c.id !== "all").map((c) => `
          <button class="cat-tile" type="button" data-cat="${c.id}">
            <span class="ico">${catIcon(c.id)}</span><b>${c.name}</b><span>질문 ${counts(c.id)}개</span>
          </button>`).join("")}</div>
      </section>`;

    main.querySelectorAll(".cat-tile").forEach((b) => b.addEventListener("click", () => {
      state.faqCat = b.dataset.cat; state.faqQuery = "";
      location.hash = "#faq";
    }));
  }

  /* ---------- 화면: 자주 묻는 질문 ---------- */
  function renderFaq(openId) {
    setChrome("faq", "자주 묻는 질문", [{ label: "자주 묻는 질문" }]);
    if (openId) { state.faqCat = "all"; state.faqQuery = ""; }

    main.innerHTML = `
      <div class="search" role="search">
        ${ICON.search}
        <label class="sr-only" for="faqSearch">질문 검색</label>
        <input id="faqSearch" type="search" placeholder="궁금한 내용을 검색하세요 (예: 지각, 증명서)" value="${esc(state.faqQuery)}">
        <button class="search-clear" type="button" id="faqClear" aria-label="검색어 지우기" ${state.faqQuery ? "" : "hidden"}>${ICON.close}</button>
      </div>
      <div class="chips scroll" style="margin-top:14px" role="group" aria-label="분류">
        ${CATEGORIES.map((c) => {
          const n = c.id === "all" ? FAQS.length : FAQS.filter((f) => f.cat === c.id).length;
          return `<button class="chip" type="button" data-cat="${c.id}" aria-pressed="${state.faqCat === c.id}">${c.name}<span class="n">${n}</span></button>`;
        }).join("")}
      </div>
      <div class="list-toolbar" style="justify-content:space-between;margin-top:20px">
        <span class="list-count" id="faqCount"></span>
        <span class="list-count">문의 많은 순</span>
      </div>
      <div id="faqResult"></div>`;

    const input = $("#faqSearch");
    const clear = $("#faqClear");
    input.addEventListener("input", () => {
      state.faqQuery = input.value;
      clear.hidden = !input.value;
      drawFaqList();
    });
    clear.addEventListener("click", () => { input.value = ""; state.faqQuery = ""; clear.hidden = true; input.focus(); drawFaqList(); });
    main.querySelectorAll(".chip[data-cat]").forEach((b) => b.addEventListener("click", () => {
      state.faqCat = b.dataset.cat;
      main.querySelectorAll(".chip[data-cat]").forEach((x) => x.setAttribute("aria-pressed", x === b));
      drawFaqList();
    }));

    drawFaqList(openId);
  }

  function drawFaqList(openId) {
    const q = norm(state.faqQuery);
    const list = FAQS
      .filter((f) => state.faqCat === "all" || f.cat === state.faqCat)
      .filter((f) => !q || norm(f.q + f.a).includes(q) || f.keywords.some((k) => q.includes(norm(k)) || norm(k).includes(q)))
      .sort((a, b) => b.count - a.count);

    $("#faqCount").textContent = `${list.length}건`;
    const box = $("#faqResult");
    if (!list.length) {
      box.innerHTML = `<div class="empty"><span class="ico">${ICON.search}</span><b>찾는 질문이 아직 정리되지 않았습니다</b>
        <p>챗봇에 물어보거나 디스코드 #문의 채널에 질문해 주세요.</p>
        <button class="btn btn-tertiary btn-s" type="button" data-open-chat>챗봇에 물어보기</button></div>`;
      box.querySelector("[data-open-chat]").addEventListener("click", () => openChat(state.faqQuery));
      return;
    }
    box.innerHTML = `<ul class="faq-list">${list.map((f) => faqItem(f, f.id === openId)).join("")}</ul>`;
    box.querySelectorAll(".faq-q").forEach((b) => b.addEventListener("click", () => {
      b.setAttribute("aria-expanded", b.getAttribute("aria-expanded") !== "true");
    }));
    if (openId) {
      const el = $(`#faq-${openId}`);
      if (el) {
        el.classList.add("flash");
        requestAnimationFrame(() => el.scrollIntoView({ block: "center" }));
        setTimeout(() => el.classList.remove("flash"), 1600);
      }
    }
  }

  /* ---------- 화면: 공지사항 ---------- */
  function renderNotice() {
    setChrome("notice", "공지사항", [{ label: "공지사항" }]);
    const all = sortedNotices();
    const shown = all;
    let no = 0;
    main.innerHTML = `
      <div class="list-toolbar">
        <span class="list-count">전체 ${all.length}건</span>
      </div>
      <ul class="card-list">${shown.map((n) => noticeCard(n, n.pinned ? 0 : ++no)).join("")}</ul>`;
  }

  function renderNoticeDetail(id) {
    const all = sortedNotices();
    const i = all.findIndex((n) => n.id === id);
    if (i < 0) return renderNotice();
    const n = all[i];
    setChrome("notice", "공지사항", [{ label: "공지사항", href: "#notice" }, { label: "상세" }]);
    const prev = all[i - 1], next = all[i + 1];
    const related = FAQS.filter((f) => (f.related || []).includes(n.id));

    main.innerHTML = `
      <article class="detail">
        <div class="detail-head">
          ${n.pinned ? '<span class="tag">고정 공지</span>' : '<span class="tag soft">공지</span>'}
          <h2>${esc(n.title)}</h2>
          <div class="card-meta"><dl><div><dt>작성자</dt><dd>${esc(n.author)}</dd></div><div><dt>등록일</dt><dd>${n.date}</dd></div></dl></div>
        </div>
        <div class="detail-body">${paras(n.body)}</div>
        ${n.files.length ? `<div class="attach"><h3>첨부파일 ${n.files.length}</h3><ul>${n.files.map((f) => `<li><a href="#notice/${n.id}" onclick="return false">${ICON.file}${esc(f)}</a></li>`).join("")}</ul></div>` : ""}
        ${related.length ? `<div class="attach" style="background:var(--primary-5)"><h3>이 공지와 관련된 질문</h3><ul>${related.map((f) => `<li><a href="#faq/${f.id}">${ICON.chevR}${esc(f.q)}</a></li>`).join("")}</ul></div>` : ""}
        <ul class="pager-nav">
          <li>${prev ? `<a href="#notice/${prev.id}"><span>이전 글</span><span>${esc(prev.title)}</span></a>` : `<a aria-disabled="true"><span>이전 글</span><span style="color:var(--fg-4)">이전 글이 없습니다</span></a>`}</li>
          <li>${next ? `<a href="#notice/${next.id}"><span>다음 글</span><span>${esc(next.title)}</span></a>` : `<a aria-disabled="true"><span>다음 글</span><span style="color:var(--fg-4)">다음 글이 없습니다</span></a>`}</li>
        </ul>
      </article>
      <div class="back-row"><a class="btn btn-tertiary" href="#notice">목록</a></div>`;
  }

  /* ---------- 라우터 ---------- */
  function route() {
    const [page, id] = location.hash.replace(/^#/, "").split("/");
    if (page === "faq") renderFaq(id ? +id : null);
    else if (page === "notice" && id) renderNoticeDetail(+id);
    else if (page === "notice") renderNotice();
    else renderHome();
    if (!(page === "faq" && id)) window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);

  // 탭: 클릭 + 좌우 화살표 키
  const tabs = [...document.querySelectorAll(".tab")];
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => { location.hash = `#${t.dataset.route}`; });
    t.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const n = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
      n.focus(); n.click();
    });
  });
  $("#topSearch").addEventListener("click", () => {
    if (!location.hash.startsWith("#faq")) location.hash = "#faq";
    setTimeout(() => $("#faqSearch") && $("#faqSearch").focus(), 0);
  });

  route();

  /* ---------- 챗봇 (키워드 매칭) ---------- */
  const chat = $("#chat"), scrim = $("#scrim"), fab = $("#chatOpen");
  const log = $("#chatLog"), form = $("#chatForm"), input = $("#chatInput"), send = $("#chatSend");
  let greeted = false;

  function openChat(prefill) {
    chat.hidden = false; scrim.hidden = false;
    requestAnimationFrame(() => { chat.classList.add("open"); scrim.classList.add("open"); });
    fab.hidden = true;
    if (!greeted) {
      greeted = true;
      botSay(`<p>안녕하세요. 코디세이 Q&amp;A 안내 챗봇입니다.</p><p>디스코드에 자주 올라온 질문과 공지에서 답을 찾아 드립니다. 궁금한 내용을 입력하거나 아래 추천 질문을 눌러 주세요.</p>`, 0);
    }
    if (prefill) { input.value = prefill; send.disabled = false; }
    setTimeout(() => input.focus(), 50);
  }
  function closeChat() {
    chat.classList.remove("open"); scrim.classList.remove("open");
    setTimeout(() => { chat.hidden = true; scrim.hidden = true; fab.hidden = false; fab.focus(); }, 240);
  }
  window.openChat = openChat;

  fab.addEventListener("click", () => openChat());
  $("#chatClose").addEventListener("click", closeChat);
  scrim.addEventListener("click", closeChat);
  document.addEventListener("keydown", (e) => {
    if (chat.hidden) return;
    if (e.key === "Escape") closeChat();
    if (e.key === "Tab") { // 포커스 가두기
      const f = [...chat.querySelectorAll("button:not([disabled]), input")].filter((x) => x.offsetParent);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });

  $("#chatChips").innerHTML = CHAT_SUGGESTIONS.map((s) => `<button class="chip" type="button">${esc(s)}</button>`).join("");
  $("#chatChips").addEventListener("click", (e) => {
    const b = e.target.closest(".chip"); if (b) ask(b.textContent);
  });
  input.addEventListener("input", () => { send.disabled = !input.value.trim(); });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const v = input.value.trim(); if (!v) return;
    input.value = ""; send.disabled = true; ask(v);
  });

  function addMsg(who, html) {
    const el = document.createElement("div");
    el.className = `msg ${who}`;
    el.innerHTML = who === "bot"
      ? `<span class="bot-avatar" aria-hidden="true">${ICON.bot}</span><div class="bubble">${html}</div>`
      : `<div class="bubble"><p>${html}</p></div>`;
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  }
  function botSay(html, delay = 550) {
    if (!delay) return addMsg("bot", html);
    const t = addMsg("bot", '<span class="typing" aria-label="답변 작성 중"><i></i><i></i><i></i></span>');
    setTimeout(() => { t.querySelector(".bubble").innerHTML = html; log.scrollTop = log.scrollHeight; }, delay);
  }

  function score(text, f) {
    const t = norm(text);
    let s = 0;
    f.keywords.forEach((k) => { if (t.includes(norm(k))) s += norm(k).length + 1; });
    return s;
  }
  function matchNotices(text) {
    const t = norm(text);
    return NOTICES.filter((n) => n.title.replace(/[\[\]()]/g, " ").split(/\s+/).filter((w) => w.length >= 2 && !/코디세이|안내|공지|대전/.test(w)).some((w) => t.includes(norm(w))));
  }

  function ask(text) {
    addMsg("user", esc(text));
    const ranked = FAQS.map((f) => ({ f, s: score(text, f) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s || b.f.count - a.f.count);
    const best = ranked[0] && ranked[0].f;
    const extraFaq = ranked.slice(1, 3).map((x) => x.f);
    const notes = [...new Map([...(best && best.related ? best.related.map((id) => NOTICES.find((n) => n.id === id)) : []), ...matchNotices(text)]
      .filter(Boolean).map((n) => [n.id, n])).values()].slice(0, 2);

    const linkBtn = (href, label, icon) => `<button class="bubble-link" type="button" data-href="${href}">${icon}<span class="t">${esc(label)}</span></button>`;
    let html;
    if (best) {
      html = `<span class="bq">${esc(best.q)}</span>${paras(best.a)}`;
      const links = [
        linkBtn(`#faq/${best.id}`, "자주 묻는 질문에서 보기", ICON.chevR),
        ...notes.map((n) => linkBtn(`#notice/${n.id}`, n.title, ICON.doc)),
        ...extraFaq.map((f) => linkBtn(`#faq/${f.id}`, f.q, ICON.chevR)),
      ];
      html += `<div class="bubble-links"><span>관련 내용</span>${links.join("")}</div>`;
    } else if (notes.length) {
      html = `<p>관련된 공지를 찾았습니다.</p><div class="bubble-links">${notes.map((n) => linkBtn(`#notice/${n.id}`, n.title, ICON.doc)).join("")}</div>`;
    } else {
      html = `<p>아직 정리된 답변을 찾지 못했습니다.</p><p>다른 단어로 다시 물어보거나, 디스코드 #문의 채널에 질문을 남겨 주세요. 운영진이 확인 후 답변하고, 자주 올라오는 질문은 이곳에 추가합니다.</p>
        <div class="bubble-links">${linkBtn("#faq", "자주 묻는 질문 전체 보기", ICON.chevR)}${linkBtn("#notice", "공지사항 보기", ICON.doc)}</div>`;
    }
    botSay(html);
  }

  log.addEventListener("click", (e) => {
    const b = e.target.closest(".bubble-link"); if (!b) return;
    const href = b.dataset.href;
    if (location.hash === href) route(); else location.hash = href;
    if (window.matchMedia("(max-width: 1023px)").matches) closeChat();
  });
})();
