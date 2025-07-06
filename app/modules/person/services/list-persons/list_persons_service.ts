import { inject } from '@adonisjs/core'
import PersonRepository from '#modules/person/repositories/person_repository'

@inject()
export default class ListPersonsService {
  constructor(private personRepository: PersonRepository) {}

  async run() {
    return this.personRepository.list()
  }
}
