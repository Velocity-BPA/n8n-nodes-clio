# n8n-nodes-clio

> [Velocity BPA Licensing Notice]
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

A comprehensive n8n community node for Clio, the leading cloud-based legal practice management software used by over 150,000 legal professionals. This node provides full integration with Clio's API v4 for managing matters, contacts, time tracking, billing, documents, tasks, calendar, and trust accounting.

![n8n](https://img.shields.io/badge/n8n-community--node-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![License](https://img.shields.io/badge/license-BSL--1.1-blue)

## Features

- **16 Resource Categories** - Complete coverage of Clio's API
- **70+ Operations** - Full CRUD and specialized operations
- **OAuth 2.0 Authentication** - Secure authorization flow
- **Multi-Region Support** - US, EU, CA, and AU data centers
- **Webhook Triggers** - Real-time event notifications
- **Trust Accounting** - IOLTA/client trust management
- **Document Management** - Upload, download, and organize files
- **Time & Billing** - Track time and generate invoices

## Installation

### Community Nodes (Recommended)

1. Open n8n
2. Go to **Settings** > **Community Nodes**
3. Click **Install a community node**
4. Enter `n8n-nodes-clio`
5. Click **Install**

### Manual Installation

```bash
cd ~/.n8n
npm install n8n-nodes-clio
```

### Development Installation

```bash
git clone https://github.com/Velocity-BPA/n8n-nodes-clio.git
cd n8n-nodes-clio
npm install
npm run build
mkdir -p ~/.n8n/custom
ln -s $(pwd) ~/.n8n/custom/n8n-nodes-clio
n8n start
```

## Credentials Setup

### Creating a Clio OAuth Application

1. Log in to your Clio account
2. Navigate to **Settings** > **API** > **Applications**
3. Click **Add Application**
4. Fill in the application details:
   - **Name**: Your application name
   - **Site URL**: Your website URL
   - **Redirect URI**: `https://your-n8n-instance/rest/oauth2-credential/callback`
5. Save and note the **Client ID** and **Client Secret**

### n8n Credential Configuration

| Field | Description |
|-------|-------------|
| Client ID | OAuth 2.0 Client ID from Clio |
| Client Secret | OAuth 2.0 Client Secret from Clio |
| Region | Your Clio data center (US, EU, CA, AU) |

## Resources & Operations

| Resource | Operations |
|----------|------------|
| Matter | List, Get, Create, Update, Delete, Close, Reopen |
| Contact | List, Get, Create, Update, Delete |
| Activity | List, Get, Create, Update, Delete |
| Bill | List, Get, Create, Update, Delete, Record Payment |
| Expense | List, Get, Create, Update, Delete |
| Task | List, Get, Create, Update, Delete, Complete |
| Calendar Entry | List, Get, Create, Update, Delete |
| Document | List, Get, Upload, Delete, Download |
| Note | List, Get, Create, Update, Delete |
| Communication | List, Get, Create, Update, Delete |
| Trust Account | List, Get, Get Balance, List Transactions, Create Transaction |
| User | List, Get, Get Current User, Get Rates |
| Practice Area | List, Get, Create, Update |
| Custom Field | List, Get, Get Values, Set Values |
| Report | Productivity, Billing, Collections, Timekeeper, Matter |
| Webhook | List, Create, Delete, Get Events |

## Trigger Node

The **Clio Trigger** node receives real-time webhook notifications for:

- Matter created/updated/closed
- Contact created/updated
- Activity (time entry) created
- Bill created/sent
- Payment received
- Task created/completed
- Document uploaded
- Calendar entry created

## Usage Examples

### Create a Matter

```javascript
{
  "resource": "matters",
  "operation": "createMatter",
  "displayNumber": "2024-001",
  "description": "Personal Injury - Smith v. Jones",
  "clientId": 12345
}
```

### Log Time Entry

```javascript
{
  "resource": "activities",
  "operation": "createActivity",
  "matterId": 12345,
  "quantity": 1.5,
  "price": 350.00
}
```

## Clio Concepts

| Concept | Description |
|---------|-------------|
| Matter | A legal case or project |
| Contact | Client, opposing counsel, expert, etc. |
| Activity | Billable or non-billable time entry |
| Bill | Invoice for client |
| Trust Account | IOLTA/client trust account |

## Error Handling

| Error Code | Description |
|------------|-------------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Invalid/expired token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 429 | Rate Limited - Too many requests |

## Development

```bash
npm run lint        # Run linting
npm run lint:fix    # Fix linting issues
npm test            # Run tests
npm run build       # Build the project
npm run dev         # Watch mode
```

## Author

**Velocity BPA**
- Website: [velobpa.com](https://velobpa.com)
- GitHub: [Velocity-BPA](https://github.com/Velocity-BPA)

## Licensing

This n8n community node is licensed under the **Business Source License 1.1**.

### Free Use
Permitted for personal, educational, research, and internal business use.

### Commercial Use
Use of this node within any SaaS, PaaS, hosted platform, managed service, or paid automation offering requires a commercial license.

For licensing inquiries: **licensing@velobpa.com**

See [LICENSE](LICENSE), [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md), and [LICENSING_FAQ.md](LICENSING_FAQ.md) for details.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

- **Issues**: [GitHub Issues](https://github.com/Velocity-BPA/n8n-nodes-clio/issues)
- **Documentation**: [Clio API Docs](https://app.clio.com/api/v4/documentation)
- **Email**: support@velobpa.com

## Acknowledgments

- [Clio](https://www.clio.com/) for their comprehensive legal practice management platform
- [n8n](https://n8n.io/) for the workflow automation framework
