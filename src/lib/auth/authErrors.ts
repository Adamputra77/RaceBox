export function formatAuthError(raw: string | null): string | null {
  if (!raw) return null

  const m = raw.toLowerCase()

  if (m.includes('email not confirmed')) {
    return 'Email belum terkonfirmasi. Cek inbox/spam untuk link verifikasi, atau hubungi admin.'
  }
  if (m.includes('invalid login credentials')) {
    return 'Email atau kata sandi salah.'
  }
  if (m.includes('user already registered')) {
    return 'Email sudah terdaftar. Silakan login.'
  }
  if (m.includes('password should be at least')) {
    return 'Kata sandi minimal 6 karakter.'
  }
  if (m.includes('rate limit') || m.includes('too many requests')) {
    return 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.'
  }
  return raw
}
