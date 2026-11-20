/*
 * 이벤트 달력 합치기 시험: node tests/calendar-test.js
 * js/data.js 와 js/calendar.js 를 브라우저와 같은 방식으로 불러와,
 *   1) 실제 자료(행사 공지 · 운영표 · 시험과 마감)를 합친 결과와
 *   2) 지어낸 보기 자료(담당자 닉네임처럼 아직 실제 자료에 없는 것)를
 * 확인한다. 하나라도 틀리면 종료 코드 1.
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const ctx = {};
vm.createContext(ctx);
for (const f of ["js/data.js", "js/calendar.js"]) {
  // const 로 선언된 전역도 context 에서 보이도록 var 로 바꿔 실행
  vm.runInContext(fs.readFileSync(path.join(root, f), "utf8").replace(/^const /gm, "var "), ctx, { filename: f });
}
const { Calendar, NOTICES, FAQS, SCHEDULE, OPS_SCHEDULE, OPS_SOURCE, EVENT_KINDS, SCHEDULE_KINDS } = ctx;

let pass = 0;
const fails = [];
const check = (name, got, want) => {
  const a = JSON.stringify(got), b = JSON.stringify(want);
  if (a === b) pass++; else fails.push(`  ${name}\n    나온 값: ${a}\n    기대한 값: ${b}`);
};

/* ---------- 1) 실제 자료 ---------- */
const CAL = Calendar.build({ notices: NOTICES, faqs: FAQS, schedule: SCHEDULE, ops: OPS_SCHEDULE, opsSource: OPS_SOURCE });
const day = (d) => Calendar.onDay(CAL, d);
const nov = Calendar.inMonth(CAL, "2026-11");
const kinds = [...EVENT_KINDS, ...SCHEDULE_KINDS].map((k) => k.id);

// 같은 날 같은 일은 한 번만 (R2)
// 같은 날에 다른 일정(예: Term-Project 시작)이 더 실려도 깨지지 않게, 종류마다 한 번인지를 센다
const exam20 = day("2026-11-20").find((x) => x.kind === "exam");
check("11/20 은 간식데이와 시험이 한 번씩만", ["snack", "exam"].map((k) => day("2026-11-20").filter((x) => x.kind === k).length), [1, 1]);
check("11/20 간식데이: 행사 공지 이름을 쓰고 운영표와 합쳐짐", day("2026-11-20").filter((x) => x.kind === "snack").map((x) => [x.title.replace(/⁠/g, ""), x.origins]), [["간식데이 3회차", ["fest", "ops"]]]);
check("11/20 시험: 운영표 이름을 쓰고 SCHEDULE 과 합쳐짐", day("2026-11-20").filter((x) => x.kind === "exam").map((x) => [x.title, x.origins]), [["입학연수과정 시험 3차", ["ops", "sched"]]]);
check("11/20 시험: SCHEDULE 의 한 줄 설명이 따라옴", /참석자 명단/.test(exam20.sub), true);
check("11/6 · 11/13 시험도 하루에 한 번", ["2026-11-06", "2026-11-13"].map((d) => day(d).filter((x) => x.kind === "exam").length), [1, 1]);
check("운영표의 모든 줄이 11월 달력에 있음", OPS_SCHEDULE.filter((o) => !nov.some((x) => Calendar.same(x, o))).map((o) => o.title), []);
check("운영표는 표 11줄(날짜 11개)에서 옴", new Set(OPS_SCHEDULE.map((o) => o.date)).size, 11);
check("같은 날 같은 종류가 겹쳐 남지 않음", CAL.filter((a) => CAL.some((b) => a !== b && Calendar.same(a, b))).map((x) => x.id), []);
check("11/26 은 컨퍼런스와 Term-Project 마감, 서로 다른 일", day("2026-11-26").map((x) => x.kind), ["ops", "deadline"]);
check("종류는 모두 정해진 것 중 하나", CAL.filter((x) => !kinds.includes(x.kind)).map((x) => x.title), []);

