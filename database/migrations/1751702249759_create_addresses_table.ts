import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'addresses'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))
      table.uuid('person_id').references('id').inTable('peoples').onDelete('CASCADE')
      table.string('neighborhood').nullable()
      table.string('zip_code').nullable()
      table.string('city').nullable()
      table.string('street').nullable()
      table.string('number').nullable()
      table.string('state').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
