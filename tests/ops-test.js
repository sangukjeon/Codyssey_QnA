/*
 * 운영진 입력판 읽기 시험: node tests/ops-test.js
 * js/data.js · js/calendar.js · js/ops.js 를 브라우저와 같은 방식으로 불러와, 시트 CSV 를 읽고 검사하고 덧씌우는 것을 확인한다.
 * CSV 머리글은 실제로 게시한 입력판(2026-11-21)의 머리글을 그대로 쓴다. 하나라도 틀리면 종료 코드 1.
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const ctx = {};
vm.createContext(ctx);
for (const f of ["js/data.js", "js/calendar.js", "js/ops.js"]) {
  vm.runInContext(fs.readFileSync(path.join(root, f), "utf8").replace(/^const /gm, "var "), ctx, { filename: f });
}
const { OpsSheet, NOTICES, FAQS, EVENT_KINDS, SCHEDULE_KINDS, OPS_SHEET } = ctx;
const KINDS = [...EVENT_KINDS, ...SCHEDULE_KINDS];

let pass = 0;
const fails = [];
const check = (name, got, want) => {
  const a = JSON.stringify(got), b = JSON.stringify(want);
  if (a === b) pass++; else fails.push(`  ${name}\n    나온 값: ${a}\n    기대한 값: ${b}`);
};
const msgs = (r) => r.problems.map((p) => `${p.row}:${p.msg.split(/[:(]/)[0].trim()}`);

/* ---------- 칸 읽기 ---------- */
check("CSV: 따옴표 안의 쉼표 · 줄바꿈 · \"\"", OpsSheet.parseCsv('a,"b,c","d ""e"""\r\n1,"x\ny",\r\n'), [["a", "b,c", 'd "e"'], ["1", "x\ny", ""]]);
check("머리글 이름: 괄호 속 설명 · 띄어쓰기는 뺀다", ["추가 시간 (시간, 숫자)", "담당자 (디스코드 닉네임)", " 반영 상태 "].map(OpsSheet.headKey), ["추가시간", "담당자", "반영상태"]);
check("날짜 꼴 여러 가지", ["2026-11-18", "2026. 11. 18", "2026/11/18", "11/18", "11월 18일 (수)", "2026-11-31", "오늘", ""].map((v) => OpsSheet.toDate(v, 2026)),
  ["2026-11-18", "2026-11-18", "2026-11-18", "2026-11-18", "2026-11-18", "", "", ""]);
const at = (y, m, d, h = 0, mi = 0, s = 0, ms = 0) => new Date(y, m - 1, d, h, mi, s, ms).getTime();
check("날짜 · 시각", [
  OpsSheet.toStamp("2026-11-23 09:00"), OpsSheet.toStamp("2026. 11. 23 오후 2:30:00"), OpsSheet.toStamp("11/23 14:00", { year: 2026 }),
  OpsSheet.toStamp("2026-11-20", { end: true }), OpsSheet.toStamp("2026-11-20"),
], [at(2026, 11, 23, 9), at(2026, 11, 23, 14, 30), at(2026, 11, 23, 14), at(2026, 11, 20, 23, 59, 59, 999), at(2026, 11, 20)]);
check("읽을 수 없는 시각은 NaN", Number.isNaN(OpsSheet.toStamp("내일 아침")), true);
check("추가 시간 칸", ["1", "1.", "1.5", "1,5", "2시간", "", "  "].map(OpsSheet.toExtra), [1, 1, 1.5, 1.5, "2시간", null, null]);

