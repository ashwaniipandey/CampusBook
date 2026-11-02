import swaggerJsdoc from 'swagger-jsdoc';

const jsonResponse = (
  status,
  description,
  example,
  schema = { type: 'object' },
) => ({
  [status]: {
    description,
    content: {
      'application/json': {
        schema,
        ...(example ? { example } : {}),
      },
    },
  },
});

const errorResponses = {
  ...jsonResponse(
    '400',
    'Invalid request data.',
    {
      status: 'fail',
      message: 'Validation error.',
    },
    { $ref: '#/components/schemas/Error' },
  ),
  ...jsonResponse(
    '401',
    'Authentication is required or the session is invalid.',
    {
      status: 'fail',
      message: 'You are not logged in.',
    },
    { $ref: '#/components/schemas/Error' },
  ),
  ...jsonResponse(
    '403',
    'The authenticated user is not permitted to perform this action.',
    {
      status: 'fail',
      message: 'Forbidden.',
    },
    { $ref: '#/components/schemas/Error' },
  ),
  ...jsonResponse(
    '404',
    'The requested resource was not found.',
    {
      status: 'fail',
      message: 'The requested route was not found.',
    },
    { $ref: '#/components/schemas/Error' },
  ),
  ...jsonResponse(
    '429',
    'The request rate limit was exceeded.',
    {
      status: 'fail',
      message: 'Too many requests. Please try again later.',
    },
    { $ref: '#/components/schemas/Error' },
  ),
  ...jsonResponse(
    '500',
    'An unexpected server error occurred.',
    {
      status: 'error',
      message: 'An unexpected error occurred.',
    },
    { $ref: '#/components/schemas/Error' },
  ),
};

const operation = ({
  summary,
  description = summary,
  tag,
  auth = true,
  parameters = [],
  requestBody,
  status = '200',
  responseExample = { status: 'success' },
  responseSchema = { type: 'object', additionalProperties: true },
  contentType = 'application/json',
  requestContentType = 'application/json',
  requestSchema,
}) => ({
  tags: [tag],
  summary,
  description,
  ...(auth ? { security: [{ cookieAuth: [] }] } : {}),
  ...(parameters.length ? { parameters } : {}),
  ...(requestBody || requestSchema
    ? {
        requestBody: {
          required: true,
          content: {
            [requestContentType]: {
              schema: {
                $ref: `#/components/schemas/${requestBody || requestSchema}`,
              },
            },
          },
        },
      }
    : {}),
  responses: {
    [status]: {
      description: status.startsWith('2')
        ? 'Request completed successfully.'
        : 'Request failed.',
      content: {
        [contentType]:
          contentType === 'application/json'
            ? {
                schema: responseSchema,
                ...(responseExample ? { example: responseExample } : {}),
              }
            : { schema: { type: 'string', format: 'binary' } },
      },
    },
    ...errorResponses,
  },
});

const pathId = (name = 'id', description = 'Resource ID') => ({
  name,
  in: 'path',
  required: true,
  description,
  schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
});

const queryParam = (name, description, schema = { type: 'string' }) => ({
  name,
  in: 'query',
  required: false,
  description,
  schema,
});

const bodySchema = (properties, required = []) => ({
  type: 'object',
  properties,
  ...(required.length ? { required } : {}),
  additionalProperties: false,
});

