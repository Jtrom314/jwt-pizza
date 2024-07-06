import { test, expect } from 'playwright-test-coverage';
class User {
  constructor(id, name, email, password, roles) {
    this.id = id
    this.name = name
    this.email = email
    this.password = password,
    this.roles = roles
  }
}

test('purchase with login', async ({ page }) => {
  await page.route('*/**/api/order/menu', async (route) => {
    const menuRes = [
      { id: 1, title: 'Veggie', image: 'pizza1.png', price: 0.0038, description: 'A garden of delight' },
      { id: 2, title: 'Pepperoni', image: 'pizza2.png', price: 0.0042, description: 'Spicy treat' },
    ];
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: menuRes });
  });

  await page.route('*/**/api/franchise', async (route) => {
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
      storeId: '4',
      franchiseId: 2,
    };
    const orderRes = {
      order: {
        items: [
          { menuId: 1, description: 'Veggie', price: 0.0038 },
          { menuId: 2, description: 'Pepperoni', price: 0.0042 },
        ],
        storeId: '4',
        franchiseId: 2,
        id: 23,
      },
      jwt: 'eyJpYXQ',
    };
    expect(route.request().method()).toBe('POST');
    expect(route.request().postDataJSON()).toMatchObject(orderReq);
    await route.fulfill({ json: orderRes });
  });
  await page.route('*/**/api/order/verify', async (route) => {
    const verifyReq = {
      jwt: 'eyJpYXQ',
    };
    const verifyRes = {
      message: 'valid',
    };
    expect(route.request().method()).toBe('POST');
    expect(route.request().postDataJSON()).toMatchObject(verifyReq);
    await route.fulfill({ json: verifyRes });
  });

  await page.goto('http://localhost:5173/');

  // Go to order page
  await page.getByRole('button', { name: 'Order now' }).click();

  // Create order
  await expect(page.locator('h2')).toContainText('Awesome is a click away');
  await page.goto('http://localhost:5173/');
  await page.getByRole('button', { name: 'Order now' }).click();
  await page.getByRole('combobox').selectOption('4');
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
  await expect(page.locator('tbody')).toContainText('Pepperoni');
  await expect(page.locator('tfoot')).toContainText('0.008 ₿');
  await page.getByRole('button', { name: 'Pay now' }).click();

  // Check balance
  await expect(page.getByText('0.008')).toBeVisible();

  // Verify
  await page.getByRole('button', { name: 'Verify' }).click();
  await expect(page.locator('h3')).toHaveText('JWT Pizza - valid');
  await page.getByRole('button', { name: 'Close' }).click();
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


test('admin dashboard allows you to create a franchise and a store', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByPlaceholder('Email address').click();
  await page.getByPlaceholder('Email address').fill('a@jwt.com');
  await page.getByPlaceholder('Email address').press('Tab');
  await page.getByPlaceholder('Password').fill('admin');

  // Intercept the API call and fulfill with the mocked response
  await page.route('*/api/auth', async (route) => {
    const loginReq = { email: 'a@jwt.com', password: 'admin' };
    const loginRes = { id: 1, name: '常用名字', email: 'a@jwt.com', roles: [{ role: 'admin' }] };
    expect(route.request().method()).toBe('POST');
    expect(route.request().postDataJSON()).toMatchObject(loginReq);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(loginRes)
    });
  });

  // Click the login button to trigger the API call
  await page.getByRole('button', { name: 'Login' }).click();

  // Wait for the navigation or API response if there's any
  await page.waitForLoadState('networkidle');

  // Set the local storage directly with user info and token
  const loginRes = { id: 1, name: '常用名字', email: 'a@jwt.com', roles: [{ role: 'admin' }] };
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IuW4uOeUqOWQjeWtlyIsImVtYWlsIjoiYUBqd3QuY29tIiwicm9sZXMiOlt7InJvbGUiOiJhZG1pbiJ9XSwiaWF0IjoxNzIwMTI0NzcyfQ.yksrEHcYYB1kAlRps_USlVg-ME0HHcozHKcsTn8ibrU';

  await page.evaluate(({ loginRes, token }) => {
    localStorage.setItem('user', JSON.stringify(loginRes));
    localStorage.setItem('token', token);
  }, { loginRes, token });

  // Navigate to the admin page
  // await page.getByRole('link', { name: 'Admin' }).click();
  page.goto('http://localhost:5173/admin-dashboard')

  await page.getByRole('button', { name: 'Add Franchise' }).click();
  await page.getByPlaceholder('franchise name').click();
  await page.getByPlaceholder('franchise name').fill('random');
  await page.getByPlaceholder('franchise name').press('Tab');
  await page.getByPlaceholder('franchisee admin email').fill('a@jwt.com');

  await page.route('*/api/franchise', async (route) =>  {
    expect(route.request().method()).toBe('POST')
  })

  await page.route('*/api/franchise/*', async (route) => {
    expect(route.request().method()).toBe('DELETE')
  })

  await page.getByRole('button', { name: 'Create' }).click();
  await page.getByRole('row', { name: 'random 常用名字 Close' })
  // await page.getByRole('button', { name: 'Close' }).click();
});