/* ---------- 일정 탭 ---------- */
const SCH_HEAD = '보이기,날짜 (예: 2026-11-18),시간 (예: 16:00~17:00),이름,종류,장소,"추가 시간 (시간, 숫자)",반영 상태,담당자 (디스코드 닉네임),신청 링크 (https://…),신청 마감 (예: 2026-11-13 18:00),공지 번호 (여러 개면 쉼표),설명 (한 줄)';
const schCsv = [
  SCH_HEAD,
  "예,2026-11-18,16:00~17:00,텀 프로젝트 설명회,세미나,3층 컨퍼런스홀,1,예정,CodysseyDJ_모코코,,,24,",
  "예,2026-11-20,14:00 · 19:00,입학연수과정 시험 3차,시험,4 · 5층,3,반영 완료,,,,\"22, 24\",",
  "아니요,2026-11-19,,숨긴 줄,운영,,,,,,,,",
  "예,11월 32일,,잘못된 날,운영,,,,,,,,",
  "예,2026-11-21,,,,,,,,,,,",
  "예,2026-12-02,,미션데이 3차,모르는종류,,4시간,끝남,,http://example.com,11/30 18:00,99,선착순 50명",
  ",,,,,,,,,,,,",
].join("\r\n");
const sch = OpsSheet.readSchedule(schCsv, { kinds: KINDS, notices: NOTICES });
check("일정: 읽은 줄 3개, 숨긴 줄 1개", [sch.items.length, sch.hidden], [3, 1]);
check("일정: 칸 옮기기", sch.items.map((it) => [it.date, it.kind, it.extra, it.status, it.owner, it.notices]), [
  ["2026-11-18", "seminar", 1, "예정", "CodysseyDJ_모코코", [24]],
  ["2026-11-20", "exam", 3, "반영 완료", "", [22, 24]],
  ["2026-12-02", "ops", "4시간", "", "", []],
]);
check("일정: 셋째 줄의 신청 마감 · 설명, 고쳐야 할 신청 링크는 뺌", [sch.items[2].apply, sch.items[2].applyBy, sch.items[2].sub], ["", "11/30 18:00", "선착순 50명"]);
check("일정: 고칠 줄 알림 (줄 번호 · 무엇)", msgs(sch), [
  "5:날짜를 읽지 못해 뺐습니다", "6:이름이 비어 있어 뺐습니다",
  "7:종류 \"모르는종류\"는 목록에 없어 '운영'으로 넣었습니다", "7:공지 번호 99는 사이트에 없어 링크를 뺐습니다",
  "7:반영 상태 \"끝남\"는 목록에 없어 비워 두었습니다", "7:신청 링크는 https", 
]);
const brokenSch = OpsSheet.readSchedule("보이기,무언가\r\n예,1", { kinds: KINDS, notices: NOTICES });
check("일정: 머리글에 날짜 · 이름이 없으면 줄을 읽지 않고 한 번만 알림", [brokenSch.broken, brokenSch.problems.length, /날짜 · 이름 칸이 없습니다/.test(brokenSch.problems[0].msg)], [true, 1, true]);

/* ---------- 고정·알림 탭 ---------- */
const PIN_HEAD = '보이기,종류,공지 번호,내용 (알림에 나올 한 줄),"시작 (비우면 바로, 예: 2026-11-21 09:00)","끝 (비우면 계속, 예: 2026-11-23 09:00)","링크 (https://…, 선택)"';
const pinCsv = [
  PIN_HEAD,
  "예,알림,25,11월 23일(월) 오전 9시까지 팀과 소통이 없으면 Term-Project 팀에서 빠집니다.,,2026-11-23 09:00,",
  "예,고정,23,Term Project 팀 배정,,2026-11-26 14:00,",
  "예,고정,21,11월 20일 시험 안내,,2026-11-20,",
  "아니요,고정,8,안면인식 출결,,,",
  "예,알림,,다음 주 안내,2026-11-25 09:00,2026-11-26,https://discord.com/channels/1/2",
  "예,고정,,번호 없음,,,",
  "예,모름,3,무엇,,,",
  "예,알림,,끝이 엉터리,,내일 아침,",
  "예,알림,,끝이 없는 알림,,,",
].join("\r\n");
const NOW = at(2026, 11, 21, 22, 0);
const pin = OpsSheet.readPins(pinCsv, { notices: NOTICES, now: NOW });
check("고정: 공지 번호와 상태 (나오는 중 · 끝남 · 숨김)", pin.pins.map((p) => [p.notice, p.state, p.untilText]), [[23, "on", "2026-11-26 14:00"], [21, "ended", "2026-11-20"], [8, "hidden", ""]]);
check("알림: 상태 · 공지 · 링크", pin.alerts.map((a) => [a.state, a.notice, a.link]), [["on", 25, ""], ["soon", null, "https://discord.com/channels/1/2"], ["on", null, ""]]);
check("고정·알림: 고칠 줄 알림", msgs(pin), ["7:고정할 공지 번호가 비어 있습니다", "8:종류 \"모름\"를 몰라 뺐습니다", "9:끝을 읽지 못해 뺐습니다", "10:알림에 끝이 없어 계속 나옵니다. 끝을 적어 주세요"]);

/* ---------- 답 확인 탭 ---------- */
const ANS_HEAD = "질문 번호,질문 (사이트에서 가져옴),확인,고친 답 (고침일 때),확인한 날 (예: 2026-11-21),메모 (사이트에 안 나옴)";
const ansCsv = [
  ANS_HEAD,
  "1,출석 체크는 어떻게 하나요?,맞음,,2026-11-21,",
  "11,교육장은 몇 시까지 이용할 수 있나요?,고침,\"출입문은 밤 11시에 닫힙니다.\n- 바뀐 시간은 공지를 따릅니다.\",11/22,",
  "30,교육장에서 음식을 먹어도 되나요?,고침,,,",
  "999,없는 질문,맞음,,,",
  "4,아직 안 봄,,,,",
  "5,시험 시간,몰라,,,",
].join("\r\n");
const ans = OpsSheet.readAnswers(ansCsv, { faqs: FAQS });
check("답 확인: 맞음 · 고친 답 · 고치는 중", Object.entries(ans.checks).map(([id, c]) => [+id, c.state, c.date]), [[1, "ok", "2026-11-21"], [11, "fixed", `${new Date().getFullYear()}-11-22`], [30, "fixing", ""]]);
check("답 확인: 고칠 줄 알림", msgs(ans), ["5:질문 번호 999는 사이트에 없습니다", "7:확인 \"몰라\"는 목록에 없어 뺐습니다"]);

