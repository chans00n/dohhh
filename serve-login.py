#!/usr/bin/env python3

"""
Simple HTTP server to serve the admin login helper
This avoids CORS issues when accessing the API
"""

import http.server
import socketserver
import os
import webbrowser

PORT = 8888
DIRECTORY = "/Users/chanson/MEDUSA"

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

print(f"🌐 Starting local server on http://localhost:{PORT}")
print(f"📁 Serving files from: {DIRECTORY}")
print("")
print("📝 Instructions:")
print(f"1. Open your browser to: http://localhost:{PORT}/admin-login-helper.html")
print("2. Login with your admin credentials")
print("3. Press Ctrl+C to stop the server when done")
print("")

# Start the server
with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
    # Try to open the browser automatically
    try:
        webbrowser.open(f'http://localhost:{PORT}/admin-login-helper.html')
    except:
        pass
    
    print(f"✅ Server running at http://localhost:{PORT}")
    print("   Waiting for requests...")
    httpd.serve_forever()