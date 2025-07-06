import factory from '@adonisjs/lucid/factories'
import Contact from '#modules/person/models/contact'

export const ContactFactory = factory
  .define(Contact, async ({ faker }) => {
    return {
      phone_number: faker.phone.number(),
      email: faker.internet.email(),
    }
  })
  .build()
