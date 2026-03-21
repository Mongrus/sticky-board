import { describe, it, expect, beforeEach } from 'vitest'
import {
  invalidateOutboxCache,
  loadOutboxOps,
  enqueueOutboxCreate,
  enqueueOutboxUpdate,
  enqueueOutboxDelete,
  clearOutbox,
  flushOutboxPersistence
} from './stickersOutbox.js'

const userAuth = { isAuthenticated: true, user: { id: 42 } }
const guestAuth = { isAuthenticated: false, user: null }

beforeEach(() => {
  invalidateOutboxCache()
  localStorage.clear()
})

describe('stickersOutbox', () => {
  it('guest: no ops stored', () => {
    enqueueOutboxCreate(guestAuth, { uuid: '00000000-0000-4000-8000-000000000001', text: 'x' })
    expect(loadOutboxOps(guestAuth)).toEqual([])
  })

  it('enqueue create then load returns one op', () => {
    const uuid = '10000000-0000-4000-8000-000000000001'
    enqueueOutboxCreate(userAuth, { uuid, text: 'a' })
    const ops = loadOutboxOps(userAuth)
    expect(ops).toHaveLength(1)
    expect(ops[0].type).toBe('create')
    expect(ops[0].token).toBe(uuid)
    expect(ops[0].payload.text).toBe('a')
  })

  it('second create same uuid replaces first', () => {
    const uuid = '20000000-0000-4000-8000-000000000002'
    enqueueOutboxCreate(userAuth, { uuid, text: 'first' })
    enqueueOutboxCreate(userAuth, { uuid, text: 'second' })
    const ops = loadOutboxOps(userAuth)
    expect(ops).toHaveLength(1)
    expect(ops[0].payload.text).toBe('second')
  })

  it('delete removes prior ops for same token', () => {
    const uuid = '30000000-0000-4000-8000-000000000003'
    enqueueOutboxCreate(userAuth, { uuid, text: 'c' })
    enqueueOutboxUpdate(userAuth, uuid, { text: 'u' })
    enqueueOutboxDelete(userAuth, uuid)
    const ops = loadOutboxOps(userAuth)
    expect(ops).toHaveLength(1)
    expect(ops[0].type).toBe('delete')
    expect(ops[0].token).toBe(uuid)
  })

  it('clearOutbox empties queue', () => {
    const uuid = '40000000-0000-4000-8000-000000000004'
    enqueueOutboxCreate(userAuth, { uuid, text: 'x' })
    clearOutbox(userAuth)
    expect(loadOutboxOps(userAuth)).toEqual([])
  })

  it('invalidateOutboxCache reloads from localStorage after flush', () => {
    const uuid = '50000000-0000-4000-8000-000000000005'
    enqueueOutboxCreate(userAuth, { uuid, text: 'persist' })
    flushOutboxPersistence(userAuth)
    invalidateOutboxCache()
    const ops = loadOutboxOps(userAuth)
    expect(ops).toHaveLength(1)
    expect(ops[0].payload.text).toBe('persist')
  })
})
