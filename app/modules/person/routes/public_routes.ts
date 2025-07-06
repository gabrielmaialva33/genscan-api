import router from '@adonisjs/core/services/router'

const PersonsController = () => import('#modules/person/controllers/persons_controller')

router.get('/persons', [PersonsController, 'handle']).as('public.persons')
