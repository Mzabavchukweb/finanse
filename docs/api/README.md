# API Documentation

## Authentication

### POST /api/auth/register
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "StrongPass123!",
  "name": "John Doe",
  "company": "Example Corp",
  "nip": "1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful. Please verify your email."
}
```

### POST /api/auth/login
Login user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "StrongPass123!"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "customer"
  }
}
```

## Products

### GET /api/products
Get all products.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `category`: Filter by category
- `search`: Search term

**Response:**
```json
{
  "products": [
    {
      "id": 1,
      "name": "Product Name",
      "description": "Product Description",
      "price": 99.99,
      "stock": 100
    }
  ],
  "total": 100,
  "page": 1,
  "pages": 10
}
```

## Orders

### POST /api/orders
Create new order.

**Request Body:**
```json
{
  "items": [
    {
      "productId": 1,
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "street": "Example Street",
    "city": "Example City",
    "postalCode": "12345",
    "country": "Poland"
  }
}
```

**Response:**
```json
{
  "orderId": 1,
  "status": "pending",
  "total": 199.98
}
```

## Error Responses

All endpoints may return the following error responses:

```json
{
  "success": false,
  "message": "Error message",
  "errors": [] // Optional validation errors
}
```

Common HTTP Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error 