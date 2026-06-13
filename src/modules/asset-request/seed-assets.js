// src/modules/asset-request/seed-assets.js
//
// Run once to populate the `assets` table with sample data:
//   node src/modules/asset-request/seed-assets.js
//
import sequelize from "../../database/connection.js";
import { Asset } from "./asset-request-model.js";

const ASSETS = [
  // ── Class Rooms ──────────────────────────────────────────────────────────
  { name: "Room 101",      type: "Class Room", status: "Available", capacity: 40,  location: "Block A, Ground Floor" },
  { name: "Room 204",      type: "Class Room", status: "Available", capacity: 60,  location: "Block B, 2nd Floor" },
  { name: "Seminar Hall",  type: "Class Room", status: "Available", capacity: 120, location: "Block A, 1st Floor" },
  { name: "Lab 1 - CSE",   type: "Class Room", status: "Available", capacity: 30,  location: "Block C, Ground Floor" },
  { name: "Conference Room", type: "Class Room", status: "Available", capacity: 20, location: "Admin Block" },

  // ── Equipment ────────────────────────────────────────────────────────────
  { name: "Projector - Epson",     type: "Equipment", status: "Available" },
  { name: "Projector - BenQ",      type: "Equipment", status: "Available" },
  { name: "Laptop - Dell Latitude", type: "Equipment", status: "Available" },
  { name: "Laptop - HP ProBook",   type: "Equipment", status: "Available" },
  { name: "HDMI Camera",           type: "Equipment", status: "Available" },
  { name: "Wireless Mic Set",      type: "Equipment", status: "Available" },
  { name: "Portable Speaker",      type: "Equipment", status: "Available" },

  // ── Accommodation ────────────────────────────────────────────────────────
  { name: "Hostel Room - Block C 204", type: "Accommodation", status: "Available", capacity: 2 },
  { name: "Hostel Room - Block C 205", type: "Accommodation", status: "Available", capacity: 2 },
  { name: "Guest House Room 1",        type: "Accommodation", status: "Available", capacity: 1 },
  { name: "Guest House Room 2",        type: "Accommodation", status: "Available", capacity: 1 },
  { name: "Guest House Room 3",        type: "Accommodation", status: "Available", capacity: 2 },
];

const run = async () => {
  try {
    await sequelize.authenticate();
    console.log("DB connected. Seeding assets...");

    for (const asset of ASSETS) {
      const existing = await Asset.findOne({ where: { name: asset.name } });
      if (existing) {
        console.log(`⏭  Skipping (exists): ${asset.name}`);
        continue;
      }
      await Asset.create(asset);
      console.log(` Created: ${asset.name} (${asset.type})`);
    }

    console.log("\n Seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error(" Seed failed:", err);
    process.exit(1);
  }
};

run();