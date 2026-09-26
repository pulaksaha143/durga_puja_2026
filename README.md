# Mumbai Durga Puja 2026 Directory

The ultimate digital guide to exploring iconic Durga Puja pandals across Mumbai, Thane, and Navi Mumbai. This web application provides devotees and visitors with an elegant, easy-to-use interface to find pandals, view precise Panjika timings, and navigate via Google Maps.

![Mumbai Durga Puja](public/hero-puja.png)

## Features

- **Comprehensive Directory**: Browse through 40+ iconic pandals across the city, organized by zones (Western Suburbs, Central, Thane & Kalyan, Navi Mumbai).
- **Intelligent Search & Filtering**: Instantly search for pandals by name, area, or zone. Use the `⌘K` shortcut to quickly focus the search bar.
- **Detailed Puja Schedule**: Built-in accurate Panjika timings (Tithi) spanning from Panchami to Dashami, available in both English and Bengali.
- **Smart Routing & Transit**: Dedicated circuit views and direct deep-linking to Google Maps for effortless navigation and parking details.
- **Responsive & Premium UI**: A beautifully crafted, mobile-first interface featuring rich aesthetics, custom styling, and smooth animations.

## Tech Stack

- **Frontend Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Vanilla CSS3 (Custom Design System, Flexbox/Grid, CSS Variables)
- **Routing**: React Router DOM

## Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/pulaksaha143/durga_puja_2026.git
   cd durga_puja_2026
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000` (or the port specified by Vite) in your browser.

## Project Structure

- `src/components/`: Reusable UI components (Navbar, PandalCard, Footer).
- `src/pages/`: Main application views (Home, Circuits, Schedule, Pandal Detail).
- `src/data/`: Core JSON data powering the application (`pandals.json`, `timings.json`).
- `src/index.css`: Global styles and design system tokens.

## Contributing

Contributions are always welcome! If you have updates for pandal details, new features, or bug fixes:
1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Developer

Built with ❤️ by **Pulak Saha**
