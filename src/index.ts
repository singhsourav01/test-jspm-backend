import { ApiError, errorHandler } from "common-microservices-utils";
import cors from "cors";
import { config } from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
// Add this to your existing index.ts
import CmsRoutes from "./routes/cms.routes";
import SchoolRoutes from "./routes/school.routes";
import ContentRoutes from "./routes/content.routes";

// Add after other route registrations

config();

const app = express();
const port = parseInt(process.env.PORT || "") || 3000;
app.use(express.static("public"));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  express.json(),
  (err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Please send proper JSON");
    }
    return next();
  },
);

// Public auth routes must be registered before routers that use global authenticate
app.use("/test", CmsRoutes);
app.use("/test", SchoolRoutes);
app.use("/test", ContentRoutes);

app.use((err: ApiError, req: Request, res: Response, next: NextFunction) => {
  console.log(err);
  return errorHandler(err, req, res, next);
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
