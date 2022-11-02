import type { Account, Activity } from '@prisma/client'
import strava from 'strava-v3';
import { env } from '../env/server.mjs';

strava.config({
  client_id: env.STRAVA_CLIENT_ID || '',
  client_secret: env.STRAVA_CLIENT_SECRET || '',
  access_token: env.STRAVA_ACCESS_TOKEN || '',
  redirect_uri: env.NEXTAUTH_URL || ''

})

async function refreshToken(account: Account) {
  if (!account.refresh_token) {
    console.error('No refresh token found for athlete ', account.providerAccountId)
    return
  }
  await strava.oauth.refreshToken(account.refresh_token)
    .then(async (code) => {
      await prisma?.account.update({
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
      console.error('Error refreshing token for athlete ', account.providerAccountId)
      await prisma?.account.update({
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

export async function syncAthlete(account: Account) {
  console.log('Syncing activities for athlete ', account.providerAccountId)
  const latest = await prisma?.activity.findFirst({
    where: { accountId: account.id },
    orderBy: { id: 'desc' }
  })
  const latestId = latest ? latest.id : 0
  let page = 1
  let newActivities = [] as Activity[]
  let finished = false
  while (!finished) {
    if (!account.access_token) {
      break
    }
    await strava.athlete.listActivities(
      { 'access_token': account.access_token, page, per_page: 50 },
    ).then(activities => {
      if (!activities.length) {
        finished = true
        return
      }
      let activity
      for (let i = 0; i < activities.length; i++) {
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
          finished = true
          break
        }
      }
      page += 1
    }).catch(async (err) => {
      // TODO: Handle rate limits
      if (
        !!err &&
        err.statusCode === 401 &&
        err.error.errors[0].field === 'access_token' &&
        err.error.errors[0].code === 'invalid'
      ) {
        console.log('Invalid access token, attempting to refresh.')
        await refreshToken(account)
      } else {
        console.error('Unknown error encountered, exiting.')
        finished = true
        newActivities = []
      }
    })
  }
  // TODO: createMany isn't supported by SQLite. Move to this once we move to 
  // a hosted db.
  // await prisma.activity.createMany({
  //   data: newActivities,
  //   skipDuplicates: true
  // })
  newActivities.map(async (a) => {
    await prisma?.activity.create({ data: a })
  })
  return newActivities.length
}