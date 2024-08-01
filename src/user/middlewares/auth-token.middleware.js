import jwt from "jsonwebtoken";
import "dotenv/config";

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  const accessSecretKey = process.env.ACCESS_TOKEN_SECRET;

  if (!token) {
    return res.status(401).json({ message: "토큰이 없습니다." });
  }

  jwt.verify(token, accessSecretKey, (err, user) => {
    if (err) {
      return res
        .status(403)
        .json({ message: "유효하지 않은 토큰입니다. 재로그인해주세요." });
    }

    req.user = user;
    next();
  });
};

export default authenticateToken;
