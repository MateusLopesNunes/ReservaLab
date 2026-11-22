import { z } from 'zod'

const localMinuteSchema = z.iso.datetime({ local: true, precision: -1 })
  .refine((value) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) && !value.startsWith('0000-'))

const searchWindow = 36 * 60 * 60 * 1000

type LocalTime = { status: 'valid'; instant: string } | { status: 'invalid' | 'ambiguous' }

function projectLocalTime(formatter: Intl.DateTimeFormat, timestamp: number): number {
  const parts = new Map(formatter.formatToParts(timestamp).map(({ type, value }) => [type, value]))
  const year = parts.get('year')?.padStart(4, '0')
  return Date.parse(
    `${year}-${parts.get('month')}-${parts.get('day')}T${parts.get('hour')}:${parts.get('minute')}:00Z`
  )
}

export function resolveLocalDateTime(value: string, timeZone: string): LocalTime {
  if (!localMinuteSchema.safeParse(value).success) return { status: 'invalid' }

  const local = Date.parse(`${value}Z`)
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone, calendar: 'gregory', numberingSystem: 'latn', hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  })
  const candidates = [local - searchWindow, local, local + searchWindow].map((sample) =>
    local - (projectLocalTime(formatter, sample) - sample)
  )
  const matches = [...new Set(candidates)].filter((candidate) => projectLocalTime(formatter, candidate) === local)

  if (matches.length > 1) return { status: 'ambiguous' }
  const [instant] = matches
  return instant === undefined ? { status: 'invalid' } : { status: 'valid', instant: new Date(instant).toISOString() }
}
