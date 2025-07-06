import { inject } from '@adonisjs/core'
import PersonRepository from '#modules/person/repositories/person_repository'

@inject()
export default class PersonService {
  constructor(private personRepository: PersonRepository) {}

  async list() {
    return this.personRepository.list()
  }
}
