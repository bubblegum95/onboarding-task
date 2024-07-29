import express from "express";
import UserController from "../controllers/user.controller.js";
import { prisma } from "../../prisma/prisma.js";
import authenticateToken from "../middlewares/authenticate.token.middleware.js";

const router = express.Router();
const userController = new UserController(prisma);

/**
 * @swagger
 * /users/signup:
 *   post:
 *     summary: Create a new user
 *     description: Creates a new user with the provided data.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: username
 *               nickname:
 *                 type: string
 *                 example: user1
 *               password:
 *                 type: string
 *                 example: examplepassword
 *     responses:
 *       201:
 *         description: User created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                   example: username
 *                 nickname:
 *                   type: string
 *                   example: user1
 *                 authorities: ["authorityName": "ROLE_USER"]
 *
 *       400:
 *         description: Invalid input data.
 *       500:
 *         description: Internal server error.
 */
router.post("/signup", userController.signUp);

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Login and return token
 *     description: Login and return token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: username
 *               password:
 *                 type: string
 *                 example: examplepassword
 *     responses:
 *       201:
 *         description: User created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: username
 *
 *       400:
 *         description: Invalid input data.
 *       500:
 *         description: Internal server error.
 */
router.post("/login", userController.login);
router.post("/token", userController.refreshToken);

// 미들웨어 사용 예시
router.get("/test", authenticateToken, (res, req) => {
  res.json({ message: "검증 완료.", user: req.user });
});

export default router;
