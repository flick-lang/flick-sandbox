FROM rust AS build

RUN apt-get update && apt-get install -y lsb-release software-properties-common wget git
RUN wget https://apt.llvm.org/llvm.sh && chmod +x llvm.sh && ./llvm.sh 18 all

WORKDIR /app
RUN git clone https://github.com/flick-lang/flick.git

WORKDIR /app/flick
RUN cargo build --release

# Ideally switch away from using gcc -- it adds a long start up time and is 1.5GB instead of a few MB
FROM gcc

WORKDIR /app
COPY --from=build /app/flick/target/release/flick ./flick

CMD ["/bin/sh"]