test('diner dashboard', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByPlaceholder('Email address').click();
  await page.getByPlaceholder('Email address').fill('f@jwt.com');
  await page.getByPlaceholder('Email address').press('Tab');
  await page.getByPlaceholder('Password').fill('franchisee');

  // Intercept the API call and fulfill with the mocked response
  await page.route('*/**/api/auth', async (route) => {
    const loginReq = { email: 'f@jwt.com', password: 'franchisee' };
    const loginRes = {"id":3,"name":"pizza franchisee","email":"f@jwt.com","roles":[{"role":"franchisee"}] };
    expect(route.request().method()).toBe('PUT');
    expect(route.request().postDataJSON()).toMatchObject(loginReq);
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywibmFtZSI6InBpenphIGZyYW5jaGlzZWUiLCJlbWFpbCI6ImZAand0LmNvbSIsInJvbGVzIjpbeyJyb2xlIjoiZGluZXIifSx7Im9iamVjdElkIjoxLCJyb2xlIjoiZnJhbmNoaXNlZSJ9XSwiaWF0IjoxNzIwMTI1OTU1fQ.HwYn7KgtrE13lu02lufXcicZf13FXiau8HUnLvQfdKI';
    const user = new User(loginRes.id.toString(), loginRes.name, loginRes.email, loginRes.password, loginRes.roles)
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(loginRes)
    });
    await page.evaluate(({ user, token }) => {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
    }, { user, token });
    await page.goto('http://localhost:5173')
  });

  // Click the login button to trigger the API call
  await page.getByRole('button', { name: 'Login' }).click();

  // Wait for the navigation or API response if there's any
  await page.waitForLoadState('networkidle');

  await page.route('*/**/api/order', async (route) => {
    const res = {
      "dinerId": 4,
      "orders": [
        {
          "id": 1,
          "franchiseId": 1,
          "storeId": 1,
          "date": "2024-06-05T05:14:40.000Z",
          "items": [
            {
              "id": 1,
              "menuId": 1,
              "description": "Veggie",
              "price": 0.05
            }
          ]
        }
      ],
      "page": 1
    }
    expect(route.request().method()).toBe('GET')
    await route.fulfill({ json: res });
  })
  
  await page.goto('http://localhost:5173/diner-dashboard')
  await page.waitForLoadState('networkidle');
  await page.getByText('Here is your history of all the good times.')
  await page.getByText('1')
})


test('franchisee is able to access their dashboard', async ({ page }) => {
  await page.route('*/**/api/auth', async (route) => {
    const loginReq = { email: 'f@jwt.com', password: 'franchisee' };
    const loginRes = {"id":3,"name":"pizza franchisee","email":"f@jwt.com","roles":[{"role":"franchisee"}] };
    expect(route.request().method()).toBe('PUT');
    expect(route.request().postDataJSON()).toMatchObject(loginReq);
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywibmFtZSI6InBpenphIGZyYW5jaGlzZWUiLCJlbWFpbCI6ImZAand0LmNvbSIsInJvbGVzIjpbeyJyb2xlIjoiZGluZXIifSx7Im9iamVjdElkIjoxLCJyb2xlIjoiZnJhbmNoaXNlZSJ9XSwiaWF0IjoxNzIwMTI1OTU1fQ.HwYn7KgtrE13lu02lufXcicZf13FXiau8HUnLvQfdKI';
    const user = new User(loginRes.id.toString(), loginRes.name, loginRes.email, loginRes.password, loginRes.roles)
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(loginRes)
    });
    await page.evaluate(({ user, token }) => {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
    }, { user, token });
    await page.goto('http://localhost:5173')
  });
  await page.goto('http://localhost:5173/');
  // Set the local storage directly with user info and token
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByPlaceholder('Email address').click();
  await page.getByPlaceholder('Email address').fill('f@jwt.com');
  await page.getByPlaceholder('Email address').press('Tab');
  await page.getByPlaceholder('Password').fill('franchisee');
  // Click the login button to trigger the API call
  await page.getByRole('button', { name: 'Login' }).click();
  await page.route('*/**/api/franchise/3', async (route) => {
    const franchiseRes = [
      {
        "id": 2,
        "name": "pizzaPocket",
        "admins": [
          {
            "id": 4,
            "name": "pizza franchisee",
            "email": "f@jwt.com"
          }
        ],
        "stores": [
          {
            "id": 4,
            "name": "SLC",
            "totalRevenue": 0
          }
        ]
      }
    ];
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: franchiseRes });
  });

  await page.route('*/**/api/franchise/2/store', async (route) => {
    const obj = {}
    expect(route.request().method()).toBe('POST')
    await route.fulfill({ json: obj })
  })


  
  // Navigate to the franchise dashboard page
  await page.getByLabel('Global').getByRole('link', { name: 'Franchise' }).click();

  await page.getByRole('button', { name: 'Create store' }).click();
  await page.getByPlaceholder('store name').click();
  await page.getByPlaceholder('store name').fill('test');
  await page.getByRole('button', { name: 'Create' }).click();
  await page.getByRole('button', { name: 'Close' }).click()
  await page.getByRole('button', { name: 'Close' }).click();
})



