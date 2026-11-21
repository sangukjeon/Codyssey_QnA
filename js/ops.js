/*
 * 운영진 입력판 — 운영진이 구글 시트에 적은 일정 · 고정 · 알림 · 답 확인을 읽어 사이트 자료(data.js)에 덧씌운다
 *   시트는 '웹에 게시'한 CSV 를 읽기만 한다 (로그인 없음). 게시 키와 탭 번호(gid)는 data.js 의 OPS_SHEET
 *   읽는 순서: 5분 안에 읽어 둔 것 → 시트(2.5초까지 기다림) → 예전에 읽어 둔 것 → data.js 그대로
 *   읽힌 탭만 바꾼다
 *     일정 탭     → 운영표(OPS_SCHEDULE)를 통째로 바꾼다 (이벤트 달력)
 *     고정·알림 탭 → 공지의 고정(중요)과 모든 화면 맨 위 알림
 *     답 확인 탭  → 질문의 '운영진 확인' 표시, 고친 답
 *   화면(DOM)을 건드리지 않는 읽기 · 검사는 node 로 시험한다: node tests/ops-test.js
 */
const OpsSheet = (() => {
  const CACHE_KEY = "qna-ops-cache-v1";
  const FAIL_KEY = "qna-ops-fail";
  const FRESH_MS = 5 * 60 * 1000;  // 이보다 최근에 읽은 것은 기다리지 않고 바로 쓴다 (구글도 5분쯤 묵혀 내보낸다)
  const WAIT_MS = 2500;            // 처음 그릴 때 시트를 기다리는 가장 긴 시간
  const FAIL_MS = 10 * 60 * 1000;  // 못 읽은 뒤 이 시간 동안은 기다리지 않는다

  /* ----- CSV ----- */
  // CSV 글 → 줄마다 칸 배열. 따옴표로 묶은 칸 안의 쉼표 · 줄바꿈 · "" 를 처리한다
  function parseCsv(text) {
    const t = String(text || "").replace(/^\uFEFF/, ""), rows = [];
    let row = [], cell = "", quoted = false;
    for (let i = 0; i < t.length; i++) {
      const c = t[i];
      if (quoted) {
        if (c === '"') { if (t[i + 1] === '"') { cell += '"'; i++; } else quoted = false; } else cell += c;
      } else if (c === '"') quoted = true;
      else if (c === ",") { row.push(cell); cell = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && t[i + 1] === "\n") i++;
        row.push(cell); rows.push(row); row = []; cell = "";
      } else cell += c;
    }
    if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
    return rows;
  }
  // 머리글을 칸 이름으로. 괄호 속 설명과 띄어쓰기는 빼고 맞춘다 ("추가 시간 (시간, 숫자)" → "추가시간")
  const headKey = (h) => String(h || "").replace(/\(.*?\)/g, "").replace(/\s+/g, "");
  const HEADS = {
    schedule: { 보이기: "show", 날짜: "date", 시간: "time", 이름: "title", 종류: "kind", 장소: "place", 추가시간: "extra", 반영상태: "status", 담당자: "owner", 신청링크: "apply", 신청마감: "applyBy", 공지번호: "notices", 설명: "sub" },
    pins: { 보이기: "show", 종류: "type", 공지번호: "notice", 내용: "text", 시작: "from", 끝: "until", 링크: "link" },
    answers: { 질문번호: "id", 질문: "q", 확인: "check", 고친답: "fix", 확인한날: "date", 메모: "memo" },
  };
  // 표 → 줄마다 { _row: 시트의 줄 번호, 칸 이름: 글 }. 칸이 모두 빈 줄은 뺀다. missing: 머리글에 없는 칸
  function sheetRows(text, heads) {
    const all = parseCsv(text);
    if (!all.length) return { rows: [], missing: Object.keys(heads) };
    const idx = all[0].map((h) => heads[headKey(h)] || null);
    const missing = Object.keys(heads).filter((k) => !idx.includes(heads[k]));
    const rows = [];
    all.slice(1).forEach((cells, i) => {
      const o = { _row: i + 2 };
      let any = false;
      cells.forEach((v, j) => { const k = idx[j]; if (!k) return; const s = String(v).trim(); o[k] = s; if (s) any = true; });
      if (any) rows.push(o);
    });
    return { rows, missing };
  }

  /* ----- 값 읽기 ----- */
  const pad = (n) => String(n).padStart(2, "0");
  const NO = /^(아니요|아니오|아니|no|n|false|x|숨김|숨기기)$/i;
  const yes = (v) => !NO.test(String(v || "").trim()); // 비어 있으면 보인다
  const DATE_Y = /^(\d{4})\s*[-./년]\s*(\d{1,2})\s*[-./월]\s*(\d{1,2})\s*일?/;
  const DATE_MD = /^(\d{1,2})\s*[-./월]\s*(\d{1,2})\s*일?/;
  // 날짜 → "2026-11-18". 2026-11-18 · 2026. 11. 18 · 2026/11/18 · 11/18 · 11월 18일 (뒤에 요일 · 시각이 붙어도 됨). 못 읽으면 ""
  function toDate(v, year = new Date().getFullYear()) {
    const s = String(v || "").trim();
    let m = s.match(DATE_Y), y, mo, d;
    if (m) { y = +m[1]; mo = +m[2]; d = +m[3]; } else if ((m = s.match(DATE_MD))) { y = year; mo = +m[1]; d = +m[2]; } else return "";
    const dt = new Date(y, mo - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d ? `${y}-${pad(mo)}-${pad(d)}` : "";
  }
  // 날짜 · 시각 → 그 순간(ms). 시각이 없으면 시작은 그날 0시, 끝(end)은 그날 23:59. 못 읽으면 NaN
  //   "2026-11-23 09:00" · "2026. 11. 23 오전 9:00:00" · "11/23 14:00" · "2026-11-20"
  function toStamp(v, { end = false, year } = {}) {
    const s = String(v || "").trim(), date = toDate(s, year);
    if (!date) return NaN;
    const [y, mo, d] = date.split("-").map(Number);
    const rest = s.replace(DATE_Y, "").replace(DATE_MD, "");
    const tm = rest.match(/(오전|오후|am|pm)?\s*(\d{1,2}):(\d{2})/i);
    if (!tm) return end ? new Date(y, mo - 1, d, 23, 59, 59, 999).getTime() : new Date(y, mo - 1, d).getTime();
    let h = +tm[2];
    const ap = (tm[1] || "").toLowerCase();
    if ((ap === "오후" || ap === "pm") && h < 12) h += 12;
    if ((ap === "오전" || ap === "am") && h === 12) h = 0;
    return new Date(y, mo - 1, d, h, +tm[3]).getTime();
  }
  // 추가 시간: 숫자면 시간 수("1." · "1,5" 도), "1시간 30분" 같은 글은 그대로 둔다(달력이 읽는다). 비면 null
  const toExtra = (v) => { const s = String(v || "").trim().replace(",", "."); if (!s) return null; return /^\d+(\.\d+)?\.?$/.test(s) ? parseFloat(s) : s; };
  const ints = (v) => String(v || "").split(/[^\d]+/).filter(Boolean).map(Number);
  const STATUS = { 예정: "예정", 반영중: "반영 중", 반영완료: "반영 완료", 완료: "반영 완료" };
  const statusOf = (v) => STATUS[String(v || "").replace(/\s+/g, "")] || "";
  const isUrl = (v) => /^https:\/\/\S+$/i.test(String(v || "").trim());
  const sq = (s) => String(s).replace(/\s+/g, "");

  /* ----- 탭마다 읽기 ----- */
  // 일정 탭 → 운영표 줄들. kinds: [{ id, name }] (행사 종류 + 시험 · 마감 · 운영), notices: 공지 (번호 확인용)
  function readSchedule(text, { kinds = [], notices = [] } = {}) {
    const { rows, missing } = sheetRows(text, HEADS.schedule), problems = [], items = [];
    const P = (row, msg) => problems.push({ tab: "일정", row, msg });
    const need = ["날짜", "이름"].filter((k) => missing.includes(k));
    // 머리글이 깨졌으면 줄을 읽지 않고(broken) 달력은 data.js 의 운영표를 그대로 쓴다 — 달력이 통째로 비지 않게
    if (need.length) { P(1, `머리글 줄에 ${need.join(" · ")} 칸이 없습니다. 머리글 이름은 바꾸지 말아 주세요 (그동안 달력은 원래 내용으로 나옵니다)`); return { items: [], hidden: 0, problems, broken: true }; }
    let hidden = 0;
    for (const r of rows) {
      if (!yes(r.show)) { hidden++; continue; }
      if (!r.title) { P(r._row, "이름이 비어 있어 뺐습니다"); continue; }
      const date = toDate(r.date);
      if (!date) { P(r._row, `날짜를 읽지 못해 뺐습니다: "${r.date || ""}" (2026-11-18 꼴로 적어 주세요)`); continue; }
      let kind = (kinds.find((k) => sq(k.name) === sq(r.kind || "")) || {}).id;
      if (!kind) { kind = "ops"; if (r.kind) P(r._row, `종류 "${r.kind}"는 목록에 없어 '운영'으로 넣었습니다`); }
      const ns = ints(r.notices).filter((id) => { const ok = notices.some((n) => n.id === id); if (!ok) P(r._row, `공지 번호 ${id}는 사이트에 없어 링크를 뺐습니다`); return ok; });
      const status = statusOf(r.status);
      if (r.status && !status) P(r._row, `반영 상태 "${r.status}"는 목록에 없어 비워 두었습니다 (예정 · 반영 중 · 반영 완료)`);
      const extra = toExtra(r.extra);
      if (status && !extra) P(r._row, "반영 상태가 있는데 추가 시간이 비어 있습니다");
      let apply = r.apply || "";
      if (apply && !isUrl(apply)) { P(r._row, "신청 링크는 https:// 로 시작해야 해서 뺐습니다"); apply = ""; }
      items.push({ date, title: r.title, kind, time: r.time || "", place: r.place || "", extra, status, owner: r.owner || "", apply, applyBy: r.applyBy || "", notices: ns, sub: r.sub || "", fromSheet: true, row: r._row });
    }
    return { items, hidden, problems };
  }
  // 고정·알림 탭 → 고정할 공지와 맨 위 알림. state: on(나오는 중) · soon(시작 전) · ended(끝남) · hidden(보이기 아니요)
  function readPins(text, { notices = [], now = Date.now() } = {}) {
    const { rows, missing } = sheetRows(text, HEADS.pins), problems = [], pins = [], alerts = [];
    const P = (row, msg) => problems.push({ tab: "고정·알림", row, msg });
    const need = ["종류", "공지번호", "끝"].filter((k) => missing.includes(k));
    if (need.length) { P(1, `머리글 줄에 ${need.join(" · ")} 칸이 없습니다. 머리글 이름은 바꾸지 말아 주세요 (그동안 고정은 원래대로 둡니다)`); return { pins, alerts, problems, broken: true }; }
    for (const r of rows) {
      const type = /알림/.test(r.type || "") ? "alert" : /고정/.test(r.type || "") ? "pin" : "";
      if (!type) { P(r._row, `종류 "${r.type || ""}"를 몰라 뺐습니다 (고정 · 알림)`); continue; }
      const from = r.from ? toStamp(r.from) : NaN, until = r.until ? toStamp(r.until, { end: true }) : NaN;
      if (r.from && isNaN(from)) P(r._row, `시작을 읽지 못해 바로 나오게 했습니다: "${r.from}"`);
      if (r.until && isNaN(until)) { P(r._row, `끝을 읽지 못해 뺐습니다: "${r.until}" (2026-11-23 09:00 꼴로 적어 주세요)`); continue; }
      const nid = ints(r.notice)[0], notice = nid && notices.some((n) => n.id === nid) ? nid : null;
      if (nid && !notice) P(r._row, `공지 번호 ${nid}는 사이트에 없습니다`);
      const state = !yes(r.show) ? "hidden" : !isNaN(from) && now < from ? "soon" : !isNaN(until) && now > until ? "ended" : "on";
      const base = { row: r._row, state, from: isNaN(from) ? null : from, until: isNaN(until) ? null : until, untilText: isNaN(until) ? "" : r.until };
      if (type === "pin") {
        if (!notice) { if (!nid) P(r._row, "고정할 공지 번호가 비어 있습니다"); continue; }
        pins.push({ ...base, notice });
      } else {
        if (!r.text) { P(r._row, "알림 내용이 비어 있어 뺐습니다"); continue; }
        if (!r.until && state === "on") P(r._row, "알림에 끝이 없어 계속 나옵니다. 끝을 적어 주세요");
        let link = r.link || "";
        if (link && !isUrl(link)) { P(r._row, "링크는 https:// 로 시작해야 해서 뺐습니다"); link = ""; }
        alerts.push({ ...base, text: r.text, notice, link, key: `${r.text}|${r.until || ""}` });
      }
    }
    return { pins, alerts, problems };
  }
  // 답 확인 탭 → 질문마다 { state: ok(맞음) · fixed(고친 답 있음) · fixing(고침인데 고친 답이 빔), fix, date }
  function readAnswers(text, { faqs = [] } = {}) {
    const { rows, missing } = sheetRows(text, HEADS.answers), problems = [], checks = {};
    const P = (row, msg) => problems.push({ tab: "답 확인", row, msg });
    const need = ["질문번호", "확인"].filter((k) => missing.includes(k));
    if (need.length) { P(1, `머리글 줄에 ${need.join(" · ")} 칸이 없습니다. 머리글 이름은 바꾸지 말아 주세요`); return { checks, problems, broken: true }; }
    for (const r of rows) {
      const c = sq(r.check || "");
      if (!c) continue; // 아직 확인하지 않은 줄
      const id = ints(r.id)[0];
      if (!id || !faqs.some((f) => f.id === id)) { P(r._row, `질문 번호 ${r.id || "(빈칸)"}는 사이트에 없습니다`); continue; }
      const state = /^맞/.test(c) ? "ok" : /^고/.test(c) ? (r.fix ? "fixed" : "fixing") : "";
      if (!state) { P(r._row, `확인 "${r.check}"는 목록에 없어 뺐습니다 (맞음 · 고침)`); continue; }
      const date = r.date ? toDate(r.date) : "";
      if (r.date && !date) P(r._row, `확인한 날을 읽지 못했습니다: "${r.date}"`);
      checks[id] = { state, fix: state === "fixed" ? r.fix : "", date, row: r._row };
    }
    return { checks, problems };
  }

  /* ----- 덧씌우기 ----- */
  const md = (date) => `${+date.slice(5, 7)}/${+date.slice(8, 10)}`;
  const hoursText = (v) => (typeof Calendar !== "undefined" ? Calendar.hoursText(Calendar.hours(v)) : `${v}시간`);
  // texts: { schedule, pins, answers } 의 CSV 글(못 읽은 탭은 null) → 탭마다 읽은 결과
  function digest(texts, { kinds = [], notices = [], faqs = [], now = Date.now() } = {}) {
    const read = {};
    if (texts.schedule != null) read.schedule = readSchedule(texts.schedule, { kinds, notices });
    if (texts.pins != null) read.pins = readPins(texts.pins, { notices, now });
    if (texts.answers != null) read.answers = readAnswers(texts.answers, { faqs });
    return read;
  }
  // 읽은 것을 data.js 자료에 덧씌운다 (읽힌 탭만). g = { NOTICES, FAQS, OPS_SCHEDULE, statusFaq }
  function apply(read, g) {
    if (read.schedule && !read.schedule.broken && g.OPS_SCHEDULE) g.OPS_SCHEDULE.splice(0, g.OPS_SCHEDULE.length, ...read.schedule.items);
    if (read.pins && !read.pins.broken) {
      const on = new Map(read.pins.pins.filter((p) => p.state === "on").map((p) => [p.notice, p]));
      for (const n of g.NOTICES) { const p = on.get(n.id); n.pinned = !!p; n.pinUntil = p ? p.untilText : ""; }
    }
    if (read.answers && !read.answers.broken) {
      for (const f of g.FAQS) {
        const c = read.answers.checks[f.id];
        if (!c) { delete f.ops; continue; }
        f.ops = { state: c.state, date: c.date };
        if (c.state === "fixed") { f.aBefore = f.aBefore || f.a; f.a = c.fix; }
      }
    }
    // 반영 상태가 적힌 행사를 '운영진 추가 시간' 질문의 답 끝에 표로 붙인다 (그 질문을 찾은 챗봇도 이 표로 답한다)
    const sf = read.schedule && !read.schedule.broken && g.statusFaq != null ? g.FAQS.find((f) => f.id === g.statusFaq) : null;
    if (sf) {
      const done = read.schedule.items.filter((it) => it.status && it.extra).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)).slice(0, 8);
      sf.aBase = sf.aBase || sf.a;
      sf.a = done.length
        ? `${sf.aBase}\n\n# 최근 행사의 추가 시간 반영 (운영진 입력판)\n| 날짜 | 행사 | 추가 시간 | 반영\n${done.map((it) => `| ${md(it.date)} | ${it.title.replace(/\|/g, "/")} | ${hoursText(it.extra)} | ${it.status}`).join("\n")}`
        : sf.aBase;
    }
  }

  /* ----- 읽기 (브라우저) ----- */
  const csvUrl = (key, gid) => `https://docs.google.com/spreadsheets/d/e/${key}/pub?gid=${gid}&single=true&output=csv`;
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 저장 못 해도 사이트는 그대로 */ } },
  };
  // 세 탭을 함께 읽는다. 하나가 실패해도 나머지는 쓴다 (실패한 탭은 null). 모두 실패하면 null
  async function fetchAll(cfg, timeout) {
    const ctl = typeof AbortController === "undefined" ? null : new AbortController();
    const timer = setTimeout(() => ctl && ctl.abort(), timeout);
    const get = (gid) => (!gid ? Promise.resolve(null) : fetch(csvUrl(cfg.key, gid), { cache: "no-store", signal: ctl ? ctl.signal : undefined })
      .then((r) => (r.ok ? r.text() : null))
      .then((t) => (t == null || /^\s*</.test(t) ? null : t)) // 게시가 멈췄으면 CSV 대신 웹페이지가 온다
      .catch(() => null));
    try {
      const [schedule, pins, answers] = await Promise.all([get(cfg.gid.schedule), get(cfg.gid.pins), get(cfg.gid.answers)]);
      return schedule == null && pins == null && answers == null ? null : { schedule, pins, answers };
    } finally { clearTimeout(timer); }
  }

  let state = { source: "none", at: 0, read: {}, problems: [] };
  let cfg = null, ctx = null;
  // 페이지를 떠나는 중에 끊긴 읽기는 '못 읽음'으로 적지 않는다 (새로 고침 · 다른 주소로 가기)
  let leaving = false;
  if (typeof window !== "undefined") window.addEventListener("pagehide", () => { leaving = true; });
  const keep = (texts) => { const at = Date.now(); store.set(CACHE_KEY, { key: cfg.key, at, texts }); store.set(FAIL_KEY, 0); return at; };
  function use(texts, source, at, g) {
    const read = digest(texts, ctx);
    apply(read, g);
    const problems = [read.schedule, read.pins, read.answers].filter(Boolean).flatMap((x) => x.problems);
    state = { source, at, read, problems };
  }
  async function start(g) {
    cfg = g.OPS_SHEET;
    if (!cfg || !cfg.key || !cfg.gid) return state;
    ctx = { kinds: g.KINDS, notices: g.NOTICES, faqs: g.FAQS };
    const now = Date.now(), cache = store.get(CACHE_KEY), mine = cache && cache.key === cfg.key ? cache : null;
    const failedLately = now - (+store.get(FAIL_KEY) || 0) < FAIL_MS;
    if (mine && (now - mine.at < FRESH_MS || failedLately)) {
      use(mine.texts, "cache", mine.at, g);
      fetchAll(cfg, 8000).then((t) => { if (t) keep(t); }); // 다음에 열 때 쓰게 새로 읽어 둔다
      return state;
    }
    // 최근에 못 읽었고 저장해 둔 것도 없으면 기다리지 않고 data.js 로 그린다 (뒤에서 다시 읽어 둔다)
    if (failedLately) { fetchAll(cfg, 8000).then((t) => { if (t) keep(t); }); return state; }
    const got = await fetchAll(cfg, WAIT_MS);
    if (got) use(got, "sheet", keep(got), g);
    else {
      if (!leaving) store.set(FAIL_KEY, Date.now());
      if (mine) use(mine.texts, "cache", mine.at, g);
      fetchAll(cfg, 8000).then((t) => { if (t) keep(t); });
    }
    return state;
  }
  // 운영진용 화면의 '다시 읽기': 기다려서 새로 읽고, 읽었으면 저장해 두고 true (화면을 새로 고쳐 쓴다)
  async function refresh() {
    if (!cfg) return false;
    const t = await fetchAll(cfg, 10000);
    if (!t) return false;
    keep(t);
    return true;
  }

  const ready = typeof window === "undefined" ? Promise.resolve(state) : start({
    NOTICES, FAQS,
    OPS_SCHEDULE: typeof OPS_SCHEDULE === "undefined" ? null : OPS_SCHEDULE,
    OPS_SHEET: typeof OPS_SHEET === "undefined" ? null : OPS_SHEET,
    KINDS: [...(typeof EVENT_KINDS === "undefined" ? [] : EVENT_KINDS), ...(typeof SCHEDULE_KINDS === "undefined" ? [] : SCHEDULE_KINDS)],
    statusFaq: typeof OPS_SHEET === "undefined" ? null : OPS_SHEET.statusFaq,
  }).catch(() => state);

  return {
    ready, refresh,
    info: () => state,
    alerts: () => ((state.read.pins && state.read.pins.alerts) || []).filter((a) => a.state === "on"),
    editUrl: () => (cfg && cfg.edit) || "",
    // 시험용으로 꺼내 둔다
    parseCsv, headKey, toDate, toStamp, toExtra, readSchedule, readPins, readAnswers, digest, apply, csvUrl,
  };
})();
