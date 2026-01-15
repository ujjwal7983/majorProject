const Listing = require("../models/listing");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

// ================= INDEX (SEARCH + FILTER + PAGINATION) =================
module.exports.index = async (req, res) => {
  const { search, amenity, category, page = 1 } = req.query;

  const limit = 9; // listings per page
  const skip = (page - 1) * limit;

  let query = {};

  // Search by title or location
  if (search) {
    query.$or = [
      { title: new RegExp(search, "i") },
      { location: new RegExp(search, "i") }
    ];
  }

  // Amenity filter (pool, mountain, etc.)
  if (amenity) {
    query.amenities = amenity;
  }

  // Trending filter
  if (category === "trending") {
    query.isTrending = true;
  }

  const totalListings = await Listing.countDocuments(query);

  const allListings = await Listing.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.render("listings/index.ejs", {
    allListings,
    currentPage: Number(page),
    totalPages: Math.ceil(totalListings / limit),
    search,
    amenity,
    category
  });
};

// ================= RENDER NEW FORM =================
module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

// ================= SHOW SINGLE LISTING =================
module.exports.showListing = async (req, res) => {
  let { id } = req.params;

  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: { path: "author" }
    })
    .populate("owner");

  if (!listing) {
    req.flash("error", "Listing you requested does not exist");
    return res.redirect("/listings");
  }

  res.render("listings/show.ejs", { listing });
};

// ================= CREATE LISTING =================
module.exports.createListing = async (req, res) => {
  const response = await geocodingClient
    .forwardGeocode({
      query: req.body.listing.location,
      limit: 1
    })
    .send();

  const url = req.file.path;
  const filename = req.file.filename;

  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.image = { url, filename };
  newListing.geometry = response.body.features[0].geometry;

  await newListing.save();

  req.flash("success", "New Listing Created");
  res.redirect("/listings");
};

// ================= RENDER EDIT FORM =================
module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;

  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing you requested does not exist");
    return res.redirect("/listings");
  }

  let originalImageUrl = listing.image.url.replace(
    "/upload",
    "/upload/h_300,w_250"
  );

  res.render("listings/edit.ejs", { listing, originalImageUrl });
};

// ================= UPDATE LISTING =================
module.exports.updateListing = async (req, res) => {
  let { id } = req.params;

  let listing = await Listing.findByIdAndUpdate(id, {
    ...req.body.listing
  });

  if (typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url, filename };
    await listing.save();
  }

  req.flash("success", "Listing Updated");
  res.redirect(`/listings/${id}`);
};

// ================= DELETE LISTING =================
module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;

  await Listing.findByIdAndDelete(id);

  req.flash("success", "Listing Deleted");
  res.redirect("/listings");
};
