import { inject } from '@adonisjs/core'
import PersonRepository from '#modules/person/repositories/person_repository'
import { DateTime } from 'luxon'

type PaginatePersonsRequest = {
  page: number
  perPage: number
  sortBy: string
  direction: 'asc' | 'desc'
  search?: string
  gender?: string
  maritalStatus?: string
  birthDate: DateTime | null
}

@inject()
export default class ListPersonsService {
  constructor(private personRepository: PersonRepository) {}

  async run(options: PaginatePersonsRequest) {
    const { search, gender, maritalStatus, birthDate, ...paginateOptions } = options

    return this.personRepository.paginate({
      ...paginateOptions,
      scopes: (scopes) => {
        if (gender) {
          scopes.byGender(gender)
        }
        if (search) {
          scopes.bySearch(search)
        }
        if (maritalStatus) {
          scopes.byMaritalStatus(maritalStatus)
        }
        if (birthDate) {
          scopes.byBirthDate(birthDate)
        }
      },
    })
  }
}
