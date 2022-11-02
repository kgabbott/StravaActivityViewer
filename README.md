# Strava activity viewer
------

This is a simple app that lets a Strava user view all of their activities on a single map. Then when you click on a path, you can see all the activities that passed through that point.
<img width="1920" alt="Screen Shot 2022-11-02 at 2 32 59 PM" src="https://user-images.githubusercontent.com/1312391/199612226-d79a4571-3354-495c-aa3f-6074842de4e2.png">



### Running locally:
1. `npx prisma db push`
2. `npm run dev` and open the website and login with strava
3. Load the app in your browser.
4. Click `sign in` and auth with Strava
5. Click `sync` and wait for your activities to load.

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
