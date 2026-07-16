/* 모듈별 잠금 상태.  true = 잠김(일반은 평가내역을 못 연다)
 *
 * 이 파일이 모두에게 적용되는 기본값이다.
 * 관리자가 화면에서 바꾼 것은 그 브라우저에만 남으므로,
 * 학생에게도 열어 주려면 이 파일의 값을 고쳐서 올려야 한다.
 */
window.EXAM_LOCKS = {
  m01: true,  m02: true,  m03: true,  m04: true,  m05: true,  m06: true,
  m07: true,  m08: true,  m09: true,  m10: true,  m11: true,  m12: true,
  m13: true,  m14: true,  m15: true,
  m16: false,   // (비NCS 실기) 공공 데이터 융합 DBMS 구축 — 평가 자료 공개
  m17: true
};
