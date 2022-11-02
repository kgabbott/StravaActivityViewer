import type { NextApiRequest, NextApiResponse } from "next";
import { getServerAuthSession } from "../../../server/common/get-server-auth-session";

import { syncAthlete } from "../../../utils/strava";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getServerAuthSession({ req, res })
  if (!session) {
    return res.status(401)
  }
  const account = await prisma?.account.findFirst(
    { where: { provider: 'strava', userId: session.user?.id } }
  )
  if (!account) {
    return res.status(403)
  }
  return res.status(200).json({ synced: await syncAthlete(account) })
}

export default handler