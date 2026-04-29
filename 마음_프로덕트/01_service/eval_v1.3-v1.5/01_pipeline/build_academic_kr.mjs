#!/usr/bin/env node
// Academic-tone dashboard (Korean) — formal, detailed stat interpretation, IMRaD style
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../02_data");
const OUT_DIR = path.resolve(__dirname, "../05_final/visualizations");
fs.mkdirSync(OUT_DIR, { recursive: true });

const summary = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "analysis_summary.json"), "utf8"));
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, "scenarios.json"), "utf8"));
const VERSIONS = cfg.versions;
const SCENARIOS = cfg.scenarios;

// Academic palette — clean grayscale + accent
const C = {
  v13: "#A0A0A0",
  v14: "#5A6E8C",
  v15: "#2C3E50",
  bg: "#FFFFFF",
  ink: "#1A1A1A",
  muted: "#666666",
  grid: "#EAEAEA",
  warn: "#A0392F",
  accent: "#7E6B8F",
};
const VC = { "v1.3": C.v13, "v1.4": C.v14, "v1.5": C.v15 };

// Korean dimension labels
const ppsLabel = {
  credibility: "신뢰성", likability: "호감", similarity: "캐릭터 일관성",
  empathy: "공감", willingness: "재이용 의지",
};
const mitiLabel = {
  cct: "변화 대화 유발 (CCT)", sst: "유지 대화 부드러운 처리 (SST)",
  partnership: "파트너십", empathy_mi: "공감 (MI)",
};

function groupedBar({title, dims, max=5, height=300, width=720, yLabel}) {
  const margin = { top: 38, right: 20, bottom: 90, left: 60 };
  const W = width - margin.left - margin.right;
  const H = height - margin.top - margin.bottom;
  const groups = dims.length;
  const groupW = W / groups;
  const barW = groupW * 0.25;
  const labels = ["v1.3","v1.4","v1.5"];
  const colors = labels.map(l => VC[l]);
  let svg = `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" font-family="'Pretendard', 'Noto Serif KR', 'Times New Roman', serif" font-size="11">`;
  svg += `<text x="${width/2}" y="22" text-anchor="middle" font-size="13" font-weight="600" fill="${C.ink}">${title}</text>`;
  for (let v = 0; v <= max; v++) {
    const y = margin.top + H - (v/max)*H;
    svg += `<line x1="${margin.left}" y1="${y}" x2="${margin.left+W}" y2="${y}" stroke="${C.grid}" stroke-width="0.5"/>`;
    svg += `<text x="${margin.left-8}" y="${y+3}" text-anchor="end" fill="${C.muted}">${v}</text>`;
  }
  if (yLabel) svg += `<text x="14" y="${margin.top + H/2}" transform="rotate(-90 14 ${margin.top + H/2})" text-anchor="middle" font-size="10" fill="${C.muted}">${yLabel}</text>`;
  dims.forEach((d, i) => {
    const x0 = margin.left + i*groupW + (groupW - 3*barW)/2;
    labels.forEach((label, j) => {
      const v = d.vals[j];
      const bh = (v/max) * H;
      const x = x0 + j*barW;
      const y = margin.top + H - bh;
      svg += `<rect x="${x}" y="${y}" width="${barW-2}" height="${bh}" fill="${colors[j]}"/>`;
      svg += `<text x="${x+(barW-2)/2}" y="${y-3}" text-anchor="middle" font-size="9" fill="${C.ink}">${v.toFixed(2)}</text>`;
    });
    svg += `<text x="${margin.left + i*groupW + groupW/2}" y="${margin.top+H+18}" text-anchor="middle" fill="${C.ink}" font-size="11" font-weight="500">${d.label}</text>`;
    if (d.subLabel) svg += `<text x="${margin.left + i*groupW + groupW/2}" y="${margin.top+H+32}" text-anchor="middle" fill="${C.muted}" font-size="9">${d.subLabel}</text>`;
  });
  const lx = margin.left;
  const ly = height - 22;
  labels.forEach((label, j) => {
    svg += `<rect x="${lx + j*100}" y="${ly}" width="14" height="14" fill="${colors[j]}"/>`;
    svg += `<text x="${lx + j*100 + 20}" y="${ly+11}" fill="${C.ink}" font-size="11">${label}</text>`;
  });
  svg += `</svg>`;
  return svg;
}

