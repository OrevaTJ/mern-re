import Listing from '../models/listing.model.js';
import { errorHandler } from '../utils/error.js';

export const createListing = async (req, res, next) => {
  try {
    const listing = await Listing.create(req.body);
    return res.status(201).json(listing);
  } catch (error) {
    next(error);
  }
};

export const deleteListing = async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);

  if (!listing) return next(errorHandler(404, 'Listing not found'));

  if (req.user.id !== listing.userId)
    return errorHandler(401, 'Only delete your own listing');

  try {
    await Listing.findByIdAndDelete(req.params.id);

    return res.status(201).json('Deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const updateListing = async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);

  if (!listing) return next(errorHandler(404, 'Listing not found'));

  if (req.user.id !== listing.userId)
    return errorHandler(401, 'Only update your own listing');

  try {
    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true, // return updated document
        runValidators: true, // enforce validation rules specified in the model's schema
      }
    );

    return res.status(201).json(updatedListing);
  } catch (error) {
    next(error);
  }
};

export const getSingleListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return next(errorHandler(404, 'Not found'));

    res.status(200).json(listing);
  } catch (error) {
    next(error);
  }
};

export const getListings = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 9;
    const startIndex = parseInt(req.query.startIndex);

    let offer = req.query.offer;

    if (offer === undefined || offer === 'false') {
      offer = { $in: [false, true] };
    }

    let furnished = req.query.furnished;

    if (furnished === undefined || furnished === 'false') {
      furnished = { $in: [false, true] };
    }

    let parking = req.query.parking;

    if (parking === undefined || parking === 'false') {
      parking = { $in: [false, true] };
    }

    let type = req.query.type;

    if (type === undefined || type === 'all') {
      type = { $in: ['sale', 'rent'] };
    }

    // Extracting min and max price from query params
    let minPrice;
    let maxPrice;
    let priceQuery = {};
    if(req.query.price === '1000') {
      minPrice = 0;
      maxPrice = 1000;
    }
    if(req.query.price === '5000') {
      minPrice = 1001;
      maxPrice = 5000;
    }
    if(req.query.price === '5000+') {
      minPrice = 5000;
      maxPrice = Infinity;
    }

    if (minPrice !== undefined && maxPrice !== undefined) {
      priceQuery = {
        priceRegular: { $gte: minPrice, $lte: maxPrice },
      };
    }

    const searchTerm = req.query.q || '';
    const searchLocation = req.query.location || '';
    const sort = req.query.sort || 'createdAt';
    const order = req.query.order || 'desc';

    const listings = await Listing.find({
      name: { $regex: searchTerm, $options: 'i' },
      location: { $regex: searchLocation, $options: 'i' },
      offer,
      furnished,
      parking,
      type,
      ...priceQuery
    })
      .sort({ [sort]: order })
      .limit(limit)
      .skip(startIndex);

    return res.status(200).json(listings);
  } catch (error) {
    next(error);
  }
};
