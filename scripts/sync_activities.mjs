import { PrismaClient } from '@prisma/client'
import strava from 'strava-v3';

const prisma = new PrismaClient()

strava.config({
  client_id: process.env.STRAVA_CLIENT_ID,
  client_secret: process.env.STRAVA_CLIENT_SECRET,

})

async function syncAthlete(account) {
  console.log('Syncing activities for athlete: ', account.providerAccountId)
  const firstSync = !(await prisma.activity.findFirst({ where: { accountId: account.id } }))
  let seen = false
  let page = 1
  let activitiesSynced = 0
  while (!seen) {
    const activities = await strava.athlete.listActivities(
      { 'access_token': account.access_token, page },
      function (err, payload, limits) {
        //do something with your payload, track rate limits
      }
    )
    if (!activities.length) {
      break
    }
    let activity;
    for (var i = 0; i < activities.length; i++) {
      activity = activities[i]
      if (!firstSync) {
        const exists = await prisma.activity.findFirst({ where: { id: activity.id } })
        if (exists) {
          seen = true
          break
        }
      }
      await prisma.activity.create({
        data: {
          id: activity.id,
          accountId: account.id,
          name: activity.name,
          startDate: activity.start_date,
          distance: activity.distance,
          movingTime: activity.moving_time,
          elapsedTime: activity.elapsed_time,
          averageSpeed: activity.average_speed,
          totalElevationGain: activity.total_elevation_gain,
          sportType: activity.sport_type,
          summaryPolyline: activity.map.summary_polyline,
        }
      })
      activitiesSynced += 1
    }
    page += 1
  }
  console.log(activitiesSynced, 'activities created')
}

// A `main` function so that we can use async/await
async function main() {
  (await prisma.account.findMany({ where: { provider: 'strava' } })).map(async (a) => {
    syncAthlete(a)
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })