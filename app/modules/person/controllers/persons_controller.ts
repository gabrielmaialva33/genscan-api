import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import PersonService from '#modules/person/services/person_service'

@inject()
export default class PersonsController {
  constructor(private personService: PersonService) {}

  async handle({}: HttpContext) {
    return this.personService.list()
  }
}
