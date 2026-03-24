import os
import re

def clean_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Simple regex to keep the first part of conflict markers
    # Pattern: <<<<<<< [LABEL]\n[CODE1]======= [CODE2] >>>>>>> [LABEL]
    # This might be tricky if they are nested. 
    # But for standard markers:
    # We want to keep everything from <<<<<<< to ======= (CODE1)
    
    new_content = re.sub(r'<<<<<<< .*?\n(.*?)\n?=======\n?.*?\n?>>>>>>> .*?\n', r'\1\n', content, flags=re.DOTALL)
    
    # Handle the cases where there are no newlines exactly there
    # Let's try a more robust approach:
    lines = content.splitlines()
    new_lines = []
    in_conflict = False
    keep_first = True # Default to keep HEAD part
    skip = False
    
    i = 0
    while i < len(lines):
        line = lines[i]
        if '<<<<<<<' in line:
            in_conflict = True
            skip = False
            i += 1
            continue
        elif '=======' in line:
            skip = True
            i += 1
            continue
        elif '>>>>>>>' in line:
            in_conflict = False
            skip = False
            i += 1
            continue
        
        if not in_conflict:
            new_lines.append(line)
        else:
            if not skip:
                new_lines.append(line)
        i += 1
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write('\n'.join(new_lines) + '\n')

files_to_clean = [
    r'c:\Users\bunny\Desktop\projectwt\Team6\Frontend\index.html',
    r'c:\Users\bunny\Desktop\projectwt\Team6\Frontend\css\resume.css',
    r'c:\Users\bunny\Desktop\projectwt\Team6\Frontend\css\companydashboard.css',
    r'c:\Users\bunny\Desktop\projectwt\Team6\Frontend\css\tpodashboard.css',
    r'c:\Users\bunny\Desktop\projectwt\Team6\Frontend\pages\CompanyDashboard.html',
    r'c:\Users\bunny\Desktop\projectwt\Team6\Frontend\pages\resume-builder.html',
    r'c:\Users\bunny\Desktop\projectwt\Team6\Frontend\js\student.js',
    r'c:\Users\bunny\Desktop\projectwt\Team6\Frontend\pages\StudentDashboard.html',
    r'c:\Users\bunny\Desktop\projectwt\Team6\Frontend\pages\TPODashboard.html'
]

for f in files_to_clean:
    if os.path.exists(f):
        print(f"Cleaning {f}")
        clean_file(f)
    else:
        print(f"File not found: {f}")
