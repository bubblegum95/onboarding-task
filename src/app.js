import express from "express";
import userRouter from "./routes/user.router.js";
import setupSwagger from "./swagger.js";
import "dotenv/config";

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/users", userRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message });
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

setupSwagger(app);

app.listen(port, () => {
  console.log("서버가 열렸습니다.");
});
