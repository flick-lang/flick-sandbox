final: prev:
prev.lib.optionalAttrs prev.stdenv.hostPlatform.isMusl {
  # jemalloc's extent_dss test needs sbrk() to grow the heap, which musl always refuses
  jemalloc = prev.jemalloc.overrideAttrs { doCheck = false; };

  # tzdata 2026f's now.ck fails after 2026-11-01, when zonenow.tab entries become duplicates
  tzdata = prev.tzdata.overrideAttrs { doCheck = false; };
}
