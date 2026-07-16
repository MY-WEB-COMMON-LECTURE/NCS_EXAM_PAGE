/* 로그인과 보기 모드(관리자 / 일반) 관리.
 *
 * 계정
 *   user  : 들어오기만 한다
 *   admin : 들어오면서 관리자 모드가 된다
 * 비밀번호 원문은 두지 않고 SHA-256 해시만 비교한다.
 */
window.EXAM_AUTH = (function () {
  var IN = 'exam_in';        // 로그인 여부
  var KEY = 'exam_role';     // 보기 모드
  var H_USER = 'b4008f2e05d41c643ce8fd7a108fe8f32ec91d638e1d5e6f9fbbddcd69d166e3';
  var H_ADMIN = '90413c6e056b8b9e4327b4c07faa7ce334f89cab55b14ebc05c61faa4b950849';

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) { } }
  function del(k) { try { localStorage.removeItem(k); } catch (e) { } }

  async function sha256(s) {
    var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
    return [].map.call(new Uint8Array(buf), function (b) {
      return b.toString(16).padStart(2, '0');
    }).join('');
  }

  return {
    /* ---------- 로그인 ---------- */
    signedIn: function () { return get(IN) === '1'; },
    signIn: async function (user, pw) {
      if (!window.crypto || !crypto.subtle) return false;
      var h = await sha256(String(user).trim() + ':' + String(pw));
      if (h === H_ADMIN) { set(IN, '1'); set(KEY, 'admin'); return 'admin'; }
      if (h === H_USER) { set(IN, '1'); return 'user'; }
      return false;
    },
    signOut: function () { del(IN); del(KEY); },

    /* 로그인 안 했으면 첫 화면으로 돌려보낸다. up 은 index.html 까지의 상대 경로. */
    guard: function (up) {
      if (!this.signedIn()) { location.replace((up || '') + 'index.html'); return false; }
      return true;
    },

    /* ---------- 보기 모드 ---------- */
    role: function () { return get(KEY) === 'admin' ? 'admin' : 'student'; },
    isAdmin: function () { return this.role() === 'admin'; },
    login: async function (user, pw) {           // 관리자 모드로 전환
      if (!window.crypto || !crypto.subtle) return false;
      var h = await sha256(String(user).trim() + ':' + String(pw));
      if (h !== H_ADMIN) return false;
      set(KEY, 'admin');
      return true;
    },
    logout: function () { del(KEY); },           // 관리자 모드만 해제
    label: function () { return this.isAdmin() ? '관리자' : '일반(학생)'; }
  };
})();
