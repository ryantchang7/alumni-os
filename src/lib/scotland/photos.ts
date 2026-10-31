/**
 * The nine photographs on /scotland, and what we are willing to say about
 * each one.
 *
 * Shot in October 2026 and handed over by Ryan. The files in
 * /public/scotland are resized (2400px long edge for landscape, 1800px for
 * portrait), EXIF rotation baked into the pixels so the width/height below
 * match what next/image actually serves, and stripped of metadata.
 *
 * `placeConfirmed` records whether someone who was there has confirmed
 * where a frame was taken. All nine are confirmed. Five were always
 * unmistakable: the Swilcan Bridge, the 18th at the Old Course, the R&A.
 * The other four showed a links course by the sea, which in Fife narrows
 * things to about forty candidates, so they ran with captions that named
 * no course until Ryan confirmed Kingsbarns and Carnoustie on 2026-10-30.
 *
 * The flag stays in the type because the next batch will arrive the same
 * way. A caption never guesses a course name onto a photograph.
 */

export interface ScotlandPhoto {
  id: string
  src: string
  width: number
  height: number
  /** What is in the frame, written for someone who cannot see it. */
  alt: string
  /** Printed under the photo. Short, true, and never a guess. */
  caption: string
  /** Small label on the contact sheet at the foot of the page. */
  label: string
  /**
   * false = nobody has confirmed where this was taken, so neither the
   * caption nor the alt text names a course.
   */
  placeConfirmed: boolean
  blurDataURL: string
}

