import { NextFunction, Request, Response } from "express";
import ApiError from "../../errors/ApiError";
import prisma from "../../shared/prisma";

export const logActivity = (storeBody: boolean = true) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    res.on("finish", async () => {
      if (!req.user) return;
      try {
        const userId =
          req.user.role === "admin" ||
          req.user.role === "user" ||
          req.user.role === "super_admin"
            ? req.user.id
            : null;
        const partnerId = req.user.role === "partner" ? req.user.id : null;
        const entityType = req.baseUrl.split("/")[3]?.toUpperCase();
        const entityId = req.params.id ? parseInt(req.params.id) : null;
        const action = req.method.toUpperCase() + " " + req.originalUrl;
        const statusCode = res.statusCode;

        await prisma.userActivity.create({
          data: {
            userId,
            partnerId,
            action,
            entityId,
            entityType,
            statusCode,
            metadata: {
              params: req.params,
              body: storeBody ? req.body : "Body not stored", // Control body storage
            },
            timestamp: new Date(),
          },
        });
      } catch (error) {
        throw new ApiError(400, (error as Error).message);
      }
    });

    next();
  };
};
