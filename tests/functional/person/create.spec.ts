import { test } from '@japa/runner'
import { PersonFactory } from '#database/factories/person_factory'
import crypto from 'node:crypto'

test.group('Persons create', (group) => {
  group.each.setup(async () => {
    // await Person.query().delete()
  })

  test('should create a new person with valid data', async ({ client }) => {
    const personData = {
      name: 'John Doe',
      cpf: '12345678901',
      email: 'john.doe@example.com',
    }

    const response = await client.post('/persons').json(personData)

    response.assertStatus(201)
    response.assertBodyContains({ name: 'John Doe' })
  })

  test('should fail with duplicate cpf', async ({ client }) => {
    const cpf = '12345678901'
    const cpfHash = crypto.createHash('sha256').update(cpf).digest('hex')
    await PersonFactory.merge({ cpf_hash: cpfHash }).create()

    const personData = {
      name: 'Jane Doe',
      cpf,
    }

    const response = await client.post('/persons').json(personData)

    response.assertStatus(422)
  })

  test('should fail with invalid cpf', async ({ client }) => {
    const personData = {
      name: 'John Doe',
      cpf: '123',
    }

    const response = await client.post('/persons').json(personData)

    response.assertStatus(422)
  })
})
