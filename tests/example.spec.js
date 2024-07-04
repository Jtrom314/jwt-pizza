import { test, expect } from 'playwright-test-coverage';

test('purchase with login', async ({ page }) => {
  await page.route('*/**/api/menu', async (route) => {
    const menuRes = [
      { id: 1, title: 'Veggie', image: 'pizza1.png', price: 0.0038, description: 'A garden of delight' },
      { id: 2, title: 'Pepperoni', image: 'pizza2.png', price: 0.0042, description: 'Spicy treat' },
    ];
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: menuRes });
  });

  await page.route('*/**/api/order/franchise', async (route) => {
    const franchiseRes = [
      {
        id: 2,
        name: 'LotaPizza',
        stores: [
          { id: 4, name: 'Lehi' },
          { id: 5, name: 'Springville' },
          { id: 6, name: 'American Fork' },
        ],
      },
      { id: 3, name: 'PizzaCorp', stores: [{ id: 7, name: 'Spanish Fork' }] },
      { id: 4, name: 'topSpot', stores: [] },
    ];
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: franchiseRes });
  });

  await page.route('*/**/api/auth', async (route) => {
    const loginReq = { email: 'd@jwt.com', password: 'a' };
    const loginRes = { id: 3, name: 'Kai Chen', email: 'd@jwt.com', roles: [{ role: 'diner' }] };
    expect(route.request().method()).toBe('PUT');
    expect(route.request().postDataJSON()).toMatchObject(loginReq);
    await route.fulfill({ json: loginRes });
  });

  await page.route('*/**/api/order', async (route) => {
    const orderReq = {
      items: [
        { menuId: 1, description: 'Veggie', price: 0.0038 },
        { menuId: 2, description: 'Pepperoni', price: 0.0042 },
      ],
      storeId: '1',
      franchiseId: 1,
    };
    const orderRes = {
      order: {
        items: [
          { menuId: 1, description: 'Veggie', price: 0.0038 },
          { menuId: 2, description: 'Pepperoni', price: 0.0042 },
        ],
        storeId: '1',
        franchiseId: 1,
        id: 23,
      },
      jwt: 'eyJpYXQ',
    };
    expect(route.request().method()).toBe('POST');
    expect(route.request().postDataJSON()).toMatchObject(orderReq);
    await route.fulfill({ json: orderRes });
  });

  await page.goto('http://localhost:5173/');

  // Go to order page
  await page.getByRole('button', { name: 'Order now' }).click();

  // Create order
  await expect(page.locator('h2')).toContainText('Awesome is a click away');
  await page.getByRole('combobox').selectOption('1');
  await page.getByRole('link', { name: 'Image Description Veggie A' }).click();
  await page.getByRole('link', { name: 'Image Description Pepperoni' }).click();
  await expect(page.locator('form')).toContainText('Selected pizzas: 2');
  await page.getByRole('button', { name: 'Checkout' }).click();

  // Login
  await page.getByPlaceholder('Email address').click();
  await page.getByPlaceholder('Email address').fill('d@jwt.com');
  await page.getByPlaceholder('Email address').press('Tab');
  await page.getByPlaceholder('Password').fill('a');
  await page.getByRole('button', { name: 'Login' }).click();

  // Pay
  await expect(page.getByRole('main')).toContainText('Send me those 2 pizzas right now!');
  await expect(page.locator('tbody')).toContainText('Veggie');
  await page.getByRole('button', { name: 'Pay now' }).click();

  // Check balance
  await expect(page.getByText('0.008')).toBeVisible();
});

test('register a new user', async ({ page }) => {
  await page.route('*/**/api/auth', async (route) => {
    const userReq = {
      name: 'user',
      password: 'a',
      email: 'a@jwt.org'
    }
    const registerRes = {}
    expect(route.request().method()).toBe('POST');
    expect(route.request().postDataJSON()).toMatchObject(userReq)
    await route.fulfill({ json: registerRes });
  });

  await page.goto('http://localhost:5173/')

  // Go to register page
  await page.getByRole('link', { name: 'Register' }).click()

  // fill in register infomration

  await page.getByPlaceholder('Full name').click()
  await page.getByPlaceholder('Full name').fill('user')
  await page.getByPlaceholder('Full name').press('Tab')

  await page.getByPlaceholder('Email address').click()
  await page.getByPlaceholder('Email address').fill('a@jwt.org')
  await page.getByPlaceholder('Email address').press('Tab')

  await page.getByPlaceholder('Password').click()
  await page.getByPlaceholder('Password').fill('a')
  await page.getByPlaceholder('Password').press('Tab')

  await page.getByRole('button', { name: 'Register' }).click()
})

// test('admin dashboard works correctly', async ({ page }) => {

//   await page.route('*/**/api/auth', async (route) => {
//     const loginReq = { email: 'd@jwt.com', password: 'a' };
//     const loginRes = { id: 3, name: 'Kai Chen', email: 'd@jwt.com', roles: [{ role: 'admin' }] };
//     expect(route.request().method()).toBe('PUT');
//     expect(route.request().postDataJSON()).toMatchObject(loginReq);
//     await route.fulfill({ json: loginRes });
//   });

//   await page.goto('http://localhost:5173')
// })

test('docs work correctly', async ({ page }) => {
  await page.route('*/**/api/docs', async (route) => {
    expect(route.request().method()).toBe('GET')
  })

  await page.goto('http://localhost:5173/docs')
})

test('about page loads correctly', async ({ page }) => {
  await page.goto('http://localhost:5173/about');
  await page.getByText('The secret sauce')
  await page.getByRole('main').getByRole('img').first()
  await page.locator('div').filter({ hasText: /^James$/ }).getByRole('img')
  await page.locator('div').filter({ hasText: /^Maria$/ }).getByRole('img')
  await page.locator('div').filter({ hasText: /^Anna$/ }).getByRole('img')
  await page.locator('div').filter({ hasText: /^Brian$/ }).getByRole('img')
})

test('history page loads correctly', async ({ page }) => {
  await page.goto('http://localhost:5173/history')
  expect(page.getByText('Mama Rucci, my my')).toBeVisible()
})

test('logout page functions properly', async ({ page }) => {
  // We have to first login so that we can logout
  await page.route('*/**/api/auth', async (route) => {
    const userReq = {
      name: 'user',
      password: 'a',
      email: 'a@jwt.org'
    }
    const registerRes = {}
    expect(route.request().method()).toBe('POST');
    expect(route.request().postDataJSON()).toMatchObject(userReq)
    await route.fulfill({ json: registerRes });
  });

  await page.goto('http://localhost:5173/')

  // Go to register page
  await page.getByRole('link', { name: 'Register' }).click()

  // fill in register infomration

  await page.getByPlaceholder('Full name').click()
  await page.getByPlaceholder('Full name').fill('user')
  await page.getByPlaceholder('Full name').press('Tab')

  await page.getByPlaceholder('Email address').click()
  await page.getByPlaceholder('Email address').fill('a@jwt.org')
  await page.getByPlaceholder('Email address').press('Tab')

  await page.getByPlaceholder('Password').click()
  await page.getByPlaceholder('Password').fill('a')
  await page.getByPlaceholder('Password').press('Tab')
  await page.getByRole('button', { name: 'Register' }).click()
  
  await page.goto('http://localhost:5173')
  
  await page.route('*/**/api/auth', async (route) => {
    expect(route.request().method()).toBe('DELETE')
  })

  await page.goto('http://localhost:5173/logout')
})