// 출처 (R2 · R3)
check("운영표에서 온 일정마다 '11월 운영 일정' 공지 링크", CAL.filter((x) => x.origins.includes("ops") && !x.links.some((l) => l.href === `#notice/${OPS_SOURCE}`)).map((x) => x.title), []);
check("11/20 시험: 참석자 명단 공지가 먼저, 운영표 공지가 다음", exam20.links.map((l) => l.href), ["#notice/22", `#notice/${OPS_SOURCE}`]);
check("12/31 사물함 마감은 질문 16으로 이어짐", day("2026-12-31").map((x) => [x.title, x.links.map((l) => l.href)]), [["사물함 비우기 마감", ["#faq/16"]]]);

// 예정 추가 시간 (R3)
check("11/18: 설명회 +1, 네트워킹 +2 (시작 시각 순)", day("2026-11-18").map((x) => [x.kind, x.extra]), [["seminar", 1], ["network", 2]]);
check("11/20 시험 +3", exam20.extra, 3);
check("11월 예정 추가 시간 합계 6시간", Calendar.extraTotal(nov), 6);
check("추가 시간이 적힌 일정은 셋뿐 — 나머지는 0 (지어내지 않음)", CAL.filter((x) => x.extra).length, 3);
check("12월 합계 0", Calendar.extraTotal(Calendar.inMonth(CAL, "2026-12")), 0);

// 담당자 (R4) — 아직 모으지 않았다
check("실제 자료에는 담당자 닉네임이 아직 없음", Calendar.owners(CAL), []);

// 달 (R1)
check("일정이 있는 달", Calendar.months(CAL), ["2026-11", "2026-12"]);
const grid = Calendar.monthGrid("2026-11");
check("2026년 11월: 5주, 30일, 1일은 일요일 칸", [grid.length, grid.flat().filter(Boolean).length, grid[0][0]], [5, 30, "2026-11-01"]);
check("11월 20일은 금요일 칸", grid.map((w) => w.indexOf("2026-11-20")).find((i) => i >= 0), 5);
check("12월 31일이 달력에 있음", Calendar.monthGrid("2026-12").flat().includes("2026-12-31"), true);
check("달 넘기기", [Calendar.shiftMonth("2026-11", 1), Calendar.shiftMonth("2026-12", 1), Calendar.shiftMonth("2026-01", -1)], ["2026-12", "2027-01", "2025-12"]);
check("날 넘기기 (달을 넘어감)", [Calendar.shiftDay("2026-11-30", 1), Calendar.shiftDay("2026-11-01", -1), Calendar.shiftDay("2026-11-20", 7)], ["2026-12-01", "2026-10-31", "2026-11-27"]);

// 칸 이름 (R7)
check("칸 이름: 11월 20일", Calendar.dayLabel("2026-11-20", day("2026-11-20").filter((x) => x.kind === "snack" || x.kind === "exam")), "11월 20일 금요일, 일정 2개, 추가 3시간");
check("칸 이름: 일정 없는 날", Calendar.dayLabel("2026-11-21", day("2026-11-21")), "11월 21일 토요일, 일정 없음");
check("날짜 꼴 확인", ["2026-11-20", "2026-11-31", "2026-13-01", "event"].map(Calendar.isDate), [true, false, false, false]);

check("칸 안 짧은 이름", [Calendar.shortTitle("입학연수과정 시험 3차", "시험"), Calendar.shortTitle("간식데이 3회차", "간식데이"), Calendar.shortTitle("텀 프로젝트 설명회", "세미나"), Calendar.shortTitle("Term-Project 제출 마감", "마감")], ["시험 3차", "간식데이 3회차", "텀 프로젝트 설명회", "Term-Project 제출 마감"]);

