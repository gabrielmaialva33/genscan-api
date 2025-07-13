import axios from 'axios'
import env from '#start/env'
import logger from '@adonisjs/core/services/logger'

interface ExternalApiPerson {
  NOME: string
  CPF: string
  SEXO: string
  NASCIMENTO: string
  NOME_MAE: string
  NOME_PAI: string
  ESTADO_CIVIL?: string
  RG?: string
  ORGAO_EMISSOR?: string
  UF_EMISSAO?: string
  RENDA?: string
  TITULO_ELEITOR?: string
  PESO?: string
  PIS?: string
  PODER_AQUISITIVO?: string
  FX_PODER_AQUISITIVO?: string
  CSB8?: string
  CSB8_FAIXA?: string
  CSBA?: string
  CSBA_FAIXA?: string
  NSU?: string
  ZONA?: string
  SECAO?: string
  TELEFONES?: Array<{ NUMBER: string }>
  EMAIL?: Array<{
    EMAIL: string
    EMAIL_PESSOAL: string
    EMAIL_SCORE: string
  }>
  PARENTES?: Array<{
    CPF_VINCULO: string
    NOME_VINCULO: string
    VINCULO: string
  }>
  ENDERECO?: Array<{
    BAIRRO: string
    CEP: string
    CIDADE: string
    COMPLEMENTO: string
    LOGRADOURO: string
    LOGRADOURO_NUMERO: string
    UF: string
  }>
}

interface ExternalApiChild {
  NOME: string
  CPF: string
  NASCIMENTO: string
  SEXO: string
  MAE: string
  PAI: string | null
}

export default class ExternalApiService {
  private readonly cpfToken: string
  private readonly parentToken: string
  private readonly baseUrl = 'https://api.findexbuscas.com.br/api.php'
  private readonly headers = {
    'User-Agent':
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
    'Accept': 'application/json',
  }

  constructor() {
    this.cpfToken = env.get('DATA_API_CPF_TOKEN', '')
    this.parentToken = env.get('DATA_API_PARENT_TOKEN', '')
  }

  /**
   * Busca dados de uma pessoa pelo CPF
   */
  async getPersonByCpf(cpf: string): Promise<ExternalApiPerson | null> {
    try {
      const cleanCpf = cpf.replace(/\D/g, '')
      const response = await axios.get<ExternalApiPerson>(`${this.baseUrl}`, {
        params: {
          token: this.cpfToken,
          cpf: cleanCpf,
        },
        headers: this.headers,
      })

      return response.data
    } catch (error) {
      logger.error('Error fetching person by CPF', error)
      return null
    }
  }

  /**
   * Busca filhos pelo nome do pai
   */
  async getChildrenByFather(fatherName: string): Promise<ExternalApiChild[]> {
    try {
      const response = await axios.get<ExternalApiChild[]>(`${this.baseUrl}`, {
        params: {
          token: this.parentToken,
          pai: fatherName,
        },
        headers: this.headers,
      })

      return Array.isArray(response.data) ? response.data : []
    } catch (error) {
      logger.error('Error fetching children by father', error)
      return []
    }
  }

  /**
   * Busca filhos pelo nome da mãe
   */
  async getChildrenByMother(motherName: string): Promise<ExternalApiChild[]> {
    try {
      const response = await axios.get<ExternalApiChild[]>(`${this.baseUrl}`, {
        params: {
          token: this.parentToken,
          mae: motherName,
        },
        headers: this.headers,
      })

      return Array.isArray(response.data) ? response.data : []
    } catch (error) {
      logger.error('Error fetching children by mother', error)
      return []
    }
  }

  /**
   * Busca dados completos de uma família incluindo pais e parentes
   */
  async getFamilyData(cpf: string): Promise<{
    person: ExternalApiPerson | null
    relatives: Map<string, ExternalApiPerson>
  }> {
    const relatives = new Map<string, ExternalApiPerson>()

    // Busca a pessoa principal
    const person = await this.getPersonByCpf(cpf)
    if (!person) {
      return { person: null, relatives }
    }

    // Busca dados dos parentes
    if (person.PARENTES) {
      for (const relative of person.PARENTES) {
        const relativeData = await this.getPersonByCpf(relative.CPF_VINCULO)
        if (relativeData) {
          relatives.set(relative.CPF_VINCULO, relativeData)
        }
      }
    }

    return { person, relatives }
  }
}
