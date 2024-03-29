// Model for a listing to post that is up for auction and open to bids
const mongoose = require("mongoose");
const Bid = require("./bid");
const User = require("./user");
const Admin = require("./admin");
const { Number } = require("core-js");
const Watchlist = require("./watchlist")
const {Schema} = mongoose;

const listingSchema = new Schema({
    startTime: {
        type: Date,
    },

    title: {
        type: String,
        required: [true, "Title must be provided"],
        trim: true
    },

    description: {
        type: String,
        trim: true
    },

    images: [
        {
            url: String,
            filename: String
        }
    ],

    price: {
        type: Number,
        required: [true, "Price must be provided"]
    },

    condition: {
        type: String, 
        enum: ["New", "Used-like new", "Used-good", "Used-fair"],
        required: [true, "Condition of the product must be supplied"]
    },
    
    category: {
        type: String,
        enum: ["Home & Garden", "Entertainment", "Clothing and accessories", "Electronics", "Sports and outdoors"],
        required: [true, "Category must be selecetd"]
        
    },

    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"

    },

    endTime: {
        type: Date,
    },
    
    geometry: {
        type: {
            type: String,
            enum: ["Point"],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },

    location: {
        type: String,
        required: [true, "The location of your listing must be supplied"]
    },

    bids: [
        {
            type: Schema.Types.ObjectId,
            ref: "Bid"
        }
    ],

    status: {
        type: String,
        enum: ["Pending", "Approved", "Rejected"],
        default: "Pending",
    },

    handledBy: {
        type: Schema.Types.ObjectId,
        ref: "Admin"
    },

    auctionStatus: {
        type: String,
        enum: ["Open", "Closed"],
        default: "Open"
    }

});


listingSchema.post('findOneAndDelete', async function(doc) {
    if (doc) {
      await Watchlist.deleteMany({listing: doc._id});
    }
  });
  

listingSchema.index({title: "text", description: "text"});

const Listing = mongoose.model("Listing", listingSchema);

module.exports = Listing;