// 종류로 거르기 (R5)
const kindName = (id) => ([...EVENT_KINDS, ...SCHEDULE_KINDS].find((k) => k.id === id) || {}).name || "";
check("종류: 시험 3개", Calendar.filter(CAL, { kind: "exam" }, kindName).map((x) => x.date), ["2026-11-06", "2026-11-13", "2026-11-20"]);
check("찾기: '간식' 3개 · '컨퍼런스홀' 1개", [Calendar.filter(CAL, { q: "간식" }, kindName).length, Calendar.filter(CAL, { q: "컨퍼런스홀" }, kindName).length], [3, 1]);

/* ---------- 2) 보기 자료 (실제 자료에 아직 없는 경우) ---------- */
// 담당자 닉네임: 닉네임으로 거르면 그 사람 일정만 남는다 (R4). 닉네임은 시험용으로 지어낸 것
const sample = Calendar.build({
  notices: [{ id: 1, title: "보기 운영표" }],
  opsSource: 1,
  ops: [
    { date: "2026-11-03", title: "미션데이 1차", kind: "mission", owner: "보기닉A" },
    { date: "2026-11-10", title: "전문가 특강 1차", kind: "seminar", owner: "보기닉B", extra: 2 },
    { date: "2026-11-17", title: "미션데이 2차", kind: "mission", owner: "보기닉A", extra: "1시간 30분" },
    { date: "2026-11-18", title: "텀 프로젝트 설명회", kind: "seminar", owner: "" },
  ],
});
check("담당자 목록과 맡은 수", Calendar.owners(sample), [{ name: "보기닉A", n: 2 }, { name: "보기닉B", n: 1 }]);
check("닉네임으로 거르기: 보기닉A 2개", Calendar.filter(sample, { owner: "보기닉A" }).map((x) => x.title), ["미션데이 1차", "미션데이 2차"]);
check("닉네임 + 종류", Calendar.filter(sample, { owner: "보기닉A", kind: "seminar" }).length, 0);
check("찾는 말에 닉네임을 넣어도 찾음", Calendar.filter(sample, { q: "보기닉B" }).map((x) => x.title), ["전문가 특강 1차"]);
check("거른 뒤의 추가 시간 합계", Calendar.extraTotal(Calendar.filter(sample, { owner: "보기닉A" })), 1.5);

// 같은 날 세미나 둘은 이름이 달라 따로, 이름이 겹치면 하나로
const seminars = Calendar.merge([
  { origin: "ops", date: "2026-12-01", kind: "seminar", title: "취업 특강" },
  { origin: "ops", date: "2026-12-01", kind: "seminar", title: "텀 설명회" },
  { origin: "fest", date: "2026-12-01", kind: "seminar", title: "텀 설명회 (3층)", time: "16:00~17:00" },
]);
check("같은 날 다른 세미나는 따로, 같은 세미나는 하나로", seminars.map((x) => [x.title, x.time]), [["텀 설명회", "16:00~17:00"], ["취업 특강", ""]]);
check("날짜가 틀린 줄은 버림", Calendar.merge([{ origin: "ops", date: "2026-11-31", kind: "ops", title: "없는 날" }]).length, 0);

// 추가 시간 읽기 · 쓰기
check("추가 시간 읽기", [3, "2시간", "1시간 30분", "30분", "", undefined, "미정"].map(Calendar.hours), [3, 2, 1.5, 0.5, 0, 0, 0]);
check("추가 시간 쓰기", [3, 1.5, 0.5].map(Calendar.hoursText), ["3시간", "1시간 30분", "30분"]);
check("칸 안 짧은 꼴", [3, 1.5].map(Calendar.hoursShort), ["+3h", "+1.5h"]);

console.log(`달력 합치기 시험: 통과 ${pass}/${pass + fails.length}`);
if (fails.length) console.log("틀린 것:\n" + fails.join("\n"));
process.exitCode = fails.length ? 1 : 0;
