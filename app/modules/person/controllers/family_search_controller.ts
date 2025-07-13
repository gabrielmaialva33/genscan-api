import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import FamilySearchService from '#modules/person/services/family-search/family_search_service'
import FamilyChartAdapterService from '#shared/services/family_chart_adapter_service'
import vine from '@vinejs/vine'

const searchValidator = vine.compile(
  vine.object({
    cpf: vine.string().minLength(11).maxLength(14),
    maxDepth: vine.number().min(1).max(5).optional(),
    includeSpouses: vine.boolean().optional(),
    cacheExpiry: vine.number().min(0).optional(),
  })
)

const multiSearchValidator = vine.compile(
  vine.object({
    cpfs: vine.array(vine.string().minLength(11).maxLength(14)).minLength(1).maxLength(10),
    maxDepth: vine.number().min(1).max(5).optional(),
    includeSpouses: vine.boolean().optional(),
  })
)

@inject()
export default class FamilySearchController {
  constructor(
    private familySearchService: FamilySearchService,
    private familyChartAdapter: FamilyChartAdapterService
  ) {}

  /**
   * Search family by CPF
   * GET /api/v1/persons/family/search
   */
  async search({ request, response }: HttpContext) {
    const data = await request.validateUsing(searchValidator)

    try {
      const result = await this.familySearchService.searchFamilyByCpf(data.cpf, {
        maxDepth: data.maxDepth,
        includeSpouses: data.includeSpouses,
        cacheExpiry: data.cacheExpiry,
      })

      return response.ok({
        success: true,
        data: result,
        meta: {
          total: result.length,
          cpf: data.cpf,
          maxDepth: data.maxDepth || 3,
        },
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Error searching family data',
        error: error.message,
      })
    }
  }

  /**
   * Search multiple families by CPFs
   * POST /api/v1/persons/family/search-multiple
   */
  async searchMultiple({ request, response }: HttpContext) {
    const data = await request.validateUsing(multiSearchValidator)

    try {
      const results = await this.familySearchService.searchMultipleFamilies(data.cpfs, {
        maxDepth: data.maxDepth,
        includeSpouses: data.includeSpouses,
      })

      // Convert Map to object for JSON response
      const resultsObject: Record<string, any> = {}
      results.forEach((value, key) => {
        resultsObject[key] = value
      })

      return response.ok({
        success: true,
        data: resultsObject,
        meta: {
          totalCpfs: data.cpfs.length,
          successfulSearches: Object.keys(resultsObject).filter(
            (cpf) => resultsObject[cpf].length > 0
          ).length,
        },
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Error searching multiple families',
        error: error.message,
      })
    }
  }

  /**
   * Get family tree from database
   * GET /api/v1/persons/:id/family-tree
   */
  async getFamilyTree({ params, response }: HttpContext) {
    const personId = params.id

    try {
      const familyTree = await this.familyChartAdapter.getStoredFamilyChart(personId)

      if (familyTree.length === 0) {
        return response.notFound({
          success: false,
          message: 'Person not found or no family data available',
        })
      }

      return response.ok({
        success: true,
        data: familyTree,
        meta: {
          total: familyTree.length,
          personId,
        },
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Error retrieving family tree',
        error: error.message,
      })
    }
  }

  /**
   * Import family data from external API
   * POST /api/v1/persons/family/import
   */
  async importFamily({ request, response }: HttpContext) {
    const data = await request.validateUsing(searchValidator)

    try {
      // Search family data
      const familyData = await this.familySearchService.searchFamilyByCpf(data.cpf, {
        maxDepth: data.maxDepth || 3,
        includeSpouses: data.includeSpouses !== false,
      })

      if (familyData.length === 0) {
        return response.notFound({
          success: false,
          message: 'No family data found for the provided CPF',
        })
      }

      // Save to database
      await this.familyChartAdapter.saveFamilyChartData(familyData)

      return response.created({
        success: true,
        message: 'Family data imported successfully',
        data: {
          imported: familyData.length,
          mainPerson: familyData.find((p) => p.main),
        },
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Error importing family data',
        error: error.message,
      })
    }
  }

  /**
   * Clear cache for specific CPF
   * DELETE /api/v1/persons/family/cache/:cpf
   */
  async clearCache({ params, response }: HttpContext) {
    const cpf = params.cpf

    try {
      await this.familySearchService.clearCache(cpf)

      return response.ok({
        success: true,
        message: `Cache cleared for CPF: ${cpf}`,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Error clearing cache',
        error: error.message,
      })
    }
  }

  /**
   * Clear all family search cache
   * DELETE /api/v1/persons/family/cache
   */
  async clearAllCache({ response }: HttpContext) {
    try {
      await this.familySearchService.clearAllCache()

      return response.ok({
        success: true,
        message: 'All family search cache cleared',
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Error clearing cache',
        error: error.message,
      })
    }
  }
}
