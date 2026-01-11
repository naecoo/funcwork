# AGENTS.md - Coding Guidelines for FuncWork

## Overview
This document provides coding guidelines and commands for the FuncWork project, a TypeScript library for running pure functions in Web Workers.

## Build, Lint, and Test Commands

### Building
```bash
# Build all output formats (CJS, ESM, IIFE) to dist/
npm run build
```

### Linting
```bash
# Check code style and linting issues
npm run lint

# Auto-fix linting issues where possible
npm run lint:fix
```

### Testing
**Note:** This project currently has no test suite configured. When adding tests:

1. Install a testing framework like Jest or Vitest
2. Add test scripts to `package.json`
3. Create test files in a `tests/` or `__tests__/` directory
4. Run tests with `npm test`

For running a single test (once configured):
```bash
# Example for Jest/Vitest (configure based on chosen framework)
npm test -- path/to/test/file.test.ts
```

## Code Style Guidelines

### Language and Configuration
- **TypeScript**: Strict mode enabled (`"strict": true`)
- **Target**: ES2015 for browser compatibility
- **Module system**: ESNext modules
- **Linting**: ESLint with `@antfu/eslint-config`
- **Build tool**: esbuild for fast compilation and bundling

### Imports and Dependencies
- Use ES6 import syntax
- Import types and values from the same module in one statement
- Group imports: external libraries first, then internal modules
- Use relative imports for internal modules (`./utils`, `./worker`)

```typescript
// Good
import { isFunction, uuid } from './utils'

// Avoid
import * as utils from './utils'
```

### TypeScript Types and Interfaces
- Use interfaces for object shapes
- Use type aliases for unions and primitives
- Prefer explicit typing over `any` (use `unknown` when necessary)
- Use utility types where appropriate

```typescript
// Good
type MessageType = 'add' | 'remove' | 'clear' | 'invoke'

interface Message {
  type: MessageType
  name?: string
  code?: string
  id?: string
  params?: unknown
}

// Avoid
interface Message {
  type: string
  name?: any
  // ...
}
```

### Naming Conventions
- **Variables/Functions**: camelCase
- **Classes/Interfaces/Types**: PascalCase
- **Constants**: UPPER_SNAKE_CASE (if any)
- **Private methods**: Use `#` prefix for true privacy, `private` keyword for TypeScript privacy
- **File names**: kebab-case for multiple words, descriptive names

```typescript
// Good
class FuncWork {
  private worker: Worker
  private scriptUrl: string

  private genCodeString(method: Function): string {
    // ...
  }
}
```

### Error Handling
- Throw descriptive Error objects for critical failures
- Use `console.warn()` for non-critical issues that don't stop execution
- Handle async errors with proper Promise rejection
- Validate inputs early in methods

```typescript
// Good
constructor(options?: WorkerOptions) {
  if (!window) {
    throw new Error('Detected not in browser environment.')
  }
  // ... other validations
}

add(...methods: Function[]): this {
  methods.forEach((method, index) => {
    if (!isFunction(method)) {
      console.warn(`Registration failed, methods[${index}] is not a Function type.`)
      return
    }
    // ... rest of validation
  })
  return this
}
```

### Code Structure and Patterns
- **Class organization**: Constructor first, then public methods, then private methods
- **Method chaining**: Return `this` for fluent interfaces where appropriate
- **Early returns**: Use guard clauses to reduce nesting
- **Pure functions**: Prefer pure functions when possible
- **Environment checks**: Validate browser API support in constructors

```typescript
// Good structure
export class FuncWork {
  // Properties first
  private worker: Worker
  private scriptUrl: string

  // Constructor with validation
  constructor(options?: WorkerOptions) {
    // Environment checks...
  }

  // Public API methods
  add(...methods: Function[]): this {
    // Implementation...
    return this
  }

  // Private utility methods
  private genCodeString(method: Function): string {
    // Implementation...
  }
}
```

### Async/Await vs Promises
- Use async/await for new code when appropriate
- Maintain Promise-based APIs for backward compatibility
- Handle both synchronous and asynchronous function results

```typescript
// Current pattern (Promise-based)
invoke(name: string | Function, params?: any[]): Promise<any> {
  // ... validation
  return new Promise((resolve, reject) => {
    // Implementation...
  })
}
```

### Web Worker Specific Patterns
- Use JSON.stringify/parse for message passing
- Generate unique IDs for request/response correlation
- Properly clean up workers and blob URLs
- Handle both success and error cases in worker communication

### Formatting and Style
- **Indentation**: 2 spaces (ESLint configured)
- **Line length**: Follow ESLint rules (typically 80-100 characters)
- **Semicolons**: Required
- **Quotes**: Single quotes for strings, double for JSX (if any)
- **Trailing commas**: Use in multi-line structures

### File Organization
- **Source files**: `src/` directory
- **Entry point**: `src/index.ts`
- **Utilities**: `src/utils.ts`
- **Worker code**: `src/worker.ts`
- **Build output**: `dist/` directory
- **Configuration**: Root level (tsconfig.json, .eslintrc, etc.)

### Security Considerations
- Avoid `eval()` in main thread (acceptable in worker for this use case)
- Validate function names and parameters
- Don't expose sensitive data through worker messages
- Clean up resources properly (`destroy()` method)

### Browser Compatibility
- Target modern browsers with Web Worker support
- Check for required APIs in constructor
- Provide clear error messages for unsupported environments

### Documentation
- Use JSDoc comments for public APIs
- Keep README updated with usage examples
- Document breaking changes in release notes

### Git Workflow
- **Commits**: Use conventional commit format when possible
- **Branches**: Feature branches for new functionality
- **PRs**: Include description of changes and testing done
- **Ignore patterns**: node_modules, dist/, bin/

### Performance Considerations
- Minimize message passing overhead
- Bundle worker code efficiently
- Use appropriate minification for production builds
- Consider lazy loading if library grows

### Future Improvements
- Add comprehensive test suite
- Consider adding TypeScript declaration maps
- Add CI/CD pipeline for automated testing
- Add code coverage reporting

---

This document should be updated as the project evolves. When making changes that affect coding standards or build processes, update this file accordingly.</content>
<parameter name="filePath">/Users/oceanpeng/Desktop/code/github/funcwork/AGENTS.md