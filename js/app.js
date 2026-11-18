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
    link: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
    check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
    doc: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>',
    cat: {
      attend: '<path d="M8 2v4M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18M9 16l2 2 4-4"/>',
      course: '<path d="M12 7v14M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
      task: '<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M12 11h4M12 16h4"/><circle cx="8" cy="11" r="1.15" fill="currentColor" stroke="none"/><circle cx="8" cy="16" r="1.15" fill="currentColor" stroke="none"/>',
      facility: '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18zM6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2M10 6h4M10 10h4M10 14h4M10 18h4"/>',
      admin: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8"/>',
      admin: '<rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20M6 15h4"/>',
      rules: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
      apply: '<path d="M2 21a8 8 0 0 1 13.29-6"/><circle cx="10" cy="8" r="5"/><path d="m16 19 2 2 4-4"/>',
      etc: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><circle cx="12" cy="17" r="1.15" fill="currentColor" stroke="none"/>',
    },
  };
  const catIcon = (id) => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON.cat[id]}</svg>`;

  /* ---------- 상태 ---------- */
  // faqOpen: 전체 보기에서 '더 보기'로 펼친 분류, noticeAll: 공지 '더 보기'를 눌렀는지
  const state = { faqCat: "all", faqQuery: "", noticeCat: "all", noticeQuery: "", homeQuery: "", faqOpen: new Set(), noticeAll: false };
  // 긴 목록은 앞부분만 보여 주고 '더 보기'로 펼친다 (스크롤을 줄이려고)
  const FAQ_PREVIEW = 3, NOTICE_PREVIEW = 8;
  const main = $("#main");
  const sortedNotices = () => [...NOTICES].sort((a, b) => (b.pinned - a.pinned) || 0);
  let pendingScroll = null; // 화면을 그린 뒤 보이도록 스크롤할 요소 (예: #faq/24 로 열린 질문)

  /* ---------- 날짜 ---------- */
  const DOW = "일월화수목금토";
  const parseDate = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const today0 = () => { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); };
  const daysFrom = (s) => Math.round((parseDate(s) - today0()) / 864e5); // 오늘 0, 내일 1, 어제 -1
  const fmtDate = (s) => { const d = parseDate(s); return `${d.getMonth() + 1}월 ${d.getDate()}일 (${DOW[d.getDay()]})`; };
  const isNew = (s) => { const d = daysFrom(s); return d <= 0 && d > -7; }; // 게시 후 7일
  const ddayLabel = (n) => (n === 0 ? "오늘" : n === 1 ? "내일" : `D-${n}`);

  /* ---------- 공통 조각 ---------- */
  function setChrome(tab, title) {
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

  /* ---------- 링크 복사 ---------- */
  const COPY_LABEL = "링크 복사";
  const copyBtn = (hash) => `<button class="copy-link" type="button" data-copy="${hash}" aria-label="이 화면 링크 복사">${ICON.link}<span>${COPY_LABEL}</span></button>`;
  // 주소창의 ?stats-debug 같은 값은 빼고 깔끔한 주소만 복사
  const shareUrl = (hash) => `${location.origin}${location.pathname}${hash}`;
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) { /* 아래 예비 방식 */ }
    const ta = document.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly", ""); ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
    document.body.appendChild(ta); ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    ta.remove();
    return ok;
  }
  let toastEl, toastTimer;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast"; toastEl.setAttribute("role", "status"); toastEl.setAttribute("aria-live", "polite");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2200);
  }
  document.addEventListener("click", async (e) => {
    const b = e.target.closest(".copy-link"); if (!b) return;
    const hash = b.dataset.copy;
    const ok = await copyText(shareUrl(hash));
    Analytics.event("copy-link", { to: hash.replace(/^#/, "/"), ok });
    if (!ok) { toast("복사하지 못했습니다. 주소창의 링크를 복사해 주세요."); return; }
    toast("링크를 복사했습니다");
    b.classList.add("done"); b.innerHTML = `${ICON.check}<span>복사됨</span>`;
    setTimeout(() => { b.classList.remove("done"); b.innerHTML = `${ICON.link}<span>${COPY_LABEL}</span>`; }, 2000);
  });

  // 상세 화면 맨 위 '목록으로' 링크
  const backLink = (href, label) =>
    `<a class="back-link" href="${href}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg>${esc(label)}</a>`;

  // 빈 결과 안내 (챗봇 버튼 포함)
  const emptyBox = (title, desc) => `<div class="empty"><span class="ico">${ICON.search}</span><b>${title}</b>
    <p>${desc}</p><button class="btn btn-tertiary btn-s" type="button" data-open-chat>챗봇에게 물어보기</button></div>`;
  const bindEmptyChat = (box, from, q) => {
    const b = box.querySelector("[data-open-chat]");
    if (b) b.addEventListener("click", () => { Analytics.event("chat-open", { from }); openChat(q); });
  };

  // 공지 본문 첫 문장 (본문이 소제목·목록·표로 시작하면 요약하지 않는다)
  const summaryOf = (body) => {
    const first = body.split("\n").find((l) => l.trim());
    if (!first || /^\s*[#|-]/.test(first)) return "";
    const m = first.trim().match(/^.+?[다요]\.(?=\s|$)/);
    return m ? m[0] : "";
  };

  function noticeCard(n, { summary = false, q = "" } = {}) {
    const sum = summary ? summaryOf(n.body) : "";
    return `<li><a class="card" href="#notice/${n.id}">
      <div class="card-title-row"><h3 class="card-title">${q ? highlight(esc(n.title), q) : esc(n.title)}</h3>${n.files.length ? ICON.clip : ""}</div>
      ${sum ? `<p class="card-sum">${esc(sum)}</p>` : ""}
      <div class="card-meta">
        <span class="tag-row">${n.date && isNew(n.date) ? '<span class="tag tag-new">NEW</span>' : ""}${n.pinned ? '<span class="tag">중요</span>' : ""}<span class="tag c-${n.cat}">${catName(n.cat)}</span></span>
        ${n.date ? `<span class="card-date">${fmtDate(n.date)}</span>` : ""}
        ${ICON.chevRLg}
      </div>
    </a></li>`;
  }

  // 질문 줄 — 휴대폰: 누르면 그 자리에서 답이 펼쳐진다
  function faqItem(f, { tag = true, attrs = "" } = {}) {
    return `<li class="q-item" id="q-${f.id}"${attrs}>
      <h3 class="q-h"><button class="q-row" type="button" id="qb-${f.id}" aria-expanded="false" aria-controls="qa-${f.id}" data-id="${f.id}">
        <span class="faq-mark" aria-hidden="true">Q</span>
        <span class="q-body"><span class="q-text">${esc(f.q)}</span>${tag ? `<span class="tag c-${f.cat}">${catName(f.cat)}</span>` : ""}</span>
        <span class="chev">${ICON.chevD}</span>
      </button></h3>
      <div class="q-panel" id="qa-${f.id}" role="region" aria-labelledby="qb-${f.id}" hidden></div>
    </li>`;
  }

  // 비슷한 질문: 챗봇 매칭 점수가 높은 순, 모자라면 같은 분류에서 채운다
  function similarFaqs(f, n = 3) {
    const m = Matcher.rank(f.q, FAQS);
    const pool = [...m.ranked.map((x) => x.f), ...m.hints, ...FAQS.filter((x) => x.cat === f.cat)];
    return [...new Set(pool)].filter((x) => x.id !== f.id).slice(0, n);
  }
  // 답 본문: 답, 출처, 근거 공지, 비슷한 질문 (h 는 소제목 단계)
  function faqAnswer(f, h = "h3") {
    const notes = (f.related || []).map((nid) => NOTICES.find((n) => n.id === nid)).filter(Boolean);
    const sim = similarFaqs(f);
    return `<div class="faq-a-box">${paras(f.a)}</div>${f.src ? `<p class="faq-src">출처: ${esc(f.src)}</p>` : ""}
      ${notes.length ? `<div class="attach info"><${h}>근거 공지</${h}><ul>${notes.map((n) => `<li><a href="#notice/${n.id}">${ICON.doc}${esc(n.title)}</a></li>`).join("")}</ul></div>` : ""}
      ${sim.length ? `<div class="attach sim"><${h}>비슷한 질문</${h}><ul>${sim.map((x) => `<li><a href="#faq/${x.id}">${ICON.chevR}${esc(x.q)}</a></li>`).join("")}</ul></div>` : ""}`;
  }

  function filteredFaqs() {
    const q = norm(state.faqQuery);
    return FAQS
      .filter((f) => state.faqCat === "all" || f.cat === state.faqCat)
      .filter((f) => !q || norm(f.q + f.a).includes(q) || f.keywords.some((k) => q.includes(norm(k)) || norm(k).includes(q)));
  }

  /* ---------- 화면: 홈 ---------- */
  // 다가오는 일정 한 줄: 큰 날짜 + 일정 이름 + D-day
  function schedRow(s) {
    const d = parseDate(s.date);
    const href = s.faq ? `#faq/${s.faq}` : s.notice ? `#notice/${s.notice}` : "";
    const inner = `<span class="sched-date" aria-hidden="true"><b>${d.getDate()}</b><span>${d.getMonth() + 1}월 · ${DOW[d.getDay()]}</span></span>
      <span class="sched-body"><span class="sched-title">${esc(s.title)}</span><span class="sr-only">${fmtDate(s.date)}</span>${s.sub ? `<span class="sched-sub">${esc(s.sub)}</span>` : ""}</span>
      <span class="dday${s.d <= 2 ? " soon" : ""}">${ddayLabel(s.d)}</span>${href ? `<span class="chev">${ICON.chevR}</span>` : ""}`;
    return `<li>${href ? `<a class="sched-row" href="${href}">${inner}</a>` : `<div class="sched-row">${inner}</div>`}</li>`;
  }

  function renderHome() {
    setChrome("home", "홈");
    const top = FAQS.filter((f) => f.pick).slice(0, 6);
    const notices = sortedNotices().slice(0, 3);
    const counts = (id) => FAQS.filter((f) => f.cat === id).length;
    // 오늘 이후 일정만, 가까운 순으로 4개까지
    const upcoming = SCHEDULE.map((s) => ({ ...s, d: daysFrom(s.date) })).filter((s) => s.d >= 0)
      .sort((a, b) => a.d - b.d).slice(0, 4);

    const HOT = ["와이파이", "장학금", "출석", "시험", "동료평가", "주차", "사물함", "퍼실리테이터"];
    main.innerHTML = `
      <section class="section panel hero" aria-labelledby="h-hero">
        <h2 class="hero-title" id="h-hero">무엇이 궁금하세요?</h2>
        <p class="hero-desc">디스코드에 묻기 전에 질문과 공지에서 먼저 찾아보세요.</p>
        <p class="hero-meta">내용 업데이트 ${fmtDate(UPDATED)}</p>
        <div class="search hero-search" role="search">
          ${ICON.search}
          <label class="sr-only" for="homeSearch">질문과 공지 검색</label>
          <input id="homeSearch" type="search" enterkeyhint="search" autocomplete="off" placeholder="예: 와이파이, 장학금" value="${esc(state.homeQuery)}">
          <button class="search-clear" type="button" id="homeClear" aria-label="검색어 지우기" ${state.homeQuery ? "" : "hidden"}>${ICON.close}</button>
        </div>
        <div class="chips hero-chips" role="group" aria-label="자주 찾는 키워드">
          ${HOT.map((k) => `<button class="chip" type="button" data-q="${esc(k)}">${esc(k)}</button>`).join("")}
        </div>
      </section>
      <div id="homeResults" aria-live="polite"></div>
      <div id="homeSections">
      ${upcoming.length ? `<section class="section panel home-sched" aria-labelledby="h-sched">
        <div class="section-head">
          <div>
            <h2 class="section-title" id="h-sched">다가오는 일정</h2>
            <p class="section-desc">공지에 나온 정해진 날짜만 모았습니다</p>
          </div>
        </div>
        <ul class="sched-list">${upcoming.map(schedRow).join("")}</ul>
      </section>` : ""}

      <section class="section panel" aria-labelledby="h-notice">
        <div class="section-head">
          <h2 class="section-title" id="h-notice">주요 공지</h2>
          <a class="more-link" href="#notice">전체 보기 ${ICON.chevR}</a>
        </div>
        <ul class="card-list">${notices.map((n) => noticeCard(n)).join("")}</ul>
      </section>

      <section class="section panel" aria-labelledby="h-top">
        <div class="section-head">
          <div>
            <h2 class="section-title" id="h-top">먼저 확인할 질문</h2>
            <p class="section-desc">교육장 생활에 바로 필요한 내용</p>
          </div>
          <a class="more-link" href="#faq">전체 보기 ${ICON.chevR}</a>
        </div>
        <ol class="rank-list">${top.map((f) => `<li><a class="rank-row" href="#faq/${f.id}">
          <span class="faq-mark" aria-hidden="true">Q</span><span class="q-body"><span class="rank-q">${esc(f.q)}</span><span class="tag c-${f.cat}">${catName(f.cat)}</span></span><span class="chev">${ICON.chevR}</span>
        </a></li>`).join("")}</ol>
      </section>

      <section class="section panel home-cat" aria-labelledby="h-cat">
        <div class="section-head"><h2 class="section-title" id="h-cat">분류별로 찾기</h2></div>
        <div class="cat-grid">${CATEGORIES.filter((c) => c.id !== "all").map((c) => `
          <button class="cat-tile c-${c.id}" type="button" data-cat="${c.id}">
            <span class="ico">${catIcon(c.id)}</span><span class="tx"><b>${c.name}</b><span class="sub">질문 <em>${counts(c.id)}</em>개</span></span>
          </button>`).join("")}</div>
      </section>
      </div>`;

    const hInput = $("#homeSearch"), hClear = $("#homeClear");
    let searchTimer;
    const runSearch = () => {
      state.homeQuery = hInput.value;
      hClear.hidden = !hInput.value;
      drawHomeResults();
      clearTimeout(searchTimer);
      const q = hInput.value.trim();
      if (q) searchTimer = setTimeout(() => {
        const r = searchAll(q);
        Analytics.event("search", { q: q.slice(0, 30), faqs: r.faqs.length, notices: r.notices.length });
      }, 1200);
    };
    hInput.addEventListener("input", runSearch);
    hClear.addEventListener("click", () => { hInput.value = ""; runSearch(); hInput.focus(); });
    main.querySelectorAll(".hero-chips .chip").forEach((b) => b.addEventListener("click", () => {
      Analytics.event("keyword-chip", { keyword: b.dataset.q });
      hInput.value = b.dataset.q; runSearch();
    }));
    drawHomeResults();

    main.querySelectorAll(".cat-tile").forEach((b) => b.addEventListener("click", () => {
      Analytics.event("category", { cat: b.dataset.cat, from: "home" });
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
    return { faqs, notices, best: m.best };
  }

  // 검색 결과 맨 위: 챗봇과 같은 방식으로 찾은 가장 가까운 답을 바로 펼쳐 보여 준다
  const answerCard = (f) => `<section class="section panel answer-card" aria-labelledby="h-ans">
      <p class="answer-kicker">${ICON.check}가장 가까운 답</p>
      <h2 class="answer-q" id="h-ans"><span class="faq-mark" aria-hidden="true">Q</span> ${esc(f.q)}</h2>
      <div class="faq-a-box">${paras(f.a)}</div>
      <div class="answer-actions">
        <a class="btn btn-tertiary btn-s" href="#faq/${f.id}">근거·비슷한 질문 보기</a>
        <button class="btn btn-tertiary btn-s" type="button" data-open-chat>챗봇에게 더 묻기</button>
      </div>
    </section>`;

  function drawHomeResults() {
    const box = $("#homeResults"), sections = $("#homeSections");
    const q = state.homeQuery.trim();
    sections.hidden = !!q;
    if (!q) { box.innerHTML = ""; return; }
    const { faqs, notices, best } = searchAll(q);
    if (!faqs.length && !notices.length) {
      box.innerHTML = emptyBox(`'${esc(q)}'에 맞는 내용을 찾지 못했습니다`, "다른 말로 찾아보거나, 챗봇에게 물어보세요.");
      bindEmptyChat(box, "home-empty", q);
      return;
    }
    const rest = best ? faqs.filter((f) => f !== best) : faqs;
    const FAQ_MAX = 6, NOTICE_MAX = 4;
    const more = (attr) => `<button class="more-link" type="button" ${attr}>모두 보기 ${ICON.chevR}</button>`;
    box.innerHTML = `
      ${best ? answerCard(best) : ""}
      ${rest.length ? `<section class="section panel" aria-labelledby="h-rf">
        <div class="section-head"><h2 class="section-title" id="h-rf">${best ? "다른 질문" : "질문"} <span class="cnt">${rest.length}</span></h2>
          ${rest.length > FAQ_MAX ? more("data-more-faq") : ""}</div>
        <ul class="rank-list">${rest.slice(0, FAQ_MAX).map((f) => `<li><a class="rank-row" href="#faq/${f.id}">
          <span class="faq-mark" aria-hidden="true">Q</span><span class="q-body"><span class="rank-q">${highlight(esc(f.q), q)}</span><span class="tag c-${f.cat}">${catName(f.cat)}</span></span><span class="chev">${ICON.chevR}</span>
        </a></li>`).join("")}</ul>
      </section>` : ""}
      ${notices.length ? `<section class="section panel" aria-labelledby="h-rn">
        <div class="section-head"><h2 class="section-title" id="h-rn">공지 <span class="cnt">${notices.length}</span></h2>
          ${notices.length > NOTICE_MAX ? more("data-more-notice") : ""}</div>
        <ul class="rank-list">${notices.slice(0, NOTICE_MAX).map((n) => `<li><a class="rank-row" href="#notice/${n.id}">
          <span class="doc-mark" aria-hidden="true">${ICON.doc}</span><span class="q-body"><span class="rank-q">${highlight(esc(n.title), q)}</span><span class="tag c-${n.cat}">${catName(n.cat)}</span></span><span class="chev">${ICON.chevR}</span>
        </a></li>`).join("")}</ul>
      </section>` : ""}`;
    const moreFaq = box.querySelector("[data-more-faq]");
    if (moreFaq) moreFaq.addEventListener("click", () => { state.faqQuery = q; state.faqCat = "all"; location.hash = "#faq"; });
    const moreNotice = box.querySelector("[data-more-notice]");
    if (moreNotice) moreNotice.addEventListener("click", () => { state.noticeQuery = q; state.noticeCat = "all"; location.hash = "#notice"; });
    bindEmptyChat(box, "answer-card", q);
  }

  /* ---------- 화면: 자주 묻는 질문 ---------- */
  function renderFaq(root = main, openId = null) {
    setChrome("faq", "자주 묻는 질문");
    // 주소(#faq/24)로 연 질문이 지금 고른 분류·검색어에 안 걸리면 필터를 풀어서 보여 준다
    if (openId && !filteredFaqs().some((f) => f.id === openId)) { state.faqCat = "all"; state.faqQuery = ""; }

    root.innerHTML = `
      <div class="search" role="search">
        ${ICON.search}
        <label class="sr-only" for="faqSearch">질문 검색</label>
        <input id="faqSearch" type="search" placeholder="질문 검색 (예: 사물함)" value="${esc(state.faqQuery)}">
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
      state.faqQuery = input.value;
      clear.hidden = !input.value;
      drawFaqList();
    });
    clear.addEventListener("click", () => { input.value = ""; state.faqQuery = ""; clear.hidden = true; input.focus(); drawFaqList(); });
    root.querySelectorAll(".chip[data-cat]").forEach((b) => b.addEventListener("click", () => {
      state.faqCat = b.dataset.cat;
      Analytics.event("category", { cat: b.dataset.cat, from: "faq" });
      root.querySelectorAll(".chip[data-cat]").forEach((x) => x.setAttribute("aria-pressed", x === b));
      drawFaqList();
    }));
    $("#faqResult").addEventListener("click", (e) => {
      const more = e.target.closest("button.more-row");
      if (more) { toggleGroup(more); return; }
      const b = e.target.closest("button.q-row");
      if (b) toggleFaq(b);
    });

    drawFaqList();
    if (openId) {
      const b = root.querySelector(`button.q-row[data-id="${openId}"]`);
      if (b) { toggleFaq(b, true, { track: false }); pendingScroll = b.closest(".q-item"); }
    }
  }

  function drawFaqList() {
    const list = filteredFaqs();
    $("#faqCount").innerHTML = `<b>${list.length}</b>건`;
    const box = $("#faqResult");
    if (!list.length) {
      box.innerHTML = emptyBox("찾는 질문이 아직 정리되지 않았습니다", "챗봇에게 물어보거나 디스코드 allinone-문의사항 채널에 질문해 주세요.");
      bindEmptyChat(box, "faq-empty", state.faqQuery);
      return;
    }
    const row = faqItem;
    // 전체 + 검색어 없음: 분류별로 묶어 보여 준다 (분류 이름이 제목이라 줄마다 태그는 빼고)
    // 분류마다 앞의 3개만 보이고 나머지는 '더 보기'로 그 자리에서 펼친다. 분류를 고르거나 검색하면 전부 보인다
    // 넓은 화면에서는 분류 묶음(grouped)과 질문 줄(flat)을 2단으로 놓아 한 화면에 더 많이 보이게 한다
    const grouped = state.faqCat === "all" && !state.faqQuery.trim();
    box.classList.toggle("grouped", grouped);
    if (grouped) {
      // 주소로 연 질문(#faq/24)이 뒤쪽에 있으면 그 분류는 펼쳐 둔다
      const cur = FAQS.find((f) => location.hash === `#faq/${f.id}`);
      if (cur) state.faqOpen.add(cur.cat);
    }
    box.innerHTML = grouped
      ? CATEGORIES.filter((c) => c.id !== "all").map((c) => {
          // '먼저 확인할 질문'(pick)을 앞으로
          const items = list.filter((f) => f.cat === c.id).sort((a, b) => (b.pick ? 1 : 0) - (a.pick ? 1 : 0));
          if (!items.length) return "";
          const foldable = items.length > FAQ_PREVIEW + 1; // 하나만 숨길 거면 그냥 다 보여 준다
          const open = !foldable || state.faqOpen.has(c.id);
          const rows = items.map((f, i) => row(f, { tag: false, attrs: foldable && i >= FAQ_PREVIEW ? ` data-extra${open ? "" : " hidden"}` : "" })).join("");
          const more = foldable ? `<li class="more-li"><button class="more-row" type="button" data-group="${c.id}" aria-expanded="${open}" aria-controls="ql-${c.id}"><span class="t">${groupMoreLabel(c.id, items.length - FAQ_PREVIEW, open)}</span>${ICON.chevD}</button></li>` : "";
          return `<section class="q-sec" aria-labelledby="g-${c.id}"><h2 class="q-group" id="g-${c.id}">${c.name}<span class="n">${items.length}</span></h2>
            <ul class="q-list" id="ql-${c.id}">${rows}${more}</ul></section>`;
        }).join("")
      : `<ul class="q-list flat">${list.map((f) => row(f, { tag: state.faqCat === "all" })).join("")}</ul>`;
  }

  const groupMoreLabel = (cat, n, open) => (open ? `${catName(cat)} 질문 접기` : `${catName(cat)} 질문 ${n}개 더 보기`);

  // 분류 '더 보기' / '접기'
  function toggleGroup(btn, { focus = true } = {}) {
    const cat = btn.dataset.group, open = btn.getAttribute("aria-expanded") !== "true";
    const ul = $(`#ql-${cat}`), extra = [...ul.querySelectorAll("li[data-extra]")];
    if (!open) {
      // 접히는 질문의 답이 펼쳐져 있으면 먼저 닫는다
      const openBtn = ul.querySelector('li[data-extra] button.q-row[aria-expanded="true"]');
      if (openBtn) toggleFaq(openBtn, false);
    }
    extra.forEach((li) => { li.hidden = !open; });
    if (open) state.faqOpen.add(cat); else state.faqOpen.delete(cat);
    btn.setAttribute("aria-expanded", String(open));
    btn.querySelector(".t").textContent = groupMoreLabel(cat, extra.length, open);
    if (open) {
      // 키보드로 누른 경우 새로 보인 첫 질문으로 이어서 읽을 수 있게
      if (focus) extra[0]?.querySelector(".q-row")?.focus({ preventScroll: true });
      Analytics.event("faq-more", { cat });
    } else {
      // 접으면서 분류 제목이 화면 위로 사라졌으면 제목이 보이게 올린다
      const h = $(`#g-${cat}`);
      if (h.getBoundingClientRect().top < $(".head").getBoundingClientRect().bottom) h.scrollIntoView({ block: "start" });
    }
  }

  // 휴대폰 질문 펼치기/접기. 한 번에 하나만 열고, 주소도 #faq/24 로 맞춰 링크 공유·새로고침이 되게 한다
  function toggleFaq(btn, open = btn.getAttribute("aria-expanded") !== "true", { track = true } = {}) {
    const f = FAQS.find((x) => x.id === +btn.dataset.id);
    if (!f) return;
    document.querySelectorAll('#faqResult button.q-row[aria-expanded="true"]').forEach((b) => {
      if (b === btn) return;
      b.setAttribute("aria-expanded", "false");
      $(`#qa-${b.dataset.id}`).hidden = true;
    });
    const panel = $(`#qa-${f.id}`);
    if (open && !panel.innerHTML.trim()) panel.innerHTML = `${faqAnswer(f, "h4")}<div class="q-panel-foot">${copyBtn(`#faq/${f.id}`)}</div>`;
    btn.setAttribute("aria-expanded", String(open));
    panel.hidden = !open;
    history.replaceState(null, "", open ? `#faq/${f.id}` : "#faq");
    // 위에서 열려 있던 답이 접히며 화면이 밀리면, 누른 질문이 탭 줄 아래에 보이게 맞춘다
    const top = btn.getBoundingClientRect().top, bar = $(".tabs").getBoundingClientRect().bottom;
    if (top < bar) window.scrollBy(0, top - bar - 8);
    if (open && track) Analytics.page(`#faq/${f.id}`, `Q. ${f.q}`.replace(/⁠/g, ""));
  }


  /* ---------- 화면: 공지사항 ---------- */
  const filteredNotices = () => {
    const words = state.noticeQuery.trim().split(/\s+/).map(Matcher.norm).filter(Boolean);
    return sortedNotices()
      .filter((n) => state.noticeCat === "all" || n.cat === state.noticeCat)
      .filter((n) => { if (!words.length) return true; const t = Matcher.norm(n.title + n.body); return words.every((w) => t.includes(w)); });
  };

  function renderNotice(root = main) {
    setChrome("notice", "공지사항");
    // 공지가 있는 분류만 칩으로 보여 준다
    const cats = CATEGORIES.filter((c) => c.id === "all" || NOTICES.some((n) => n.cat === c.id));
    if (!cats.some((c) => c.id === state.noticeCat)) state.noticeCat = "all";
    root.innerHTML = `
      <div class="search" role="search">
        ${ICON.search}
        <label class="sr-only" for="noticeSearch">공지 검색</label>
        <input id="noticeSearch" type="search" placeholder="공지 검색 (예: 시험)" value="${esc(state.noticeQuery)}">
        <button class="search-clear" type="button" id="noticeClear" aria-label="검색어 지우기" ${state.noticeQuery ? "" : "hidden"}>${ICON.close}</button>
      </div>
      <div class="chips scroll" style="margin-top:14px" role="group" aria-label="분류">
        ${cats.map((c) => {
          const n = c.id === "all" ? NOTICES.length : NOTICES.filter((x) => x.cat === c.id).length;
          return `<button class="chip" type="button" data-cat="${c.id}" aria-pressed="${state.noticeCat === c.id}">${c.name}<span class="n">${n}</span></button>`;
        }).join("")}
      </div>
      <div class="list-toolbar" style="margin-top:16px"><span class="list-count" id="noticeCount"></span></div>
      <div id="noticeResult"></div>`;
    const draw = () => {
      const list = filteredNotices(), q = state.noticeQuery.trim();
      $("#noticeCount").innerHTML = `<b>${list.length}</b>건`;
      const box = $("#noticeResult");
      if (!list.length) {
        box.innerHTML = emptyBox(q ? `'${esc(q)}'에 맞는 공지를 찾지 못했습니다` : "이 분류에는 공지가 없습니다", "다른 말로 찾아보거나, 챗봇에게 물어보세요.");
        bindEmptyChat(box, "notice-empty", q);
        return;
      }
      // 검색하지 않을 때는 앞의 8개만 보여 주고 '더 보기'로 나머지를 펼친다
      const cut = !q && !state.noticeAll && list.length > NOTICE_PREVIEW + 2;
      const shown = cut ? list.slice(0, NOTICE_PREVIEW) : list;
      box.innerHTML = `<ul class="card-list" id="noticeList">${shown.map((n) => noticeCard(n, { summary: true, q })).join("")}</ul>
        ${cut ? `<button class="more-btn" type="button" id="noticeMore"><span>공지 ${list.length - NOTICE_PREVIEW}개 더 보기</span>${ICON.chevD}</button>` : ""}`;
      if (cut) $("#noticeMore").addEventListener("click", () => {
        state.noticeAll = true;
        draw();
        $("#noticeList").children[NOTICE_PREVIEW]?.querySelector("a")?.focus({ preventScroll: true });
        Analytics.event("notice-more");
      });
    };
    const input = $("#noticeSearch"), clear = $("#noticeClear");
    input.addEventListener("input", () => { state.noticeQuery = input.value; clear.hidden = !input.value; draw(); });
    clear.addEventListener("click", () => { input.value = ""; state.noticeQuery = ""; clear.hidden = true; input.focus(); draw(); });
    root.querySelectorAll(".chip[data-cat]").forEach((b) => b.addEventListener("click", () => {
      state.noticeCat = b.dataset.cat;
      Analytics.event("category", { cat: b.dataset.cat, from: "notice" });
      root.querySelectorAll(".chip[data-cat]").forEach((x) => x.setAttribute("aria-pressed", x === b));
      draw();
    }));
    draw();
  }

  function renderNoticeDetail(id, root = main) {
    // 이전/다음은 지금 고른 분류·검색 기준, 거기에 없으면 전체 기준
    let all = filteredNotices();
    if (!all.some((n) => n.id === id)) all = sortedNotices();
    const i = all.findIndex((n) => n.id === id);
    if (i < 0) return renderNotice();
    const n = all[i];
    setChrome("notice", "공지사항");
    const prev = all[i - 1], next = all[i + 1];
    const related = FAQS.filter((f) => (f.related || []).includes(n.id));

    root.innerHTML = `${backLink("#notice", "공지사항")}
      <article class="detail">
        <div class="detail-head">
          <div class="head-row"><div class="tag-row">${n.date && isNew(n.date) ? '<span class="tag tag-new">NEW</span>' : ""}${n.pinned ? '<span class="tag">중요</span>' : ""}<span class="tag c-${n.cat}">${catName(n.cat)}</span></div>${copyBtn(`#notice/${n.id}`)}</div>
          <h2>${esc(n.title)}</h2>
          <p class="source">${n.date ? `게시 ${fmtDate(n.date)} · ` : ""}출처: ${esc(sourceName(n.source))}</p>
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

  /* ---------- 글자 크기 (보통 ↔ 크게 125%) ---------- */
  // 처음 그릴 때 깜빡이지 않도록 index.html <head> 에서 저장된 값을 먼저 적용해 둔다
  const TEXT_KEY = "qna-text-size";
  const textBtn = $("#textSize");
  const isLarge = () => document.documentElement.classList.contains("text-lg");
  const syncTextBtn = () => { textBtn.querySelector(".ts-label").textContent = isLarge() ? "글자 작게" : "글자 크게"; };
  textBtn.addEventListener("click", () => {
    const large = !isLarge();
    document.documentElement.classList.toggle("text-lg", large);
    try { localStorage.setItem(TEXT_KEY, large ? "large" : "normal"); } catch (e) { /* 저장 안 되면 이번 방문에만 적용 */ }
    syncTextBtn();
    moveTabBar(); // 탭 폭이 바뀌었으니 밑줄도 다시 맞춘다 (offsetWidth 를 읽는 순간 새 크기로 계산됨)
    toast(large ? "글자를 크게 바꿨습니다" : "글자를 원래 크기로 바꿨습니다");
    Analytics.event("text-size", { size: large ? "large" : "normal" });
  });
  syncTextBtn();

  /* ---------- 라우터 ---------- */
  // 화면을 그린 뒤 통계에 조회 기록 (#faq/24 → /faq/24)
  function route() {
    renderRoute();
    // 상세 화면은 통계에서 알아보기 쉽게 질문·공지 제목을 함께 남긴다
    const [pg, id] = location.hash.replace(/^#/, "").split("/");
    const item = id && (pg === "faq" ? FAQS.find((f) => f.id === +id) : pg === "notice" ? NOTICES.find((n) => n.id === +id) : null);
    const title = item ? `${pg === "faq" ? "Q. " + item.q : item.title}`.replace(/\u2060/g, "") : document.title;
    Analytics.page(location.hash, title);
  }
  function renderRoute() {
    const [page, id] = location.hash.replace(/^#/, "").split("/");
    // 질문·공지 목록은 넓은 화면에서 2단으로 넓게(list), 공지 본문은 읽기 좋은 폭으로(single).
    // 질문은 PC에서도 휴대폰처럼 누른 자리에서 답이 펼쳐진다 (오른쪽 상세 칸 없음)
    main.dataset.view = page === "notice" && id ? "single" : page === "faq" || page === "notice" ? "list" : "home";
    if (page === "faq") renderFaq(main, id ? +id : null);
    else if (page === "notice" && id) renderNoticeDetail(+id);
    else if (page === "notice") renderNotice();
    else renderHome();
    window.scrollTo(0, 0);
    // 주소로 연 질문은 맨 위로 올린 뒤 그 질문 위치로 스크롤
    if (pendingScroll) { pendingScroll.scrollIntoView({ block: "start" }); pendingScroll = null; }
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

  // 로고: 홈 검색어를 비우고 홈 첫 화면으로 (이미 홈이면 hashchange 가 안 생기므로 직접 다시 그림)
  $(".logo").addEventListener("click", (e) => {
    state.homeQuery = "";
    Analytics.event("logo-reset");
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

  fab.addEventListener("click", () => { Analytics.event("chat-open", { from: "button" }); openChat(); });
  $("#chatClose").addEventListener("click", closeChat);

  // 챗봇 버튼이 글을 가리지 않게: 아래로 읽는 동안은 비켜 있고, 위로 올리거나 맨 끝에 닿으면 다시 나온다
  // '맨 위로'는 한 화면 넘게 내려왔을 때, 위로 올리거나 맨 끝에 닿으면 챗봇 버튼 위에 나타난다
  const toTop = $("#toTop");
  let lastY = window.scrollY;
  window.addEventListener("scroll", () => {
    const y = window.scrollY, dy = y - lastY;
    if (Math.abs(dy) < 6) return;
    const atEnd = window.innerHeight + y >= document.documentElement.scrollHeight - 40;
    fab.classList.toggle("tucked", dy > 0 && y > 120 && !atEnd);
    toTop.classList.toggle("show", y > window.innerHeight * 1.2 && (dy < 0 || atEnd));
    lastY = y;
  }, { passive: true });
  toTop.addEventListener("click", () => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: still ? "auto" : "smooth" });
    toTop.classList.remove("show");
    main.focus({ preventScroll: true }); // 키보드 사용자는 본문 처음부터 이어서
    Analytics.event("to-top", { page: location.hash.split("/")[0] || "#home" });
  });

  // 화면 아래 안내에 내용 업데이트 날짜
  $("#updated").textContent = `내용 업데이트: ${fmtDate(UPDATED)}`;
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
    const b = e.target.closest(".chip");
    if (b) { Analytics.event("chat-suggestion", { text: b.textContent }); ask(b.textContent); }
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
    $(".chat-suggest").hidden = true; // 첫 질문 뒤에는 추천 질문을 접어 대화 공간을 넓힌다
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
    // 챗봇 결과만 기록 (입력 문장은 기록하지 않음)
    Analytics.event("chat-ask", {
      result: best ? "answer" : m.hints.length ? "hint" : notes.length ? "notice" : "none",
      faq: best ? best.id : 0,
    });
  }

  log.addEventListener("click", (e) => {
    const b = e.target.closest(".bubble-link"); if (!b) return;
    const href = b.dataset.href;
    Analytics.event("chat-link", { to: href.replace(/^#/, "/") });
    if (location.hash === href) route(); else location.hash = href;
    if (window.matchMedia("(max-width: 1023px)").matches) closeChat();
  });
})();
