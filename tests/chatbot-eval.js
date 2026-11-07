/*
 * 챗봇 매칭 정확도 측정: node tests/chatbot-eval.js
 * js/data.js 와 js/matcher.js 를 브라우저와 같은 방식으로 불러와 질문 모음을 채점한다.
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const ctx = {};
vm.createContext(ctx);
for (const f of ["js/data.js", "js/matcher.js"]) {
  // const 로 선언된 전역도 context 에서 보이도록 var 로 바꿔 실행
  vm.runInContext(fs.readFileSync(path.join(root, f), "utf8").replace(/^const /gm, "var "), ctx, { filename: f });
}
const cases = require(process.argv[2] === "holdout" ? "./chatbot-holdout.js" : "./chatbot-cases.js");

let ok = 0, hinted = 0;
const fails = [];
for (const [q, want] of cases) {
  const r = ctx.Matcher.rank(q, ctx.FAQS);
  const got = r.best ? r.best.id : null;
  if (want === null && got === null && r.hints.length) fails.push(`  "${q}" → 엉뚱한 후보 ${r.hints.map((f) => f.id).join(",")} 제시   (정답: 답 없음)`);
  else if (got === want) ok++;
  else if (got === null && want !== null && r.hints.some((f) => f.id === want)) { hinted++; fails.push(`  "${q}" → 후보로 제시 (정답 ${want} 포함)`); }
  else fails.push(`  "${q}" → ${got === null ? "(답 없음)" : got + " " + r.best.q}   (정답: ${want === null ? "답 없음" : want})`);
}
console.log(`바로 맞힘 ${ok}/${cases.length} (${Math.round((ok / cases.length) * 100)}%), 후보로 제시 ${hinted}개 → 정답에 닿음 ${ok + hinted}/${cases.length} (${Math.round(((ok + hinted) / cases.length) * 100)}%)`);
if (fails.length) console.log("틀린 질문:\n" + fails.join("\n"));
process.exitCode = fails.length ? 1 : 0;
