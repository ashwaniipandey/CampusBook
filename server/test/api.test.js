import request from 'supertest';
import app from '../src/app.js';
import { Book, Category, Order, User } from '../src/models/index.js';
import {
  createBook,
  createTestIdentity,
  createUniversity,
  createUser,
  loginAndGetCookie,
} from './helpers.js';

const registerStudent = async (
  appUnderTest,
  university,
  name = 'Test Student',
) => {
  const email = `student-${Date.now()}-${Math.random().toString(16).slice(2)}@${university.domain}`;
  const response = await request(appUnderTest).post('/api/auth/register').send({
    name,
    email,
    password: 'Test-password-123',
    universityId: university._id.toString(),
  });
  return { response, email };
};

describe('authentication API', () => {
  test('signs up, verifies OTP, logs in, reads /me with cookie, rejects missing cookie and logs out', async () => {
    const university = await createUniversity({ domain: 'auth-campus.test' });
    const { response, email } = await registerStudent(
      app,
      university,
      'Auth Student',
    );

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe(email);
    expect(response.body.token).toBeUndefined();
    expect(response.body.user.password).toBeUndefined();
    const user = await User.findOne({ email }).select('+verificationOtp');
    expect(user.verificationOtp).toMatch(/^\d{6}$/);

    const verification = await request(app).post('/api/auth/verify-otp').send({
      email,
      otp: user.verificationOtp,
    });
    expect(verification.status).toBe(200);
    expect(verification.body.user.isVerified).toBe(true);

    const login = await request(app).post('/api/auth/login').send({
      email,
      password: 'Test-password-123',
    });
    expect(login.status).toBe(200);
    expect(login.body.token).toBeUndefined();
    const cookie = login.headers['set-cookie'].find((value) =>
      value.startsWith('token='),
    );
    expect(cookie).toBeDefined();

    const me = await request(app).get('/api/auth/me').set('Cookie', cookie);
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe(email);
    expect(me.body.user.verificationOtp).toBeUndefined();
    expect((await request(app).get('/api/auth/me')).status).toBe(401);

    const logout = await request(app).post('/api/auth/logout');
    expect(logout.status).toBe(200);
    expect(logout.headers['set-cookie'][0]).toContain('token=none');
  });

  test('returns 401 for a wrong password and rate-limits repeated bad logins', async () => {
    const invalidCredentials = {
      email: 'unknown-user@campus.test',
      password: 'wrong-password',
    };
    expect(
      (await request(app).post('/api/auth/login').send(invalidCredentials))
        .status,
    ).toBe(401);

    let response;
    for (let attempt = 0; attempt < 10; attempt += 1) {
      response = await request(app)
        .post('/api/auth/login')
        .send(invalidCredentials);
    }
    expect(response.status).toBe(429);
  });
});

describe('books API', () => {
  test('requires auth to create a pending listing and restricts edit/delete to its owner', async () => {
    const { university, user: seller } = await createTestIdentity();
    const otherUser = await createUser();
    const category = await Category.create({
      name: 'Books for Testing',
      slug: 'books-for-testing',
    });
    const sellerCookie = await loginAndGetCookie(app, seller);
    const otherCookie = await loginAndGetCookie(app, otherUser);
    const payload = {
      title: 'A New Test Textbook',
      author: 'Test Writer',
      category: category._id.toString(),
      condition: 'Good',
      originalPrice: '120',
      sellingPrice: '60',
      listingType: 'sell',
      description: 'A book listing created by the automated test suite.',
      university: university._id.toString(),
    };

    expect((await request(app).post('/api/books').send(payload)).status).toBe(
      401,
    );
    const created = await request(app)
      .post('/api/books')
      .set('Cookie', sellerCookie)
      .send(payload);
    expect(created.status).toBe(201);
    expect(created.body.book.status).toBe('pending');
    const bookId = created.body.book._id;

    expect(
      (
        await request(app)
          .put(`/api/books/${bookId}`)
          .set('Cookie', otherCookie)
          .send({ title: 'Hijacked title' })
      ).status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .delete(`/api/books/${bookId}`)
          .set('Cookie', otherCookie)
      ).status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .put(`/api/books/${bookId}`)
          .set('Cookie', sellerCookie)
          .send({ title: 'Owner Updated Title' })
      ).status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .delete(`/api/books/${bookId}`)
          .set('Cookie', sellerCookie)
      ).status,
    ).toBe(200);
  });

  test('lists only approved books and applies search, category, filters, sorting, and pagination', async () => {
    const { university, user } = await createTestIdentity();
    const category = await Category.create({
      name: 'Algorithms',
      slug: 'algorithms',
    });
    const first = await createBook({
      seller: user,
      university,
      category,
      title: 'Algorithms Basics',
      sellingPrice: 20,
      condition: 'New',
      course: 'Computer Science',
    });
    const second = await createBook({
      seller: await createUser({ university }),
      university,
      category,
      title: 'Advanced Algorithms',
      sellingPrice: 40,
      condition: 'Good',
      course: 'Computer Science',
    });
    await createBook({
      seller: await createUser({ university }),
      university,
      category,
      title: 'Pending Algorithms',
      status: 'pending',
      sellingPrice: 1,
    });
    await createBook({
      seller: await createUser({ university }),
      university,
      title: 'Physics Notes',
      sellingPrice: 10,
    });

    const all = await request(app).get('/api/books');
    expect(all.status).toBe(200);
    expect(all.body.books.map((book) => book._id)).toEqual(
      expect.arrayContaining([first.id, second.id]),
    );
    expect(
      all.body.books.some((book) => book.title === 'Pending Algorithms'),
    ).toBe(false);

    const filtered = await request(app).get(
      `/api/books?q=algorithms&category=${category.id}&course=Computer&page=1&limit=1&sort=price_asc`,
    );
    expect(filtered.status).toBe(200);
    expect(filtered.body.total).toBe(2);
    expect(filtered.body.books).toHaveLength(1);
    expect(filtered.body.books[0]._id).toBe(first.id);

    const secondPage = await request(app).get(
      `/api/books?category=${category.id}&page=2&limit=1&sort=price_asc`,
    );
    expect(secondPage.body.total).toBe(2);
    expect(secondPage.body.books[0]._id).toBe(second.id);
  });
});

