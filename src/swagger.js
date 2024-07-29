import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "My API",
      version: "1.0.0",
      description: "API documentation",
    },
  },
  apis: ["./src/routes/*.js"], // API 문서를 자동으로 생성할 파일 경로
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

export default function setupSwagger(app) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
