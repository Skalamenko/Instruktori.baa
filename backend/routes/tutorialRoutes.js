import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import Tutorial from '../models/tutorialModel.js';
import { isAuth, isAdmin } from '../utils.js';

const tutorialRouter = express.Router();

tutorialRouter.get('/', async (req, res) => {
  const tutorials = await Tutorial.find();
  res.send(tutorials);
});

tutorialRouter.post(
  '/',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const newTutorial = new Tutorial({
      name: 'sample name ' + Date.now(),
      slug: 'sample-name-' + Date.now(),
      image: '/images/p1.jpg',
      price: 0,
      category: 'sample category',
      rating: 0,
      numberReviews: 0,
      description: 'sample description',
    });
    const tutorial = await newTutorial.save();
    res.send({ message: 'Tutorial Created', tutorial });
  })
);

tutorialRouter.put(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const tutorialId = req.params.id;
    const tutorial = await Tutorial.findById(tutorialId);
    if (tutorial) {
      tutorial.name = req.body.name;
      tutorial.slug = req.body.slug;
      tutorial.price = req.body.price;
      tutorial.image = req.body.image;
      tutorial.images = req.body.images;
      tutorial.category = req.body.category;

      tutorial.countInStock = req.body.countInStock;
      tutorial.description = req.body.description;
      await tutorial.save();
      res.send({ message: 'Tutorial Updated' });
    } else {
      res.status(404).send({ message: 'Tutorial Not Found' });
    }
  })
);

tutorialRouter.delete(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const tutorial = await Tutorial.findById(req.params.id);
    if (tutorial) {
      await tutorial.remove();
      res.send({ message: 'Tutorial Deleted' });
    } else {
      res.status(404).send({ message: 'Tutorial Not Found' });
    }
  })
);

tutorialRouter.post(
  '/:id/reviews',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const tutorialId = req.params.id;
    const tutorial = await Tutorial.findById(tutorialId);
    if (tutorial) {
      if (tutorial.reviews.find((x) => x.name === req.user.name)) {
        return res
          .status(400)
          .send({ message: 'You already submitted a review' });
      }

      const review = {
        name: req.user.name,
        rating: Number(req.body.rating),
        comment: req.body.comment,
      };
      tutorial.reviews.push(review);
      tutorial.numberReviews = tutorial.reviews.length;
      tutorial.rating =
        tutorial.reviews.reduce((a, c) => c.rating + a, 0) /
        tutorial.reviews.length;
      const updatedTutorial = await tutorial.save();
      res.status(201).send({
        message: 'Review Created',
        review: updatedTutorial.reviews[updatedTutorial.reviews.length - 1],
        numberReviews: tutorial.numberReviews,
        rating: tutorial.rating,
      });
    } else {
      res.status(404).send({ message: 'Tutorial Not Found' });
    }
  })
);

const PAGE_SIZE = 3;

tutorialRouter.get(
  '/admin',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const { query } = req;
    const page = query.page || 1;
    const pageSize = query.pageSize || PAGE_SIZE;

    const tutorials = await Tutorial.find()
      .skip(pageSize * (page - 1))
      .limit(pageSize);
    const countTutorials = await Tutorial.countDocuments();
    res.send({
      tutorials,
      countTutorials,
      page,
      pages: Math.ceil(countTutorials / pageSize),
    });
  })
);

tutorialRouter.get(
  '/search',
  expressAsyncHandler(async (req, res) => {
    const { query } = req;
    const pageSize = query.pageSize || PAGE_SIZE;
    const page = query.page || 1;
    const category = query.category || '';
    const price = query.price || '';
    const rating = query.rating || '';
    const order = query.order || '';
    const searchQuery = query.query || '';

    const queryFilter =
      searchQuery && searchQuery !== 'all'
        ? {
            name: {
              $regex: searchQuery,
              $options: 'i',
            },
          }
        : {};
    const categoryFilter = category && category !== 'all' ? { category } : {};
    const ratingFilter =
      rating && rating !== 'all'
        ? {
            rating: {
              $gte: Number(rating),
            },
          }
        : {};
    const priceFilter =
      price && price !== 'all'
        ? {
            // 1-50
            price: {
              $gte: Number(price.split('-')[0]),
              $lte: Number(price.split('-')[1]),
            },
          }
        : {};
    const sortOrder =
      order === 'featured'
        ? { featured: -1 }
        : order === 'lowest'
        ? { price: 1 }
        : order === 'highest'
        ? { price: -1 }
        : order === 'toprated'
        ? { rating: -1 }
        : order === 'newest'
        ? { createdAt: -1 }
        : { _id: -1 };

    const tutorials = await Tutorial.find({
      ...queryFilter,
      ...categoryFilter,
      ...priceFilter,
      ...ratingFilter,
    })
      .sort(sortOrder)
      .skip(pageSize * (page - 1))
      .limit(pageSize);

    const countTutorials = await Tutorial.countDocuments({
      ...queryFilter,
      ...categoryFilter,
      ...priceFilter,
      ...ratingFilter,
    });
    res.send({
      tutorials,
      countTutorials,
      page,
      pages: Math.ceil(countTutorials / pageSize),
    });
  })
);

tutorialRouter.get(
  '/categories',
  expressAsyncHandler(async (req, res) => {
    const categories = await Tutorial.find().distinct('category');
    res.send(categories);
  })
);

tutorialRouter.get('/slug/:slug', async (req, res) => {
  const tutorial = await Tutorial.findOne({ slug: req.params.slug });
  if (tutorial) {
    res.send(tutorial);
  } else {
    res.status(404).send({ message: 'Tutorial Not Found' });
  }
});
tutorialRouter.get('/:id', async (req, res) => {
  const tutorial = await Tutorial.findById(req.params.id);
  if (tutorial) {
    res.send(tutorial);
  } else {
    res.status(404).send({ message: 'Tutorial Not Found' });
  }
});

export default tutorialRouter;
