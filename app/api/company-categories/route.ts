import { db } from "@/src/prisma/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      companySlug,
      categorySlug,
    } = body;

    if (
      typeof companySlug !== "string" ||
      typeof categorySlug !== "string" ||
      !companySlug.trim() ||
      !categorySlug.trim()
    ) {
      return Response.json(
        {
          success: false,
          error: "companySlug and categorySlug are required",
        },
        { status: 400 }
      );
    }

    const company = await db.orm.public.Company
      .where({ slug: companySlug.trim().toLowerCase() })
      .first();

    const category = await db.orm.public.Category
      .where({ slug: categorySlug.trim().toLowerCase() })
      .first();

    if (!company) {
      return Response.json(
        {
          success: false,
          error: "Company not found",
        },
        { status: 404 }
      );
    }

    if (!category) {
      return Response.json(
        {
          success: false,
          error: "Category not found",
        },
        { status: 404 }
      );
    }

    const connection = await db.orm.public.CompanyCategory.create({
      companyId: company.id,
      categoryId: category.id,
    });

    return Response.json(
      {
        success: true,
        connection,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        error: "Failed to connect company and category",
      },
      { status: 500 }
    );
  }
}
