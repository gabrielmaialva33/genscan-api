import { test } from '@japa/runner'
import { mock } from 'ts-mockito'
import PersonRepository from '#modules/person/repositories/person_repository'
import ListPersonsService from '#modules/person/services/list-persons/list_persons_service'

test.group('ListPersonsService', (group) => {
  let personRepository: PersonRepository
  let listPersonsService: ListPersonsService

  group.each.setup(() => {
    personRepository = mock(PersonRepository)
    listPersonsService = new ListPersonsService(personRepository)
  })

  test('should list all persons', async ({ assert }) => {
    // @ts-ignore
    personRepository.paginate = async () => ({
      toJSON: () => ({
        meta: { total: 1, perPage: 10, currentPage: 1, lastPage: 1 },
        data: [{ id: '1', name: 'John Doe' }],
      }),
    })

    const result = await listPersonsService.run({
      page: 1,
      perPage: 10,
      sortBy: 'id',
      direction: 'asc',
    })

    const resultJson = result.toJSON()
    assert.equal(resultJson.data.length, 1)
    assert.equal(resultJson.data[0].name, 'John Doe')
  })

  test('should filter persons by gender', async ({ assert }) => {
    // @ts-ignore
    personRepository.paginate = async (options) => {
      assert.isFunction(options.scopes)
      return {
        toJSON: () => ({
          meta: { total: 1, perPage: 10, currentPage: 1, lastPage: 1 },
          data: [{ id: '1', name: 'John Doe', gender: 'M' }],
        }),
      }
    }

    const result = await listPersonsService.run({
      page: 1,
      perPage: 10,
      sortBy: 'id',
      direction: 'asc',
      gender: 'M',
    })

    const resultJson = result.toJSON()
    assert.equal(resultJson.data.length, 1)
    assert.equal(resultJson.data[0].gender, 'M')
  })
})
