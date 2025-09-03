import requests
import sys
from datetime import datetime
import json

class YeyoLabAPITester:
    def __init__(self, base_url="https://saas-launchpad.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session_token = None
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if not endpoint.startswith('http') else endpoint
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
            
        if self.session_token:
            test_headers['Authorization'] = f'Bearer {self.session_token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                except:
                    print(f"   Response: {response.text[:200]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:500]}")

            return success, response.json() if response.text and response.text.strip() else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        return self.run_test("Root API Endpoint", "GET", "", 200)

    def test_email_subscription(self):
        """Test email subscription for document download"""
        test_email = f"test_{datetime.now().strftime('%H%M%S')}@example.com"
        success, response = self.run_test(
            "Email Subscription",
            "POST",
            "email-subscribe",
            200,
            data={"email": test_email}
        )
        return success, response

    def test_booking_creation(self):
        """Test booking creation"""
        booking_data = {
            "name": "Test User",
            "email": f"test_{datetime.now().strftime('%H%M%S')}@example.com",
            "date": "2024-12-25",
            "time": "10:00",
            "message": "Test booking message"
        }
        success, response = self.run_test(
            "Create Booking",
            "POST",
            "bookings",
            200,
            data=booking_data
        )
        return success, response

    def test_get_bookings(self):
        """Test getting all bookings"""
        return self.run_test("Get All Bookings", "GET", "bookings", 200)

    def test_auth_profile_without_token(self):
        """Test auth profile endpoint without token (should fail)"""
        return self.run_test("Auth Profile (No Token)", "GET", "auth/profile", 401)

    def test_register_investor_without_auth(self):
        """Test investor registration without authentication (should fail)"""
        user_data = {
            "name": "Test Investor",
            "email": "investor@example.com",
            "user_type": "investor",
            "company": "Test Company"
        }
        return self.run_test(
            "Register Investor (No Auth)",
            "POST",
            "register/investor",
            401,
            data=user_data
        )

    def test_register_founder_without_auth(self):
        """Test founder registration without authentication (should fail)"""
        user_data = {
            "name": "Test Founder",
            "email": "founder@example.com",
            "user_type": "founder",
            "company": "Test Startup"
        }
        return self.run_test(
            "Register Founder (No Auth)",
            "POST",
            "register/founder",
            401,
            data=user_data
        )

    def test_invalid_endpoints(self):
        """Test some invalid endpoints"""
        print("\n🔍 Testing Invalid Endpoints...")
        
        # Test non-existent endpoint
        self.run_test("Non-existent Endpoint", "GET", "nonexistent", 404)
        
        # Test invalid method
        self.run_test("Invalid Method", "DELETE", "", 405)

def main():
    print("🚀 Starting YEYO LAB API Testing...")
    print("=" * 50)
    
    tester = YeyoLabAPITester()
    
    # Test basic endpoints that don't require authentication
    print("\n📋 TESTING PUBLIC ENDPOINTS")
    print("-" * 30)
    
    tester.test_root_endpoint()
    tester.test_email_subscription()
    tester.test_booking_creation()
    tester.test_get_bookings()
    
    # Test authentication-required endpoints (should fail without auth)
    print("\n🔒 TESTING PROTECTED ENDPOINTS (Should Fail)")
    print("-" * 45)
    
    tester.test_auth_profile_without_token()
    tester.test_register_investor_without_auth()
    tester.test_register_founder_without_auth()
    
    # Test invalid endpoints
    print("\n❌ TESTING INVALID ENDPOINTS")
    print("-" * 30)
    
    tester.test_invalid_endpoints()
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 FINAL RESULTS")
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed - check details above")
        return 1

if __name__ == "__main__":
    sys.exit(main())