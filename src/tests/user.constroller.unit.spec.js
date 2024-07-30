import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import UserController from "../controllers/user.controller";
import { beforeEach, jest, describe, it, expect } from "@jest/globals";

// Mock objects
const mockPrisma = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

const mockRequest = {
  body: {},
};

const mockResponse = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
};

const mockNext = jest.fn();

bcrypt.hash = jest.fn();
bcrypt.compare = jest.fn();
jwt.sign = jest.fn();

const userController = new UserController(mockPrisma);

describe("UserController", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("should return error if required fields are missing", async () => {
    // Arrange
    mockRequest.body = {
      username: "",
      nickname: "승호",
      password: "examplepassword",
    };

    // Act
    await userController.signUp(mockRequest, mockResponse, mockNext);

    // Assert
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 400,
        message: "요청 정보가 올바르지 않습니다.",
      }),
    );
  });

  it("should handle error if user creation fails", async () => {
    // Arrange
    const hashedPassword = "hashedpassword";
    mockRequest.body = {
      username: "박승호",
      nickname: "승호",
      password: "examplepassword",
    };

    bcrypt.hash.mockResolvedValue(hashedPassword);
    mockPrisma.user.create.mockRejectedValue(new Error("Database error"));

    // Act
    await userController.signUp(mockRequest, mockResponse, mockNext);

    // Assert
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    expect(mockNext.mock.calls[0][0].message).toBe("Database error");
  });

  it("should sign up successfully with valid user information", async () => {
    // Mock request body
    mockRequest.body = {
      username: "박승호",
      nickname: "승호",
      password: "examplepassword",
    };

    // Mock user data
    const userInfo = {
      username: "박승호",
      nickname: "승호",
      roles: [{ authorityName: "ROLE_USER" }],
    };

    const result = {
      success: true,
      message: "회원가입을 완료하였습니다.",
      data: {
        username: "박승호",
        nickname: "승호",
        authorities: ["ROLE_USER"],
      },
    };

    // Mock bcrypt hash function
    bcrypt.hash.mockResolvedValue("hashedpassword");

    // Mock prisma user create function
    mockPrisma.user.create.mockResolvedValue(userInfo);

    // Call the signUp method
    await userController.signUp(mockRequest, mockResponse, mockNext);

    // Assertions
    expect(bcrypt.hash).toHaveBeenCalledTimes(1);
    expect(bcrypt.hash).toHaveBeenCalledWith("examplepassword", 10);
    expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: {
        username: "박승호",
        nickname: "승호",
        password: "hashedpassword",
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
    expect(mockResponse.status).toHaveBeenCalledWith(201);
  });

  it("should return error if username or password is missing", async () => {
    // Arrange
    mockRequest.body = {
      username: "testuser",
      password: "",
    };

    // Act
    await userController.login(mockRequest, mockResponse, mockNext);

    // Assert
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 400,
        message: "요청 정보가 올바르지 않습니다.",
      }),
    );
  });

  it("should return error if user does not exist", async () => {
    // Arrange
    mockRequest.body = {
      username: "nonexistentuser",
      password: "password",
    };

    mockPrisma.user.findUnique.mockResolvedValue(null);

    // Act
    await userController.login(mockRequest, mockResponse, mockNext);

    // Assert
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 400,
        message: "일치하는 사용자 정보가 없습니다. 이름을 확인해주세요.",
      }),
    );
  });

  it("should return error if password is incorrect", async () => {
    // Arrange
    mockRequest.body = {
      username: "testuser",
      password: "wrongpassword",
    };

    const user = {
      username: "testuser",
      password: "hashedpassword",
    };

    mockPrisma.user.findUnique.mockResolvedValue(user);
    bcrypt.compare.mockResolvedValue(false);

    // Act
    await userController.login(mockRequest, mockResponse, mockNext);

    // Assert
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 400,
        message: "비밀번호가 일치하지 않습니다.",
      }),
    );
  });

  it("should login successfully with valid credentials", async () => {
    // Arrange
    mockRequest.body = {
      username: "testuser",
      password: "correctpassword",
    };

    const user = {
      username: "testuser",
      password: "hashedpassword",
    };

    const payload = {
      username: user.username,
    };

    const accessToken = "access.token";
    const refreshToken = "refresh.token";

    userController.generateAccessToken = jest.fn().mockReturnValue(accessToken);
    userController.generateRefreshToken = jest
      .fn()
      .mockReturnValue(refreshToken);

    mockPrisma.user.findUnique.mockResolvedValue(user);
    await bcrypt.compare.mockResolvedValue(true);
    mockPrisma.user.update.mockResolvedValue({ refreshToken });

    // Act
    await userController.login(mockRequest, mockResponse, mockNext);

    // Assert
    expect(bcrypt.compare).toHaveBeenCalledWith(
      "correctpassword",
      "hashedpassword",
    );
    expect(userController.generateAccessToken).toHaveBeenCalledWith(payload);
    expect(userController.generateRefreshToken).toHaveBeenCalledWith(payload);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { username: user.username },
      data: { refreshToken },
    });
    expect(mockResponse.status).toHaveBeenCalledWith(200);
  });

  it("should handle error if refresh token is missing", async () => {
    mockRequest.body = { refreshToken: null };

    await userController.refreshToken(mockRequest, mockResponse, mockNext);

    // Assert
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 400,
        message: "리프레시 토큰이 없습니다.",
      }),
    );
  });

  it("should successfully issues new signed access token", async () => {
    Object.assign(mockRequest.body, { refreshToken: "refreshToken" });
    const payload = { username: "username" };
    const user = {
      username: "username",
      nickname: "nickname",
      password: "hashedpassword",
      refreshToken: "refreshToken",
    };
    const newAccessToken = "newAccessToken";
    jwt.verify = jest.fn().mockReturnValue(payload);
    userController.generateAccessToken = jest
      .fn()
      .mockReturnValue(newAccessToken);
    mockPrisma.user.findUnique.mockResolvedValue(user);

    await userController.refreshToken(mockRequest, mockResponse, mockNext);

    expect(jwt.verify).toHaveBeenCalledWith(
      "refreshToken",
      process.env.REFRESH_TOKEN_SECRET,
    );
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { username: payload.username },
    });
    expect(mockResponse.status).toHaveBeenCalledWith(200);
  });
});
