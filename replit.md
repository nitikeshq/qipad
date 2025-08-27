# Overview

Qipad (Life force + platform → "Energized startup space") is a comprehensive business networking and investment platform that connects entrepreneurs with investors, facilitating project funding, community building, and job opportunities. The platform serves two main user types: business owners seeking funding and investors looking for investment opportunities. It features project creation and management, percentage-based equity investment system, community forums, job postings, comprehensive KYC verification processes, and advanced admin management system.

## Recent Updates
- **Navigation Fixed** - Changed "Find Projects" to "Find Innovations" pointing to /innovations route (January 2025)
- **Media Center Implementation** - Created attractive admin-managed media center for press releases, videos, and startup materials
- **KYC Events Fix** - Resolved KYC verification check for event creation; verified users can now create events properly
- **Company Edit Feature** - Added comprehensive company profile editing with logo upload and PDF profile functionality
- **KYC System Synchronized** - Fixed KYC verification status mismatch between documents and user records; bidding submission now works correctly (January 2025)
- **PayUMoney Live Integration** - Switched from test to live PayUMoney credentials for production payments
- **Bidding System Enhancement** - Changed "Project Bidding" to "Bidding" across platform; fixed view details functionality with proper routing
- **Marketing Tab Implementation** - Added dedicated Marketing tab with comprehensive media display (images/videos) and proper content organization
- **Project Edit Buttons Clarified** - Separated "Edit Project Info" and "Edit Project Details" for better UX
- **Investment Modal Scroll Fixed** - Resolved modal height issues with proper scrolling and accessible submit buttons
- **Communities System Restoration** - Added missing database category column and restored full community functionality with proper error handling
- **Enhanced User Registration** - Added "Individual" as third user type alongside Business Owner and Investor (December 2024)

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