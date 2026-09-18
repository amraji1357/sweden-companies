import { db } from "@/src/prisma/db";
import { getSessionUserId } from "@/src/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = Number(searchParams.get("companyId"));

    if (!Number.isInteger(companyId) || companyId <= 0) {
      return Response.json(
        {
          success: false,
          error: "A valid companyId is required",
        },
        { status: 400 }
      );
    }

    const reviews = await db.orm.public.Review
      .where({ companyId })
      .include("user", (user) =>
        user.select("id", "username", "name")
      )
      .all();

    return Response.json({
      success: true,
      reviews,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        error: "Failed to fetch reviews",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return Response.json(
        {
          success: false,
          error: "You must be logged in to write a review",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const { companyId, title, content } = body;

    if (
      !Number.isInteger(companyId) ||
      typeof content !== "string" ||
      !content.trim()
    ) {
      return Response.json(
        {
          success: false,
          error: "companyId and content are required",
        },
        { status: 400 }
      );
    }

    if (content.trim().length < 5) {
      return Response.json(
        {
          success: false,
          error: "Review must be at least 5 characters",
        },
        { status: 400 }
      );
    }

    const review = await db.orm.public.Review.create({
      userId,
      companyId,
      title:
        typeof title === "string" && title.trim()
          ? title.trim()
          : null,
      content: content.trim(),
    });

    return Response.json(
      {
        success: true,
        review,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        error: "Failed to create review",
      },
      { status: 500 }
    );
  }
}
