import { type NextPage } from "next";
import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Wrapper } from '@googlemaps/react-wrapper';
import * as turf from '@turf/turf'

import { trpc } from "../utils/trpc";
import { env } from "../env/client.mjs";
import type { Activity } from "@prisma/client";

function metersToFeet(n: number | null | unknown) {
  return ((n as number || 0) * 3.28084).toFixed(2)
}

function metersToMiles(n: number | null | unknown) {
  return ((n as number || 0) * 0.000621371).toFixed(2)
}

function minutesToHours(n: number | null | unknown) {
  return ((n as number || 0) / 3600).toFixed(2)
}

const DEFAULT_CENTER = { lat: 37.863, lng: -122.274 }

const Home: NextPage = () => {

  const { data: sessionData } = useSession();
  const [syncing, setSyncing] = useState(false)

  async function syncActivities() {
    if (syncing) return
    setSyncing(true)
    await fetch('/api/athletes/sync').finally(() => {
      setSyncing(false)
    })
  }

  return (
    <div>
      <div
        className="flex items-center justify-between bg-blue-900 text-white h-12 px-4 py-2"
      >
        <h1>Activities</h1>
        {!sessionData &&
          <button
            className="flex items-center hover:bg-gray-500 border border-gray-200 rounded-full h-full px-4"
            onClick={() => signIn()}
          >
            Sign In
          </button>
        }
        {sessionData &&
          <div className="flex">
            <button
              className="mx-3 flex items-center hover:bg-gray-500 border border-gray-200 rounded-full h-full px-4"
              onClick={() => signOut()}
            >
              Sign Out
            </button>
            <button
              className="flex items-center hover:bg-gray-500 border border-gray-200 rounded-full h-full px-4"
              onClick={syncActivities}
              disabled={syncing}
            >
              {syncing ?
                <div role="status" className="h-full">
                  <svg aria-hidden="true" className="h-6 w-6 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                  </svg>
                </div> :
                "Sync"
              }
            </button>
          </div>
        }
      </div>
      {!sessionData ?
        <h2>Please sign in to load and see activities</h2> :
        <ViewerComponent syncing={syncing} />

      }
    </div>
  );
};

export default Home;

function ViewerComponent({ syncing }: { syncing: boolean }) {
  const stats = trpc.activity.stats.useQuery(undefined, {
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    enabled: false
  })
  const activities = trpc.activity.activities.useQuery(undefined, {
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    enabled: false
  })
  const [needToFetch, setNeedToFetch] = useState(true)

  useEffect(() => {
    if (!syncing && needToFetch) {
      if (stats.isFetching || activities.isFetching) return
      setNeedToFetch(false)
      stats.refetch()
      activities.refetch()
    } else if (syncing) {
      setNeedToFetch(true)
    }
  }, [syncing, needToFetch, activities, stats])

  return (
    <div className="h-[calc(100vh-3rem)] w-full relative">
      <div className="absolute text-xs z-10 bg-gray-500 text-white w-auto inline-block p-2">
        <p>
          Number of activities: {stats.data?._count.id}
        </p>
        <p>
          Total Elevation: {metersToFeet(stats.data?._sum.totalElevationGain)}ft
        </p>
        <p>
          Total Distance: {metersToMiles(stats.data?._sum.distance)}miles
        </p>
        <p>
          Total Moving Time: {minutesToHours(stats.data?._sum.movingTime)}hours
        </p>
        <p>
          Longest Activity (elapsed time): {minutesToHours(stats.data?._max.elapsedTime)}hours
        </p>
        <p>
          Longest Activity (distance): {metersToMiles(stats.data?._max.distance)}miles
        </p>
        <p>
          Most elevation gain in an activity: {metersToFeet(stats.data?._max.totalElevationGain)}ft
        </p>
      </div>
      <Wrapper
        apiKey={env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
        libraries={['geometry']}
      >
        <MapComponent activities={activities.data || []} />
      </Wrapper>
    </div>
  )
}

function MapComponent({ activities }: { activities: Activity[] }) {
  const map = useRef(null);
  const infoWindow = useMemo(() => new google.maps.InfoWindow(), [])
  const [mapObject, setMapObject] = useState(null as google.maps.Map | null)
  const [activityData, setActivityData] = useState([] as { latLngs: [number, number][], activity: Activity }[])
  const [seenActivities, setSeenActivities] = useState(new Set<bigint>())

  const [center, setCenter] = useState(DEFAULT_CENTER)

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      function (position) {
        setCenter({ lat: position.coords.latitude, lng: position.coords.longitude })
      },
    )
  }, [])

  useEffect(() => {
    mapObject?.setCenter(center)
  }, [center, mapObject])


  useEffect(() => {
    if (!map.current) return
    if (mapObject == null) {
      setActivityData([])
      setSeenActivities(new Set())
      setMapObject(new google.maps.Map(map.current, {
        center: DEFAULT_CENTER,
        zoom: 11,
      }))
      return
    }
    activities.map(activity => {
      if (seenActivities.has(activity.id)) return
      seenActivities.add(activity.id)
      if (!activity.summaryPolyline) return
      const path = google.maps.geometry.encoding.decodePath(activity.summaryPolyline)
      activityData.push(
        { latLngs: path.map(l => [l.lat(), l.lng()]), activity }
      )
      const line = new google.maps.Polyline({
        path: path,
        strokeColor: "#FF0000",
        strokeOpacity: 1.0,
        strokeWeight: 2
      });
      line.setMap(mapObject);
      google.maps.event.addListener(line, 'click', function (e: any) {
        const point = turf.point([e.latLng.lat(), e.latLng.lng()])
        const activities = activityData.filter((val) => {
          return turf.pointToLineDistance(
            point,
            turf.lineString(val.latLngs),
            { units: 'miles' }
          ) < .1
        }).sort((a, b) => {
          // Need to return -1/0/1 since b-a is a bigint and sort doesn't
          // support that,
          if (a.activity.id > b.activity.id) {
            return -1;
          } else if (a.activity.id < b.activity.id) {
            return 1;
          } else {
            return 0;
          }
        }).map(v => {
          const a = v.activity
          return `
          <p>
            ${new Date(a.startDate).toLocaleDateString()} - ${a.name}: ${metersToMiles(a.distance)}miles - ${metersToFeet(a.totalElevationGain)}ft
            <br>
            <a target="_blank" href="https://www.strava.com/activities/${a.id}" style="color: blue; text-decoration: underline;">See on Strava</a>
          </p>
          `
        })
        infoWindow.setContent(`
          <div style="max-height: 400px; overflow: auto;">
            <h2 style="font-weight: bold;">${activities.length} Activities</h2>
            <br>
            ${activities.join('<br>')}
          </div>
        `)
        infoWindow.setPosition(e.latLng)
        infoWindow.open({
          map: mapObject,
        })
      })
    })
  }, [map, infoWindow, activities, mapObject, activityData, seenActivities]);

  return <div ref={map} id="map" className="w-full h-full" />;
}
