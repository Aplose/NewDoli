# NewDoli

A modern Progressive Web Application (PWA) designed to modernize the Dolibarr ERP interface. NewDoli can be integrated as a Dolibarr module or served as a standalone application, providing an enhanced user experience with offline capabilities and local caching.

## 🚀 Features

### Core Functionality
- **Modern UI/UX**: Clean, responsive interface built with Angular 20
- **PWA Support**: Offline capabilities and local data caching using Dexie
- **Dual Deployment**: Can be integrated as a Dolibarr module or run standalone
- **Progressive Enhancement**: Works seamlessly across all devices and browsers

### Planned Features
- **Authentication System**: Secure login with session management
- **Permission Management**: User, group, and permission management with Angular guards
- **Third-Party Management**: Comprehensive third-party management on a single screen
- **Field Visibility Control**: Global and user-specific field hiding capabilities
- **Offline Support**: Full offline functionality with data synchronization
- **Local Caching**: Efficient data storage and retrieval using Dexie

## 🛠️ Technology Stack

- **Frontend Framework**: Angular 20 with TypeScript
- **Styling**: SCSS for modern styling capabilities
- **PWA**: Service Workers and Web App Manifest
- **Local Database**: Dexie for IndexedDB management
- **Build Tool**: Angular CLI with modern build configuration
- **Testing**: Jasmine and Karma for unit testing

## 📋 Prerequisites

- Node.js (version 18 or higher)
- npm (version 9 or higher)
- Angular CLI (version 20 or higher)

## 🚀 Getting Started

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/NewDoli.git
cd NewDoli
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:4200/`.

### Building for Production

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

### Running Tests

```bash
npm test
```

## 📱 PWA Configuration

NewDoli is configured as a Progressive Web Application with:
- Service Worker for offline functionality
- Web App Manifest for installability
- Responsive design for mobile and desktop
- Local data caching with Dexie

## 🔧 Development

### Project Structure

```
src/
├── app/
│   ├── components/          # Reusable UI components
│   ├── services/           # Business logic and API services
│   ├── guards/             # Route guards for authentication
│   ├── models/             # TypeScript interfaces and models
│   ├── pages/              # Main application pages
│   └── shared/             # Shared utilities and constants
├── assets/                 # Static assets
└── styles/                 # Global styles and themes
```

### Key Development Areas

1. **Authentication & Authorization**
   - Login/logout functionality
   - JWT token management
   - Role-based access control
   - Angular route guards

2. **Data Management**
   - Dexie integration for local storage
   - API service layer
   - Data synchronization
   - Offline data handling

3. **User Interface**
   - Modern component library
   - Responsive design system
   - Accessibility compliance
   - Theme customization

## 🔌 Dolibarr Integration

NewDoli can be integrated with Dolibarr in two ways:

### As a Module
- Install as a standard Dolibarr module
- Access through Dolibarr's module management
- Share authentication and permissions

### Standalone
- Deploy independently
- Configure API endpoints for Dolibarr backend
- Maintain separate authentication if needed

## 🤝 Contributing

We welcome contributions to NewDoli! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow Angular style guide
- Write unit tests for new features
- Ensure accessibility compliance
- Test PWA functionality
- Document new features

## 📄 License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## 🐛 Bug Reports

If you find a bug, please create an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Browser/device information

## 🚀 Roadmap

### Phase 1: Core Foundation
- [x] Project setup and configuration
- [ ] Authentication system
- [ ] Basic routing and navigation
- [ ] PWA configuration

### Phase 2: User Management
- [ ] User management interface
- [ ] Group and permission system
- [ ] Role-based access control
- [ ] Angular guards implementation

### Phase 3: Data Management
- [ ] Third-party management
- [ ] Dexie integration
- [ ] Offline data synchronization
- [ ] Field visibility controls

### Phase 4: Advanced Features
- [ ] Advanced search and filtering
- [ ] Data export/import
- [ ] Customizable dashboards
- [ ] Mobile app optimization

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review existing discussions

## 🙏 Acknowledgments

- Dolibarr community for inspiration and API compatibility
- Angular team for the excellent framework
- Dexie team for the powerful IndexedDB wrapper
- All contributors who help make NewDoli better

---

**NewDoli** - Modernizing Dolibarr for the future of ERP management.