import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Person from '#modules/person/models/person'

export default class Contact extends BaseModel {
  static table = 'contacts'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare person_id: string

  @column()
  declare phone_number: string | null

  @column()
  declare email: string | null

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime

  @belongsTo(() => Person, {
    foreignKey: 'person_id',
  })
  declare person: BelongsTo<typeof Person>
}