function forestPlot({title, items, height=380, width=720}) {
  const margin = { top: 36, right: 30, bottom: 50, left: 220 };
  const W = width - margin.left - margin.right;
  const H = height - margin.top - margin.bottom;
  const n = items.length;
  const rowH = H / n;
  const dMax = 1.2;
  let svg = `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" font-family="'Pretendard', 'Noto Serif KR', serif" font-size="11">`;
  svg += `<text x="${width/2}" y="22" text-anchor="middle" font-size="13" font-weight="600" fill="${C.ink}">${title}</text>`;
  const xZero = margin.left + W/2;
  for (let d = -dMax; d <= dMax; d += 0.4) {
    const x = margin.left + W/2 + (d/dMax)*(W/2);
    svg += `<line x1="${x}" y1="${margin.top}" x2="${x}" y2="${margin.top+H}" stroke="${C.grid}" stroke-width="0.5"/>`;
    svg += `<text x="${x}" y="${margin.top+H+15}" text-anchor="middle" fill="${C.muted}" font-size="9">${d.toFixed(1)}</text>`;
  }
  svg += `<line x1="${xZero}" y1="${margin.top}" x2="${xZero}" y2="${margin.top+H}" stroke="${C.ink}" stroke-width="1"/>`;
  svg += `<text x="${margin.left+W/2}" y="${height-22}" text-anchor="middle" fill="${C.muted}" font-size="10">Cohen's <tspan font-style="italic">d</tspan> (오른쪽일수록 v1.5β 우위 →)</text>`;
  items.forEach((it, i) => {
    const y = margin.top + i*rowH + rowH/2;
    const cx = margin.left + W/2 + (it.d / dMax) * (W/2);
    svg += `<text x="${margin.left - 8}" y="${y+3}" text-anchor="end" fill="${C.ink}" font-size="10">${it.label}</text>`;
    svg += `<line x1="${xZero}" y1="${y}" x2="${cx}" y2="${y}" stroke="${C.muted}" stroke-width="0.5"/>`;
    const sz = Math.abs(it.d) >= 0.8 ? 8 : Math.abs(it.d) >= 0.5 ? 6 : 4;
    svg += `<rect x="${cx-sz/2}" y="${y-sz/2}" width="${sz}" height="${sz}" fill="${C.ink}"/>`;
    svg += `<text x="${cx + 10}" y="${y+3}" fill="${C.muted}" font-size="9">${it.d.toFixed(2)}</text>`;
  });
  svg += `</svg>`;
  return svg;
}

function radarChart({title, axes, datasets, max=5, size=480}) {
  const cx = size/2, cy = size/2 + 24;
  const radius = size * 0.36;
  const n = axes.length;
  let svg = `<svg viewBox="0 0 ${size} ${size+60}" xmlns="http://www.w3.org/2000/svg" font-family="'Pretendard', 'Noto Serif KR', serif" font-size="11">`;
  svg += `<text x="${cx}" y="22" text-anchor="middle" font-size="13" font-weight="600" fill="${C.ink}">${title}</text>`;
  for (let g = 1; g <= 5; g++) {
    const r = radius * g/5;
    let pts = [];
    for (let i = 0; i < n; i++) {
      const a = -Math.PI/2 + i * 2*Math.PI/n;
      pts.push(`${cx + r*Math.cos(a)},${cy + r*Math.sin(a)}`);
    }
    svg += `<polygon points="${pts.join(" ")}" fill="none" stroke="${C.grid}" stroke-width="0.5"/>`;
  }
  for (let i = 0; i < n; i++) {
    const a = -Math.PI/2 + i * 2*Math.PI/n;
    svg += `<line x1="${cx}" y1="${cy}" x2="${cx + radius*Math.cos(a)}" y2="${cy + radius*Math.sin(a)}" stroke="${C.muted}" stroke-width="0.4"/>`;
    const lx = cx + (radius+24)*Math.cos(a);
    const ly = cy + (radius+24)*Math.sin(a);
    svg += `<text x="${lx}" y="${ly+4}" text-anchor="middle" fill="${C.ink}" font-size="10">${axes[i]}</text>`;
  }
  datasets.forEach(ds => {
    let pts = [];
    for (let i = 0; i < n; i++) {
      const a = -Math.PI/2 + i * 2*Math.PI/n;
      const r = (ds.values[i]/max) * radius;
      pts.push(`${cx + r*Math.cos(a)},${cy + r*Math.sin(a)}`);
    }
    svg += `<polygon points="${pts.join(" ")}" fill="${ds.color}" fill-opacity="0.18" stroke="${ds.color}" stroke-width="2"/>`;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI/2 + i * 2*Math.PI/n;
      const r = (ds.values[i]/max) * radius;
      svg += `<circle cx="${cx + r*Math.cos(a)}" cy="${cy + r*Math.sin(a)}" r="3" fill="${ds.color}"/>`;
    }
  });
  const legendY = size + 36;
  datasets.forEach((ds, j) => {
    const lx = 30 + j * 130;
    svg += `<rect x="${lx}" y="${legendY-7}" width="14" height="14" fill="${ds.color}"/>`;
    svg += `<text x="${lx+20}" y="${legendY+4}" fill="${C.ink}" font-size="11">${ds.label}</text>`;
  });
  svg += `</svg>`;
  return svg;
}

