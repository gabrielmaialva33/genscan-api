import { BaseSeeder } from '@adonisjs/lucid/seeders'
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
    const personMap = new Map<string, Person>()

    for (const entry of data) {
      const personId = crypto.randomUUID()
      personIdMap.set(entry.id, personId)
    }

    for (const entry of data) {
      const cpf = entry.id
      const cpfHash = crypto.createHash('sha256').update(cpf).digest('hex')
      const personId = personIdMap.get(entry.id)!

      const person = await Person.create({
        id: personId,
        name: entry.data['first name'],
        cpf_hash: cpfHash,
        gender: entry.data.gender,
      })
      personMap.set(entry.id, person)
    }

    for (const entry of data) {
      const person = personMap.get(entry.id)
      if (!person) continue

      if (entry.rels.father) {
        const fatherId = personIdMap.get(entry.rels.father)
        if (fatherId) {
          await Relationship.create({
            person_id: person.id,
            related_person_id: fatherId,
            relationship_type: 'father',
          })
        }
      }

      if (entry.rels.mother) {
        const motherId = personIdMap.get(entry.rels.mother)
        if (motherId) {
          await Relationship.create({
            person_id: person.id,
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
              person_id: person.id,
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
              person_id: person.id,
              related_person_id: childUUID,
              relationship_type: 'child',
            })
          }
        }
      }
    }
  }
}
