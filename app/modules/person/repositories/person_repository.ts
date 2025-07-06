import Person from '#modules/person/models/person'
import LucidRepository from '#shared/lucid/lucid_repository'

export default class PersonRepository extends LucidRepository<typeof Person> {
  constructor() {
    super(Person)
  }
}
