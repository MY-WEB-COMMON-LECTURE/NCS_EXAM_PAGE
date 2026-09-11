/* 공개용 배포본 만들기 — 페이지 본문을 암호화해서 내보냅니다.
 *
 *   node tools/publish.mjs --out ../NCS_EXAM_PAGE_PUB --password "비밀번호"
 *   node tools/publish.mjs                     (비밀번호를 물어봅니다)
 *
 * 하는 일
 *   1. 페이지가 부르는 데이터 js(items·locks·modules·courses)를 본문 안으로 옮깁니다
 *   2. 예시 이미지를 data URI 로 본문 안에 넣습니다 — 이미지 파일이 따로 공개되지 않게
 *   3. 한글 파일명을 영문으로 바꾸고 링크를 함께 고칩니다 (GitHub Pages 대비)
 *   4. 본문 전체를 AES-256-GCM 으로 암호화합니다
 *   5. 껍데기 HTML(잠금 화면 + 암호문)만 내보냅니다
 *
 * 배포본에 평문으로 남는 것은 site.css 와 gate.js 뿐이고, 둘 다 내용이 없습니다.
 * 비밀번호는 어디에도 저장하지 않습니다. 바꾸려면 다시 빌드하면 됩니다.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, rmSync, existsSync } from 'node:fs';
import { dirname, join, relative, sep, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
import crypto from 'node:crypto';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ITER = 200000;                    // gate.js 와 같아야 합니다

/* ── 인자 ───────────────────────────────────────────── */
const arg = (n, d) => {
  const i = process.argv.indexOf('--' + n);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : d;
};
const OUT = join(ROOT, arg('out', '../NCS_EXAM_PAGE_PUB'));

/* ── 내보낼 페이지 ──────────────────────────────────── */
const PAGES = [
  'index.html',
  ...readdirSync(join(ROOT, 'courses')).filter(f => f.endsWith('.html')).map(f => `courses/${f}`),
  ...(existsSync(join(ROOT, 'guides'))
    ? readdirSync(join(ROOT, 'guides')).filter(f => f.endsWith('.html')).map(f => `guides/${f}`) : []),
  ...readdirSync(join(ROOT, 'modules')).filter(f => f.endsWith('.html')).map(f => `modules/${f}`),
  /* plan/** 은 강사·심사용입니다. 채점 정답이 들어 있어 공개본에 넣지 않습니다. */
  ...readdirSync(join(ROOT, 'exam/dbms')).filter(f => f.endsWith('.html')).map(f => `exam/dbms/${f}`),
  ...readdirSync(join(ROOT, 'exam/m01')).filter(f => f.endsWith('.html')).map(f => `exam/m01/${f}`),
  'exam/m01/img/sample1/02_styleguide.html',
];

/* 한글 파일명 → 영문 (GitHub Pages 에서 한글 경로가 말썽인 경우가 있습니다) */
const RENAME = {
  '포트폴리오.html': 'portfolio.html',
  '채점판.html': 'scoring.html',
  '평가도구.html': 'tool.html',
};

const MIME = { '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.gif': 'image/gif' };

/* ── 본문 손질 ──────────────────────────────────────── */
function transform(rel, html) {
  const dir = posix.dirname(rel);
  const note = { js: 0, img: 0, bytes: 0 };

  // 1. 데이터 js 를 본문 안으로
  html = html.replace(
    /<script src="((?:\.\.\/)*assets\/(courses|items|locks|modules)\.js)"><\/script>/g,
    (_, src, name) => {
      const body = readFileSync(join(ROOT, 'assets', name + '.js'), 'utf8');
      note.js++;
      return '<script>\n' + body + '\n</script>';
    });

  // 2. 로그인 가드 제거 — 잠금 화면이 그 일을 대신합니다
  html = html.replace(/<script>\s*EXAM_AUTH\.guard\([^)]*\);?\s*<\/script>/g, '');

  // 3. 이미지를 data URI 로
  html = html.replace(/(data-aimg|src)="([^"]+\.(?:png|svg|jpg|gif))"/g, (all, attr, src) => {
    if (/^(https?:|data:)/.test(src)) return all;
    const file = join(ROOT, dir, src);
    if (!existsSync(file)) { console.warn('  ! 이미지 없음 ' + src); return all; }
    const buf = readFileSync(file);
    const ext = src.slice(src.lastIndexOf('.')).toLowerCase();
    note.img++; note.bytes += buf.length;
    return `${attr}="data:${MIME[ext] || 'application/octet-stream'};base64,${buf.toString('base64')}"`;
  });

  // 4. 한글 파일명 링크 고치기 (원본 · 퍼센트 인코딩 둘 다)
  for (const [ko, en] of Object.entries(RENAME)) {
    html = html.split(ko).join(en).split(encodeURIComponent(ko)).join(en);
  }
  return { html, note };
}

