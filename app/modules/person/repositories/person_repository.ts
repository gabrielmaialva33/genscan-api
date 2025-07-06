import Person from '#modules/person/models/person'
import IPerson from '#modules/person/interfaces/person_interface'
import LucidRepository from '#shared/lucid/lucid_repository'

export default class PersonRepository
  extends LucidRepository<typeof Person>
  implements IPerson.Repository
{
  constructor() {
    super(Person)
  }
}
