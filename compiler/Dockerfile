FROM rust AS build

WORKDIR /app

RUN apt-get update && apt-get install -y lsb-release software-properties-common wget git
RUN wget https://apt.llvm.org/llvm.sh && chmod +x llvm.sh && ./llvm.sh 18 all

ADD https://api.github.com/repos/flick-lang/flick/git/refs/heads/main version.json
RUN git clone https://github.com/flick-lang/flick.git

WORKDIR /app/flick
RUN cargo build --release

# Ideally switch away from using gcc -- it adds a long start up time and is 1.5GB instead of a few MB
FROM gcc

WORKDIR /app
COPY --from=build /app/flick/target/release/flick ./flick

ENTRYPOINT ["/bin/sh"]
