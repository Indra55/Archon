
import re

def resolve_conflicts(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Simple strategy: Keep HEAD, remove markers
    # This regex matches <<<<<<< HEAD ... ======= ... >>>>>>> pranav (or any other branch)
    # and keeps the part between <<<<<<< HEAD and =======
    
    pattern = re.compile(r'<<<<<<< HEAD\n(.*?)\n?=======\n(.*?)\n?>>>>>>> \w+', re.DOTALL)
    
    def replacement(match):
        print("Found conflict block!")
        return match.group(1)
    
    new_content = pattern.sub(replacement, content)
    
    with open(filepath, 'w') as f:
        f.write(new_content)
    print("Conflicts resolved!")

resolve_conflicts('package-lock.json')
resolve_conflicts('package.json')
resolve_conflicts('tsconfig.json')
resolve_conflicts('components.json')
