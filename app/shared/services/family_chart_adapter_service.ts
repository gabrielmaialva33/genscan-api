import crypto from 'node:crypto'
import { DateTime } from 'luxon'

import ExternalApiService from '#shared/services/external_api_service'

import Person from '#modules/person/models/person'
import Relationship from '#modules/person/models/relationship'

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

export default class FamilyChartAdapterService {
  private externalApiService: ExternalApiService
  private cpfToIdMap: Map<string, string> = new Map()

  constructor() {
    this.externalApiService = new ExternalApiService()
  }

  private generateId(cpf: string): string {
    if (this.cpfToIdMap.has(cpf)) {
      return this.cpfToIdMap.get(cpf)!
    }
    const id = crypto.randomUUID()
    this.cpfToIdMap.set(cpf, id)
    return id
  }

  private convertDate(dateStr: string): string | null {
    if (!dateStr || dateStr === 'SEM INFORMAÇÃO') return null

    try {
      const [day, month, year] = dateStr.split('/')
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    } catch {
      return null
    }
  }

  private extractNames(fullName: string): { firstName: string; lastName: string } {
    const parts = fullName.split(' ').filter((p) => p)
    const firstName = parts[0] || ''
    const lastName = parts.length > 1 ? parts[parts.length - 1] : ''
    return { firstName, lastName }
  }

  private convertGender(gender: string): string {
    return gender === 'F' ? 'F' : 'M'
  }

  async convertToFamilyChart(cpf: string): Promise<FamilyChartPerson[]> {
    const result: FamilyChartPerson[] = []
    const processedCpfs = new Set<string>()

    const { person, relatives } = await this.externalApiService.getFamilyData(cpf)
    if (!person) return []

    const mainPersonId = this.generateId(person.CPF)
    const { firstName, lastName } = this.extractNames(person.NOME)

    const mainPerson: FamilyChartPerson = {
      id: mainPersonId,
      data: {
        first_name: firstName,
        last_name: lastName,
        birthday: this.convertDate(person.NASCIMENTO) || undefined,
        gender: this.convertGender(person.SEXO),
        label: person.NOME,
        desc: `CPF: ${person.CPF}`,
        avatar:
          'https://static8.depositphotos.com/1009634/988/v/950/depositphotos_9883921-stock-illustration-no-user-profile-picture.jpg',
      },
      rels: {
        spouses: [],
        children: [],
      },
      main: true,
    }

    if (person.PARENTES) {
      for (const parente of person.PARENTES) {
        const parenteId = this.generateId(parente.CPF_VINCULO)

        switch (parente.VINCULO) {
          case 'MAE':
            mainPerson.rels.mother = parenteId
            break
          case 'PAI':
            mainPerson.rels.father = parenteId
            break
          case 'IRMA(O)':
            break
          case 'AVO':
          case 'TIA(O)':
            break
        }
      }
    }

    result.push(mainPerson)
    processedCpfs.add(person.CPF)

    for (const [cpfVinculo, relative] of relatives) {
      if (processedCpfs.has(cpfVinculo)) continue

      const relativeId = this.generateId(cpfVinculo)
      const { firstName: relFirstName, lastName: relLastName } = this.extractNames(relative.NOME)

      const relativePerson: FamilyChartPerson = {
        id: relativeId,
        data: {
          first_name: relFirstName,
          last_name: relLastName,
          birthday: this.convertDate(relative.NASCIMENTO) || undefined,
          gender: this.convertGender(relative.SEXO),
          label: relative.NOME,
          desc: `CPF: ${relative.CPF}`,
          avatar:
            'https://static8.depositphotos.com/1009634/988/v/950/depositphotos_9883921-stock-illustration-no-user-profile-picture.jpg',
        },
        rels: {
          spouses: [],
          children: [],
        },
        main: false,
      }

      if (relative.NOME === person.NOME_MAE || relative.NOME === person.NOME_PAI) {
        relativePerson.rels.children?.push(mainPersonId)
      }

      result.push(relativePerson)
      processedCpfs.add(cpfVinculo)
    }

    const children = await this.externalApiService.getChildrenByMother(person.NOME)
    for (const child of children) {
      if (processedCpfs.has(child.CPF)) continue

      const childId = this.generateId(child.CPF)
      const { firstName: childFirstName, lastName: childLastName } = this.extractNames(child.NOME)

      const childPerson: FamilyChartPerson = {
        id: childId,
        data: {
          first_name: childFirstName,
          last_name: childLastName,
          birthday: this.convertDate(child.NASCIMENTO) || undefined,
          gender: this.convertGender(child.SEXO),
          label: child.NOME,
          desc: `CPF: ${child.CPF}`,
          avatar:
            'https://static8.depositphotos.com/1009634/988/v/950/depositphotos_9883921-stock-illustration-no-user-profile-picture.jpg',
        },
        rels: {
          mother: mainPersonId,
          father: child.PAI ? this.generateId(child.PAI) : undefined,
        },
        main: false,
      }

      mainPerson.rels.children?.push(childId)
      result.push(childPerson)
      processedCpfs.add(child.CPF)
    }

    return result
  }

