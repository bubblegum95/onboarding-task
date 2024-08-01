import CreateUserDto from "./dto/create.user.dto.js";
import CustomError from "./middlewares/custom-error-handler.js";
import LoginDto from "./dto/lognin.dto.js";

export default class UserController {
  constructor(userService) {
    this.userService = userService;
  }

  signUp = async (req, res, next) => {
    try {
      await CreateUserDto.validateAsync(req.body, { abortEarly: false });
      const user = await this.userService.signUp(req.body);

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
      if (err.isJoi) {
        const errorMessages = err.details.map((detail) => detail.message);
        const customError = new CustomError(400, errorMessages);
        next(customError);
      } else {
        const customError = new CustomError(500, "Internal Server Error");
        next(customError);
      }
    }
  };

  login = async (req, res, next) => {
    try {
      await LoginDto.validateAsync(req.body, { abortEarly: false });
      const user = await this.userService.login(req.body);

      res.status(200).json({
        success: true,
        message: "로그인하였습니다.",
        data: {
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
        },
      });
    } catch (err) {
      if (err.isJoi) {
        const errorMessages = err.details.map((detail) => detail.message);
        const customeError = new CustomError(400, errorMessages);
        next(customeError);
      } else {
        const customeError = new CustomError(500, "Internal Server Error");
        next(customeError);
      }
    }
  };

  // 새로운 access token 발급
  refreshToken = async (req, res, next) => {
    try {
      const token = await this.userService.refreshToken(req.body);

      res.status(200).json({
        success: true,
        message: "새로운 액세스 토큰이 발급되었습니다.",
        data: {
          accessToken: token.newAccessToken,
        },
      });
    } catch (err) {
      next(err);
    }
  };
}
