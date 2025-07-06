import type { ApplicationService } from '@adonisjs/core/types'

export default class AppProvider {
  constructor(protected app: ApplicationService) {}

  /**
   * Register bindings to the container
   */
  register() {
    this.app.container.singleton('repositories.person', async () => {
      const PersonRepository = await import('#modules/person/repositories/person_repository')
      return new PersonRepository.default()
    })

    this.app.container.singleton('services.person', async (resolver) => {
      const PersonService = await import('#modules/person/services/person_service')
      const personRepository = await resolver.make('repositories.person')
      return new PersonService.default(personRepository)
    })
  }

  /**
   * The container bindings have booted
   */
  async boot() {
    await import('#extensions/logged_user_extension')
  }

  /**
   * The application has been booted
   */
  async start() {}

  /**
   * The process has been started
   */
  async ready() {}

  /**
   * Preparing to shutdown the app
   */
  async shutdown() {}
}