describe('orders API', () => {
  test('allows the seller to confirm, then completes and marks the book sold', async () => {
    const { university, user: seller } = await createTestIdentity();
    const buyer = await createUser({ university });
    const book = await createBook({ seller, university, sellingPrice: 75 });
    const buyerCookie = await loginAndGetCookie(app, buyer);
    const sellerCookie = await loginAndGetCookie(app, seller);

    const created = await request(app)
      .post('/api/orders')
      .set('Cookie', buyerCookie)
      .send({
        bookId: book.id,
        meetingLocation: 'Campus library',
        notes: 'After class',
      });
    expect(created.status).toBe(201);
    expect(created.body.order.status).toBe('placed');

    const confirmed = await request(app)
      .patch(`/api/orders/${created.body.order._id}/status`)
      .set('Cookie', sellerCookie)
      .send({ status: 'confirmed' });
    expect(confirmed.status).toBe(200);
    expect(confirmed.body.order.status).toBe('confirmed');

    const completed = await request(app)
      .patch(`/api/orders/${created.body.order._id}/status`)
      .set('Cookie', buyerCookie)
      .send({ status: 'completed' });
    expect(completed.status).toBe(200);
    expect((await Book.findById(book.id)).status).toBe('sold');
  });

  test('allows seller cancellation and prevents ordering one’s own book', async () => {
    const { university, user: seller } = await createTestIdentity();
    const buyer = await createUser({ university });
    const cancelBook = await createBook({
      seller,
      university,
      title: 'Cancellation Book',
    });
    const buyerCookie = await loginAndGetCookie(app, buyer);
    const sellerCookie = await loginAndGetCookie(app, seller);
    const order = await request(app)
      .post('/api/orders')
      .set('Cookie', buyerCookie)
      .send({ bookId: cancelBook.id });
    expect(order.status).toBe(201);
    const cancelled = await request(app)
      .patch(`/api/orders/${order.body.order._id}/status`)
      .set('Cookie', sellerCookie)
      .send({ status: 'cancelled' });
    expect(cancelled.status).toBe(200);
    expect((await Book.findById(cancelBook.id)).status).toBe('approved');

    const ownBook = await createBook({
      seller,
      university,
      title: 'My Own Book',
    });
    const ownOrder = await request(app)
      .post('/api/orders')
      .set('Cookie', sellerCookie)
      .send({ bookId: ownBook.id });
    expect(ownOrder.status).toBe(400);
    expect(await Order.countDocuments({ book: ownBook._id })).toBe(0);
  });
});

describe('admin and health APIs', () => {
  test('denies students and allows admins to approve and reject pending books', async () => {
    const { university, user: student } = await createTestIdentity();
    const admin = await createUser({ role: 'admin', university });
    const studentCookie = await loginAndGetCookie(app, student);
    const adminCookie = await loginAndGetCookie(app, admin);
    expect(
      (await request(app).get('/api/admin/stats').set('Cookie', studentCookie))
        .status,
    ).toBe(403);

    const bookToApprove = await createBook({
      seller: student,
      university,
      status: 'pending',
      title: 'Book to Approve',
    });
    const approved = await request(app)
      .patch(`/api/admin/books/${bookToApprove.id}/approve`)
      .set('Cookie', adminCookie);
    expect(approved.status).toBe(200);
    expect(approved.body.book.status).toBe('approved');

    const bookToReject = await createBook({
      seller: student,
      university,
      status: 'pending',
      title: 'Book to Reject',
    });
    const rejected = await request(app)
      .patch(`/api/admin/books/${bookToReject.id}/reject`)
      .set('Cookie', adminCookie)
      .send({ reason: 'Missing required book details.' });
    expect(rejected.status).toBe(200);
    expect(rejected.body.book.status).toBe('rejected');
    expect(rejected.body.book.rejectionReason).toBe(
      'Missing required book details.',
    );
  });

  test('returns database-aware health JSON and a JSON 404 for an unknown API route', async () => {
    const health = await request(app).get('/api/health');
    expect(health.status).toBe(200);
    expect(health.body.databaseConnected).toBe(true);

    const unknown = await request(app).get('/api/does-not-exist');
    expect(unknown.status).toBe(404);
    expect(unknown.headers['content-type']).toMatch(/application\/json/);
    expect(unknown.body.message).toBeTruthy();
  });

  test('serves the generated Swagger UI in the test/development environment', async () => {
    const docs = await request(app).get('/api/docs/');
    expect(docs.status).toBe(200);
    expect(docs.text).toContain('swagger-ui');
  });
});
