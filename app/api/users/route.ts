import { db } from "@/src/prisma/db";
import { promisify } from "node:util";
import { randomBytes, scrypt } from "node:crypto";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;

  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { email, username, name, password } = body;

    if (!email || !username || !password) {
      return Response.json(
        {
          success: false,
          error: "email, username and password are required",
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return Response.json(
        {
          success: false,
          error: "Password must be at least 8 characters",
        },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const user = await db.orm.public.User.create({
      email,
      username,
      name,
      password: hashedPassword,
    });

    return Response.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        error: "Failed to create user",
      },
      { status: 500 }
    );
  }
}
