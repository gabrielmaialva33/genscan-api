import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'peoples'

  async up() {
    this.schema.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    this.schema.raw('CREATE EXTENSION IF NOT EXISTS "unaccent"')

    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))
      table.string('name').notNullable()
      table.string('cpf_hash').notNullable().unique()
      table.string('email').nullable()
      table.date('birth_date').nullable()
      table.string('gender').nullable()
      table.string('marital_status').nullable()
      table.jsonb('external_data').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
