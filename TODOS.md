## Roadmap to a working demo!

- [ ] Create simple but nice UI
- [ ] Deploy to AWS
- [ ] Get rid of globals.css and switch to tailwind colors (e.g. Sky theme)

## Other Todos

- [ ] Fix ./main does not exist when compiling a "empty" (only docs)
- [ ] Support exit codes when running the program (not just compiling)
  - Then, we can also stream the compilatin output
- [ ] Switch from gcc base image to something like alpine so that the container start up time is faster and size is smaller
- [ ] Create multiple users to isolate the read/write access of each user. Compiler user should only have read/write/exec access to flick, main.fl, main.o, main. Runner user should have exec i
  - One way to do this is create a "sandbox" group. Two users are part of the sandbox group, compiler and runner. Then chown the sandbox directory to the sandbox group with default permissions 100
- [ ] Load something on mobile (e.g. the sidebar and a thing that says "open on desktop to try the sandbox")
- [x] Support basic syntax highlighting: https://codemirror.net/examples/lang-package/
- [ ] Switch to using custom websocket format, so that we can differentiate between log messages. Some log messages are compiling, some are stdout from program. So instead of just sending the text, send some JSON structure like {"type": "compiler", "text": "invalid identifier"}

## Quick Todos

- [ ] Decompose main.py