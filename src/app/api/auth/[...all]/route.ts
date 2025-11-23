import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth";

/**
 * @swagger
 * /api/auth/{all}:
 *   get:
 *     summary: Auth endpoints (Better Auth)
 *     tags:
 *       - Auth
 *     parameters:
 *       - in: path
 *         name: all
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Auth response
 *   post:
 *     summary: Auth endpoints (Better Auth)
 *     tags:
 *       - Auth
 *     parameters:
 *       - in: path
 *         name: all
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Auth response
 */
export const { POST, GET } = toNextJsHandler(auth);
