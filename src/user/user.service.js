import CustomError from "./middlewares/custom-error-handler";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config";

export default class UserService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  signUp = async (dto) => {
    try {
      const { username, nickname, password } = dto;

      // console.log(username, nickname);

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await this.userRepository.createUser(
        username,
        nickname,
        hashedPassword,
      );

      return user;
    } catch (err) {
      throw err;
    }
  };

  login = async (dto) => {
    try {
      const user = this.userRepository.findUser(dto);
      if (!foundUser) {
        throw new CustomError(400, "사용자가 존재하지 않습니다.");
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

      await this.userRepository(user.username, refreshToken);

      return {
        accessToken,
        refreshToken,
      };
    } catch (error) {
      throw error;
    }
  };

  refreshToken = async (reqBody) => {
    try {
      const { refreshToken } = reqBody;

      if (!refreshToken) {
        throw new CustomError(400, "리프레시 토큰이 없습니다.");
      }

      const payload = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
      );

      const user = await this.userRepository.findUniqueUser(payload);

      const newAccessToken = this.generateAccessToken({
        username: user.username,
      });

      return newAccessToken;
    } catch (error) {
      throw error;
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
}
