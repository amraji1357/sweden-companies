import { db } from "@/src/prisma/db";
import { getSessionUserId } from "@/src/lib/auth";

export async function GET() {
  const userId = await getSessionUserId();

  if (!userId) {
    return Response.json(
      {
        success: false,
        user: null,
      },
      { status: 401 }
    );
  }

  const user = await db.orm.public.User
    .where({ id: userId })
    .first();

  if (!user) {
    return Response.json(
      {
        success: false,
        user: null,
      },
      { status: 401 }
    );
  }

  return Response.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
    },
  });
}
