import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import { prisma } from "../../config/database";

const JWT_SECRET = process.env.JWT_SECRET ?? (() => {
  throw new Error("JWT_SECRET is not defined");
})();

const ACCESS_TOKEN_EXPIRES_IN = "15m";
const REFRESH_TOKEN_EXPIRES_IN_DAYS = 7;

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

function createAccessToken(userId: string, email: string) {
  return jwt.sign(
    {
      userId,
      email,
    },
    JWT_SECRET,
    {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    }
  );
}

function createRefreshToken() {
  return crypto.randomBytes(64).toString("hex");
}

export async function registerUser(input: RegisterInput) {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: input.email,
    },
  });

  if (existingUser) {
    throw new Error("Email is already registered");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const result = await prisma.$transaction(async (tx) => {
    // 1. Create user
    const user = await tx.user.create({
      data: {
        email: input.email,
        passwordHash,
        name: input.name,
      },
    });

    // 2. Create organization
    const organization = await tx.organization.create({
      data: {
        name: `${input.name}'s Organization`,
      },
    });

    // 3. Add user as organization admin
    await tx.orgMember.create({
      data: {
        userId: user.id,
        orgId: organization.id,
        role: "org_admin",
      },
    });

    return {
      user,
      organization,
    };
  });

  return {
    user: {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
    },
    organization: {
      id: result.organization.id,
      name: result.organization.name,
    },
    role: "org_admin",
  };
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: {
      email: input.email,
    },
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const passwordValid = await bcrypt.compare(
    input.password,
    user.passwordHash
  );

  if (!passwordValid) {
    throw new Error("Invalid email or password");
  }

  const accessToken = createAccessToken(user.id, user.email);

  const refreshToken = createRefreshToken();

  const refreshTokenExpiresAt = new Date(
    Date.now() +
      REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000
  );

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: refreshTokenExpiresAt,
    },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  };
}

export async function refreshAccessToken(refreshToken: string) {
  const storedToken = await prisma.refreshToken.findUnique({
    where: {
      token: refreshToken,
    },
    include: {
      user: true,
    },
  });

  if (!storedToken) {
    throw new Error("Invalid refresh token");
  }

  if (storedToken.revokedAt) {
    throw new Error("Refresh token has been revoked");
  }

  if (storedToken.expiresAt <= new Date()) {
    throw new Error("Refresh token has expired");
  }

  // Rotate refresh token
  const newRefreshToken = createRefreshToken();

  const newRefreshTokenExpiresAt = new Date(
    Date.now() +
      REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000
  );

  const newAccessToken = createAccessToken(
    storedToken.user.id,
    storedToken.user.email
  );

  await prisma.$transaction([
    // Revoke old refresh token
    prisma.refreshToken.update({
      where: {
        id: storedToken.id,
      },
      data: {
        revokedAt: new Date(),
      },
    }),

    // Create new refresh token
    prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: storedToken.user.id,
        expiresAt: newRefreshTokenExpiresAt,
      },
    }),
  ]);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

export async function logoutUser(refreshToken: string) {
  const storedToken = await prisma.refreshToken.findUnique({
    where: {
      token: refreshToken,
    },
  });

  if (!storedToken) {
    throw new Error("Invalid refresh token");
  }

  if (storedToken.revokedAt) {
    return {
      message: "Already logged out",
    };
  }

  await prisma.refreshToken.update({
    where: {
      id: storedToken.id,
    },
    data: {
      revokedAt: new Date(),
    },
  });

  return {
    message: "Logged out successfully",
  };
}