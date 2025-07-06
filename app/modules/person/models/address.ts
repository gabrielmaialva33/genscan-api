import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Person from '#modules/person/models/person'

export default class Address extends BaseModel {
  static table = 'addresses'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare person_id: string

  @column()
  declare neighborhood: string | null

  @column()
  declare zip_code: string | null

  @column()
  declare city: string | null

  @column()
  declare street: string | null

  @column()
  declare number: string | null

  @column()
  declare state: string | null

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime

  @belongsTo(() => Person, {
    foreignKey: 'person_id',
  })
  declare person: BelongsTo<typeof Person>
}
