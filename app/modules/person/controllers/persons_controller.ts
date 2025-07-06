import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import { createPersonValidator } from '#modules/person/validators/create_person_validator'
import CreatePersonService from '#modules/person/services/create-person/create_person_service'
import ListPersonsService from '#modules/person/services/list-persons/list_persons_service'
import { DateTime } from 'luxon'

@inject()
export default class PersonsController {
  constructor(
    private createPersonService: CreatePersonService,
    private listPersonsService: ListPersonsService
  ) {}

  async index({ request }: HttpContext) {
    const page = request.input('page', 1)
    const perPage = request.input('per_page', 10)
    const sortBy = request.input('sort_by', 'id')
    const direction = request.input('order', 'asc')
    const search = request.input('search')
    const gender = request.input('gender')
    const maritalStatus = request.input('marital_status')
    const birthDate = request.input('birth_date')

    const persons = await this.listPersonsService.run({
      page,
      perPage,
      sortBy,
      direction,
      search,
      gender,
      maritalStatus,
      birthDate: birthDate ? DateTime.fromISO(birthDate) : null,
    })

    return persons
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createPersonValidator)
    const person = await this.createPersonService.run(payload)
    return response.created(person)
  }
}
