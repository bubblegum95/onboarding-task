import CustomError from "./middlewares/custom-error-handler";

export default class UserRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  createUser = async (username, nickname, hashedPassword) => {
    try {
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
        throw new CustomError(401, "사용자 정보를 생성할 수 없습니다.");
      }

      return user;
    } catch (error) {
      throw error;
    }
  };

  findUser = async (dto) => {
    try {
      return await this.prisma.user.findUnique({
        where: { username: dto.username },
        include: { roles: true },
      });
    } catch (error) {
      throw error;
    }
  };

  saveRefreshToken = async (username, refreshToken) => {
    try {
      await this.prisma.user.update({
        where: { username },
        data: { refreshToken },
      });
    } catch (error) {
      throw error;
    }
  };

  findUniqueUser = async (payload) => {
    try {
      const user = await this.prisma.user.findUnique({
        where: { username: payload.username },
      });

      return user;
    } catch (error) {
      throw error;
    }
  };
}
