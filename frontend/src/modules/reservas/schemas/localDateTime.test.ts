import { expect, it } from 'vitest'
import { resolveLocalDateTime } from './localDateTime'

it('resolve horário local em um fuso brasileiro para um instante UTC', () => {
  expect(resolveLocalDateTime('2027-02-01T14:30', 'America/Sao_Paulo')).toEqual({
    status: 'valid', instant: '2027-02-01T17:30:00.000Z'
  })
})

it.each(['', '2027-02-29T14:30', '2027-02-01T14:30Z', '0000-02-01T14:30'])(
  'recusa entrada local inválida %j',
  (value) => expect(resolveLocalDateTime(value, 'UTC').status).toBe('invalid')
)

it('recusa horário inexistente no avanço do relógio', () => {
  expect(resolveLocalDateTime('2027-03-14T02:30', 'America/New_York').status).toBe('invalid')
})

it('recusa horário ambíguo quando a hora local se repete', () => {
  expect(resolveLocalDateTime('2027-11-07T01:30', 'America/New_York').status).toBe('ambiguous')
})

it('detecta ambas as ocorrências durante uma transição de meia hora', () => {
  expect(resolveLocalDateTime('2027-04-04T01:45', 'Australia/Lord_Howe').status).toBe('ambiguous')
})