/* ── 껍데기 ─────────────────────────────────────────── */
function shell(depth, payload) {
  const up = '../'.repeat(depth);
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>평가 자료</title>
<link rel="stylesheet" href="${up}assets/site.css">
</head>
<body>
<div class="top"><div class="tbar"><div class="brand"><a href="${up}index.html">평가 자료</a><small>담당 정우균</small></div></div></div>
<div class="wrap">
  <div class="gate" id="lock" hidden>
    <form class="gbox" id="lf">
      <h2>로그인</h2>
      <input id="lp" type="password" placeholder="비밀번호" autocomplete="current-password" required>
      <label class="keep"><input id="lk" type="checkbox"> 이 브라우저에서 로그인 유지</label>
      <button type="submit">들어가기</button>
      <p class="gmsg" id="lm"></p>
    </form>
  </div>
</div>
<script type="application/json" id="pl">${JSON.stringify(payload)}</script>
<script src="${up}assets/gate.js"></script>
</body>
</html>
`;
}

/* ── 배포본 auth.js — 해시도 관리자 모드도 없습니다 ──── */
const AUTH_SHIM = `/* 배포본 전용. 잠금은 gate.js 가 맡으므로 여기서는 통과만 시킵니다.
 * 비밀번호 해시와 관리자 모드는 공개본에 넣지 않습니다. */
window.EXAM_AUTH = (function () {
  var SK = 'ncs_key';
  return {
    signedIn: function () { return true; },
    guard: function () { return true; },
    signIn: async function () { return 'user'; },
    login: async function () { return false; },
    logout: function () { },
    role: function () { return 'student'; },
    isAdmin: function () { return false; },
    label: function () { return '일반(학생)'; },
    signOut: function () {
      try { sessionStorage.removeItem(SK); localStorage.removeItem(SK); } catch (e) { }
    },
    paintTop: function (up) {
      var box = document.getElementById('tUser');
      if (!box) return;
      box.style.display = '';
      var name = document.getElementById('tName');
      if (name) name.textContent = this.label();
      var out = document.getElementById('tOut');
      if (out && !out.onclick) {
        var self = this;
        out.onclick = function () { self.signOut(); location.href = (up || '') + 'index.html'; };
      }
    }
  };
})();
`;

/* ── 빌드 ───────────────────────────────────────────── */
async function main() {
  let pass = arg('password', process.env.NCS_PUB_PW || '');
  if (!pass) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    pass = await rl.question('배포 비밀번호: ');
    rl.close();
  }
  if (!pass) { console.error('비밀번호가 없어 중단합니다.'); process.exit(1); }

  /* 솔트는 한 번 만들어 두고 계속 씁니다.
   * 빌드마다 새로 만들면 사람들이 저장해 둔 키가 전부 무효가 되어
   * 「로그인 유지」를 켜 두었어도 배포할 때마다 다시 로그인해야 합니다.
   * 솔트는 비밀이 아니라 사전 공격을 어렵게 하는 값이라 저장소에 두어도 됩니다. */
  const SALT_FILE = join(ROOT, 'tools/publish-salt.txt');
  let salt;
  if (existsSync(SALT_FILE)) {
    salt = Buffer.from(readFileSync(SALT_FILE, 'utf8').trim(), 'base64');
    console.log('솔트 재사용 — 저장해 둔 키가 그대로 유효합니다');
  } else {
    salt = crypto.randomBytes(16);
    writeFileSync(SALT_FILE, salt.toString('base64') + '\n');
    console.log('솔트를 새로 만들었습니다 → tools/publish-salt.txt');
  }
  const key = crypto.pbkdf2Sync(pass, salt, ITER, 32, 'sha256');
  console.log('키 준비 완료 (PBKDF2-SHA256 · ' + ITER + '회)\n');

  if (existsSync(OUT)) {
    for (const f of readdirSync(OUT)) {
      if (f === '.git') continue;
      rmSync(join(OUT, f), { recursive: true, force: true });
    }
  } else mkdirSync(OUT, { recursive: true });

  let total = 0;
  for (const rel of PAGES) {
    const src = join(ROOT, rel);
    if (!existsSync(src)) { console.warn('! 없음 ' + rel); continue; }
    const { html, note } = transform(rel, readFileSync(src, 'utf8'));

    const iv = crypto.randomBytes(12);
    const c = crypto.createCipheriv('aes-256-gcm', key, iv);
    const ct = Buffer.concat([c.update(html, 'utf8'), c.final(), c.getAuthTag()]);

    let outRel = rel;
    for (const [ko, en] of Object.entries(RENAME)) outRel = outRel.replace(ko, en);
    const dest = join(OUT, outRel);
    mkdirSync(dirname(dest), { recursive: true });
    const depth = outRel.split('/').length - 1;
    writeFileSync(dest, shell(depth, {
      salt: salt.toString('base64'), iv: iv.toString('base64'), ct: ct.toString('base64')
    }));

    total += ct.length;
    console.log('  ' + outRel.padEnd(44) +
      ' js ' + note.js +
      ' · 이미지 ' + note.img + (note.bytes ? ' (' + (note.bytes / 1024).toFixed(0) + 'K)' : '') +
      ' → ' + (ct.length / 1024).toFixed(0) + 'K');
  }

  mkdirSync(join(OUT, 'assets'), { recursive: true });
  writeFileSync(join(OUT, 'assets/site.css'), readFileSync(join(ROOT, 'assets/site.css')));
  writeFileSync(join(OUT, 'assets/gate.js'), readFileSync(join(ROOT, 'assets/gate.js')));
  writeFileSync(join(OUT, 'assets/auth.js'), AUTH_SHIM);
  writeFileSync(join(OUT, '.nojekyll'), '');
  writeFileSync(join(OUT, 'README.md'),
    '# NCS 평가 자료 (공개본)\n\n' +
    '`NCS_EXAM_PAGE` 저장소에서 `tools/publish.mjs` 로 만들어 낸 배포본입니다.\n' +
    '페이지 본문은 AES-256-GCM 으로 암호화되어 있고 비밀번호를 넣어야 열립니다.\n\n' +
    '**이 저장소를 직접 고치지 마세요.** 원본을 고친 뒤 다시 빌드해서 덮어씁니다.\n');

  console.log('\n페이지 ' + PAGES.length + '개 · 암호문 ' +
    (total / 1048576).toFixed(2) + 'MB\n→ ' + OUT);
}
main();
