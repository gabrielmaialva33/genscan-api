import { test } from '@japa/runner'
import { mock } from 'ts-mockito'
import PersonRepository from '#modules/person/repositories/person_repository'
import CreatePersonService from '#modules/person/services/create-person/create_person_service'
import Hash from '@adonisjs/core/services/hash'

test.group('CreatePersonService', (group) => {
  let personRepository: PersonRepository
  let createPersonService: CreatePersonService

  group.each.setup(() => {
    personRepository = mock(PersonRepository)
    createPersonService = new CreatePersonService(personRepository)
  })

  test('should create a new person', async ({ assert }) => {
    const payload = {
      name: 'John Doe',
      cpf: '12345678901',
    }

    const hashedPassword = await Hash.make(payload.cpf)

    // @ts-ignore
    personRepository.create = async (data) => {
      assert.properties(data, ['name', 'cpf_hash'])
      assert.equal(data.name, 'John Doe')
      assert.isTrue(await Hash.verify(data.cpf_hash!, payload.cpf))
      return { ...data, id: '1' }
    }

    const person = await createPersonService.run(payload)

    assert.equal(person.name, 'John Doe')
    assert.isTrue(await Hash.verify(person.cpf_hash!, payload.cpf))
  })
})