  async getStoredFamilyChart(personId?: string): Promise<FamilyChartPerson[]> {
    const result: FamilyChartPerson[] = []

    const query = Person.query()
      .preload('relationships', (relQuery) => {
        relQuery.preload('relative')
      })
      .preload('contacts')
      .preload('addresses')

    if (personId) {
      query.where('id', personId)
    }

    const people = await query

    for (const person of people) {
      const { firstName, lastName } = this.extractNames(person.name)

      const familyChartPerson: FamilyChartPerson = {
        id: person.id,
        data: {
          first_name: firstName,
          last_name: lastName,
          birthday: person.birth_date?.toFormat('yyyy-MM-dd') || undefined,
          gender: person.gender || 'M',
          label: person.name,
          desc: person.email || undefined,
          avatar:
            'https://static8.depositphotos.com/1009634/988/v/950/depositphotos_9883921-stock-illustration-no-user-profile-picture.jpg',
        },
        rels: {
          spouses: [],
          children: [],
        },
        main: person.id === personId,
      }

      // Adiciona relacionamentos
      for (const rel of person.relationships) {
        switch (rel.relationship_type) {
          case 'father':
            familyChartPerson.rels.father = rel.related_person_id
            break
          case 'mother':
            familyChartPerson.rels.mother = rel.related_person_id
            break
          case 'spouse':
            familyChartPerson.rels.spouses?.push(rel.related_person_id)
            break
          case 'child':
            familyChartPerson.rels.children?.push(rel.related_person_id)
            break
        }
      }

      result.push(familyChartPerson)
    }

    return result
  }

  async saveFamilyChartData(data: FamilyChartPerson[]): Promise<void> {
    for (const personData of data) {
      const cpfHash = crypto.createHash('sha256').update(personData.id).digest('hex')

      const person = await Person.updateOrCreate(
        { cpf_hash: cpfHash },
        {
          id: personData.id,
          name:
            personData.data.label ||
            `${personData.data.first_name} ${personData.data.last_name}`.trim(),
          cpf_hash: cpfHash,
          email: personData.data.desc?.includes('@') ? personData.data.desc : null,
          birth_date: personData.data.birthday ? DateTime.fromISO(personData.data.birthday) : null,
          gender: personData.data.gender,
          external_data: {
            first_name: personData.data.first_name,
            last_name: personData.data.last_name,
            avatar: personData.data.avatar,
            desc: personData.data.desc,
          },
        }
      )

      if (personData.rels.father) {
        await Relationship.updateOrCreate(
          {
            person_id: person.id,
            related_person_id: personData.rels.father,
            relationship_type: 'father',
          },
          {}
        )
      }

      if (personData.rels.mother) {
        await Relationship.updateOrCreate(
          {
            person_id: person.id,
            related_person_id: personData.rels.mother,
            relationship_type: 'mother',
          },
          {}
        )
      }

      if (personData.rels.spouses) {
        for (const spouseId of personData.rels.spouses) {
          await Relationship.updateOrCreate(
            {
              person_id: person.id,
              related_person_id: spouseId,
              relationship_type: 'spouse',
            },
            {}
          )
        }
      }

      if (personData.rels.children) {
        for (const childId of personData.rels.children) {
          await Relationship.updateOrCreate(
            {
              person_id: person.id,
              related_person_id: childId,
              relationship_type: 'child',
            },
            {}
          )
        }
      }
    }
  }
}
