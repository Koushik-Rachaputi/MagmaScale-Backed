import requests
import json
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def log(message, data=None):
    if data:
        logger.info(f"{message}: {json.dumps(data, indent=2)}")
    else:
        logger.info(message)

def submit_form(url, form_data):
    try:
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        log("Submitting form", form_data)
        response = requests.post(url, json=form_data, headers=headers, timeout=10)
        log("POST /form response", {
            "status_code": response.status_code,
            "body": response.json() if response.headers.get("Content-Type", "").startswith("application/json") else response.text
        })
        return response
    except Exception as e:
        log("Error submitting form", {"error": str(e)})

def get_forms(url, fields=None):
    try:
        params = {}
        if fields:
            params['fields'] = fields
        log(f"Fetching forms (fields={fields})")
        response = requests.get(url, params=params, timeout=10)
        log("GET /form response", {
            "status_code": response.status_code,
            "body": response.json() if response.headers.get("Content-Type", "").startswith("application/json") else response.text
        })
        return response
    except Exception as e:
        log("Error fetching forms", {"error": str(e)})

if __name__ == "__main__":
    base_url = "http://localhost:3000/form"

    # 1. Submit a new form
    form_data = {
        "role": "Founder",
        "fullName": "Jane Doe",
        "phoneNumber": "+1234567890",
        "emailAddress": "jane@example.com",
        "country": "United States",
        "city": "San Francisco",
        "startupName": "InnovateX",
        "websiteURL": "https://innovatex.com",
        "currentState": "Growth",
        "lookingFor": "Investment",
        "companyLinkedIn": "https://linkedin.com/company/innovatex",
        "foundersLinkedIn": "https://linkedin.com/in/janedoe",
        "industry": "AI",
        "problemSolved": "Automating workflows",
        "startupDescription": "AI-powered workflow automation.",
        "targetMarket": "Enterprise",
        "numberOfCustomers": 200,
        "revenueCurrency": "USD",
        "revenueAmount": 150000,
        "raisedFunding": "true",
        "fundingCurrency": "USD",
        "fundingAmount": 500000,
        "heardFrom": "Conference",
        "additionalInfo": "Excited to join!"
    }
    submit_form(base_url, form_data)

    # 2. Fetch all forms
    get_forms(base_url)

    # 3. Fetch specific fields
    get_forms(base_url, fields="fullName,emailAddress,startupName")