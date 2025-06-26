const db = require('../../../backend/src/models');
const { Order, User, OrderItem, Product } = db;

describe('Order Model', () => {
  let testUser;

  beforeEach(async () => {
    // Clean up before each test
    await OrderItem.destroy({ where: {}, force: true });
    await Order.destroy({ where: {}, force: true });
    await Product.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });

    // Create test user
    testUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'Test123!@#',
      companyName: 'Test Company',
      nip: '1234567890'
    });
  });

  it('should create an order with valid data', async () => {
    const orderData = {
      userId: testUser.id,
      totalAmount: 299.99,
      status: 'pending',
      paymentMethod: 'credit_card',
      shippingMethod: 'standard',
      shippingAddress: {
        street: 'Test Street 123',
        city: 'Test City',
        postalCode: '00-000',
        country: 'Poland'
      },
      billingAddress: {
        street: 'Test Street 123',
        city: 'Test City',
        postalCode: '00-000',
        country: 'Poland'
      }
    };

    const order = await Order.create(orderData);
    expect(order.userId).toBe(testUser.id);
    expect(order.totalAmount).toBe(299.99);
    expect(order.status).toBe('pending');
    expect(order.paymentMethod).toBe('credit_card');
    expect(order.shippingMethod).toBe('standard');
    expect(order.orderNumber).toBeDefined();
    expect(order.orderNumber).toMatch(/^ORD-/);
  });

  it('should not create an order with negative total amount', async () => {
    const orderData = {
      userId: testUser.id,
      totalAmount: -100,
      status: 'pending',
      paymentMethod: 'credit_card',
      shippingMethod: 'standard',
      shippingAddress: {
        street: 'Test Street 123',
        city: 'Test City',
        postalCode: '00-000',
        country: 'Poland'
      },
      billingAddress: {
        street: 'Test Street 123',
        city: 'Test City',
        postalCode: '00-000',
        country: 'Poland'
      }
    };

    await expect(Order.create(orderData)).rejects.toThrow();
  });

  it('should calculate total amount from order items', async () => {
    // First create a test category for products
    const Category = db.Category;
    const testCategory = await Category.create({
      name: 'Test Category',
      description: 'Test category for products'
    });

    const product1 = await Product.create({
      name: 'Product 1',
      price: 50,
      sku: 'PROD-001',
      categoryId: testCategory.id
    });

    const product2 = await Product.create({
      name: 'Product 2',
      price: 30,
      sku: 'PROD-002',
      categoryId: testCategory.id
    });

    const order = await Order.create({
      userId: testUser.id,
      totalAmount: 0, // Will be calculated
      status: 'pending',
      paymentMethod: 'credit_card',
      shippingMethod: 'standard',
      shippingAddress: {
        street: 'Test Street 123',
        city: 'Test City',
        postalCode: '00-000',
        country: 'Poland'
      },
      billingAddress: {
        street: 'Test Street 123',
        city: 'Test City',
        postalCode: '00-000',
        country: 'Poland'
      }
    });

    await OrderItem.create({
      orderId: order.id,
      productId: product1.id,
      quantity: 2,
      price: 50,
      total: 100,
      productName: product1.name,
      productSku: product1.sku
    });

    await OrderItem.create({
      orderId: order.id,
      productId: product2.id,
      quantity: 1,
      price: 30,
      total: 30,
      productName: product2.name,
      productSku: product2.sku
    });

    const calculatedTotal = await order.calculateTotal();
    expect(calculatedTotal).toBe(130); // (50 * 2) + (30 * 1)
  });

  it('should transition order status correctly', async () => {
    const order = await Order.create({
      userId: testUser.id,
      totalAmount: 100,
      status: 'pending',
      paymentMethod: 'credit_card',
      shippingMethod: 'standard',
      shippingAddress: {
        street: 'Test Street 123',
        city: 'Test City',
        postalCode: '00-000',
        country: 'Poland'
      },
      billingAddress: {
        street: 'Test Street 123',
        city: 'Test City',
        postalCode: '00-000',
        country: 'Poland'
      }
    });

    expect(order.canTransitionTo('confirmed')).toBe(true);
    expect(order.canTransitionTo('shipped')).toBe(false);

    await order.updateStatus('confirmed');
    expect(order.status).toBe('confirmed');
    expect(order.canTransitionTo('shipped')).toBe(true);
  });

  it('should format order date correctly', async () => {
    const order = await Order.create({
      userId: testUser.id,
      totalAmount: 100,
      status: 'pending',
      paymentMethod: 'credit_card',
      shippingMethod: 'standard',
      shippingAddress: {
        street: 'Test Street 123',
        city: 'Test City',
        postalCode: '00-000',
        country: 'Poland'
      },
      billingAddress: {
        street: 'Test Street 123',
        city: 'Test City',
        postalCode: '00-000',
        country: 'Poland'
      }
    });

    expect(order.formattedCreatedAt).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });
}); 