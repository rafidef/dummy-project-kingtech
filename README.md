# dummy-project-kingtech

Aplikasi Node.js "Hello World" untuk menguji *pipeline* Continuous Deployment
multi-repository KingTech (Tugas Akhir — Rafid Azhar Adi Saputra, 1202220030).

Repositori ini dipakai sebagai objek uji terkendali pada BAB IV subbab 4.2.1
"Pengujian Menggunakan Proyek Dummy Node.js".

## Arsitektur

| Berkas | Fungsi |
|---|---|
| `app.js` | Express, port 3000. Endpoint `/` (JSON status) dan `/health` |
| `Dockerfile` | Multi-stage build berbasis `node:20-alpine` |
| `docker-compose.yml` | Orkestrasi kontainer + healthcheck |
| `.github/workflows/deploy-dummy.yml` | Pipeline CD, terpicu oleh push tag `v*` |

Versi aplikasi dibaca dari variabel lingkungan `APP_VERSION`, yang diisi oleh
pipeline dari nama tag pemicu. Jadi `curl` ke aplikasi langsung menunjukkan
versi mana yang benar-benar sedang berjalan.

## Lingkungan produksi

- Server: VPS Ubuntu 24.04.4 LTS — `root@64.235.43.43`
- Direktori: `/root/dummy-project`
- URL: <http://64.235.43.43:3000/>

GitHub Secrets yang dibutuhkan: `VPS_HOST`, `VPS_USERNAME`, `VPS_SSH_KEY`.
Key SSH khusus pipeline ada di server pada `/root/.ssh/gha_dummy_deploy`
(publiknya sudah terdaftar di `/root/.ssh/authorized_keys`).

## Runbook demo sidang

### 1. Tunjukkan kondisi awal

```bash
curl -s http://64.235.43.43:3000/
```

### 2. Skenario A — deployment berhasil

```bash
git tag -a v1.2.0 -m "Demo sidang: deployment berhasil" && git push origin v1.2.0
```

Buka tab Actions, tunggu hijau (~15 detik), lalu `curl` lagi — `version` berubah
menjadi `v1.2.0`.

### 3. Skenario B — deployment gagal

Sisipkan baris berikut ke `Dockerfile` tepat setelah `WORKDIR /app` pada stage
`runner`:

```dockerfile
RUN invalid-command
```

Lalu rilis:

```bash
git commit -am "Demo sidang: build sengaja digagalkan" && git push origin main
```

```bash
git tag -a v1.2.1 -m "Demo sidang: build gagal" && git push origin v1.2.1
```

Hasil yang ditunjukkan: job Actions **merah** (`Process exited with status 1`),
tetapi `curl` tetap mengembalikan `version: v1.2.0` — layanan lama tidak mati.

Bukti kontainer tidak tersentuh:

```bash
ssh root@64.235.43.43 "docker inspect dummy-hello-world-app --format 'StartedAt={{.State.StartedAt}}'"
```

### 4. Rollback

Buka halaman *workflow run* dari tag tujuan → **Re-run all jobs** → `curl`
kembali menunjukkan versi tersebut (~13 detik).

### 5. Kembalikan Dockerfile

```bash
git revert --no-edit HEAD && git push origin main
```

## Catatan teknis penting

`set -e` pada baris pertama skrip deployment bersifat **wajib**. Tanpa baris
itu, `appleboy/ssh-action` menjalankan seluruh perintah sampai habis walaupun
`docker compose build` sudah gagal, dan status job ditentukan oleh exit code
perintah terakhir (`docker image prune -af`) yang hampir selalu berhasil —
sehingga pipeline melaporkan sukses palsu.

Referensi action juga dikunci ke `@v1.2.5`, bukan `@master`, karena parameter
`script_stop` yang dulu valid sudah dihapus dari branch master dan diabaikan
tanpa error.