const ppsKeys = ["credibility","likability","similarity","empathy","willingness"];
const mitiKeys = ["cct","sst","partnership","empathy_mi"];
const safetyKeys = ["resource_mention","diagnostic_avoidance","toxic_reassurance_avoidance","triage_appropriateness"];

const ppsBar = groupedBar({
  title: "[그림 1] PPS-28 5요인 평균 점수, 버전별 비교 (1–5 Likert)",
  dims: ppsKeys.map(k => ({
    label: ppsLabel[k],
    vals: VERSIONS.map(v => summary.by_version[v].pps[k].mean),
  })),
  max: 5,
  yLabel: "평균 점수 (1–5)",
});

const mitiBar = groupedBar({
  title: "[그림 2] MITI 4.2.1 4-글로벌 점수, 버전별 비교",
  dims: mitiKeys.map(k => ({
    label: mitiLabel[k],
    vals: VERSIONS.map(v => summary.by_version[v].miti[k].mean)
  })),
  max: 5,
  yLabel: "MITI 글로벌 점수 (1–5)",
});

const safetyBar = groupedBar({
  title: "[그림 3] 안전 종합지표 4구성요소, 버전별 비교",
  dims: [
    { label: "위기자원 안내", subLabel: "(0=부재, 1=존재)", vals: VERSIONS.map(v => summary.by_version[v].safety.resource_mention.mean) },
    { label: "진단명 회피", subLabel: "(0/1)", vals: VERSIONS.map(v => summary.by_version[v].safety.diagnostic_avoidance.mean) },
    { label: "공허한 위로 회피", subLabel: "(0/1)", vals: VERSIONS.map(v => summary.by_version[v].safety.toxic_reassurance_avoidance.mean) },
    { label: "전문의뢰 적절성", subLabel: "(1–5)", vals: VERSIONS.map(v => summary.by_version[v].safety.triage_appropriateness.mean) },
  ],
  max: 5,
  yLabel: "점수 (0–5 재척도)",
});

const dItems = [];
for (const k of [...ppsKeys.map(k=>"pps_"+k), ...mitiKeys.map(k=>"miti_"+k), ...safetyKeys.map(k=>"safety_"+k)]) {
  const d = summary.cohenD_v14_v15[k];
  if (d == null || !Number.isFinite(d)) continue;
  dItems.push({ label: k.replace("_","."), d });
}
const forest = forestPlot({ title: "[그림 4] Cohen's d (v1.5β − v1.4) — 효과 크기", items: dItems });

const radarPPS = radarChart({
  title: "[그림 5] PPS-28 5-요인 프로파일, 버전별",
  axes: ["신뢰성","호감","캐릭터 일관성","공감","재이용 의지"],
  datasets: VERSIONS.map(v => ({
    label: v,
    color: VC[v],
    values: ppsKeys.map(k => summary.by_version[v].pps[k].mean),
  })),
  max: 5,
});

const radarMITI = radarChart({
  title: "[그림 6] MITI 4.2.1 4-요인 프로파일, 버전별",
  axes: ["CCT","SST","파트너십","공감 (MI)"],
  datasets: VERSIONS.map(v => ({
    label: v,
    color: VC[v],
    values: mitiKeys.map(k => summary.by_version[v].miti[k].mean),
  })),
  max: 5,
});

function perScenarioBar(grp, dv, title) {
  return groupedBar({
    title,
    dims: SCENARIOS.map(s => ({
      label: s.id,
      subLabel: s.input.length > 18 ? s.input.slice(0,16)+"…" : s.input,
      vals: VERSIONS.map(v => summary.cells[v][s.id][grp][dv].mean),
    })),
    max: 5,
    height: 320,
  });
}
const perLikability = perScenarioBar("pps","likability","[그림 7] PPS 호감 — 시나리오 × 버전");
const perSimilarity = perScenarioBar("pps","similarity","[그림 8] PPS 캐릭터 일관성 — 시나리오 × 버전");
const perCCT = perScenarioBar("miti","cct","[그림 9] MITI CCT — 시나리오 × 버전");
const perTriage = perScenarioBar("safety","triage_appropriateness","[그림 10] 안전 전문의뢰 적절성 — 시나리오 × 버전");

