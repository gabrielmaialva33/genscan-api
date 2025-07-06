import factory from '@adonisjs/lucid/factories'
import Relationship from '#modules/person/models/relationship'

export const RelationshipFactory = factory
  .define(Relationship, async ({ faker }) => {
    return {
      relationship_type: faker.helpers.arrayElement([
        'PAI',
        'MÃE',
        'FILHO(A)',
        'CÔNJUGE',
        'IRMÃO(Ã)',
      ]),
    }
  })
  .build()
