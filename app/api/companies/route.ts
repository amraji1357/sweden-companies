import { db } from "@/src/prisma/db";
import { getAdminUser } from "@/src/lib/admin";
export async function GET() {
  try {
    const companies = await db.orm.public.Company.all();

    return Response.json({
      success: true,
      companies,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        error: "Failed to fetch companies",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {const admin = await getAdminUser();

if (!admin) {
  return Response.json(
    {
      success: false,
      error: "Admin access required",
    },
    { status: 403 }
  );
}
    const body = await request.json();

    const { name, slug, description, website, logoUrl, city } = body;

    if (!name || !slug) {
      return Response.json(
        {
          success: false,
          error: "name and slug are required",
        },
        { status: 400 }
      );
    }

    const company = await db.orm.public.Company.create({
      name,
      slug,
      description,
      website,
      logoUrl,
      city,
      country: "Sweden",
    });

    return Response.json(
      {
        success: true,
        company,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        error: "Failed to create company",
      },
      { status: 500 }
    );
  }
}
