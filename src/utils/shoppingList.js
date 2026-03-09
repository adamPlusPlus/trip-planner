// Parse and rebuild markdown checkbox content (shopping/packing lists). Supports person tags.

/**
 * Parse markdown into sections with checkbox items. Items may have people: string[].
 * @param {string} text
 * @returns {Array<{ type: string, level?: number, text: string, items: Array<{ checked?: boolean, text?: string, type?: string, people?: string[] }> }>}
 */
export function parseCheckboxContent(text) {
  if (!text) return []

  const lines = text.split('\n')
  const sections = []
  let currentSection = null

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    if (trimmed.match(/^#{1,6}\s+/)) {
      if (currentSection) sections.push(currentSection)
      currentSection = {
        type: 'header',
        level: trimmed.match(/^#+/)[0].length,
        text: trimmed.replace(/^#+\s+/, ''),
        items: [],
      }
    } else if (trimmed.startsWith('- [ ]') || trimmed.startsWith('- [x]') || trimmed.startsWith('- [X]')) {
      if (!currentSection) {
        currentSection = { type: 'section', text: '', items: [] }
      }
      const checked = trimmed.includes('[x]') || trimmed.includes('[X]')
      let itemText = trimmed.replace(/^-\s*\[[xX\s]\]\s*/, '')
      let people = ['person1', 'person2']

      if (itemText.includes('[person1]')) {
        people = ['person1']
        itemText = itemText.replace(/\[person1\]/g, '').trim()
      } else if (itemText.includes('[person2]')) {
        people = ['person2']
        itemText = itemText.replace(/\[person2\]/g, '').trim()
      } else if (itemText.includes('[both]')) {
        people = ['person1', 'person2']
        itemText = itemText.replace(/\[both\]/g, '').trim()
      }

      currentSection.items.push({ checked, text: itemText, people })
    } else if (currentSection) {
      currentSection.items.push({ type: 'text', text: trimmed })
    } else {
      if (!sections.length || sections[sections.length - 1].type !== 'text') {
        sections.push({ type: 'text', text: trimmed })
      } else {
        sections[sections.length - 1].text += '\n' + trimmed
      }
    }
  }

  if (currentSection) sections.push(currentSection)
  return sections
}

/**
 * Rebuild markdown from sections. Writes person tag when people.length === 1.
 * @param {ReturnType<parseCheckboxContent>} sections
 * @returns {string}
 */
export function rebuildContent(sections) {
  let newContent = ''
  for (const sec of sections) {
    if (sec.type === 'header') {
      newContent += '#'.repeat(sec.level) + ' ' + sec.text + '\n\n'
      if (sec.items?.length) {
        for (const item of sec.items) {
          if (item.type === 'text') {
            newContent += item.text + '\n'
          } else {
            const checkbox = item.checked ? 'x' : ' '
            let itemText = item.text || ''
            if (item.people?.length === 1) {
              itemText = `${itemText} [${item.people[0]}]`
            }
            newContent += `- [${checkbox}] ${itemText}\n`
          }
        }
        newContent += '\n'
      }
    } else if (sec.type === 'text') {
      newContent += sec.text + '\n\n'
    } else if (sec.items?.length) {
      for (const item of sec.items) {
        if (item.type === 'text') {
          newContent += item.text + '\n'
        } else {
          const checkbox = item.checked ? 'x' : ' '
          let itemText = item.text || ''
          if (item.people?.length === 1) {
            itemText = `${itemText} [${item.people[0]}]`
          }
          newContent += `- [${checkbox}] ${itemText}\n`
        }
      }
      newContent += '\n'
    }
  }
  return newContent.trim() + '\n'
}

/** Strip person tags for Apple Notes / clipboard. */
export function formatForAppleNotes(text) {
  const sections = parseCheckboxContent(text)
  let out = ''
  for (const sec of sections) {
    if (sec.type === 'header') {
      out += '#'.repeat(sec.level) + ' ' + sec.text + '\n\n'
      if (sec.items?.length) {
        for (const item of sec.items) {
          if (item.type === 'text') out += item.text + '\n'
          else {
            const checkbox = item.checked ? 'x' : ' '
            const clean = (item.text || '').replace(/\s*\[person1\]\s*/g, '').replace(/\s*\[person2\]\s*/g, '').replace(/\s*\[both\]\s*/g, '').trim()
            out += `- [${checkbox}] ${clean}\n`
          }
        }
        out += '\n'
      }
    } else if (sec.type === 'text') {
      out += sec.text + '\n\n'
    } else if (sec.items?.length) {
      for (const item of sec.items) {
        if (item.type === 'text') out += item.text + '\n'
        else {
          const checkbox = item.checked ? 'x' : ' '
          const clean = (item.text || '').replace(/\s*\[person1\]\s*/g, '').replace(/\s*\[person2\]\s*/g, '').replace(/\s*\[both\]\s*/g, '').trim()
          out += `- [${checkbox}] ${clean}\n`
        }
      }
      out += '\n'
    }
  }
  return out.trim() + '\n'
}
