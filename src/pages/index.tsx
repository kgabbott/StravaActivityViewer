import { type NextPage } from "next";
import { signIn, signOut, useSession } from "next-auth/react";

import { trpc } from "../utils/trpc";

const Home: NextPage = () => {

  const { data: sessionData } = useSession();
  const count = trpc.activity.count.useQuery()

  return (
    <div>
      <div
        className="flex items-center justify-between bg-blue-900 text-white h-12 px-4 py-2"
      >
        <h1>Activities</h1>
        <button
          className="flex items-center hover:bg-gray-500 border border-gray-200 rounded-full h-full px-4"
          onClick={sessionData ? () => signOut() : () => signIn()}
        >
          {sessionData ? "Sign Out" : "Sign In"}
        </button>
      </div>
      {sessionData ?
        <p>You have {count.data} activities synced!</p> :
        <h2>Please sign in to load and see activities</h2>}
    </div>
  );
};

export default Home;
