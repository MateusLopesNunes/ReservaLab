export function getIsolatedDatabaseUrl(env = process.env): string {
  const url = env.TEST_DATABASE_URL
  const database = env.RESERVALAB_TEST_DATABASE_NAME
  if (env.RESERVALAB_TEST_MODE !== '1' || !url || url !== env.DATABASE_URL || !database) {
    throw new Error('Configure o banco isolado do piloto antes de executar a integração.')
  }

  const parsed = URL.canParse(url) ? new URL(url) : undefined
  if (parsed?.protocol !== 'postgresql:' || parsed.hostname !== '127.0.0.1'
    || parsed.port !== env.RESERVALAB_TEST_DATABASE_PORT || Number(parsed.port) < 1024
    || ['5432', '5433'].includes(parsed.port) || parsed.username !== 'reservalab_test'
    || url.includes('?') || url.includes('#') || parsed.href !== url
    || parsed.pathname !== `/${database}` || !/^reservalab_test_[a-f0-9]{12}$/.test(database)) {
    throw new Error('O destino informado não corresponde ao PostgreSQL isolado do piloto.')
  }
  return url
}
