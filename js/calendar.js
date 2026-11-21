/*
 * 이벤트 달력 — 일정 합치기와 달력 셈
 *   행사 공지(공지의 event) · 운영표(OPS_SCHEDULE) · 시험과 마감(SCHEDULE)을 한 목록으로 합치고,
 *   달력 칸 · 추가 시간 합계 · 담당자 거르기에 쓰는 값을 만든다.
 *   화면(DOM)을 건드리지 않는 순수 함수만 둔다. 그래서 node 로 시험할 수 있다: node tests/calendar-test.js
 */
const Calendar = (() => {
  const DOW = "일월화수목금토";
  const norm = (s) => String(s || "").toLowerCase().replace(/[^0-9a-z가-힣]/g, "");
  const pad = (n) => String(n).padStart(2, "0");
  const ymd = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
  const parse = (s) => { const [y, m, d] = String(s).split("-").map(Number); return new Date(y, m - 1, d); };
  const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s)) && ymd(parse(s).getFullYear(), parse(s).getMonth() + 1, parse(s).getDate()) === s;
  const monthOf = (date) => String(date).slice(0, 7); // "2026-11-20" → "2026-11"

  /* ----- 운영진 추가 시간 ----- */
  // 시간 수로 바꾼다: 3 → 3, "2시간" → 2, "1시간 30분" → 1.5. 적혀 있지 않거나 읽을 수 없으면 0 (지어내지 않는다)
  function hours(v) {
    if (typeof v === "number") return v > 0 ? v : 0;
    const t = String(v || ""), h = t.match(/(\d+(?:\.\d+)?)\s*시간/), m = t.match(/(\d+)\s*분/);
    return (h ? +h[1] : 0) + (m ? +m[1] / 60 : 0);
  }
  // 3 → "3시간", 1.5 → "1시간 30분"
  function hoursText(h) {
    const H = Math.floor(h + 1e-9), M = Math.round((h - H) * 60);
    return [H ? `${H}시간` : "", M ? `${M}분` : ""].filter(Boolean).join(" ") || "0시간";
  }
  // 달력 칸에 넣는 짧은 꼴: 3 → "+3h", 1.5 → "+1.5h"
  const hoursShort = (h) => `+${Math.round(h * 10) / 10}h`;

  /* ----- 합치기 ----- */
  // 하루에 한 번뿐인 종류: 날짜와 종류만 같으면 같은 일로 본다 (11/20 '시험' = '입학연수과정 시험 3차', '간식데이 3차' = '간식데이 3회차')
  const ONE_A_DAY = ["exam", "snack", "mission", "network", "job", "startup"];
  // 그 밖의 종류(세미나 · 마감 · 운영)는 같은 날 여러 개일 수 있어, 이름까지 겹쳐야 같은 일이다
  function same(a, b) {
    if (a.date !== b.date || a.kind !== b.kind) return false;
    if (ONE_A_DAY.includes(a.kind)) return true;
    const x = norm(a.title), y = norm(b.title);
    return !!x && !!y && (x.includes(y) || y.includes(x));
  }
  const startOf = (time) => { const m = String(time || "").match(/(\d{1,2}):(\d{2})/); return m ? +m[1] * 60 + +m[2] : 1e9; }; // 시각이 없으면 그날 맨 뒤
  // 같은 날 같은 일을 하나로. 먼저 온 쪽의 이름을 쓰고, 비어 있는 칸(시각 · 장소 · 추가 시간 · 반영 상태 · 담당자 · 설명 · 신청)만 뒤에 온 쪽으로 채운다
  function merge(list) {
    const out = [];
    for (const src of list) {
      if (!src || !isDate(src.date)) continue;
      let it = out.find((x) => same(x, src));
      if (!it) { it = { date: src.date, kind: src.kind, title: src.title, time: "", place: "", extra: 0, status: "", owner: "", sub: "", apply: "", applyBy: "", links: [], origins: [] }; out.push(it); }
      it.time = it.time || src.time || "";
      it.place = it.place || src.place || "";
      it.extra = it.extra || hours(src.extra);
      it.status = it.status || src.status || ""; // 추가 시간 반영 상태: 예정 · 반영 중 · 반영 완료 (운영진 입력판)
      it.owner = it.owner || String(src.owner || "").trim();
      it.sub = it.sub || src.sub || "";
      it.apply = it.apply || src.apply || "";       // 신청 링크 (운영진 입력판)
      it.applyBy = it.applyBy || src.applyBy || ""; // 신청 마감 (운영진 입력판)
      for (const l of src.links || []) if (l && !it.links.some((x) => x.href === l.href)) it.links.push(l);
      if (!it.origins.includes(src.origin)) it.origins.push(src.origin);
    }
    // 날짜 순, 같은 날은 시작 시각 순 (sort 는 순서를 지키므로 시각이 없는 것끼리는 들어온 순서 그대로)
    out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0) || (startOf(a.time) - startOf(b.time)));
    const seen = {};
    out.forEach((it) => { seen[it.date] = (seen[it.date] || 0) + 1; it.id = `${it.date}-${seen[it.date]}`; });
    return out;
  }

  // data.js 의 자료에서 합친 목록을 만든다.
  //   notices: 공지(그중 event 가 붙은 것이 행사), faqs: 질문, schedule: SCHEDULE, ops: OPS_SCHEDULE, opsSource: 운영표가 실린 공지 id
  // 합치는 순서는 행사 공지 → 운영표 → 시험 · 마감. 앞의 것이 이름을 정한다
  function build({ notices = [], faqs = [], schedule = [], ops = [], opsSource = null } = {}) {
    const nLink = (id) => { const n = notices.find((x) => x.id === id); return n ? { href: `#notice/${id}`, text: n.title, key: `n${id}` } : null; };
    const fLink = (id) => { const f = faqs.find((x) => x.id === id); return f ? { href: `#faq/${id}`, text: f.q, key: `f${id}` } : null; };
    const fests = notices.filter((n) => n.event).map((n) => ({
      origin: "fest", date: n.event.date, kind: n.event.kind, title: n.event.name || n.title,
      time: n.event.time, place: n.event.place, extra: n.event.extra, owner: n.event.owner, links: [nLink(n.id)],
    }));
    const table = ops.map((o) => ({
      origin: "ops", date: o.date, kind: o.kind, title: o.title, time: o.time, place: o.place, extra: o.extra, owner: o.owner,
      sub: o.sub, status: o.status, apply: o.apply, applyBy: o.applyBy,
      // 출처: 운영진 입력판(js/ops.js)에서 온 줄은 그 줄에 적힌 공지 번호들(notices),
      //       data.js 의 줄은 자세한 공지가 따로 있으면 그것 먼저, 그다음 운영표 공지
      links: Array.isArray(o.notices) ? o.notices.map(nLink)
        : [o.notice != null && o.notice !== opsSource ? nLink(o.notice) : null, opsSource != null ? nLink(opsSource) : null],
    }));
    const sched = schedule.map((s) => ({
      origin: "sched", date: s.date, kind: s.kind || (/시험/.test(s.title) ? "exam" : "deadline"), title: s.title, sub: s.sub,
      extra: s.extra, owner: s.owner, links: [s.notice != null ? nLink(s.notice) : s.faq != null ? fLink(s.faq) : null],
    }));
    return merge([...fests, ...table, ...sched]);
  }

  /* ----- 거르기 · 셈 ----- */
  // kind: 종류("all" 이면 전부), owner: 담당자 닉네임(빈 문자열이면 전부), q: 찾는 말(일정 이름 · 종류 이름 · 장소 · 담당자)
  function filter(items, { kind = "all", owner = "", q = "" } = {}, kindName = () => "") {
    const words = String(q || "").trim().split(/\s+/).map(norm).filter(Boolean);
    return items.filter((it) => {
      if (kind !== "all" && it.kind !== kind) return false;
      if (owner && it.owner !== owner) return false;
      if (!words.length) return true;
      const hay = norm([it.title, kindName(it.kind), it.place, it.owner, it.sub].join("|"));
      return words.every((w) => hay.includes(w));
    });
  }
  const onDay = (items, date) => items.filter((it) => it.date === date);
  const inMonth = (items, ym) => items.filter((it) => monthOf(it.date) === ym);
  const extraTotal = (items) => Math.round(items.reduce((s, it) => s + (it.extra || 0), 0) * 100) / 100;
  // 담당자 닉네임과 맡은 일정 수 (닉네임 순)
  function owners(items) {
    const n = {};
    for (const it of items) if (it.owner) n[it.owner] = (n[it.owner] || 0) + 1;
    return Object.keys(n).sort((a, b) => a.localeCompare(b, "ko")).map((name) => ({ name, n: n[name] }));
  }
  const months = (items) => [...new Set(items.map((it) => monthOf(it.date)))].sort();

  /* ----- 달력 ----- */
  // 한 달을 주 단위로: [[null, null, "2026-12-01", …7칸], …]. 일요일이 첫 칸
  function monthGrid(ym) {
    const [y, m] = ym.split("-").map(Number), first = new Date(y, m - 1, 1).getDay(), days = new Date(y, m, 0).getDate();
    const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => ymd(y, m, i + 1))];
    while (cells.length % 7) cells.push(null);
    return Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
  }
  const shiftMonth = (ym, by) => { const [y, m] = ym.split("-").map(Number), d = new Date(y, m - 1 + by, 1); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; };
  const shiftDay = (date, by) => { const d = parse(date); d.setDate(d.getDate() + by); return ymd(d.getFullYear(), d.getMonth() + 1, d.getDate()); };
  // 달력 칸은 좁아서, 이름 안에 종류 이름이 있으면 거기서부터만 쓴다: "입학연수과정 시험 3차" → "시험 3차".
  // 종류 이름으로 끝나서 남는 말이 없으면("Term-Project 제출 마감" → "마감") 뜻이 사라지므로 이름 그대로 둔다
  const shortTitle = (title, kindName) => {
    const t = String(title), i = kindName ? t.indexOf(kindName) : -1;
    return i > 0 && t.length - i > kindName.length ? t.slice(i) : t;
  };
  const monthTitle = (ym) => { const [y, m] = ym.split("-").map(Number); return `${y}년 ${m}월`; };
  // 화면 읽기 프로그램이 읽는 칸 이름: "11월 20일 금요일, 일정 2개, 추가 3시간" (items 는 그날의 일정)
  function dayLabel(date, items) {
    const d = parse(date), x = extraTotal(items);
    return `${d.getMonth() + 1}월 ${d.getDate()}일 ${DOW[d.getDay()]}요일, ${items.length ? `일정 ${items.length}개` : "일정 없음"}${x ? `, 추가 ${hoursText(x)}` : ""}`;
  }

  return { build, merge, same, filter, onDay, inMonth, extraTotal, owners, months, monthGrid, shiftMonth, shiftDay, monthTitle, monthOf, dayLabel, shortTitle, hours, hoursText, hoursShort, ymd, isDate, norm };
})();
