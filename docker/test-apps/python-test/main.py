from http.server import HTTPServer, BaseHTTPRequestHandler
from datetime import datetime

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/plain')
        self.end_headers()
        message = f"Hello from Python! Time: {datetime.now().isoformat()}\n"
        self.wfile.write(message.encode())
    
    def log_message(self, format, *args):
        print(f"Python server: {format % args}")

if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', 8000), Handler)
    print('Python server running on port 8000')
    server.serve_forever()
