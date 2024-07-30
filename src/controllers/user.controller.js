import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config";

class CustomError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export default class UserController {
  constructor(prisma) {
    this.prisma = prisma;
  }

  signUp = async (req, res, next) => {
    try {
      const { username, nickname, password } = req.body;

      if (!username || !nickname || !password) {
        throw new CustomError(400, "요청 정보가 올바르지 않습니다.");
      }
      // console.log(username, nickname);

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await this.prisma.user.create({
        data: {
          username,
          nickname,
          password: hashedPassword,
          roles: {
            connectOrCreate: [
              {
                where: { authorityName: "ROLE_USER" },
                create: { authorityName: "ROLE_USER" },
              },
            ],
          },
        },
        include: {
          roles: true,
        },
      });

      if (!user) {
        throw new CustomError(500, "사용자 정보를 생성할 수 없습니다.");
      }

      res.status(201).json({
        success: true,
        message: "회원가입을 완료하였습니다.",
        data: {
          username: user.username,
          nickname: user.nickname,
          authorities: user.roles.map((role) => role.authorityName),
        },
      });
    } catch (err) {
      next(err);
    }
  };

  login = async (req, res, next) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        throw new CustomError(400, "요청 정보가 올바르지 않습니다.");
      }

      const user = await this.prisma.user.findUnique({
        where: { username },
        include: { roles: true },
      });

      if (!user) {
        throw new CustomError(
          400,
          "일치하는 사용자 정보가 없습니다. 이름을 확인해주세요.",
        );
      }

      const comparedPassword = await bcrypt.compare(password, user.password);

      if (!comparedPassword) {
        throw new CustomError(400, "비밀번호가 일치하지 않습니다.");
      }

      const payload = { username: user.username };
      const accessToken = this.generateAccessToken(payload); // 토큰 발급
      const refreshToken = this.generateRefreshToken(payload);

      // Refresh token 저장
      await this.prisma.user.update({
        where: { username: user.username },
        data: { refreshToken: refreshToken },
      });

      res.status(200).json({
        success: true,
        message: "로그인하였습니다.",
        data: {
          accessToken: accessToken,
          refreshToken: refreshToken,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  generateAccessToken(payload) {
    const secretKey = process.env.ACCESS_TOKEN_SECRET;
    const options = { expiresIn: "10m" };
    return jwt.sign(payload, secretKey, options);
  }

  async generateRefreshToken(payload) {
    const secretKey = process.env.REFRESH_TOKEN_SECRET;
    const options = { expiresIn: "7d" };
    return jwt.sign(payload, secretKey, options);
  }

  // 새로운 access token 발급
  refreshToken = async (req, res, next) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new CustomError(400, "리프레시 토큰이 없습니다.");
      }

      const payload = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
      );

      const user = await this.prisma.user.findUnique({
        where: { username: payload.username },
      });

      const newAccessToken = this.generateAccessToken({
        username: user.username,
      });

      res.status(200).json({
        success: true,
        message: "새로운 액세스 토큰이 발급되었습니다.",
        data: {
          accessToken: newAccessToken,
        },
      });
    } catch (err) {
      next(err);
    }
  };
}
