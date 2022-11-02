import { router, protectedProcedure } from "../trpc";

export const activityRouter = router({
  stats: protectedProcedure.query(async ({ ctx }) => {
    return await prisma?.activity.aggregate({
      where: { account: { userId: ctx.session.user.id } },
      _max: {
        distance: true,
        elapsedTime: true,
        totalElevationGain: true,
      },
      _sum: {
        distance: true,
        totalElevationGain: true,
        movingTime: true
      },
      _count: {
        id: true
      }
    })
  }),
  activities: protectedProcedure.query(async ({ ctx }) => {
    return await prisma?.activity.findMany({
      where: { account: { userId: ctx.session.user.id } },
      orderBy: [
        {
          id: 'desc',
        },
      ],
    })
  }),
});
