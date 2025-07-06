import { test } from '@japa/runner'
import { PersonFactory } from '#database/factories/person_factory'
import Person from '#modules/person/models/person'

test.group('Persons list', (group) => {
  group.each.setup(async () => {
    await Person.query().delete()
  })

  test('should list all persons', async ({ client }) => {
    await PersonFactory.createMany(5)

    const response = await client.get('/api/v1/persons')

    response.assertStatus(200)
    response.assertBodyContains({ meta: { total: 5 } })
  })

  test('should filter persons by gender', async ({ client }) => {
    await PersonFactory.merge({ gender: 'M' }).createMany(3)
    await PersonFactory.merge({ gender: 'F' }).createMany(2)

    const response = await client.get('/api/v1/persons?gender=M')

    response.assertStatus(200)
    response.assertBodyContains({ meta: { total: 3 } })
  })

  test('should filter persons by search', async ({ client }) => {
    await PersonFactory.merge({ name: 'John Doe' }).create()
    await PersonFactory.createMany(5)

    const response = await client.get('/api/v1/persons?search=John')

    response.assertStatus(200)
    response.assertBodyContains({ meta: { total: 1 } })
  })
})