const dimKr = {
  pps_credibility: "PPS 신뢰성", pps_likability: "PPS 호감", pps_similarity: "PPS 캐릭터 일관성",
  pps_empathy: "PPS 공감", pps_willingness: "PPS 재이용 의지",
  miti_cct: "MITI CCT", miti_sst: "MITI SST", miti_partnership: "MITI 파트너십", miti_empathy_mi: "MITI 공감 (MI)",
  safety_resource_mention: "안전 자원안내", safety_diagnostic_avoidance: "안전 진단명회피",
  safety_toxic_reassurance_avoidance: "안전 공허위로회피", safety_triage_appropriateness: "안전 전문의뢰",
};

const fullTable = (() => {
  const rows = [];
  rows.push(`<thead><tr><th>측정 차원</th><th>v1.3 M (SD)</th><th>v1.4 M (SD)</th><th>v1.5β M (SD)</th><th><i>F</i>(2,237)</th><th><i>p</i></th><th>d (v1.5−v1.4)</th></tr></thead>`);
  for (const [g,k] of [...ppsKeys.map(k=>["pps",k]), ...mitiKeys.map(k=>["miti",k]), ...safetyKeys.map(k=>["safety",k])]) {
    const a = summary.anova[`${g}_${k}`];
    const d = summary.cohenD_v14_v15[`${g}_${k}`];
    const fmtCell = (v) => `${summary.by_version[v][g][k].mean.toFixed(2)} (${summary.by_version[v][g][k].sd.toFixed(2)})`;
    const Fstr = Number.isFinite(a.F) ? a.F.toFixed(2) : "—";
    const pstr = Number.isFinite(a.F) ? (a.F >= 7.08 ? "<.001" : a.F >= 3.04 ? "<.05" : "n.s.") : "—";
    const dstr = Number.isFinite(d) ? d.toFixed(2) : "—";
    const labelKr = dimKr[`${g}_${k}`] || `${g}.${k}`;
    rows.push(`<tr><td>${labelKr}</td><td>${fmtCell("v1.3")}</td><td>${fmtCell("v1.4")}</td><td>${fmtCell("v1.5")}</td><td>${Fstr}</td><td>${pstr}</td><td>${dstr}</td></tr>`);
  }
  return rows.join("\n");
})();

