# -*- coding: utf-8 -*-
"""정적 파일 서버 — 저장소 루트를 그대로 서비스한다.

포트는 환경변수 PORT 를 따르고, 없으면 8899 를 쓴다.
실행기가 포트를 배정해 주는 경우(autoPort)를 위해 명령줄에 포트를 박아 두지 않는다.

    python tools/serve.py
"""
import functools
import http.server
import os
import socketserver
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(os.environ.get('PORT') or 8899)


class Handler(http.server.SimpleHTTPRequestHandler):
    """편집한 파일이 바로 보이도록 캐시를 끈다."""

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stderr.write('%s %s\n' % (self.address_string(), fmt % args))


def main():
    socketserver.TCPServer.allow_reuse_address = True
    handler = functools.partial(Handler, directory=ROOT)
    with socketserver.TCPServer(('127.0.0.1', PORT), handler) as httpd:
        print('serving %s at http://127.0.0.1:%d' % (ROOT, PORT), flush=True)
        httpd.serve_forever()


if __name__ == '__main__':
    main()
