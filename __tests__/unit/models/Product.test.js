const db = require('../../../backend/src/models');
const { Product, Category } = db;

describe('Product Model', () => {
  let testCategory;

  beforeEach(async () => {
    // Clean up before each test
    await Product.destroy({ where: {}, force: true });
    await Category.destroy({ where: {}, force: true });
    
    // Create test category for all tests
    testCategory = await Category.create({
      name: 'Test Category',
      description: 'Test Description'
    });
  });

  it('should create a product with valid data', async () => {
    const productData = {
      name: 'Test Product',
      description: 'Test Description',
      price: 99.99,
      originalPrice: 129.99,
      sku: 'TEST-001',
      brand: 'Test Brand',
      categoryId: testCategory.id,
      inStock: true,
      stockQuantity: 10
    };

    const product = await Product.create(productData);
    expect(product.name).toBe(productData.name);
    expect(product.price).toBe(productData.price);
    expect(product.sku).toBe(productData.sku);
    expect(product.inStock).toBe(true);
    expect(product.stockQuantity).toBe(10);
  });

  it('should not create a product with negative price', async () => {
    const productData = {
      name: 'Test Product',
      price: -10,
      sku: 'TEST-002',
      categoryId: testCategory.id
    };

    await expect(Product.create(productData)).rejects.toThrow();
  });

  it('should not create a product with duplicate SKU', async () => {
    const productData1 = {
      name: 'Test Product 1',
      price: 99.99,
      sku: 'DUPLICATE-SKU',
      categoryId: testCategory.id
    };

    const productData2 = {
      name: 'Test Product 2',
      price: 199.99,
      sku: 'DUPLICATE-SKU',
      categoryId: testCategory.id
    };

    await Product.create(productData1);
    await expect(Product.create(productData2)).rejects.toThrow();
  });

  it('should calculate discount percentage correctly', async () => {
    const product = await Product.create({
      name: 'Discounted Product',
      price: 80,
      originalPrice: 100,
      sku: 'DISC-001',
      categoryId: testCategory.id
    });

    expect(product.discountPercentage).toBe(20);
  });

  it('should return 0 discount when no original price', async () => {
    const product = await Product.create({
      name: 'No Discount Product',
      price: 100,
      sku: 'NODISC-001',
      categoryId: testCategory.id
    });

    expect(product.discountPercentage).toBe(0);
  });

  it('should format price correctly', async () => {
    const product = await Product.create({
      name: 'Price Format Product',
      price: 123.45,
      sku: 'PRICE-001',
      categoryId: testCategory.id
    });

    expect(product.formattedPrice).toBe('123.45 zł');
  });
}); 