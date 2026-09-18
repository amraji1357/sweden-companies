import { db } from "@/src/prisma/db";
import { getSessionUserId } from "@/src/lib/auth";

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return Response.json(
        {
          success: false,
          error: "You must be logged in to rate a company",
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { companyId, score } = body;

    if (
      !Number.isInteger(companyId) ||
      !Number.isInteger(score)
    ) {
      return Response.json(
        {
          success: false,
          error: "companyId and score must be integers",
        },
        { status: 400 }
      );
    }

    if (score < 1 || score > 5) {
      return Response.json(
        {
          success: false,
          error: "score must be between 1 and 5",
        },
        { status: 400 }
      );
    }

    const existingRating = await db.orm.public.Rating
      .where({
        userId,
        companyId,
      })
      .first();

    let rating;

    if (existingRating) {
      rating = await db.orm.public.Rating
        .where({ id: existingRating.id })
        .update({ score });
    } else {
      rating = await db.orm.public.Rating.create({
        score,
        user: (user) => user.connect({ id: userId }),
        company: (company) => company.connect({ id: companyId }),
      });
    }

    return Response.json({
      success: true,
      rating,
      updated: Boolean(existingRating),
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        error: "Failed to save rating",
      },
      { status: 500 }
    );
  }
}
