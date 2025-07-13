import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import redis from '@adonisjs/redis/services/main'

test.group('Family search', (group) => {
  group.each.setup(async () => {
    await testUtils.db().withGlobalTransaction()
    await redis.flushdb()
  })

  test('should search family by CPF', async ({ client, assert }) => {
    const response = await client.get('/api/v1/persons/family/search').qs({
      cpf: '38579754828',
      maxDepth: 2,
    })

    response.assertStatus(200)
    assert.isTrue(response.body().success)
    assert.isArray(response.body().data)
    assert.properties(response.body(), ['success', 'data', 'meta'])

    if (response.body().data.length > 0) {
      const mainPerson = response.body().data.find((p: any) => p.main)
      assert.exists(mainPerson)
      assert.properties(mainPerson, ['id', 'data', 'rels'])
    }
  })

  test('should validate CPF format', async ({ client }) => {
    const response = await client.get('/api/v1/persons/family/search').qs({
      cpf: '123', // Invalid CPF
    })

    response.assertStatus(422)
    response.assertBodyContains({
      errors: [
        {
          field: 'cpf',
          rule: 'minLength',
        },
      ],
    })
  })

  test('should search multiple families', async ({ client, assert }) => {
    const response = await client.post('/api/v1/persons/family/search-multiple').json({
      cpfs: ['38579754828', '09361576828'],
      maxDepth: 1,
    })

    response.assertStatus(200)
    assert.isTrue(response.body().success)
    assert.isObject(response.body().data)
    assert.properties(response.body().meta, ['totalCpfs', 'successfulSearches'])
  })

  test('should validate multiple CPFs input', async ({ client }) => {
    const response = await client.post('/api/v1/persons/family/search-multiple').json({
      cpfs: [], // Empty array
    })

    response.assertStatus(422)
    response.assertBodyContains({
      errors: [
        {
          field: 'cpfs',
          rule: 'array.minLength',
        },
      ],
    })
  })

  test('should respect max depth parameter', async ({ client, assert }) => {
    const response = await client.get('/api/v1/persons/family/search').qs({
      cpf: '38579754828',
      maxDepth: 1,
    })

    response.assertStatus(200)
    assert.equal(response.body().meta.maxDepth, 1)
  })

  test('should use cache on repeated searches', async ({ client, assert }) => {
    // First request
    const response1 = await client.get('/api/v1/persons/family/search').qs({
      cpf: '38579754828',
      maxDepth: 2,
    })

    response1.assertStatus(200)
    const data1 = response1.body().data

    // Second request (should hit cache)
    const response2 = await client.get('/api/v1/persons/family/search').qs({
      cpf: '38579754828',
      maxDepth: 2,
    })

    response2.assertStatus(200)
    const data2 = response2.body().data

    // Data should be identical
    assert.deepEqual(data1, data2)
  })

  test('should clear cache for specific CPF', async ({ client, assert }) => {
    // Need authentication for cache operations
    const User = (await import('#modules/user/models/user')).default
    const user = await User.create({
      full_name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    })

    const response = await client.delete('/api/v1/persons/family/cache/38579754828').loginAs(user)

    response.assertStatus(200)
    assert.isTrue(response.body().success)
    assert.include(response.body().message, '38579754828')
  })

  test('should import family data to database', async ({ client, assert }) => {
    const User = (await import('#modules/user/models/user')).default
    const user = await User.create({
      full_name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    })

    const response = await client
      .post('/api/v1/persons/family/import')
      .json({
        cpf: '38579754828',
        maxDepth: 1,
        includeSpouses: true,
      })
      .loginAs(user)

    response.assertStatus(201)
    assert.isTrue(response.body().success)
    assert.exists(response.body().data.imported)

    // Verify data was saved
    const Person = (await import('#modules/person/models/person')).default
    const people = await Person.query()
    assert.isAbove(people.length, 0)
  })

  test('should get family tree from database', async ({ client, assert }) => {
    // First import some data
    const User = (await import('#modules/user/models/user')).default
    const user = await User.create({
      full_name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    })

    // Import family data
    await client
      .post('/api/v1/persons/family/import')
      .json({
        cpf: '38579754828',
        maxDepth: 1,
      })
      .loginAs(user)

    // Get the imported person
    const Person = (await import('#modules/person/models/person')).default
    const person = await Person.first()

    if (person) {
      // Get family tree
      const response = await client.get(`/api/v1/persons/family/${person.id}/tree`)

      response.assertStatus(200)
      assert.isTrue(response.body().success)
      assert.isArray(response.body().data)
      assert.isAbove(response.body().data.length, 0)
    }
  })
})
