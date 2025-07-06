import Person from '#modules/person/models/person'
import LucidRepositoryInterface from '#shared/lucid/lucid_repository_interface'

namespace IPerson {
  export interface Repository extends LucidRepositoryInterface<typeof Person> {}

  export interface CreatePayload {
    name: string
    cpf: string
    email?: string
    birth_date?: Date
    gender?: string
    marital_status?: string
  }
}

export default IPerson
