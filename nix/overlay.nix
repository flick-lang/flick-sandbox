final: prev:
# Not for pkgsStatic: Hydra caches its builds, and overriding them would forfeit the cached static LLVM
prev.lib.optionalAttrs (prev.stdenv.hostPlatform.isMusl && !prev.stdenv.hostPlatform.isStatic) {
  # tzdata 2026f's now.ck fails after 2026-11-01, when zonenow.tab entries become duplicates
  tzdata = prev.tzdata.overrideAttrs { doCheck = false; };

  # sqlite's testrunner fails its own testfixture rebuilds (All-O0, All-Debug) when cross-compiling to musl
  sqlite = prev.sqlite.overrideAttrs { doCheck = false; };
}
