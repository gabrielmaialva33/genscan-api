import crypto from 'node:crypto'

import factory from '@adonisjs/lucid/factories'
import Person from '#modules/person/models/person'

import { ContactFactory } from '#database/factories/contact_factory'
import { AddressFactory } from '#database/factories/address_factory'
import { RelationshipFactory } from '#database/factories/relationship_factory'

import { DateTime } from 'luxon'

export const PersonFactory = factory
  .define(Person, async ({ faker }) => {
    const cpf = faker.string.numeric(11)

    return {
      name: faker.person.fullName(),
      cpf_hash: crypto.createHash('sha256').update(cpf).digest('hex'),
      email: faker.internet.email(),
      birth_date: DateTime.fromJSDate(faker.date.past({ years: 50, refDate: new Date() })),
      gender: faker.person.sex(),
      marital_status: faker.helpers.arrayElement([
        'Solteiro(a)',
        'Casado(a)',
        'Divorciado(a)',
        'Viúvo(a)',
      ]),
    }
  })
  .relation('contacts', () => ContactFactory)
  .relation('addresses', () => AddressFactory)
  .relation('relationships', () => RelationshipFactory)
  .build()
