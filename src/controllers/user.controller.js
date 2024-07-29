import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config";

export default class UserController {
  constructor(prisma) {
    this.prisma = prisma;
  }

  signUp = async (req, res, next) => {
    try {
      const { username, nickname, password } = req.body;

      if (!username || !nickname || !password) {
        throw new Error("요청 정보가 올바르지 않습니다.");
      }
      console.log(username, nickname);
      // 비밀번호 해싱
      const hashedPassword = await bcrypt.hash(password, 10);

      // 사용자 생성
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

      console.log("create user: ", user);

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
        throw new Error("로그인 요청 정보가 잘못되었습니다.");
      }

      const user = await this.prisma.user.findUnique({
        where: { username },
        include: { roles: true },
      });

      if (!user) {
        throw new Error(
          "일치하는 사용자 정보가 없습니다. 이름을 확인해주세요.",
        );
      }

      const comparedPassword = await bcrypt.compare(password, user.password);

      if (!comparedPassword) {
        throw new Error("비밀번호가 일치하지 않습니다.");
      }

      const payload = { username: user.username };
      const secretKey = process.env.SECRET_KEY;
      const options = { expiresIn: "10h" };
      console.log("console.log: ", payload, secretKey, options);
      const token = jwt.sign(payload, secretKey, options);

      res.status(200).json({
        success: true,
        message: "로그인하였습니다.",
        data: {
          token: token,
        },
      });
    } catch (err) {
      next(err);
    }
  };
}
