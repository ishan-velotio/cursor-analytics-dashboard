# Cursor Analytics Dashboard

A comprehensive analytics dashboard for tracking Cursor IDE team usage, productivity metrics, and AI adoption insights.

## 🚀 Features

- **Real-time Team Analytics** - Live data from Cursor Admin API
- **Member Filtering** - Filter metrics by specific team members  
- **Date Range Selection** - Analyze any time period (up to 90 days)
- **Key Metrics Tracking**:
  - Team activity and engagement rates
  - AI assistance adoption and effectiveness  
  - Code productivity (lines added/deleted)
  - Monthly spending and cost per member
  - Feature usage patterns (Chat, Composer, Agent)
- **Interactive UI** - Modern, responsive design with real-time updates

## 🛠️ Setup

### 1. Prerequisites
- Node.js 18+ installed
- Cursor Admin API key with team admin permissions

### 2. Installation
```bash
# Clone and install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
```

### 3. Configuration
Create a `.env.local` file in the project root:

```env
# Cursor Admin API Configuration
NEXT_PUBLIC_CURSOR_API_KEY=your_cursor_api_key_here
NEXT_PUBLIC_CURSOR_API_BASE_URL=https://api.cursor.com
NODE_ENV=development
```

### 4. Development
```bash
# Start development server
npm run dev

# Open http://localhost:3000
```

## 📊 Dashboard Sections

### Overview
- **Team Members** - Total count and activity rate
- **Monthly Spending** - Team costs and per-member breakdown  
- **Lines of Code** - Total output with AI assistance percentage
- **AI Requests** - Chat, Composer, and Agent interactions
- **AI Acceptance Rate** - Effectiveness of AI suggestions
- **Team Activity** - Member engagement tracking

### Filtering Options
- **Date Range Picker** - Last 7/30/90 days or custom range
- **Team Member Selector** - Filter by specific members
- **Real-time Updates** - Data refreshes automatically

## 🔧 API Integration

The dashboard integrates with Cursor's Admin API endpoints:

- `/teams/members` - Team member list and roles
- `/teams/daily-usage-data` - Productivity and usage metrics  
- `/teams/spend` - Spending and billing information
- `/teams/filtered-usage-events` - Detailed event tracking

## 📱 Responsive Design

- **Desktop** - Full dashboard with side-by-side controls
- **Tablet** - Stacked layout with touch-friendly controls  
- **Mobile** - Optimized for small screens with collapsible sections

## 🚀 Getting Started

1. **Get your Cursor Admin API key** from your team dashboard
2. **Add API key** to `.env.local` file
3. **Start the development server** with `npm run dev`
4. **View your analytics** at `http://localhost:3000`

## 🔒 Security

- API keys stored securely in environment variables
- Client-side data caching with React Query
- No sensitive data logged to console in production
- Secure HTTPS API connections

## 📈 Roadmap

### Phase 1 ✅ (Current)
- [x] Core API integration
- [x] Team member filtering  
- [x] Date range selection
- [x] Overview metrics dashboard
- [x] Responsive UI design

### Phase 2 (Next)
- [ ] Advanced chart visualizations
- [ ] Individual member deep-dive pages
- [ ] Trend analysis and forecasting
- [ ] Export functionality (CSV/JSON)
- [ ] Real-time notifications

### Phase 3 (Future)  
- [ ] Multi-team organization support
- [ ] Custom metric definitions
- [ ] Automated reporting
- [ ] Integration with external tools
- [ ] Advanced analytics and insights

## 🤝 Contributing

This dashboard was built to help teams understand their Cursor usage patterns. Feel free to extend it with additional metrics or visualizations based on your team's needs!

## 📝 License

MIT License - feel free to use and modify for your team's needs.