/* ---------- 덧씌우기 ---------- */
const clone = (x) => JSON.parse(JSON.stringify(x));
const g = { NOTICES: clone(NOTICES), FAQS: clone(FAQS), OPS_SCHEDULE: [{ date: "2026-11-01", title: "예전 운영표", kind: "ops" }], statusFaq: OPS_SHEET.statusFaq };
const read = OpsSheet.digest({ schedule: schCsv, pins: pinCsv, answers: ansCsv }, { kinds: KINDS, notices: NOTICES, faqs: FAQS, now: NOW });
OpsSheet.apply(read, g);
check("덧씌우기: 운영표가 일정 탭으로 바뀜", g.OPS_SCHEDULE.map((o) => o.title), ["텀 프로젝트 설명회", "입학연수과정 시험 3차", "미션데이 3차"]);
check("덧씌우기: 고정은 나오는 중인 것만 (끝난 21 · 숨긴 8 은 풀림)", g.NOTICES.filter((n) => n.pinned).map((n) => [n.id, n.pinUntil]), [[23, "2026-11-26 14:00"]]);
const fq = (id) => g.FAQS.find((f) => f.id === id);
check("덧씌우기: 질문 표시", [fq(1).ops, fq(11).ops.state, fq(30).ops.state, fq(4).ops], [{ state: "ok", date: "2026-11-21" }, "fixed", "fixing", undefined]);
check("덧씌우기: 고친 답으로 바뀌고 원래 답은 남겨 둠", [fq(11).a.startsWith("출입문은 밤 11시에"), fq(11).aBefore === FAQS.find((f) => f.id === 11).a], [true, true]);
const s63 = fq(OPS_SHEET.statusFaq);
check("덧씌우기: 반영 상태가 적힌 행사를 63번 답 끝에 표로 (최근 것부터)", s63.a.split("\n").filter((l) => /^\| \d/.test(l)), ["| 11/20 | 입학연수과정 시험 3차 | 3시간 | 반영 완료", "| 11/18 | 텀 프로젝트 설명회 | 1시간 | 예정"]);
OpsSheet.apply(read, g);
check("덧씌우기를 두 번 해도 표는 한 번", (s63.a.match(/최근 행사의 추가 시간 반영/g) || []).length, 1);
const g2 = { NOTICES: clone(NOTICES), FAQS: clone(FAQS), OPS_SCHEDULE: [{ date: "2026-11-01", title: "그대로", kind: "ops" }], statusFaq: 63 };
OpsSheet.apply(OpsSheet.digest({ schedule: null, pins: null, answers: null }, { kinds: KINDS, notices: NOTICES, faqs: FAQS }), g2);
const g3 = { NOTICES: clone(NOTICES), FAQS: clone(FAQS), OPS_SCHEDULE: [{ date: "2026-11-01", title: "그대로", kind: "ops" }], statusFaq: 63 };
OpsSheet.apply(OpsSheet.digest({ schedule: "보이기,무언가\r\n예,1", pins: "보이기,무언가", answers: "아무것\r\n1" }, { kinds: KINDS, notices: NOTICES, faqs: FAQS }), g3);
check("머리글이 깨진 탭도 건드리지 않음 (달력이 통째로 비지 않게)", [g3.OPS_SCHEDULE.map((o) => o.title), g3.NOTICES.filter((n) => n.pinned).length === NOTICES.filter((n) => n.pinned).length, g3.FAQS.some((f) => f.ops)], [["그대로"], true, false]);
check("못 읽은 탭은 건드리지 않음 (data.js 그대로)", [g2.OPS_SCHEDULE.map((o) => o.title), g2.NOTICES.filter((n) => n.pinned).length === NOTICES.filter((n) => n.pinned).length, g2.FAQS.some((f) => f.ops)], [["그대로"], true, false]);

/* ---------- 달력과 이어 보기 ---------- */
const cal = ctx.Calendar.build({ notices: g.NOTICES, faqs: g.FAQS, schedule: [], ops: g.OPS_SCHEDULE, opsSource: 24 });
check("달력: 입력판 줄의 반영 상태와 출처", cal.filter((x) => x.date === "2026-11-20" && x.kind === "exam").map((x) => [x.status, x.links.map((l) => l.href)]), [["반영 완료", ["#notice/22", "#notice/24"]]]);

console.log(`운영진 입력판 읽기 시험: 통과 ${pass}/${pass + fails.length}`);
if (fails.length) console.log("틀린 것:\n" + fails.join("\n"));
process.exitCode = fails.length ? 1 : 0;
