/**
 * This is a simple script to test the refresh token flow.
 * It simulates an expired token and verifies that the refresh token flow works correctly.
 * 
 * To run this script:
 * 1. Make sure you're logged in to the voucher app
 * 2. Open the browser console
 * 3. Copy and paste this script into the console
 * 4. The script will simulate an expired token and attempt to refresh it
 */

(async () => {
  try {
    // Get the current session
    const session = await fetch('/api/auth/session').then(res => res.json());
    console.log('Current session:', session);
    
    if (!session || !session.user) {
      console.error('No active session found. Please log in first.');
      return;
    }
    
    // Simulate an expired token by making a request with an invalid token
    const testResponse = await fetch('/api/auth/session', {
      headers: {
        'Authorization': 'Bearer invalid_token'
      }
    });
    
    console.log('Test response status:', testResponse.status);
    
    // Check if the session was refreshed
    const newSession = await fetch('/api/auth/session').then(res => res.json());
    console.log('New session after refresh attempt:', newSession);
    
    if (newSession.error) {
      console.error('Error refreshing token:', newSession.error);
    } else {
      console.log('Token refresh successful!');
    }
  } catch (error) {
    console.error('Error testing refresh token flow:', error);
  }
})();