const paths = {
  '/api/health': {
    get: operation({
      summary: 'Check API and database health',
      tag: 'System',
      auth: false,
    }),
  },
  '/api/categories': {
    get: operation({
      summary: 'List active book categories',
      tag: 'Books',
      auth: false,
    }),
  },
  '/api/universities': {
    get: operation({
      summary: 'List active universities',
      tag: 'Users and profile',
      auth: false,
    }),
  },
  '/api/public/stats': {
    get: operation({
      summary: 'Get public marketplace statistics',
      tag: 'System',
      auth: false,
    }),
  },
  '/api/auth/register': {
    post: operation({
      summary: 'Register a student',
      tag: 'Authentication',
      auth: false,
      requestBody: 'RegisterRequest',
      status: '201',
      responseExample: {
        status: 'success',
        message: 'Registration successful.',
        user: { name: 'A Student' },
      },
    }),
  },
  '/api/auth/login': {
    post: operation({
      summary: 'Log in and set the HttpOnly auth cookie',
      tag: 'Authentication',
      auth: false,
      requestBody: 'LoginRequest',
      responseExample: {
        status: 'success',
        message: 'Logged in successfully.',
        user: { name: 'A Student' },
      },
    }),
  },
  '/api/auth/verify-otp': {
    post: operation({
      summary: 'Verify a student email OTP',
      tag: 'Authentication',
      auth: false,
      requestBody: 'VerifyOtpRequest',
    }),
  },
  '/api/auth/resend-otp': {
    post: operation({
      summary: 'Request another verification OTP',
      tag: 'Authentication',
      auth: false,
      requestBody: 'EmailRequest',
    }),
  },
  '/api/auth/forgot-password': {
    post: operation({
      summary: 'Request a password reset OTP',
      tag: 'Authentication',
      auth: false,
      requestBody: 'EmailRequest',
    }),
  },
  '/api/auth/reset-password': {
    post: operation({
      summary: 'Reset a password with an OTP',
      tag: 'Authentication',
      auth: false,
      requestBody: 'ResetPasswordRequest',
    }),
  },
  '/api/auth/logout': {
    post: operation({
      summary: 'Clear the auth cookie',
      tag: 'Authentication',
      auth: false,
    }),
  },
  '/api/auth/me': {
    get: operation({
      summary: 'Get the current user profile',
      tag: 'Authentication',
      responseExample: {
        status: 'success',
        user: { $ref: '#/components/schemas/User' },
      },
    }),
  },
  '/api/auth/profile': {
    put: operation({
      summary: 'Update the current user profile',
      tag: 'Users and profile',
      requestBody: 'ProfileUpdateRequest',
    }),
  },
  '/api/auth/change-password': {
    put: operation({
      summary: 'Change the current password',
      tag: 'Authentication',
      requestBody: 'ChangePasswordRequest',
    }),
  },
  '/api/users/me': {
    put: operation({
      summary: 'Update the current profile',
      tag: 'Users and profile',
      requestBody: 'ProfileUpdateRequest',
    }),
  },
  '/api/users/me/avatar': {
    post: operation({
      summary: 'Upload a profile avatar',
      tag: 'Users and profile',
      requestSchema: 'AvatarUploadRequest',
      requestContentType: 'multipart/form-data',
    }),
  },
  '/api/users/{id}/reviews': {
    get: operation({
      summary: 'List reviews for a seller',
      tag: 'Users and profile',
      auth: false,
      parameters: [pathId()],
    }),
  },
  '/api/reviews': {
    post: operation({
      summary: 'Review a completed purchase',
      tag: 'Users and profile',
      requestBody: 'ReviewRequest',
      status: '201',
    }),
  },
  '/api/books': {
    get: operation({
      summary: 'Search and browse approved books',
      tag: 'Books',
      auth: false,
      parameters: [
        queryParam(
          'q',
          'Search title, author, ISBN, subject, course or publisher.',
        ),
        queryParam('category', 'Category ID or comma-separated category IDs.'),
        queryParam('university', 'Filter by university ID.'),
        queryParam(
          'scope',
          'Use mine to filter to the logged-in user’s university.',
          { type: 'string', enum: ['mine', 'all'] },
        ),
        queryParam('universityName', 'Filter by university name.'),
        queryParam('condition', 'Book condition.'),
        queryParam('listingType', 'Listing type.', {
          type: 'string',
          enum: ['sell', 'exchange', 'donate'],
        }),
        queryParam('course', 'Course filter.'),
        queryParam('semester', 'Semester filter.'),
        queryParam('edition', 'Edition filter.'),
        queryParam('publisher', 'Publisher filter.'),
        queryParam('minPrice', 'Minimum price.', {
          type: 'number',
          minimum: 0,
        }),
        queryParam('maxPrice', 'Maximum price.', {
          type: 'number',
          minimum: 0,
        }),
        queryParam('sort', 'Sort order.', {
          type: 'string',
          enum: ['relevance', 'price_asc', 'price_desc', 'popular', 'newest'],
        }),
        queryParam('page', 'Page number.', { type: 'integer', minimum: 1 }),
        queryParam('limit', 'Items per page (maximum 50).', {
          type: 'integer',
          minimum: 1,
          maximum: 50,
        }),
      ],
      responseExample: {
        status: 'success',
        books: [{ $ref: '#/components/schemas/Book' }],
        total: 1,
        page: 1,
        totalPages: 1,
      },
    }),
    post: operation({
      summary: 'Create a book listing (pending review)',
      tag: 'Books',
      requestBody: 'BookCreateRequest',
      status: '201',
    }),
  },
  '/api/books/suggestions': {
    get: operation({
      summary: 'Autocomplete book titles, authors and ISBNs',
      tag: 'Books',
      auth: false,
      parameters: [
        queryParam('q', 'Search prefix (2–120 characters).', {
          type: 'string',
          minLength: 2,
          maxLength: 120,
        }),
      ],
    }),
  },
  '/api/books/my': {
    get: operation({ summary: 'List the current user’s books', tag: 'Books' }),
  },
  '/api/books/filters-meta': {
    get: operation({
      summary: 'Get marketplace filter counts',
      tag: 'Books',
      auth: false,
    }),
  },
  '/api/books/{id}': {
    get: operation({
      summary: 'Get a book listing',
      tag: 'Books',
      auth: false,
      parameters: [pathId()],
    }),
    put: operation({
      summary: 'Update an owned listing',
      tag: 'Books',
      parameters: [pathId()],
      requestBody: 'BookUpdateRequest',
    }),
    delete: operation({
      summary: 'Delete an owned listing',
      tag: 'Books',
      parameters: [pathId()],
    }),
  },
  '/api/books/{id}/similar': {
    get: operation({
      summary: 'Get similar book listings',
      tag: 'Books',
      auth: false,
      parameters: [pathId()],
    }),
  },
  '/api/books/{id}/mark-sold': {
    patch: operation({
      summary: 'Mark an owned listing as sold',
      tag: 'Books',
      parameters: [pathId()],
    }),
  },
  '/api/wishlist': {
    get: operation({ summary: 'Get the current wishlist', tag: 'Wishlist' }),
  },
  '/api/wishlist/{bookId}': {
    post: operation({
      summary: 'Add a book to the wishlist',
      tag: 'Wishlist',
      parameters: [pathId('bookId', 'Book ID')],
    }),
    delete: operation({
      summary: 'Remove a book from the wishlist',
      tag: 'Wishlist',
      parameters: [pathId('bookId', 'Book ID')],
    }),
  },
  '/api/cart': {
    get: operation({ summary: 'Get the current cart', tag: 'Cart' }),
    delete: operation({ summary: 'Clear the current cart', tag: 'Cart' }),
  },
  '/api/cart/{bookId}': {
    post: operation({
      summary: 'Add a book to the cart',
      tag: 'Cart',
      parameters: [pathId('bookId', 'Book ID')],
    }),
    delete: operation({
      summary: 'Remove a book from the cart',
      tag: 'Cart',
      parameters: [pathId('bookId', 'Book ID')],
    }),
  },
  '/api/orders': {
    get: operation({
      summary: 'List the current user’s orders',
      tag: 'Orders',
      parameters: [
        queryParam('role', 'Filter by buying or selling.', {
          type: 'string',
          enum: ['buying', 'selling'],
        }),
        queryParam('status', 'Filter by order status.', {
          type: 'string',
          enum: [
            'placed',
            'confirmed',
            'ready_for_pickup',
            'completed',
            'cancelled',
          ],
        }),
      ],
      responseExample: {
        status: 'success',
        orders: [{ $ref: '#/components/schemas/Order' }],
      },
    }),
    post: operation({
      summary: 'Create a purchase order',
      tag: 'Orders',
      requestBody: 'OrderCreateRequest',
      status: '201',
    }),
  },
  '/api/orders/{id}/status': {
    patch: operation({
      summary: 'Update an order status',
      tag: 'Orders',
      parameters: [pathId()],
      requestBody: 'OrderStatusRequest',
    }),
  },
  '/api/exchanges': {
    get: operation({
      summary: 'List received and sent exchange requests',
      tag: 'Exchanges',
      parameters: [
        queryParam('role', 'Filter by received or sent.', {
          type: 'string',
          enum: ['received', 'sent'],
        }),
      ],
    }),
    post: operation({
      summary: 'Create an exchange request',
      tag: 'Exchanges',
      requestBody: 'ExchangeRequestCreate',
      status: '201',
    }),
  },
  '/api/exchanges/{id}/status': {
    patch: operation({
      summary: 'Update an exchange request status',
      tag: 'Exchanges',
      parameters: [pathId()],
      requestBody: 'RequestStatusUpdate',
    }),
  },
  '/api/donations': {
    get: operation({
      summary: 'List received and sent donation requests',
      tag: 'Donations',
      parameters: [
        queryParam('role', 'Filter by received or sent.', {
          type: 'string',
          enum: ['received', 'sent'],
        }),
      ],
    }),
    post: operation({
      summary: 'Request a donated book',
      tag: 'Donations',
      requestBody: 'DonationRequestCreate',
      status: '201',
    }),
  },
  '/api/donations/{id}/status': {
    patch: operation({
      summary: 'Update a donation request status',
      tag: 'Donations',
      parameters: [pathId()],
      requestBody: 'RequestStatusUpdate',
    }),
  },
  '/api/conversations': {
    get: operation({
      summary: 'List the current user’s conversations',
      tag: 'Conversations',
      parameters: [queryParam('q', 'Optional conversation search.')],
    }),
    post: operation({
      summary: 'Start or retrieve a conversation',
      tag: 'Conversations',
      requestBody: 'ConversationCreateRequest',
      status: '200',
    }),
  },
  '/api/conversations/{id}/messages': {
    get: operation({
      summary: 'List messages in a conversation',
      tag: 'Conversations',
      parameters: [
        pathId(),
        queryParam('page', 'Page number.', { type: 'integer', minimum: 1 }),
        queryParam('limit', 'Items per page, maximum 100.', {
          type: 'integer',
          minimum: 1,
          maximum: 100,
        }),
      ],
    }),
    post: operation({
      summary: 'Send a conversation message',
      tag: 'Conversations',
      parameters: [pathId()],
      requestBody: 'MessageCreateRequest',
      status: '201',
    }),
  },
  '/api/conversations/{id}/read': {
    patch: operation({
      summary: 'Mark a conversation as read',
      tag: 'Conversations',
      parameters: [pathId()],
    }),
  },
  '/api/conversations/{id}/image': {
    post: operation({
      summary: 'Send an image in a conversation',
      tag: 'Conversations',
      parameters: [pathId()],
      requestBody: 'ConversationImageRequest',
      status: '201',
    }),
  },
  '/api/notifications': {
    get: operation({
      summary: 'List notifications',
      tag: 'Notifications',
      parameters: [
        queryParam('page', 'Page number.', { type: 'integer', minimum: 1 }),
        queryParam('limit', 'Items per page, maximum 100.', {
          type: 'integer',
          minimum: 1,
          maximum: 100,
        }),
        queryParam('unread', 'Filter unread/read notifications.', {
          type: 'boolean',
        }),
      ],
    }),
  },
  '/api/notifications/unread-count': {
    get: operation({
      summary: 'Get the unread notification count',
      tag: 'Notifications',
    }),
  },
  '/api/notifications/read-all': {
    patch: operation({
      summary: 'Mark all notifications as read',
      tag: 'Notifications',
    }),
  },
  '/api/notifications/{id}/read': {
    patch: operation({
      summary: 'Mark one notification as read',
      tag: 'Notifications',
      parameters: [pathId()],
    }),
  },
  '/api/notifications/{id}': {
    delete: operation({
      summary: 'Delete a notification',
      tag: 'Notifications',
      parameters: [pathId()],
    }),
  },
  '/api/admin/stats': {
    get: operation({
      summary: 'Get admin overview statistics',
      tag: 'Administration',
    }),
  },
  '/api/admin/analytics/activity': {
    get: operation({
      summary: 'Get monthly user, book and order counts',
      tag: 'Administration',
      parameters: [
        queryParam('months', 'Months to include (1–24).', {
          type: 'integer',
          minimum: 1,
          maximum: 24,
        }),
      ],
    }),
  },
  '/api/admin/analytics/categories': {
    get: operation({
      summary: 'Get book category analytics',
      tag: 'Administration',
    }),
  },
  '/api/admin/analytics/universities': {
    get: operation({
      summary: 'Get university analytics',
      tag: 'Administration',
    }),
  },
  '/api/admin/recent': {
    get: operation({
      summary: 'Get recent signups, pending books and orders',
      tag: 'Administration',
    }),
  },
  '/api/admin/users': {
    get: operation({
      summary: 'Search and paginate users',
      tag: 'Administration',
      parameters: [
        queryParam('q', 'Search by name or email.'),
        queryParam('role', 'Filter by role.', {
          type: 'string',
          enum: ['student', 'admin'],
        }),
        queryParam('status', 'Filter by account status.'),
        queryParam('page', 'Page number.', { type: 'integer', minimum: 1 }),
        queryParam('limit', 'Page size, maximum 100.', {
          type: 'integer',
          minimum: 1,
          maximum: 100,
        }),
      ],
    }),
  },
  '/api/admin/users/{id}/block': {
    patch: operation({
      summary: 'Block a student account',
      tag: 'Administration',
      parameters: [pathId()],
    }),
  },
  '/api/admin/users/{id}/unblock': {
    patch: operation({
      summary: 'Unblock a student account',
      tag: 'Administration',
      parameters: [pathId()],
    }),
  },
  '/api/admin/users/{id}/verify': {
    patch: operation({
      summary: 'Verify a student account',
      tag: 'Administration',
      parameters: [pathId()],
    }),
  },
  '/api/admin/books': {
    get: operation({
      summary: 'Search and paginate book listings',
      tag: 'Administration',
      parameters: [
        queryParam('status', 'Filter listing status.'),
        queryParam('q', 'Search title, author or ISBN.'),
        queryParam('page', 'Page number.', { type: 'integer', minimum: 1 }),
        queryParam('limit', 'Page size, maximum 100.', {
          type: 'integer',
          minimum: 1,
          maximum: 100,
        }),
      ],
    }),
  },
  '/api/admin/books/{id}/approve': {
    patch: operation({
      summary: 'Approve a pending book listing',
      tag: 'Administration',
      parameters: [pathId()],
    }),
  },
  '/api/admin/books/{id}/reject': {
    patch: operation({
      summary: 'Reject a pending book listing',
      tag: 'Administration',
      parameters: [pathId()],
      requestBody: 'BookRejectRequest',
    }),
  },
  '/api/admin/books/{id}': {
    delete: operation({
      summary: 'Delete a listing and its stored images',
      tag: 'Administration',
      parameters: [pathId()],
    }),
  },
  '/api/admin/orders': {
    get: operation({
      summary: 'Search and paginate orders',
      tag: 'Administration',
      parameters: [
        queryParam('status', 'Order status.'),
        queryParam('q', 'Search buyer, seller or book.'),
        queryParam('page', 'Page number.', { type: 'integer', minimum: 1 }),
        queryParam('limit', 'Page size.', {
          type: 'integer',
          minimum: 1,
          maximum: 100,
        }),
      ],
    }),
  },
  '/api/admin/exchanges': {
    get: operation({
      summary: 'Search and paginate exchange requests',
      tag: 'Administration',
      parameters: [
        queryParam('status', 'Request status.'),
        queryParam('q', 'Search participant or book.'),
        queryParam('page', 'Page number.', { type: 'integer', minimum: 1 }),
        queryParam('limit', 'Page size.', {
          type: 'integer',
          minimum: 1,
          maximum: 100,
        }),
      ],
    }),
  },
  '/api/admin/donations': {
    get: operation({
      summary: 'Search and paginate donation requests',
      tag: 'Administration',
      parameters: [
        queryParam('status', 'Request status.'),
        queryParam('q', 'Search participant or book.'),
        queryParam('page', 'Page number.', { type: 'integer', minimum: 1 }),
        queryParam('limit', 'Page size.', {
          type: 'integer',
          minimum: 1,
          maximum: 100,
        }),
      ],
    }),
  },
  '/api/admin/categories': {
    get: operation({ summary: 'List categories', tag: 'Administration' }),
    post: operation({
      summary: 'Create a category',
      tag: 'Administration',
      requestBody: 'CategoryRequest',
      status: '201',
    }),
  },
  '/api/admin/categories/{id}': {
    get: operation({
      summary: 'Get a category',
      tag: 'Administration',
      parameters: [pathId()],
    }),
    put: operation({
      summary: 'Update a category',
      tag: 'Administration',
      parameters: [pathId()],
      requestBody: 'CategoryRequest',
    }),
    patch: operation({
      summary: 'Partially update a category',
      tag: 'Administration',
      parameters: [pathId()],
      requestBody: 'CategoryRequest',
    }),
    delete: operation({
      summary: 'Delete an unused category',
      tag: 'Administration',
      parameters: [pathId()],
    }),
  },
  '/api/admin/universities': {
    get: operation({ summary: 'List universities', tag: 'Administration' }),
    post: operation({
      summary: 'Create a university',
      tag: 'Administration',
      requestBody: 'UniversityRequest',
      status: '201',
    }),
  },
  '/api/admin/universities/{id}': {
    get: operation({
      summary: 'Get a university',
      tag: 'Administration',
      parameters: [pathId()],
    }),
    put: operation({
      summary: 'Update a university',
      tag: 'Administration',
      parameters: [pathId()],
      requestBody: 'UniversityRequest',
    }),
    patch: operation({
      summary: 'Partially update a university',
      tag: 'Administration',
      parameters: [pathId()],
      requestBody: 'UniversityRequest',
    }),
    delete: operation({
      summary: 'Delete an unused university',
      tag: 'Administration',
      parameters: [pathId()],
    }),
  },
  '/api/admin/export/users': {
    get: operation({
      summary: 'Export users as CSV',
      tag: 'Administration',
      contentType: 'text/csv',
      responseExample: undefined,
    }),
  },
  '/api/admin/export/orders': {
    get: operation({
      summary: 'Export orders as CSV',
      tag: 'Administration',
      contentType: 'text/csv',
      responseExample: undefined,
    }),
  },
  '/api/smart/recommendations': {
    get: operation({
      summary: 'Get personalized book recommendations',
      tag: 'Smart features',
      parameters: [
        queryParam('limit', 'Maximum results (1–30).', {
          type: 'integer',
          minimum: 1,
          maximum: 30,
        }),
      ],
    }),
  },
  '/api/smart/trending': {
    get: operation({
      summary: 'Get popular book listings',
      tag: 'Smart features',
      auth: false,
      parameters: [
        queryParam('limit', 'Maximum results (1–30).', {
          type: 'integer',
          minimum: 1,
          maximum: 30,
        }),
      ],
    }),
  },
  '/api/smart/price-suggestion': {
    get: operation({
      summary: 'Suggest a price from similar listings',
      tag: 'Smart features',
      auth: false,
      parameters: [
        queryParam('category', 'Category ObjectId.'),
        queryParam('originalPrice', 'Original retail price.', {
          type: 'number',
          exclusiveMinimum: 0,
        }),
        queryParam('condition', 'Book condition.'),
        queryParam('edition', 'Optional edition.'),
        queryParam('title', 'Optional title.'),
      ],
    }),
  },
  '/api/smart/savings': {
    get: operation({
      summary: 'Get the user’s savings and environmental impact',
      tag: 'Smart features',
    }),
  },
  '/api/smart/platform-impact': {
    get: operation({
      summary: 'Get platform reuse and environmental impact',
      tag: 'Smart features',
      auth: false,
    }),
  },
  '/api/smart/exchange-matches': {
    get: operation({
      summary: 'Find potential exchange matches',
      tag: 'Smart features',
    }),
  },
  '/api/search/recent': {
    get: operation({
      summary: 'Get recent search history',
      tag: 'Search',
      parameters: [],
    }),
    post: operation({
      summary: 'Store a search term',
      tag: 'Search',
      requestBody: 'RecentSearchRequest',
    }),
    delete: operation({
      summary: 'Clear recent search history',
      tag: 'Search',
    }),
  },
};

