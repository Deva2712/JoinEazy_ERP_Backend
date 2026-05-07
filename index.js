import "dotenv/config";
import app from "./src/app.js";
import { connectDB } from "./src/database/connection.js";
import logger from "./src/utils/logger.js";

const PORT = process.env.PORT || 8000;

// Connect to database then start server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`);
    });
  })
  .catch((err) => {
    logger.error("Failed to connect to database:", err);
    process.exit(1);
  });
