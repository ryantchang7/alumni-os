import { createTeam, ensureStore } from '../src/lib/store/local-store'

void (async () => {
  await ensureStore()
  const team = await createTeam({
    schoolName: 'University of Pennsylvania',
    teamName: "Men's Golf",
    sport: 'Golf',
    gender: 'Men',
    websiteUrl: 'https://pennathletics.com/sports/mens-golf/roster',
    slug: 'penn-mens-golf',
  })
  console.log('Team seeded:', team.slug, team.id)
})()
