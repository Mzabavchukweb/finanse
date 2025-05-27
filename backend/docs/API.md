# Cartechstore B2B API Documentation

## Authentication

### Register User
```http
POST /api/auth/register
```

Request body:
```json
{
  "email": "string",
  "password": "string",
  "firstName": "string",
  "lastName": "string",
  "companyName": "string",
  "companyCountry": "string",
  "nip": "string",
  "phone": "string",
  "address": {
    "street": "string",
    "postalCode": "string",
    "city": "string"
  }
}
```

Response:
```json
{
  "message": "User registered successfully",
  "token": "string",
  "user": {
    "id": "string",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "companyName": "string",
    "role": "string"
  }
}
```

### Login
```http
POST /api/auth/login
```

Request body:
```json
{
  "email": "string",
  "password": "string"
}
```

Response:
```json
{
  "token": "string"
}
```

### Get User Profile
```http
GET /api/auth/profile
```

Headers:
```
Authorization: Bearer <token>
```

Response:
```json
{
  "id": "string",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "companyName": "string",
  "role": "string"
}
```

### Reset Password
```http
POST /api/auth/forgot-password
```

Request body:
```json
{
  "email": "string"
}
```

Response:
```json
{
  "message": "Jeśli email istnieje, wysłaliśmy link do resetu hasła."
}
```

### Set New Password
```http
POST /api/auth/reset-password
```

Request body:
```json
{
  "token": "string",
  "password": "string"
}
```

Response:
```json
{
  "message": "Hasło zostało zmienione. Możesz się zalogować."
}
```

## Two-Factor Authentication

### Generate 2FA Secret
```http
POST /api/auth/2fa/generate
```

Headers:
```
Authorization: Bearer <token>
```

Response:
```json
{
  "secret": "string",
  "qrCode": "string"
}
```

### Enable 2FA
```http
POST /api/auth/2fa/enable
```

Headers:
```
Authorization: Bearer <token>
```

Request body:
```json
{
  "token": "string"
}
```

Response:
```json
{
  "message": "2FA włączone pomyślnie."
}
```

### Disable 2FA
```http
POST /api/auth/2fa/disable
```

Headers:
```
Authorization: Bearer <token>
```

Request body:
```json
{
  "token": "string"
}
```

Response:
```json
{
  "message": "2FA wyłączone pomyślnie."
}
```

### Verify 2FA Token
```http
POST /api/auth/2fa/verify
```

Request body:
```json
{
  "email": "string",
  "token": "string"
}
```

Response:
```json
{
  "message": "Weryfikacja 2FA pomyślna.",
  "token": "string"
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "status": "fail",
  "message": "string"
}
```

### 401 Unauthorized
```json
{
  "status": "fail",
  "message": "Nie jesteś zalogowany. Zaloguj się, aby uzyskać dostęp."
}
```

### 403 Forbidden
```json
{
  "status": "fail",
  "message": "Nie masz uprawnień do wykonania tej akcji."
}
```

### 404 Not Found
```json
{
  "status": "fail",
  "message": "Nie znaleziono zasobu."
}
```

### 500 Internal Server Error
```json
{
  "status": "error",
  "message": "Coś poszło nie tak!"
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- Authentication endpoints: 5 requests per 15 minutes
- Registration: 3 requests per hour
- Password reset: 3 requests per hour
- API endpoints: 100 requests per 15 minutes
- Admin endpoints: 50 requests per 15 minutes

When rate limit is exceeded, the API returns a 429 Too Many Requests response:

```json
{
  "status": "fail",
  "message": "Zbyt wiele requestów. Spróbuj ponownie później."
}
``` 