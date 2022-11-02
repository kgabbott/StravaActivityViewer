# Strava activity viewer
------

Goal is to render a map containing all of a user's Strava activities with
and easy way to click on each one and go the its detail page.

### Running locally:
1. `npx prisma db push`
2. `npm run dev` and open the website and login with strava

**TODO:**

- [ ] Sign in with Strava
- [x] Add a script to sync a user's activities
    - [ ] Sync all activities, not just public ones
- [ ] Automatically run the task to sync the activities when a user logs in via
      a serverless function
      - Probably can't use vercel personal plan do to 10s timeout?
- [ ] Add a google maps element and add all the activity polylines
  - [ ] Add a custom click popup to the map that shows details on the activities
- [ ] Support filtering by date
- [ ] Include activity photos
- [ ] Look into MapBox/Open street map to show 3D map
- [ ] Move db to Planetscale or postgres?
- [ ] Deploy to vercel

----

### Next.js Template
This is based off the next project template [t3-app](https://github.com/t3-oss/create-t3-app). This template uses Next.js, prisma, tRPC, and Tailwind

For more details see the [template README](https://github.com/t3-oss/create-t3-app/blob/89b82e884b8348747f1de1634f5e83df374ca1c4/cli/template/base/README.md)