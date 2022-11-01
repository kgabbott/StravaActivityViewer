import { PrismaClient } from '@prisma/client'
import strava from 'strava-v3';

const prisma = new PrismaClient()

strava.config({
  client_id: process.env.STRAVA_CLIENT_ID,
  client_secret: process.env.STRAVA_CLIENT_SECRET,

})

async function refreshToken(account) {
  await strava.oauth.refreshToken(account.refresh_token)
    .then(async (code) => {
      await prisma.account.update({
        where: {
          id: account.id,
        },
        data: {
          access_token: code.access_token,
          expires_at: code.expires_at
        },
      })
    })
    .catch(async (e) => {
      console.log('Error refreshing token for account ', account.id, e)
      await prisma.account.update({
        where: {
          id: account.id,
        },
        data: {
          access_token: null,
          expires_at: null
        },
      })
    })
}

async function syncAthlete(account) {
  console.log('Syncing activities for athlete: ', account.providerAccountId)
  const latest = await prisma.activity.findFirst({
    where: { accountId: account.id },
    orderBy: { id: 'desc' }
  })
  const latestId = latest ? latest.id : 0
  let page = 1
  let activitiesSynced = 0
  const newActivities = []
  let finished = false
  while (!finished) {
    if (!account.access_token) {
      break
    }
    await strava.athlete.listActivities(
      { 'access_token': account.access_token, page, per_page: 50 },
      // TODO: Handle rate limits
      async function (err, activities, limits) {
        if (
          !!err &&
          err.statusCode === 401 &&
          err.error.errors[0].field === 'access_token' &&
          err.error.errors[0].code === 'invalid'
        ) {
          console.log('Invalid access token, attempting to refresh.')
          await refreshToken(account)
          return
        }
        finished = true
        if (!activities.length) {
          finished = true
          return
        }
        let activity
        for (var i = 0; i < activities.length; i++) {
          activity = activities[i]
          if (activity.id > latestId) {
            newActivities.push({
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
            })
          } else {
            break
          }
        }
        page += 1
      }
    )
  }
  // TODO: createMany isn't supported by SQLite. Move to this once we move to 
  // a hosted db.
  // await prisma.activity.createMany({
  //   data: newActivities,
  //   skipDuplicates: true
  // })
  newActivities.map(async (a) => {
    await prisma.activity.create({ data: a })
  })
  activitiesSynced += newActivities.length
  console.log(activitiesSynced, 'total new activities created')
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