/*
 * 챗봇 질문 매칭
 *   1) 같은 뜻 묶음(SYN)으로 줄임말·다른 말을 대표어로 바꿔 읽는다.
 *   2) 질문마다 붙은 키워드가 들어 있으면 점수. 단, '안되·언제·어디' 같은 흔한 말은 점수를 거의 주지 않는다.
 *   3) 질문 문장과 글자 두 개씩 묶어 겹치는 만큼 점수를 더한다 (활용형 차이를 흡수).
 *   4) 점수가 문턱(MIN_SCORE)보다 낮으면 답하지 않고, HINT_SCORE 이상인 질문을 "혹시 이 질문인가요?" 후보로 낸다.
 * 정확도 측정: node tests/chatbot-eval.js
 */
const Matcher = (() => {
  const norm = (s) => String(s).toLowerCase().replace(/[^0-9a-z가-힣]/g, "");

  // [같은 뜻의 말들, 대표어]
  const SYN = [
    [["밥", "식사", "먹", "음식", "간식", "취식", "음료", "마셔", "마시", "배달", "도시락", "커피"], "취식"],
    [["비번", "비밀번호", "패스워드"], "비밀번호"],
    [["와파", "wifi", "와이파이"], "와이파이"],
    [["엘베", "엘리베이터", "승강기", "호기"], "엘리베이터"],
    [["알바", "아르바이트", "파트타임"], "아르바이트"],
    [["장학금", "지원금", "장려금", "100만"], "장학금"],
    [["출첵", "출석", "출결", "입실"], "출결"],
    [["퍼실", "멘토링", "멘토"], "퍼실리테이터"],
    [["디코", "디스코드"], "디스코드"],
    [["밤새", "밤샘", "숙박", "취침", "자도", "자고", "잠자"], "숙박"],
    [["아파", "아프", "다쳤", "다치", "응급", "위급", "상비약", "병원"], "위급"],
    [["텀프", "텀프로젝트", "termproject"], "텀프로젝트"],
    [["재제출", "다시제출", "다시낼", "다시내"], "재제출"],
    [["락커", "사물함"], "사물함"],
    [["카톡", "카카오톡"], "카톡"],
    [["편의점", "외출", "나갔다", "나갔다와"], "외출"],
    [["차가져", "차끌고", "자차", "차량", "차타고"], "주차"],
    [["밤에", "밤늦", "새벽", "늦게까지", "밤까지"], "심야"],
    [["깔아", "깔면", "깔기", "깔아도"], "설치"],
    [["내노트북", "내컴퓨터", "개인pc", "내pc", "개인노트북", "노트북가져"], "개인노트북"],
    [["못써", "못쓰", "사용못", "이용못"], "못쓰"],
    [["비대면", "원격", "온라인", "디코로", "줌"], "원격"],
    [["지정석", "고정석", "자리정해"], "지정석"],
    [["닉네임", "별명", "디코이름", "디스코드이름"], "닉네임"],
    [["점수가안", "점수안", "채점이안", "채점안"], "채점"],
  ].map(([words, rep]) => [words.map(norm), norm(rep)]);

  // 거의 모든 질문에 나오는 말: 키워드로 맞아도 점수를 아주 조금만 준다
  const GENERIC = new Set(["안되", "안돼", "되나", "돼", "언제", "어디", "방법", "어떻게", "확인", "문의", "가능",
    "있나", "해도", "뭐", "시간", "교육장", "시험", "다시", "이용", "인정", "기록", "질문", "도움", "결과", "입력", "이름", "몇시", "차"].map(norm));

  // 글자 두 개 묶음 중 뜻이 없는 것(어미 등)은 비교에서 뺀다
  const STOP_BI = new Set(["어떻", "떻게", "나요", "해요", "되나", "있나", "인가", "가요", "을까", "는데", "하나", "해야",
    "할수", "수있", "있어", "어요", "하면", "되면", "되요", "돼요", "까지", "에서", "으로", "에게", "한테", "주세", "세요",
    "려면", "으면", "는지", "인지", "나는", "는거", "거야", "야해", "뭐야", "건가", "까요", "도돼", "써도", "해도", "어도"]);

  const expand = (t) => {
    let out = t;
    for (const [words, rep] of SYN) if (words.some((w) => t.includes(w))) out += "|" + rep;
    return out;
  };
  const bigrams = (t) => {
    const set = new Set();
    for (let i = 0; i < t.length - 1; i++) {
      const b = t.slice(i, i + 2);
      if (!STOP_BI.has(b)) set.add(b);
    }
    return set;
  };

  // 질문별로 미리 계산: 키워드(대표어 포함), 질문 문장의 두 글자 묶음
  const cache = new WeakMap();
  const prep = (f) => {
    if (cache.has(f)) return cache.get(f);
    const kws = new Set(f.keywords.map(norm).filter(Boolean));
    for (const [words, rep] of SYN) if ([...kws].some((k) => words.includes(k) || k === rep)) kws.add(rep);
    const p = { kws: [...kws], bi: bigrams(norm(f.q)) };
    cache.set(f, p);
    return p;
  };

  const MIN_SCORE = 3;   // 이 점수 이상이면 바로 답한다
  const HINT_SCORE = 2;   // 이 점수 이상이면 "혹시 이 질문인가요?" 후보로 보여 준다

  function score(t, qbi, f) {
    const p = prep(f);
    let kw = 0;
    for (const k of p.kws) if (t.includes(k)) kw += GENERIC.has(k) ? 0.5 : Math.min(k.length, 4) + 1;
    let bi = 0;
    for (const b of qbi) if (p.bi.has(b)) bi += 1.5;
    return { kw, total: kw + bi };
  }

  function rank(text, faqs) {
    const raw = norm(text);
    const t = expand(raw);
    const qbi = bigrams(raw);
    const all = faqs
      .map((f) => ({ f, ...score(t, qbi, f) }))
      .sort((a, b) => b.total - a.total || b.kw - a.kw || a.f.id - b.f.id);
    const ranked = all.filter((x) => x.total >= MIN_SCORE);
    const hints = ranked.length ? [] : all.filter((x) => x.total >= HINT_SCORE).slice(0, 3).map((x) => x.f);
    return { best: ranked[0] ? ranked[0].f : null, others: ranked.slice(1, 3).map((x) => x.f), hints, ranked };
  }

  return { rank, norm };
})();
