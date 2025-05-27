const db = require('../../../backend/src/models');
const { User } = db;

describe('User Model', () => {
  beforeEach(async () => {
    // Clean up before each test
    await User.destroy({ where: {}, force: true });
  });

  it('should create a user with valid data', async () => {
    const userData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'Test123!@#',
      companyName: 'Test Company',
      nip: '1234567890',
      phone: '123456789',
      address: {
        street: 'Test Street',
        city: 'Test City',
        postalCode: '00-000'
      },
      role: 'user',
      status: 'pending_email_verification'
    };

    const user = await User.create(userData);
    expect(user.email).toBe(userData.email);
    expect(user.firstName).toBe(userData.firstName);
    expect(user.lastName).toBe(userData.lastName);
    expect(user.companyName).toBe(userData.companyName);
    expect(user.nip).toBe(userData.nip);
    expect(user.phone).toBe(userData.phone);
    expect(user.role).toBe(userData.role);
    expect(user.status).toBe(userData.status);
    expect(user.isEmailVerified).toBe(false);
  });

  it('should not create a user with invalid email', async () => {
    const userData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'invalid-email',
      password: 'Test123!@#',
      companyName: 'Test Company',
      nip: '1234567890',
      phone: '123456789',
      address: {
        street: 'Test Street',
        city: 'Test City',
        postalCode: '00-000'
      }
    };

    await expect(User.create(userData)).rejects.toThrow();
  });

  it('should hash password before saving', async () => {
    const userData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'Test123!@#',
      companyName: 'Test Company',
      nip: '1234567890',
      phone: '123456789',
      address: {
        street: 'Test Street',
        city: 'Test City',
        postalCode: '00-000'
      }
    };

    const user = await User.create(userData);
    expect(user.password).not.toBe(userData.password);
    expect(user.password).toMatch(/^[\$]2[aby]\$\d+\$/);
  });

  it('should validate password correctly', async () => {
    const user = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'pass@example.com',
      password: 'Secret123!',
    });
    expect(await user.validatePassword('Secret123!')).toBe(true);
    expect(await user.validatePassword('WrongPass')).toBe(false);
  });

  it('should lock and unlock account after failed attempts', async () => {
    const user = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'lock@example.com',
      password: 'Secret123!'
    });
    // Simulate failed attempts
    for (let i = 0; i < 5; i++) {
      await user.incrementFailedLoginAttempts();
    }
    console.log('isAccountLocked after 5 attempts:', user.isAccountLocked());
    await user.resetFailedLoginAttempts();
    console.log('isAccountLocked after reset:', user.isAccountLocked());
    expect(user.failedLoginAttempts).toBe(0);
  });

  it('should generate a verification token and expiry', async () => {
    const user = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'verify@example.com',
      password: 'Secret123!'
    });
    const token = user.generateVerificationToken();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
    expect(user.emailVerificationToken).toBe(token);
    expect(user.emailVerificationExpires).toBeInstanceOf(Date);
  });

  it('should return correct fullName and formattedPhone', async () => {
    const user = await User.create({
      firstName: 'Anna',
      lastName: 'Kowalska',
      email: 'anna@example.com',
      password: 'Secret123!',
      phone: '123456789'
    });
    expect(user.fullName).toBe('Anna Kowalska');
    expect(user.formattedPhone).toBe('123-456-789');
  });
}); 