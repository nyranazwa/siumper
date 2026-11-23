#!/bin/bash
# Deploy ke GitHub Pages: commit semua perubahan lalu push ke repo nyranazwa/siumper.
# Pemakaian:  ./deploy.sh "pesan singkat perubahan"     (pesan boleh dikosongkan)
#
# Pengaturan awal (cukup sekali):
#   1. Buat Personal Access Token di https://github.com/settings/tokens  (Tokens (classic), centang "repo").
#   2. Jalankan ./deploy.sh. Saat diminta Username isi: nyranazwa ; Password isi: tokennya.
#      macOS menyimpannya di Keychain, jadi seterusnya tidak ditanya lagi.
set -e
cd "$(dirname "$0")"
git config credential.helper osxkeychain
MSG="${1:-Update $(date '+%Y-%m-%d %H:%M')}"
git add -A
if ! git diff --cached --quiet; then git commit -q -m "$MSG"; fi
git push origin main
echo "Selesai. Situs diperbarui dalam 1-2 menit: https://nyranazwa.github.io/siumper/"
