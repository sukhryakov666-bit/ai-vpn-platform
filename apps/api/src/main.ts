import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { randomUUID } from "crypto";
import { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { parseCorsOrigins } from "./security";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");
  app.use(helmet());
  const corsOrigins = parseCorsOrigins(process.env.CORS_ORIGIN);
  app.enableCors({
    origin: corsOrigins,
    credentials: true
  });
  app.use((req: Request, res: Response, next: NextFunction) => {
    const startedAt = Date.now();
    const incomingRequestId = req.headers["x-request-id"];
    const requestId =
      typeof incomingRequestId === "string" && incomingRequestId.trim().length > 0
        ? incomingRequestId
        : randomUUID();
    res.setHeader("x-request-id", requestId);
    res.on("finish", () => {
      const durationMs = Date.now() - startedAt;
      console.log(
        JSON.stringify({
          ts: new Date().toISOString(),
          component: "api.http",
          request_id: requestId,
          method: req.method,
          path: req.originalUrl ?? req.url,
          status: res.statusCode,
          duration_ms: durationMs
        })
      );
    });
    next();
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true
    })
  );

  if (process.env.ENABLE_SWAGGER === "true") {
    const config = new DocumentBuilder()
      .setTitle("AI VPN API")
      .setDescription("Core API for AI-assisted VPN + Proxy platform")
      .setVersion("0.1.0")
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api/docs", app, document);
  }

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
