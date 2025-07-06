import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { PersonFactory } from '#database/factories/person_factory'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import Person from '#modules/person/models/person'
import Relationship from '#modules/person/models/relationship'
import crypto from 'node:crypto'

export default class extends BaseSeeder {
  static environment = ['development', 'testing']

  async run() {
    const filePath = join(process.cwd(), 'database/seeders/data/genealogy.json')
    const data = JSON.parse(await readFile(filePath, 'utf-8'))

    const personIdMap = new Map<string, string>()
    const createdPersons = new Set<string>()

    for (const entry of data) {
      if (!personIdMap.has(entry.id)) {
        personIdMap.set(entry.id, crypto.randomUUID())
      }
    }

    for (const entry of data) {
      if (createdPersons.has(entry.id)) continue

      const personId = personIdMap.get(entry.id)!
      const cpf = entry.id
      const cpfHash = crypto.createHash('sha256').update(cpf).digest('hex')

      await PersonFactory.merge({
        id: personId,
        name: entry.data.label || `${entry.data.fn} ${entry.data.ln}`.trim() || entry.id,
        cpf_hash: cpfHash,
        gender: entry.data.gender,
        birth_date: entry.data.birthday,
      }).create()

      createdPersons.add(entry.id)
    }

    for (const entry of data) {
      const personId = personIdMap.get(entry.id)
      if (!personId) continue

      if (entry.rels.father) {
        const fatherId = personIdMap.get(entry.rels.father)
        if (fatherId) {
          await Relationship.create({
            person_id: personId,
            related_person_id: fatherId,
            relationship_type: 'father',
          })
        }
      }

      if (entry.rels.mother) {
        const motherId = personIdMap.get(entry.rels.mother)
        if (motherId) {
          await Relationship.create({
            person_id: personId,
            related_person_id: motherId,
            relationship_type: 'mother',
          })
        }
      }

      if (entry.rels.spouses) {
        for (const spouseId of entry.rels.spouses) {
          const spouseUUID = personIdMap.get(spouseId)
          if (spouseUUID) {
            await Relationship.create({
              person_id: personId,
              related_person_id: spouseUUID,
              relationship_type: 'spouse',
            })
          }
        }
      }

      if (entry.rels.children) {
        for (const childId of entry.rels.children) {
          const childUUID = personIdMap.get(childId)
          if (childUUID) {
            await Relationship.create({
              person_id: personId,
              related_person_id: childUUID,
              relationship_type: 'child',
            })
          }
        }
      }
    }
  }
}
