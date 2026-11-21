{
  dockerTools,
  runCommand,
  removeReferencesTo,
  makeBinaryWrapper,
  busybox-sandbox-shell,
  musl,
  binutils-unwrapped,
  flick,
}:
let
  flickStaticLLVM = flick.override { staticLLVM = true; };

  # Only `ld`; its self-references would pull in all of binutils
  ld = runCommand "ld" { nativeBuildInputs = [ removeReferencesTo ]; } ''
    install -Dm755 ${binutils-unwrapped}/bin/ld.bfd $out/bin/ld
    remove-references-to -t ${binutils-unwrapped} $out/bin/ld
  '';

  # Minimal musl `cc` for flick; a native wrapper so it doesn't need a shell
  cc = runCommand "cc" { nativeBuildInputs = [ makeBinaryWrapper ]; } ''
    makeBinaryWrapper ${ld}/bin/ld $out/bin/cc \
      --add-flags "-dynamic-linker ${musl}/lib/libc.so ${musl}/lib/crt1.o ${musl}/lib/crti.o" \
      --append-flags "-L${musl}/lib -lc ${musl}/lib/crtn.o"
  '';

  sandboxUser = "1000:1000";
in
dockerTools.streamLayeredImage {
  name = "sandbox";
  tag = "latest";

  contents = [
    flickStaticLLVM
    cc
    busybox-sandbox-shell
  ];

  # /workspace belongs to the sandbox user; /tmp is shared, so it's world-writable with the sticky bit
  fakeRootCommands = ''
    mkdir -m 1777 tmp
    mkdir workspace
    chown ${sandboxUser} workspace
  '';

  config = {
    User = sandboxUser;
    WorkingDir = "/workspace";
    Env = [ "PATH=/bin" ];
  };
}
