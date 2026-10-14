import { Sequelize } from "sequelize";
import logger from "../utils/logger.js";

const sequelize = new Sequelize(
  process.env.DATABASE_NAME,
  process.env.DATABASE_USERNAME,
  process.env.DATABASE_PASSWORD,
  {
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT || 5432,
    dialect: process.env.DATABASE_DIALECT || "postgres",
    logging: (msg) => logger.debug(msg),
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions: {
      ssl: process.env.NODE_ENV === "production"
        ? { require: true, rejectUnauthorized: false }
        : false,
    },
  }
);

const getErrorMessage = (err) => err?.parent?.message || err?.original?.message || err?.message;

const getTableName = (model) => {
  const tableName = typeof model.getTableName === "function" ? model.getTableName() : model.tableName;
  return typeof tableName === "object" ? tableName.tableName || JSON.stringify(tableName) : tableName;
};

const getStrictModels = async () => {
  const [{ default: User }, { default: Department }, placementSharedModels] = await Promise.all([
    import("../modules/auth/auth-model.js"),
    import("../modules/department/department-model.js"),
    import("../modules/placement/shared/index.js"),
  ]);

  return [
    User,
    Department,
    ...Object.values(placementSharedModels),
  ].filter((model, index, models) =>
    model && typeof model.sync === "function" && models.indexOf(model) === index
  );
};

const syncModelsTolerantly = async () => {
  const strictModels = await getStrictModels();
  const strictSet = new Set(strictModels);

  for (const model of strictModels) {
    await model.sync();
  }

  const skipped = [];
  for (const model of Object.values(sequelize.models)) {
    if (strictSet.has(model)) continue;
    try {
      await model.sync();
    } catch (err) {
      skipped.push(model.name);
      logger.warn(
        `Skipped non-placement model sync: model=${model.name}, table=${getTableName(model)}, error=${getErrorMessage(err)}`
      );
    }
  }

  for (const model of strictModels) {
    await model.sync({ alter: true });
  }

  logger.warn(
    `Non-placement model sync skipped ${skipped.length} model(s): ${skipped.length ? skipped.join(", ") : "none"}`
  );
};

export const connectDB = async () => {
  await sequelize.authenticate();
  logger.info("PostgreSQL connected via Sequelize");
  if (process.env.NODE_ENV === "development") {
    await syncModelsTolerantly();

    logger.info("Database synced");
  }
};

export default sequelize;
