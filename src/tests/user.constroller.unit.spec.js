import bcrypt from "bcrypt";
import UserController from "../controllers/user.controller";
import { beforeEach, jest, describe, it, expect } from "@jest/globals";

// Mock objects
const mockPrisma = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
};

const mockRequest = {
  body: {},
};

const mockResponse = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
};

const mockNext = jest.fn();

// 개별 함수 모킹
bcrypt.hash = jest.fn();
bcrypt.compare = jest.fn();

// UserController 인스턴스 생성
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
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "요청 정보가 올바르지 않습니다.",
    });
  });

  it("should handle error if user creation fails", async () => {
    // Arrange
    const hashedPassword = "hashedpassword";
    mockRequest.body = {
      username: "박승호",
      nickname: "승호",
      password: "examplepassword",
    };

    mockBcrypt.hash.mockResolvedValue(hashedPassword);
    mockPrisma.user.create.mockRejectedValue(new Error("Database error"));

    // Act
    await userController.signUp(mockRequest, mockResponse, mockNext);

    // Assert
    expect(mockNext).toHaveBeenCalledWith(new Error("Database error"));
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

  // it("should throw new error if user input information doesnt exist", async () => {});
});
