# tools

## hwptxt.py — HWP 5.0 본문 텍스트 추출기

평가도구·채점도구 `.hwp` 의 본문을 텍스트로 뽑는다.
HWP 5.0 은 OLE 복합문서이고 `BodyText/Section*` 스트림이 raw deflate 로 압축돼 있다.
`HWPTAG_PARA_TEXT`(67) 레코드만 골라 UTF-16LE 로 읽고, 확장/인라인 제어문자는 건너뛴다.

    pip install olefile
    python tools/hwptxt.py "경로/화면설계_평가도구(100점).hwp"

표 구조는 잃고 셀 내용만 순서대로 나온다. 평가도구 양식은 칸 순서가 고정이라 그대로 읽힌다.
