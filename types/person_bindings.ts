import PersonRepository from '#modules/person/repositories/person_repository'
import PersonService from '#modules/person/services/person_service'
import PersonsController from '#modules/person/controllers/persons_controller'

declare module '@adonisjs/core/types' {
  export interface ContainerBindings {
    'repositories.person': PersonRepository
    'services.person': PersonService
    'controllers.person': PersonsController
  }
}
