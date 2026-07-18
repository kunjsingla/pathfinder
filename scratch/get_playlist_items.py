import urllib.request
import re
import json

url = "https://www.youtube.com/playlist?list=PLu0W_9lII9agwh1XjRt242xIpHhPT2llg"
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
    
    # Let's search for matches of /watch?v=XXXX or "videoId":"XXXX"
    # Find all matches of /watch?v= followed by 11 chars
    matches = re.findall(r'/watch\?v=([a-zA-Z0-9_-]{11})', html)
    
    # Also find videoId from json fields in text
    matches_json = re.findall(r'"videoId"\s*:\s*"([a-zA-Z0-9_-]{11})"', html)
    
    all_ids = []
    seen = set()
    
    # Combine and preserve order
    for v_id in (matches + matches_json):
        if v_id not in seen:
            seen.add(v_id)
            all_ids.append(v_id)
            
    print(f"Total unique video IDs extracted: {len(all_ids)}")
    
    # Let's print the first 50 video IDs
    print("First 50 video IDs:")
    print(all_ids[:50])
    
    # Let's write them to playlist_videos.json
    video_details = [{'videoId': v_id, 'title': f"Day {idx+1}"} for idx, v_id in enumerate(all_ids)]
    with open("playlist_videos.json", "w") as f:
        json.dump(video_details, f, indent=2)
        
except Exception as e:
    print("Error:", e)