/** Narrative order. The contact sheet renders this list as-is. */
export const SCOTLAND_PHOTOS: ScotlandPhoto[] = [
  {
    id: 'old-course-evening',
    src: '/scotland/old-course-evening.jpg',
    width: 2400,
    height: 1600,
    alt:
      'The Old Course at St Andrews late in the day, the humps and hollows of the links in low gold light with the town skyline behind.',
    caption: 'St Andrews, late in the day.',
    label: 'St Andrews',
    placeConfirmed: true,
    blurDataURL:
      'data:image/jpeg;base64,/9j/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAALABADASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAQMEBv/EACAQAAIBAwQDAAAAAAAAAAAAAAECAwAEEQYSITEiYXH/xAAVAQEBAAAAAAAAAAAAAAAAAAABA//EABgRAQEAAwAAAAAAAAAAAAAAAAEAAhEx/9oADAMBAAIRAxEAPwB9vq5SwSC3XPtiaMmopSQGtIyT2d/FZaxmkZgCxxjqqix8ucfOKm5o6I7f/9k=',
  },
  {
    id: 'four-teams-old-course',
    src: '/scotland/four-teams-old-course.jpg',
    width: 2400,
    height: 1600,
    alt:
      'Players and coaches from all four teams stand together on the Old Course at St Andrews, with the town behind them.',
    caption: 'Every team at the Collegiate: Penn, Texas, Washington and the host University of St Andrews.',
    label: 'The Collegiate',
    placeConfirmed: true,
    blurDataURL:
      'data:image/jpeg;base64,/9j/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAALABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABAED/8QAIBAAAgEEAQUAAAAAAAAAAAAAAQIDAAURIQQSMXGBkf/EABUBAQEAAAAAAAAAAAAAAAAAAAED/8QAGBEAAgMAAAAAAAAAAAAAAAAAABIhMfD/2gAMAwEAAhEDEQA/AMYr6EyonmUINjNJS9NJ25SrkZXqOvtIEMR0Y1PqpJBEi5WNAfFT1isH/9k=',
  },
  {
    id: 'team-swilcan-bridge',
    src: '/scotland/team-swilcan-bridge.jpg',
    width: 2400,
    height: 1600,
    alt:
      'The Penn golf team stands on the Swilcan Bridge on the Old Course, the R&A clubhouse and the Martyrs Monument behind them.',
    caption: 'Penn on the Swilcan Bridge.',
    label: 'Old Course',
    placeConfirmed: true,
    blurDataURL:
      'data:image/jpeg;base64,/9j/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAALABADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAwX/xAAeEAACAgICAwAAAAAAAAAAAAABAgMRAAQFIRIUcv/EABUBAQEAAAAAAAAAAAAAAAAAAAAC/8QAGBEBAAMBAAAAAAAAAAAAAAAAAQACAxH/2gAMAwEAAhEDEQA/AF3tlYoU9VTMzNRWj0KPeHBNrzayyTQtE5FlQLyNw88rcs6s7MFRwPI3WUG7Vfk4drh2SZVSf//Z',
  },
  {
    id: 'penn-party-st-andrews',
    src: '/scotland/penn-party-st-andrews.jpg',
    width: 2400,
    height: 1492,
    alt:
      'The Penn travelling party, players, coaches, alumni and families, gathered in front of the tournament flags at St Andrews.',
    caption: 'The Penn travelling party: players, coaches, alumni and families.',
    label: 'St Andrews',
    placeConfirmed: true,
    blurDataURL:
      'data:image/jpeg;base64,/9j/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAAKABADASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAAIEBv/EACIQAAIBAwIHAAAAAAAAAAAAAAECAwARQRMhBAYSFjFRcf/EABUBAQEAAAAAAAAAAAAAAAAAAAED/8QAFxEBAAMAAAAAAAAAAAAAAAAAAAERE//aAAwDAQACEQMRAD8AvHN8Ks6SQ7pa/SwzR3Pws02jpOH8WJH3BrPwop3Kgn2RTNGgIIRbjNqjrJp//9k=',
  },
  {
    id: 'links-and-the-sea',
    src: '/scotland/links-and-the-sea.jpg',
    width: 1800,
    height: 2400,
    alt:
      'A fairway at Kingsbarns running along a rocky shoreline under heavy grey cloud, marram grass in the foreground and players in the distance.',
    caption: 'Kingsbarns, with the North Sea doing the weather.',
    label: 'Kingsbarns',
    placeConfirmed: true,
    blurDataURL:
      'data:image/jpeg;base64,/9j/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAAVABADASIAAhEBAxEB/8QAGAAAAgMAAAAAAAAAAAAAAAAAAAQCAwb/xAAgEAACAQMEAwAAAAAAAAAAAAABAgADBBESITFBYWJx/8QAFwEAAwEAAAAAAAAAAAAAAAAAAAECBP/EABcRAQEBAQAAAAAAAAAAAAAAAAABAhH/2gAMAwEAAhEDEQA/AHLe5UABiM+3cfo3VDkkDokHqZgXYbZFUnzK2unp7tSRvuYrrI5SZqNnmTFV9OSYQmdT/9k=',
  },
  {
    id: 'the-group-on-course',
    src: '/scotland/the-group-on-course.jpg',
    width: 1080,
    height: 499,
    alt:
      'About twenty players, alumni and family members standing together on a fairway at Kingsbarns with the sea behind them.',
    caption: 'Team and alumni at Kingsbarns, out in the same groups.',
    label: 'Kingsbarns',
    placeConfirmed: true,
    blurDataURL:
      'data:image/jpeg;base64,/9j/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAAHABADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAL/xAAeEAACAQQDAQAAAAAAAAAAAAABAwACBBESITFRsf/EABUBAQEAAAAAAAAAAAAAAAAAAAEE/8QAGREAAgMBAAAAAAAAAAAAAAAAABEBAgNB/9oADAMBAAIRAxEAPwCGX12dSpxAHYJPMipzbhmrmVFZHpzn37ESGNbJD0//2Q==',
  },
  {
    id: 'foursome-clubhouse',
    src: '/scotland/foursome-clubhouse.jpg',
    width: 1080,
    height: 499,
    alt:
      'Four golfers standing with putters on the grass in front of the stone clubhouse at Kingsbarns, the starter’s shelter beside it and the sea beyond.',
    caption: 'A fourball outside the clubhouse at Kingsbarns.',
    label: 'Kingsbarns',
    placeConfirmed: true,
    blurDataURL:
      'data:image/jpeg;base64,/9j/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAAHABADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAL/xAAcEAACAgMBAQAAAAAAAAAAAAABAwACBCExEVH/xAAVAQEBAAAAAAAAAAAAAAAAAAABBP/EABkRAQACAwAAAAAAAAAAAAAAAAEAAgMRMf/aAAwDAQACEQMRAD8Al+TlhZrV9gwHg4d7l47GrB9fbvzRERJHJfXYgT//2Q==',
  },
  {
    id: 'green-and-flag',
    src: '/scotland/green-and-flag.jpg',
    width: 1800,
    height: 2400,
    alt:
      'A green at Carnoustie with the flag in and a revetted bunker short of the putting surface, under a bright blue sky.',
    caption: 'Carnoustie, on one of the good days.',
    label: 'Carnoustie',
    placeConfirmed: true,
    blurDataURL:
      'data:image/jpeg;base64,/9j/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAAVABADASIAAhEBAxEB/8QAGAAAAwEBAAAAAAAAAAAAAAAAAAIEAQX/xAAeEAACAQQDAQAAAAAAAAAAAAABAgADBBESFCFxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAQF/8QAGBEBAQADAAAAAAAAAAAAAAAAAAMSFFH/2gAMAwEAAhEDEQA/AINmU5C9x6JqvU7cIPuJVy7bfPGcj2OL20z1asPHEVtQ6JhRyi5zN3IhCQzX/9k=',
  },
  {
    id: 'the-randa-library',
    src: '/scotland/the-randa-library.jpg',
    width: 1800,
    height: 2400,
    alt:
      'A wood-panelled room with glass-fronted bookcases, leather-topped writing desks and blue armchairs bearing club crests.',
    caption: 'The R&A.',
    label: 'The R&A',
    placeConfirmed: true,
    blurDataURL:
      'data:image/jpeg;base64,/9j/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAAVABADASIAAhEBAxEB/8QAGAAAAwEBAAAAAAAAAAAAAAAAAAMFAgT/xAAiEAACAQMEAgMAAAAAAAAAAAABAgMABBEFEiFRE2EiMkH/xAAVAQEBAAAAAAAAAAAAAAAAAAABA//EABkRAAMBAQEAAAAAAAAAAAAAAAABEQIDMf/aAAwDAQACEQMRAD8A0ZDCzG0lAJHyRhgEUy01h23BVUMoBOW79mpnmluMtBEZCE52DgDs1yrFKA0YRyzYBK8jj31UMVel9RijdT2NuojcNG4wUYflUdIuUuotghEWM/VqKKe2UlQ5adh//9k=',
  },
]

const BY_ID = new Map(SCOTLAND_PHOTOS.map((p) => [p.id, p]))

export function photo(id: string): ScotlandPhoto {
  const found = BY_ID.get(id)
  if (!found) throw new Error(`Unknown Scotland photo: ${id}`)
  return found
}
