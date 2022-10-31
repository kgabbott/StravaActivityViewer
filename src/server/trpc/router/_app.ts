import { router } from "../trpc";
import { activityRouter } from "./activity";

export const appRouter = router({
  activity: activityRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
