require("dotenv").config();
const mongoose = require("mongoose");
const Listing = require("../models/listing");

mongoose.connect(process.env.ATLASDB_URL);

async function seedFilters() {
  const listings = await Listing.find({});

  for (let listing of listings) {
    let amenities = [];

    const title = listing.title.toLowerCase();
    const location = listing.location.toLowerCase();
    const country = listing.country?.toLowerCase() || "";
    const price = listing.price;

    // EVERY listing is at least a ROOM
    amenities.push("room");

    // ---------- PROPERTY TYPE ----------
    if (title.includes("villa")) amenities.push("villa");
    if (title.includes("apartment")) amenities.push("apartment");
    if (title.includes("dome")) amenities.push("dome");

    // ---------- POOL ----------
    if (
      title.includes("pool") ||
      title.includes("swimming") ||
      price >= 9000
    ) {
      amenities.push("pool");
    }

    // ---------- FARMS / COUNTRYSIDE ----------
    if (
      title.includes("farm") ||
      title.includes("countryside") ||
      title.includes("garden")
    ) {
      amenities.push("farm");
    }

    // ---------- CAMPING ----------
    if (
      title.includes("camp") ||
      title.includes("nature") ||
      title.includes("open views")
    ) {
      amenities.push("camping");
    }

    // ---------- MOUNTAINS ----------
    if (
      location.includes("bavaria") ||
      location.includes("alps") ||
      location.includes("mountain") ||
      country === "switzerland"
    ) {
      amenities.push("mountain");
    }

    // ---------- BOATS / LAKES / SEA ----------
    if (
      title.includes("lake") ||
      title.includes("sea") ||
      title.includes("beach") ||
      location.includes("tahoe") ||
      country === "greece"
    ) {
      amenities.push("boat");
    }

    // ---------- ICONIC CITIES ----------
    if (
      location.includes("paris") ||
      location.includes("rome") ||
      location.includes("london") ||
      location.includes("new york") ||
      location.includes("dubai")
    ) {
      amenities.push("iconic");
    }

    // ---------- ARCTIC ----------
    if (
      country.includes("iceland") ||
      country.includes("greenland") ||
      location.includes("arctic")
    ) {
      amenities.push("arctic");
    }

    // ---------- TRENDING ----------
    if (price >= 9000 || title.includes("luxury")) {
      listing.isTrending = true;
    }

    // Remove duplicates
    listing.amenities = [...new Set(amenities)];

    await listing.save();
  }

  console.log("ALL filters seeded. No blank categories left.");
  mongoose.connection.close();
}

seedFilters();
