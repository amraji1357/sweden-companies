import { getSessionUserId } from "@/src/lib/auth";
import { db } from "@/src/prisma/db";

export async function getAdminUser() {
  const userId = await getSessionUserId();

  if (!userId) {
    return null;
  }

  const user = await db.orm.public.User
    .where({ id: userId })
    .first();

  if (!user) {
    return null;
  }

  if (
    !process.env.ADMIN_EMAIL ||
    user.email !== process.env.ADMIN_EMAIL
  ) {
    return null;
  }

  return user;
}
