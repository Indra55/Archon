
import os
import re

def check_files(directory):
    patterns = [
        re.compile(r'<<<<<<<'),
        re.compile(r'=======') ,
        re.compile(r'>>>>>>>')
    ]
    
    for root, dirs, files in os.walk(directory):
        if '.next' in root or 'node_modules' in root:
            continue
            
        for file in files:
            if file.endswith(('.ts', '.tsx', '.json', '.css')):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'rb') as f:
                        content_bytes = f.read()
                        
                        # Check for BOM
                        if content_bytes.startswith(b'\xef\xbb\xbf'):
                            print(f"BOM found in {filepath}")
                            
                        content = content_bytes.decode('utf-8', errors='ignore')
                        
                        for pattern in patterns:
                            if pattern.search(content):
                                print(f"Conflict marker found in {filepath}")
                                break
                                
                        # Check for weird non-ASCII characters in first few lines
                        first_lines = content.split('\n')[:5]
                        for i, line in enumerate(first_lines):
                            for char in line:
                                if ord(char) > 127 and ord(char) != 160: # allow common non-breaking space
                                    print(f"Non-ASCII character {ord(char)} found in {filepath} at line {i+1}")
                                    
                except Exception as e:
                    print(f"Could not read {filepath}: {e}")

check_files('.')
