# Snake.io Game

A web-based multiplayer snake game inspired by slither.io, built with HTML5 Canvas and JavaScript. Features user authentication and high score tracking with Supabase backend.

## Features

- Smooth snake movement controlled by mouse
- AI opponents that seek food and avoid walls
- Colorful food items to collect and grow
- User authentication with Supabase
- Persistent high scores
- Leaderboard showing top players
- Collision detection with other snakes
- Game over when you collide with another snake
- Responsive design that works on different screen sizes

## Getting Started

### Prerequisites

- Node.js (v14+ recommended)
- npm or yarn
- Supabase account

### Setup

1. Clone the repository
```
git clone <repository-url>
cd snake-io-game
```

2. Install dependencies
```
npm install
```

3. Create a Supabase project
   - Go to [Supabase](https://supabase.com) and create a new project
   - Create the following tables in your Supabase database:
     - `profiles` table with columns: `id` (UUID, primary key), `username` (text), `updated_at` (timestamp)
     - `highscores` table with columns: `id` (UUID, primary key), `user_id` (UUID, foreign key to auth.users), `username` (text), `score` (integer), `created_at` (timestamp)

4. Configure environment variables
   - Copy `.env.example` to `.env`
   - Add your Supabase URL and anon key from your Supabase project settings
```
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Development

Start the development server:
```
npm start
```

The game will be available at http://localhost:1234

### Build for Production

Build the project for production:
```
npm run build
```

The output will be in the `dist` directory.

## Deployment

### Deploying to Netlify

1. Push your code to GitHub

2. Create a new site in Netlify
   - Connect to your GitHub repository
   - Use the following build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`
   
3. Add environment variables
   - In Netlify site settings, add the Supabase environment variables from your `.env` file

4. Deploy!

### Supabase Backend

The game uses Supabase for:
- User authentication
- Storing player profiles
- Tracking and displaying high scores

## Playing the Game

1. Sign up for an account or play as a guest
2. Enter your name and click "Play"
3. Move your mouse to control the direction of your snake
4. Collect colored dots to grow longer
5. Avoid colliding with other snakes
6. Try to become the longest snake on the leaderboard

## Controls

- **Mouse Movement**: Control the direction of your snake

## Browser Compatibility

The game works best in modern browsers that support HTML5 Canvas:
- Chrome
- Firefox
- Safari
- Edge

## License

This project is open source and free to use. 