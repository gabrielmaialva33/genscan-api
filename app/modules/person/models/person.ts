import { DateTime } from 'luxon'
import { BaseModel, column, computed, hasMany, scope } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'

import Relationship from '#modules/person/models/relationship'
import Contact from '#modules/person/models/contact'
import Address from '#modules/person/models/address'

export default class Person extends BaseModel {
  static table = 'peoples'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @computed()
  get full_name() {
    return this.name
  }

  @column({ serializeAs: null })
  declare cpf_hash: string

  @column()
  declare email: string | null

  @column.date()
  declare birth_date: DateTime | null

  @column()
  declare gender: string | null

  @column()
  declare marital_status: string | null

  @column()
  declare external_data: Record<string, any> | null

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime

  @hasMany(() => Relationship, {
    foreignKey: 'person_id',
  })
  declare relationships: HasMany<typeof Relationship>

  @hasMany(() => Contact, {
    foreignKey: 'person_id',
  })
  declare contacts: HasMany<typeof Contact>

  @hasMany(() => Address, {
    foreignKey: 'person_id',
  })
  declare addresses: HasMany<typeof Address>

  static byGender = scope((query, gender: string | null) => {
    if (gender) {
      query.where('gender', gender)
    }
  })

  static bySearch = scope((query, search: string | null) => {
    if (search) {
      query.whereRaw(
        `unaccent(name) ILIKE unaccent(?) OR unaccent(email) ILIKE unaccent(?) OR unaccent(cpf_hash) ILIKE unaccent(?)`,
        [`%${search}%`, `%${search}%`, `%${search}%`]
      )
    }
  })

  static byMaritalStatus = scope((query, maritalStatus: string | null) => {
    if (maritalStatus)
      query.whereRaw(`unaccent(marital_status) ILIKE unaccent(?)`, [`%${maritalStatus}%`])
  })

  static byBirthDate = scope((query, birthDate: DateTime | null) => {
    if (birthDate && birthDate.isValid) {
      const isoDate = birthDate.toISODate()
      if (isoDate) query.whereRaw(`DATE(birth_date) = DATE(?)`, [isoDate])
    }
  })
}
