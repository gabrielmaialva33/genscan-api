import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Person from '#modules/person/models/person'

export default class Relationship extends BaseModel {
  static table = 'relationships'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare person_id: string

  @column({ columnName: 'related_person_id' })
  declare related_person_id: string

  @column()
  declare relationship_type: string

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime

  @belongsTo(() => Person, {
    foreignKey: 'person_id',
  })
  declare person: BelongsTo<typeof Person>

  @belongsTo(() => Person, {
    foreignKey: 'related_person_id',
  })
  declare relative: BelongsTo<typeof Person>
}