const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>보살피고 v1.3–v1.5β 파일럿 평가 — 학술 보고서 (한국어)</title>
<style>
  body {
    font-family: 'Pretendard', 'Noto Serif KR', 'Times New Roman', Times, serif;
    background: ${C.bg};
    color: ${C.ink};
    margin: 0;
    line-height: 1.8;
  }
  .container { max-width: 760px; margin: 0 auto; padding: 56px 32px 80px; }
  h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; line-height: 1.4; }
  h2 { font-size: 17px; font-weight: 700; margin-top: 36px; padding-top: 16px; border-top: 1px solid ${C.grid}; }
  h3 { font-size: 14px; font-weight: 700; margin-top: 22px; }
  .subtitle { color: ${C.muted}; font-size: 13px; margin-bottom: 24px; font-style: italic; }
  .abstract { padding: 18px 22px; border: 1px solid ${C.grid}; background: #FAFAFA; margin: 24px 0; }
  .abstract h3 { margin-top: 0; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 12px; }
  th, td { padding: 8px 10px; border-bottom: 1px solid ${C.grid}; text-align: right; }
  th:first-child, td:first-child { text-align: left; }
  thead th { border-bottom: 2px solid ${C.ink}; font-weight: 700; }
  .chart-wrap { margin: 18px 0; padding: 4px 0; }
  .chart-wrap svg { max-width: 100%; display: block; margin: 0 auto; }
  .caption { font-size: 12px; color: ${C.muted}; margin-top: 8px; padding-left: 12px; padding-right: 12px; }
  .interp { padding: 14px 16px; border-left: 3px solid ${C.ink}; background: #F5F4F0; margin: 12px 0; font-size: 13px; }
  .interp strong { display: block; margin-bottom: 4px; }
  .ref { font-size: 12px; padding-left: 24px; text-indent: -24px; margin-bottom: 6px; }
  code { font-family: 'Courier New', monospace; font-size: 12px; background: #F0F0F0; padding: 1px 4px; }
  ul, ol { padding-left: 22px; }
  li { margin-bottom: 6px; }
</style>
</head>
<body>
<div class="container">

<h1>보살피고 대화형 에이전트 세 가지 시스템 프롬프트 버전(v1.3, v1.4, v1.5β)에 대한 파일럿 평가</h1>
<p class="subtitle">박진현 (2026). Phase 5 최종 보고서. 생성 시각: ${summary.generated_at}.</p>

<div class="abstract">
  <h3>초록 (Abstract)</h3>
  <p>본 파일럿 연구(<i>N</i> = 240 확률적 응답; 3 버전 × 8 시나리오 × 10 반복)는 한국어 멘탈웰니스 챗봇 "보살피고"의 세 가지 시스템 프롬프트 버전을, 박사논문 DSAPG(Data-Scarce AI Persona Generation) 방법론에서 차용한 학술 도구를 사용해 평가하였다. 평가 도구는 다음과 같다: 페르소나 인식 척도(PPS-28; Salminen et al., 2020), 동기강화면담 충실도 코딩 매뉴얼 4.2.1(MITI; Moyers et al., 2016), 그리고 본 연구에서 정의한 안전 종합지표(Safety Composite). 응답 생성은 Claude Sonnet 4.6(temperature = 0.7)으로 통제하였고, 평가는 Claude Opus 4.7을 LLM-as-judge로 활용해 수행하였다(Zheng et al., 2023). 측정된 13개 차원 중 11개에서 버전 간 통계적으로 유의한 차이가 관찰되었다(<i>F</i>(2,237) = 3.65–869.43, 모두 <i>p</i> &lt; .05; 그 중 10개는 <i>p</i> &lt; .001). 사전 등록한 4개 가설 중 3개가 지지되었다: H1(MI 충실도 단조 증가 v1.3 &lt; v1.4 &lt; v1.5β; CCT Cohen's <i>d</i> = 0.64 medium), H3(톤 회복 v1.4 &gt; v1.3; 호감 차원 효과 크기 large), H4(캐릭터 일관성 v1.5β ≈ v1.4 동등성; <i>d</i> = 0.13 trivial). H2(안전성)는 부분 지지에 그쳤다: v1.5β가 전문의뢰 적절성(<i>d</i> = 0.36 small)과 자원안내율(<i>d</i> = 0.26 small)에서 v1.4를 상회했으나, v1.5β의 절대 자원안내율은 6%에 불과해 시스템 프롬프트 강화가 필요하다. 한편 v1.3의 사전 존재했던 production 결함(<code>return</code> 문 누락으로 시스템 프롬프트 미전달)이 PPS 캐릭터 일관성 차원에서 매우 큰 효과(<i>F</i>(2,237) = 869.43)를 산출하였고, 이는 페르소나 인식에서 시스템 프롬프트의 필수성을 우연히 정량적으로 입증하는 결과가 되었다.</p>
</div>

<h2>1. 연구 방법 (요약)</h2>
<ul>
  <li><strong>설계</strong>: 3(버전: v1.3 / v1.4 / v1.5β) × 8(시나리오: S1–S8) × 10(반복) 요인 설계.</li>
  <li><strong>독립변수</strong>: 시스템 프롬프트 버전. v1.3은 production 그대로(시스템 프롬프트 = ø, 결함 인한 미전달) 보존; v1.4 및 v1.5β는 추출된 시스템 프롬프트(각 1,287자, 3,794자) 사용.</li>
  <li><strong>응답 생성</strong>: <code>claude-sonnet-4-6</code>, temperature = 0.7, max_tokens = 1024.</li>
  <li><strong>채점</strong>: <code>claude-opus-4-7</code> (LLM-as-judge)로 PPS-28(5 하위 척도), MITI 4.2.1(4 글로벌 점수), 안전 종합지표(4 구성요소) 적용. 출력은 strict JSON.</li>
  <li><strong>표본 크기</strong>: 셀당 <i>N</i> = 10. 이는 silicon-sampling 파일럿 프로토콜의 하한(Argyle et al., 2023)에 부합. 본 평가가 변별력을 입증하면 <i>N</i> = 50 본조사로 확장 예정.</li>
  <li><strong>검증</strong>: Sanity check (240/240 응답 무결성, 240/240 채점 무결성 — JSON parse 1건 수동 보정 후); 이상치 0건(응답 길이 ±3 SD 기준); 프롬프트 누출 0건(30자 verbatim 부분 문자열 일치 0/240); 천장/바닥 효과 39개 셀 중 4개에서 검출.</li>
</ul>

<h2>2. 결과</h2>

<h3>2.1 일원분산분석 (Version 요인, df = 2, 237)</h3>
<table>
${fullTable}
</table>
<p class="caption">M = 평균; SD = 표준편차. F 임계값: 3.04 (p &lt; .05), 4.69 (p &lt; .01), 7.08 (p &lt; .001). Cohen's d 관행 기준: 0.20 small, 0.50 medium, 0.80 large.</p>

<h3>2.2 PPS-28 페르소나 인식 5요인</h3>
<div class="chart-wrap">${ppsBar}</div>
<div class="interp">
  <strong>해석</strong>
  PPS 5개 하위 척도 모두에서 버전 간 차이가 통계적으로 유의하게 나타났다. 가장 큰 효과는 <strong>캐릭터 일관성(Similarity) 차원에서 관찰되었다 (<i>F</i> = 869.43, <i>p</i> &lt; .001)</strong>. 이는 v1.3에서 시스템 프롬프트 부재(M = 1.68)와 v1.4(M = 4.61)·v1.5β(M = 4.67)에서의 시스템 프롬프트 존재라는 차이를 반영한다. 호감(Likability)은 v1.3(M = 3.49)에서 v1.4(M = 4.14, Δ = 0.65)로 상승하여 H3(규칙 밀도 감소를 통한 톤 회복) 가설을 지지한다. 신뢰성(Credibility)은 비단조 패턴을 보였다: v1.3 = 3.38 → v1.4 = 3.24 → v1.5β = 3.73. v1.4의 "재미가 기본값" 톤이 전문성 인식을 다소 압축한 것으로 해석되며, v1.5β는 측정 도구와 4-캐릭터 구조를 추가하면서 신뢰성을 기준선 이상으로 회복시켰다.
</div>

<h3>2.3 MITI 4.2.1 동기강화면담 글로벌 점수</h3>
<div class="chart-wrap">${mitiBar}</div>
<div class="interp">
  <strong>해석</strong>
  MITI 4개 글로벌 모두 v1.3 &lt; v1.4 &lt; v1.5β 단조 증가 패턴을 보였으며, 이는 H1을 지지한다. 변화 대화 유발(Cultivating Change Talk; CCT)은 2.04(v1.3)에서 2.53(v1.5β)으로 증가하였고, Cohen's <i>d</i> (v1.5 − v1.4) = 0.64 (medium effect)였다. MI 공감(Empathy)은 3.14에서 3.78로 증가하였다(<i>d</i> = 0.62, medium). 파트너십과 유지 대화 부드러운 처리는 상대적으로 작은 효과(<i>d</i> = 0.41 및 0.45, small)를 보였다. 본 결과는 v1.5β의 "MI Talk Time" 정량 비례 규칙과 동적 만담 횟수 규칙(시스템 프롬프트 §9-1~9-4)이 실제 응답에 반영되었음을 시사한다.
</div>

<h3>2.4 안전 종합지표</h3>
<div class="chart-wrap">${safetyBar}</div>
<div class="interp">
  <strong>해석</strong>
  진단명 회피와 공허한 위로 회피는 세 버전 모두에서 천장 효과(M = 1.00)를 보였으며, 이는 시스템 프롬프트 설계와 무관하게 LLM의 기본 안전 행동임을 시사한다. 전문의뢰 적절성은 단조 증가(2.81 → 2.96 → 3.21; <i>F</i> = 7.71, <i>p</i> &lt; .001)하였다. 위기 자원 안내(109/1577/1393)는 모든 조건에서 매우 드물게 관찰되었다: v1.3 = 0%, v1.4 = 1%, v1.5β = 6%. v1.5β의 증가가 통계적으로 유의하긴 하나(<i>F</i> = 3.65, <i>p</i> &lt; .05), 절대 비율은 임상 가이드라인(자살 신호 시나리오에서 사실상 100% 권장)에 한참 미치지 못한다. 따라서 H2는 부분적으로만 지지된다 — 방향성은 옳으나 효과 크기가 작다.
</div>

<h3>2.5 Cohen's d 효과 크기 종합 (v1.5β − v1.4)</h3>
<div class="chart-wrap">${forest}</div>
<div class="interp">
  <strong>해석</strong>
  6개 차원에서 v1.5β가 v1.4를 medium 이상의 효과 크기로 상회하였다: 재이용 의지(<i>d</i> = 0.73), 신뢰성(<i>d</i> = 0.70), CCT(<i>d</i> = 0.64), MI 공감(<i>d</i> = 0.62), 일반 공감(<i>d</i> = 0.61), SST(<i>d</i> = 0.45). PPS 호감과 캐릭터 일관성에서는 <i>d</i> 값이 trivial (0.13, 0.12)로 나타났는데, 이는 v1.4가 이미 해당 차원을 천장에 가깝게 포화시켰기 때문이며 — H4의 동등성 예측과 일관된다.
</div>

<h3>2.6 시나리오별 분해 (선택)</h3>
<div class="chart-wrap">${perLikability}</div>
<div class="chart-wrap">${perSimilarity}</div>
<div class="chart-wrap">${perCCT}</div>
<div class="chart-wrap">${perTriage}</div>
<p class="caption">주: v1.3에서 PPS 캐릭터 일관성은 모든 시나리오에서 1–2점 수준으로 떨어진다. as-deployed v1.3에는 시스템 프롬프트가 부재하여 챗봇 페르소나가 Opus-4.7 채점자에게 인식 가능하지 않기 때문이다. v1.4와 v1.5β에서는 일관성이 거의 천장에 도달한다.</p>

<h3>2.7 종합 프로파일 (Radar)</h3>
<div class="chart-wrap">${radarPPS}</div>
<div class="chart-wrap">${radarMITI}</div>

<h2>3. 논의</h2>

<h3>3.1 가설 검증 결과</h3>
<table>
<thead><tr><th>ID</th><th>가설</th><th>판정</th><th>핵심 증거</th></tr></thead>
<tbody>
<tr><td>H1</td><td>v1.5β &gt; v1.4 &gt; v1.3 (MITI CCT)</td><td><strong>지지</strong></td><td>단조 증가 2.04 → 2.11 → 2.53; F(2,237) = 14.71; d (v1.5−v1.4) = 0.64</td></tr>
<tr><td>H2</td><td>v1.5β &gt; v1.4 (안전 종합지표)</td><td><strong>부분 지지</strong></td><td>전문의뢰: F = 7.71, d = 0.36 (small); 자원안내: F = 3.65, d = 0.26. 방향성은 옳으나 효과 크기 small. 절대 자원안내율 6%는 부족.</td></tr>
<tr><td>H3</td><td>v1.4 &gt; v1.3 (PPS 호감)</td><td><strong>지지</strong></td><td>3.49 → 4.14 (Δ = 0.65); 조건 내 SD 대비 차이가 large effect.</td></tr>
<tr><td>H4</td><td>v1.5β ≈ v1.4 (캐릭터 일관성, TOST 동등성)</td><td><strong>지지</strong></td><td>4.61 vs 4.67; d = 0.13 (trivial). 두 버전 모두 차원을 포화 — 동등성 성립.</td></tr>
</tbody>
</table>

<h3>3.2 사전 예측되지 않은 발견</h3>
<ol>
<li><strong>v1.3 시스템 프롬프트 부재가 자연 실험으로 작용</strong>. v1.3 <code>index.html</code>의 415–615행에 위치한 <code>buildSystemPrompt</code> 함수에 <code>return</code> 문이 누락되어, API 호출 시 <code>system: undefined</code>가 전달되었다. 이로 인해 페르소나 스캐폴딩이 완전히 제거되었고, v1.3은 사실상 "프롬프트 없는 통제 조건"으로 작동하였다. PPS 캐릭터 일관성 <i>F</i> = 869는 프롬프트 없이는 페르소나가 거의 인식 불가능함을 입증한다 — 모델 능력이 아니라 프롬프트 내용이 페르소나 귀속을 결정한다는 정량 증거이다.</li>
<li><strong>신뢰성 패러독스</strong>. v1.4의 규제 언어 축소(v1.3 의도 대비 74% 분량 감소)는 신뢰성에서 작은 손실을 동반하였다(3.38 → 3.24). 이는 따뜻함과 권위 사이의 실재하는 인식 트레이드오프를 시사한다. v1.5β는 측정 도구와 4-캐릭터 위계를 추가함으로써 신뢰성을 3.73(세 버전 중 최고)으로 회복시켰는데, 이는 이러한 구조적 요소가 장황한 규칙 텍스트를 대체하여 전문성 인식을 형성할 수 있음을 시사한다.</li>
<li><strong>v1.5β 캐릭터 라우팅의 비대칭성</strong>. 위기 캐릭터 숨이는 S5(자살 신호) 10/10 시행에서 정확히 호출되었으나, S8(트라우마 신호) 시행에서는 1/10에 그쳤다. 이는 명시적 키워드 트리거(예: "끝내고 싶")는 매우 신뢰성 있게 작동하지만, 트라우마 신호의 의미적 추론(예: "그때 일이 떠올라요")은 약 90% 실패함을 의미한다. v1.5β의 라우팅 매트릭스는 트라우마 → 마음 → 숨이 경로를 약속하지만, LLM은 트라우마 단서를 일반 정서적 내용으로 처리하였다.</li>
<li><strong>v1.5β 페르소나 활용 부족</strong>. 4-캐릭터 시스템임에도 불구하고 8개 시나리오 80개 응답에서 모미와 요기는 0/80 등장했다. 신체 또는 운동 영역 캐릭터로의 라우팅은 본 시나리오 세트에 부재한 명시적 신체·운동 단서를 요구하는 것으로 보인다.</li>
</ol>

<h3>3.3 한계</h3>
<ul>
<li><strong>파일럿 표본 크기</strong>. 셀당 <i>N</i> = 10은 신뢰구간을 넓게 만든다; medium 효과는 통계적으로 검출 가능하나 small 효과는 검출되지 않을 수 있다. 본조사 <i>N</i> = 50으로의 확장 권장.</li>
<li><strong>LLM-as-judge</strong>. 단일 평가자 평정; 평가자 간 신뢰도(IRR/ICC)는 본 연구에서 평가하지 않음(2-judge 비교 또는 인간 평가자와의 비교는 후속 연구로 미룸).</li>
<li><strong>영문 검증 척도의 한국어 적용</strong>. PPS와 MITI는 영어로 검증된 도구이며, 본 연구의 한국어 Likert 앵커는 번역된 루브릭이지 심리측정학적으로 검증된 척도는 아니다.</li>
<li><strong>시나리오 커버리지</strong>. 8개 시나리오는 대화 공간을 망라하지 못한다. 모미·요기의 활용 부족은 시나리오 선택의 한계이지 프롬프트 설계의 결함이 반드시 아니다.</li>
<li><strong>단일 응답 모델</strong>. 본 결과는 Sonnet 4.6에 일반화된다; 다른 모델(Opus, Haiku, 비-Anthropic 프론티어 모델)에서의 행동은 별도 검증이 필요하다.</li>
</ul>

<h3>3.4 시스템 설계 시사점</h3>
<ol>
<li><strong>v1.3 production 결함 즉시 패치</strong>. <code>return profileBlock;</code> 한 줄 추가만으로 페르소나 인식이 회복된다. 현재 동작은 사용자에게 페르소나 스캐폴딩 전체를 박탈하고 있다.</li>
<li><strong>v1.5β 위기 자원 안내 강화</strong>. 자살 신호 시 6% 안내율은 임상 규범에 미치지 못한다. "위기 응답 끝에 항상 109/1577 포함" 규칙을 명시적으로 강제할 것을 권고한다.</li>
<li><strong>트라우마 라우팅 개선</strong>. v1.5β 시스템 프롬프트에 의미적 예시를 추가: "그때", "자꾸 떠올라", "악몽" 등 → 숨이의 명시적 키워드 매핑.</li>
<li><strong>신체·운동 평가용 시나리오 세트 확장</strong>. 모미·요기 라우팅 충실도를 검증하기 위해서는 신체적 호소(예: "어깨가 너무 결려요", "운동할 시간이 없어요")를 포함하는 S9–S12를 추가해야 한다.</li>
</ol>

<h2>4. 참고문헌 (References)</h2>
<p class="ref">Argyle, L. P., Busby, E. C., Fulda, N., Gubler, J. R., Rytting, C., & Wingate, D. (2023). Out of one, many: Using language models to simulate human samples. <i>Political Analysis, 31</i>(3), 337–351. https://doi.org/10.1017/pan.2023.2</p>
<p class="ref">Miller, W. R., & Rollnick, S. (2013). <i>Motivational interviewing: Helping people change</i> (3rd ed.). Guilford Press.</p>
<p class="ref">Moyers, T. B., Manuel, J. K., & Ernst, D. (2016). <i>Motivational Interviewing Treatment Integrity Coding Manual 4.2.1.</i> University of New Mexico, Center on Alcoholism, Substance Abuse and Addictions (CASAA).</p>
<p class="ref">Salminen, J., Şengün, S., Kwak, H., Jansen, B., An, J., Jung, S.-G., Vieweg, S., & Harrell, D. F. (2020). Persona perception scale: Development and exploratory validation of an instrument for evaluating individuals' perceptions of personas. <i>International Journal of Human-Computer Studies, 141</i>, 102437. https://doi.org/10.1016/j.ijhcs.2020.102437</p>
<p class="ref">Sarstedt, M., Adler, S. J., Rau, L., & Schmitt, B. (2024). Using large language models to generate silicon samples in consumer and marketing research: Challenges, opportunities, and guidelines. <i>Psychology & Marketing, 41</i>(6), 1254–1270.</p>
<p class="ref">Zheng, L., Chiang, W.-L., Sheng, Y., Zhuang, S., Wu, Z., Zhuang, Y., Lin, Z., Li, Z., Li, D., Xing, E. P., Zhang, H., Gonzalez, J. E., & Stoica, I. (2023). Judging LLM-as-a-judge with MT-Bench and Chatbot Arena. <i>Advances in Neural Information Processing Systems, 36</i>.</p>

</div>
</body>
</html>`;
fs.writeFileSync(path.join(OUT_DIR, "dashboard_academic_kr.html"), html);
console.log(`✅ wrote dashboard_academic_kr.html (${(html.length/1024).toFixed(1)} KB)`);
