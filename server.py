#!/usr/bin/env python3
"""
Enhanced HTTP Server for NFT Collection Creator
This script provides a more robust HTTP server with proper MIME types
and better error handling than the standard http.server module.
"""

import http.server
import socketserver
import os
import sys
import webbrowser
from urllib.parse import urlparse
import mimetypes

# Define supported MIME types for proper file serving
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('text/css', '.css')
mimetypes.add_type('image/svg+xml', '.svg')
mimetypes.add_type('image/png', '.png')
mimetypes.add_type('image/jpeg', '.jpg')
mimetypes.add_type('image/jpeg', '.jpeg')
mimetypes.add_type('image/gif', '.gif')
mimetypes.add_type('application/json', '.json')
mimetypes.add_type('text/html', '.html')
mimetypes.add_type('text/plain', '.txt')
mimetypes.add_type('application/font-woff', '.woff')
mimetypes.add_type('application/font-woff2', '.woff2')
mimetypes.add_type('application/vnd.ms-fontobject', '.eot')
mimetypes.add_type('font/ttf', '.ttf')

# Default port
PORT = 8080

# Custom request handler with improved MIME type detection
class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    # Map file extensions to MIME types
    extensions_map = {
        '': 'application/octet-stream',
        '.html': 'text/html',
        '.htm': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.ttf': 'font/ttf',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.eot': 'application/vnd.ms-fontobject',
        '.otf': 'font/otf',
        '.txt': 'text/plain',
        '.md': 'text/markdown',
    }
    
    def guess_type(self, path):
        """Guess the MIME type of a file based on its extension."""
        base, ext = os.path.splitext(path)
        if ext in self.extensions_map:
            return self.extensions_map[ext]
        ext = ext.lower()
        if ext in self.extensions_map:
            return self.extensions_map[ext]
        return self.extensions_map['']
    
    def log_message(self, format, *args):
        """Override log_message to include more information."""
        sys.stderr.write("[%s] %s - %s\n" %
                         (self.log_date_time_string(),
                          self.address_string(),
                          format % args))
    
    def do_GET(self):
        """Handle GET requests with additional error handling."""
        try:
            # Handle the root URL when accessed directly as an image source
            if self.path == '/' and 'image' in self.headers.get('Accept', ''):
                # Return 404 for missing images instead of placeholder
                self.send_response(404)
                self.send_header('Content-Type', 'text/plain')
                self.end_headers()
                self.wfile.write(b'Image not found')
                return
            
            # Default to index.html for root path in regular browser requests
            if self.path == '/' or self.path == '':
                self.path = '/index.html'
            
            # Handle favicon.ico request specifically
            if self.path == '/favicon.ico':
                # Simple base64 encoded favicon data (a 16x16 pixel black square with 'NFT' text)
                favicon_data = bytes.fromhex('0000010001001010000001002000680400001600000028000000100000002000000001000800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FFF1F1F1FFF1F1F1FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FFF1F1F1FFF1F1F1FFF1F1F1FF333333FF333333FFF1F1F1FFF1F1F1FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FFF1F1F1FFF1F1F1FFF1F1F1FFF1F1F1FF333333FFF1F1F1FFF1F1F1FFF1F1F1FF333333FF333333FFF1F1F1FFF1F1F1FFF1F1F1FFF1F1F1FFF1F1F1FF333333FFF1F1F1FFF1F1F1FF333333FFF1F1F1FFF1F1F1FF333333FFF1F1F1FFF1F1F1FF333333FF333333FFF1F1F1FFF1F1F1FF333333FF333333FF333333FF333333FF333333FFF1F1F1FFF1F1F1FF333333FFF1F1F1FFF1F1F1FF333333FFF1F1F1FFF1F1F1FF333333FF333333FFF1F1F1FFF1F1F1FF333333FF333333FF333333FF333333FF333333FFF1F1F1FFF1F1F1FF333333FFF1F1F1FFF1F1F1FF333333FFF1F1F1FFF1F1F1FF333333FF333333FFF1F1F1FFF1F1F1FFF1F1F1FFF1F1F1FFF1F1F1FF333333FFF1F1F1FFF1F1F1FF333333FFF1F1F1FFF1F1F1FF333333FFF1F1F1FFF1F1F1FFF1F1F1FFF1F1F1FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FFF1F1F1FFF1F1F1FF333333FFF1F1F1FFF1F1F1FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF333333FF')
                self.send_response(200)
                self.send_header('Content-Type', 'image/x-icon')
                self.send_header('Content-Length', str(len(favicon_data)))
                self.end_headers()
                self.wfile.write(favicon_data)
                return
            
            # Strip query parameters if any
            parsed_path = urlparse(self.path)
            self.path = parsed_path.path
            
            return http.server.SimpleHTTPRequestHandler.do_GET(self)
        except Exception as e:
            self.send_error(500, f"Server Error: {str(e)}")
            sys.stderr.write(f"Error handling request: {str(e)}\n")

def run_server(port=PORT):
    """Run the HTTP server on the specified port."""
    handler = CustomHTTPRequestHandler
    
    # Allow port reuse
    socketserver.TCPServer.allow_reuse_address = True
    
    # Create the server
    httpd = socketserver.TCPServer(("", port), handler)
    
    print(f"Starting NFT Collection Creator server on http://localhost:{port}")
    print("Press Ctrl+C to stop the server")
    
    # Open browser automatically
    webbrowser.open(f"http://localhost:{port}")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
    finally:
        httpd.server_close()
        print("Server stopped.")

if __name__ == "__main__":
    # Use command line port if provided
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print(f"Invalid port: {sys.argv[1]}, using default port {PORT}")
            port = PORT
    else:
        port = PORT
    
    run_server(port) 