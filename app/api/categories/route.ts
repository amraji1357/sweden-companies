import { db } from "@/src/prisma/db";

export async function GET() {
  try {
    const categories = await db.orm.public.Category
      .orderBy((category) => category.name.asc())
      .all();

    return Response.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        error: "Failed to fetch categories",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, slug } = body;

    if (
      typeof name !== "string" ||
      typeof slug !== "string" ||
      !name.trim() ||
      !slug.trim()
    ) {
      return Response.json(
        {
          success: false,
          error: "name and slug are required",
        },
        { status: 400 }
      );
    }

    const category = await db.orm.public.Category.create({
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
    });

    return Response.json(
      {
        success: true,
        category,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        error: "Failed to create category",
      },
      { status: 500 }
    );
  }
}
