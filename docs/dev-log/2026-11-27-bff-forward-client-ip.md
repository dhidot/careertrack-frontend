# BFF Meneruskan IP User ke Gateway (P3)

**Tanggal:** 27 November 2026
**Branch:** `feat/bff-forward-client-ip`
**Pasangan:** `api-gateway` branch `feat/gateway-per-client-rate-limit`. Penjelasan lengkap desainnya ada di dev-log gateway (`docs/dev-log/2026-11-27-per-client-rate-limit.md`).

## Kenapa

Gateway sekarang membatasi request **per client**. Masalahnya, semua request dari browser sampai ke gateway lewat server Vercel, jadi gateway hanya melihat IP Vercel yang sama untuk semua user. BFF yang tahu IP asli user, jadi BFF yang harus memberitahu gateway.

## Yang berubah

| File | Perubahan |
|---|---|
| `features/auth/lib/auth-upstream.ts` | `clientIpOf(request)` dan `gatewayClientHeaders(request)`. `postToGateway` dan `rotateTokens` menerima `clientHeaders`. |
| `app/api/v1/auth/login`, `register`, `refresh` | Menambahkan header IP ke panggilan gateway |
| `app/api/v1/auth/logout`, `logout-all` | Sama, termasuk saat merotasi token (karena rotasi memanggil `/refresh` yang juga dibatasi) |

Header yang dikirim, **hanya kalau `GATEWAY_BFF_KEY` di-set dan IP-nya valid**:

```
X-CareerTrack-Client-IP: 203.0.113.9
X-CareerTrack-BFF-Key:   <GATEWAY_BFF_KEY>
```

## Keputusan desain

- **Sumber IP:** `x-real-ip`, lalu entri pertama `x-forwarded-for`. Di Vercel, kedua header ini ditulis ulang oleh edge Vercel sehingga tidak bisa dipalsukan client. Kalau suatu saat pindah dari Vercel, pastikan proxy di depan Next.js juga menimpa header ini.
- **Validasi dengan `node:net` `isIP`:** string yang bukan IP tidak pernah dikirim.
- **Tanpa key, tidak ada header:** BFF tetap jalan normal, dan gateway memakai IP yang ia lihat sendiri.
- **Key bersifat server-only:** dibaca dari `process.env.GATEWAY_BFF_KEY` di route handler, tidak pernah dikirim ke browser. Jangan pernah membuat versi `NEXT_PUBLIC_`.
- **Header client dipasang paling awal** di objek header, sehingga tidak bisa menimpa `Authorization` atau `Content-Type`.

## Test (+11)

`features/auth/lib/client-ip-forwarding.test.ts`:
- `clientIpOf`: mengutamakan `x-real-ip`, fallback ke hop pertama XFF, menerima IPv6, mengabaikan nilai yang bukan IP.
- `gatewayClientHeaders`: kosong tanpa key, kosong tanpa IP, lengkap kalau keduanya ada.
- Route: login, refresh, dan logout (ketiga panggilannya, termasuk rotasi token) mengirim header; tanpa key tidak ada header yang dikirim.

| Cek | Hasil |
|---|---|
| `pnpm test` | 229/229 (sebelumnya 218) |
| `tsc --noEmit`, `pnpm lint` | Bersih |
| `pnpm build` | Sukses |
| E2E `next start` → gateway baru → Auth asli | Client A 429 setelah 3 percobaan, client B tetap dilayani |

## Deploy

Merge **setelah** PR gateway ter-deploy, dan setelah `GATEWAY_BFF_KEY` di-set di Vercel (Production, server-only) dengan nilai yang sama seperti di EC2. Urutan lengkap ada di dev-log gateway.
