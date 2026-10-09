from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import webbrowser

HOST = "127.0.0.1"
PORT = 8000

if __name__ == "__main__":
    print(f"Portfolio running at http://{HOST}:{PORT}")
    print("Press Ctrl+C in this terminal to stop the server.")
    webbrowser.open(f"http://{HOST}:{PORT}")
    ThreadingHTTPServer((HOST, PORT), SimpleHTTPRequestHandler).serve_forever()
