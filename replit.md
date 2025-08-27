# Overview

Qipad (Life force + platform → "Energized startup space") is a comprehensive business networking and investment platform that connects entrepreneurs with investors, facilitating project funding, community building, and job opportunities. The platform serves two main user types: business owners seeking funding and investors looking for investment opportunities. It features project creation and management, percentage-based equity investment system, community forums, job postings, comprehensive KYC verification processes, and advanced admin management system.

## Recent Updates
- **Rebranded from BizConnect to Qipad** - Complete application rebrand with new identity
- **Investment System Redesign** - Removed payment gateway for "invest" type, implemented percentage-based equity system with approval workflow
- **Advanced Admin Panel** - Comprehensive admin dashboard for managing all platform modules, categories, departments, and information
- **Trust-based Platform Fee** - 2% platform fee system on successful investments (trust-based, no gateway)
- **Separate Investment/Support Modals** - Created distinct modals for invest (equity-based) vs support (PayUMoney payment) with proper workflows
- **Project Editing System** - Comprehensive project editing with marketing tab for images/videos, business plan updates, team management
- **KYC Project Creation** - Only KYC-verified users can create projects, improved access control
- **Company Formation Enhancement** - Added 9-step process with comprehensive certification section (Startup, MSME, Udyam, ISO, Nasscom)

## Key Features
- **Dual Investment Types**: "Invest" (equity-based with percentage) vs "Support" (donation-based with payment gateway)
- **Company Formation Process**: 8-step tracker for new entrepreneurs  
- **Automated Tender Management**: Odisha government schemes with eligibility detection
- **Conditional Contact Sharing**: Between investors and project owners
- **Comprehensive Admin System**: Most advanced admin panel for complete platform management

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing with protected routes
- **State Management**: React Context for authentication state, TanStack React Query for server state management
- **UI Components**: Radix UI primitives with custom styling through shadcn/ui components
- **Styling**: Tailwind CSS with CSS variables for theming support
- **Authentication**: JWT-based authentication with local storage persistence

## Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: JWT tokens with bcrypt for password hashing
- **File Uploads**: Multer middleware for handling document uploads
- **API Design**: RESTful API with centralized error handling

## Database Design
- **Database**: PostgreSQL using Neon serverless database
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Key Entities**:
  - Users (business owners and investors)
  - Projects with funding goals and status tracking
  - Documents for KYC verification
  - Investments linking users to projects
  - Communities and community posts
  - Jobs and job applications
  - User connections for networking

## Authentication & Authorization
- **Strategy**: JWT-based authentication with role-based access control
- **User Types**: Business owners and investors with different permissions
- **Session Management**: Stateless JWT tokens stored in localStorage
- **Password Security**: bcrypt hashing for password storage
- **Verification System**: Email verification and KYC document verification

## Data Flow & State Management
- **Client State**: React Context for authentication, React Query for server state
- **API Communication**: Centralized API client with error handling
- **Real-time Updates**: Query invalidation for data consistency
- **Form Handling**: React Hook Form with Zod validation schemas

# External Dependencies

## Core Framework Dependencies
- **React Ecosystem**: React 18, React DOM, React Router (Wouter)
- **Build Tools**: Vite, TypeScript, ESBuild for production builds
- **Development**: Replit-specific plugins for development environment

## Database & ORM
- **Database**: Neon PostgreSQL serverless database
- **ORM**: Drizzle ORM with Drizzle Kit for schema management
- **Connection**: WebSocket-based connection using ws library

## UI & Styling
- **Component Library**: Radix UI primitives for accessible components
- **Styling**: Tailwind CSS with PostCSS and Autoprefixer
- **Icons**: Lucide React for consistent iconography
- **Utilities**: clsx and tailwind-merge for conditional styling

## Authentication & Security
- **JWT**: jsonwebtoken for token generation and verification
- **Password Hashing**: bcrypt for secure password storage
- **Session Storage**: connect-pg-simple for PostgreSQL session storage

## File Handling & Validation
- **File Uploads**: Multer for multipart form data handling
- **Validation**: Zod for runtime type checking and form validation
- **Form Management**: React Hook Form with Hookform resolvers

## Utility Libraries
- **Date Handling**: date-fns for date manipulation and formatting
- **Query Management**: TanStack React Query for server state
- **Command Interface**: cmdk for command palette functionality
- **Class Variants**: class-variance-authority for component variants