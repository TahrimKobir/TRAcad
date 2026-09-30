import os
from http.server import BaseHTTPRequestHandler
import json
from upstash_redis import Redis

# Connect to a free Upstash Redis database
redis = Redis(
    url=os.environ.get("UPSTASH_REDIS_REST_URL"),
    token=os.environ.get("UPSTASH_REDIS_REST_TOKEN")
)

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        # Increment the total PDF count by 1 in the database
        new_count = redis.incr("pdf_generation_count")
        
        # Return success response with updated count
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        response = {"success": True, "total_generated": new_count}
        self.wfile.write(json.dumps(response).encode())

    def do_GET(self):
        # Allow fetching current total count
        count = redis.get("pdf_generation_count") or 0
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        self.wfile.write(json.dumps({"total_generated": int(count)}).encode())
