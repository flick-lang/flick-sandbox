FROM rust AS build

WORKDIR /sandbox

RUN apt-get update && apt-get install -y lsb-release software-properties-common wget git
RUN wget https://apt.llvm.org/llvm.sh && chmod +x llvm.sh && ./llvm.sh 18 all

ADD https://api.github.com/repos/flick-lang/flick/git/refs/heads/main version.json
RUN git clone https://github.com/flick-lang/flick.git

WORKDIR /sandbox/flick
RUN cargo build --release

# TODO: Ideally switch away from using gcc -- it adds a long start up time and is 1.5GB instead of a few MB
FROM gcc

# We create a sandbox user, without root privileges
RUN useradd -m sandbox -d /sandbox

# We also lock the root account by setting an invalid password. Source: Rust Playground
# https://github.com/rust-lang/rust-playground/blob/main/compiler/base/Dockerfile
RUN usermod -p '!!' root

USER sandbox
WORKDIR /sandbox

# Get `flick` executable from the build image
COPY --from=build /sandbox/flick/target/release/flick ./flick

ENTRYPOINT ["/bin/sh"]
