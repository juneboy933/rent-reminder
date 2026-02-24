# Rent Collector Backend

A backend system for managing tenants, sending automated rent reminders via SMS using Africa's Talking, and tracking payments. Designed for landlords to monitor tenants’ rent schedules and overdue payments.

## Features

- Add tenants with rent amount, due date, and phone number.
- Automated SMS reminders:
  - Upcoming payment
  - Payment due today
  - Overdue notifications
- Manual reminder sending via API.
- SMS logging and tracking (status, timestamp, message ID).
- Tenant status updates (`PENDING`, `OVERDUE`).

## Tech Stack

- **Node.js** – Backend runtime
- **Express.js** – API framework
- **MongoDB** – Database
- **Mongoose** – ODM for MongoDB
- **Africa’s Talking** – SMS API for sending reminders
- **dotenv** – Environment variable management

## Installation

1. Clone the repository:  
   ```bash
    git clone https://github.com/your-username/rent-collector-backend.git
    cd rent-collector-backend

2. Install dependencies
    ```bash
    npm install

3. Create a .env file with the following variables:
     ```env
    MONGODB_URI=your_mongodb_connection_string
    AFRICASTALKING_USERNAME=your_username
    AFRICASTALKING_API_KEY=your_api_key
  
4. Start server
   ```bash
    start server
    or for development with auto-reload:
    npm run dev

## API Endpoints
 # Tenants

# POST /tenants – Add a new tenant
  Body:

  {
      "landlordId": "LANDLORD_ID",
      "phone": "+2547XXXXXXXX",
      "amount": 500,
      "date": "2026-02-25"
  }

# GET /tenants/:landlordId – List all tenants for a landlord

# Reminders

# POST /reminders/manual – Send a manual reminder
  Body:

  {
    "landlordId": "LANDLORD_ID",
    "phone": "+2547XXXXXXXX"
  }
  
# SMS Logs

# GET /sms-logs – Retrieve all SMS logs
  Response:

  {
    "message": "SMS logs fetched successfully",
    "logs": [
      {
        "_id": "SMS_LOG_ID",
        "phone": "+2547XXXXXXXX",
        "message": "Reminder text",
        "messageId": "AfricaTalkingMessageID",
        "status": "SENT",
        "sentAt": "2026-02-24T15:26:59.997Z"
      }
    ]
  }

  
## Project Structure
Backend/
├── config/
│   └── at.config.js         # Africa's Talking config
├── database/
│   └── models/
│       ├── landlord.model.js
│       ├── tenant.model.js
│       └── smsLog.model.js
├── services/
│   ├── createTenant.service.js
│   ├── sendReminder.service.js
│   └── checkPaymentDate.service.js
├── routes/
│   ├── tenants.routes.js
│   ├── reminders.routes.js
│   └── smsLogs.routes.js
├── .env
├── package.json
└── server.js


## Usage Notes

- Ensure phone numbers are in E.164 format (+2547XXXXXXXX).

- Africa’s Talking may reject messages if numbers are invalid or blacklisted.

- SMS logs capture status like SENT, DELIVERED, FAILED, or UserInBlacklist.

- Current tenant statuses: PENDING (not yet paid), OVERDUE (payment overdue).

## Future Enhancements

- Web dashboard for landlords (Next.js + Tailwind).

- USSD menu for landlords without smartphones.

- Payment integration (MPESA) for direct rent collection.

- Analytics dashboard (payment trends, late payment frequency).

License

# MIT License © 2026 Brian Oduor
   

   git clone https://github.com/your-username/rent-collector-backend.git
   cd rent-collector-backend
