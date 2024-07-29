#/bin/sh
DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
FLAGS="$(grep -m 1 '^flags' /proc/cpuinfo)"
case "${FLAGS}" in
  *avx2*)
    exec "${DIR}/metabuli-avx2" "$@"
    ;;
  *)
    exec "${DIR}/metabuli-sse2" "$@"
    ;;
esac
