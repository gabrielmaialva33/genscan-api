import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import { createPersonValidator } from '#modules/person/validators/create_person_validator'
import CreatePersonService from '#modules/person/services/create-person/create_person_service'
import ListPersonsService from '#modules/person/services/list-persons/list_persons_service'

@inject()
export default class PersonsController {
  constructor(
    private createPersonService: CreatePersonService,
    private listPersonsService: ListPersonsService
  ) {}

  async index({ request }: HttpContext) {
    const gender = request.input('gender')
    const persons = await this.listPersonsService.run(gender)
    return persons
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createPersonValidator)
    const person = await this.createPersonService.run(payload)
    return response.created(person)
  }
}
