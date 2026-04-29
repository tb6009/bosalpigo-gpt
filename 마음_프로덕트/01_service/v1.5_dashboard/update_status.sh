#!/bin/bash
# v1.5 리서치 진척 상태 자동 갱신 스크립트
# 1초 간격으로 폴더의 .md 파일 수를 카운트해서 status.json 으로 출력

ROOT="/Users/jinhyunpark/Documents/cloude_Code/10-일상다반사"
DASH="$ROOT/마음_프로덕트/01_service/v1.5_dashboard"

T1_DIR="$ROOT/자료/04_캐릭터_학습자료/21_측정도구_평가척도/_가이드라인"
T2_DIR="$ROOT/자료/04_캐릭터_학습자료/21_측정도구_평가척도"
T3_DIR="$ROOT/자료/04_캐릭터_학습자료/20_숨이_트라우마와안정화"
T4_DIR="$ROOT/자료/04_캐릭터_학습자료/19_요기_몸과움직임"
T5_DIR="$ROOT/마음_프로덕트/01_service/13_v1.5_전문가자문_패키지"

# 목표 파일 수 (2라운드 누적 기준)
T1_TGT=14
T2_TGT=48
T3_TGT=25
T4_TGT=25
T5_TGT=8

count_md() {
  local dir="$1"
  if [ -d "$dir" ]; then
    find "$dir" -name "*.md" -type f 2>/dev/null | wc -l | tr -d ' '
  else
    echo 0
  fi
}

# T2는 _가이드라인 하위는 제외하고 카운트
count_t2() {
  if [ -d "$T2_DIR" ]; then
    find "$T2_DIR" -name "*.md" -type f -not -path "*_가이드라인*" 2>/dev/null | wc -l | tr -d ' '
  else
    echo 0
  fi
}

while true; do
  T1=$(count_md "$T1_DIR")
  T2=$(count_t2)
  T3=$(count_md "$T3_DIR")
  T4=$(count_md "$T4_DIR")
  T5=$(count_md "$T5_DIR")

  cat > "$DASH/status.json" <<EOF
{
  "tracks": {
    "T1": { "current": $T1, "target": $T1_TGT },
    "T2": { "current": $T2, "target": $T2_TGT },
    "T3": { "current": $T3, "target": $T3_TGT },
    "T4": { "current": $T4, "target": $T4_TGT },
    "T5": { "current": $T5, "target": $T5_TGT }
  },
  "updated_at": "$(date '+%Y-%m-%d %H:%M:%S')"
}
EOF
  sleep 1
done
