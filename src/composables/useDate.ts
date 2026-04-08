import dayjs from 'dayjs'
import 'dayjs/locale/th'
import buddhistEra from "dayjs/plugin/buddhistEra";

dayjs.locale('th')
dayjs.extend(buddhistEra);

interface BuddhistDateParts {
  day: string
  month: string
  year: string
}

function convertToBuddhistDateSplit(date: unknown): BuddhistDateParts | '' {
  if (date == null) return ''
  const d = dayjs(date as string | number | Date)
  if (!d.isValid()) return ''
  return {
    day: d.locale("th").format('DD'),
    month: d.locale("th").format('MMM'),
    year: d.locale("th").format('BB'),
  }
}

export function useDate() {
  function formatDate(date: unknown): string {
    if (date == null) return ''
    const d = dayjs(
      typeof date === 'string' && date.length === 10
        ? date + 'T00:00:00'
        : (date as string | number | Date),
    )
    if (!d.isValid()) return 'Invalid Date'
    const parts = convertToBuddhistDateSplit(d.toDate()) as BuddhistDateParts

    return `${parts.day} ${parts.month} ${parts.year}`
  }

  return { formatDate, convertToBuddhistDateSplit }
}
