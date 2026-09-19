import { db } from "@/src/prisma/db";
import { createSessionToken, setSessionCookie } from "@/src/lib/auth";
import { promisify } from "node:util";
import { scrypt, timingSafeEqual } from "node:crypto";

const scryptAsync = promisify(scrypt);

async function verifyPassword(
  password: string,
  storedPassword: string
) {
  const [salt, storedKey] = storedPassword.split(":");

  if (!salt || !storedKey) {
    return false;
  }

  const derivedKey = (await scryptAsync(
    password,
    salt,
    64
  )) as Buffer;

  const storedKeyBuffer = Buffer.from(storedKey, "hex");

  if (derivedKey.length !== storedKeyBuffer.length) {
    return false;
  }

  return timingSafeEqual(derivedKey, storedKeyBuffer);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { email, password } = body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return Response.json(
        {
          success: false,
          error: "email and password are required",
        },
        { status: 400 }
      );
    }

    const user = await db.orm.public.User
      .where({ email: email.trim().toLowerCase() })
      .first();

    if (!user) {
      return Response.json(
        {
          success: false,
          error: "Invalid email or password",
        },
        { status: 401 }
      );
    }

    const passwordValid = await verifyPassword(
      password,
      user.password
    );

    if (!passwordValid) {
      return Response.json(
        {
          success: false,
          error: "Invalid email or password",
        },
        { status: 401 }
      );
    }

    const token = await createSessionToken(user.id);

    await setSessionCookie(token);

    return Response.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
      },
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        error: "Login failed",
      },
      { status: 500 }
    );
  }
}
