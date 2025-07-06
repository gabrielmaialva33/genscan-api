import router from '@adonisjs/core/services/router'

router.get('/persons', () => {
  return {
    message: 'This is the person route',
  }
})
