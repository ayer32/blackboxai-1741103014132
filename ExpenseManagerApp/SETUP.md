# Expense Manager App - Setup Guide

## Prerequisites

1. Node.js and npm installed
2. React Native development environment set up
3. Firebase account and project created

## Installation

1. Install required dependencies:
```bash
npm install @react-native-community/netinfo
npm install expo-sqlite
npm install firebase
npm install rxjs
```

2. Install development dependencies:
```bash
npm install --save-dev @types/websql
npm install --save-dev @firebase/firestore-types
```

## Firebase Configuration

1. Create a `.env` file in the project root:
```env
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_auth_domain
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
FIREBASE_APP_ID=your_app_id
```

2. Update `firebaseConfig.js` with your Firebase credentials:
```javascript
import Constants from 'expo-constants';

export const firebaseConfig = {
  apiKey: Constants.expoConfig.extra.FIREBASE_API_KEY,
  authDomain: Constants.expoConfig.extra.FIREBASE_AUTH_DOMAIN,
  projectId: Constants.expoConfig.extra.FIREBASE_PROJECT_ID,
  storageBucket: Constants.expoConfig.extra.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: Constants.expoConfig.extra.FIREBASE_MESSAGING_SENDER_ID,
  appId: Constants.expoConfig.extra.FIREBASE_APP_ID,
};
```

## Project Structure

```
frontend/
├── services/
│   ├── firebase/          # Firebase services
│   ├── storage/           # Storage implementations
│   └── sync/             # Sync functionality
├── contexts/             # React contexts
├── hooks/               # Custom hooks
└── components/          # UI components
```

## Implementation Steps

1. **Initialize Firebase**
   - Set up Firebase project
   - Enable Firestore
   - Configure authentication
   - Add security rules

2. **Configure Storage**
   - SQLite for mobile
   - IndexedDB for web
   - Test storage operations

3. **Set up Sync Service**
   - Configure network monitoring
   - Implement sync logic
   - Set up error handling

4. **Add UI Components**
   - Sync status indicators
   - Offline mode notifications
   - Data management controls

## Testing

1. **Offline Mode**
   - Disable network connection
   - Make changes to data
   - Verify local storage
   - Re-enable network
   - Verify sync completion

2. **Network Transitions**
   - Test switching between online/offline
   - Verify sync triggers
   - Check error handling

3. **Data Consistency**
   - Compare local and cloud data
   - Verify timestamps
   - Check conflict resolution

## Common Issues

1. **Firebase Configuration**
   - Ensure all environment variables are set
   - Check Firebase console for errors
   - Verify security rules

2. **Storage Issues**
   - Check storage permissions
   - Verify database initialization
   - Monitor storage usage

3. **Sync Problems**
   - Check network connectivity
   - Verify Firebase rules
   - Monitor sync logs

## Best Practices

1. **Error Handling**
   - Implement proper error boundaries
   - Log errors appropriately
   - Show user-friendly messages

2. **Performance**
   - Use batch operations
   - Implement proper caching
   - Monitor sync frequency

3. **Security**
   - Secure Firebase rules
   - Encrypt sensitive data
   - Implement proper authentication

## Deployment

1. **Production Environment**
   - Update Firebase configuration
   - Set up production database
   - Configure security rules

2. **Testing**
   - Run full test suite
   - Verify all features
   - Check performance

3. **Monitoring**
   - Set up error tracking
   - Monitor sync status
   - Track usage metrics

## Support

For issues and questions:
- Check Firebase documentation
- Review React Native docs
- Consult project README
- Open GitHub issues

## Updates

Keep dependencies updated:
```bash
npm update @react-native-community/netinfo
npm update expo-sqlite
npm update firebase
npm update rxjs
```

## License

This project is licensed under the MIT License.
