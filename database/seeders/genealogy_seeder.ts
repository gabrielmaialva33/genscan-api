import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { PersonFactory } from '#database/factories/person_factory'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
  static environment = ['development', 'testing']

  async run() {
    // Create a main person
    const person = await PersonFactory.with('contacts', 2).with('addresses', 1).create()

    // Create parents
    const father = await PersonFactory.merge({
      gender: 'Masculino',
      birth_date: DateTime.fromJSDate(new Date()).minus({ years: 30 }),
    }).create()

    const mother = await PersonFactory.merge({
      gender: 'Feminino',
      birth_date: DateTime.fromJSDate(new Date()).minus({ years: 28 }),
    }).create()

    // Create relationships
    await person.related('relationships').create({
      related_person_id: father.id,
      relationship_type: 'PAI',
    })

    await person.related('relationships').create({
      related_person_id: mother.id,
      relationship_type: 'MÃE',
    })

    // Create relationships from parents to person
    await father.related('relationships').create({
      related_person_id: person.id,
      relationship_type: 'FILHO(A)',
    })

    await mother.related('relationships').create({
      related_person_id: person.id,
      relationship_type: 'FILHO(A)',
    })
  }
}
