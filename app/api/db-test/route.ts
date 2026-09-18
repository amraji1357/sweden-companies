import { db } from "@/src/prisma/db";

export async function GET() {
  try {
    const users = await db.orm.public.User.all();

    return Response.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        error: "Database connection failed",
      },
      { status: 500 }
    );
  }
}
