import { Request, Response } from "express";
import { z } from "zod";

import {
  loginUser,
  registerUser,
  refreshAccessToken,
  logoutUser,
} from "./auth.service";

export async function refresh(
  req: Request,
  res: Response
) {
  try {
    const { refreshToken } = req.body;

    if (
      typeof refreshToken !== "string" ||
      refreshToken.length === 0
    ) {
      return res.status(400).json({
        message: "Refresh token is required",
      });
    }

    const result = await refreshAccessToken(refreshToken);

    return res.status(200).json(result);
  } catch (error: any) {
    if (error instanceof Error) {
      return res.status(401).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function register(
  req: Request,
  res: Response
) {
  try {
    const input = registerSchema.parse(req.body);

    const result = await registerUser(input);

    return res.status(201).json(result);
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.issues,
      });
    }

    if (error instanceof Error) {
      return res.status(409).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

export async function login(
  req: Request,
  res: Response
) {
  try {
    const input = loginSchema.parse(req.body);

    const result = await loginUser(input);

    return res.status(200).json(result);
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.issues,
      });
    }

    if (error instanceof Error) {
      return res.status(401).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

export async function logout(
  req: Request,
  res: Response
) {
  try {
    const { refreshToken } = req.body;

    if (
      typeof refreshToken !== "string" ||
      refreshToken.length === 0
    ) {
      return res.status(400).json({
        message: "Refresh token is required",
      });
    }

    const result = await logoutUser(refreshToken);

    return res.status(200).json(result);
  } catch (error: any) {
    if (error instanceof Error) {
      return res.status(401).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}