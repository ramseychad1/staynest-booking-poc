import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { ok, fail, ApiError } from "../lib/response.js";
import { serializeUser, serializeBooking } from "../lib/serialize.js";
import { COOKIE_NAME, cookieOptions } from "../lib/jwt.js";
import { saveFile, deleteFile } from "../lib/storage.js";

export async function me(req, res) {
  if (!req.user) return fail(res, "Not authenticated", 401);
  return ok(res, serializeUser(req.user));
}

export async function logout(_req, res) {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions(), maxAge: undefined });
  return ok(res, null, "Logged out");
}

export async function updateProfile(req, res, next) {
  try {
    if (!req.user) throw new ApiError("Not authenticated", 401);

    const schema = z.object({
      name: z.string().trim().min(1).optional(),
      phone: z.string().trim().optional(),
    });
    const body = schema.parse(req.body);

    const data = {};
    if (body.name) data.name = body.name;
    if (body.phone !== undefined) data.phone = body.phone;

    if (req.file) {
      if (req.user.picture) await deleteFile(req.user.picture);
      const { url } = await saveFile(req.file);
      data.picture = url;
    }

    const user = await prisma.user.update({ where: { id: req.user.id }, data });
    return ok(res, serializeUser(user), "Profile updated");
  } catch (err) {
    next(err);
  }
}

export async function updatePassword(req, res, next) {
  try {
    if (!req.user) throw new ApiError("Not authenticated", 401);

    const schema = z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(6),
    });
    const { currentPassword, newPassword } = schema.parse(req.body);

    const valid = await bcrypt.compare(currentPassword, req.user.passwordHash);
    if (!valid) throw new ApiError("Current password is incorrect.", 400);

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash } });

    return ok(res, null, "Password updated");
  } catch (err) {
    next(err);
  }
}

export async function listAllUsers(_req, res, next) {
  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
    return ok(res, users.map(serializeUser));
  } catch (err) {
    next(err);
  }
}

export async function userBookings(req, res, next) {
  try {
    const { userId } = req.params;

    if (!req.user) throw new ApiError("Not authenticated", 401);
    if (req.user.role !== "Admin" && req.user.id !== userId) {
      throw new ApiError("Forbidden", 403);
    }

    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: { property: true, user: true },
      orderBy: { createdAt: "desc" },
    });

    return ok(res, {
      bookings: bookings.map(serializeBooking),
      pagination: { total: bookings.length, page: 1, pageSize: bookings.length },
    });
  } catch (err) {
    next(err);
  }
}
