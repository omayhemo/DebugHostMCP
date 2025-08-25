#!/usr/bin/env python3
import sys
import time
import subprocess
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class PythonWatcher(FileSystemEventHandler):
    def __init__(self, command):
        self.command = command
        self.process = None
        self.restart()

    def restart(self):
        if self.process:
            self.process.terminate()
            try:
                self.process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.process.kill()
        
        command_str = " ".join(self.command)
        print(f"Starting: {command_str}")
        self.process = subprocess.Popen(self.command)

    def on_modified(self, event):
        if event.is_directory:
            return
        
        path = Path(event.src_path)
        if path.suffix in [".py", ".pyx", ".pyi"] and not any(
            part.startswith(".") or part in ["__pycache__", "venv", "env"]
            for part in path.parts
        ):
            print(f"File changed: {path}")
            self.restart()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python-watcher.py <command>")
        sys.exit(1)
    
    command = sys.argv[1:]
    handler = PythonWatcher(command)
    observer = Observer()
    observer.schedule(handler, "/app", recursive=True)
    observer.start()
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
        if handler.process:
            handler.process.terminate()
    observer.join()