const definition = {
  openapi: '3.0.3',
  info: {
    title: 'CampusBook API',
    version: '1.0.0',
    description:
      'CampusBook student marketplace API. Authentication uses a JWT stored in an HttpOnly cookie.',
  },
  servers: [{ url: '/', description: 'Current server' }],
  tags: [
    { name: 'System' },
    { name: 'Authentication' },
    { name: 'Users and profile' },
    { name: 'Books' },
    { name: 'Wishlist' },
    { name: 'Cart' },
    { name: 'Orders' },
    { name: 'Exchanges' },
    { name: 'Donations' },
    { name: 'Conversations' },
    { name: 'Notifications' },
    {
      name: 'Administration',
      description: 'All administration endpoints require an admin account.',
    },
    { name: 'Smart features' },
    { name: 'Search' },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'token',
        description: 'JWT auth cookie set by POST /api/auth/login.',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'fail' },
          message: { type: 'string', example: 'Validation error.' },
        },
        required: ['status', 'message'],
      },
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '665a1c2b3d4e5f6789012345' },
          name: { type: 'string', example: 'A Student' },
          email: {
            type: 'string',
            format: 'email',
            example: 'student@university.edu',
          },
          role: { type: 'string', enum: ['student', 'admin'] },
          university: { oneOf: [{ type: 'string' }, { type: 'object' }] },
          avatar: { type: 'string', format: 'uri' },
          isVerified: { type: 'boolean' },
          rating: { type: 'number', minimum: 0, maximum: 5 },
          totalRatings: { type: 'integer', minimum: 0 },
        },
      },
      Book: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          title: { type: 'string' },
          author: { type: 'string' },
          isbn: { type: 'string' },
          category: { oneOf: [{ type: 'string' }, { type: 'object' }] },
          university: { oneOf: [{ type: 'string' }, { type: 'object' }] },
          seller: {
            oneOf: [{ type: 'string' }, { $ref: '#/components/schemas/User' }],
          },
          condition: {
            type: 'string',
            enum: ['New', 'Like New', 'Good', 'Fair', 'Poor'],
          },
          listingType: { type: 'string', enum: ['sell', 'exchange', 'donate'] },
          sellingPrice: { type: 'number', minimum: 0 },
          originalPrice: { type: 'number', minimum: 0 },
          description: { type: 'string' },
          images: { type: 'array', items: { type: 'object' } },
          status: {
            type: 'string',
            enum: [
              'pending',
              'available',
              'approved',
              'reserved',
              'sold',
              'exchanged',
              'donated',
              'rejected',
            ],
          },
        },
      },
      Order: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          orderNumber: { type: 'string' },
          buyer: {
            oneOf: [{ type: 'string' }, { $ref: '#/components/schemas/User' }],
          },
          seller: {
            oneOf: [{ type: 'string' }, { $ref: '#/components/schemas/User' }],
          },
          book: {
            oneOf: [{ type: 'string' }, { $ref: '#/components/schemas/Book' }],
          },
          price: { type: 'number', minimum: 0 },
          status: {
            type: 'string',
            enum: [
              'placed',
              'confirmed',
              'ready_for_pickup',
              'completed',
              'cancelled',
            ],
          },
          meetingLocation: { type: 'string' },
          notes: { type: 'string' },
        },
      },
      RegisterRequest: bodySchema(
        {
          name: { type: 'string', minLength: 2, maxLength: 60 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6, maxLength: 128 },
          universityId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
          department: { type: 'string', maxLength: 100 },
          yearOfStudy: { type: 'integer', minimum: 1, maximum: 7 },
          studentId: { type: 'string', maxLength: 50 },
          phone: { type: 'string', maxLength: 30 },
        },
        ['name', 'email', 'password', 'universityId'],
      ),
      LoginRequest: bodySchema(
        {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
        ['email', 'password'],
      ),
      EmailRequest: bodySchema({ email: { type: 'string', format: 'email' } }, [
        'email',
      ]),
      VerifyOtpRequest: bodySchema(
        {
          email: { type: 'string', format: 'email' },
          otp: { type: 'string', pattern: '^\\d{6}$' },
        },
        ['email', 'otp'],
      ),
      ResetPasswordRequest: bodySchema(
        {
          email: { type: 'string', format: 'email' },
          otp: { type: 'string', pattern: '^\\d{6}$' },
          newPassword: { type: 'string', minLength: 6, maxLength: 128 },
        },
        ['email', 'otp', 'newPassword'],
      ),
      ChangePasswordRequest: bodySchema(
        {
          currentPassword: { type: 'string' },
          newPassword: { type: 'string', minLength: 6, maxLength: 128 },
        },
        ['currentPassword', 'newPassword'],
      ),
      ProfileUpdateRequest: bodySchema({
        name: { type: 'string', minLength: 2, maxLength: 60 },
        phone: { type: 'string', maxLength: 30 },
        university: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
        department: { type: 'string', maxLength: 100 },
        course: { type: 'string', maxLength: 120 },
        semester: { type: 'string', maxLength: 60 },
        bio: { type: 'string', maxLength: 500 },
        avatar: { type: 'string', format: 'uri' },
      }),
      BookCreateRequest: bodySchema(
        {
          title: { type: 'string', minLength: 2, maxLength: 200 },
          author: { type: 'string', minLength: 2, maxLength: 120 },
          isbn: { type: 'string', maxLength: 32 },
          category: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
          condition: {
            type: 'string',
            enum: ['New', 'Like New', 'Good', 'Fair', 'Poor'],
          },
          originalPrice: { type: 'number', minimum: 0 },
          sellingPrice: { type: 'number', minimum: 0 },
          listingType: { type: 'string', enum: ['sell', 'exchange', 'donate'] },
          description: { type: 'string', minLength: 10, maxLength: 2500 },
          university: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
        },
        [
          'title',
          'author',
          'category',
          'condition',
          'originalPrice',
          'sellingPrice',
          'listingType',
          'description',
        ],
      ),
      AvatarUploadRequest: {
        type: 'object',
        properties: { image: { type: 'string', format: 'binary' } },
        required: ['image'],
      },
      BookUpdateRequest: bodySchema({
        title: { type: 'string', minLength: 2, maxLength: 200 },
        author: { type: 'string', minLength: 2, maxLength: 120 },
        condition: {
          type: 'string',
          enum: ['New', 'Like New', 'Good', 'Fair', 'Poor'],
        },
        sellingPrice: { type: 'number', minimum: 0 },
        description: { type: 'string', minLength: 10, maxLength: 2500 },
      }),
      OrderCreateRequest: bodySchema({
        bookId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
        fromCart: { type: 'boolean' },
        meetingLocation: { type: 'string', maxLength: 200 },
        notes: { type: 'string', maxLength: 500 },
      }),
      OrderStatusRequest: bodySchema(
        {
          status: {
            type: 'string',
            enum: ['confirmed', 'completed', 'cancelled'],
          },
        },
        ['status'],
      ),
      RequestStatusUpdate: bodySchema(
        {
          status: {
            type: 'string',
            enum: ['accepted', 'rejected', 'cancelled', 'completed'],
          },
        },
        ['status'],
      ),
      ExchangeRequestCreate: bodySchema(
        {
          requestedBookId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
          offeredBookId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
          message: { type: 'string', maxLength: 1000 },
        },
        ['requestedBookId', 'offeredBookId'],
      ),
      DonationRequestCreate: bodySchema(
        {
          bookId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
          message: { type: 'string', maxLength: 1000 },
        },
        ['bookId'],
      ),
      ConversationCreateRequest: bodySchema(
        {
          userId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
          bookId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
        },
        ['userId'],
      ),
      MessageCreateRequest: bodySchema(
        { text: { type: 'string', minLength: 1, maxLength: 2000 } },
        ['text'],
      ),
      ConversationImageRequest: {
        type: 'object',
        properties: {
          image: { type: 'string', format: 'binary' },
          text: { type: 'string', maxLength: 2000 },
        },
        required: ['image'],
      },
      ReviewRequest: bodySchema(
        {
          orderId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
          rating: { type: 'number', minimum: 1, maximum: 5 },
          comment: { type: 'string', maxLength: 1000 },
        },
        ['orderId', 'rating'],
      ),
      BookRejectRequest: bodySchema({
        reason: { type: 'string', maxLength: 500 },
      }),
      CategoryRequest: bodySchema({
        name: { type: 'string', minLength: 2, maxLength: 80 },
        slug: { type: 'string' },
        description: { type: 'string', maxLength: 300 },
        icon: { type: 'string' },
        isActive: { type: 'boolean' },
      }),
      UniversityRequest: bodySchema({
        name: { type: 'string', minLength: 2, maxLength: 150 },
        code: { type: 'string', maxLength: 20 },
        domain: { type: 'string' },
        city: { type: 'string' },
        state: { type: 'string' },
        country: { type: 'string' },
        campuses: { type: 'array', items: { type: 'string' } },
      }),
      RecentSearchRequest: bodySchema(
        { term: { type: 'string', minLength: 1, maxLength: 120 } },
        ['term'],
      ),
    },
  },
};

const specification = swaggerJsdoc({ definition, apis: [] });
specification.paths = paths;

export default specification;
