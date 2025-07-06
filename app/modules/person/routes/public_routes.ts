import router from '@adonisjs/core/services/router'

const PersonsController = () => import('#modules/person/controllers/persons_controller')

router
  .group(() => {
    router.get('/', [PersonsController, 'index']).as('index')
    router.post('/', [PersonsController, 'store']).as('store')
  })
  .prefix('/persons')
  .as('public.persons')
