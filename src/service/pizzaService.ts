enum Role {
  Diner = 'diner',
  Franchisee = 'franchisee',
  Admin = 'admin',
}

namespace Role {
  export function isRole(user: User | null, role: Role): boolean {
    return user != null && !!user.roles.find((r) => r.role === role);
  }
}

type Menu = Pizza[];

type Pizza = {
  id: string;
  title: string;
  description: string;
  image: string;
  price: number;
};

type OrderItem = {
  menuId: string;
  description: string;
  price: number;
};

type Order = {
  id: string;
  franchiseId: string;
  storeId: string;
  date: string;
  items: OrderItem[];
};

type OrderHistory = {
  id: string;
  dinerId: string;
  orders: Order[];
};

type UserRole = {
  role: Role;
  objectId?: string;
};

type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  roles: UserRole[];
};

type Store = {
  id: string;
  name: string;
  totalRevenue?: number;
};

type Franchise = {
  id: string;
  admins?: { id: string; name: string; email: string }[];
  name: string;
  stores: Store[];
};

interface PizzaService {
  login(email: string, password: string): Promise<User>;
  register(email: string, password: string, role: string): Promise<User>;
  logout(): Promise<void>;
  getUser(): Promise<User | null>;
  getMenu(): Promise<Menu>;
  getOrders(user: User): Promise<OrderHistory>;
  order(order: Order): Promise<Order>;
  verifyOrder(jwt: string): Promise<Order>;
  getFranchise(user: User): Promise<Franchise | null>;
  createFranchise(franchise: Franchise): Promise<Franchise>;
  getFranchises(): Promise<Franchise[]>;
  closeFranchise(franchise: Franchise): Promise<void>;
  createStore(franchise: Franchise, store: Store): Promise<Store>;
  closeStore(franchise: Franchise, store: Store): Promise<null>;
  docs(docType: string): Promise<Object>;
}

export { Role, PizzaService, User, Menu, Pizza, OrderHistory, Order, Franchise, Store, OrderItem };
