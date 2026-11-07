(() => {
  "use strict";

  /* ---------- 유틸 ---------- */
  const $ = (sel, el = document) => el.querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // 본문 규칙: "# 소제목", "- 목록", "| 칸 | 칸"(연속된 줄이 한 표, 첫 줄은 머리글), 빈 줄은 문단 간격
  // withIds 가 true 면 소제목에 id(sec-1, sec-2…)를 붙여 목차에서 이동할 수 있게 한다
  const table = (rows) => `<div class="tbl-wrap"><table class="tbl">
    <thead><tr>${rows[0].map((c) => `<th scope="col">${esc(c)}</th>`).join("")}</tr></thead>
    <tbody>${rows.slice(1).map((r) => `<tr>${r.map((c, j) => (j === 0 ? `<th scope="row">${esc(c)}</th>` : `<td>${esc(c)}</td>`)).join("")}</tr>`).join("")}</tbody>
  </table></div>`;
  const paras = (text, withIds = false) => {
    const lines = text.split("\n");
    let out = "", sec = 0;
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (/^\s*\|/.test(l)) {
        const rows = [];
        while (i < lines.length && /^\s*\|/.test(lines[i])) {
          rows.push(lines[i].trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim()));
          i++;
        }
        i--;
        out += table(rows);
        continue;
      }
      if (!l.trim()) { out += `<div class="gap"></div>`; continue; }
      const h = l.match(/^\s*#\s+(.*)$/);
      if (h) { sec++; out += `<p class="sub-h"${withIds ? ` id="sec-${sec}" tabindex="-1"` : ""}>${esc(h[1])}</p>`; continue; }
      const m = l.match(/^\s*-\s+(.*)$/);
      out += m ? `<p class="li">${esc(m[1])}</p>` : `<p>${esc(l)}</p>`;
    }
    return out;
  };
  // 긴 공지 목차: 소제목이 3개 이상일 때만
  const toc = (text) => {
    const heads = text.split("\n").map((l) => l.match(/^\s*#\s+(.*)$/)).filter(Boolean).map((m) => m[1]);
    if (heads.length < 3) return "";
    return `<nav class="toc" aria-label="목차"><h3>목차</h3><ol>${heads.map((h, i) =>
      `<li><button type="button" data-sec="${i + 1}"><span class="toc-n">${i + 1}</span>${esc(h)}</button></li>`).join("")}</ol></nav>`;
  };
  const bindToc = (root) => root.querySelectorAll(".toc button").forEach((b) => b.addEventListener("click", () => {
    const el = root.querySelector(`#sec-${b.dataset.sec}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.focus({ preventScroll: true });
  }));
  // 검색어 강조: 이미 이스케이프된 문자열에 <mark> 를 씌운다
  const highlight = (html, query) => {
    const words = query.trim().split(/\s+/).filter((w) => w.length >= 1).map((w) => esc(w).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    if (!words.length) return html;
    return html.replace(new RegExp(`(${words.join("|")})`, "gi"), "<mark>$1</mark>");
  };
  const catName = (id) => (CATEGORIES.find((c) => c.id === id) || {}).name || "";
  const norm = (s) => s.toLowerCase().replace(/[\s\u2060]+/g, "");

  // 줄바꿈 정리: "입실·퇴실", "09:00~22:00", "2~3주" 처럼 붙어 있어야 읽히는 묶음이
  // 가운뎃점·물결표 앞뒤에서 갈라지지 않도록 단어 결합 문자(U+2060)를 넣는다.
  const WJ = "\u2060";
  const glue = (t) => t.replace(/\s*([·~])\s*/g, (m, c) => (m.trim() === c ? `${WJ}${c}${WJ}` : m));
  FAQS.forEach((f) => { f.q = glue(f.q); f.a = glue(f.a); });
  NOTICES.forEach((n) => { n.title = glue(n.title); n.body = glue(n.body); });

  const ICON = {
    chevR: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>',
    chevRLg: '<svg class="chev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>',
    chevD: '<svg class="faq-chev" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
    clip: '<svg class="clip" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-label="첨부파일 있음" role="img"><path d="M8 8.5h9a3.5 3.5 0 0 1 0 7H6.5a2.5 2.5 0 0 1 0-5H16"/></svg>',
    bookmark: '<svg class="card-pin" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true"><path d="M6 3.5h12v17l-6-4.5-6 4.5z"/></svg>',
    search: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.8-4.8"/></svg>',
    close: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    chat: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>',
    file: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M12 12v6M9 15l3 3 3-3"/></svg>',
    info: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="8" r="1.15" fill="currentColor" stroke="none"/></svg>',
    bot: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 4v4M9.5 16.5h5"/><circle cx="9" cy="13" r="1.15" fill="currentColor" stroke="none"/><circle cx="15" cy="13" r="1.15" fill="currentColor" stroke="none"/></svg>',
    doc: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>',
    cat: {
      attend: '<path d="M8 2v4M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18M9 16l2 2 4-4"/>',
      course: '<path d="M12 7v14M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
      task: '<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M12 11h4M12 16h4"/><circle cx="8" cy="11" r="1.15" fill="currentColor" stroke="none"/><circle cx="8" cy="16" r="1.15" fill="currentColor" stroke="none"/>',
      facility: '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18zM6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2M10 6h4M10 10h4M10 14h4M10 18h4"/>',
      admin: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8"/>',
      admin: '<rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20M6 15h4"/>',
      rules: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
      etc: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><circle cx="12" cy="17" r="1.15" fill="currentColor" stroke="none"/>',
    },
  };
  const catIcon = (id) => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON.cat[id]}</svg>`;

  /* ---------- 상태 ---------- */
  const state = { faqCat: "all", faqQuery: "", faqPage: 1, noticeCat: "all", homeQuery: "" };
  const FAQ_PAGE_SIZE = 8;
  const main = $("#main");
  const sortedNotices = () => [...NOTICES].sort((a, b) => (b.pinned - a.pinned) || 0);


  /* ---------- 공통 조각 ---------- */
  function setChrome(tab, title, crumbs) {
    document.querySelectorAll(".tab").forEach((t) => {
      const on = t.dataset.route === tab;
      t.setAttribute("aria-selected", on);
      t.tabIndex = on ? 0 : -1;
    });
    main.setAttribute("aria-labelledby", `tab-${tab}`);
    moveTabBar();
    $("#pageTitle").textContent = title;
    document.title = `${title} | 코디세이 Q&A 허브`;
  }

  // 공지 출처 표시
  const SOURCES = {
    OT: "입학연수과정 오리엔테이션 자료 (10월 28일)",
    GB: "AI 네이티브 과정 교육시설 이용 가이드북",
    "OT+GB": "오리엔테이션 자료 + AI 네이티브 과정 가이드북",
    EXAM: "시험 기능 학습자 가이드",
  };
  const sourceName = (k) => SOURCES[k] || "디스코드 allinone-공지사항 채널";

  // 상세 화면 맨 위 '목록으로' 링크
  const backLink = (href, label) =>
    `<a class="back-link" href="${href}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg>${esc(label)}</a>`;

  function noticeCard(n) {
    return `<li><a class="card" href="#notice/${n.id}">
      <div class="card-title-row"><h3 class="card-title">${esc(n.title)}</h3>${n.files.length ? ICON.clip : ""}</div>
      <div class="card-meta">
        <span class="tag-row">${n.pinned ? '<span class="tag">고정</span>' : ""}<span class="tag c-${n.cat}">${catName(n.cat)}</span></span>
        ${ICON.chevRLg}
      </div>
    </a></li>`;
  }

  function faqRow(f) {
    return `<li><a class="q-row" href="#faq/${f.id}">
      <span class="faq-mark" aria-hidden="true">Q</span>
      <span class="q-body"><span class="q-text">${esc(f.q)}</span><span class="tag c-${f.cat}">${catName(f.cat)}</span></span>
      <span class="chev">${ICON.chevR}</span>
    </a></li>`;
  }

  function filteredFaqs() {
    const q = norm(state.faqQuery);
    return FAQS
      .filter((f) => state.faqCat === "all" || f.cat === state.faqCat)
      .filter((f) => !q || norm(f.q + f.a).includes(q) || f.keywords.some((k) => q.includes(norm(k)) || norm(k).includes(q)));
  }

  /* ---------- 화면: 한눈에 보기 ---------- */
  function renderHome() {
    setChrome("home", "한눈에 보기", [{ label: "한눈에 보기" }]);
    const top = FAQS.filter((f) => f.pick).slice(0, 6);
    const notices = sortedNotices().slice(0, 3);
    const counts = (id) => FAQS.filter((f) => f.cat === id).length;

    const HOT = ["와이파이", "장학금", "출석", "시험", "동료평가", "주차", "사물함", "퍼실"];
    main.innerHTML = `
      <section class="section panel hero" aria-labelledby="h-hero">
        <h2 class="hero-title" id="h-hero">무엇이 궁금하세요?</h2>
        <p class="hero-desc">디스코드에 묻기 전에 질문과 공지에서 먼저 찾아보세요.</p>
        <div class="search hero-search" role="search">
          ${ICON.search}
          <label class="sr-only" for="homeSearch">질문과 공지 검색</label>
          <input id="homeSearch" type="search" enterkeyhint="search" autocomplete="off" placeholder="예: 와이파이, 장학금, 시험 시간" value="${esc(state.homeQuery)}">
          <button class="search-clear" type="button" id="homeClear" aria-label="검색어 지우기" ${state.homeQuery ? "" : "hidden"}>${ICON.close}</button>
        </div>
        <div class="chips hero-chips" role="group" aria-label="자주 찾는 키워드">
          ${HOT.map((k) => `<button class="chip" type="button" data-q="${esc(k)}">${esc(k)}</button>`).join("")}
        </div>
      </section>
      <div id="homeResults" aria-live="polite"></div>
      <div id="homeSections">
      <section class="section panel" aria-labelledby="h-notice">
        <div class="section-head">
          <h2 class="section-title" id="h-notice">주요 공지</h2>
          <a class="more-link" href="#notice">전체 보기 ${ICON.chevR}</a>
        </div>
        <ul class="card-list">${notices.map(noticeCard).join("")}</ul>
      </section>

      <section class="section panel" aria-labelledby="h-top">
        <div class="section-head">
          <div>
            <h2 class="section-title" id="h-top">먼저 확인할 질문</h2>
            <p class="section-desc">교육장 생활에 바로 필요한 내용</p>
          </div>
          <a class="more-link" href="#faq">전체 보기 ${ICON.chevR}</a>
        </div>
        <ol class="rank-list">${top.map((f, i) => `<li><a class="rank-row" href="#faq/${f.id}">
          <span class="faq-mark" aria-hidden="true">Q</span><span class="rank-q">${esc(f.q)}</span><span class="tag c-${f.cat}">${catName(f.cat)}</span><span class="chev">${ICON.chevR}</span>
        </a></li>`).join("")}</ol>
      </section>

      <section class="section panel" aria-labelledby="h-cat">
        <div class="section-head"><h2 class="section-title" id="h-cat">분류별로 찾기</h2></div>
        <div class="cat-grid">${CATEGORIES.filter((c) => c.id !== "all").map((c) => `
          <button class="cat-tile c-${c.id}" type="button" data-cat="${c.id}">
            <span class="ico">${catIcon(c.id)}</span><b>${c.name}</b><span class="sub">질문 <em>${counts(c.id)}</em>개</span>
          </button>`).join("")}</div>
      </section>
      </div>`;

    const hInput = $("#homeSearch"), hClear = $("#homeClear");
    const runSearch = () => {
      state.homeQuery = hInput.value;
      hClear.hidden = !hInput.value;
      drawHomeResults();
    };
    hInput.addEventListener("input", runSearch);
    hClear.addEventListener("click", () => { hInput.value = ""; runSearch(); hInput.focus(); });
    main.querySelectorAll(".hero-chips .chip").forEach((b) => b.addEventListener("click", () => { hInput.value = b.dataset.q; runSearch(); }));
    drawHomeResults();

    main.querySelectorAll(".cat-tile").forEach((b) => b.addEventListener("click", () => {
      state.faqCat = b.dataset.cat; state.faqQuery = "";
      location.hash = "#faq";
    }));
  }

  // 홈 검색: 질문(검색어 포함 + 챗봇 매칭)과 공지(제목·본문 포함)를 함께 찾는다
  function searchAll(query) {
    const words = query.trim().split(/\s+/).map(Matcher.norm).filter(Boolean);
    if (!words.length) return { faqs: [], notices: [] };
    const hasAll = (text) => { const t = Matcher.norm(text); return words.every((w) => t.includes(w)); };
    const exact = FAQS.filter((f) => hasAll(f.q + f.a + f.keywords.join("")))
      .sort((a, b) => hasAll(b.q) - hasAll(a.q));
    const m = Matcher.rank(query, FAQS);
    const extra = [...m.ranked.map((x) => x.f), ...m.hints].filter((f) => !exact.includes(f));
    const faqs = [...new Set([...exact, ...extra])];
    const notices = sortedNotices().filter((n) => hasAll(n.title + n.body))
      .sort((a, b) => hasAll(b.title) - hasAll(a.title));
    return { faqs, notices };
  }

  function drawHomeResults() {
    const box = $("#homeResults"), sections = $("#homeSections");
    const q = state.homeQuery.trim();
    sections.hidden = !!q;
    if (!q) { box.innerHTML = ""; return; }
    const { faqs, notices } = searchAll(q);
    if (!faqs.length && !notices.length) {
      box.innerHTML = `<div class="empty"><span class="ico">${ICON.search}</span><b>'${esc(q)}'에 맞는 내용을 찾지 못했습니다</b>
        <p>다른 말로 찾아보거나, 챗봇에 물어보세요.</p>
        <button class="btn btn-tertiary btn-s" type="button" data-open-chat>챗봇에 물어보기</button></div>`;
      box.querySelector("[data-open-chat]").addEventListener("click", () => openChat(q));
      return;
    }
    const FAQ_MAX = 6, NOTICE_MAX = 4;
    box.innerHTML = `
      ${faqs.length ? `<section class="section panel" aria-labelledby="h-rf">
        <div class="section-head"><h2 class="section-title" id="h-rf">질문 <span class="cnt">${faqs.length}</span></h2>
          ${faqs.length > FAQ_MAX ? `<button class="more-link" type="button" data-more-faq>모두 보기 ${ICON.chevR}</button>` : ""}</div>
        <ul class="rank-list">${faqs.slice(0, FAQ_MAX).map((f) => `<li><a class="rank-row" href="#faq/${f.id}">
          <span class="faq-mark" aria-hidden="true">Q</span><span class="rank-q">${highlight(esc(f.q), q)}</span><span class="tag c-${f.cat}">${catName(f.cat)}</span><span class="chev">${ICON.chevR}</span>
        </a></li>`).join("")}</ul>
      </section>` : ""}
      ${notices.length ? `<section class="section panel" aria-labelledby="h-rn">
        <div class="section-head"><h2 class="section-title" id="h-rn">공지 <span class="cnt">${notices.length}</span></h2></div>
        <ul class="rank-list">${notices.slice(0, NOTICE_MAX).map((n) => `<li><a class="rank-row" href="#notice/${n.id}">
          <span class="doc-mark" aria-hidden="true">${ICON.doc}</span><span class="rank-q">${highlight(esc(n.title), q)}</span><span class="tag c-${n.cat}">${catName(n.cat)}</span><span class="chev">${ICON.chevR}</span>
        </a></li>`).join("")}</ul>
      </section>` : ""}`;
    const more = box.querySelector("[data-more-faq]");
    if (more) more.addEventListener("click", () => { state.faqQuery = q; state.faqCat = "all"; state.faqPage = 1; location.hash = "#faq"; });
  }

  /* ---------- 화면: 자주 묻는 질문 ---------- */
  function renderFaq(root = main) {
    setChrome("faq", "자주 묻는 질문", [{ label: "자주 묻는 질문" }]);

    root.innerHTML = `
      <div class="search" role="search">
        ${ICON.search}
        <label class="sr-only" for="faqSearch">질문 검색</label>
        <input id="faqSearch" type="search" placeholder="궁금한 내용을 검색하세요 (예: 와이파이, 사물함)" value="${esc(state.faqQuery)}">
        <button class="search-clear" type="button" id="faqClear" aria-label="검색어 지우기" ${state.faqQuery ? "" : "hidden"}>${ICON.close}</button>
      </div>
      <div class="chips scroll" style="margin-top:14px" role="group" aria-label="분류">
        ${CATEGORIES.map((c) => {
          const n = c.id === "all" ? FAQS.length : FAQS.filter((f) => f.cat === c.id).length;
          return `<button class="chip" type="button" data-cat="${c.id}" aria-pressed="${state.faqCat === c.id}">${c.name}<span class="n">${n}</span></button>`;
        }).join("")}
      </div>
      <div class="list-toolbar" style="margin-top:16px">
        <span class="list-count" id="faqCount"></span>
      </div>
      <div id="faqResult"></div>`;

    const input = $("#faqSearch");
    const clear = $("#faqClear");
    input.addEventListener("input", () => {
      state.faqQuery = input.value; state.faqPage = 1;
      clear.hidden = !input.value;
      drawFaqList();
    });
    clear.addEventListener("click", () => { input.value = ""; state.faqQuery = ""; state.faqPage = 1; clear.hidden = true; input.focus(); drawFaqList(); });
    root.querySelectorAll(".chip[data-cat]").forEach((b) => b.addEventListener("click", () => {
      state.faqCat = b.dataset.cat; state.faqPage = 1;
      root.querySelectorAll(".chip[data-cat]").forEach((x) => x.setAttribute("aria-pressed", x === b));
      drawFaqList();
    }));

    drawFaqList();
  }

  function drawFaqList() {
    const list = filteredFaqs();
    const pages = Math.max(1, Math.ceil(list.length / FAQ_PAGE_SIZE));
    state.faqPage = Math.min(state.faqPage, pages);
    const from = (state.faqPage - 1) * FAQ_PAGE_SIZE;
    const shown = list.slice(from, from + FAQ_PAGE_SIZE);

    $("#faqCount").innerHTML = `<b>${list.length}</b>건`;
    const box = $("#faqResult");
    if (!list.length) {
      box.innerHTML = `<div class="empty"><span class="ico">${ICON.search}</span><b>찾는 질문이 아직 정리되지 않았습니다</b>
        <p>챗봇에 물어보거나 디스코드 allinone-문의사항 채널에 질문해 주세요.</p>
        <button class="btn btn-tertiary btn-s" type="button" data-open-chat>챗봇에 물어보기</button></div>`;
      box.querySelector("[data-open-chat]").addEventListener("click", () => openChat(state.faqQuery));
      return;
    }
    box.innerHTML = `<ul class="q-list">${shown.map(faqRow).join("")}</ul>${pagination(state.faqPage, pages)}`;
    markSelected();
    box.querySelectorAll(".pg-btn[data-page]").forEach((b) => b.addEventListener("click", () => {
      state.faqPage = +b.dataset.page;
      drawFaqList();
      $("#faqCount").scrollIntoView({ block: "start" });
      window.scrollBy(0, -72);
    }));
  }

  function pagination(cur, pages) {
    if (pages <= 1) return "";
    const prev = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg>';
    const nums = Array.from({ length: pages }, (_, i) => i + 1).map((n) =>
      `<button class="pg-btn${n === cur ? " on" : ""}" type="button" data-page="${n}" ${n === cur ? 'aria-current="page"' : ""} aria-label="${n}쪽">${n}</button>`).join("");
    return `<nav class="pagination" aria-label="페이지">
      <button class="pg-btn" type="button" ${cur > 1 ? `data-page="${cur - 1}"` : "disabled"} aria-label="이전 쪽">${prev}</button>
      ${nums}
      <button class="pg-btn" type="button" ${cur < pages ? `data-page="${cur + 1}"` : "disabled"} aria-label="다음 쪽">${ICON.chevR}</button>
    </nav>`;
  }

  function renderFaqDetail(id, root = main) {
    const f = FAQS.find((x) => x.id === id);
    if (!f) return root === main ? renderFaq() : (root.innerHTML = splitEmpty("질문"));
    setChrome("faq", "자주 묻는 질문", [{ label: "자주 묻는 질문", href: "#faq" }, { label: "상세" }]);
    // 이전/다음은 지금 목록(필터·검색) 기준, 목록에 없으면 전체 기준
    let list = filteredFaqs();
    if (!list.some((x) => x.id === id)) list = FAQS;
    const i = list.findIndex((x) => x.id === id);
    const prev = list[i - 1], next = list[i + 1];
    const notes = (f.related || []).map((nid) => NOTICES.find((n) => n.id === nid)).filter(Boolean);
    const nav = (x, label) => x
      ? `<a href="#faq/${x.id}"><span>${label}</span><span>${esc(x.q)}</span></a>`
      : `<a aria-disabled="true"><span>${label}</span><span>${label}이 없습니다</span></a>`;

    root.innerHTML = `${backLink("#faq", "자주 묻는 질문")}
      <article class="detail">
        <div class="detail-head">
          <div class="tag-row"><span class="tag c-${f.cat}">${catName(f.cat)}</span></div>
          <h2><span class="faq-mark" aria-hidden="true">Q</span> ${esc(f.q)}</h2>
        </div>
        <div class="detail-body"><div class="faq-a-box">${paras(f.a)}</div></div>
        ${notes.length ? `<div class="attach info"><h3>근거 공지</h3><ul>${notes.map((n) => `<li><a href="#notice/${n.id}">${ICON.doc}${esc(n.title)}</a></li>`).join("")}</ul></div>` : ""}
        <ul class="pager-nav"><li>${nav(prev, "이전 질문")}</li><li>${nav(next, "다음 질문")}</li></ul>
      </article>
      <div class="back-row"><a class="btn btn-tertiary btn-block" href="#faq">목록으로</a></div>`;
  }

  /* ---------- 화면: 공지사항 ---------- */
  const filteredNotices = () => sortedNotices().filter((n) => state.noticeCat === "all" || n.cat === state.noticeCat);

  function renderNotice(root = main) {
    setChrome("notice", "공지사항", [{ label: "공지사항" }]);
    // 공지가 있는 분류만 칩으로 보여 준다
    const cats = CATEGORIES.filter((c) => c.id === "all" || NOTICES.some((n) => n.cat === c.id));
    if (!cats.some((c) => c.id === state.noticeCat)) state.noticeCat = "all";
    root.innerHTML = `
      <div class="chips scroll" role="group" aria-label="분류">
        ${cats.map((c) => {
          const n = c.id === "all" ? NOTICES.length : NOTICES.filter((x) => x.cat === c.id).length;
          return `<button class="chip" type="button" data-cat="${c.id}" aria-pressed="${state.noticeCat === c.id}">${c.name}<span class="n">${n}</span></button>`;
        }).join("")}
      </div>
      <div class="list-toolbar" style="margin-top:16px"><span class="list-count" id="noticeCount"></span></div>
      <ul class="card-list" id="noticeList"></ul>`;
    const draw = () => {
      const list = filteredNotices();
      $("#noticeCount").innerHTML = `<b>${list.length}</b>건`;
      $("#noticeList").innerHTML = list.map(noticeCard).join("");
      markSelected();
    };
    root.querySelectorAll(".chip[data-cat]").forEach((b) => b.addEventListener("click", () => {
      state.noticeCat = b.dataset.cat;
      root.querySelectorAll(".chip[data-cat]").forEach((x) => x.setAttribute("aria-pressed", x === b));
      draw();
    }));
    draw();
  }

  function renderNoticeDetail(id, root = main) {
    // 이전/다음은 지금 고른 분류 기준, 그 분류에 없으면 전체 기준
    let all = filteredNotices();
    if (!all.some((n) => n.id === id)) all = sortedNotices();
    const i = all.findIndex((n) => n.id === id);
    if (i < 0) return root === main ? renderNotice() : (root.innerHTML = splitEmpty("공지"));
    const n = all[i];
    setChrome("notice", "공지사항", [{ label: "공지사항", href: "#notice" }, { label: "상세" }]);
    const prev = all[i - 1], next = all[i + 1];
    const related = FAQS.filter((f) => (f.related || []).includes(n.id));

    root.innerHTML = `${backLink("#notice", "공지사항")}
      <article class="detail">
        <div class="detail-head">
          <div class="tag-row">${n.pinned ? '<span class="tag">고정</span>' : ""}<span class="tag c-${n.cat}">${catName(n.cat)}</span></div>
          <h2>${esc(n.title)}</h2>
          <p class="source">출처: ${esc(sourceName(n.source))}</p>
        </div>
        ${toc(n.body)}
        <div class="detail-body">${paras(n.body, true)}</div>
        ${n.files.length ? `<div class="attach"><h3>첨부파일 ${n.files.length}</h3><ul>${n.files.map((f) => `<li><a href="#notice/${n.id}" onclick="return false">${ICON.file}${esc(f)}</a></li>`).join("")}</ul></div>` : ""}
        ${related.length ? `<div class="attach info"><h3>이 공지와 관련된 질문</h3><ul>${related.map((f) => `<li><a href="#faq/${f.id}">${ICON.chevR}${esc(f.q)}</a></li>`).join("")}</ul></div>` : ""}
        <ul class="pager-nav">
          <li>${prev ? `<a href="#notice/${prev.id}"><span>이전 글</span><span>${esc(prev.title)}</span></a>` : `<a aria-disabled="true"><span>이전 글</span><span>이전 글이 없습니다</span></a>`}</li>
          <li>${next ? `<a href="#notice/${next.id}"><span>다음 글</span><span>${esc(next.title)}</span></a>` : `<a aria-disabled="true"><span>다음 글</span><span>다음 글이 없습니다</span></a>`}</li>
        </ul>
      </article>
      <div class="back-row"><a class="btn btn-tertiary btn-block" href="#notice">목록으로</a></div>`;
    bindToc(root);
  }

  function moveTabBar() {
    const t = document.querySelector('.tab[aria-selected="true"]');
    const bar = $(".tab-bar");
    if (!t || !bar) return;
    bar.style.width = `${t.offsetWidth}px`;
    bar.style.transform = `translateX(${t.offsetLeft}px)`;
  }
  window.addEventListener("resize", moveTabBar);
  document.fonts && document.fonts.ready.then(moveTabBar);

  /* ---------- PC 2단 (넓은 화면에서 왼쪽 목록 + 오른쪽 상세) ---------- */
  const WIDE = window.matchMedia("(min-width: 1024px)");
  let splitKind = null;
  const splitEmpty = (what) => `<div class="split-empty"><span class="ico">${ICON.chevR}</span>
    <b>왼쪽에서 ${what}을 고르면 여기에 내용이 나옵니다</b></div>`;
  // 목록에서 지금 열린 항목 표시
  function markSelected() {
    const h = location.hash;
    document.querySelectorAll("#listPane .q-row, #listPane .card").forEach((a) => {
      if (a.getAttribute("href") === h) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
  }

  /* ---------- 라우터 ---------- */
  function route() {
    const [page, id] = location.hash.replace(/^#/, "").split("/");
    const listPage = page === "faq" || page === "notice";
    if (WIDE.matches && listPage) {
      // 같은 탭 안에서 항목만 바뀌면 목록은 그대로 두고 오른쪽만 다시 그린다 (목록 스크롤·검색어 유지)
      if (splitKind !== page || !$("#listPane")) {
        main.dataset.view = "split";
        main.innerHTML = `<div class="split"><div class="split-list" id="listPane"></div><div class="split-detail" id="detailPane"></div></div>`;
        splitKind = page;
        if (page === "faq") renderFaq($("#listPane")); else renderNotice($("#listPane"));
        window.scrollTo(0, 0);
      }
      const pane = $("#detailPane");
      if (id) { if (page === "faq") renderFaqDetail(+id, pane); else renderNoticeDetail(+id, pane); }
      else { setChrome(page, page === "faq" ? "자주 묻는 질문" : "공지사항", []); pane.innerHTML = splitEmpty(page === "faq" ? "질문" : "공지"); }
      pane.scrollTop = 0;
      markSelected();
      return;
    }
    splitKind = null;
    main.dataset.view = "single";
    if (page === "faq" && id) renderFaqDetail(+id);
    else if (page === "faq") renderFaq();
    else if (page === "notice" && id) renderNoticeDetail(+id);
    else if (page === "notice") renderNotice();
    else renderHome();
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);
  WIDE.addEventListener("change", () => { splitKind = null; route(); });

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

  // 로고: 홈 검색어를 비우고 한눈에 보기 첫 화면으로 (이미 홈이면 hashchange 가 안 생기므로 직접 다시 그림)
  $(".logo").addEventListener("click", (e) => {
    state.homeQuery = "";
    const h = location.hash;
    if (h === "#home" || h === "" || h === "#") { e.preventDefault(); route(); }
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
    // 휴대폰에서는 입력창에 바로 포커스하면 키보드가 자동으로 올라와 시트를 가리므로,
    // 마우스·키보드 환경에서만 입력창에, 휴대폰에서는 시트 자체에 포커스한다.
    const touch = window.matchMedia("(pointer: coarse)").matches;
    setTimeout(() => (touch && !prefill ? chat.focus({ preventScroll: true }) : input.focus()), 50);
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

  function matchNotices(text) {
    const t = norm(text);
    return NOTICES.filter((n) => n.title.replace(/[\[\]()]/g, " ").split(/\s+/).filter((w) => w.length >= 3 && !/코디세이|안내|공지|대전/.test(w)).some((w) => t.includes(norm(w))));
  }

  function ask(text) {
    addMsg("user", esc(text));
    const m = Matcher.rank(text, FAQS); // js/matcher.js
    const best = m.best;
    const extraFaq = m.others;
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
    } else if (m.hints.length) {
      html = `<p>딱 맞는 답을 찾지 못했습니다. 혹시 이 질문인가요?</p><div class="bubble-links">${m.hints.map((f) => linkBtn(`#faq/${f.id}`, f.q, ICON.chevR)).join("")}</div>`;
    } else if (notes.length) {
      html = `<p>관련된 공지를 찾았습니다.</p><div class="bubble-links">${notes.map((n) => linkBtn(`#notice/${n.id}`, n.title, ICON.doc)).join("")}</div>`;
    } else {
      html = `<p>아직 정리된 답변을 찾지 못했습니다.</p><p>다른 단어로 다시 물어보거나, 디스코드 allinone-문의사항 채널에 질문을 남겨 주세요.</p>
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
