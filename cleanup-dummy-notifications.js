// cleanup-dummy-notifications.js
//
// Yeh script woh purani dummy/test notifications delete karta hai jinka
// message "... ne aapko meeting request bheja hai" (Hinglish test data)
// pattern match karta hai — kyunki app mein abhi notification auto-create
// karne ka feature hi nahi hai, yeh sab manually/seed se daali gayi thi.
//
// Run: node cleanup-dummy-notifications.js

import { Notification } from "./src/modules/notifications/notifications-model.js";
import { Op } from "sequelize";
import sequelize from "./src/database/connection.js";

const run = async () => {
  await sequelize.authenticate();

  const deleted = await Notification.destroy({
    where: {
      [Op.or]: [
        { message: { [Op.iLike]: "%ne aapko%" } },
        { message: { [Op.iLike]: "%bheja hai%" } },
        { type: "MEETING_REQUEST" },
      ],
    },
  });

  console.log(`Deleted ${deleted} dummy/test notification(s).`);
  await sequelize.close();
};

run().catch((err) => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});