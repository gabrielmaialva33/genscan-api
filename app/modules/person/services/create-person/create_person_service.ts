import { inject } from '@adonisjs/core'
import Hash from '@adonisjs/core/services/hash'
import { DateTime } from 'luxon'
import PersonRepository from '#modules/person/repositories/person_repository'
import IPerson from '#modules/person/interfaces/person_interface'
import Person from '#modules/person/models/person'

@inject()
export default class CreatePersonService {
  constructor(private personRepository: PersonRepository) {}

  async run(payload: IPerson.CreatePayload): Promise<Person> {
    const { cpf, ...personData } = payload
    const cpfHash = await Hash.make(cpf)

    const person = await this.personRepository.create({
      ...personData,
      cpf_hash: cpfHash,
      birth_date: payload.birth_date ? DateTime.fromJSDate(payload.birth_date) : undefined,
    })

    return person
  }
}
