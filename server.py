from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import os
PORT=8000
os.chdir(os.path.dirname(os.path.abspath(__file__)))
print(f"Open http://localhost:{PORT}")
ThreadingHTTPServer(("0.0.0.0", PORT), SimpleHTTPRequestHandler).serve_forever()
