import { router, publicProcedure, protectedProcedure } from "../trpc";

export const activityRouter = router({
  count: protectedProcedure.query(async ({ ctx }) => {
    return await prisma?.activity.count({
      where: { account: { userId: ctx.session.user.id } }
    })
  }),
});
