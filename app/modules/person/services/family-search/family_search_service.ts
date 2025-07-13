import { inject } from '@adonisjs/core'
import redis from '@adonisjs/redis/services/main'
import logger from '@adonisjs/core/services/logger'
import ExternalApiService from '#shared/services/external_api_service'
import FamilyChartAdapterService from '#shared/services/family_chart_adapter_service'

interface FamilyChartPerson {
  id: string
  data: {
    first_name?: string
    last_name?: string
    birthday?: string
    avatar?: string
    gender?: string
    label?: string
    desc?: string
  }
  rels: {
    spouses?: string[]
    father?: string
    mother?: string
    children?: string[]
  }
  main?: boolean
}

interface SearchOptions {
  maxDepth?: number
  includeSpouses?: boolean
  cacheExpiry?: number
}

@inject()
export default class FamilySearchService {
  private externalApiService: ExternalApiService
  private familyChartAdapter: FamilyChartAdapterService
  private readonly CACHE_PREFIX = 'family:search'
  private readonly DEFAULT_CACHE_TTL = 86400 // 24 hours

  constructor() {
    this.externalApiService = new ExternalApiService()
    this.familyChartAdapter = new FamilyChartAdapterService()
  }

  /**
   * Search family recursively with cache
   */
  async searchFamilyByCpf(cpf: string, options: SearchOptions = {}): Promise<FamilyChartPerson[]> {
    const { maxDepth = 3, includeSpouses = true, cacheExpiry = this.DEFAULT_CACHE_TTL } = options

    // Check cache first
    const cacheKey = this.getCacheKey(cpf, options)
    const cached = await this.getFromCache(cacheKey)
    if (cached) {
      logger.info(`Cache hit for CPF: ${cpf}`)
      return cached
    }

    logger.info(`Starting recursive family search for CPF: ${cpf}`)

    // Recursive search
    const result = await this.recursiveFamilySearch(
      cpf,
      new Set<string>(),
      0,
      maxDepth,
      includeSpouses
    )

    // Save to cache
    await this.saveToCache(cacheKey, result, cacheExpiry)

    return result
  }

  /**
   * Private recursive search
   */
  private async recursiveFamilySearch(
    cpf: string,
    processedCpfs: Set<string>,
    currentDepth: number,
    maxDepth: number,
    includeSpouses: boolean
  ): Promise<FamilyChartPerson[]> {
    // Check if already processed or reached max depth
    if (processedCpfs.has(cpf) || currentDepth > maxDepth) {
      return []
    }

    processedCpfs.add(cpf)
    const result: FamilyChartPerson[] = []

    try {
      // Get person data
      const personData = await this.externalApiService.getPersonByCpf(cpf)
      if (!personData) {
        logger.warn(`No data found for CPF: ${cpf}`)
        return []
      }

      // Convert to FamilyChart format
      const familyData = await this.familyChartAdapter.convertToFamilyChart(cpf)
      result.push(...familyData)

      // If shouldn't continue recursive search
      if (currentDepth >= maxDepth) {
        return result
      }

      // Recursive search on relatives
      if (personData.PARENTES) {
        for (const parente of personData.PARENTES) {
          // Skip spouses if not requested
          if (!includeSpouses && parente.VINCULO === 'CONJUGE') {
            continue
          }

          // Recursive search on relative
          const parenteData = await this.recursiveFamilySearch(
            parente.CPF_VINCULO,
            processedCpfs,
            currentDepth + 1,
            maxDepth,
            includeSpouses
          )

          // Add only non-duplicate persons
          for (const person of parenteData) {
            if (!result.find((p) => p.id === person.id)) {
              result.push(person)
            }
          }
        }
      }

      // Search children if person is mother
      if (personData.SEXO === 'F') {
        const children = await this.externalApiService.getChildrenByMother(personData.NOME)
        for (const child of children) {
          if (!processedCpfs.has(child.CPF)) {
            const childData = await this.recursiveFamilySearch(
              child.CPF,
              processedCpfs,
              currentDepth + 1,
              maxDepth,
              includeSpouses
            )

            for (const person of childData) {
              if (!result.find((p) => p.id === person.id)) {
                result.push(person)
              }
            }
          }
        }
      }

      // Search children if person is father
      if (personData.SEXO === 'M') {
        const children = await this.externalApiService.getChildrenByFather(personData.NOME)
        for (const child of children) {
          if (!processedCpfs.has(child.CPF)) {
            const childData = await this.recursiveFamilySearch(
              child.CPF,
              processedCpfs,
              currentDepth + 1,
              maxDepth,
              includeSpouses
            )

            for (const person of childData) {
              if (!result.find((p) => p.id === person.id)) {
                result.push(person)
              }
            }
          }
        }
      }
    } catch (error) {
      logger.error(`Error searching family for CPF ${cpf}:`, error)
    }

    return result
  }

  /**
   * Search multiple CPFs in parallel
   */
  async searchMultipleFamilies(
    cpfs: string[],
    options: SearchOptions = {}
  ): Promise<Map<string, FamilyChartPerson[]>> {
    const results = new Map<string, FamilyChartPerson[]>()

    // Process in batches to avoid overload
    const batchSize = 5
    for (let i = 0; i < cpfs.length; i += batchSize) {
      const batch = cpfs.slice(i, i + batchSize)
      const promises = batch.map((cpf) =>
        this.searchFamilyByCpf(cpf, options)
          .then((data) => ({ cpf, data }))
          .catch((error) => {
            logger.error(`Error searching CPF ${cpf}:`, error)
            return { cpf, data: [] as FamilyChartPerson[] }
          })
      )

      const batchResults = await Promise.all(promises)
      for (const { cpf, data } of batchResults) {
        results.set(cpf, data)
      }
    }

    return results
  }

  /**
   * Clear cache for specific CPF
   */
  async clearCache(cpf: string): Promise<void> {
    const pattern = `${this.CACHE_PREFIX}:${cpf}:*`
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  }

  /**
   * Clear all family search cache
   */
  async clearAllCache(): Promise<void> {
    const pattern = `${this.CACHE_PREFIX}:*`
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  }

  /**
   * Generate cache key
   */
  private getCacheKey(cpf: string, options: SearchOptions): string {
    const cleanCpf = cpf.replace(/\D/g, '')
    const optionsHash = `${options.maxDepth || 3}_${options.includeSpouses ? 1 : 0}`
    return `${this.CACHE_PREFIX}:${cleanCpf}:${optionsHash}`
  }

  /**
   * Get from cache
   */
  private async getFromCache(key: string): Promise<FamilyChartPerson[] | null> {
    try {
      const cached = await redis.get(key)
      if (cached) {
        return JSON.parse(cached)
      }
    } catch (error) {
      logger.error('Error reading from cache:', error)
    }
    return null
  }

  /**
   * Save to cache
   */
  private async saveToCache(key: string, data: FamilyChartPerson[], ttl: number): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(data))
    } catch (error) {
      logger.error('Error saving to cache:', error)
    }
  }
}