test('docs work correctly', async ({ page }) => {
  await page.route('*/**/api/docs', async (route) => {
    expect(route.request().method()).toBe('GET')
    const res = {
      "version": "20240518.154317",
      "endpoints": [
          {
              "method": "POST",
              "path": "/api/auth",
              "description": "Register a new user",
              "example": "curl -X POST localhost:3000/api/auth -d '{\"name\":\"pizza diner\", \"email\":\"d@jwt.com\", \"password\":\"diner\"}' -H 'Content-Type: application/json'",
              "response": {
                  "user": {
                      "id": 2,
                      "name": "pizza diner",
                      "email": "d@jwt.com",
                      "roles": [
                          {
                              "role": "diner"
                          }
                      ]
                  },
                  "token": "tttttt"
              }
          },
          {
              "method": "PUT",
              "path": "/api/auth",
              "description": "Login existing user",
              "example": "curl -X PUT localhost:3000/api/auth -d '{\"email\":\"a@jwt.com\", \"password\":\"admin\"}' -H 'Content-Type: application/json'",
              "response": {
                  "user": {
                      "id": 1,
                      "name": "常用名字",
                      "email": "a@jwt.com",
                      "roles": [
                          {
                              "role": "admin"
                          }
                      ]
                  },
                  "token": "tttttt"
              }
          },
          {
              "method": "PUT",
              "path": "/api/auth/:userId",
              "requiresAuth": true,
              "description": "Update user",
              "example": "curl -X PUT localhost:3000/api/auth/1 -d '{\"email\":\"a@jwt.com\", \"password\":\"admin\"}' -H 'Content-Type: application/json' -H 'Authorization: Bearer tttttt'",
              "response": {
                  "id": 1,
                  "name": "常用名字",
                  "email": "a@jwt.com",
                  "roles": [
                      {
                          "role": "admin"
                      }
                  ]
              }
          },
          {
              "method": "DELETE",
              "path": "/api/auth",
              "requiresAuth": true,
              "description": "Logout a user",
              "example": "curl -X DELETE localhost:3000/api/auth -H 'Authorization: Bearer tttttt'",
              "response": {
                  "message": "logout successful"
              }
          },
          {
              "method": "GET",
              "path": "/api/order/menu",
              "description": "Get the pizza menu",
              "example": "curl localhost:3000/api/order/menu",
              "response": [
                  {
                      "id": 1,
                      "title": "Veggie",
                      "image": "pizza1.png",
                      "price": 0.0038,
                      "description": "A garden of delight"
                  }
              ]
          },
          {
              "method": "PUT",
              "path": "/api/order/menu",
              "requiresAuth": true,
              "description": "Add an item to the menu",
              "example": "curl -X PUT localhost:3000/api/order/menu -H 'Content-Type: application/json' -d '{ \"title\":\"Student\", \"description\": \"No topping, no sauce, just carbs\", \"image\":\"pizza9.png\", \"price\": 0.0001 }'  -H 'Authorization: Bearer tttttt'",
              "response": [
                  {
                      "id": 1,
                      "title": "Student",
                      "description": "No topping, no sauce, just carbs",
                      "image": "pizza9.png",
                      "price": 0.0001
                  }
              ]
          },
          {
              "method": "GET",
              "path": "/api/order",
              "requiresAuth": true,
              "description": "Get the orders for the authenticated user",
              "example": "curl -X GET localhost:3000/api/order  -H 'Authorization: Bearer tttttt'",
              "response": {
                  "dinerId": 4,
                  "orders": [
                      {
                          "id": 1,
                          "franchiseId": 1,
                          "storeId": 1,
                          "date": "2024-06-05T05:14:40.000Z",
                          "items": [
                              {
                                  "id": 1,
                                  "menuId": 1,
                                  "description": "Veggie",
                                  "price": 0.05
                              }
                          ]
                      }
                  ],
                  "page": 1
              }
          },
          {
              "method": "POST",
              "path": "/api/order",
              "requiresAuth": true,
              "description": "Create a order for the authenticated user",
              "example": "curl -X POST localhost:3000/api/order -H 'Content-Type: application/json' -d '{\"franchiseId\": 1, \"storeId\":1, \"items\":[{ \"menuId\": 1, \"description\": \"Veggie\", \"price\": 0.05 }]}'  -H 'Authorization: Bearer tttttt'",
              "response": {
                  "order": {
                      "franchiseId": 1,
                      "storeId": 1,
                      "items": [
                          {
                              "menuId": 1,
                              "description": "Veggie",
                              "price": 0.05
                          }
                      ],
                      "id": 1
                  },
                  "jwt": "1111111111"
              }
          },
          {
              "method": "GET",
              "path": "/api/franchise",
              "description": "List all the franchises",
              "example": "curl localhost:3000/api/franchise",
              "response": [
                  {
                      "id": 1,
                      "name": "pizzaPocket",
                      "stores": [
                          {
                              "id": 1,
                              "name": "SLC"
                          }
                      ]
                  }
              ]
          },
          {
              "method": "GET",
              "path": "/api/franchise/:userId",
              "requiresAuth": true,
              "description": "List a user's franchises",
              "example": "curl localhost:3000/api/franchise/4  -H 'Authorization: Bearer tttttt'",
              "response": [
                  {
                      "id": 2,
                      "name": "pizzaPocket",
                      "admins": [
                          {
                              "id": 4,
                              "name": "pizza franchisee",
                              "email": "f@jwt.com"
                          }
                      ],
                      "stores": [
                          {
                              "id": 4,
                              "name": "SLC",
                              "totalRevenue": 0
                          }
                      ]
                  }
              ]
          },
          {
              "method": "POST",
              "path": "/api/franchise",
              "requiresAuth": true,
              "description": "Create a new franchise",
              "example": "curl -X POST localhost:3000/api/franchise -H 'Content-Type: application/json' -H 'Authorization: Bearer tttttt' -d '{\"name\": \"pizzaPocket\", \"admins\": [{\"email\": \"f@jwt.com\"}]}'",
              "response": {
                  "name": "pizzaPocket",
                  "admins": [
                      {
                          "email": "f@jwt.com",
                          "id": 4,
                          "name": "pizza franchisee"
                      }
                  ],
                  "id": 1
              }
          },
          {
              "method": "DELETE",
              "path": "/api/franchise/:franchiseId",
              "requiresAuth": true,
              "description": "Delete a franchises",
              "example": "curl -X DELETE localhost:3000/api/franchise/1 -H 'Authorization: Bearer tttttt'",
              "response": {
                  "message": "franchise deleted"
              }
          },
          {
              "method": "POST",
              "path": "/api/franchise/:franchiseId/store",
              "requiresAuth": true,
              "description": "Create a new franchise store",
              "example": "curl -X POST localhost:3000/api/franchise/1/store -H 'Content-Type: application/json' -d '{\"franchiseId\": 1, \"name\":\"SLC\"}' -H 'Authorization: Bearer tttttt'",
              "response": {
                  "id": 1,
                  "franchiseId": 1,
                  "name": "SLC"
              }
          },
          {
              "method": "DELETE",
              "path": "/api/franchise/:franchiseId/store/:storeId",
              "requiresAuth": true,
              "description": "Delete a store",
              "example": "curl -X DELETE localhost:3000/api/franchise/1/store/1  -H 'Authorization: Bearer tttttt'",
              "response": {
                  "message": "store deleted"
              }
          }
      ],
      "config": {
          "factory": "https://pizza-factory.cs329.click",
          "db": "localhost"
      }
    }
    await route.fulfill({ json: res})
  })

  await page.goto('http://localhost:5173/docs')
  await page.getByText("Example request")
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

test('not found page loads correctly', async ({ page }) => {
  await page.goto('http://localhost:5173/oops')

  await page.getByText('Oops')
})