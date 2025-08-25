# Session Management and Real-time Data Testing Guide

## Overview
This guide provides comprehensive testing steps to verify that user session management and real-time data display work correctly across all scenarios.

## Test Scenarios

### 1. Session Restoration Tests

#### Test 1.1: Login from Home Page
1. Navigate to the home page (`/`)
2. Click "Sign up" or "Log in" button
3. Complete Google OAuth flow
4. **Expected Result**: User should be redirected back to home page with authenticated state
5. **Verify**: User menu appears in header, session is maintained

#### Test 1.2: Login from Momentum Portfolio Page (Unauthenticated)
1. Navigate directly to `/momentum` while logged out
2. Click "Sign In to View All Holdings" button
3. Complete Google OAuth flow
4. **Expected Result**: User should be redirected back to `/momentum` page
5. **Verify**: Full portfolio data loads immediately, real-time indicator shows "Live data connected"

#### Test 1.3: Login from Any Deep Link
1. Navigate to any page (e.g., `/backtest`) while logged out
2. Click any login button
3. Complete Google OAuth flow
4. **Expected Result**: User should be redirected back to the original page
5. **Verify**: User context is restored, appropriate data loads

#### Test 1.4: Session Persistence Across Browser Refresh
1. Log in and navigate to momentum portfolio
2. Refresh the browser page
3. **Expected Result**: User remains logged in, data loads without re-authentication
4. **Verify**: No loading delays, data appears immediately

### 2. Real-time Data Display Tests

#### Test 2.1: Initial Data Load After Login
1. Log in from momentum portfolio page
2. **Expected Result**: Portfolio data loads within 2-3 seconds
3. **Verify**: 
   - Table shows all portfolio holdings
   - Real-time status indicator shows "Live data connected"
   - No error messages appear
   - Loading states are handled gracefully

#### Test 2.2: Data Refresh Functionality
1. Navigate to momentum portfolio while logged in
2. Click the "Refresh" button
3. **Expected Result**: Data refreshes without page reload
4. **Verify**: 
   - Loading spinner appears during refresh
   - Updated timestamp shows in real-time status
   - No duplicate data or UI glitches

#### Test 2.3: Quarter Selection Data Loading
1. On momentum portfolio page, change the quarter selection
2. **Expected Result**: Data updates immediately for selected quarter
3. **Verify**: 
   - Table content changes to match selected quarter
   - Loading state shows briefly
   - Real-time subscription updates for new quarter

#### Test 2.4: Real-time Updates (if applicable)
1. Have portfolio data open in browser
2. If admin access available, make changes to portfolio data
3. **Expected Result**: Changes appear automatically without refresh
4. **Verify**: Real-time indicator remains active

### 3. Error Handling Tests

#### Test 3.1: Network Connection Issues
1. Disconnect internet connection
2. Try to load momentum portfolio
3. Reconnect internet
4. **Expected Result**: 
   - Error message appears when disconnected
   - Data loads automatically when reconnected
   - Retry functionality works

#### Test 3.2: Authentication Failures
1. Attempt login with invalid/expired session
2. **Expected Result**: 
   - Clear error message displayed
   - User prompted to re-authenticate
   - Graceful fallback to login flow

#### Test 3.3: Database Connection Issues
1. Simulate database unavailability (if possible)
2. **Expected Result**: 
   - Appropriate error message shown
   - Retry button available
   - No application crashes

### 4. Cross-Browser and Device Tests

#### Test 4.1: Different Browsers
- Test on Chrome, Firefox, Safari, Edge
- Verify session management works consistently
- Check real-time data display across browsers

#### Test 4.2: Mobile Devices
- Test responsive design on mobile
- Verify touch interactions work
- Check session persistence on mobile browsers

#### Test 4.3: Incognito/Private Mode
- Test login flow in private browsing mode
- Verify session doesn't persist after closing
- Check data loads correctly in private mode

### 5. Performance Tests

#### Test 5.1: Data Loading Speed
1. Measure time from login to data display
2. **Target**: Data should load within 3 seconds
3. **Verify**: No unnecessary API calls or delays

#### Test 5.2: Memory Usage
1. Monitor browser memory usage during extended use
2. **Verify**: No memory leaks from real-time subscriptions
3. **Check**: Proper cleanup when navigating away

## Automated Testing Checklist

### Unit Tests
- [ ] AuthContext session management functions
- [ ] Portfolio data fetching and caching
- [ ] Real-time subscription setup/cleanup
- [ ] Error handling in data services

### Integration Tests
- [ ] Login flow end-to-end
- [ ] Data loading after authentication
- [ ] Real-time updates functionality
- [ ] Session restoration across page refreshes

### Performance Tests
- [ ] Data loading benchmarks
- [ ] Memory usage monitoring
- [ ] Network request optimization

## Common Issues and Solutions

### Issue 1: Data Not Loading After Login
**Symptoms**: User logs in but portfolio data doesn't appear
**Solution**: Check browser console for errors, verify database connection
**Debug Steps**:
1. Open browser developer tools
2. Check Network tab for failed requests
3. Look for authentication errors in Console
4. Verify real-time subscription status

### Issue 2: Session Not Persisting
**Symptoms**: User gets logged out on page refresh
**Solution**: Check localStorage and session storage
**Debug Steps**:
1. Verify auth tokens in browser storage
2. Check Supabase session configuration
3. Ensure proper session restoration in AuthContext

### Issue 3: Real-time Updates Not Working
**Symptoms**: Data doesn't update automatically
**Solution**: Check WebSocket connection and subscriptions
**Debug Steps**:
1. Monitor WebSocket connections in Network tab
2. Verify subscription setup in portfolioService
3. Check for subscription cleanup issues

## Success Criteria

### Session Management
- ✅ User can log in from any page and return to original location
- ✅ Session persists across browser refreshes
- ✅ Proper cleanup on logout
- ✅ Graceful handling of expired sessions

### Real-time Data
- ✅ Data loads immediately after authentication
- ✅ Real-time updates work without page refresh
- ✅ Proper loading states and error handling
- ✅ Efficient data fetching and caching

### User Experience
- ✅ Smooth login flow with clear feedback
- ✅ Fast data loading (< 3 seconds)
- ✅ Responsive design across devices
- ✅ Intuitive error messages and recovery options

## Monitoring and Maintenance

### Regular Checks
- Monitor authentication success rates
- Track data loading performance
- Check real-time subscription health
- Review error logs and user feedback

### Performance Metrics
- Average login time: < 2 seconds
- Data loading time: < 3 seconds
- Session restoration time: < 1 second
- Real-time update latency: < 500ms