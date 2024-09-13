## Roadmap to a working demo!

- [ ] Put real examples
- [ ] Finish porting the grammar to the syntax highlighting for the monaco editor
- [ ] Write left sidebar
- [ ] Load something on mobile (e.g. the sidebar and a thing that says "open on desktop to try the sandbox")
- [ ] Get Docker image repo working and make sure that local (and server) always fetch latest image
- [x] Create simple but nice UI
- [x] Deploy to AWS

## Other Todos

- [ ] Remove dev error message from SSR the Editor with localStorage
- [ ] Add GitHub Action that rebuilds the Docker image and pushes it to the repo
- [ ] Add some sort of hook that (when we push) tells our EC2 instance to pull
    and refetch the image / restart the daemon.
- [ ] Switch from gcc base image to something like alpine so that the container start up time is faster and size is smaller
- [ ] Create multiple users to isolate the read/write access of each user. Compiler user should only have read/write/exec access to flick, main.fl, main.o, main. Runner user should have exec i
  - One way to do this is create a "sandbox" group. Two users are part of the sandbox group, compiler and runner. Then chown the sandbox directory to the sandbox group with default permissions 100
- [ ] Get rid of globals.css and switch to tailwind colors (e.g. Sky theme)
- [x] Support basic syntax highlighting: https://codemirror.net/examples/lang-package/
- [x] Switch to using custom websocket format, so that we can differentiate between log messages. Some log messages are compiling, some are stdout from program. So instead of just sending the text, send some JSON structure like {"type": "compiler", "text": "invalid identifier"}
- [x] Support exit codes when running the program (not just compiling)
  - Then, we can also stream the compilatin output

## Quick Todos

- [ ] Decompose main.py
- [ ] Build before commit (git hook)
