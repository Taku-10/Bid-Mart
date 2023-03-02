const express = require("express");
const router = express.Router({mergeParams: true});
const nodemailer = require('nodemailer');
const User = require("../models/user");
const Bid = require("../models/bid");
const Listing = require("../models/listing");
const passport= require("passport");
const{isSignedIn} = require("../authenticate");
require("dotenv").config();
const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);


// Function to send Welcome email
const sendWelcomeEmail = async (toEmail, name) => {
    const msg = {
        from: process.env.EMAIL_FROM,
        to: toEmail,
        subject: 'Welcome to Auctions WA',
        html: `<P>Hello ${name}, </p>
        <p>Thank you for joining Auctions WA! We are excited to have you on board.</p>
        <p>You can start browsing listings by visising <a href="http://localhost:3000/listings">Go to listings page</a>.</p>
        <p>Best regards, <br/> The Auctions WA Team</p>`
    };

    let retryCount = 0;
    while (retryCount < 3) {
        try {
            await sgMail.send(msg);
            console.log("Email sent successfully!");
            return;

        } catch (error) {
            console.log(`Error sending email ${retryCount + 1} retries left: ${error}`);
            retryCount++;
            await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait for  seconds before retrying to send email again
        }
    }

    console.error("Maximum email sending attempts reached.")
}


/*This route will be used to render the register form for a user to register*/
router.get("/register", (req, res) => {
    res.render("users/register.ejs")
})


/*This route will be used to register a user thus submitting the user's details to the database*/
router.post("/register", async(req, res, next) => {
    try {
        const {firstname, lastname, email, username, number, password} = req.body;
        const user = new User({firstname, lastname, email, username, number});
        // Register user through passport
        const registeredUser = await User.register(user, password);
        // Log in the newly registered user after registering useing passport
        // await sendWelcomeEmail(req.body.email, req.body.firstname);
        req.logIn(registeredUser, err => {
            if (err) {
                console.log(err);
                res.redirect("/login")
            }
            else {
                // Successfully registered
                // Send welcome email to the newly registered user
                req.flash("success", "Welcome")
                res.redirect("/listings");  
            }
        });

    } catch (error) {
        req.flash("error", error.message);
        res.redirect("/register");
    }
})



/*This route will be used to render the log in form for the user to log in*/
router.get("/login", (req, res) => {
    res.render("users/login");

});


/*This route will be used to log in the user by checking the provided details on the log in form correspond to the
 ones in the database*/
router.post("/login", passport.authenticate("local", {failureFlash: true, failureRedirect:"/login"}), (req, res) => {
    req.flash("success", "Welcome back");
    const redirectUrl = req.session.returnTo || "/listings";
    delete req.session.returnTo;
    res.redirect(redirectUrl);
});


/*This route will be used to log out the user*/
router.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if(err) return next(err);
        req.flash("success", "Goodbye!");
        res.redirect("/listings");
    });
    
});

// User profile management routes


// This will render the form with the user's personal details

router.get("/profile", isSignedIn, async(req, res) => {
    const user = await User.findById(req.user._id);
    res.render("users/profile", {user});
});

// This route will postbthe users updates to the form
router.put("/profile/:id", isSignedIn, async(req, res) => {
    const userId = req.params.id;
    const updatedUser = await User.findByIdAndUpdate(userId, req.body, {new:true, runValidators: true});
    req.login(updatedUser, (err) => {
        if (err) {
            console.log(err);
            return next(err);
        }
        req.flash("success", "Successfully updated your profile");
        res.redirect("/profile");
    })
});

// Route to retrieve the currently logged in user's bids on different listings

router.get("/bids", isSignedIn, async (req, res) => {
    try {
      const bids = await Bid.find({ owner: req.user._id })
        .populate("owner")
        .exec();
      const bidObjects = [];
      for (let i = 0; i < bids.length; i++) {
        const bid = bids[i];
        const listing = await Listing.findById(bid.listing).exec();
        bidObjects.push({
          bid,
          listing,
        });
      }
      res.render("users/bids", { bids: bidObjects }) ;
    } catch (error) {
      console.log(error);
      res.redirect("/");
    }
  });

module.exports = router;

/*

router.get("/listings", isSignedIn, async(req, res) => {
    const currentUserId = req.user._id;
    // Find all the listings that have been posted by the currently logged in user
    const listings = await Listing.find({owner: currentUserId});
    res.render("users/listings", {listings});
    
})
*/