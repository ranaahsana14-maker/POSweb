# BILLGO Point of Sale System

A modern point of sale system built with Next.js for web deployment and desktop applications via Nativefier.

## Features

- 🌐 **Web Application**: Deploy and run in any modern browser
- 🖥️ **Desktop App**: Create native desktop apps for Windows, macOS, and Linux
- 🎨 **Modern UI**: Built with React, Tailwind CSS, and shadcn/ui components
- ⚡ **Fast & Responsive**: Optimized Next.js performance
- 📊 **Real-time Analytics**: Track sales, inventory, and profit

## Development

Run the Next.js development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Building for Production

### Web Application

Build the Next.js application:

```bash
npm run build
npm run start
```

The optimized production build will be ready to deploy.

### Desktop Application

Create desktop applications using Nativefier:

```bash
# For local development testing
npm run build:desktop

# For production (update YOUR_PRODUCTION_URL in package.json first)
npm run package:desktop:prod
```

Desktop apps will be created in the `./desktop-build` directory for Windows, macOS, and Linux.

For detailed instructions on customizing and distributing desktop apps, see [NATIVEFIER.md](./NATIVEFIER.md).

## Prerequisites

- Node.js 18+ and npm
- For desktop builds: An app icon at `./public/app-icon.jpg` (512x512px PNG recommended)

## Project Structure

```
billgo-pos/
├── app/              # Next.js app router pages
├── components/       # React components
├── lib/              # Utility functions and helpers
├── public/           # Static assets
├── nativefier.json   # Desktop app configuration
├── NATIVEFIER.md     # Desktop build guide
└── package.json      # Node.js dependencies
```

## Tech Stack

- **Frontend**: Next.js 16, React 18, TypeScript
- **Styling**: Tailwind CSS 4, shadcn/ui components
- **Icons**: Lucide React
- **Desktop**: Nativefier (Electron wrapper)

## Deployment

### Web Deployment

Deploy to Vercel with one click or use any Node.js hosting platform:

```bash
npm run build
npm run start
```

For Vercel deployment, simply connect your repository and deploy automatically.

### Desktop Distribution

After building desktop apps, distribute the executables found in `./desktop-build/`:

- **macOS**: `BILLGO POS-darwin-x64/` or `BILLGO POS-darwin-arm64/`
- **Windows**: `BILLGO POS-win32-x64/`
- **Linux**: `BILLGO POS-linux-x64/`

## License

ISC

## Author

BILLGO Solutions
