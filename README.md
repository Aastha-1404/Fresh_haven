# Fresh Haven

Fresh Haven is an Express and EJS accommodation marketplace for discovering, creating, and reviewing stays.

## Features

- Browse listings by category, search term, and price range
- View listing details, images, locations, and reviews
- Create, edit, and delete listings after signing in
- Add and remove reviews
- Local username/password authentication with Passport
- Image uploads through Cloudinary
- MongoDB-backed sessions and application data
- Privacy and terms pages

## Tech Stack

- Node.js and Express
- MongoDB with Mongoose
- EJS and EJS Mate
- Passport Local for authentication
- Cloudinary and Multer for image uploads

## Getting Started

### Prerequisites

- Node.js 18 or newer
- MongoDB, either a local instance or MongoDB Atlas
- A Cloudinary account for listing image uploads

### Install

```bash
npm install
```

Create a `.env` file in the project root:

```env
ATLASDB_URL=mongodb://127.0.0.1:27017/fresh_haven
SECRET_KEY=replace-with-a-long-random-value
MAPBOX_TOKEN=your-mapbox-token
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_KEY=your-cloudinary-key
CLOUDINARY_SECRET=your-cloudinary-secret
```

`MONGO_URL` can be used instead of `ATLASDB_URL`. The application falls back to `mongodb://localhost:27017/fresh_haven` when neither variable is set.

### Seed sample data

With MongoDB running locally, initialize the sample listings:

```bash
node init/index.js
```

### Run the application

```bash
node app.js
```

The server runs at [http://localhost:8000](http://localhost:8000).

## Main Routes

| Method | Path | Description |
| --- | --- | --- |
| GET | `/listings` | Browse listings |
| GET | `/listings/new` | Show the new-listing form |
| GET | `/listings/:id` | View a listing |
| PUT | `/listings/:id` | Update a listing |
| DELETE | `/listings/:id` | Delete a listing |
| POST | `/listings/:id/reviews` | Add a review |
| GET/POST | `/users/signup` | Create an account |
| GET/POST | `/users/login` | Sign in |
| POST | `/users/logout` | Sign out |

## Security

Never commit `.env` or other files containing credentials. Keep production secrets in your deployment platform's environment configuration.