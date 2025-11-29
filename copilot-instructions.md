# SquadSpace.me - Copilot Instructions

## Project Overview
SquadSpace.me is a modern team collaboration and squad management platform that helps groups organize, communicate, and achieve their goals together. Think of it as a fusion of team workspace, project management, and social networking specifically designed for small to medium-sized squads.

## Core Mission
Create a space where squads thrive - whether they're gaming teams, study groups, startup teams, creative collectives, or hobby clubs.

## Key Features to Implement

### 1. Squad Formation & Management
- Squad creation with customizable profiles
- Role-based permissions (Squad Leader, Co-leader, Members, Guests)
- Squad tags and categories (Gaming, Professional, Educational, Creative, Sports)
- Member invitation system with unique squad codes
- Squad capacity limits and waitlists

### 2. Communication Hub
- Real-time chat with channels (#general, #announcements, custom channels)
- Voice and video call integration
- Direct messaging between squad members
- Threaded conversations and reactions
- Rich media sharing (images, GIFs, files)

### 3. Activity & Event Planning
- Shared calendar with event scheduling
- RSVP system for squad events
- Recurring events support
- Time zone handling for distributed squads
- Event reminders and notifications

### 4. Squad Dashboard
- Activity feed showing recent squad actions
- Member availability status
- Squad statistics and analytics
- Achievement system and milestones
- Squad health metrics (engagement, activity levels)

### 5. Resource Sharing
- Shared file storage with folder organization
- Document collaboration
- Link library and bookmarks
- Knowledge base/wiki for squad information
- Resource tagging and search

### 6. Task Management
- Kanban-style task boards
- Task assignment and tracki
- Sprint planning for project-oriented squads
- Progress visualization
- Deadline reminders

## Technical Stack Recommendations

### Frontend
```
- Next.js 14+ with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- Framer Motion for animations
- Shadcn/ui component library
- Socket.io client for real-time features
- React Query for state management
```

### Backend
```
- Node.js with Express or Fastify
- PostgreSQL for relational data
- Redis for caching and session management
- Socket.io for WebSocket connections
- JWT for authentication
- AWS S3 or Cloudinary for file storage
```

### DevOps & Deployment
```
- Docker for containerization
- GitHub Actions for CI/CD
- Vercel or AWS for hosting
- Cloudflare for CDN and DDoS protection
- Sentry for error monitoring
- Analytics with Plausible or Umami
```

## Design Principles

### Visual Identity
- **Primary Colors**: Deep space blue (#0F172A) and electric purple (#8B5CF6)
- **Accent Colors**: Neon green (#10B981) for CTAs, warm orange (#F97316) for notifications
- **Typography**: Modern sans-serif (Inter for UI, Space Grotesk for headings)
- **Dark mode first** with optional light theme
- Glassmorphism effects for cards and modals
- Smooth micro-interactions and hover effects

### User Experience
- Mobile-first responsive design
- Accessibility compliant (WCAG 2.1 AA)
- Progressive Web App capabilities
- Offline functionality for essential features
- Fast load times (< 3s initial load)
- Intuitive onboarding flow

## Key User Flows

### 1. New User Onboarding
```
1. Landing page with value proposition
2. Sign up with email/social auth
3. Profile creation wizard
4. Option to create new squad or join existing
5. Squad discovery or invitation code entry
6. Welcome to squad dashboard
```

### 2. Squad Creation Flow
```
1. Choose squad type/category
2. Set squad name and description
3. Configure privacy settings (public/private/invite-only)
4. Customize squad appearance
5. Set up initial channels/spaces
6. Invite first members
```

### 3. Daily Active User Flow
```
1. Dashboard with activity feed
2. Check notifications and messages
3. View today's events/tasks
4. Participate in squad chat
5. Update status/availability
6. Complete assigned tasks
```

## API Structure

### RESTful Endpoints
```
/api/auth/* - Authentication routes
/api/squads/* - Squad CRUD operations
/api/members/* - Member management
/api/messages/* - Messaging system
/api/events/* - Event management
/api/tasks/* - Task tracking
/api/files/* - File management
/api/analytics/* - Squad analytics
```

### WebSocket Events
```
squad:message - New message in squad
squad:member_join - Member joined squad
squad:member_leave - Member left squad
squad:event_update - Event created/modified
squad:task_update - Task status changed
user:status_change - Member status update
```

## Security Considerations
- Implement rate limiting on all API endpoints
- Use HTTPS everywhere
- Sanitize all user inputs
- Implement CSRF protection
- Regular security audits
- Data encryption at rest and in transit
- GDPR compliance for EU users
- Regular backups with point-in-time recovery

## Performance Targets
- Page load time: < 3 seconds
- Time to interactive: < 5 seconds
- API response time: < 200ms (p95)
- WebSocket latency: < 100ms
- 99.9% uptime SLA
- Support for 10,000 concurrent users

## Monetization Strategy (Future)
- Freemium model with squad size limits
- Premium features (unlimited storage, advanced analytics)
- Custom domain support for squads
- White-label solutions for organizations
- Squad marketplace for templates and plugins

## Development Phases

### Phase 1: MVP (Weeks 1-4)
- User authentication and profiles
- Basic squad creation and management
- Simple chat functionality
- Member invitation system

### Phase 2: Core Features (Weeks 5-8)
- Full messaging system with channels
- Event calendar and scheduling
- File sharing capabilities
- Basic task management

### Phase 3: Enhancement (Weeks 9-12)
- Voice/video calls
- Advanced analytics dashboard
- Mobile app development
- Third-party integrations

### Phase 4: Scale & Polish (Weeks 13-16)
- Performance optimization
- Advanced security features
- Premium tier implementation
- Marketing website

## Testing Requirements
- Unit tests for all utility functions (> 80% coverage)
- Integration tests for API endpoints
- E2E tests for critical user flows
- Performance testing with load simulation
- Security penetration testing
- Cross-browser compatibility testing
- Mobile device testing

## Documentation Needs
- API documentation with OpenAPI/Swagger
- User guide and FAQs
- Developer documentation for contributions
- Video tutorials for key features
- Admin documentation for squad leaders

## Success Metrics
- User retention rate > 60% (30-day)
- Average session duration > 15 minutes
- Squad activity rate > 70% (weekly active squads)
- Member engagement score > 7/10
- NPS score > 40
- Load time < 3s for 95% of users

## Copilot Assistance Guidelines

When helping with this project, please:
1. Prioritize clean, maintainable code with proper TypeScript types
2. Follow React/Next.js best practices and conventions
3. Implement proper error handling and loading states
4. Write comprehensive comments for complex logic
5. Suggest performance optimizations where applicable
6. Consider accessibility in all UI implementations
7. Provide examples of test cases for new features
8. Recommend security best practices for sensitive operations
9. Use semantic HTML and proper ARIA labels
10. Optimize for SEO with proper meta tags and structured data

## Brand Voice
- Friendly and approachable
- Empowering and motivational
- Clear and concise
- Inclusive and welcoming
- Professional yet casual

## Tagline Options
- "Where Squads Unite"
- "Your Squad, Your Space"
- "Better Together"
- "Squad Goals Made Simple"
- "The Home for Every Squad"

Remember: SquadSpace.me is about bringing people together, making collaboration effortless, and celebrating collective achievements. Every feature should reinforce the sense of belonging and shared purpose.