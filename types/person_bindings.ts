import PersonRepository from '#modules/person/repositories/person_repository'
import PersonsController from '#modules/person/controllers/persons_controller'

declare module '@adonisjs/core/types' {
  export interface ContainerBindings {
    'repositories.person': PersonRepository
    'controllers.person': PersonsController
  }
}
