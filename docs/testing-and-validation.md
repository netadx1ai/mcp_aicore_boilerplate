# Testing and Validation Strategy

A robust testing and validation strategy is critical to maintaining the quality,
reliability, and maintainability of the **MCP AIVA API v5** project. This
document outlines the tools, structure, and procedures for testing your code
before it is integrated, with special focus on the Currency Consumption API
and production-ready features.

---

## 1. Testing Framework

The project uses a modern and widely-adopted testing stack for TypeScript
applications with production API validation:

- **Test Runner**: [Jest](https://jestjs.io/) is used as the primary testing
  framework for its speed, powerful mocking capabilities, and all-in-one nature.
- **TypeScript Integration**: `ts-jest` is a preprocessor that allows Jest to
  run tests written in TypeScript directly, without a separate compilation step.
- **Assertion Library**: We use Jest's built-in `expect` library for writing
  clear and expressive assertions.
- **API Testing**: Production API endpoint validation using real HTTP requests
- **Currency Testing**: Comprehensive transaction and rollback testing
- **Integration Testing**: Database and external service integration validation

---

## 2. How to Run Tests

All test commands are conveniently available as `npm` scripts in the
`package.json` file.

- **Run the Full Test Suite:** To execute every test in the project once, run:

  ```bash
  npm test
  ```

- **Run in Watch Mode:** For an interactive development experience, watch mode
  automatically re-runs tests related to files you've changed since the last
  commit.

  ```bash
  npm test -- --watch
  ```

- **Generate a Coverage Report:** To check how much of your code is covered by
  tests, run the following command. A detailed report will be generated in the
  `coverage/` directory.
  ```bash
  npm test -- --coverage
  ```

---

## 3. Currency Consumption API Testing

The Currency Consumption API requires comprehensive testing due to its financial transaction nature.

### 3.1 Test Environment Setup

```bash
# Load test credentials
TOKEN=$(cat /path/to/mcp_aiva_api_v5/test.token)
export TEST_TOKEN=$TOKEN
export TEST_USER_ID="6720653e91e34fe012957dd0"
export API_BASE_URL="http://api_v5.ainext.vn/tools/currency_consumption"
```

### 3.2 Manual API Testing

**Balance Check Test:**
```bash
curl -X POST -H "x-access-token: $TEST_TOKEN" -H "Content-Type: application/json" \
  -d '{"action":"check_balance","userId":"'$TEST_USER_ID'"}' \
  $API_BASE_URL
```

**Currency Consumption Test:**
```bash
curl -X POST -H "x-access-token: $TEST_TOKEN" -H "Content-Type: application/json" \
  -d '{"action":"consume_currency","userId":"'$TEST_USER_ID'","modelCode":"gemini-2.5-flash"}' \
  $API_BASE_URL
```

**Payment Options Test:**
```bash
curl -X POST -H "x-access-token: $TEST_TOKEN" -H "Content-Type: application/json" \
  -d '{"action":"get_payment_options","userId":"'$TEST_USER_ID'","modelCode":"gemini-2.5-flash-image"}' \
  $API_BASE_URL
```

**Transaction Rollback Test:**
```bash
# First consume, then rollback
TRANSACTION_ID=$(curl -s -X POST -H "x-access-token: $TEST_TOKEN" -H "Content-Type: application/json" \
  -d '{"action":"consume_currency","userId":"'$TEST_USER_ID'","modelCode":"gemini-2.5-flash-image"}' \
  $API_BASE_URL | jq -r '.data.result.transactionId')

curl -X POST -H "x-access-token: $TEST_TOKEN" -H "Content-Type: application/json" \
  -d '{"action":"rollback_transaction","transactionId":"'$TRANSACTION_ID'","userId":"'$TEST_USER_ID'"}' \
  $API_BASE_URL
```

### 3.3 Automated Test Suite

```typescript
// tests/currency-consumption.test.ts
describe('Currency Consumption API', () => {
  const userId = '6720653e91e34fe012957dd0';
  const token = process.env.TEST_TOKEN;
  
  test('should check user balance successfully', async () => {
    const response = await request(app)
      .post('/tools/currency_consumption')
      .set('x-access-token', token)
      .send({
        action: 'check_balance',
        userId
      });
      
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.result).toHaveProperty('diamonds');
    expect(response.body.data.result).toHaveProperty('tier');
  });

  test('should consume currency and allow rollback', async () => {
    // Consume currency
    const consumeResponse = await request(app)
      .post('/tools/currency_consumption')
      .set('x-access-token', token)
      .send({
        action: 'consume_currency',
        userId,
        modelCode: 'gemini-2.5-flash'
      });
      
    expect(consumeResponse.body.success).toBe(true);
    const transactionId = consumeResponse.body.data.result.transactionId;
    
    // Rollback transaction
    const rollbackResponse = await request(app)
      .post('/tools/currency_consumption')
      .set('x-access-token', token)
      .send({
        action: 'rollback_transaction',
        transactionId,
        userId
      });
      
    expect(rollbackResponse.body.success).toBe(true);
    expect(rollbackResponse.body.data.result.transactionId).toBe(transactionId);
  });

  test('should handle model code variations', async () => {
    const modelCodes = [
      'gemini-2.5-flash',
      'gemini/gemini-2.5-flash',
      'gemini-2.5-flash-image'
    ];
    
    for (const modelCode of modelCodes) {
      const response = await request(app)
        .post('/tools/currency_consumption')
        .set('x-access-token', token)
        .send({
          action: 'get_payment_options',
          userId,
          modelCode
        });
        
      expect(response.body.success).toBe(true);
      expect(response.body.data.result.paymentOptions).toBeInstanceOf(Array);
    }
  });
});
```

### 3.4 Database Validation Tests

```bash
# Verify transaction was saved
./ssh-104.sh "mongo aivaweb --eval 'db.currency_transactions.find({transactionId: NumberLong(\"$TRANSACTION_ID\")}).pretty()'"

# Verify model rules exist
./ssh-104.sh "mongo aivaweb --eval 'db.models_consume_rules.find({status: \"Active\"}).count()'"

# Check recent transactions
./ssh-104.sh "mongo aivaweb --eval 'db.currency_transactions.find().sort({timestamp: -1}).limit(5).pretty()'"
```

## 4. Production Testing Checklist

### 4.1 Pre-Deployment Testing

- [ ] Unit tests pass for all currency operations
- [ ] Integration tests validate database transactions
- [ ] API endpoint tests confirm correct responses
- [ ] Model code resolution tests for all 3 database fields
- [ ] Transaction ID consistency tests
- [ ] Rollback functionality tests
- [ ] Error handling tests for edge cases

### 4.2 Post-Deployment Validation

```bash
# Service health check
curl http://api_v5.ainext.vn/health

# API availability check
curl -X POST -H "x-access-token: $TOKEN" -H "Content-Type: application/json" \
  -d '{"action":"check_balance","userId":"test_user"}' \
  http://api_v5.ainext.vn/tools/currency_consumption

# Database connectivity check
./operations/mcp-api-v5/deploy.sh status
```

### 4.3 Load Testing

```bash
# Concurrent transaction test
for i in {1..10}; do
  curl -X POST -H "x-access-token: $TOKEN" -H "Content-Type: application/json" \
    -d '{"action":"consume_currency","userId":"'$TEST_USER_ID'","modelCode":"gemini-2.5-flash"}' \
    $API_BASE_URL &
done
wait
```

## 5. Test Data Management

### 5.1 Test User Setup

```javascript
// Test user configuration
const testUsers = {
  vip: "6720653e91e34fe012957dd0",    // VIP user with credits
  normal: "user_normal_123",           // Standard user
  free: "user_free_456"               // Free tier user
};

const testModels = {
  free: "gemini-2.5-flash",           // 0 cost for VIP
  diamond: "gemini-2.5-flash-image",  // 1 diamond cost
  credit: "gpt-4",                    // Credit-based model
  vipOnly: "premium-model"            // VIP-only access
};
```

### 5.2 Mock Data for Testing

```typescript
const mockTransactionResponse = {
  success: true,
  data: {
    action: 'consume_currency',
    result: {
      success: true,
      transactionId: '1761662306709',
      currencyUsed: 'Diamond',
      amountUsed: 1,
      remainingBalance: {
        userId: '6720653e91e34fe012957dd0',
        diamonds: 3197.5,
        creditNormal: 0,
        creditVip: 50,
        freeCalls: 10,
        tier: 'VIP'
      }
    }
  }
};
```

## 6. Continuous Integration Testing

### 6.1 GitHub Actions Workflow

```yaml
name: Currency API Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run unit tests
        run: npm test
      - name: Run API integration tests
        run: npm run test:integration
        env:
          TEST_TOKEN: ${{ secrets.TEST_TOKEN }}
          API_BASE_URL: ${{ secrets.API_BASE_URL }}
```

---

## 3. Test Structure and Organization

The `tests/` directory is a mirror of the `src/` directory. This co-location
makes it easy to find the tests corresponding to a specific source file.

- **`tests/core/`**: Contains **unit tests** for the fundamental building blocks
  of the MCP architecture, such as the `McpServer` itself. These tests focus on
  a single class or module in isolation.

- **`tests/tools/`**: Contains **unit tests** for individual `McpTool`
  implementations. Each tool should have its own test file (e.g.,
  `EchoTool.test.ts`).

- **`tests/integration/`**: Contains **integration tests** that verify the
  collaboration between multiple components. For example, an integration test
  might spin up an `McpServer`, attach a real `ExpressTransport` and several
  tools, and then make HTTP requests to ensure the entire stack works together
  correctly.

---

## 4. Writing Tests

When adding a new feature or fixing a bug, you should accompany your code with
corresponding tests.

### Example: Unit Test for `EchoTool`

Here is a simplified example of what a unit test for a tool might look like in
`tests/tools/EchoTool.test.ts`:

```typescript
import { EchoTool } from '../../src/tools/EchoTool';

describe('EchoTool', () => {
  let echoTool: EchoTool;

  // Set up a new instance before each test
  beforeEach(() => {
    echoTool = new EchoTool();
  });

  it('should have the correct name', () => {
    expect(echoTool.name).toBe('echo');
  });

  it('should return the same message for the "reply" command', async () => {
    const params = { message: 'Hello, World!' };
    const response = await echoTool.execute('reply', params, {});

    expect(response.success).toBe(true);
    expect(response.data).toBe(params.message);
  });

  it('should return an error for an unknown command', async () => {
    const response = await echoTool.execute('unknownCommand', {}, {});

    expect(response.success).toBe(false);
    expect(response.error).toBe('Unknown command');
  });
});
```

---

## 5. Manual End-to-End Validation

Automated tests are essential, but they are not a substitute for real-world
validation. Before a feature is considered "done," it must be proven to work by
running the application and interacting with it.

1.  **Start the development server:**

    ```bash
    npm run dev -- --server=express-basic
    ```

2.  **Use a client to interact with the API.** For a RESTful API, `curl` is an
    excellent tool. Open a new terminal and send a request to your running
    server.

    **Example `curl` command:**

    ```bash
    curl -X POST http://localhost:3000/api/echo/reply \
         -H "Content-Type: application/json" \
         -d '{"message": "hello from curl"}'
    ```

3.  **Verify the output.** You should receive the expected response from the
    server:
    ```json
    {
      "success": true,
      "data": "hello from curl"
    }
    ```
    Confirming this round-trip behavior is the final proof that your changes
    work as intended.

---

## 6. Pre-Commit Quality Checks

To ensure that only high-quality, consistent code is committed to the
repository, always run the following checks locally before pushing your changes:

1.  **Format Code**: `npm run format`
2.  **Lint Code**: `npm run lint`
3.  **Run All Tests**: `npm test`

Automating these checks in a pre-commit hook is highly recommended.
