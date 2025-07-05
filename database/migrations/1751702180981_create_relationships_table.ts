import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'relationships'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('person_id').unsigned().references('id').inTable('peoples').onDelete('CASCADE')
      table
        .integer('related_person_id')
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
