# Flick Sandbox

This sandbox is a website that allows users to try out the Flick programming language without having 
to install the compiler themselves. The webiste consists of a code editor where users can type their
Flick program and a console where users can see their program's output.

> [!NOTE]
> The sandbox is currently under development.

## Sandbox Limits

The website runs users' Flick programs subject to the following constraints:

- **Time**: Programs timeout after 5 seconds
- **Network**: Programs will not have any internet access
- **Disk**: Programs do not have read or write access to the disk
- **Memory**: TBD
- **CPU**: TBD

## Implementation details

The server is hosted on an AWS EC2 instance and is primarily based on Fast API. See below for more details
about how the [backend][a] and [frontend][b] are implemented.

[a]: #more-on-the-sandbox-backend
[b]: #more-on-the-sandbox-frontend

### More on the sandbox backend

When the frontend requests to compile/run a program, the server passes the user's Flick source code 
to the backend. The backend consists of a Docker container (for compilation and running) and a program that 
passes data between the container and the frontend.

The Docker container is used to isolate all Flick programs that are run, by ensuring that only the 
Docker container compiles and runs user-written Flick programs. The container ensures that user-written 
Flick programs can't access the network. Also, the compiled programs is executed without read/write 
access to ensure that user-written Flick programs can't access the filesystem.

The Flick progam is deleted after being run, and is run using bash's "timeout" command so that it times out
after 5 seconds.

### More on the sandbox frontend

The frontend is writen in React, and it uses WebSockets for continuous communication with the backend
when programs are running.