import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const FamilySearchController = () => import('#modules/person/controllers/family_search_controller')

router
  .group(() => {
    // Public routes for family search
    router.get('/search', [FamilySearchController, 'search']).as('search')
    router.post('/search-multiple', [FamilySearchController, 'searchMultiple']).as('searchMultiple')
    router.get('/:id/tree', [FamilySearchController, 'getFamilyTree']).as('tree')

    // Protected routes
    router
      .group(() => {
        router.post('/import', [FamilySearchController, 'importFamily']).as('import')
        router.delete('/cache/:cpf', [FamilySearchController, 'clearCache']).as('clearCache')
        router.delete('/cache', [FamilySearchController, 'clearAllCache']).as('clearAllCache')
      })
      .use(middleware.auth())
  })
  .prefix('/api/v1/persons/family')
  .as('family')
