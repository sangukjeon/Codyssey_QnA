/* 운영진 입력판(js/ops.js)을 읽은 뒤에 그리려고 함수로 둔다. 맨 끝에서 부른다 */
const startApp = () => {
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
  // 긴 공지 목차: 소제목이 3개 이상일 때만. extra 는 목차 끝에 붙일 줄(묻고 답한 것)
  const toc = (text, extra = "") => {
    const heads = text.split("\n").map((l) => l.match(/^\s*#\s+(.*)$/)).filter(Boolean).map((m) => m[1]);
    if (heads.length < 3) return "";
    return `<nav class="toc" aria-label="목차"><h2>목차</h2><ol>${heads.map((h, i) =>
      `<li><button type="button" data-sec="${i + 1}"><span class="toc-n">${i + 1}</span>${esc(h)}</button></li>`).join("")}${extra}</ol></nav>`;
  };
  const catName = (id) => (CATEGORIES.find((c) => c.id === id) || {}).name || "";
  const norm = (s) => s.toLowerCase().replace(/[\s⁠]+/g, "");

  // 줄바꿈 정리: "입실·퇴실", "09:00~22:00", "2~3주" 처럼 붙어 있어야 읽히는 묶음이
  // 가운뎃점·물결표 앞뒤에서 갈라지지 않도록 단어 결합 문자(U+2060)를 넣는다.
  const WJ = "⁠";
  const glue = (t) => t.replace(/\s*([·~])\s*/g, (m, c) => (m.trim() === c ? `${WJ}${c}${WJ}` : m));
  // 일정 설명처럼 " · "를 구분 표시로도 쓰는 글: 띄어 쓴 것은 그대로 두고 붙여 쓴 것만 묶는다
  const glueTight = (t) => t.replace(/(\S)([·~])(?=\S)/g, `$1${WJ}$2${WJ}`);
  FAQS.forEach((f) => { f.q = glue(f.q); f.a = glue(f.a); });
  NOTICES.forEach((n) => { n.title = glue(n.title); n.body = glue(n.body); });

  const svg = (d, { size = 20, cls = "", sw = 2, attrs = 'aria-hidden="true"' } = {}) =>
    `<svg${cls ? ` class="${cls}"` : ""} width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" ${attrs}>${d}</svg>`;
  const ICON = {
    chevR: svg('<path d="m9 6 6 6-6 6"/>'),
    chevL: svg('<path d="m15 6-6 6 6 6"/>'),
    chevD: svg('<path d="m6 9 6 6 6-6"/>', { size: 22, cls: "faq-chev" }),
    caret: svg('<path d="m6 9 6 6 6-6"/>', { size: 18, cls: "caret" }),
    clip: svg('<path d="M8 8.5h9a3.5 3.5 0 0 1 0 7H6.5a2.5 2.5 0 0 1 0-5H16"/>', { size: 18, cls: "clip", sw: 2.2, attrs: 'aria-label="첨부파일 있음" role="img"' }),
    search: svg('<circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.8-4.8"/>', { size: 22 }),
    close: svg('<path d="M6 6l12 12M18 6 6 18"/>', { size: 18 }),
    file: svg('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M12 12v6M9 15l3 3 3-3"/>', { size: 18 }),
    bot: svg('<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 4v4M9.5 16.5h5"/><circle cx="9" cy="13" r="1.15" fill="currentColor" stroke="none"/><circle cx="15" cy="13" r="1.15" fill="currentColor" stroke="none"/>', { size: 18 }),
    link: svg('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>', { size: 16 }),
    check: svg('<path d="M20 6 9 17l-5-5"/>', { size: 16, sw: 2.4 }),
    doc: svg('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>', { size: 14 }),
  };

  /* ---------- 날짜 ---------- */
  const DOW = "일월화수목금토";
  const parseDate = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const today0 = () => { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); };
  const daysFrom = (s) => Math.round((parseDate(s) - today0()) / 864e5); // 오늘 0, 내일 1, 어제 -1
  const fmtDate = (s) => { const d = parseDate(s); return `${d.getMonth() + 1}월 ${d.getDate()}일 (${DOW[d.getDay()]})`; };
  // 목록의 날짜 칸: "11월 16일" (올해가 아니면 연도도)
  const fmtShort = (s) => { const d = parseDate(s); return `${d.getFullYear() === today0().getFullYear() ? "" : `${d.getFullYear()}년 `}${d.getMonth() + 1}월 ${d.getDate()}일`; };
  const isNew = (s) => { if (!s) return false; const d = daysFrom(s); return d <= 0 && d > -7; }; // 올린 뒤 7일
  const ddayLabel = (n) => (n === 0 ? "오늘" : n === 1 ? "내일" : `D-${n}`);

  /* ---------- 글: 공지 하나 + 그 공지를 두고 묻고 답한 것 ---------- */
  // 목록에는 공지만 나온다. 질문과 답은 따로 흩어 두지 않고 '들어갈 공지'(질문의 related 첫 번째) 안에 묶는다.
  const SCOPE = { all: "제목+내용", title: "제목", body: "내용" };
  const N = Matcher.norm; // 한글·영문·숫자만 남긴 글 (띄어쓰기·기호와 상관없이 찾으려고)
  // 본문에서 "# ", "- ", "|" 같은 표시를 걷어 낸 한 줄 글 (미리 보기·검색 결과용)
  const plainOf = (text) => text.split("\n")
    .map((l) => l.replace(/^\s*[#-]\s+/, "").replace(/\s*\|\s*/g, " ").trim())
    .filter(Boolean).join(" ");
  const homeOf = (f) => (f.related || [])[0];
  // 고정에 끝(pinUntil: "2026-11-26 14:00" · "2026-11-20")이 있으면 그때가 지나면 저절로 풀린다. 운영진 입력판의 고정도 같은 칸을 쓴다
  const pinOk = (until) => {
    if (!until || typeof OpsSheet === "undefined") return true;
    const t = OpsSheet.toStamp(until, { end: true });
    return isNaN(t) || Date.now() <= t;
  };
  const POSTS = NOTICES.map((n) => {
    const qas = FAQS.filter((f) => homeOf(f) === n.id).map((f) => {
      const nQ = N(f.q), nA = N(f.a);
      return { f, id: f.id, key: `f${f.id}`, date: f.added || "", upd: f.updated || "", plain: plainOf(f.a), nQ, nA, nAll: [nQ, nA, ...(f.keywords || []).map(N)].join("|") };
    });
    const own = n.date || n.added || "";
    // 최근 업데이트 = 공지를 올린 날, 질문이 붙은 날, 질문의 답을 고친 날(updated) 가운데 가장 늦은 날
    const date = [own, ...qas.map((x) => x.date), ...qas.map((x) => x.upd)].sort().pop() || "";
    const nTitle = N(n.title), nBody = N(n.body);
    return {
      src: n, id: n.id, key: `n${n.id}`, cat: n.cat, href: `#notice/${n.id}`, title: n.title, body: n.body, plain: plainOf(n.body),
      own, date, qas, fresh: date > own ? qas.filter((x) => x.date === date) : [],
      renewed: date > own ? qas.filter((x) => x.upd === date && x.date !== date) : [], // 그날 답이 바뀐 질문
      pin: !!n.pinned && pinOk(n.pinUntil), nTitle, nBody,
    };
  });
  const postOf = (id) => POSTS.find((p) => p.id === id);
  const postOfFaq = (fid) => POSTS.find((p) => p.qas.some((x) => x.id === fid));
  // 들어갈 공지가 없는 질문은 화면 어디에도 나오지 않으므로 알려 준다 (data.js 의 related 를 확인)
  const homeless = FAQS.filter((f) => !postOf(homeOf(f)));
  if (homeless.length) console.warn("들어갈 공지가 없는 질문:", homeless.map((f) => f.id).join(", "));

  // 행사 공지(data.js 에서 event 가 붙은 공지)는 공지사항 목록에서 빼고 '이벤트' 화면의 '행사'에 모은다.
  // 새소식 카드와 검색에는 그대로 나온다
  const KINDS = typeof EVENT_KINDS === "undefined" ? [] : EVENT_KINDS;
  const isEventPost = (p) => !!p.src.event;
  const kindName = (id) => (KINDS.find((k) => k.id === id) || {}).name || "행사";
  // 글 앞에 붙는 꼬리표: 행사 공지는 행사 종류(간식데이 …), 나머지는 분류
  const tagName = (p) => (isEventPost(p) ? kindName(p.src.event.kind) : catName(p.cat));
  const BOARD = POSTS.filter((p) => !isEventPost(p));
  const EVENT_POSTS = POSTS.filter(isEventPost);

  // 같은 날이면 그날 올린 새 공지가 먼저, 그다음 새 질문이 많이 붙은 공지, 답이 바뀐 질문이 많은 공지 (그래도 같으면 data.js 에 적힌 순서)
  const sameDay = (a, b) => ((b.own === b.date) - (a.own === a.date)) || (b.fresh.length - a.fresh.length) || (b.renewed.length - a.renewed.length);
  const byDate = (a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0) || sameDay(a, b);
  // 목록 순서: 중요 공지가 맨 위, 그다음 최근에 업데이트된 순 (같은 날은 위 sameDay 순서)
  const ORDERED = [...BOARD].sort((a, b) => (b.pin - a.pin) || byDate(a, b));
  // 새소식 카드에 올릴 공지: 최근에 업데이트된 순. 같은 날 여러 건이면 분류를 돌아가며 하나씩 고른다
  function latestPosts(n) {
    const sorted = [...POSTS].filter((p) => p.date).sort(byDate), out = [];
    for (const day of [...new Set(sorted.map((p) => p.date))]) {
      const group = sorted.filter((p) => p.date === day), cats = [...new Set(group.map((p) => p.cat))];
      for (let round = 0; out.length < n && round < group.length; round++) {
        for (const c of cats) { const p = group.filter((x) => x.cat === c)[round]; if (p && out.length < n) out.push(p); }
      }
      if (out.length >= n) break;
    }
    return out;
  }

  // 분류 탭: 전체 + 공지가 하나라도 있는 분류
  const TABS = CATEGORIES.filter((c) => c.id === "all" || BOARD.some((p) => p.cat === c.id));
  const inCat = (p, cat) => cat === "all" || p.cat === cat;

  /* ---------- 이벤트: 행사 공지 · 운영표 · 시험과 마감을 한 달력으로 ---------- */
  const byDay = (a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0); // 날짜가 이른 순
  // 행사 공지 한 줄에 쓸 값 — 공지 하나 화면의 '다른 행사'와 이전 · 다음 글에 쓴다
  const FESTS = EVENT_POSTS.map((p) => {
    const e = p.src.event;
    return { date: e.date, title: e.name || p.title, href: p.href, kind: e.kind, key: p.key, d: daysFrom(e.date) };
  }).sort(byDay);
  // 달력의 종류: 행사 종류(EVENT_KINDS) 뒤에 시험 · 마감 · 운영(SCHEDULE_KINDS)
  const CAL_KINDS = [...KINDS, ...(typeof SCHEDULE_KINDS === "undefined" ? [] : SCHEDULE_KINDS)];
  const calKindName = (id) => (CAL_KINDS.find((k) => k.id === id) || {}).name || "일정";
  // 달력 칸과 꼬리표의 색: 행사는 보라, 시험은 초록, 마감은 주황, 운영은 회색 (공지 분류 색을 그대로 쓴다)
  const calKindClass = (id) => ({ exam: "c-task", deadline: "c-facility", ops: "c-etc" }[id] || "c-event");
  // 달력에 찍는 일정: 행사 공지 · 운영표(OPS_SCHEDULE) · 시험과 마감(SCHEDULE)을 합친 것. 같은 날 같은 일은 하나로 — 합치는 법은 js/calendar.js
  const CALENDAR = Calendar.build({
    notices: NOTICES, faqs: FAQS, schedule: SCHEDULE,
    ops: typeof OPS_SCHEDULE === "undefined" ? [] : OPS_SCHEDULE, opsSource: typeof OPS_SOURCE === "undefined" ? null : OPS_SOURCE,
  }).map((x) => ({ ...x, d: daysFrom(x.date) }));
  // 가장 가까운 것부터 (오늘 포함) — 메뉴의 '이벤트' 옆 D-day 에 쓴다
  const upcomingEvents = () => CALENDAR.filter((e) => e.d >= 0);

  /* ---------- 검색 ---------- */
  const queryWords = (q) => q.trim().split(/\s+/).map(N).filter(Boolean);
  // 낱말 사이에 띄어쓰기·기호가 끼어 있어도 같은 말로 찾는다 ("입실퇴실" → "입실·퇴실")
  const SEP = "[^0-9a-z가-힣]*";
  const markRe = (words) => (words.length
    ? new RegExp(`(${words.map((w) => [...w].map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(SEP)).join("|")})`, "gi")
    : null);
  // 찾은 낱말에 <mark> — 글을 조각낸 뒤 조각마다 이스케이프한다
  const hl = (text, re) => (re ? text.split(re).map((part, i) => (i % 2 ? `<mark>${esc(part)}</mark>` : esc(part))).join("") : esc(text));
  // 공지 하나가 검색어에 맞는지: 공지 제목(4) · 그 공지에 든 질문의 제목(3) · 공지 본문(2) · 질문의 답(1) 순으로 친다.
  // '제목'은 공지 제목과 질문, '내용'은 공지 본문과 답을 뜻한다. qs 는 맞은 질문들
  function matchPost(p, words, scope) {
    const has = (t) => words.every((w) => t.includes(w));
    const inTitle = scope !== "body" && has(p.nTitle);
    const inBody = scope === "title" ? false : scope === "body" ? has(p.nBody) : has(`${p.nTitle}|${p.nBody}`);
    const qs = p.qas.filter((x) => has(scope === "title" ? x.nQ : scope === "body" ? x.nA : x.nAll));
    const rank = inTitle ? 4 : qs.some((x) => has(x.nQ)) ? 3 : inBody ? 2 : qs.length ? 1 : 0;
    return rank ? { p, rank, inBody, qs } : null;
  }
  // 긴 글을 낱말 경계에서 끊는다
  const clip = (text, max) => {
    if (text.length <= max) return text;
    const cut = text.slice(0, max), sp = cut.lastIndexOf(" ");
    return `${(sp > max * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,·/]+$/, "")}…`;
  };
  // 검색 결과의 내용 미리 보기: 찾은 낱말 둘레, 없으면 내용 첫머리
  function snippet(text, re) {
    let start = 0;
    if (re) {
      const at = text.search(re);
      if (at > 36) { const sp = text.lastIndexOf(" ", at - 20); start = sp < 0 ? 0 : sp + 1; }
    }
    return (start ? "…" : "") + hl(clip(text.slice(start), 110), re);
  }

  /* ---------- 본 글 표시 ---------- */
  // 한 번 본 글(공지 본문을 열었거나 질문의 답을 본 글)은 이 브라우저에 적어 둔다.
  // 제목이 안 본 글은 검은색 · 굵게, 본 글은 보라색 · 밑줄로 보인다 (방문한 링크 색과 같은 약속)
  const READ_KEY = "qna-read";
  const readSet = (() => { try { return new Set(JSON.parse(localStorage.getItem(READ_KEY) || "[]")); } catch (e) { return new Set(); } })();
  // 제목 글자에 붙이는 표시. 화면 읽기 프로그램에는 색 대신 '이미 본 글'이라고 알린다 (.read-note)
  const rd = (key) => ` data-post="${key}"${readSet.has(key) ? ' class="ttl read"' : ' class="ttl"'}`;
  const READ_NOTE = '<span class="read-note sr-only"></span>';
  function markRead(key) {
    if (readSet.has(key)) return;
    readSet.add(key);
    try { localStorage.setItem(READ_KEY, JSON.stringify([...readSet])); } catch (e) { /* 저장 안 되면 이번 방문에만 표시 */ }
    document.querySelectorAll(`[data-post="${key}"]`).forEach((el) => el.classList.add("read"));
  }

  /* ---------- 상태 ---------- */
  // cat: 분류 탭, q: 검색어, scope: 검색 범위, page: 몇 쪽인지, seen: 마지막으로 연 공지(목록으로 돌아올 때 그 줄을 찾는다)
  const state = { cat: "all", q: "", scope: "all", page: 1, seen: null };
  const PAGE = 20; // 한 쪽에 20줄
  const main = $("#main");
  const resetFilters = () => Object.assign(state, { cat: "all", q: "", scope: "all", page: 1, seen: null });

  // 지금 조건(검색어 → 분류)에 맞는 공지. 탭의 숫자는 검색어를 그대로 둔 채 그 탭을 골랐을 때의 건수다
  function compute() {
    const words = queryWords(state.q);
    const base = words.length
      ? [...ORDERED, ...EVENT_POSTS].map((p) => matchPost(p, words, state.scope)).filter(Boolean).sort((a, b) => b.rank - a.rank)
      : ORDERED.map((p) => ({ p, rank: 0, inBody: false, qs: [] }));
    return { words, base, list: base.filter((m) => inCat(m.p, state.cat)), catCount: (id) => base.filter((m) => inCat(m.p, id)).length };
  }

  /* ---------- 공통 조각 ---------- */
  const SITE = "코디세이 Q&A 허브";
  const setTitle = (t) => { document.title = t ? `${t.replace(/⁠/g, "")} | ${SITE}` : SITE; };
  // 머리의 메뉴(공지사항 · 이벤트)에서 지금 있는 곳을 표시
  const setTab = (tab) => document.querySelectorAll(".tab").forEach((t) => {
    if (t.dataset.tab === tab) t.setAttribute("aria-current", "page"); else t.removeAttribute("aria-current");
  });

  // 공지 출처 표시
  const SOURCES = {
    OT: "입학연수과정 오리엔테이션 자료 (10월 28일)",
    GB: "AI 네이티브 과정 교육시설 이용 가이드북",
    "OT+GB": "오리엔테이션 자료 + AI 네이티브 과정 가이드북",
    EXAM: "시험 기능 학습자 가이드",
    EVENTS: "디스코드 allinone-취창업-및-행사 채널",
  };
  const sourceName = (k) => SOURCES[k] || "디스코드 allinone-공지사항 채널";

  const TAG_NEW = '<span class="tag tag-new">NEW</span>';
  const TAG_UPD = '<span class="tag tag-new">업데이트</span>'; // 답을 고친 뒤 7일 (data.js 의 updated)
  const TAG_PIN = '<span class="tag tag-pin">중요</span>';
  // 운영진 입력판의 '답 확인' 탭: 맞음 → 운영진 확인, 고침 + 고친 답 → 운영진 수정(답이 바뀜), 고침인데 고친 답이 비면 → 고치는 중
  const opsTag = (f) => (!f.ops ? "" : f.ops.state === "ok" ? '<span class="tag tag-ops">운영진 확인</span>'
    : f.ops.state === "fixed" ? '<span class="tag tag-ops">운영진 수정</span>' : '<span class="tag tag-fixing">고치는 중</span>');
  const opsLine = (f) => (!f.ops ? "" : `<p class="faq-ops ${f.ops.state}">${f.ops.state === "ok" ? "운영진이 이 답을 확인했습니다"
    : f.ops.state === "fixed" ? "운영진이 고친 답입니다" : "운영진이 이 답을 고치고 있습니다. 바뀌기 전까지는 디스코드 공지를 먼저 확인해 주세요"}${f.ops.date ? ` · ${fmtDate(f.ops.date)}` : ""}</p>`);

  /* ---------- 링크 복사 ---------- */
  const COPY_LABEL = "링크 복사";
  const copyBtn = (hash) => `<button class="copy-link" type="button" data-copy="${hash}" aria-label="이 글 링크 복사">${ICON.link}<span>${COPY_LABEL}</span></button>`;
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

  /* ---------- 질문과 답 (공지 본문 아래에 접혀 있는 줄) ---------- */
  const relatedNotices = (f) => (f.related || []).map((nid) => NOTICES.find((n) => n.id === nid)).filter(Boolean);
  const qaItem = (f) => `<li class="qa-item" id="q-${f.id}"><h3 class="post-h"><button class="qa-row q-row" type="button" id="qb-${f.id}" aria-expanded="false" aria-controls="qa-${f.id}" data-id="${f.id}">
      <span class="faq-mark" aria-hidden="true">Q</span>
      <span class="qa-q"><span${rd(`f${f.id}`)}>${esc(f.q)}${READ_NOTE}</span>${isNew(f.added) ? TAG_NEW : isNew(f.updated) ? TAG_UPD : ""}${opsTag(f)}</span>
      <span class="chev">${ICON.chevD}</span>
    </button></h3><div class="q-panel" id="qa-${f.id}" role="region" aria-labelledby="qb-${f.id}" hidden></div></li>`;
  // 펼친 답: 답, 출처, (이 공지 말고) 함께 볼 공지, 링크 복사
  function faqAnswer(f) {
    const others = relatedNotices(f).filter((n) => n.id !== homeOf(f));
    return `<div class="faq-a-box">${paras(f.a)}</div>${opsLine(f)}${f.src ? `<p class="faq-src">출처: ${esc(f.src)}</p>` : ""}
      ${others.length ? `<div class="attach info"><h4>함께 볼 공지</h4><ul>${others.map((n) => `<li><a href="#notice/${n.id}">${ICON.doc}<span${rd(`n${n.id}`)}>${esc(n.title)}${READ_NOTE}</span></a></li>`).join("")}</ul></div>` : ""}
      <div class="q-panel-foot">${copyBtn(`#faq/${f.id}`)}</div>`;
  }
  // 질문 펼치기/접기 (여러 개를 같이 펼쳐 둘 수 있다)
  function toggleQa(btn, open = btn.getAttribute("aria-expanded") !== "true", { track = true } = {}) {
    const f = FAQS.find((x) => x.id === +btn.dataset.id);
    if (!f) return;
    const panel = $(`#qa-${f.id}`);
    if (open && !panel.innerHTML.trim()) panel.innerHTML = faqAnswer(f);
    btn.setAttribute("aria-expanded", String(open));
    btn.closest(".qa-item").classList.toggle("open", open);
    panel.hidden = !open;
    if (!open) return;
    markRead(`f${f.id}`);
    if (track) Analytics.page(`#faq/${f.id}`, `Q. ${f.q}`.replace(/⁠/g, ""));
  }

  /* ---------- 화면: 공지사항 (새소식 카드 · 분류 탭 · 검색 · 공지 목록) ---------- */
  // 새소식 카드 한 줄: "새 질문 2개가 붙었습니다" / "답이 바뀐 질문 1개가 있습니다" / "새 질문 2개 · 답이 바뀐 질문 1개"
  const freshLine = (p) => (p.fresh.length && p.renewed.length
    ? `새 질문 ${p.fresh.length}개 · 답이 바뀐 질문 ${p.renewed.length}개`
    : p.fresh.length ? `새 질문 ${p.fresh.length}개가 붙었습니다` : `답이 바뀐 질문 ${p.renewed.length}개가 있습니다`);
  // 새소식 카드: 분류 색 바탕 위에 [분류 | 업데이트한 날] → 공지 제목 → 새로 붙은 질문 · 답이 바뀐 질문(없으면 본문 첫머리)
  const newsCard = (p) => `<li><a class="news-card c-${p.cat}" href="${p.href}" data-news="${p.key}">
      <span class="news-meta"><b>${esc(tagName(p))}</b>${p.date ? `<time datetime="${p.date}">${fmtDate(p.date)}</time>` : ""}${isNew(p.date) ? TAG_NEW : ""}</span>
      <h2 class="news-title"><span${rd(p.key)}>${esc(p.title)}${READ_NOTE}</span></h2>
      ${p.fresh.length || p.renewed.length
        ? `<span class="news-fresh">${freshLine(p)}</span><span class="news-qs">${[...p.fresh, ...p.renewed].slice(0, 2).map((x) => `<span><span class="faq-mark" aria-hidden="true">Q</span> ${esc(x.f.q)}</span>`).join("")}</span>`
        : `<span class="news-excerpt">${esc(clip(p.plain, 68))}</span>`}
    </a></li>`;

  function renderBoard() {
    setTitle(""); setTab("board");
    const news = latestPosts(3);

    main.innerHTML = `
      <section class="news" aria-labelledby="h-news">
        <h1 class="page-title" id="h-news">새소식</h1>
        <ul class="news-grid">${news.map(newsCard).join("")}</ul>
      </section>

      <section class="board" id="board" aria-labelledby="h-board">
        <div class="board-head">
          <div>
            <h2 class="sec-title" id="h-board">공지사항</h2>
            <p class="sec-desc">묻고 답한 것도 그 공지 안에 함께 정리했습니다. 공지 ${BOARD.length}건 · 질문 ${FAQS.length}개${EVENT_POSTS.length ? ` · 행사 공지 ${EVENT_POSTS.length}건은 <a href="#event">이벤트</a>에 있습니다` : ""}</p>
          </div>
          <form class="finder" id="finder" role="search" autocomplete="off">
            <span class="finder-scope">
              <label class="sr-only" for="scope">검색 범위</label>
              <select id="scope">${Object.entries(SCOPE).map(([v, t]) => `<option value="${v}"${v === state.scope ? " selected" : ""}>${t}</option>`).join("")}</select>
              ${ICON.caret}
            </span>
            <label class="sr-only" for="q">검색어</label>
            <input id="q" type="search" enterkeyhint="search" placeholder="검색어를 입력하세요" value="${esc(state.q)}">
            <button class="search-clear" type="button" id="qClear" aria-label="검색어 지우기" ${state.q ? "" : "hidden"}>${ICON.close}</button>
            <button class="finder-go" type="submit" aria-label="검색">${ICON.search}</button>
          </form>
        </div>
        <div class="cat-bar"><div class="cat-tabs" id="catTabs" role="group" aria-label="분류">${TABS.map((c) =>
          `<button class="chip cat-tab" type="button" data-cat="${c.id}" aria-pressed="false">${c.name}<span class="n"></span></button>`).join("")}</div></div>
        <div class="list-head">
          <p class="list-count" id="listCount" tabindex="-1" aria-live="polite"></p>
        </div>
        <div id="answerSlot"></div>
        <div id="postArea"></div>
      </section>`;

    const input = $("#q"), clear = $("#qClear"), tabs = $("#catTabs"), area = $("#postArea");
    let searchTimer;
    const onQuery = () => {
      state.q = input.value; state.page = 1;
      clear.hidden = !input.value;
      drawList();
      clearTimeout(searchTimer);
      const q = input.value.trim();
      if (q) searchTimer = setTimeout(() => {
        const { base } = compute();
        Analytics.event("search", { q: q.slice(0, 30), scope: state.scope, notices: base.length, faqs: base.reduce((s, m) => s + m.qs.length, 0) });
      }, 1200);
    };
    input.addEventListener("input", onQuery);
    clear.addEventListener("click", () => { input.value = ""; onQuery(); input.focus(); });
    $("#scope").addEventListener("change", (e) => {
      state.scope = e.target.value; state.page = 1;
      Analytics.event("search-scope", { scope: state.scope });
      drawList();
    });
    // 검색 단추·엔터: 결과는 이미 그려져 있으니 목록이 보이게만 올린다 (휴대폰은 키보드도 내린다)
    $("#finder").addEventListener("submit", (e) => {
      e.preventDefault();
      if (matchMedia("(pointer: coarse)").matches) input.blur();
      alignList(true);
    });

    tabs.addEventListener("click", (e) => {
      const b = e.target.closest(".cat-tab"); if (!b) return;
      state.cat = b.dataset.cat; state.page = 1;
      drawList(); centerNav(tabs); alignList();
      Analytics.event("category", { cat: state.cat, from: "board" });
    });
    area.addEventListener("click", (e) => {
      const pg = e.target.closest(".pg-btn[data-page]");
      if (pg && !pg.disabled) {
        state.page = +pg.dataset.page;
        drawList(); alignList(true);
        $("#listCount").focus({ preventScroll: true }); // 화면 읽기 프로그램은 목록 처음부터 다시 읽는다
        Analytics.event("list-page", { page: state.page });
        return;
      }
      const all = e.target.closest("[data-all]");
      if (all) { state.cat = "all"; state.page = 1; drawList(); centerNav(tabs); }
    });
    main.querySelector(".news-grid").addEventListener("click", (e) => {
      const a = e.target.closest("[data-news]");
      if (a) Analytics.event("news-card", { to: a.getAttribute("href").replace(/^#/, "/") });
    });
    // 공지를 보고 '목록으로' 돌아오면 그 공지가 있는 쪽을 연다
    if (state.seen) {
      const i = compute().list.findIndex((m) => m.p.key === state.seen);
      if (i >= 0) state.page = Math.floor(i / PAGE) + 1;
    }
    drawList();
    centerNav(tabs);
  }

  // 검색 결과 맨 위: 챗봇과 같은 방식으로 찾은 가장 가까운 답을 바로 펼쳐 보여 준다
  const answerCard = (f) => `<section class="answer-card" aria-labelledby="h-ans">
      <p class="answer-kicker">${ICON.check}가장 가까운 답</p>
      <h3 class="answer-q" id="h-ans"><span class="faq-mark" aria-hidden="true">Q</span> ${esc(f.q)}</h3>
      <div class="faq-a-box">${paras(f.a)}</div>${opsLine(f)}
      <div class="answer-actions">
        <a class="btn btn-tertiary btn-s" href="#faq/${f.id}">이 답이 있는 공지 보기</a>
        <button class="btn btn-tertiary btn-s" type="button" data-open-chat>챗봇에게 더 묻기</button>
      </div>
    </section>`;

  // 목록 한 줄: [분류] 공지 제목 … 질문 수 · 업데이트한 날.
  // 검색할 때는 제목 아래에 내용 미리 보기와, 그 공지 안에서 검색어에 맞은 질문(3개까지)을 같이 보여 준다
  function postRow(m, re, searching) {
    const p = m.p, reT = state.scope === "body" ? null : re, reB = state.scope === "title" ? null : re;
    const cells = `<span class="post-cat"><span class="tag c-${p.cat}">${esc(tagName(p))}</span></span>
      <span class="post-main">
        <span class="post-title">${p.pin ? TAG_PIN : ""}<span${rd(p.key)}>${hl(p.title, reT)}${READ_NOTE}</span>${p.src.files.length ? ICON.clip : ""}${isNew(p.date) ? TAG_NEW : ""}</span>
        ${searching && (m.inBody || !m.qs.length) ? `<span class="post-snip">${snippet(p.plain, m.inBody ? reB : null)}</span>` : ""}
      </span>
      <span class="post-qn"><span class="sr-only">질문 </span>${p.qas.length}개</span>
      ${p.date ? `<time class="post-date" datetime="${p.date}">${fmtShort(p.date)}</time>` : '<span class="post-date"></span>'}
      <span class="chev">${ICON.chevR}</span>`;
    const more = m.qs.length - 3;
    const qs = searching && m.qs.length ? `<ul class="post-qs">${m.qs.slice(0, 3).map((x) => `<li><a href="#faq/${x.id}">
        <span class="faq-mark" aria-hidden="true">Q</span>
        <span class="pq-main"><span${rd(x.key)}>${hl(x.f.q, reT)}${READ_NOTE}</span><span class="post-snip">${snippet(x.plain, reB)}</span></span>
      </a></li>`).join("")}${more > 0 ? `<li class="pq-more"><a href="${p.href}">이 공지에서 맞는 질문 ${more}개 더 보기</a></li>` : ""}</ul>` : "";
    return `<li class="post" id="row-${p.key}"><h3 class="post-h"><a class="post-row" href="${p.href}">${cells}</a></h3>${qs}</li>`;
  }

  // 쪽 번호: ‹ 이전  1 2 3  다음 › (번호는 지금 쪽 둘레로 5개까지) + 지금 보이는 범위
  function pager(p, pages, total) {
    const from = Math.max(1, Math.min(p - 2, pages - 4)), to = Math.min(pages, from + 4);
    const nums = [];
    for (let i = from; i <= to; i++) nums.push(`<button class="pg-btn${i === p ? " on" : ""}" type="button" data-page="${i}" aria-label="${i}쪽"${i === p ? ' aria-current="page"' : ""}>${i}</button>`);
    return `<nav class="pagination" aria-label="목록 쪽 번호">
      <button class="pg-btn pg-step" type="button" data-page="${p - 1}"${p === 1 ? " disabled" : ""}>${ICON.chevL}<span class="pg-lbl">이전</span></button>
      ${nums.join("")}
      <button class="pg-btn pg-step" type="button" data-page="${p + 1}"${p === pages ? " disabled" : ""}><span class="pg-lbl">다음</span>${ICON.chevR}</button>
    </nav>
    <p class="pg-range">${total}건 가운데 ${(p - 1) * PAGE + 1}~${Math.min(p * PAGE, total)}번째</p>`;
  }

  // 탭의 숫자 · 결과 줄 · 가장 가까운 답 · 목록 · 쪽 번호를 지금 조건으로 다시 그린다
  function drawList() {
    const area = $("#postArea"); if (!area) return;
    const c = compute(), n = c.list.length;
    const q = c.words.length ? state.q.trim() : ""; // 기호만 넣었으면 검색으로 치지 않는다
    const pages = Math.max(1, Math.ceil(n / PAGE)), p = state.page = Math.min(Math.max(1, state.page), pages);
    main.querySelectorAll(".cat-tab").forEach((b) => {
      const k = c.catCount(b.dataset.cat);
      b.setAttribute("aria-pressed", String(b.dataset.cat === state.cat));
      b.querySelector(".n").textContent = k;
      b.classList.toggle("zero", !k);
    });

    const catLabel = state.cat === "all" ? "전체 공지" : `${catName(state.cat)} 공지`;
    const qHits = c.list.reduce((s, m) => s + m.qs.length, 0);
    $("#listCount").innerHTML = q
      ? `<span class="what">'${esc(q)}' 검색 결과</span><span class="n">공지 ${n}건</span><span class="where">${[SCOPE[state.scope], state.cat !== "all" ? catName(state.cat) : ""].filter(Boolean).join(" · ")}에서 찾음${qHits ? ` · 맞는 질문 ${qHits}개` : ""}</span>`
      : `<span class="what">${catLabel}</span><span class="n">${n}건</span>`;

    // 가장 가까운 답: '제목+내용'으로 찾을 때 첫 쪽에만, 고른 분류와 상관없이
    const m = q && state.scope === "all" ? Matcher.rank(q, FAQS) : null;
    const best = m && m.best && p === 1 ? m.best : null;
    const slot = $("#answerSlot");
    slot.innerHTML = best ? answerCard(best) : "";
    bindChat(slot, "answer-card", q);

    if (!n) {
      // 글자 그대로 들어 있는 공지가 없을 때: 다른 분류의 결과와, 뜻이 가까운 질문을 알려 준다
      const elsewhere = state.cat !== "all" ? c.base.length : 0;
      const guess = m ? [...new Set([...(m.best ? [m.best] : []), ...m.others, ...m.hints])].filter((f) => f !== best).slice(0, 3) : [];
      area.innerHTML = `<div class="empty"><span class="ico">${ICON.search}</span>
        <b>${q ? `'${esc(q)}'라는 말이 들어 있는 공지가 없습니다` : "이 분류에는 공지가 없습니다"}</b>
        <p>${elsewhere ? `다른 분류에는 ${elsewhere}건이 있습니다.` : "다른 말로 찾아보거나, 챗봇에게 물어보세요."}</p>
        <div class="empty-actions">
          ${elsewhere ? `<button class="btn btn-secondary btn-s" type="button" data-all>전체에서 ${elsewhere}건 보기</button>` : ""}
          <button class="btn btn-tertiary btn-s" type="button" data-open-chat>챗봇에게 물어보기</button>
        </div>
        ${guess.length ? `<div class="guess"><h3>혹시 이 질문인가요?</h3><ul class="link-list">${guess.map((f) => `<li><a href="#faq/${f.id}">${ICON.chevR}<span${rd("f" + f.id)}>${esc(f.q)}${READ_NOTE}</span></a></li>`).join("")}</ul></div>` : ""}
      </div>`;
      bindChat(area, "list-empty", q);
      return;
    }
    const re = markRe(c.words);
    area.innerHTML = `<div class="post-cols"><span aria-hidden="true">분류</span><span><span class="col-name" aria-hidden="true">제목</span><span class="read-key"><b class="k-new">검은 제목</b> 아직 안 본 글<i aria-hidden="true"></i><b class="k-read">보라 제목 · 밑줄</b> 이미 본 글</span></span><span aria-hidden="true">질문</span><span aria-hidden="true">업데이트</span><span></span></div>
      <ul class="post-list" id="postList">${c.list.slice((p - 1) * PAGE, p * PAGE).map((x) => postRow(x, re, !!q)).join("")}</ul>
      ${pages > 1 ? pager(p, pages, n) : ""}`;
  }

  // '챗봇에게 묻기' 단추 연결
  function bindChat(box, from, q) {
    const b = box.querySelector("[data-open-chat]");
    if (b) b.addEventListener("click", () => { Analytics.event("chat-open", { from }); openChat(q); });
  }

  /* 분류 줄 */
  // 휴대폰 가로 분류 줄: 고른 분류를 가운데로 옮긴다
  function centerNav(nav) {
    const b = nav.querySelector('[aria-pressed="true"]');
    if (b && nav.scrollWidth > nav.clientWidth) nav.scrollLeft = b.offsetLeft - (nav.clientWidth - b.offsetWidth) / 2;
  }
  // 위에 붙어 따라오는 분류 줄의 높이 (목록으로 스크롤할 때 여백)
  const stickH = () => { const bar = main.querySelector(".cat-bar"); return bar ? bar.offsetHeight : 0; };
  const syncStick = () => document.documentElement.style.setProperty("--stick-h", `${stickH()}px`);
  // 목록 머리(결과 줄)가 분류 줄 바로 아래 오게 올린다. force 가 아니면 이미 지나쳐 내려와 있을 때만
  function alignList(force = false) {
    const head = main.querySelector(".list-head"); if (!head) return;
    const off = head.getBoundingClientRect().top - stickH() - 8;
    if (force || off < 0) window.scrollBy(0, off);
  }
  window.addEventListener("resize", syncStick);
  document.fonts && document.fonts.ready.then(syncStick);

  /* ---------- 화면: 공지 하나 (본문 + 묻고 답한 것) ---------- */
  const backLink = (label, href = "#home") => `<a class="back-link" href="${href}">${ICON.chevL}${esc(label)}</a>`;
  const evFaqList = () => (typeof EVENT_FAQS === "undefined" ? [] : EVENT_FAQS).map((id) => FAQS.find((f) => f.id === id)).filter(Boolean);
  const evFaqBox = () => { const qs = evFaqList(); return qs.length ? railBox("행사 참여 · 신청에 대해 묻고 답한 것", qs.map((f) => ({ href: `#faq/${f.id}`, key: `f${f.id}`, text: f.q, icon: ICON.chevR }))) : ""; };
  // 행사 공지 머리의 한눈 보기: 종류 · 일시 · 장소 · 운영진 추가 시간
  const evInfo = (e) => `<dl class="ev-info">
      <div><dt>행사</dt><dd>${esc(kindName(e.kind))}</dd></div>
      <div><dt>일시</dt><dd>${fmtDate(e.date)}${e.time ? ` ${esc(glueTight(e.time))}` : ""}</dd></div>
      ${e.place ? `<div><dt>장소</dt><dd>${esc(e.place)}</dd></div>` : ""}
      <div><dt>운영진 추가 시간</dt><dd>${e.extra ? esc(e.extra) : "공지에 적히지 않음"}</dd></div>
    </dl>`;
  const railBox = (title, links, more = "") => `<section class="rail-box"><h2>${esc(title)}</h2>
    <ul class="link-list">${links.map((l) => `<li><a href="${l.href}">${l.icon}<span${rd(l.key)}>${esc(l.text)}${READ_NOTE}</span></a></li>`).join("")}</ul>${more}</section>`;

  // openFaq: 주소가 #faq/24 일 때 그 질문을 펼치고 그 자리로 내린다
  function renderDetail(id, openFaq = null) {
    const p = postOf(id);
    if (!p) return false;
    const s = p.src, opened = openFaq && p.qas.find((x) => x.id === openFaq);
    const fest = isEventPost(p); // 행사 공지는 '이벤트' 화면에 속한다
    if (!fest) state.seen = p.key; // '목록으로' 돌아가면 이 공지가 있는 쪽 · 줄을 연다
    markRead(p.key);
    setTab(fest ? "event" : "board");
    const backHref = fest ? "#event" : "#home", backLabel = fest ? "이벤트로" : "목록으로";
    // 이전/다음은 지금 고른 분류·검색 기준, 거기에 없으면 전체 기준 (행사 공지는 행사끼리, 행사 날 순)
    let list = fest ? FESTS.map((x) => postOf(+x.href.split("/")[1])) : compute().list.map((m) => m.p);
    if (!list.includes(p)) list = ORDERED;
    const i = list.indexOf(p), prev = list[i - 1], next = list[i + 1];
    setTitle(opened ? `Q. ${opened.f.q}` : p.title);

    // 옆 칸: 다른 공지에 정리된 관련 질문 · 같은 분류의 다른 공지
    const boxes = [];
    const linked = FAQS.filter((f) => (f.related || []).includes(s.id) && homeOf(f) !== s.id);
    if (linked.length) boxes.push(railBox("다른 공지에 정리된 관련 질문", linked.map((f) => ({ href: `#faq/${f.id}`, key: `f${f.id}`, text: f.q, icon: ICON.chevR }))));
    if (fest) {
      const others = FESTS.filter((x) => x.key !== p.key).reverse().slice(0, 5);
      if (others.length) boxes.push(railBox("다른 행사", others.map((x) => ({ href: x.href, key: x.key, text: `${kindName(x.kind)} · ${x.title}`, icon: ICON.doc })),
        `<a class="text-link" href="#event">행사 모두 보기</a>`));
      const fq = evFaqBox(); if (fq) boxes.push(fq);
    }
    const same = fest ? [] : ORDERED.filter((x) => x.cat === p.cat && x !== p).slice(0, 5);
    if (same.length) boxes.push(railBox(`'${catName(p.cat)}' 분류의 다른 공지`, same.map((x) => ({ href: x.href, key: x.key, text: x.title, icon: ICON.doc })),
      `<button class="text-link" type="button" data-go-cat="${p.cat}">'${catName(p.cat)}' 분류 모두 보기</button>`));

    const qaJump = p.qas.length ? `<li><button type="button" data-sec="qa"><span class="toc-n">Q</span>묻고 답한 것 ${p.qas.length}개</button></li>` : "";
    const tocHtml = toc(s.body, qaJump);
    const pagerLink = (x, label) => `<li>${x
      ? `<a href="${x.href}"><span>${label}</span><span${rd(x.key)}>${esc(x.title)}${READ_NOTE}</span></a>`
      : `<a aria-disabled="true"><span>${label}</span><span>${label}이 없습니다</span></a>`}</li>`;
    const dates = [p.own ? `${s.date ? "게시" : "등록"} ${fmtDate(p.own)}` : "", p.date > p.own ? `${p.fresh.length ? "질문 추가" : "답 보강"} ${fmtDate(p.date)}` : "", `출처: ${esc(sourceName(s.source))}`].filter(Boolean).join(" · ");
    main.innerHTML = `${backLink(backLabel, backHref)}
      <div class="detail-wrap">
        <article class="detail">
          <div class="detail-head">
            <div class="head-row"><div class="tag-row">${isNew(p.date) ? TAG_NEW : ""}${p.pin ? TAG_PIN : ""}<span class="tag c-${p.cat}">${esc(tagName(p))}</span></div>${copyBtn(p.href)}</div>
            <h1>${esc(p.title)}</h1>
            <p class="source">${dates}</p>
            ${p.qas.length && !tocHtml ? `<p class="qa-jump"><button class="text-link" type="button" data-sec="qa">이 공지에 대해 묻고 답한 것 ${p.qas.length}개 보기</button></p>` : ""}
          </div>
          ${fest ? evInfo(s.event) : ""}
          ${tocHtml}
          <div class="detail-body">${paras(s.body, true)}</div>
          ${(s.images || []).length ? `<div class="post-figures">${s.images.map((im) => `<figure class="post-figure"><a href="${esc(im.src)}" target="_blank" rel="noopener"><img src="${esc(im.src)}" alt="${esc(im.alt || "")}" loading="lazy" decoding="async"${im.w ? ` width="${im.w}" height="${im.h}"` : ""}></a>${im.caption ? `<figcaption>${esc(im.caption)}</figcaption>` : ""}</figure>`).join("")}</div>` : ""}
          ${s.files.length ? `<div class="attach"><h2>첨부파일 ${s.files.length}</h2><ul>${s.files.map((f) => `<li><a href="${p.href}" onclick="return false">${ICON.file}${esc(f)}</a></li>`).join("")}</ul></div>` : ""}
          ${p.qas.length ? `<section class="qa" aria-labelledby="sec-qa">
            <div class="qa-head">
              <h2 id="sec-qa" tabindex="-1">이 공지에 대해 묻고 답한 것 <span class="n">${p.qas.length}개</span></h2>
              <button class="text-link" type="button" id="qaAll" aria-pressed="false">모두 펼치기</button>
            </div>
            <ul class="qa-list">${p.qas.map((x) => qaItem(x.f)).join("")}</ul>
          </section>` : ""}
          <ul class="pager-nav">${pagerLink(prev, "이전 글")}${pagerLink(next, "다음 글")}</ul>
        </article>
        ${boxes.length ? `<aside class="detail-rail" aria-label="함께 볼 글">${boxes.join("")}</aside>` : ""}
      </div>
      <div class="back-row"><a class="btn btn-tertiary btn-block" href="${backHref}">${backLabel}</a></div>`;
    // 목차와 '묻고 답한 것 보기' 단추
    main.querySelectorAll("[data-sec]").forEach((b) => b.addEventListener("click", () => {
      const el = main.querySelector(`#sec-${b.dataset.sec}`);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      el.focus({ preventScroll: true });
    }));
    main.querySelectorAll(".q-row").forEach((b) => b.addEventListener("click", () => toggleQa(b)));
    const all = $("#qaAll");
    if (all) all.addEventListener("click", () => {
      const open = all.getAttribute("aria-pressed") !== "true";
      main.querySelectorAll(".q-row").forEach((b) => toggleQa(b, open, { track: false }));
      all.setAttribute("aria-pressed", String(open));
      all.textContent = open ? "모두 접기" : "모두 펼치기";
      Analytics.event("qa-all", { notice: p.id, open });
    });
    main.querySelectorAll("[data-go-cat]").forEach((b) => b.addEventListener("click", () => {
      resetFilters(); state.cat = b.dataset.goCat; pendingBoard = true;
      Analytics.event("category", { cat: state.cat, from: "detail" });
      location.hash = "#home";
    }));
    // 주소로 연 질문은 펼쳐 둔다 (그 자리로 내리는 것은 라우터가 한다)
    if (opened) toggleQa($(`#qb-${opened.id}`), true, { track: false });
    return opened ? $(`#q-${opened.id}`) : true;
  }

  /* ---------- 화면: 이벤트 (왼쪽에 큰 달력, 오른쪽에 고른 날의 내용 — 휴대폰은 달력 아래) ---------- */
  const todayStr = () => { const t = today0(); return Calendar.ymd(t.getFullYear(), t.getMonth() + 1, t.getDate()); };
  // ym: 보이는 달 · sel: 고른 날 · owner: 담당자 닉네임 · q: 찾는 말 (공지를 보고 돌아와도 그대로 남는다)
  const ev = { ym: "", sel: "", owner: "", q: "" };
  let calFocus = ""; // 달력에서 키보드가 서 있는 날 (탭으로 들어오면 이 칸에 선다)
  const evPick = () => Calendar.filter(CALENDAR, { owner: ev.owner, q: ev.q }, calKindName);
  const evFiltered = () => !!ev.owner || !!ev.q.trim();
  // 달 넘기기는 일정이 있는 달과 이번 달 사이에서만
  const calRange = () => { const ms = [...Calendar.months(CALENDAR), Calendar.monthOf(todayStr())].sort(); return [ms[0], ms[ms.length - 1]]; };
  const NONE = '<span class="day-wait">공지에 없음</span>'; // 모르는 칸은 지어내지 않고 비워 둔다
  // 추가 시간 반영 상태 꼬리표 (운영진 입력판에 적힌 것만): 예정 · 반영 중 · 반영 완료
  const statusTag = (x) => (x.extra && x.status
    ? `<span class="tag tag-st ${x.status === "반영 완료" ? "st-done" : x.status === "반영 중" ? "st-doing" : "st-plan"}">${esc(x.status)}</span>` : "");
  // 달력 칸 · 점의 색이 무엇인지 (달력 아래 작은 안내)
  const CAL_LEGEND = [["c-event", "행사"], ["c-task", "시험"], ["c-facility", "마감"], ["c-etc", "운영"]];

  // 목록 한 줄: 큰 날짜 + [종류 · 추가 시간] 이름 + 시각 · 장소 · 담당자 + D-day. 누르면 출처 공지로 (없으면 그날로)
  function eventRow(s) {
    const d = parseDate(s.date), link = s.links[0], title = esc(glueTight(s.title));
    const tags = `<span class="tag ${calKindClass(s.kind)}">${esc(calKindName(s.kind))}</span>${s.extra ? `<span class="tag tag-extra">추가 시간 ${Calendar.hoursText(s.extra)}</span>` : ""}${statusTag(s)}`;
    const sub = [s.time, s.place].filter(Boolean).join(" · ") || s.sub;
    return `<li><a class="ev-row" href="${link ? link.href : `#event/${s.date}`}">
      <span class="ev-date" aria-hidden="true"><b>${d.getDate()}</b><span>${d.getMonth() + 1}월 · ${DOW[d.getDay()]}</span></span>
      <span class="ev-main"><span class="ev-tags">${tags}</span><span class="ev-title">${link ? `<span${rd(link.key)}>${title}${READ_NOTE}</span>` : title}</span><span class="sr-only">${fmtDate(s.date)}</span>
        ${sub ? `<span class="ev-sub">${esc(glueTight(sub))}</span>` : ""}<span class="ev-owner">${s.owner ? `담당자 ${esc(s.owner)}` : "담당자 확인 중"}</span></span>
      ${s.d < 0 ? '<span class="dday done">지남</span>' : `<span class="dday${s.d <= 2 ? " soon" : ""}">${ddayLabel(s.d)}</span>`}
      <span class="chev">${ICON.chevR}</span>
    </a></li>`;
  }
  const evList = (items) => `<ul class="ev-list">${items.map(eventRow).join("")}</ul>`;

  // 담당자 줄: 닉네임을 고르면 "담당자: ○○ · n개" 칩이 뜨고, 고르기 전에는 닉네임 단추가 늘어선다 (닉네임이 하나도 없으면 줄을 숨긴다)
  function drawOwners() {
    const box = $("#evOwners"), list = Calendar.owners(CALENDAR);
    box.hidden = !list.length && !ev.owner;
    box.innerHTML = ev.owner
      ? `<span class="chip owner-on">담당자: ${esc(ev.owner)} · ${evPick().length}개</span><button class="text-link" type="button" data-owner="">담당자 모두 보기</button>`
      : `<span class="owners-label">담당자</span>${list.map((o) => `<button class="chip owner-chip" type="button" data-owner="${esc(o.name)}">${esc(o.name)}<span class="n">${o.n}</span></button>`).join("")}`;
  }

  // 달력: 일~토 7칸 표. 칸마다 일정 이름(3개까지)과 추가 시간, 좁은 화면에서는 점과 그날 추가 시간 합계만
  function drawCal() {
    const box = $("#calGrid"); if (!box) return;
    const month = Calendar.inMonth(evPick(), ev.ym), today = todayStr(), thisMonth = Calendar.monthOf(today) === ev.ym, [first, last] = calRange();
    $("#calTitle").textContent = Calendar.monthTitle(ev.ym);
    // 달력 위 한 줄: 그달의 예정 추가 시간 합계와 일정 수
    $("#calSum").innerHTML = `<span>${thisMonth ? "이번 달" : `${+ev.ym.slice(5)}월`} 예정 추가 시간 <b>${Calendar.hoursText(Calendar.extraTotal(month))}</b></span> <span>일정 <b>${month.length}개</b></span>${evFiltered() ? ' <span class="cal-sum-note">고른 조건만</span>' : ""}`;
    $("#calPrev").disabled = ev.ym <= first;
    $("#calNext").disabled = ev.ym >= last;
    // 탭으로 들어왔을 때 설 칸: 키보드가 서 있던 날 → 고른 날 → 오늘 → 1일
    const inMonth = (d) => d && Calendar.monthOf(d) === ev.ym;
    const tabDay = inMonth(calFocus) ? calFocus : inMonth(ev.sel) ? ev.sel : thisMonth ? today : `${ev.ym}-01`;
    box.innerHTML = `<table class="cal" role="grid" aria-labelledby="calTitle">
      <thead><tr>${[...DOW].map((w, i) => `<th scope="col" abbr="${w}요일"${i === 0 ? ' class="sun"' : i === 6 ? ' class="sat"' : ""}>${w}</th>`).join("")}</tr></thead>
      <tbody>${Calendar.monthGrid(ev.ym).map((week) => `<tr>${week.map((date, i) => {
        if (!date) return '<td class="cal-td out"></td>';
        const items = Calendar.onDay(month, date), sum = Calendar.extraTotal(items);
        const cls = ["cal-td", items.length ? "has" : "", date === today ? "is-today" : "", date === ev.sel ? "is-sel" : "", i === 0 ? "sun" : i === 6 ? "sat" : ""].filter(Boolean).join(" ");
        return `<td class="${cls}"><button type="button" class="cal-day" data-date="${date}" tabindex="${date === tabDay ? 0 : -1}" aria-pressed="${date === ev.sel}"${date === today ? ' aria-current="date"' : ""} aria-label="${esc(Calendar.dayLabel(date, items))}${date === today ? ", 오늘" : ""}">
          <span class="cal-top"><span class="cal-num">${+date.slice(8)}</span>${date === today ? '<span class="cal-now">오늘</span>' : ""}</span>
          ${items.length ? `<span class="cal-items" aria-hidden="true">${items.slice(0, 3).map((it) => `<span class="cal-item ${calKindClass(it.kind)}"><span class="cal-t">${esc(Calendar.shortTitle(it.title, calKindName(it.kind)))}</span>${it.extra ? `<b>${Calendar.hoursShort(it.extra)}</b>` : ""}</span>`).join("")}${items.length > 3 ? `<span class="cal-more">${items.length - 3}개 더</span>` : ""}</span>
          <span class="cal-dots" aria-hidden="true"><span>${items.slice(0, 4).map((it) => `<i class="${calKindClass(it.kind)}"></i>`).join("")}</span>${sum ? `<b>${Calendar.hoursShort(sum)}</b>` : ""}</span>` : ""}
        </button></td>`;
      }).join("")}</tr>`).join("")}</tbody></table>`;
  }

  // 고른 날의 내용: 달력 오른쪽 칸(휴대폰은 달력 아래)에 그날 일정을 줄마다 — 시간 · 장소 · 추가 시간 · 담당자 · 출처 공지
  const dayItem = (it) => `<li class="day-item">
      <div class="ev-tags"><span class="tag ${calKindClass(it.kind)}">${esc(calKindName(it.kind))}</span>${it.extra ? `<span class="tag tag-extra">추가 시간 ${Calendar.hoursText(it.extra)}</span>` : ""}${statusTag(it)}</div>
      <p class="day-name">${esc(glueTight(it.title))}</p>
      ${it.sub ? `<p class="day-sub">${esc(glueTight(it.sub))}</p>` : ""}
      <dl class="day-meta">
        <div><dt>시간</dt><dd>${it.time ? esc(glueTight(it.time)) : NONE}</dd></div>
        <div><dt>장소</dt><dd>${it.place ? esc(it.place) : NONE}</dd></div>
        <div><dt>추가 시간</dt><dd>${it.extra ? Calendar.hoursText(it.extra) : NONE}</dd></div>
        ${it.extra ? `<div><dt>반영</dt><dd>${it.status ? esc(it.status) : '<span class="day-wait">운영진 확인 전</span>'}</dd></div>` : ""}
        <div><dt>담당자</dt><dd>${it.owner ? `<button class="text-link owner-btn" type="button" data-owner="${esc(it.owner)}">${esc(it.owner)}</button>` : '<span class="day-wait">담당자 확인 중</span>'}</dd></div>
        ${it.apply || it.applyBy ? `<div><dt>신청</dt><dd>${it.apply ? `<a class="text-link" href="${esc(it.apply)}" target="_blank" rel="noopener">신청하기</a>` : ""}${it.apply && it.applyBy ? " · " : ""}${it.applyBy ? `마감 ${esc(it.applyBy)}` : ""}</dd></div>` : ""}
      </dl>
      ${it.links.length ? `<p class="day-src"><b>출처</b>${it.links.map((l) => `<a href="${l.href}"><span${rd(l.key)}>${esc(l.text)}${READ_NOTE}</span></a>`).join("")}</p>` : ""}
    </li>`;
  function drawDay() {
    const box = $("#dayPanel"); if (!box) return;
    if (!ev.sel) { box.innerHTML = '<p class="day-hint">달력에서 날짜를 누르면 그날 일정이 여기에 나옵니다.</p>'; return; }
    const items = Calendar.onDay(evPick(), ev.sel), sum = Calendar.extraTotal(items), any = Calendar.onDay(CALENDAR, ev.sel).length, d = parseDate(ev.sel);
    box.innerHTML = `<div class="day-head">
        <h2 class="day-title" id="dayTitle" tabindex="-1">${d.getMonth() + 1}월 ${d.getDate()}일 ${DOW[d.getDay()]}요일${ev.sel === todayStr() ? ' <span class="dday soon">오늘</span>' : ""}</h2>
        ${sum ? `<p class="day-total">추가 ${Calendar.hoursText(sum)}</p>` : ""}
      </div>
      <div class="day-bar"><p class="day-count">${items.length ? `일정 ${items.length}개` : "일정 없음"}</p>${copyBtn(`#event/${ev.sel}`)}</div>
      ${items.length ? `<ul class="day-list">${items.map(dayItem).join("")}</ul>` : `<p class="day-hint">${any ? "고른 조건에 맞는 일정이 이 날에는 없습니다." : "이 날은 정해진 일정이 없습니다."}</p>`}`;
  }

  // 목록: 다가오는 일정 → 지난 일정(접어 둔다. 지난 날은 달력에 이미 보이므로 — 담당자 · 찾는 말로 걸렀을 때는 펼쳐 둔다)
  function drawEvList() {
    const area = $("#evListArea"); if (!area) return;
    const pick = evPick(), up = pick.filter((x) => x.d >= 0), past = pick.filter((x) => x.d < 0).reverse();
    $("#evListCount").textContent = `${up.length}개 예정`;
    area.innerHTML = `${up.length ? evList(up) : `<p class="ev-none">${evFiltered() ? "고른 조건에 맞는 다가오는 일정이 없습니다." : "다가오는 일정이 아직 없습니다. 공지가 올라오면 여기에 모읍니다."}</p>`}
      ${past.length ? `<details class="ev-past"${evFiltered() ? " open" : ""}><summary class="ev-subh">지난 일정 <span class="n">${past.length}개</span></summary>${evList(past)}</details>` : ""}`;
  }
  const drawEvents = () => { drawOwners(); drawCal(); drawDay(); drawEvList(); };

  // 날짜 고르기: 달력의 그 칸에 표시하고, 옆(휴대폰은 아래)에 그날 일정을 보이고, 주소를 #event/2026-11-20 으로 맞춘다 (링크 복사 · 새로고침)
  function selectDay(date, { reveal = false } = {}) {
    ev.sel = date; ev.ym = Calendar.monthOf(date); calFocus = date;
    history.replaceState(null, "", `${location.pathname}${location.search}#event/${date}`);
    drawCal(); drawDay();
    const b = main.querySelector(`.cal-day[data-date="${date}"]`);
    if (b) b.focus({ preventScroll: true });
    // 그날 일정이 화면 밖이면(휴대폰: 달력 아래) 보이게 내린다
    if (reveal) $("#dayPanel").scrollIntoView({ block: "nearest", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    Analytics.event("event-day", { date });
  }
  // 키보드로 달력 안에서 옮기기: 달을 넘어가면 그 달을 그린다 (일정이 있는 달과 이번 달 사이에서만)
  function moveCalFocus(date) {
    const [first, last] = calRange(), ym = Calendar.monthOf(date);
    if (ym < first || ym > last) return;
    calFocus = date;
    if (ym !== ev.ym) { ev.ym = ym; drawCal(); }
    main.querySelectorAll(".cal-day").forEach((x) => { x.tabIndex = x.dataset.date === date ? 0 : -1; });
    const b = main.querySelector(`.cal-day[data-date="${date}"]`);
    if (b) b.focus();
  }

  // date: 주소가 #event/2026-11-20 일 때 그 날 (그 날이 든 달을 열고 그날 일정을 보인다)
  function renderEvents(date = "") {
    setTitle("이벤트"); setTab("event");
    const today = todayStr();
    if (Calendar.isDate(date)) { ev.sel = date; ev.ym = Calendar.monthOf(date); }
    else if (!ev.ym) { ev.ym = Calendar.monthOf(today); ev.sel = today; } // 처음 열면 오늘이 든 달, 오늘을 고른 채로
    calFocus = "";
    const faqs = evFaqList();
    main.innerHTML = `
      <div class="title-row ev-head">
        <h1 class="page-title">이벤트</h1>
        <div class="ev-find" role="search">
          ${ICON.search}
          <label class="sr-only" for="evQ">일정 · 담당자 찾기</label>
          <input id="evQ" type="search" enterkeyhint="search" autocomplete="off" placeholder="일정 · 담당자 찾기" value="${esc(ev.q)}">
          <button class="search-clear" type="button" id="evQClear" aria-label="찾는 말 지우기" ${ev.q ? "" : "hidden"}>${ICON.close}</button>
        </div>
      </div>
      <div class="ev-owners" id="evOwners" hidden></div>
      <div class="ev-grid">
        <section class="cal-card" aria-labelledby="calTitle">
          <div class="cal-head">
            <div class="cal-nav">
              <div class="cal-move">
                <button class="cal-step" type="button" id="calPrev" aria-label="이전 달">${ICON.chevL}</button>
                <h2 class="cal-title" id="calTitle" aria-live="polite"></h2>
                <button class="cal-step" type="button" id="calNext" aria-label="다음 달">${ICON.chevR}</button>
              </div>
              <button class="btn btn-tertiary btn-s cal-today" type="button" id="calToday">오늘</button>
            </div>
            <p class="cal-sum" id="calSum"></p>
          </div>
          <div id="calGrid"></div>
          <p class="cal-legend"><span class="sr-only">색의 뜻: </span>${CAL_LEGEND.map(([c, name]) => `<span class="${c}"><i aria-hidden="true"></i>${name}</span>`).join("")}</p>
        </section>
        <section class="day-panel" id="dayPanel" aria-label="고른 날의 일정"></section>
        <section class="ev-sec" aria-labelledby="h-list">
          <h2 class="sec-title" id="h-list">일정 목록 <span class="n" id="evListCount"></span></h2>
          <div id="evListArea"></div>
        </section>
        ${faqs.length ? `<details class="ev-faq ev-sec">
          <summary>자주 묻는 질문 <span class="n">${faqs.length}개</span></summary>
          <ul class="link-list">${faqs.map((f) => `<li><a href="#faq/${f.id}">${ICON.chevR}<span${rd(`f${f.id}`)}>${esc(f.q)}${READ_NOTE}</span></a></li>`).join("")}</ul>
        </details>` : ""}
        <p class="ev-note ev-sec">달력에는 행사 공지, 11월 운영 일정표, 시험 · 마감 일정을 합쳐 놓았습니다(같은 날 같은 일은 한 번만). 운영진 추가 시간은 공지로 확인된 일정에만 적었고, 담당자 닉네임은 아직 모으는 중입니다.</p>
      </div>`;

    const q = $("#evQ"), qClear = $("#evQClear");
    q.addEventListener("input", () => { ev.q = q.value; qClear.hidden = !q.value; drawEvents(); });
    qClear.addEventListener("click", () => { q.value = ""; ev.q = ""; qClear.hidden = true; drawEvents(); q.focus(); });
    // 담당자 닉네임(담당자 줄의 단추 · 그날 일정 안의 닉네임)을 누르면 그 사람이 맡은 일정만 남긴다. 빈 값이면 모두 보기
    const onOwner = (e) => {
      const b = e.target.closest("[data-owner]"); if (!b) return;
      ev.owner = b.dataset.owner;
      drawEvents();
      Analytics.event("event-owner", { on: !!ev.owner });
    };
    $("#evOwners").addEventListener("click", onOwner);
    $("#dayPanel").addEventListener("click", onOwner);
    const turn = (by) => { ev.ym = Calendar.shiftMonth(ev.ym, by); calFocus = ""; drawCal(); Analytics.event("event-month", { month: ev.ym }); };
    $("#calPrev").addEventListener("click", () => turn(-1));
    $("#calNext").addEventListener("click", () => turn(1));
    $("#calToday").addEventListener("click", () => selectDay(today));
    const grid = $("#calGrid");
    grid.addEventListener("click", (e) => {
      const b = e.target.closest(".cal-day");
      if (b) selectDay(b.dataset.date, { reveal: true });
    });
    // 달력 안 키보드: ←→ 하루, ↑↓ 한 주, Home · End 그 주의 처음 · 끝, PageUp · PageDown 한 달. Enter · Space 는 그 날을 연다(단추의 기본 동작)
    grid.addEventListener("keydown", (e) => {
      const b = e.target.closest(".cal-day"); if (!b) return;
      const at = b.dataset.date, dow = parseDate(at).getDay();
      const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7, Home: -dow, End: 6 - dow }[e.key];
      let to = step === undefined ? "" : Calendar.shiftDay(at, step);
      if ((e.key === "Home" || e.key === "End") && Calendar.monthOf(to) !== Calendar.monthOf(at)) {
        const days = Calendar.monthGrid(Calendar.monthOf(at)).flat().filter(Boolean);
        to = e.key === "Home" ? days[0] : days[days.length - 1];
      }
      if (e.key === "PageUp" || e.key === "PageDown") {
        // 다음 · 이전 달의 같은 날 (그 달에 없는 날이면 말일)
        const ym = Calendar.shiftMonth(Calendar.monthOf(at), e.key === "PageUp" ? -1 : 1), days = Calendar.monthGrid(ym).flat().filter(Boolean);
        to = days[Math.min(+at.slice(8), days.length) - 1];
      }
      if (!to) return;
      e.preventDefault();
      moveCalFocus(to);
    });
    drawEvents();
  }

  /* ---------- 글자 크기 (보통 ↔ 크게 125%) ---------- */
  // 처음 그릴 때 깜빡이지 않도록 index.html <head> 에서 저장된 값을 먼저 적용해 둔다
  const TEXT_KEY = "qna-text-size";
  const textBtn = $("#textSize");
  const isLarge = () => document.documentElement.classList.contains("text-lg");
  // 좁은 휴대폰에서는 '글자'를 화면에서만 숨겨 '가 크게'로 보인다 (화면 읽기 프로그램은 그대로 '글자 크게')
  const syncTextBtn = () => { textBtn.querySelector(".ts-label").innerHTML = `<span class="ts-pre">글자 </span>${isLarge() ? "작게" : "크게"}`; };
  textBtn.addEventListener("click", () => {
    const large = !isLarge();
    document.documentElement.classList.toggle("text-lg", large);
    try { localStorage.setItem(TEXT_KEY, large ? "large" : "normal"); } catch (e) { /* 저장 안 되면 이번 방문에만 적용 */ }
    syncTextBtn();
    syncStick(); // 분류 줄 높이가 바뀌었다
    toast(large ? "글자를 크게 바꿨습니다" : "글자를 원래 크기로 바꿨습니다");
    Analytics.event("text-size", { size: large ? "large" : "normal" });
  });
  syncTextBtn();

  /* ---------- 머리: 메뉴의 이벤트 표시 · '검색' 단추 ---------- */
  // 이벤트 메뉴 옆에 가장 가까운 일정까지 남은 날을 붙인다 (내일 · D-7)
  const evBadge = $("#evBadge"), nextEvent = upcomingEvents()[0];
  if (evBadge) { evBadge.textContent = nextEvent ? ddayLabel(nextEvent.d) : ""; evBadge.hidden = !nextEvent; }

  // 어느 화면 · 어느 위치에서든 공지사항의 검색창으로 데려간다
  let pendingSearch = false;
  function goSearch() {
    const board = $("#board"), input = $("#q");
    if (!board || !input) return;
    window.scrollTo(0, board.getBoundingClientRect().top + window.scrollY - 8);
    input.focus({ preventScroll: true });
  }
  $("#headSearch").addEventListener("click", () => {
    Analytics.event("head-search", { from: main.dataset.view });
    if (main.dataset.view === "board") return goSearch();
    pendingSearch = true; state.seen = null;
    location.hash = "#home";
  });

  /* ---------- 화면: 운영진용 (#ops) — 운영진 입력판(구글 시트)에 적은 것이 사이트에 어떻게 나오는지 ---------- */
  // 고치는 일은 시트에서 하고, 여기서는 결과와 잘못 적힌 줄만 본다 (메뉴에는 없고 발의 링크로 들어온다)
  const p2 = (n) => String(n).padStart(2, "0");
  const stampText = (ms) => { const d = new Date(ms); return `${d.getMonth() + 1}월 ${d.getDate()}일 (${DOW[d.getDay()]}) ${p2(d.getHours())}:${p2(d.getMinutes())}`; };
  const md = (date) => `${+date.slice(5, 7)}/${+date.slice(8, 10)}`;
  const OPS_STATE = { on: "나오는 중", soon: "시작 전", ended: "끝남", hidden: "숨김" };
  function renderOps() {
    setTitle("운영진용 화면"); setTab("");
    const has = typeof OpsSheet !== "undefined", info = has ? OpsSheet.info() : { source: "none", read: {}, problems: [] };
    const r = info.read || {}, edit = has ? OpsSheet.editUrl() : "";
    const status = !edit ? "운영진 입력판이 아직 연결되지 않았습니다."
      : info.source === "sheet" ? `${stampText(info.at)}에 시트에서 읽었습니다.`
      : info.source === "cache" ? `${stampText(info.at)}에 시트에서 읽어 이 브라우저에 저장해 둔 내용입니다.`
      : "지금은 시트를 읽지 못해 사이트에 원래 적힌 내용을 보여 줍니다.";
    const box = (title, inner, note = "", cls = "") => `<section class="ops-box${cls ? ` ${cls}` : ""}"><h2>${esc(title)}</h2>${note ? `<p class="ops-note">${esc(note)}</p>` : ""}${inner}</section>`;
    const none = (t) => `<p class="ops-none">${esc(t)}</p>`;
    // 잘못 적힌 줄
    const probs = info.problems || [];
    const probBox = probs.length
      ? box(`고칠 줄 ${probs.length}개`, `<ul class="ops-list">${probs.map((p) => `<li><b>${esc(p.tab)} 탭 ${p.row}번째 줄</b> ${esc(p.msg)}</li>`).join("")}</ul>`, "", "warn")
      : info.source === "none" ? "" : `<p class="ops-ok">${ICON.check}잘못 적힌 줄이 없습니다.</p>`;
    // 맨 위 알림 · 고정
    const al = (r.pins && r.pins.alerts) || [], pins = (r.pins && r.pins.pins) || [];
    const ttl = (id) => (NOTICES.find((n) => n.id === id) || {}).title || `공지 ${id}`;
    const alertBox = box("모든 화면 맨 위 알림", al.length ? table([["내용", "상태", "끝"], ...al.map((a) => [a.text, OPS_STATE[a.state], a.untilText || "끝 없음"])])
      : none(r.pins ? "적힌 알림이 없습니다." : "시트를 읽지 못했습니다."));
    const pinBox = box("공지사항 맨 위 고정 (중요)", pins.length ? table([["공지", "상태", "끝"], ...pins.map((p) => [`${p.notice} · ${ttl(p.notice)}`, OPS_STATE[p.state], p.untilText || "끝 없음"])])
      : none(r.pins ? "고정한 공지가 없습니다." : "시트를 읽지 못해 원래 고정(data.js)을 씁니다."));
    // 이벤트 달력
    const items = r.schedule ? r.schedule.items.slice().sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)) : [];
    const withExtra = items.filter((it) => it.extra), blank = (v) => v || "비어 있음";
    const schNote = items.length ? `추가 시간이 적힌 일정 ${withExtra.length}개 중 반영 상태가 빈 것 ${withExtra.filter((it) => !it.status).length}개 · 담당자가 빈 일정 ${items.filter((it) => !it.owner).length}개${r.schedule.hidden ? ` · 숨긴 줄 ${r.schedule.hidden}개` : ""}` : "";
    const schBox = box(`이벤트 달력 일정 ${items.length}개`, items.length
      ? table([["날짜", "이름", "추가 시간", "반영 상태", "담당자"], ...items.map((it) => [md(it.date), it.title, it.extra ? Calendar.hoursText(Calendar.hours(it.extra)) : "", it.extra ? blank(it.status) : "", blank(it.owner)])])
      : none("시트를 읽지 못해 원래 운영표(data.js)를 씁니다."), schNote);
    // 답 확인
    const checks = r.answers ? r.answers.checks : {};
    const cnt = (s) => Object.values(checks).filter((c) => c.state === s).length;
    const notOk = Object.keys(checks).filter((id) => checks[id].state !== "ok").map((id) => FAQS.find((f) => f.id === +id)).filter(Boolean);
    const ansBox = box("질문 답 확인", r.answers
      ? `<p class="ops-count">질문 ${FAQS.length}개 중 맞음 <b>${cnt("ok")}</b> · 운영진 수정 <b>${cnt("fixed")}</b> · 고치는 중 <b>${cnt("fixing")}</b> · 아직 안 봄 <b>${FAQS.length - Object.keys(checks).length}</b></p>${notOk.length ? `<ul class="ops-list">${notOk.map((f) => `<li><a class="text-link" href="#faq/${f.id}">${f.id} · ${esc(f.q)}</a></li>`).join("")}</ul>` : ""}`
      : none("시트를 읽지 못했습니다."));
    const howBox = box("쓰는 법", `<ul class="ops-list">
        <li>입력판의 <b>일정</b> 탭은 이벤트 달력, <b>고정·알림</b> 탭은 공지사항 맨 위 고정과 모든 화면 맨 위 알림, <b>답 확인</b> 탭은 질문 옆 '운영진 확인'이 됩니다.</li>
        <li>보이기를 '아니요'로 바꾸면 사이트에서 빠집니다. 줄을 지우지 않아도 됩니다.</li>
        <li>고정과 알림에 끝을 적으면 그때 저절로 내려갑니다.</li>
        <li>시트를 고친 뒤 사이트에 나오기까지 구글에서 몇 분 걸릴 수 있습니다. 이 화면의 '다시 읽기'를 누르면 바로 다시 읽습니다.</li>
        <li>이 시트의 내용은 공개됩니다. 교육생 이름 · 연락처 · 개인별 출입 시간이나 추가 시간은 넣지 않습니다.</li>
      </ul>`);
    main.innerHTML = `<section class="ops" aria-labelledby="h-ops">
      <div class="ops-head">
        <h1 class="page-title" id="h-ops">운영진용 화면</h1>
        <p class="sec-desc">운영진 입력판(구글 시트)에 적은 내용이 사이트에 어떻게 나오는지 보는 곳입니다. 고치는 일은 시트에서 합니다.</p>
        <div class="ops-actions">${edit ? `<a class="btn btn-primary btn-s" href="${esc(edit)}" target="_blank" rel="noopener">입력판 열기</a>` : ""}${has ? '<button class="btn btn-tertiary btn-s" type="button" id="opsReload">다시 읽기</button>' : ""}</div>
        <p class="ops-status">${esc(status)}</p>
      </div>
      ${probBox}${alertBox}${pinBox}${schBox}${ansBox}${howBox}
    </section>`;
    const rb = $("#opsReload");
    if (rb) rb.addEventListener("click", async () => {
      rb.disabled = true; rb.textContent = "읽는 중…";
      Analytics.event("ops-reload");
      if (await OpsSheet.refresh()) { location.reload(); return; }
      rb.disabled = false; rb.textContent = "다시 읽기";
      toast("시트를 읽지 못했습니다. 잠시 뒤 다시 눌러 주세요.");
    });
  }

  /* ---------- 운영진 알림: 모든 화면 맨 위 한 줄 (운영진 입력판의 고정·알림 탭) ---------- */
  // 닫은 알림은 이 브라우저에 적어 두고 다시 띄우지 않는다 (내용이나 끝이 바뀌면 새 알림으로 본다)
  (function renderAlerts() {
    const box = $("#opsAlerts");
    if (!box || typeof OpsSheet === "undefined") return;
    const OFF = "qna-alert-off";
    let off = [];
    try { off = JSON.parse(localStorage.getItem(OFF) || "[]"); } catch (e) { off = []; }
    const list = OpsSheet.alerts().filter((a) => !off.includes(a.key));
    box.hidden = !list.length;
    box.innerHTML = list.map((a, i) => `<p class="ops-alert" role="status" data-i="${i}"><b>알림</b><span class="t">${esc(a.text)}${a.notice ? ` <a href="#notice/${a.notice}">자세히</a>` : a.link ? ` <a href="${esc(a.link)}" target="_blank" rel="noopener">자세히</a>` : ""}</span><button class="ops-alert-x" type="button" aria-label="이 알림 닫기">${ICON.close}</button></p>`).join("");
    box.addEventListener("click", (e) => {
      const b = e.target.closest(".ops-alert-x"); if (!b) return;
      const p = b.closest(".ops-alert"), a = list[+p.dataset.i];
      off.push(a.key);
      try { localStorage.setItem(OFF, JSON.stringify(off.slice(-50))); } catch (err) { /* 저장 못 해도 이번엔 닫힌다 */ }
      p.remove();
      if (!box.querySelector(".ops-alert")) box.hidden = true;
      Analytics.event("ops-alert-close");
    });
  })();

  /* ---------- 라우터 ---------- */
  // #home 공지사항 · #event 이벤트(달력) · #event/2026-11-20 그 날의 일정 · #notice/8 공지 하나 · #faq/24 그 질문이 든 공지(질문을 펼쳐서)
  // (예전 주소) #faq, #notice → 공지사항 목록
  let pendingBoard = false; // 공지사항을 그린 뒤 목록이 보이게 내릴지
  function route() {
    renderRoute();
    // 글 화면은 통계에서 알아보기 쉽게 제목을 함께 남긴다 (#faq/24 → /faq/24)
    Analytics.page(location.hash, document.title.replace(` | ${SITE}`, ""));
  }
  function renderRoute() {
    const [page, idText] = location.hash.replace(/^#/, "").split("/");
    const id = +idText;
    if (page === "ops") {
      main.dataset.view = "ops";
      renderOps();
      window.scrollTo(0, 0);
      return;
    }
    if (page === "event") {
      main.dataset.view = "event";
      renderEvents(idText || "");
      syncStick();
      window.scrollTo(0, 0);
      return;
    }
    if (idText && (page === "notice" || page === "faq")) {
      const home = page === "faq" ? postOfFaq(id) : postOf(id);
      const shown = home && renderDetail(home.id, page === "faq" ? id : null);
      if (shown) {
        main.dataset.view = "detail";
        syncStick();
        window.scrollTo(0, 0);
        // 질문 주소로 왔으면 그 질문 줄로 내린다
        if (shown !== true) shown.scrollIntoView({ block: "start" });
        return;
      }
    }
    if (page === "notice" || page === "faq") {
      if (!idText) { state.seen = null; pendingBoard = true; }
      history.replaceState(null, "", `${location.pathname}${location.search}#home`);
    }
    main.dataset.view = "board";
    renderBoard();
    syncStick();
    window.scrollTo(0, 0);
    // 공지를 보고 돌아왔으면 그 줄로, 옛 주소 · 분류를 골라 들어왔으면 목록으로, '검색' 단추로 왔으면 검색창으로 내린다
    const row = state.seen && document.getElementById(`row-${state.seen}`);
    if (pendingSearch) goSearch();
    else if (row) row.scrollIntoView({ block: "center" });
    else if (pendingBoard) alignList(true);
    state.seen = null; pendingBoard = false; pendingSearch = false;
  }
  window.addEventListener("hashchange", route);

  // 로고: 검색어·분류를 모두 비우고 공지사항 맨 위로 (이미 거기면 hashchange 가 안 생기므로 직접 다시 그림)
  $(".logo").addEventListener("click", (e) => {
    resetFilters();
    Analytics.event("logo-reset");
    const h = location.hash;
    if (h === "#home" || h === "" || h === "#") { e.preventDefault(); route(); }
  });
  // 메뉴의 '공지사항': 이미 공지사항 화면이면 맨 위로만 올린다
  document.querySelectorAll('.tab[data-tab="board"]').forEach((t) => t.addEventListener("click", (e) => {
    const h = location.hash;
    if (h === "#home" || h === "" || h === "#") { e.preventDefault(); window.scrollTo(0, 0); }
  }));

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

  // 발(화면 맨 아래): 코디세이 연락처(위치 · 전화 · 메일 · 공식 사이트)와 맨 밑줄의 업데이트 날짜
  (function renderFoot() {
    const c = typeof CONTACT === "undefined" ? null : CONTACT, box = $("#footContact");
    if (c && box) {
      const row = (label, html) => (html ? `<div><dt>${label}</dt><dd>${html}</dd></div>` : "");
      const tel = (num, note) => (num ? `<a href="tel:${num.replace(/[^0-9+]/g, "")}">${esc(num)}</a>${note ? ` <span class="foot-note">${esc(note)}</span>` : ""}` : "");
      box.innerHTML = [
        row("위치", c.place ? esc(c.place) : ""),
        row("전화", tel(c.phone, c.phoneNote)),
        row("주말·야간", tel(c.night, "")),
        row("메일", c.email ? `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : ""),
        row("공식 사이트", c.site ? `<a href="${esc(c.site)}" target="_blank" rel="noopener">${esc(c.site.replace(/^https?:\/\//, ""))}</a>` : ""),
      ].join("");
    }
    // 맨 밑줄: 내용 업데이트 날짜와 그날 바뀐 것 (새 공지 몇 건, 질문이 붙은 공지 몇 건)
    const lastDay = POSTS.map((p) => p.date).sort().pop() || "";
    const touched = lastDay ? POSTS.filter((p) => p.date === lastDay) : [];
    const newNotices = touched.filter((p) => p.own === lastDay).length, grown = touched.filter((p) => p.fresh.length);
    const freshText = [newNotices ? `새 공지 ${newNotices}건` : "", grown.length ? `공지 ${grown.length}건에 새 질문 ${grown.reduce((s, p) => s + p.fresh.length, 0)}개` : ""].filter(Boolean).join(" · ");
    // 맨 밑줄: "11월 19일 (목) 업데이트 · 새 공지 3건" 처럼 한 문장으로
    const upd = `${fmtDate(UPDATED)} 업데이트`;
    $("#updated").textContent = !freshText ? upd : lastDay === UPDATED ? `${upd} · ${freshText}` : `${upd} · ${fmtDate(lastDay)} ${freshText}`;
    $("#footFresh").textContent = "";
  })();
  // 팀 소개 창: 발의 "Made by 전상욱 · 이재엽"을 누르면 역할별 카드와 이름(누르면 깃허브)이 나온다
  (function setupTeam() {
    const makers = typeof MAKERS === "undefined" ? [] : MAKERS, team = typeof TEAM === "undefined" ? null : TEAM;
    const btn = $("#teamOpen"), dlg = $("#team");
    if (!btn || !dlg || !makers.length) { if (btn) btn.closest("p").remove(); return; }
    btn.textContent = `Made by ${makers.map((m) => m.name || m.id).join(" · ")}`;
    const who = (id) => makers.find((m) => m.id === id) || { name: id, id };
    const chip = (m) => `<a class="team-chip" href="https://github.com/${encodeURIComponent(m.id)}" target="_blank" rel="noopener" title="github.com/${esc(m.id)}">${esc(m.name || m.id)}<span class="sr-only"> 깃허브, 새 탭</span></a>`;
    $("#teamTitle").innerHTML = `Team <em>${esc((team && team.title) || "Q&A 허브")}</em>`;
    $("#teamSub").textContent = (team && team.sub) || "";
    const roles = team && team.roles && team.roles.length ? team.roles : [{ role: "만든 사람", desc: "", who: makers.map((m) => m.id) }];
    $("#teamGrid").innerHTML = roles.map((r) => `<li class="team-card">
        <h3>${esc(r.role)}</h3>${r.desc ? `<p>${esc(r.desc)}</p>` : ""}
        <div class="team-chips">${r.who.map((id) => chip(who(id))).join("")}</div>
      </li>`).join("");
    const close = () => { dlg.classList.remove("open"); setTimeout(() => dlg.open && dlg.close(), 200); };
    btn.addEventListener("click", () => {
      if (typeof dlg.showModal !== "function") return;
      dlg.showModal(); requestAnimationFrame(() => dlg.classList.add("open"));
      Analytics.event("team-open");
    });
    $("#teamClose").addEventListener("click", close);
    dlg.addEventListener("cancel", (e) => { e.preventDefault(); close(); }); // ESC
    dlg.addEventListener("click", (e) => { if (e.target === dlg) close(); }); // 바깥(어두운 곳) 누르면 닫기
    dlg.addEventListener("close", () => { dlg.classList.remove("open"); btn.focus(); });
    $("#teamGrid").addEventListener("click", (e) => {
      const a = e.target.closest(".team-chip");
      if (a) Analytics.event("team-github", { to: a.getAttribute("href").split("/").pop() });
    });
  })();
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
      markRead(`f${best.id}`); // 답을 보여 줬으니 본 글로 적는다
      html = `<span class="bq">${esc(best.q)}</span>${paras(best.a)}${opsLine(best)}`;
      const links = [
        linkBtn(`#faq/${best.id}`, "이 답이 있는 공지에서 보기", ICON.chevR),
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
        <div class="bubble-links">${linkBtn("#home", "공지사항 보기", ICON.doc)}${linkBtn("#event", "이벤트 보기", ICON.chevR)}</div>`;
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
};

// 운영진 입력판(js/ops.js)을 읽은 뒤에 그린다. ops.js 가 없거나 시트를 못 읽어도 3초 안에 data.js 로 그린다
Promise.race([typeof OpsSheet === "undefined" ? Promise.resolve() : OpsSheet.ready, new Promise((r) => setTimeout(r, 3000))])
  .catch(() => {})
  .then(startApp);
