// Re-exports the shared Sequelize instance from the root database/ folder.
// All backend models should import from here.
export { default, connectDB } from "../../../database/connection.js";
