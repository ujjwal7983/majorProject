const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");

const listingSchema = new Schema({
  title: {
    type: String,
    required: true,
    index: true,        
  },
  description: String,
  image: {
    url: String,
    filename: String
  },
  price: Number,

  location: {
    type: String,
    index: true        
  },

  country: String,

  amenities: {
    type: [String],    
    index: true
  },

  isTrending: {
    type: Boolean,
    default: false,
    index: true
  },

  reviews: [{
    type: Schema.Types.ObjectId,
    ref: "Review",
  }],

  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },

  geometry: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true 
    },
  },
}, { timestamps: true }); 


listingSchema.post("findOneAndDelete", async (listing) => {
  if (listing) {
    await Review.deleteMany({_id: { $in: listing.reviews}});
  }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;