import vine from '@vinejs/vine'
import crypto from 'node:crypto'

export const createPersonValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(3),
    cpf: vine
      .string()
      .minLength(11)
      .maxLength(11)
      .regex(/^\d+$/)
      .unique(async (db, value) => {
        const cpfHash = crypto.createHash('sha256').update(value).digest('hex')
        const person = await db.from('peoples').where('cpf_hash', cpfHash).first()
        return !person
      }),
    email: vine.string().email().optional(),
    birth_date: vine.date().optional(),
    gender: vine.string().optional(),
    marital_status: vine.string().optional(),
  })
)
