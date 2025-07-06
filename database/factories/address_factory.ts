import factory from '@adonisjs/lucid/factories'
import Address from '#modules/person/models/address'

export const AddressFactory = factory
  .define(Address, async ({ faker }) => {
    return {
      neighborhood: faker.location.streetAddress(),
      zip_code: faker.location.zipCode(),
      city: faker.location.city(),
      street: faker.location.street(),
      number: faker.location.buildingNumber(),
      state: faker.location.state({ abbreviated: true }),
    }
  })
  .build()
