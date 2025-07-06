import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'relationships'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))
      table.uuid('person_id').references('id').inTable('peoples').onDelete('CASCADE')
      table
        .uuid('related_person_id')
        .unsigned()
        .references('id')
        .inTable('peoples')
        .onDelete('CASCADE')
      table.string('relationship_type').notNullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
