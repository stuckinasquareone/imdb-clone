# Age-Gated Content Flow (18+ Movies)

## Overview

The age-gated content system implements a secure, persistent age verification mechanism for adult content (18+ movies). The verification state persists across browser sessions using localStorage with token-based validation.

## Architecture

### Components

1. **`AgeGatedContent.js`** - Wrapper component that controls content visibility
   - Shows blocked content UI if not verified
   - Renders modal trigger button
   - Passes through children if verified

2. **`AgeVerificationModal.js`** - Modal dialog for age verification
   - Accepts user birthdate input
   - Validates date range (100 years back to today)
   - Displays clear warnings and legal disclaimer
   - Provides user feedback (error messages, loading states)

3. **`useAgeVerification.js`** - Custom React hook managing verification state
   - Persists verification across sessions using localStorage
   - Token-based validation with 1-year expiry
   - Public methods: `verifyAge()`, `clearVerification()`, `getTimeUntilExpiry()`

### Data Layer

**`moviesDatabase.js`** - Movie metadata and utility functions
- `MOVIES_DATABASE` - Movie catalog with `isAdultContent` flag
- `isAdultContent(movieId)` - Check if movie is 18+
- `getMoviesByContentType(adultOnly)` - Filter by content rating

**Currently Marked as Adult Content (18+):**
- The Godfather (movie_godfather)
- Pulp Fiction (movie_pulp_fiction)

## How It Works

### User Flow

1. **Initial Load**: User selects a movie
2. **Content Check**: `MovieWatchProgress` checks if movie is adult content
3. **Verification**: If adult content and user not verified, show `AgeGatedContent` blocked UI
4. **Modal Trigger**: User clicks "Verify Age to Unlock" button
5. **Birthdate Entry**: User enters birthdate in modal
6. **Validation**: Hook calculates age and validates
7. **Token Generation**: On success, generates and stores verification token
8. **Access Granted**: User can now access adult content

### Persistent Storage

The verification state is stored in `localStorage` using:

```javascript
// Storage key
'age_verification_state' → Base64-encoded token

// Token format (simplified)
btoa(`${timestamp}:${salt}`) → Obfuscated verification marker
```

**Characteristics:**
- ✅ Persists across page reloads and sessions
- ✅ Auto-expires after 1 year
- ✅ Token format validation prevents tampering
- ✅ Cleared when user clicks "logout" or explicitly clears verification

### Security Considerations

⚠️ **Important**: This is a **client-side verification system** intended for:
- UX/content flow demonstration
- Age-appropriate content gating
- Legal compliance signaling

**NOT suitable for:**
- Protecting highly sensitive content
- Financial transactions
- Identity verification

### Token Validation

```javascript
// Token structure after validation:
{
  isValid: boolean,      // Is token format/expiry valid?
  age: number           // Age in milliseconds since token generation
}
```

If token is invalid or expired, user must re-verify.

## Integration with MovieWatchProgress

```jsx
// In MovieWatchProgress.js
const { isVerified, verifyAge } = useAgeVerification();
const requiresAgeGate = isAdultContent(movieId);

// Wrap content with gating
<AgeGatedContent
  isVerified={!requiresAgeGate || isVerified}
  onVerify={verifyAge}
  title={movieTitle}
  description="This movie contains adult content..."
>
  {/* Movie player UI */}
</AgeGatedContent>
```

## API Reference

### `useAgeVerification()` Hook

```javascript
const {
  isVerified,           // boolean - Is user age verified?
  isLoading,            // boolean - Are we loading stored state?
  verifyAge,            // fn(birthDate) → Promise<result>
  clearVerification,    // fn() → void
  getTimeUntilExpiry,   // fn() → number (days remaining)
} = useAgeVerification();
```

#### `verifyAge(birthDate: Date) → Promise`

```javascript
const result = await verifyAge(birthDate);
// {
//   success: boolean,
//   age: number,
//   message: string
// }
```

### `AgeGatedContent` Component

```jsx
<AgeGatedContent
  isVerified={boolean}           // Required: current verification state
  onVerify={fn}                  // Required: callback from useAgeVerification
  title={string}                 // Optional: content title (default: "Adult Content")
  description={string}           // Optional: blocked reason (default generic)
  children={ReactNode}           // Required: content to gate
/>
```

### `moviesDatabase.js` Utilities

```javascript
// Check if movie is adult content
isAdultContent(movieId: string) → boolean

// Get all movies of a type
getMoviesByContentType(adultOnly: boolean) → Movie[]

// Get movie metadata
getMovieMetadata(movieId: string) → Movie | null

// Get all movies
getAllMovies() → Movie[]
```

## Styling

### CSS Classes

| Component | Class | Purpose |
|-----------|-------|---------|
| Blocked Content | `.agc-blocked` | Dark overlay with lock icon |
| Modal Overlay | `.avm-overlay` | Semi-transparent backdrop |
| Modal | `.avm-modal` | Centered dialog box |
| Input | `.avm-input` | Date input field |
| Status | `.avm-status` | Verification status indicator |

All components use responsive design and support dark/light color schemes.

## Testing

### Unit Tests

```bash
# Run all tests
npm test

# Test age verification hook
npm test -- useAgeVerification.test.js

# Test movie database
npm test -- moviesDatabase.test.js

# Test URL validator (bonus feature)
npm test -- URLValidator.test.js
```

### What's Tested

✅ Age calculation (leap years, month/day boundaries)
✅ Token generation and expiry
✅ Persistent storage across sessions
✅ Movie metadata accuracy
✅ Content type filtering

## User Experience Enhancements

1. **Clear Messaging** - Block screen explains why content is restricted
2. **Simple Input** - Native date picker for easy birthdate entry
3. **Inline Validation** - Real-time error messages in modal
4. **Accessibility** - ARIA labels, focus management, semantic HTML
5. **Visual Feedback** - Animations, loading states, success messages
6. **Legal Protection** - Warnings and disclaimers

## Browser Compatibility

- ✅ Modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ Mobile browsers (iOS Safari, Chrome Android)
- ⚠️ localStorage required
- ⚠️ Date input fallback to text input on older browsers

## Future Enhancements

- [ ] Backend verification for production use
- [ ] COPPA compliance for under-13 content
- [ ] Region-based age restrictions
- [ ] Parental controls integration
- [ ] Session timeout for shared devices

## Examples

### Verifying Age

```javascript
// In a component
const { isVerified, verifyAge } = useAgeVerification();

const handleAgeVerify = async (birthDate) => {
  const result = await verifyAge(birthDate);
  
  if (result.success) {
    console.log(`✅ User is ${result.age} years old`);
    // Content now accessible
  } else {
    console.log(`❌ ${result.message}`);
    // Show error to user
  }
};
```

### Checking Expiry

```javascript
const { getTimeUntilExpiry } = useAgeVerification();

const daysRemaining = getTimeUntilExpiry();
if (daysRemaining && daysRemaining < 30) {
  console.warn(`Verification expires in ${daysRemaining} days`);
}
```

### Clearing Verification

```javascript
const { clearVerification } = useAgeVerification();

// On logout
const handleLogout = () => {
  clearVerification();
  // User will need to re-verify on next adult content access
};
```

## Production Checklist

Before deploying to production:

- [ ] Replace client-side verification with backend API
- [ ] Implement secure session management
- [ ] Add logging for compliance audit trails
- [ ] Implement rate limiting on verification attempts
- [ ] Add GDPR/privacy policy notice
- [ ] Test on all target browsers
- [ ] Implement proper error handling
- [ ] Add analytics for verification success/failure rates
