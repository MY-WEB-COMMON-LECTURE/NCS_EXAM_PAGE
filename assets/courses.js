/* 과목 목록.
 *
 * index.html 의 [설정 파일 저장] 이 이 파일을 덮어쓴다. 손으로 고쳐도 된다.
 * 고친 뒤 git 에 올려야 모두에게 적용된다.
 *
 *   id    : 과목 구분자 (page 가 있으면 그 페이지로 들어간다)
 *   name  : 과목명
 *   period: 기간
 *   hours : 시간
 *   page  : 들어갈 페이지. 비우면 '준비 중' 카드가 된다
 */
window.EXAM_COURSES = [
  {
    "id": "c1",
    "name": "(디지털 컨버전스) 공공데이터 융합 풀스택 개발자 양성과정E",
    "period": "2026-02-24 ~ 2026-08-12",
    "hours": "900시간",
    "page": "courses/c1.html"
  },
  {
    "id": "c2",
    "name": "정보처리산업기사 과정평가형",
    "period": "",
    "hours": "",
    "page": ""
  },
  {
    "id": "c3",
    "name": "빅데이터 UI 전문가 양성과정",
    "period": "",
    "hours": "",
    "page": ""
  }
];
